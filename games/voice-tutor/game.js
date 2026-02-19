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
    connectErrorDetail: $('.connect-error-detail'),
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
    sessionReview:  $('#sessionReview'),
    reviewSummary:  $('#reviewSummary'),
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

  // Nudge timer — re-engage if child is silent too long
  const NUDGE_DELAY_MS = 4000;
  let nudgeTimer = null;

  // Assessment state
  let assessmentData = null;
  let assessmentResolve = null;
  let reviewPending = false;
  const ASSESSMENT_TIMEOUT_MS = 15000;
  let isSessionEnding = false;

  // Mapping from focus+theme to the skill keys Gemini should assess
  const FOCUS_SKILL_KEYS = {
    'pronunciation': ['phonemes', 'pronunciation'],
    'vocabulary:nouns': ['nouns'],
    'vocabulary:verbs': ['verbs'],
    'vocabulary:adjectives': ['adjectives'],
    'vocabulary:phrases': ['phrases'],
    'conversation': ['my-self', 'qa', 'description'],
    'storytelling': ['dialogue'],
  };

  // Skill display info
  const SKILL_DISPLAY = {
    'phonemes':      { icon: '👂', name: 'Phonemes' },
    'nouns':         { icon: '📚', name: 'Nouns' },
    'verbs':         { icon: '🏃', name: 'Verbs' },
    'adjectives':    { icon: '🎨', name: 'Adjectives' },
    'phrases':       { icon: '👋', name: 'Phrases' },
    'pronunciation': { icon: '🗣️', name: 'Pronunciation' },
    'my-self':       { icon: '🙋', name: 'My Self' },
    'qa':            { icon: '❓', name: 'Q&A' },
    'description':   { icon: '🖼️', name: 'Description' },
    'dialogue':      { icon: '💬', name: 'Dialogue' },
  };

  /** Get the skill keys relevant for the current session's focus+theme */
  function getSessionSkillKeys() {
    if (!selectedFocus) return [];
    const key = selectedFocus === 'vocabulary' && selectedTheme
      ? `vocabulary:${selectedTheme}`
      : selectedFocus;
    return FOCUS_SKILL_KEYS[key] || [];
  }

  // ===== SCREEN MANAGEMENT =====
  function showScreen(name) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[name].classList.add('active');
  }

  // ===== SESSION HISTORY CONTEXT =====
  function buildHistoryContext() {
    if (typeof Storage === 'undefined' || !window.Storage) return '';
    Storage.getProfile(); // ensure activeProfile is loaded from localStorage
    const sessions = Storage.load('voice-tutor', 'sessions', []);
    if (!sessions.length) return '';

    // Last 5 sessions, most recent first
    const recent = sessions.slice(-5).reverse();
    const lines = recent.map(s => {
      const date = new Date(s.date);
      const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const focus = (s.focus || '').charAt(0).toUpperCase() + (s.focus || '').slice(1);
      const sub = s.theme || s.topic || '';
      const label = sub ? `${focus}/${sub}` : focus;

      let skillStr = '';
      let summary = '';
      let details = '';
      if (s.assessment) {
        if (s.assessment.skills) {
          skillStr = s.assessment.skills
            .map(sk => `${sk.skill}: ${sk.rating}★`)
            .join(', ');
        }
        summary = s.assessment.summary || '';
        // Only include studentDetails if same focus+sub-topic to avoid topic bleed
        const sameFocus = s.focus === selectedFocus;
        const sameSub = (s.theme || s.topic || '') === (selectedTheme || selectedTopic || '');
        if (sameFocus && sameSub) {
          details = s.assessment.studentDetails || '';
        }
      }

      let line = `- ${dateStr}: ${label}`;
      if (skillStr) line += ` — ${skillStr}`;
      if (summary) line += ` — "${summary}"`;
      if (details) line += `\n  Student details: ${details}`;
      return line;
    });

    const ctx = `\nPREVIOUS SESSIONS (most recent first):\n${lines.join('\n')}`;
    console.log('[VoiceTutor] History context:', ctx);
    return ctx;
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
- If the child insists a second time that they want to stop, say a quick warm goodbye and praise their effort.
- When the session ends, you will receive a system message asking you to assess the student. Say a warm goodbye, then call the session_assessment function with honest ratings (1-5) for each skill practiced. Be encouraging in your spoken goodbye but accurate in the function call ratings.
- If previous sessions exist below, review them. Avoid re-teaching words/topics the child already mastered (4-5★). Focus on areas rated 1-3★. Build on what they've learned.
- Use student details from past sessions to personalize, BUT only if relevant to today's topic. Do NOT bring up characters or themes from a different topic. Example: if today's topic is Ninjago, do NOT mention Pokemon even if the child liked it before.`;

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
        const isSpecificTopic = selectedTopic && selectedTopic !== 'ai';
        focusInstructions = `
FOCUS: CONVERSATION PRACTICE
${topicText}

GOALS (weave these into the conversation naturally):
- Child answers in full sentences, not single words
- Child uses "Yes, I do" / "No, I don't" (not just "yes"/"no")
- Child uses correct adjective placement: "big yellow Pokemon" not "Pokemon yellow big"

METHOD:
${isSpecificTopic ? `1. Start with an excited greeting about the topic RIGHT AWAY! Example: "Hi! I love ${selectedTopic}! Do you like ${selectedTopic} too?"
2. Jump straight into topic questions — this is what the child wants to talk about!
3. Guide full sentence answers: Not just "Pikachu" — "I like Pikachu!" or "My favorite is Pikachu!"
4. Practice descriptions using the topic: "Is it big or small?", "What color is it?"
5. Help with adjective order naturally: "We say 'big red robot', not 'red big robot'"
6. You can ask their name if it comes up naturally, but do NOT start with boring intro questions
7. If they answer in Hebrew, help translate: "In English we say [word]!"` :
`1. Start by asking what the child likes: "What do you like? Cartoons? Games? Animals?"
2. When you find their interest, stay on that topic!
3. Guide full sentence answers: Not just "yes" — "Yes, I like it!"
4. Practice descriptions: "Is it big or small?", "What color is it?"
5. Help with adjective order: "We say 'big red ball', not 'red big ball'"
6. If they answer in Hebrew, help translate: "In English we say [word]!"`}

IMPORTANT: The child chose this topic because they're excited about it. Lead with the topic from your very first sentence!`;
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

    return base + '\n' + focusInstructions + buildHistoryContext();
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

      // Check for speech to reset nudge timer
      let sumSq = 0;
      for (let i = 0; i < merged.length; i++) {
        sumSq += merged[i] * merged[i];
      }
      const rms = Math.sqrt(sumSq / merged.length);
      if (rms > 2000) {
        startNudgeTimer();
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
      if (session && !isModelSpeaking && !isSessionEnding && timerSeconds > 5) {
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
    if (speaking) {
      clearNudgeTimer();
      els.tutorAvatar.classList.add('speaking');
      els.tutorStatus.textContent = 'Speaking...';
      els.tutorStatus.className = 'tutor-status speaking';
      els.micIndicator.classList.remove('active');
      els.micStatus.textContent = '';
    } else {
      startNudgeTimer();
      els.tutorAvatar.classList.remove('speaking');
      els.tutorStatus.textContent = 'Listening...';
      els.tutorStatus.className = 'tutor-status listening';
      els.micIndicator.classList.add('active');
      els.micStatus.textContent = 'Speak now!';
    }
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

        onAssessment(data) {
          console.log('[VoiceTutor] Assessment received:', data);
          assessmentData = data;
          if (assessmentResolve) {
            assessmentResolve(data);
          }
        },

        onError(type, code, reason) {
          console.warn(`[VoiceTutor] Gemini error: type=${type} code=${code} reason="${reason}"`);
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
      console.error('[VoiceTutor] Connection failed:', err.message);
      stopMicCapture();
      closePlayback();
      els.connectSpinner.classList.add('hidden');
      els.connectText.classList.add('hidden');
      els.connectSubtext.classList.add('hidden');
      els.connectError.classList.remove('hidden');
      // Show diagnostic detail if available
      if (els.connectErrorDetail) {
        els.connectErrorDetail.textContent = err.message || '';
      }
    }
  }

  // ===== REVIEW & ADAPTIVE RECORDS =====

  function renderStars(rating, max) {
    max = max || 5;
    let html = '';
    for (let i = 1; i <= max; i++) {
      html += i <= rating
        ? '<span class="star-filled">★</span>'
        : '<span class="star-empty">★</span>';
    }
    return html;
  }

  function renderReview(assessment) {
    if (!assessment || !assessment.skills || !assessment.skills.length) {
      els.sessionReview.innerHTML = '';
      els.reviewSummary.textContent = '';
      return;
    }

    els.sessionReview.innerHTML = assessment.skills.map((s, i) => {
      const display = SKILL_DISPLAY[s.skill] || { icon: '📝', name: s.skill };
      return `
        <div class="review-card" style="animation-delay: ${i * 0.1}s">
          <span class="review-skill-icon">${display.icon}</span>
          <div class="review-skill-info">
            <div class="review-skill-name">${display.name}</div>
            <p class="review-note">${s.note || ''}</p>
          </div>
          <div class="review-stars">${renderStars(s.rating)}</div>
        </div>`;
    }).join('');

    if (assessment.summary) {
      els.reviewSummary.textContent = assessment.summary;
    }
  }

  function saveAdaptiveRecords(assessment) {
    if (!assessment || !assessment.skills) return;
    if (typeof Storage === 'undefined' || !window.Storage) return;

    const profileName = Storage.getProfile();
    if (!profileName) return;

    const records = Storage.load('voice-tutor', 'adaptive', {});

    for (const s of assessment.skills) {
      const existing = records[s.skill] || { box: 0, correct: 0, wrong: 0 };
      const rating = Math.max(1, Math.min(5, s.rating));

      // Map rating to box level (matching curriculum.js thresholds)
      // box >= 3 = mastered, box >= 1 = learning, box 0 = struggling
      if (rating >= 5) {
        existing.box = 3;
      } else if (rating >= 4) {
        existing.box = 2;
      } else if (rating >= 3) {
        existing.box = 1;
      } else {
        existing.box = 0;
      }

      // Track cumulative attempts
      existing.correct += rating >= 3 ? 1 : 0;
      existing.wrong += rating < 3 ? 1 : 0;

      records[s.skill] = existing;
    }

    Storage.save('voice-tutor', 'adaptive', records);
    console.log('[VoiceTutor] Saved adaptive records:', records);
  }

  function showCoinsEarned() {
    if (typeof SharedCoins === 'undefined') return;
    // Insert a coins earned badge before the review section
    let badge = document.querySelector('.session-coins-badge');
    if (!badge) {
      badge = document.createElement('div');
      badge.className = 'session-coins-badge';
      badge.style.cssText = 'text-align:center;font-size:1.2em;color:#ffd700;font-weight:bold;margin:8px 0;';
      els.sessionReview.parentNode.insertBefore(badge, els.sessionReview);
    }
    badge.textContent = `🪙 +10 coins  ⚡ +2 min`;
  }

  function showReviewLoading() {
    els.sessionReview.innerHTML = `
      <div class="review-loading">
        <div class="spinner"></div>
        <span>Preparing your review...</span>
      </div>`;
    els.reviewSummary.textContent = '';
  }

  // ===== END SESSION =====
  async function endSession() {
    isSessionEnding = true;
    stopTimer();
    clearNudgeTimer();
    stopMicCapture();
    stopPlayback();
    closePlayback();

    // Calculate stats
    const elapsed = sessionStartTime ? Math.round((Date.now() - sessionStartTime) / 60000) : 0;
    const displayMin = Math.max(1, elapsed);
    els.durationStat.textContent = displayMin;

    // Show complete screen immediately with loading state
    showScreen('complete');
    showReviewLoading();

    if (typeof Particles !== 'undefined') {
      Particles.init(els.particleCanvas);
      Particles.confetti(60);
    }

    if (typeof Audio !== 'undefined' && Audio.SFX) {
      try { Audio.SFX.celebration(); } catch {}
    }

    // Request assessment from Gemini before closing
    const skillKeys = getSessionSkillKeys();
    assessmentData = null;

    if (session && skillKeys.length > 0) {
      reviewPending = true;

      // Create a promise that resolves when assessment arrives
      const assessmentPromise = new Promise(resolve => {
        assessmentResolve = resolve;
      });

      // Request assessment (Gemini will speak goodbye + call function)
      session.requestAssessment(skillKeys);

      // Wait for assessment with timeout
      const timeoutPromise = new Promise(resolve => {
        setTimeout(() => resolve(null), ASSESSMENT_TIMEOUT_MS);
      });

      assessmentData = await Promise.race([assessmentPromise, timeoutPromise]);
      reviewPending = false;
      console.log('[VoiceTutor] Assessment result:', assessmentData);
    }

    // Close session after assessment (or timeout)
    if (session) {
      session.close();
      session = null;
    }

    // Earn shared coins and energy
    if (typeof SharedCoins !== 'undefined') {
      SharedCoins.add(10);
    }
    if (typeof Energy !== 'undefined') {
      Energy.earnMinutes(2);
    }

    // Render review
    if (assessmentData) {
      renderReview(assessmentData);
      saveAdaptiveRecords(assessmentData);
    } else {
      // No assessment — clear loading state
      els.sessionReview.innerHTML = '';
      els.reviewSummary.textContent = '';
    }

    // Show coins earned badge
    showCoinsEarned();

    // Save session history
    if (typeof Storage !== 'undefined' && window.Storage) {
      Storage.getProfile(); // ensure profile-prefixed key
      const history = Storage.load('voice-tutor', 'sessions', []);
      history.push({
        date: new Date().toISOString(),
        focus: selectedFocus,
        theme: selectedTheme,
        topic: selectedTopic,
        durationMin: displayMin,
        assessment: assessmentData || null,
      });
      Storage.save('voice-tutor', 'sessions', history);
    }

    assessmentResolve = null;
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
    if (reviewPending) {
      if (!confirm('The review is still loading. Skip it?')) return;
    }
    // Reset state
    selectedFocus = null;
    selectedTheme = null;
    selectedTopic = null;
    selectedDuration = 10;
    assessmentData = null;
    assessmentResolve = null;
    reviewPending = false;
    isSessionEnding = false;
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
    if (reviewPending) {
      if (!confirm('The review is still loading. Skip it?')) return;
    }
    window.location.href = '../../index.html';
  });
})();
