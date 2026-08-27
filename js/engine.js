// Shared game engine used by all three modules (alphabet / numbers / vocabulary).
// Handles: speech synthesis (with iOS-safe voice loading + graceful fallback),
// round/score bookkeeping, confetti, stickers (localStorage), and the shared modals.

const Engine = (() => {
  const ROUNDS_PER_GAME = 10;
  const STICKER_EMOJIS = ['⭐', '🌟', '🏆', '🎈', '🍭', '🌈', '🦄', '🎁', '🥇', '💎'];

  let voices = [];
  let voicesReady = false;

  function loadVoices() {
    voices = speechSynthesis.getVoices();
    if (voices.length) voicesReady = true;
  }
  if ('speechSynthesis' in window) {
    loadVoices();
    speechSynthesis.onvoiceschanged = loadVoices;
  }

  // Prefer a young/female-sounding voice for the given BCP-47 locale prefix (e.g. "ms", "en", "ar").
  // Falls back to any voice for that language, then to nothing (browser default) rather than failing.
  function pickVoice(langPrefix) {
    if (!voices.length) loadVoices();
    const forLang = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));
    if (!forLang.length) return null;
    const femaleHints = ['female', 'woman', 'girl', 'samantha', 'victoria', 'karen', 'moira', 'zira', 'susan', 'yasmin', 'salma', 'amira', 'kids', 'child'];
    const female = forLang.find(v => femaleHints.some(hint => v.name.toLowerCase().includes(hint)));
    if (female) return female;
    const notMale = forLang.find(v => !/male|man/i.test(v.name));
    return notMale || forLang[0];
  }

  const LANG_MAP = { en: 'en-US', ms: 'ms-MY', ar: 'ar-SA' };

  function speak(text, langCode, opts = {}) {
    if (!('speechSynthesis' in window) || !text) return;
    const u = new SpeechSynthesisUtterance(text);
    u.lang = LANG_MAP[langCode] || langCode;
    u.pitch = opts.pitch ?? 1.5;
    u.rate = opts.rate ?? 0.85;
    u.volume = 1.0;
    const voice = pickVoice(langCode);
    if (voice) u.voice = voice;
    // Only cancel leftover speech when starting something fresh (a new round/prompt).
    // A cancel() fired right before a speak() that's meant to play right after another
    // utterance (e.g. the praise phrase following the answer) is a known iOS Safari trap:
    // cancel+speak in quick succession can leave the synth stuck and silently drop audio.
    // Follow-up utterances (opts.queue) skip cancel() and just queue normally instead.
    if (!opts.queue) speechSynthesis.cancel();
    speechSynthesis.speak(u);
    return u;
  }

  function speakQueue(items) {
    // items: [{text, lang, pitch, rate, delay}] spoken in sequence via chained timeouts
    let t = 0;
    items.forEach(it => {
      t += it.delay || 0;
      setTimeout(() => speak(it.text, it.lang, it), t);
    });
  }

  // --- Stickers (persisted meta-progression) ---
  function getStickers() {
    try {
      return JSON.parse(localStorage.getItem('ceria_stickers') || '[]');
    } catch (e) { return []; }
  }
  function awardSticker() {
    const stickers = getStickers();
    const sticker = STICKER_EMOJIS[Math.floor(Math.random() * STICKER_EMOJIS.length)];
    stickers.push(sticker);
    try { localStorage.setItem('ceria_stickers', JSON.stringify(stickers)); } catch (e) {}
    return sticker;
  }
  function stickerCount() {
    try { return getStickers().length; } catch (e) { return 0; }
  }

  // --- Chimes (WebAudio sound effects, no audio files) ---
  let audioCtx = null;
  function getAudioCtx() {
    if (!audioCtx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioCtx = new AC();
    }
    if (audioCtx.state === 'suspended') audioCtx.resume();
    return audioCtx;
  }
  function tone(ctx, freq, startAt, duration, opts = {}) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = opts.type || 'sine';
    osc.frequency.setValueAtTime(freq, startAt);
    gain.gain.setValueAtTime(0, startAt);
    gain.gain.linearRampToValueAtTime(opts.peak ?? 0.22, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(startAt);
    osc.stop(startAt + duration + 0.02);
  }
  // kind: 'flip' | 'match' | 'miss'
  function playChime(kind) {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const now = ctx.currentTime;
    if (kind === 'flip') {
      tone(ctx, 660, now, 0.12, { peak: 0.15 });
    } else if (kind === 'match') {
      tone(ctx, 523.25, now, 0.16);       // C5
      tone(ctx, 659.25, now + 0.1, 0.16); // E5
      tone(ctx, 783.99, now + 0.2, 0.28); // G5
    } else if (kind === 'miss') {
      tone(ctx, 349.23, now, 0.18, { type: 'triangle', peak: 0.16 });      // F4
      tone(ctx, 293.66, now + 0.14, 0.22, { type: 'triangle', peak: 0.16 }); // D4
    }
  }

  // --- Confetti ---
  function confetti(container) {
    const colors = ['#FF8A5B', '#3FB6D3', '#FFC93C', '#4CAF7D', '#F0567A'];
    for (let i = 0; i < 36; i++) {
      const piece = document.createElement('div');
      piece.className = 'confetti-piece';
      piece.style.left = Math.random() * 100 + '%';
      piece.style.background = colors[Math.floor(Math.random() * colors.length)];
      piece.style.animationDelay = (Math.random() * 0.4) + 's';
      piece.style.animationDuration = (1.6 + Math.random() * 1.2) + 's';
      piece.style.transform = `rotate(${Math.random() * 360}deg)`;
      container.appendChild(piece);
      setTimeout(() => piece.remove(), 3200);
    }
  }

  // --- Round runner ---
  // config: { data, roundsPerGame, buildChoiceLabel(item), isMatch(item, chosenItem), onRound(item, roundIndex), onEnd(score) }
  function createRound(data) {
    return data[Math.floor(Math.random() * data.length)];
  }

  function pickTwo(data, current) {
    const distractor = data[Math.floor(Math.random() * data.length)];
    return [current, distractor].sort(() => Math.random() - 0.5);
  }

  // --- Praise picker: random phrase from PRAISES[lang], avoiding immediate repeats ---
  const lastPraiseByLang = {};
  function randomPraise(langCode) {
    // PRAISES comes from js/data/praises.js as a top-level `const`, which does NOT attach to
    // `window` in a classic script — only `typeof` against the bare identifier is safe here.
    const pool = (typeof PRAISES !== 'undefined' && PRAISES[langCode]) || [];
    if (!pool.length) return null;
    let choice = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) {
      while (choice === lastPraiseByLang[langCode]) {
        choice = pool[Math.floor(Math.random() * pool.length)];
      }
    }
    lastPraiseByLang[langCode] = choice;
    return choice;
  }
  function speakPraise(langCode, opts = {}) {
    const phrase = randomPraise(langCode);
    if (phrase) speak(phrase, langCode, { pitch: 1.6, rate: 0.95, queue: true, ...opts });
    return phrase;
  }

  return {
    ROUNDS_PER_GAME,
    speak, speakQueue,
    randomPraise, speakPraise,
    getStickers, awardSticker, stickerCount,
    confetti, playChime,
    createRound, pickTwo
  };
})();
