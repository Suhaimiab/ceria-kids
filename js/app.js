// Router + the three module game controllers. Vanilla JS, no build step, no frameworks.
(function () {
  'use strict';

  const ROUNDS = Engine.ROUNDS_PER_GAME;
  let activeModule = null; // 'alphabet' | 'numbers' | 'vocabulary'
  let quitTargetScore = 0;

  // ---------- View / routing ----------
  function showView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById('view-' + id).classList.add('active');
  }

  function goHome() {
    activeModule = null;
    showView('home');
    speechSynthesis && speechSynthesis.cancel();
    renderStickerBadge();
  }

  function renderStickerBadge() {
    document.getElementById('stickerCount').textContent = Engine.stickerCount();
  }

  function renderPips(containerId, filledCount) {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    for (let i = 0; i < ROUNDS; i++) {
      const pip = document.createElement('div');
      pip.className = 'pip' + (i < filledCount ? ' filled' : '');
      el.appendChild(pip);
    }
  }

  function celebrate(count, mascotMood, text) {
    quitTargetScore = 0;
    document.getElementById('celebrateText').textContent = text;
    const sticker = Engine.awardSticker();
    document.getElementById('stickerEarned').textContent = sticker;
    renderStickerBadge();
    showView('celebrate');
    mountMascot('mascotCelebrate');
    setTimeout(() => reactMascot('mascotCelebrate', 'right'), 150);
    const layer = document.createElement('div');
    layer.className = 'confetti-layer';
    document.body.appendChild(layer);
    Engine.confetti(layer);
    setTimeout(() => layer.remove(), 3400);
  }

  // ---------- Shared quit modal ----------
  function openQuitModal(getScore) {
    quitTargetScore = getScore();
    document.getElementById('quitScore').textContent = quitTargetScore;
    document.getElementById('quitModal').classList.add('show');
  }
  function closeQuitModal() {
    document.getElementById('quitModal').classList.remove('show');
  }
  document.getElementById('keepPlayingBtn').addEventListener('click', closeQuitModal);
  document.getElementById('confirmQuitBtn').addEventListener('click', () => {
    closeQuitModal();
    goHome();
  });

  // ============================================================
  // ALPHABET MODULE
  // ============================================================
  const AlphabetGame = (() => {
    let lang = 'en';
    let data = ALPHABET_EN;
    let current = null;
    let correctCount = 0;
    let lock = false;

    const COPY = {
      en: { title: '🔤 Alphabet', prompt: 'Find the picture for:', correct: 'Perfect!', tryAgain: 'Try again!', connector: ' is for ', end: 'You learned the alphabet! Amazing work!' },
      ms: { title: '🔤 Huruf', prompt: 'Cari gambar untuk:', correct: 'Sempurna!', tryAgain: 'Cuba lagi!', connector: ' untuk ', end: 'Anda hebat belajar huruf!' }
    };

    function setLang(l) {
      lang = l;
      data = l === 'ms' ? ALPHABET_MS : ALPHABET_EN;
      document.querySelectorAll('#alphaLangSwitch .lang-btn').forEach(b => b.classList.toggle('active', b.dataset.lang === l));
      document.getElementById('alphaTitle').textContent = COPY[l].title;
      document.getElementById('alphaPromptLabel').textContent = COPY[l].prompt;
      restart();
    }

    function restart() {
      correctCount = 0;
      lock = false;
      renderPips('alphaPips', 0);
      document.getElementById('alphaFeedback').textContent = '';
      next();
    }

    function next() {
      if (correctCount >= ROUNDS) return end();
      current = Engine.createRound(data);
      document.getElementById('alphaLetter').textContent = current.letter;
      document.getElementById('alphaFeedback').textContent = '';
      renderChoices();
    }

    function renderChoices() {
      const opts = Engine.pickTwo(data, current);
      const box = document.getElementById('alphaChoices');
      box.innerHTML = '';
      opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'choice';
        btn.innerHTML = '<span class="choice-emoji">' + opt.emoji + '</span><span class="choice-text">' + opt.word + '</span>';
        btn.addEventListener('click', () => check(opt, btn));
        box.appendChild(btn);
      });
    }

    function check(opt, btn) {
      if (lock) return;
      const c = COPY[lang];
      if (opt.emoji === current.emoji) {
        lock = true;
        btn.classList.add('correct');
        correctCount++;
        renderPips('alphaPips', correctCount);
        document.getElementById('alphaFeedback').textContent = c.correct;
        reactMascot('mascotHome', 'right');
        Engine.speak(current.letter + c.connector + current.word, lang, { delay: 0 });
        setTimeout(() => Engine.speakPraise(lang), 1300);
        setTimeout(next, 2400);
        lock = true;
        setTimeout(() => { lock = false; }, 2400);
      } else {
        btn.classList.add('wrong');
        document.getElementById('alphaFeedback').textContent = c.tryAgain;
        setTimeout(() => btn.classList.remove('wrong'), 550);
      }
    }

    function end() {
      const c = COPY[lang];
      celebrate(correctCount, 'right', c.end);
    }

    function init() {
      document.querySelectorAll('#alphaLangSwitch .lang-btn').forEach(b => {
        b.addEventListener('click', () => setLang(b.dataset.lang));
      });
      document.querySelector('[data-quit="alphabet"]').addEventListener('click', () => openQuitModal(() => correctCount));
    }

    return { init, start: () => setLang(lang) };
  })();

  // ============================================================
  // NUMBERS MODULE
  // ============================================================
  const NumbersGame = (() => {
    let current = null;
    let correctCount = 0;
    let lock = false;

    function buildLangRow() {
      const row = document.getElementById('numLangRow');
      row.innerHTML = `
        <button class="lang-btn en" data-lang="en">🇬🇧<span>English</span><span class="spelling" id="spell-en"></span></button>
        <button class="lang-btn ar" data-lang="ar">🇸🇦<span>عربي</span><span class="spelling ar-text" id="spell-ar"></span></button>
        <button class="lang-btn ms" data-lang="ms">🇲🇾<span>Melayu</span><span class="spelling" id="spell-ms"></span></button>`;
      row.querySelectorAll('.lang-btn').forEach(b => {
        b.addEventListener('click', () => Engine.speak(current[b.dataset.lang], b.dataset.lang, { pitch: 1.5, rate: 0.9 }));
      });
    }

    function restart() {
      correctCount = 0;
      lock = false;
      renderPips('numPips', 0);
      document.getElementById('numFeedback').textContent = '';
      next();
    }

    function next() {
      if (correctCount >= ROUNDS) return end();
      current = Engine.createRound(NUMBERS);
      document.getElementById('numDisplay').textContent = current.n;
      document.getElementById('spell-en').textContent = current.en;
      document.getElementById('spell-ar').textContent = current.ar;
      document.getElementById('spell-ms').textContent = current.ms;
      document.getElementById('numFeedback').textContent = '';
      renderChoices();
      Engine.speak(current.en, 'en', { pitch: 1.5, rate: 0.9, delay: 250 });
    }

    function renderChoices() {
      const opts = Engine.pickTwo(NUMBERS, current);
      const box = document.getElementById('numChoices');
      box.innerHTML = '';
      opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'choice';
        btn.innerHTML = '<span class="choice-emoji">' + opt.n + '</span>';
        btn.addEventListener('click', () => check(opt, btn));
        box.appendChild(btn);
      });
    }

    function check(opt, btn) {
      if (lock) return;
      if (opt.n === current.n) {
        lock = true;
        btn.classList.add('correct');
        correctCount++;
        renderPips('numPips', correctCount);
        document.getElementById('numFeedback').textContent = 'Correct! 🎉';
        reactMascot('mascotHome', 'right');
        Engine.speakPraise('en');
        setTimeout(next, 1800);
        setTimeout(() => { lock = false; }, 1800);
      } else {
        btn.classList.add('wrong');
        document.getElementById('numFeedback').textContent = 'Try again!';
        setTimeout(() => btn.classList.remove('wrong'), 550);
      }
    }

    function end() {
      celebrate(correctCount, 'right', 'You counted like a champion — 1 to 20!');
    }

    function init() {
      buildLangRow();
      document.querySelector('[data-quit="numbers"]').addEventListener('click', () => openQuitModal(() => correctCount));
    }

    return { init, start: restart };
  })();

  // ============================================================
  // VOCABULARY MODULE
  // ============================================================
  const VocabGame = (() => {
    let current = null;
    let correctCount = 0;
    let lock = false;

    function buildLangRow() {
      const row = document.getElementById('vocLangRow');
      row.innerHTML = `
        <button class="lang-btn en" data-lang="en">🇬🇧<span>English</span><span class="spelling" id="vspell-en"></span></button>
        <button class="lang-btn ar" data-lang="ar">🇸🇦<span>عربي</span><span class="spelling ar-text" id="vspell-ar"></span></button>
        <button class="lang-btn ms" data-lang="ms">🇲🇾<span>Melayu</span><span class="spelling" id="vspell-ms"></span></button>`;
      row.querySelectorAll('.lang-btn').forEach(b => {
        b.addEventListener('click', () => Engine.speak(current[b.dataset.lang], b.dataset.lang, { pitch: 1.5, rate: 0.9 }));
      });
    }

    function restart() {
      correctCount = 0;
      lock = false;
      renderPips('vocPips', 0);
      document.getElementById('vocFeedback').textContent = '';
      next();
    }

    function next() {
      if (correctCount >= ROUNDS) return end();
      current = Engine.createRound(VOCABULARY);
      document.getElementById('vocDisplay').textContent = current.e;
      document.getElementById('vspell-en').textContent = current.en;
      document.getElementById('vspell-ar').textContent = current.ar;
      document.getElementById('vspell-ms').textContent = current.ms;
      document.getElementById('vocFeedback').textContent = '';
      renderChoices();
      Engine.speak(current.en, 'en', { pitch: 1.5, rate: 0.9, delay: 250 });
    }

    function renderChoices() {
      const opts = Engine.pickTwo(VOCABULARY, current);
      const box = document.getElementById('vocChoices');
      box.innerHTML = '';
      opts.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'choice';
        btn.innerHTML = '<span class="choice-emoji">' + opt.e + '</span>';
        btn.addEventListener('click', () => check(opt, btn));
        box.appendChild(btn);
      });
    }

    function check(opt, btn) {
      if (lock) return;
      if (opt.e === current.e) {
        lock = true;
        btn.classList.add('correct');
        correctCount++;
        renderPips('vocPips', correctCount);
        document.getElementById('vocFeedback').textContent = 'Great! 🎉';
        reactMascot('mascotHome', 'right');
        Engine.speakPraise('en');
        setTimeout(next, 1800);
        setTimeout(() => { lock = false; }, 1800);
      } else {
        btn.classList.add('wrong');
        document.getElementById('vocFeedback').textContent = 'Try again!';
        setTimeout(() => btn.classList.remove('wrong'), 550);
      }
    }

    function end() {
      celebrate(correctCount, 'right', 'Look at all those new words you know!');
    }

    function init() {
      buildLangRow();
      document.querySelector('[data-quit="vocabulary"]').addEventListener('click', () => openQuitModal(() => correctCount));
    }

    return { init, start: restart };
  })();

  const MODULES = { alphabet: AlphabetGame, numbers: NumbersGame, vocabulary: VocabGame };

  // ---------- Wiring ----------
  document.addEventListener('DOMContentLoaded', () => {
    mountMascot('mascotHome');
    renderStickerBadge();

    AlphabetGame.init();
    NumbersGame.init();
    VocabGame.init();

    document.querySelectorAll('.module-card').forEach(card => {
      card.addEventListener('click', () => {
        const mod = card.dataset.module;
        activeModule = mod;
        const names = { alphabet: 'Alphabet', numbers: 'Numbers', vocabulary: 'Words' };
        Engine.speak(names[mod] + '!', 'en', { pitch: 1.6, rate: 1.0 });
        showView(mod);
        MODULES[mod].start();
      });
    });

    document.querySelectorAll('[data-home]').forEach(btn => btn.addEventListener('click', goHome));

    document.getElementById('playAgainBtn').addEventListener('click', () => {
      if (!activeModule) return goHome();
      showView(activeModule);
      MODULES[activeModule].start();
    });
    document.getElementById('homeFromCelebrateBtn').addEventListener('click', goHome);
  });
})();
