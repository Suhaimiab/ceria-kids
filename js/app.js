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
    renderPipsN(containerId, filledCount, ROUNDS);
  }

  function renderPipsN(containerId, filledCount, total) {
    const el = document.getElementById(containerId);
    el.innerHTML = '';
    for (let i = 0; i < total; i++) {
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
        reactMascot('mascotAlpha', 'right');
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
        reactMascot('mascotNumbers', 'right');
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
        reactMascot('mascotVocab', 'right');
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

  // ============================================================
  // TRACE MODULE (dot-to-dot letters & numbers)
  // ============================================================
  const TraceGame = (() => {
    let mode = 'letters';
    let shapes = null;
    let idx = 0;
    let tracer = null;

    function setMode(m) {
      mode = m;
      shapes = m === 'letters' ? TRACE_LETTERS : TRACE_NUMBERS;
      document.querySelectorAll('#traceModeSwitch .lang-btn').forEach(b => b.classList.toggle('active', b.dataset.mode === m));
      restart();
    }

    function restart() {
      idx = 0;
      document.getElementById('traceFeedback').textContent = '';
      loadShape();
    }

    function loadShape() {
      if (idx >= shapes.length) return end();
      const shape = shapes[idx];
      document.getElementById('traceTitle').textContent = '✏️ Trace — ' + (idx + 1) + ' / ' + shapes.length;
      document.getElementById('tracePromptLabel').textContent = 'Connect the dots for ' + shape.label + '!';
      document.getElementById('traceFeedback').textContent = '';
      if (tracer) tracer.destroy();
      const svg = document.getElementById('traceSvg');
      tracer = createTracer(svg, shape, { onComplete: () => onShapeComplete(shape) });
    }

    function onShapeComplete(shape) {
      document.getElementById('traceFeedback').textContent = 'Yes! That says ' + shape.label + '!';
      reactMascot('mascotTrace', 'right');
      Engine.speak(shape.label, 'en', { pitch: 1.6, rate: 0.8 });
      setTimeout(() => Engine.speakPraise('en'), 1100);
      idx++;
      setTimeout(loadShape, 2200);
    }

    function end() {
      if (tracer) { tracer.destroy(); tracer = null; }
      const label = mode === 'letters' ? 'the whole alphabet' : 'all the numbers';
      celebrate(shapes.length, 'right', 'You traced ' + label + '! Amazing hands!');
    }

    function init() {
      document.querySelectorAll('#traceModeSwitch .lang-btn').forEach(b => {
        b.addEventListener('click', () => setMode(b.dataset.mode));
      });
      document.querySelector('[data-quit="trace"]').addEventListener('click', () => openQuitModal(() => idx));
    }

    return { init, start: () => setMode(mode) };
  })();

  // ============================================================
  // MEMORY MATCH MODULE (mixed letters & numbers)
  // ============================================================
  const MemoryGame = (() => {
    const PAIRS_PER_ROUND = 4;
    const TOTAL_ROUNDS = 3;
    const TOTAL_PIPS = PAIRS_PER_ROUND * TOTAL_ROUNDS;

    let roundIndex = 0;
    let pairsMatched = 0;
    let firstCard = null;
    let lock = false;

    function shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    function pickRoundSymbols() {
      return shuffle(MEMORY_SYMBOLS).slice(0, PAIRS_PER_ROUND);
    }

    function restart() {
      roundIndex = 0;
      pairsMatched = 0;
      lock = false;
      firstCard = null;
      renderPipsN('memPips', 0, TOTAL_PIPS);
      document.getElementById('memoryFeedback').textContent = '';
      loadRound();
    }

    function loadRound() {
      if (roundIndex >= TOTAL_ROUNDS) return end();
      firstCard = null;
      lock = false;
      document.getElementById('memoryFeedback').textContent = '';
      const symbols = pickRoundSymbols();
      const deck = shuffle(symbols.concat(symbols));
      const box = document.getElementById('memGrid');
      box.innerHTML = '';
      deck.forEach(symbol => {
        const btn = document.createElement('button');
        btn.className = 'memory-card';
        btn.innerHTML =
          '<div class="memory-card-inner">' +
            '<div class="memory-card-face memory-card-back">🪶</div>' +
            '<div class="memory-card-face memory-card-front"></div>' +
          '</div>';
        btn.querySelector('.memory-card-front').textContent = symbol.s;
        btn.addEventListener('click', () => flip(symbol, btn));
        box.appendChild(btn);
      });
    }

    function flip(symbol, btn) {
      if (lock || btn.classList.contains('flipped') || btn.classList.contains('matched')) return;
      btn.classList.add('flipped');
      Engine.playChime('flip');
      Engine.speak(symbol.speak, 'en', { pitch: 1.6, rate: 0.85 });

      if (!firstCard) {
        firstCard = { symbol, btn };
        return;
      }

      lock = true;
      const second = { symbol, btn };
      if (firstCard.symbol.s === second.symbol.s) {
        firstCard.btn.classList.add('matched');
        second.btn.classList.add('matched');
        Engine.playChime('match');
        reactMascot('mascotMemory', 'right');
        pairsMatched++;
        renderPipsN('memPips', pairsMatched, TOTAL_PIPS);
        document.getElementById('memoryFeedback').textContent = 'Match!';
        setTimeout(() => Engine.speakPraise('en'), 500);
        firstCard = null;
        const roundDone = pairsMatched === (roundIndex + 1) * PAIRS_PER_ROUND;
        setTimeout(() => {
          lock = false;
          if (roundDone) { roundIndex++; loadRound(); }
        }, 1600);
      } else {
        Engine.playChime('miss');
        firstCard.btn.classList.add('wrong');
        second.btn.classList.add('wrong');
        document.getElementById('memoryFeedback').textContent = 'Try again!';
        setTimeout(() => {
          firstCard.btn.classList.remove('flipped', 'wrong');
          second.btn.classList.remove('flipped', 'wrong');
          document.getElementById('memoryFeedback').textContent = '';
          firstCard = null;
          lock = false;
        }, 900);
      }
    }

    function end() {
      celebrate(pairsMatched, 'right', 'You matched them all! Super memory, Safeera!');
    }

    function init() {
      document.querySelector('[data-quit="memory"]').addEventListener('click', () => openQuitModal(() => pairsMatched));
    }

    return { init, start: restart };
  })();

  const MODULES = { alphabet: AlphabetGame, numbers: NumbersGame, vocabulary: VocabGame, trace: TraceGame, memory: MemoryGame };

  // ---------- Wiring ----------
  document.addEventListener('DOMContentLoaded', () => {
    mountMascot('mascotHome');
    mountMascot('mascotAlpha', 'small');
    mountMascot('mascotNumbers', 'small');
    mountMascot('mascotVocab', 'small');
    mountMascot('mascotTrace', 'small');
    mountMascot('mascotMemory', 'small');
    renderStickerBadge();

    AlphabetGame.init();
    NumbersGame.init();
    VocabGame.init();
    TraceGame.init();
    MemoryGame.init();

    document.querySelectorAll('.module-card').forEach(card => {
      card.addEventListener('click', () => {
        const mod = card.dataset.module;
        activeModule = mod;
        const names = { alphabet: 'Alphabet', numbers: 'Numbers', vocabulary: 'Words', trace: 'Trace', memory: 'Memory' };
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
