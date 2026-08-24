// Dot-to-dot tracer: renders a shape's strokes as numbered dots inside an SVG (viewBox "0 0 100 100")
// and lets the child connect them in order by tapping or dragging. Multi-stroke letters require a
// fresh touch near each new stroke's first dot (a natural "pen lift"), everything else is forgiving —
// a lifted finger doesn't erase progress, and the next touch anywhere near the next dot resumes it.
const SVG_NS = 'http://www.w3.org/2000/svg';
const TRACE_TOLERANCE = 13; // grid units (0-100 scale) — generous for small, imprecise fingers

function createTracer(svgEl, shape, opts) {
  const onComplete = opts.onComplete || function () {};
  let strokeIdx = 0;
  let pointIdx = 0; // next expected point index within the current stroke
  let drawing = false;
  let currentPathEl = null;
  let currentD = '';

  function clear() {
    while (svgEl.firstChild) svgEl.removeChild(svgEl.firstChild);
  }

  function svgPointFromClient(clientX, clientY) {
    const rect = svgEl.getBoundingClientRect();
    return {
      x: ((clientX - rect.left) / rect.width) * 100,
      y: ((clientY - rect.top) / rect.height) * 100
    };
  }

  function dist(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y);
  }

  function makeEl(tag, attrs) {
    const el = document.createElementNS(SVG_NS, tag);
    Object.keys(attrs).forEach(k => el.setAttribute(k, attrs[k]));
    return el;
  }

  let globalDotNumber = 0;
  const dotEls = []; // flat list aligned to (strokeIdx, pointIdx) via dotIndexMap
  const dotIndexMap = []; // dotIndexMap[strokeIdx][pointIdx] -> index into dotEls
  const COINCIDENT_EPSILON = 1.5; // grid units — dots this close are treated as the same spot

  function findCoincident(p) {
    for (let i = 0; i < dotEls.length; i++) {
      const d = dotEls[i];
      if (Math.hypot(d.__x - p.x, d.__y - p.y) <= COINCIDENT_EPSILON) return i;
    }
    return -1;
  }

  function render() {
    clear();
    svgEl.classList.remove('trace-solved');
    globalDotNumber = 0;
    dotEls.length = 0;
    dotIndexMap.length = 0;

    shape.strokes.forEach((stroke, sIdx) => {
      // faint guide line through this stroke's dots
      const guideD = stroke.map((p, i) => (i === 0 ? 'M' : 'L') + p.x + ',' + p.y).join(' ');
      svgEl.appendChild(makeEl('path', { d: guideD, class: 'trace-guide' }));

      // placeholder for the solid drawn path (filled in as the child connects dots)
      const drawPath = makeEl('path', { d: '', class: 'trace-drawn' });
      svgEl.appendChild(drawPath);
      stroke.__drawPathEl = drawPath;
      stroke.__d = '';

      const map = [];
      stroke.forEach((p, pIdx) => {
        globalDotNumber++;
        const existingIdx = findCoincident(p);
        if (existingIdx !== -1) {
          // Two strokes meet at the same spot (e.g. a crossbar hitting the spine) — rather than
          // stack a second circle exactly on top of the first, show both numbers on the one dot.
          const el = dotEls[existingIdx];
          el.querySelector('text').textContent += ',' + globalDotNumber;
          map.push(existingIdx);
          return;
        }
        const g = makeEl('g', { class: 'trace-dot', 'data-stroke': sIdx, 'data-point': pIdx });
        const circle = makeEl('circle', { cx: p.x, cy: p.y, r: 5.2 });
        const label = makeEl('text', { x: p.x, y: p.y + 2.2, 'text-anchor': 'middle' });
        label.textContent = globalDotNumber;
        g.__x = p.x;
        g.__y = p.y;
        g.appendChild(circle);
        g.appendChild(label);
        svgEl.appendChild(g);
        map.push(dotEls.length);
        dotEls.push(g);
      });
      dotIndexMap.push(map);
    });

    updateDotStates();
  }

  function updateDotStates() {
    shape.strokes.forEach((stroke, sIdx) => {
      stroke.forEach((p, pIdx) => {
        const el = dotEls[dotIndexMap[sIdx][pIdx]];
        el.classList.remove('done', 'target');
        const isDone = sIdx < strokeIdx || (sIdx === strokeIdx && pIdx < pointIdx);
        const isTarget = sIdx === strokeIdx && pIdx === pointIdx;
        if (isDone) el.classList.add('done');
        if (isTarget) el.classList.add('target');
      });
    });
  }

  function tryConnect(clientX, clientY) {
    if (strokeIdx >= shape.strokes.length) return;
    const stroke = shape.strokes[strokeIdx];
    const target = stroke[pointIdx];
    const p = svgPointFromClient(clientX, clientY);
    if (dist(p, target) > TRACE_TOLERANCE) return;

    drawing = true;
    if (pointIdx === 0) {
      stroke.__d = 'M' + target.x + ',' + target.y;
    } else {
      stroke.__d += ' L' + target.x + ',' + target.y;
      stroke.__drawPathEl.setAttribute('d', stroke.__d);
    }

    pointIdx++;
    updateDotStates();

    if (pointIdx >= stroke.length) {
      // stroke finished
      strokeIdx++;
      pointIdx = 0;
      drawing = false;
      if (strokeIdx >= shape.strokes.length) {
        updateDotStates();
        // Fade the numbered dots and guide lines so the finished letter/number reads cleanly.
        svgEl.classList.add('trace-solved');
        setTimeout(onComplete, 500);
      }
    }
  }

  function onPointerDown(e) {
    tryConnect(e.clientX, e.clientY);
  }
  function onPointerMove(e) {
    if (!drawing) return;
    tryConnect(e.clientX, e.clientY);
  }
  function onPointerUp() {
    drawing = false;
  }

  svgEl.addEventListener('pointerdown', onPointerDown);
  svgEl.addEventListener('pointermove', onPointerMove);
  svgEl.addEventListener('pointerup', onPointerUp);
  svgEl.addEventListener('pointercancel', onPointerUp);
  svgEl.addEventListener('pointerleave', onPointerUp);

  render();

  return {
    destroy() {
      svgEl.removeEventListener('pointerdown', onPointerDown);
      svgEl.removeEventListener('pointermove', onPointerMove);
      svgEl.removeEventListener('pointerup', onPointerUp);
      svgEl.removeEventListener('pointercancel', onPointerUp);
      svgEl.removeEventListener('pointerleave', onPointerUp);
      clear();
    }
  };
}
