// Kiki the parakeet — the app's one signature visual element, reused everywhere.
// Plain inline SVG so it needs no image requests and can be recolored/animated via CSS classes.
const MASCOT_SVG = `
<svg viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <ellipse cx="60" cy="98" rx="26" ry="6" fill="#3A2E2A" opacity="0.08"/>
  <path d="M60 20 C86 20 100 42 96 66 C93 86 78 100 60 100 C42 100 27 86 24 66 C20 42 34 20 60 20 Z" fill="#4CAF7D"/>
  <path d="M60 20 C74 20 85 30 90 44 C78 38 68 36 60 36 C52 36 42 38 30 44 C35 30 46 20 60 20 Z" fill="#FFC93C"/>
  <circle cx="46" cy="58" r="8" fill="#fff"/>
  <circle cx="47" cy="59" r="4.2" fill="#3A2E2A"/>
  <circle cx="74" cy="58" r="8" fill="#fff"/>
  <circle cx="75" cy="59" r="4.2" fill="#3A2E2A"/>
  <path d="M56 68 L64 68 L60 76 Z" fill="#FF8A5B"/>
  <path d="M18 62 C10 60 8 70 16 74 C22 77 30 74 30 68 C30 64 24 63 18 62 Z" fill="#3FB6D3"/>
  <path d="M102 62 C110 60 112 70 104 74 C98 77 90 74 90 68 C90 64 96 63 102 62 Z" fill="#3FB6D3"/>
</svg>`;

function mountMascot(containerId, size) {
  const el = document.getElementById(containerId);
  if (!el) return;
  el.innerHTML = MASCOT_SVG;
  el.querySelector('svg').classList.add('mascot');
  if (size === 'small') el.querySelector('svg').classList.add('small');
  return el.querySelector('svg');
}

function reactMascot(containerId, mood) {
  const svg = document.querySelector('#' + containerId + ' svg');
  if (!svg) return;
  svg.classList.remove('cheer', 'oops');
  void svg.offsetWidth; // restart animation
  svg.classList.add(mood === 'wrong' ? 'oops' : 'cheer');
}
