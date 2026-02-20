/**
 * Knowledge Tutor — Main game logic.
 * State-machine-driven general knowledge learning game for kids (ages 5-7, Hebrew).
 * 3 depth levels per topic, 10 fact cards + 5 quiz questions per session.
 */
const Game = (() => {
  const GAME_ID = 'knowledge-tutor';

  // ===== GEMINI API CONFIG =====
  const GEMINI_MODEL = 'gemini-2.5-flash';
  const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

  const SUPABASE_URL = 'https://xanesbzvzhjqndkskvnh.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhhbmVzYnp2emhqcW5ka3Nrdm5oIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODA5NDcsImV4cCI6MjA4NjU1Njk0N30.uoNz0Wm-832jeIyRYu-NlJUHvgkE89bU_tHtXD4skfs';
  const KEY_ENDPOINT = `${SUPABASE_URL}/functions/v1/gemini-key`;
  const FALLBACK_KEY = 'AIzaSyA_lgf76fwtXxm0ubStGk_nb9EEl2leaeA';

  let geminiApiKey = null;

  // ===== SESSION DEFINITIONS =====
  const TOTAL_SESSIONS = 5;
  const SESSION_ICONS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

  // ===== DOM REFS =====
  const $ = (sel) => document.querySelector(sel);

  const screens = {
    home:    $('.home-screen'),
    topics:  $('.topics-screen'),
    level:   $('.level-screen'),
    loading: $('.loading-screen'),
    lesson:  $('.lesson-screen'),
    quiz:    $('.quiz-screen'),
    results: $('.results-screen'),
    error:   $('.error-screen'),
  };

  const els = {
    categoryGrid:        $('#categoryGrid'),
    topicsCategoryEmoji: $('#topicsCategoryEmoji'),
    topicsTitle:         $('#topicsTitle'),
    topicGrid:           $('#topicGrid'),
    topicsBackBtn:       $('.topics-back-btn'),
    levelTopicEmoji:     $('#levelTopicEmoji'),
    levelTopicTitle:     $('#levelTopicTitle'),
    levelGrid:           $('#levelGrid'),
    levelBackBtn:        $('.level-back-btn'),
    lessonBackBtn:       $('.lesson-back-btn'),
    lessonProgressFill:  $('#lessonProgressFill'),
    lessonProgressLabel: $('#lessonProgressLabel'),
    factCard:            $('#factCard'),
    factEmoji:           $('#factEmoji'),
    factText:            $('#factText'),
    lessonReplayBtn:     $('#lessonReplayBtn'),
    lessonNextBtn:       $('#lessonNextBtn'),
    quizProgressFill:    $('#quizProgressFill'),
    quizProgressLabel:   $('#quizProgressLabel'),
    quizQuestionText:    $('#quizQuestionText'),
    quizChoices:         $('#quizChoices'),
    quizFeedback:        $('#quizFeedback'),
    resultsEmoji:        $('#resultsEmoji'),
    resultsTitle:        $('#resultsTitle'),
    resultsScore:        $('#resultsScore'),
    resultsMessage:      $('#resultsMessage'),
    resultsTopicsBtn:    $('.results-topics-btn'),
    resultsHomeBtn:      $('.results-home-btn'),
    errorRetryBtn:       $('.error-retry-btn'),
    errorHomeBtn:        $('.error-home-btn'),
    particleCanvas:      $('.particle-canvas'),
  };

  // ===== STATE =====
  let state = {
    screen: 'home',
    currentCategory: null,
    currentTopic: null,
    currentLevel: 1,
    lessonData: null,
    factIndex: 0,
    questionIndex: 0,
    score: 0,
    totalQuestions: 0,
    inputLocked: false,
    topicLevels: {},    // { "categoryId:topicId": highestCompletedLevel (1-3) }
    lessonCache: {},
  };

  // ===== INIT =====
  function init() {
    Audio.init();
    Audio.setLang('he');
    Particles.init(els.particleCanvas);
    loadProgress();
    renderCategories();
    bindEvents();
  }

  // ===== SCREEN MANAGEMENT =====
  function showScreen(name) {
    state.screen = name;
    Object.entries(screens).forEach(([key, el]) => {
      el.classList.toggle('active', key === name);
    });
    Particles.clear();
  }

  // ===== PROGRESS =====
  function progressKey(categoryId, topicId) {
    return `${categoryId}:${topicId}`;
  }

  function loadProgress() {
    state.topicLevels = Storage.load(GAME_ID, 'topicLevels', {});
  }

  function saveProgress() {
    Storage.save(GAME_ID, 'topicLevels', state.topicLevels);
  }

  function getTopicLevel(categoryId, topicId) {
    return state.topicLevels[progressKey(categoryId, topicId)] || 0;
  }

  function markLevelCompleted(categoryId, topicId, level) {
    const key = progressKey(categoryId, topicId);
    const current = state.topicLevels[key] || 0;
    if (level > current) {
      state.topicLevels[key] = level;
      saveProgress();
    }
  }

  function getCompletedStars(categoryId) {
    const cat = getCategoryById(categoryId);
    if (!cat) return 0;
    let stars = 0;
    cat.topics.forEach(t => {
      stars += getTopicLevel(categoryId, t.id);
    });
    return stars;
  }

  function getTotalStars(categoryId) {
    const cat = getCategoryById(categoryId);
    return cat ? cat.topics.length * TOTAL_SESSIONS : 0;
  }

  // ===== RENDER CATEGORIES =====
  function renderCategories() {
    els.categoryGrid.innerHTML = '';
    CATEGORIES.forEach((cat, i) => {
      const stars = getCompletedStars(cat.id);
      const total = getTotalStars(cat.id);
      const card = document.createElement('button');
      card.className = 'card category-card animate-fade-up';
      card.style.animationDelay = `${i * 80}ms`;
      card.dataset.categoryId = cat.id;
      card.innerHTML = `
        <span class="category-emoji">${cat.emoji}</span>
        <span class="category-label">${cat.label}</span>
        <span class="category-progress">⭐ ${stars}/${total}</span>
      `;
      els.categoryGrid.appendChild(card);
    });
  }

  // ===== RENDER TOPICS =====
  function renderTopics(category) {
    state.currentCategory = category;
    els.topicsCategoryEmoji.textContent = category.emoji;
    els.topicsTitle.textContent = category.label;

    els.topicGrid.innerHTML = '';
    category.topics.forEach((topic, i) => {
      const level = getTopicLevel(category.id, topic.id);
      const card = document.createElement('button');
      card.className = `card topic-card animate-fade-up ${level === TOTAL_SESSIONS ? 'completed' : ''}`;
      card.style.animationDelay = `${i * 60}ms`;
      card.dataset.topicId = topic.id;

      let starsHtml = '<div class="topic-stars">';
      for (let s = 1; s <= TOTAL_SESSIONS; s++) {
        starsHtml += `<span class="topic-star ${s <= level ? 'earned' : ''}">${s <= level ? '⭐' : '☆'}</span>`;
      }
      starsHtml += '</div>';

      card.innerHTML = `
        <span class="topic-emoji">${topic.emoji}</span>
        <span class="topic-label">${topic.label}</span>
        ${starsHtml}
      `;
      els.topicGrid.appendChild(card);
    });

    showScreen('topics');
  }

  // ===== RENDER SESSION SELECT =====
  function renderLevelSelect(topic) {
    state.currentTopic = topic;
    els.levelTopicEmoji.textContent = topic.emoji;
    els.levelTopicTitle.textContent = topic.label;

    const completedLevel = getTopicLevel(state.currentCategory.id, topic.id);

    els.levelGrid.innerHTML = '';
    for (let s = 1; s <= TOTAL_SESSIONS; s++) {
      const isCompleted = s <= completedLevel;
      const card = document.createElement('button');
      card.className = `card level-card animate-fade-up ${isCompleted ? 'completed' : ''}`;
      card.style.animationDelay = `${(s - 1) * 80}ms`;
      card.dataset.level = s;
      card.innerHTML = `
        <span class="level-icon">${SESSION_ICONS[s - 1]}</span>
        <div class="level-info">
          <span class="level-name">שיעור ${s}</span>
        </div>
        <span class="level-badge">${isCompleted ? '✅' : ''}</span>
      `;
      els.levelGrid.appendChild(card);
    }

    showScreen('level');
  }

  // ===== GEMINI API =====
  async function fetchGeminiKey() {
    if (geminiApiKey) return geminiApiKey;
    try {
      const res = await fetch(KEY_ENDPOINT, {
        headers: { 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` },
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      geminiApiKey = data.key;
    } catch (e) {
      console.warn('[KnowledgeTutor] Edge function unavailable, using fallback key');
      geminiApiKey = FALLBACK_KEY;
    }
    return geminiApiKey;
  }

  function buildLessonPrompt(categoryLabel, topicLabel, session) {
    const sessionHints = {
      1: 'Cover the most important and well-known facts about this topic.',
      2: 'Cover interesting and surprising facts that go beyond the basics.',
      3: 'Cover fun and unusual facts that most people do not know.',
      4: 'Cover facts related to how this topic connects to daily life or other topics.',
      5: 'Cover the most amazing, record-breaking, or extreme facts about this topic.',
    };

    return `You are an educational content creator for children aged 5-7 who speak Hebrew.

Create a lesson about "${topicLabel}" (category: "${categoryLabel}").

This is SESSION ${session} of 5. ${sessionHints[session]}
IMPORTANT: Each session must cover DIFFERENT facts. Do not repeat facts from other sessions.

RULES:
- Write EVERYTHING in Hebrew
- Use vocabulary appropriate for ages 5-7 but make the content interesting and informative
- Keep sentences short (5-10 words each)
- Create exactly 5 fun, engaging facts
- Each fact should include a relevant emoji
- Create exactly 3 quiz questions that test ONLY facts from the lesson
- Each quiz question must have exactly 4 answer choices
- Exactly one answer per question must be correct
- Wrong answers should be plausible but clearly wrong for a child who learned the facts

Respond with ONLY valid JSON in this exact format:
{
  "facts": [
    { "text": "Hebrew fact text here", "emoji": "🦁" },
    { "text": "Hebrew fact text here", "emoji": "🦁" },
    { "text": "Hebrew fact text here", "emoji": "🦁" },
    { "text": "Hebrew fact text here", "emoji": "🦁" },
    { "text": "Hebrew fact text here", "emoji": "🦁" }
  ],
  "questions": [
    {
      "question": "Hebrew question text?",
      "choices": ["choice1", "choice2", "choice3", "choice4"],
      "correctIndex": 0
    },
    {
      "question": "Hebrew question text?",
      "choices": ["choice1", "choice2", "choice3", "choice4"],
      "correctIndex": 2
    },
    {
      "question": "Hebrew question text?",
      "choices": ["choice1", "choice2", "choice3", "choice4"],
      "correctIndex": 1
    }
  ]
}`;
  }

  async function generateLesson(categoryLabel, topicLabel, level) {
    const key = await fetchGeminiKey();
    const url = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${key}`;
    const prompt = buildLessonPrompt(categoryLabel, topicLabel, level);

    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!res.ok) throw new Error(`Gemini API error: ${res.status}`);
    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('No content in Gemini response');

    const cleaned = text.replace(/```json\s*|```\s*/g, '').trim();
    return JSON.parse(cleaned);
  }

  // ===== LOAD TOPIC =====
  async function startLevel(level) {
    state.currentLevel = level;
    state.factIndex = 0;
    state.questionIndex = 0;
    state.score = 0;

    const cacheKey = `${state.currentCategory.id}:${state.currentTopic.id}:${level}`;

    if (state.lessonCache[cacheKey]) {
      state.lessonData = state.lessonCache[cacheKey];
      state.totalQuestions = state.lessonData.questions.length;
      showLesson();
      return;
    }

    showScreen('loading');

    try {
      const lessonData = await generateLesson(
        state.currentCategory.label,
        state.currentTopic.label,
        level
      );

      if (!lessonData.facts || !lessonData.questions ||
          lessonData.facts.length < 3 || lessonData.questions.length < 2) {
        throw new Error('Invalid lesson data structure');
      }

      state.lessonData = lessonData;
      state.lessonCache[cacheKey] = lessonData;
      state.totalQuestions = lessonData.questions.length;

      const phrasesToPreload = lessonData.facts.slice(0, 3).map(f => f.text);
      Audio.preloadTTS(phrasesToPreload, 'he-IL');

      showLesson();
    } catch (err) {
      console.error('[KnowledgeTutor] Lesson generation failed:', err);
      showScreen('error');
    }
  }

  // ===== LESSON SCREEN =====
  function showLesson() {
    showScreen('lesson');
    showFact(0);
  }

  async function showFact(index) {
    state.factIndex = index;
    const facts = state.lessonData.facts;
    const fact = facts[index];

    const progress = ((index + 1) / facts.length) * 100;
    els.lessonProgressFill.style.width = `${progress}%`;
    els.lessonProgressLabel.textContent = `${index + 1} / ${facts.length}`;

    els.factCard.classList.remove('animate-fade-up');
    void els.factCard.offsetWidth;
    els.factCard.classList.add('animate-fade-up');

    els.factEmoji.textContent = fact.emoji;
    els.factText.textContent = fact.text;

    const isLast = index === facts.length - 1;
    els.lessonNextBtn.textContent = isLast ? '🎯 בואו לחידון!' : 'הבא ➡️';

    await Audio.speak(fact.text, 0.8, 'he-IL');

    if (index + 1 < facts.length) {
      Audio.preloadTTS([facts[index + 1].text], 'he-IL');
    }
    if (isLast && state.lessonData.questions.length > 0) {
      Audio.preloadTTS([state.lessonData.questions[0].question], 'he-IL');
    }
  }

  function advanceFact() {
    Audio.SFX.tap();
    if (typeof GeminiTTS !== 'undefined') GeminiTTS.stop();

    const nextIndex = state.factIndex + 1;
    if (nextIndex < state.lessonData.facts.length) {
      showFact(nextIndex);
    } else {
      startQuiz();
    }
  }

  // ===== QUIZ SCREEN =====
  function startQuiz() {
    state.questionIndex = 0;
    state.score = 0;
    showScreen('quiz');
    showQuestion(0);
  }

  async function showQuestion(index) {
    state.questionIndex = index;
    state.inputLocked = false;
    const questions = state.lessonData.questions;
    const q = questions[index];

    const progress = ((index + 1) / questions.length) * 100;
    els.quizProgressFill.style.width = `${progress}%`;
    els.quizProgressLabel.textContent = `שאלה ${index + 1} מתוך ${questions.length}`;

    els.quizQuestionText.textContent = q.question;

    els.quizFeedback.textContent = '';
    els.quizFeedback.className = 'quiz-feedback';

    els.quizChoices.innerHTML = '';
    q.choices.forEach((choice, i) => {
      const btn = document.createElement('button');
      btn.className = 'card quiz-choice-btn animate-fade-up';
      btn.style.animationDelay = `${i * 80}ms`;
      btn.textContent = choice;
      btn.dataset.choiceIndex = i;
      els.quizChoices.appendChild(btn);
    });

    await Audio.speak(q.question, 0.8, 'he-IL');

    if (index + 1 < questions.length) {
      Audio.preloadTTS([questions[index + 1].question], 'he-IL');
    }
  }

  async function handleAnswer(choiceIndex) {
    if (state.inputLocked) return;
    state.inputLocked = true;

    const q = state.lessonData.questions[state.questionIndex];
    const isCorrect = choiceIndex === q.correctIndex;
    const buttons = els.quizChoices.querySelectorAll('.quiz-choice-btn');

    if (isCorrect) {
      state.score++;
      Audio.SFX.correct();
      buttons[choiceIndex].classList.add('correct');
      els.quizFeedback.textContent = 'נכון! כל הכבוד!';
      els.quizFeedback.className = 'quiz-feedback correct';

      const rect = buttons[choiceIndex].getBoundingClientRect();
      Particles.sparkle(
        rect.left + rect.width / 2,
        rect.top + rect.height / 2,
        10, '#4ade80'
      );

      await Audio.speak('כל הכבוד!', 0.9, 'he-IL');
    } else {
      Audio.SFX.wrong();
      buttons[choiceIndex].classList.add('wrong');
      buttons[q.correctIndex].classList.add('correct');
      els.quizFeedback.textContent = `התשובה הנכונה: ${q.choices[q.correctIndex]}`;
      els.quizFeedback.className = 'quiz-feedback wrong';

      await Audio.speak('לא נורא, בפעם הבאה!', 0.9, 'he-IL');
    }

    buttons.forEach(btn => btn.disabled = true);

    await Utils.wait(2000);

    const nextIndex = state.questionIndex + 1;
    if (nextIndex < state.lessonData.questions.length) {
      showQuestion(nextIndex);
    } else {
      showResults();
    }
  }

  // ===== RESULTS SCREEN =====
  async function showResults() {
    const score = state.score;
    const total = state.totalQuestions;
    const percentage = Math.round((score / total) * 100);

    if (percentage >= 50) {
      markLevelCompleted(state.currentCategory.id, state.currentTopic.id, state.currentLevel);
      Energy.earnMinutes(1);
    }

    showScreen('results');

    const isGreat = percentage >= 75;
    const isOk = percentage >= 50;

    els.resultsEmoji.textContent = isGreat ? '🌟' : isOk ? '👏' : '💪';
    els.resultsTitle.textContent = isGreat ? 'מדהים!' : isOk ? 'כל הכבוד!' : 'יופי שניסית!';

    els.resultsScore.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const star = document.createElement('span');
      star.className = `result-star ${i < score ? 'earned animate-star-collect' : 'empty'}`;
      star.textContent = i < score ? '⭐' : '☆';
      if (i < score) {
        star.style.animationDelay = `${i * 200}ms`;
      }
      els.resultsScore.appendChild(star);
    }

    els.resultsMessage.textContent = `ענית נכון על ${score} מתוך ${total} שאלות`;

    if (isGreat) {
      Audio.SFX.celebration();
      Particles.confetti(60);
      await Audio.speak('מדהים! כל הכבוד!', 0.8, 'he-IL');
    } else if (isOk) {
      Audio.SFX.fanfare();
      Particles.sparkle(window.innerWidth / 2, window.innerHeight / 3, 20);
      await Audio.speak('כל הכבוד!', 0.8, 'he-IL');
    } else {
      Audio.SFX.star();
      await Audio.speak('יופי שניסית! בואו ננסה שוב!', 0.8, 'he-IL');
    }
  }

  // ===== EVENT BINDING =====
  function bindEvents() {
    document.addEventListener('click', () => Audio.init(), { once: true });

    els.categoryGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.category-card');
      if (!card) return;
      Audio.SFX.tap();
      const category = getCategoryById(card.dataset.categoryId);
      if (category) renderTopics(category);
    });

    els.topicGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.topic-card');
      if (!card) return;
      Audio.SFX.tap();
      const topic = getTopicById(state.currentCategory.id, card.dataset.topicId);
      if (topic) renderLevelSelect(topic);
    });

    els.topicsBackBtn.addEventListener('click', () => {
      Audio.SFX.tap();
      if (typeof GeminiTTS !== 'undefined') GeminiTTS.stop();
      renderCategories();
      showScreen('home');
    });

    els.levelGrid.addEventListener('click', (e) => {
      const card = e.target.closest('.level-card');
      if (!card || card.disabled) return;
      Audio.SFX.tap();
      startLevel(parseInt(card.dataset.level, 10));
    });

    els.levelBackBtn.addEventListener('click', () => {
      Audio.SFX.tap();
      renderTopics(state.currentCategory);
    });

    els.lessonReplayBtn.addEventListener('click', () => {
      Audio.SFX.tap();
      if (typeof GeminiTTS !== 'undefined') GeminiTTS.stop();
      const fact = state.lessonData.facts[state.factIndex];
      if (fact) Audio.speak(fact.text, 0.8, 'he-IL');
    });

    els.lessonNextBtn.addEventListener('click', advanceFact);

    els.lessonBackBtn.addEventListener('click', () => {
      Audio.SFX.tap();
      if (typeof GeminiTTS !== 'undefined') GeminiTTS.stop();
      renderLevelSelect(state.currentTopic);
    });

    els.quizChoices.addEventListener('click', (e) => {
      const btn = e.target.closest('.quiz-choice-btn');
      if (!btn) return;
      handleAnswer(parseInt(btn.dataset.choiceIndex, 10));
    });

    els.resultsTopicsBtn.addEventListener('click', () => {
      Audio.SFX.tap();
      renderTopics(state.currentCategory);
    });

    els.resultsHomeBtn.addEventListener('click', () => {
      Audio.SFX.tap();
      window.location.href = '../../index.html';
    });

    els.errorRetryBtn.addEventListener('click', () => {
      Audio.SFX.tap();
      if (state.currentTopic && state.currentLevel) {
        startLevel(state.currentLevel);
      } else {
        showScreen('home');
      }
    });

    els.errorHomeBtn.addEventListener('click', () => {
      Audio.SFX.tap();
      window.location.href = '../../index.html';
    });
  }

  // ===== BOOTSTRAP =====
  init();

  return {};
})();
