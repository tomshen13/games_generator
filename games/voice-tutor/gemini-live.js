/**
 * GeminiLive — IIFE module wrapping the Gemini Live API (BidiGenerateContent) WebSocket.
 *
 * Usage:
 *   const session = await GeminiLive.connect({ systemPrompt, onAudio, onTurnStart, onTurnEnd, onInterrupted, onError });
 *   session.sendAudio(base64PCM);
 *   session.close();
 */
const GeminiLive = (() => {
  // TODO: Move API key to Supabase Edge Function for production
  const API_KEY = 'AIzaSyA_lgf76fwtXxm0ubStGk_nb9EEl2leaeA';
  const MODEL = 'models/gemini-2.5-flash-native-audio-preview-12-2025';
  const WS_URL = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;

  const MAX_RETRIES = 3;
  const RETRY_BASE_MS = 1000;

  /**
   * Connect to Gemini Live API.
   * @param {Object} opts
   * @param {string} opts.systemPrompt - System instruction text
   * @param {function(string): void} opts.onAudio - Called with base64 PCM audio chunks (24kHz 16-bit)
   * @param {function(): void} opts.onTurnStart - Model started speaking
   * @param {function(): void} opts.onTurnEnd - Model finished speaking
   * @param {function(): void} opts.onInterrupted - User interrupted the model
   * @param {function(string): void} opts.onError - Error message
   * @param {function(): void} opts.onConnected - Setup complete, ready to talk
   * @param {function(Object): void} [opts.onAssessment] - Called with session_assessment function args
   * @returns {Promise<{sendAudio: function, close: function, reconnect: function, sendText: function, requestAssessment: function}>}
   */
  async function connect(opts) {
    let ws = null;
    let retries = 0;
    let closed = false;
    let setupResolved = false;

    function openSocket(resolve, reject) {
      ws = new WebSocket(WS_URL);

      ws.onopen = () => {
        // Send setup message
        const setupMsg = {
          setup: {
            model: MODEL,
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: 'Kore' }
                }
              },
              thinkingConfig: {
                thinkingBudget: 0
              }
            },
            systemInstruction: {
              parts: [{ text: opts.systemPrompt }]
            },
            realtimeInputConfig: {
              automaticActivityDetection: {
                startOfSpeechSensitivity: 'START_SENSITIVITY_LOW',
                endOfSpeechSensitivity: 'END_SENSITIVITY_HIGH',
                prefixPaddingMs: 100,
                silenceDurationMs: 200
              }
            },
            tools: [{
              functionDeclarations: [{
                name: 'session_assessment',
                description: 'Report the student performance assessment at session end. Call this when asked to assess the session.',
                parameters: {
                  type: 'object',
                  properties: {
                    skills: {
                      type: 'array',
                      description: 'Assessment of each skill practiced',
                      items: {
                        type: 'object',
                        properties: {
                          skill: { type: 'string', description: 'Skill key: phonemes, nouns, verbs, adjectives, phrases, pronunciation, my-self, qa, description, dialogue' },
                          rating: { type: 'integer', description: '1-5 rating (1=struggling, 3=okay, 5=excellent)' },
                          note: { type: 'string', description: 'Brief observation about the child performance on this skill' }
                        },
                        required: ['skill', 'rating', 'note']
                      }
                    },
                    summary: { type: 'string', description: 'One sentence overall assessment of the session' }
                  },
                  required: ['skills', 'summary']
                }
              }]
            }]
          }
        };
        ws.send(JSON.stringify(setupMsg));
      };

      ws.onmessage = async (event) => {
        let msg;
        try {
          const text = event.data instanceof Blob
            ? await event.data.text()
            : event.data;
          msg = JSON.parse(text);
        } catch (e) {
          console.warn('[GeminiLive] Failed to parse message:', e);
          return;
        }

        // Setup complete
        if (msg.setupComplete) {
          setupResolved = true;
          retries = 0;
          if (opts.onConnected) opts.onConnected();
          if (resolve) resolve(session);
          return;
        }

        // Tool call from model (function calling)
        if (msg.toolCall) {
          console.log('[GeminiLive] Tool call received:', msg.toolCall);
          for (const fc of msg.toolCall.functionCalls) {
            if (fc.name === 'session_assessment' && opts.onAssessment) {
              opts.onAssessment(fc.args);
            }
          }
          // Send tool response to acknowledge
          session.sendToolResponse(msg.toolCall.functionCalls);
        }

        // Server content (audio from model)
        if (msg.serverContent) {
          const sc = msg.serverContent;

          // Model is speaking — extract audio
          if (sc.modelTurn && sc.modelTurn.parts) {
            for (const part of sc.modelTurn.parts) {
              if (part.inlineData && part.inlineData.data) {
                opts.onAudio(part.inlineData.data);
              }
            }
          }

          // Turn complete
          if (sc.turnComplete) {
            if (opts.onTurnEnd) opts.onTurnEnd();
          }

          // Interrupted
          if (sc.interrupted) {
            if (opts.onInterrupted) opts.onInterrupted();
          }
        }
      };

      ws.onerror = () => {
        // Error handled in onclose
      };

      ws.onclose = () => {
        if (closed) return;

        if (!setupResolved) {
          // Never completed setup — retry or fail
          if (retries < MAX_RETRIES) {
            retries++;
            const delay = RETRY_BASE_MS * Math.pow(2, retries - 1);
            setTimeout(() => openSocket(resolve, reject), delay);
          } else {
            if (reject) reject(new Error('Failed to connect after retries'));
            if (opts.onError) opts.onError('connection_failed');
          }
        } else {
          // Mid-session disconnect — try one reconnect
          if (opts.onError) opts.onError('disconnected');
        }
      };
    }

    const session = {
      /** Send base64-encoded 16kHz 16-bit PCM audio */
      sendAudio(base64Data) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            realtimeInput: {
              mediaChunks: [{
                mimeType: 'audio/pcm;rate=16000',
                data: base64Data
              }]
            }
          }));
        }
      },

      /** Send a text message (used for nudges / system hints) */
      sendText(text) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          console.log('[GeminiLive] Sending text:', text);
          ws.send(JSON.stringify({
            clientContent: {
              turns: [{ role: 'user', parts: [{ text }] }],
              turnComplete: true
            }
          }));
        } else {
          console.warn('[GeminiLive] sendText failed — ws not open');
        }
      },

      /** Send tool response to acknowledge a function call */
      sendToolResponse(functionCalls) {
        if (ws && ws.readyState === WebSocket.OPEN) {
          const response = {
            toolResponse: {
              functionResponses: functionCalls.map(fc => ({
                id: fc.id,
                name: fc.name,
                response: { result: 'ok' }
              }))
            }
          };
          console.log('[GeminiLive] Sending tool response');
          ws.send(JSON.stringify(response));
        }
      },

      /** Request session assessment (call at session end) */
      requestAssessment(skillKeys) {
        const skillList = skillKeys.join(', ');
        session.sendText(
          `[SYSTEM: The session is ending now. First, say a warm, short goodbye to the student and praise their effort. ` +
          `Then call the session_assessment function with your honest evaluation. ` +
          `Rate these skills if they were practiced: ${skillList}. ` +
          `Rate 1-5 (1=struggling, 3=okay, 5=excellent). Only include skills that were actually practiced in this session.]`
        );
      },

      /** Gracefully close the connection */
      close() {
        closed = true;
        if (ws) {
          ws.close();
          ws = null;
        }
      },

      /** Attempt to reconnect (e.g. after mid-session disconnect) */
      reconnect() {
        if (ws) {
          ws.close();
          ws = null;
        }
        setupResolved = false;
        retries = 0;
        return new Promise((resolve, reject) => {
          openSocket(resolve, reject);
        });
      }
    };

    return new Promise((resolve, reject) => {
      openSocket(resolve, reject);
    });
  }

  return { connect };
})();
