/**
 * Voice Tutor — Main game logic
 * Handles: screen management, audio pipeline (capture + playback), timer, system prompt builder
 */
(() => {
  // ===== DOM REFS =====
  const $ = (sel) => document.querySelector(sel);
  const $$ = (sel) => document.querySelectorAll(sel);

  const screens = {
    welcome:      $('.welcome-screen'),
    setup:        $('.setup-screen'),
    connecting:   $('.connecting-screen'),
    conversation: $('.conversation-screen'),
    complete:     $('.complete-screen'),
  };

  const els = {
    // Welcome
    startBtn:       $('.start-btn'),
    // Setup
    setupBackBtn:   $('.setup-back-btn'),
    focusCards:      $$('.focus-card'),
    themeSelector:  $('.theme-selector'),
    themeChips:     $$('.theme-chips .chip'),
    topicSelector:  $('.topic-selector'),
    topicChips:     $$('.topic-chips .chip'),
    durationPicker: $('.duration-picker'),
    durationChips:  $$('.duration-chip'),
    beginBtn:       $('.begin-btn'),
    // Connecting
    connectSpinner:   $('.connecting-spinner'),
    connectText:      $('.connecting-text'),
    connectSubtext:   $('.connecting-subtext'),
    micDenied:        $('.mic-denied'),
    retryMicBtn:      $('.retry-mic-btn'),
    connectError:     $('.connect-error'),
    retryConnectBtn:  $('.retry-connect-btn'),
    homeBtn:          $('.home-btn'),
    // Conversation
    endSessionBtn:  $('.end-session-btn'),
    timer:          $('.timer'),
    muteBtn:        $('.mute-btn'),
    tutorAvatar:    $('.tutor-avatar'),
    tutorStatus:    $('.tutor-status'),
    promptText:     $('.prompt-text'),
    micIndicator:   $('.mic-indicator'),
    micStatus:      $('.mic-status'),
    // Complete
    durationStat:   $('.session-duration-stat'),
    focusStat:      $('.session-focus-stat'),
    playAgainBtn:   $('.play-again-btn'),
    homeBtnComplete:$('.home-btn-complete'),
    // Shared
    particleCanvas: $('.particle-canvas'),
  };

  // ===== STATE =====
  let selectedFocus = null;
  let selectedTheme = null;
  let selectedTopic = null;
  let selectedDuration = 10; // minutes
  let session = null;        // GeminiLive session
  let timerInterval = null;
  let timerSeconds = 0;
  let isMuted = false;
  let sessionStartTime = null;

  // Audio pipeline state
  let audioCtx = null;
  let micStream = null;
  let workletNode = null;
  let sendInterval = null;
  let pcmBuffer = [];

  // Playback state
  let playbackCtx = null;
  let playbackQueue = [];
  let playbackTime = 0;
  let isModelSpeaking = false;

  // Silence detection for "Thinking..." state
  let hadAudioData = false;
  let silenceSince = 0;
  let isThinking = false;

  // Nudge timer — re-engage if child is silent too long
  const NUDGE_DELAY_MS = 4000;
  let nudgeTimer = null;

  // ===== SCREEN MANAGEMENT =====
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // ===== SYSTEM PROMPT BUILDER =====
  function buildSystemPrompt() {
    const base = `You are a warm, patient, and encouraging female English tutor for young children. Your name is Luna.

STUDENT PROFILE:
- Age: 6-7 years old
- Native language: Hebrew
- English level: Beginner
- The student may mix Hebrew and English words — this is okay and expected

YOUR PERSONALITY:
- Speak slowly and clearly
- Use simple English: 5-8 word sentences maximum
- Be very encouraging — celebrate EVERY attempt, even imperfect ones
- Use a warm, friendly tone — like a favorite teacher
- Say things like "Great job!", "Wow, very good!", "You're so smart!"
- If the child is shy or silent, gently encourage them: "It's okay, try saying it with me!"
- Never correct harshly — model the right way naturally

RULES:
- Keep your responses short: 1-3 sentences maximum
- Always wait for the child to respond before continuing
- If there's silence for a while, gently prompt: "Can you try?" or "Say it with me!"
- Start the session with a warm, excited greeting
- NEVER end the session yourself. Never say goodbye or wrap up on your own. The session timer will handle ending — just keep teaching and engaging until then.
- If the child says "bye", "I want to stop", or tries to end the lesson, gently redirect them: "Wait, I have something fun! Let's try one more thing!" or "Before we finish, can you say [word] for me?"
- If the child insists a second time that they want to stop, say a quick warm goodbye and praise their effort.`;

    let focusInstructions = '';

    switch (selectedFocus) {
      case 'vocabulary': {
        const themeWords = {
          nouns: 'bag, pen, desk, book, chair, table, pencil, ruler, eraser, board, door, window, teacher, school, paper, color, clock, cup, plate, ball',
          verbs: 'jump, sit, clap, stand, run, walk, open, close, draw, write, read, eat, drink, sleep, sing, dance, stop, go, give, take',
          adjectives: 'big, small, red, blue, green, yellow, tall, short, happy, sad, hot, cold, fast, slow, old, new, long, round, soft, hard',
          phrases: 'good morning, good night, how are you, thank you, please, sit down, stand up, open the book, close the door, come here, look at me, well done, my name is, I like, I want',
        };
        const themeLabels = { nouns: 'Classroom Objects', verbs: 'Actions (TPR)', adjectives: 'Colors & Sizes', phrases: 'Set Phrases' };
        const words = themeWords[selectedTheme] || themeWords.nouns;
        const label = themeLabels[selectedTheme] || 'Classroom Objects';
        focusInstructions = `
FOCUS: VOCABULARY — Theme: ${label}
Words/phrases to teach: ${words}

GOAL: The child should be able to identify and say these words/phrases when prompted.

METHOD:
1. Introduce one word at a time: "Let's learn a new word! Listen: [word]"
2. Ask the child to repeat: "Can you say [word]?"
3. Praise their attempt enthusiastically
4. Use the word in a very simple sentence: "The [word] is on the table!"
5. Ask them to try the sentence
6. After 2-3 words, do a quick fun review: "Point to the [word]! What is this?"
7. Move to the next word
${selectedTheme === 'verbs' ? '\nFor actions: demonstrate with voice! "Jump! Can you jump? Jump jump jump!"' : ''}
${selectedTheme === 'phrases' ? '\nFor phrases: use them in mini role-plays. "Pretend you see me in the morning. What do you say?"' : ''}
Keep it playful and interactive!`;
        break;
      }

      case 'conversation': {
        const topicPrompts = {
          ai: `\nTOPIC: DISCOVER THE CHILD'S INTEREST
Start by asking what the child likes: "What do you like? Do you like cartoons? Games? Animals?"
Try different topics until you find what excites them. When they light up about something, stay on that topic!
Use their interest to practice all the conversation goals below.`,
          pokemons: `\nTOPIC: POKEMONS
The child loves Pokemons! Talk about favorite Pokemon, their powers and types (fire, water, electric).
Ask: "What is your favorite Pokemon?", "Is Pikachu strong?", "What type is Charizard?"
Use Pokemon as context for adjectives: "Is Snorlax big or small?", "Pikachu is a yellow Pokemon!"`,
          ninjago: `\nTOPIC: NINJAGO
The child loves Ninjago! Talk about ninjas, elements (fire, ice, lightning, earth), and characters.
Ask: "Who is your favorite ninja?", "What color is Kai?", "Can Lloyd fly?"
Use Ninjago as context: "Kai is a red ninja. He has fire power!"`,
          space: `\nTOPIC: SPACE
The child loves space! Talk about planets, rockets, astronauts, stars, and the moon.
Ask: "Do you want to go to space?", "What planet do you like?", "Is the sun big or small?"
Use space as context: "The moon is big and white!", "Astronauts fly in a rocket!"`,
          robots: `\nTOPIC: ROBOTS
The child loves robots! Talk about what robots can do, building robots, robot friends.
Ask: "Do you like robots?", "What can your robot do?", "Is your robot big or small?"
Use robots as context: "My robot is tall and blue!", "The robot can jump and dance!"`,
        };
        const topicText = topicPrompts[selectedTopic] || topicPrompts.ai;
        focusInstructions = `
FOCUS: CONVERSATION PRACTICE
${topicText}

GOALS:
- Child can state their name, age, and where they live in full sentences
- Child can answer simple questions with "Yes, I do" / "No, I don't" (not just "yes"/"no")
- Child uses correct adjective placement: "big dog" not "dog big"

METHOD:
1. Start with "My Self" questions: "What is your name?", "How old are you?", "Where do you live?"
2. Help them answer in full sentences: "Say: My name is..."
3. Ask about the topic using simple questions
4. Guide full answers: Not just "yes" — "Yes, I like Pikachu!"
5. Practice descriptions using the topic: "Is it big or small?", "What color is it?"
6. Help with adjective order: "We say 'big red robot', not 'red big robot'"
7. If they answer in Hebrew, help translate: "In English we say [word]!"

Keep the conversation flowing naturally — stay on the topic the child enjoys!`;
        break;
      }

      case 'storytelling':
        focusInstructions = `
FOCUS: INTERACTIVE STORYTELLING & DIALOGUE

GOALS:
- Practice 3-turn exchanges (Greeting → Question → Farewell)
- Use vocabulary in context with correct adjective placement
- Build confidence in connected speech

METHOD:
1. Start a simple story: "Once upon a time, there was a little [animal]..."
2. Ask the child to choose: "Was it a cat or a dog?"
3. Continue based on their choice with simple vocabulary
4. Ask what happens next: "The cat was hungry. What did the cat eat?"
5. Weave in dialogue practice: Have characters greet each other, ask questions, say goodbye
6. Use repetitive patterns: "The cat walked and walked and walked..."
7. Practice descriptions in context: "Was it a BIG cat or a SMALL cat? What COLOR was it?"

Make the story fun and silly — kids love funny things happening!`;
        break;

      case 'pronunciation':
        focusInstructions = `
FOCUS: PRONUNCIATION PRACTICE

TARGET SOUNDS (Israeli Ministry of Education English curriculum):
- "th" (as in "the", "think", "three") — Hebrew has no "th" sound. Say: "Tree" vs "Three" — can you hear the difference?
- "w" vs "v" — Hebrew speakers say "v" for "w". Practice: "wine" not "vine", "wet" not "vet", "water" not "vater"
- Word-final "r" — practice "car", "door", "tiger"
- Short vowels — "cat" vs "cut", "bed" vs "bad"

GOAL: Child distinguishes /th/ from /s/ and /w/ from /v/, and produces "Three" differently from "Tree".

METHOD:
1. Start with minimal pairs: "vine/wine", "vet/wet", "sink/think", "tree/three"
2. Say both words clearly, ask which one you said: "Did I say 'three' or 'tree'?"
3. Have the child try both: "Now you say 'three'. Stick out your tongue a tiny bit!"
4. Use words in silly sentences: "Three thin things think!"
5. Practice one tricky sound per round, then mix
6. Celebrate attempts — don't demand perfection
7. Make it a game: "Can you make the 'th' sound? Like a snake — thhhh!"

Be extra patient — pronunciation takes time and repetition!`;
        break;
    }

    return base + '\n' + focusInstructions;
  }

  // ===== AUDIO WORKLET (via Blob URL) =====
  const WORKLET_CODE = `
class PCMProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = [];
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;

    const samples = input[0];
    // Downsample to 16kHz from whatever the browser gives us
    const ratio = sampleRate / 16000;
    for (let i = 0; i < samples.length; i += ratio) {
      const idx = Math.floor(i);
      if (idx < samples.length) {
        // Convert float32 [-1,1] to int16
        const s = Math.max(-1, Math.min(1, samples[idx]));
        const val = s < 0 ? s * 0x8000 : s * 0x7fff;
        this._buffer.push(val);
      }
    }

    // Send in chunks of ~1600 samples (100ms at 16kHz)
    while (this._buffer.length >= 1600) {
      const chunk = this._buffer.splice(0, 1600);
      const int16 = new Int16Array(chunk);
      this.port.postMessage(int16.buffer, [int16.buffer]);
    }

    return true;
  }
}

registerProcessor('pcm-processor', PCMProcessor);
`;

  // ===== MIC CAPTURE =====
  async function startMicCapture() {
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      }
    });

    audioCtx = new AudioContext({ sampleRate: 48000 });

    // Resume if suspended (autoplay policy)
    if (audioCtx.state === 'suspended') {
      await audioCtx.resume();
    }

    // Register worklet via Blob URL
    const blob = new Blob([WORKLET_CODE], { type: 'application/javascript' });
    const url = URL.createObjectURL(blob);
    await audioCtx.audioWorklet.addModule(url);
    URL.revokeObjectURL(url);

    const source = audioCtx.createMediaStreamSource(micStream);
    workletNode = new AudioWorkletNode(audioCtx, 'pcm-processor');

    // Collect PCM chunks from worklet
    workletNode.port.onmessage = (e) => {
      if (!isMuted) {
        pcmBuffer.push(new Int16Array(e.data));
      }
    };

    source.connect(workletNode);
    workletNode.connect(audioCtx.destination); // needed for processing (silent)

    // Send buffered audio to Gemini every ~100ms
    sendInterval = setInterval(() => {
      if (!session) return;
      if (pcmBuffer.length === 0) return;

      // Merge all buffered chunks
      let totalLen = 0;
      for (const chunk of pcmBuffer) totalLen += chunk.length;
      const merged = new Int16Array(totalLen);
      let offset = 0;
      for (const chunk of pcmBuffer) {
        merged.set(chunk, offset);
        offset += chunk.length;
      }
      pcmBuffer = [];

      // Silence detection via audio energy (RMS)
      let sumSq = 0;
      for (let i = 0; i < merged.length; i++) {
        sumSq += merged[i] * merged[i];
      }
      const rms = Math.sqrt(sumSq / merged.length);
      const isSpeech = rms > 2000; // threshold for speech vs ambient noise

      if (isSpeech) {
        hadAudioData = true;
        silenceSince = 0;
        if (isThinking) isThinking = false;
        startNudgeTimer(); // reset nudge on speech
      } else if (hadAudioData && !isModelSpeaking && !isThinking) {
        if (!silenceSince) silenceSince = Date.now();
        if (Date.now() - silenceSince > 300) {
          setTutorThinking();
        }
      }

      // Base64 encode
      const bytes = new Uint8Array(merged.buffer);
      let binary = '';
      for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64 = btoa(binary);
      session.sendAudio(base64);
    }, 100);
  }

  function stopMicCapture() {
    if (sendInterval) {
      clearInterval(sendInterval);
      sendInterval = null;
    }
    if (workletNode) {
      workletNode.disconnect();
      workletNode = null;
    }
    if (micStream) {
      micStream.getTracks().forEach(t => t.stop());
      micStream = null;
    }
    if (audioCtx) {
      audioCtx.close();
      audioCtx = null;
    }
    pcmBuffer = [];
  }

  // ===== AUDIO PLAYBACK (Gemini -> Speaker) =====
  function initPlayback() {
    playbackCtx = new AudioContext({ sampleRate: 24000 });
    playbackQueue = [];
    playbackTime = 0;
  }

  function playAudioChunk(base64Data) {
    if (!playbackCtx) return;

    // Resume if suspended (autoplay policy)
    if (playbackCtx.state === 'suspended') {
      playbackCtx.resume();
    }

    // Decode base64 to Int16 PCM
    const binary = atob(base64Data);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const int16 = new Int16Array(bytes.buffer);

    // Convert Int16 to Float32
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768;
    }

    // Create audio buffer
    const buffer = playbackCtx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    // Schedule gapless playback
    const source = playbackCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(playbackCtx.destination);

    const now = playbackCtx.currentTime;
    const startTime = Math.max(now, playbackTime);
    source.start(startTime);
    playbackTime = startTime + buffer.duration;

    playbackQueue.push(source);

    // Clean up finished sources
    source.onended = () => {
      const idx = playbackQueue.indexOf(source);
      if (idx !== -1) playbackQueue.splice(idx, 1);
    };
  }

  function stopPlayback() {
    for (const source of playbackQueue) {
      try { source.stop(); } catch {}
    }
    playbackQueue = [];
    playbackTime = 0;
  }

  function closePlayback() {
    stopPlayback();
    if (playbackCtx) {
      playbackCtx.close();
      playbackCtx = null;
    }
  }

  // ===== TIMER =====
  function startTimer() {
    timerSeconds = selectedDuration * 60;
    updateTimerDisplay();

    timerInterval = setInterval(() => {
      timerSeconds--;
      updateTimerDisplay();

      // Warning at 1 minute
      if (timerSeconds === 60) {
        els.timer.classList.add('warning');
      }

      if (timerSeconds <= 0) {
        endSession();
      }
    }, 1000);
  }

  function updateTimerDisplay() {
    const min = Math.floor(timerSeconds / 60);
    const sec = timerSeconds % 60;
    els.timer.textContent = `${min}:${sec.toString().padStart(2, '0')}`;
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    els.timer.classList.remove('warning');
  }

  // ===== NUDGE =====
  function startNudgeTimer() {
    clearNudgeTimer();
    nudgeTimer = setTimeout(() => {
      if (session && !isModelSpeaking) {
        console.log('[VoiceTutor] Nudging — child silent for', NUDGE_DELAY_MS, 'ms');
        session.sendText('[The child has been silent. Gently encourage them or continue the activity.]');
      }
    }, NUDGE_DELAY_MS);
  }

  function clearNudgeTimer() {
    if (nudgeTimer) {
      clearTimeout(nudgeTimer);
      nudgeTimer = null;
    }
  }

  // ===== UI STATE UPDATES =====
  function setTutorSpeaking(speaking) {
    isModelSpeaking = speaking;
    isThinking = false;
    hadAudioData = false;
    silenceSince = 0;
    if (speaking) {
      clearNudgeTimer();
      els.tutorAvatar.classList.remove('thinking');
      els.tutorAvatar.classList.add('speaking');
      els.tutorStatus.textContent = 'Speaking...';
      els.tutorStatus.className = 'tutor-status speaking';
      els.micIndicator.classList.remove('active');
      els.micStatus.textContent = '';
    } else {
      startNudgeTimer();
      els.tutorAvatar.classList.remove('speaking', 'thinking');
      els.tutorStatus.textContent = 'Listening...';
      els.tutorStatus.className = 'tutor-status listening';
      els.micIndicator.classList.add('active');
      els.micStatus.textContent = 'Speak now!';
    }
  }

  function setTutorThinking() {
    isThinking = true;
    els.tutorAvatar.classList.remove('speaking');
    els.tutorAvatar.classList.add('thinking');
    els.tutorStatus.textContent = 'Thinking...';
    els.tutorStatus.className = 'tutor-status thinking';
    els.micIndicator.classList.remove('active');
    els.micStatus.textContent = '';
  }

  // ===== CONNECT TO GEMINI =====
  async function connectToGemini() {
    showScreen('connecting');

    // Reset connecting screen state
    els.connectSpinner.classList.remove('hidden');
    els.connectText.classList.remove('hidden');
    els.connectSubtext.classList.remove('hidden');
    els.micDenied.classList.add('hidden');
    els.connectError.classList.add('hidden');

    // Step 1: Get mic permission
    try {
      await startMicCapture();
    } catch (err) {
      // Mic denied or failed
      els.connectSpinner.classList.add('hidden');
      els.connectText.classList.add('hidden');
      els.connectSubtext.classList.add('hidden');
      els.micDenied.classList.remove('hidden');
      return;
    }

    // Step 2: Connect WebSocket
    try {
      initPlayback();

      session = await GeminiLive.connect({
        systemPrompt: buildSystemPrompt(),

        onAudio(base64Data) {
          if (!isModelSpeaking) {
            setTutorSpeaking(true);
          }
          playAudioChunk(base64Data);
        },

        onTurnEnd() {
          setTutorSpeaking(false);
        },

        onInterrupted() {
          stopPlayback();
          setTutorSpeaking(false);
        },

        onConnected() {
          // Session ready
        },

        onError(type) {
          if (type === 'disconnected' && session) {
            // Mid-session disconnect — try to reconnect once
            session.reconnect().catch(() => {
              endSession();
            });
          }
        },
      });

      // Success — show conversation screen
      sessionStartTime = Date.now();
      showScreen('conversation');
      startTimer();
      setTutorSpeaking(false);

    } catch (err) {
      // WebSocket connection failed after retries
      stopMicCapture();
      closePlayback();
      els.connectSpinner.classList.add('hidden');
      els.connectText.classList.add('hidden');
      els.connectSubtext.classList.add('hidden');
      els.connectError.classList.remove('hidden');
    }
  }

  // ===== END SESSION =====
  function endSession() {
    stopTimer();
    clearNudgeTimer();

    // Close connections
    if (session) {
      session.close();
      session = null;
    }
    stopMicCapture();
    closePlayback();

    // Calculate stats
    const elapsed = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 60000) : 0;
    const displayMin = Math.max(1, elapsed);
    els.durationStat.textContent = displayMin;
    els.focusStat.textContent = selectedFocus ? selectedFocus.charAt(0).toUpperCase() + selectedFocus.slice(1) : '—';

    // Save session history
    if (typeof Storage !== 'undefined' && window.Storage) {
      const history = Storage.load('voice-tutor', 'sessions', []);
      history.push({
        date: new Date().toISOString(),
        focus: selectedFocus,
        theme: selectedTheme,
        topic: selectedTopic,
        durationMin: displayMin,
      });
      Storage.save('voice-tutor', 'sessions', history);
    }

    // Show complete screen with celebration
    showScreen('complete');

    if (typeof Particles !== 'undefined') {
      Particles.init(els.particleCanvas);
      Particles.confetti(60);
    }

    if (typeof Audio !== 'undefined' && Audio.SFX) {
      try { Audio.SFX.celebration(); } catch {}
    }
  }

  // ===== EVENT HANDLERS =====

  // Welcome -> Setup
  els.startBtn.addEventListener('click', () => {
    showScreen('setup');
    if (typeof Audio !== 'undefined' && Audio.init) {
      try { Audio.init(); } catch {}
    }
  });

  // Setup -> Welcome (back)
  els.setupBackBtn.addEventListener('click', () => {
    showScreen('welcome');
  });

  // Focus card selection
  els.focusCards.forEach(card => {
    card.addEventListener('click', () => {
      // Deselect all
      els.focusCards.forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');
      selectedFocus = card.dataset.focus;

      // Show/hide sub-selectors based on focus
      if (selectedFocus === 'vocabulary') {
        els.themeSelector.classList.remove('hidden');
        els.topicSelector.classList.add('hidden');
        selectedTopic = null;
        if (!selectedTheme) {
          els.beginBtn.classList.add('hidden');
        }
      } else if (selectedFocus === 'conversation') {
        els.topicSelector.classList.remove('hidden');
        els.themeSelector.classList.add('hidden');
        selectedTheme = null;
        if (!selectedTopic) {
          els.beginBtn.classList.add('hidden');
        }
      } else {
        els.themeSelector.classList.add('hidden');
        els.topicSelector.classList.add('hidden');
        selectedTheme = null;
        selectedTopic = null;
      }

      // Show duration picker
      els.durationPicker.classList.remove('hidden');

      // Show begin button (unless sub-selection needed)
      const needsSub = (selectedFocus === 'vocabulary' && !selectedTheme) ||
                       (selectedFocus === 'conversation' && !selectedTopic);
      if (!needsSub) {
        els.beginBtn.classList.remove('hidden');
      }

      if (typeof Audio !== 'undefined' && Audio.SFX) {
        try { Audio.SFX.tap(); } catch {}
      }
    });
  });

  // Theme chip selection
  els.themeChips.forEach(chip => {
    chip.addEventListener('click', () => {
      els.themeChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedTheme = chip.dataset.theme;
      els.beginBtn.classList.remove('hidden');

      if (typeof Audio !== 'undefined' && Audio.SFX) {
        try { Audio.SFX.tap(); } catch {}
      }
    });
  });

  // Topic chip selection
  els.topicChips.forEach(chip => {
    chip.addEventListener('click', () => {
      els.topicChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedTopic = chip.dataset.topic;
      els.beginBtn.classList.remove('hidden');

      if (typeof Audio !== 'undefined' && Audio.SFX) {
        try { Audio.SFX.tap(); } catch {}
      }
    });
  });

  // Duration chip selection
  els.durationChips.forEach(chip => {
    chip.addEventListener('click', () => {
      els.durationChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      selectedDuration = parseInt(chip.dataset.duration, 10);

      if (typeof Audio !== 'undefined' && Audio.SFX) {
        try { Audio.SFX.tap(); } catch {}
      }
    });
  });

  // Begin session
  els.beginBtn.addEventListener('click', () => {
    connectToGemini();
  });

  // Retry mic
  els.retryMicBtn.addEventListener('click', () => {
    connectToGemini();
  });

  // Retry connection
  els.retryConnectBtn.addEventListener('click', () => {
    connectToGemini();
  });

  // Home button (from connect error)
  els.homeBtn.addEventListener('click', () => {
    window.location.href = '../../index.html';
  });

  // End session button
  els.endSessionBtn.addEventListener('click', () => {
    endSession();
  });

  // Mute toggle
  els.muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    els.muteBtn.textContent = isMuted ? '🔇' : '🎤';
    els.muteBtn.classList.toggle('muted', isMuted);
  });

  // Play again
  els.playAgainBtn.addEventListener('click', () => {
    // Reset state
    selectedFocus = null;
    selectedTheme = null;
    selectedTopic = null;
    selectedDuration = 10;
    els.focusCards.forEach(c => c.classList.remove('selected'));
    els.themeChips.forEach(c => c.classList.remove('active'));
    els.topicChips.forEach(c => c.classList.remove('active'));
    els.durationChips.forEach(c => c.classList.remove('active'));
    $$('.duration-chip[data-duration="10"]').forEach(c => c.classList.add('active'));
    els.themeSelector.classList.add('hidden');
    els.topicSelector.classList.add('hidden');
    els.durationPicker.classList.add('hidden');
    els.beginBtn.classList.add('hidden');
    els.timer.classList.remove('warning');

    showScreen('setup');
  });

  // Home button (from complete)
  els.homeBtnComplete.addEventListener('click', () => {
    window.location.href = '../../index.html';
  });
})();
