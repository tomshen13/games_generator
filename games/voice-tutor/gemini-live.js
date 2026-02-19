/**
 * GeminiLive — IIFE module wrapping the Gemini Live API (BidiGenerateContent) WebSocket.
 *
 * Usage:
 *   const session = await GeminiLive.connect({ systemPrompt, onAudio, onTurnStart, onTurnEnd, onInterrupted, onError });
 *   session.sendAudio(base64PCM);
 *   session.close();
 */
const GeminiLive = (() => {
  const MODEL = 'models/gemini-live-2.5-flash-native-audio';
  const WS_BASE = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

  // Fetch API key from Supabase Edge Function (falls back to hardcoded for local dev)
  const SUPABASE_URL = 'https://xanesbzvzhjqndkskvnh.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhbmVzYnp2emhqcW5ka3Nrdm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODA5NDcsImV4cCI6MjA4NjU1Njk0N30.uoNz0Wm-832jeIyRYu-NlJUHvgkE89bU_tHtXD4skfs';
  const KEY_ENDPOINT = `${SUPABASE_URL}/functions/v1/gemini-key`;
  const FALLBACK_KEY = 'AIzaSyA_lgf76fwtXxm0ubStGk_nb9EEl2leaeA'; // local dev only

  async function fetchApiKey() {
    try {
      const res = await fetch(KEY_ENDPOINT, {
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      return data.key;
    } catch (e) {
      console.warn('[GeminiLive] Edge function unavailable, using fallback key:', e.message);
      return FALLBACK_KEY;
    }
  }

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
    const apiKey = await fetchApiKey();
    const wsUrl = `${WS_BASE}?key=${apiKey}`;

    let ws = null;
    let retries = 0;
    let closed = false;
    let setupResolved = false;

    function openSocket(resolve, reject) {
      ws = new WebSocket(wsUrl);

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
                    summary: { type: 'string', description: 'One sentence overall assessment of the session' },
                    studentDetails: { type: 'string', description: 'Key personal facts and preferences the student shared (e.g. "Favorite Pokemon is Pikachu, likes fire types, knows colors red/blue/yellow, sister named Noa"). Include words/phrases they mastered and ones they struggled with.' }
                  },
                  required: ['skills', 'summary', 'studentDetails']
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

      ws.onerror = (event) => {
        console.error('[GeminiLive] WS error:', event);
      };

      ws.onclose = (event) => {
        console.warn(`[GeminiLive] WS closed: code=${event.code} reason="${event.reason}"`);
        if (closed) return;

        if (!setupResolved) {
          // Never completed setup — retry or fail
          if (retries < MAX_RETRIES) {
            retries++;
            const delay = RETRY_BASE_MS * Math.pow(2, retries - 1);
            console.log(`[GeminiLive] Retry ${retries}/${MAX_RETRIES} in ${delay}ms`);
            setTimeout(() => openSocket(resolve, reject), delay);
          } else {
            if (reject) reject(new Error(`Connection failed: code=${event.code} reason="${event.reason}"`));
            if (opts.onError) opts.onError('connection_failed', event.code, event.reason);
          }
        } else {
          // Mid-session disconnect — try one reconnect
          if (opts.onError) opts.onError('disconnected', event.code, event.reason);
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
          `Rate 1-5 (1=struggling, 3=okay, 5=excellent). Only include skills that were actually practiced in this session. ` +
          `IMPORTANT: In studentDetails, note everything personal the child shared — favorite characters, pets, family members, ` +
          `interests, preferences, specific words they learned or struggled with. These details will be used in future sessions.]`
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
