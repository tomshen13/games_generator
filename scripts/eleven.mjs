// Small ElevenLabs helper for scripts (reads ELEVENLABS_API_KEY from .env.local).
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const env = fs.readFileSync(path.join(ROOT, '.env.local'), 'utf8');
const KEY = env.match(/ELEVENLABS_API_KEY=["']?([^"'\r\n]+)/)[1];
const API = 'https://api.elevenlabs.io/v1';

export async function tts(text, { voiceId, modelId = 'eleven_v3', stability = 0.5 }) {
  const res = await fetch(`${API}/text-to-speech/${voiceId}?output_format=mp3_44100_64`, {
    method: 'POST',
    headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, model_id: modelId, language_code: 'he', voice_settings: { stability, similarity_boost: 0.75 } }),
  });
  if (!res.ok) throw new Error(`TTS ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return Buffer.from(await res.arrayBuffer());
}

export async function transcribe(mp3) {
  const form = new FormData();
  form.append('model_id', 'scribe_v1');
  form.append('language_code', 'he');
  form.append('file', new Blob([mp3], { type: 'audio/mpeg' }), 'clip.mp3');
  const res = await fetch(`${API}/speech-to-text`, { method: 'POST', headers: { 'xi-api-key': KEY }, body: form });
  if (!res.ok) throw new Error(`STT ${res.status}: ${(await res.text()).slice(0, 300)}`);
  return (await res.json()).text;
}
