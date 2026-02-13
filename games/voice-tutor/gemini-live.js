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
   * @returns {Promise<{sendAudio: function, close: function, reconnect: function}>}
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
        ws.send(JSON.stringify({
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
            }
          }
        }));
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
