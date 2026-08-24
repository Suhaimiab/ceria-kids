// Simplified single/multi-stroke block letterforms for dot-to-dot tracing.
// Coordinates are on a 0-100 grid (x: left->right, y: top->bottom). Each shape is an array
// of strokes; each stroke is an ordered array of {x,y} dots. A "pen lift" happens between
// strokes (the child must start a fresh stroke near its first dot) — this lets multi-stroke
// letters like T, H, X, K read naturally instead of forcing one continuous scribble.
// Recognizability for a 3-4 year old matters far more here than typographic accuracy.

function pts(arr) { return arr.map(([x, y]) => ({ x, y })); }

const TRACE_LETTERS = [
  { label: 'A', strokes: [pts([[15,90],[50,10],[85,90]]), pts([[30,55],[70,55]])] },
  { label: 'B', strokes: [pts([[15,10],[15,90]]), pts([[15,10],[60,10],[78,26],[58,42],[15,50],[62,58],[78,74],[62,90],[15,90]])] },
  { label: 'C', strokes: [pts([[80,25],[55,10],[30,20],[15,50],[30,80],[55,90],[80,75]])] },
  { label: 'D', strokes: [pts([[15,10],[15,90]]), pts([[15,10],[55,10],[80,30],[80,70],[55,90],[15,90]])] },
  { label: 'E', strokes: [pts([[80,10],[15,10],[15,90],[80,90]]), pts([[15,50],[60,50]])] },
  { label: 'F', strokes: [pts([[15,90],[15,10],[80,10]]), pts([[15,50],[60,50]])] },
  { label: 'G', strokes: [pts([[80,25],[55,10],[30,20],[15,50],[30,80],[60,90],[80,75],[80,55],[55,55]])] },
  { label: 'H', strokes: [pts([[15,10],[15,90]]), pts([[85,10],[85,90]]), pts([[15,50],[85,50]])] },
  { label: 'I', strokes: [pts([[50,10],[50,90]])] },
  { label: 'J', strokes: [pts([[70,10],[70,70],[55,90],[30,90],[15,70]])] },
  { label: 'K', strokes: [pts([[15,10],[15,90]]), pts([[80,10],[15,50],[80,90]])] },
  { label: 'L', strokes: [pts([[15,10],[15,90],[80,90]])] },
  { label: 'M', strokes: [pts([[15,90],[15,10],[50,55],[85,10],[85,90]])] },
  { label: 'N', strokes: [pts([[15,90],[15,10],[85,90],[85,10]])] },
  { label: 'O', strokes: [pts([[50,10],[80,30],[80,70],[50,90],[20,70],[20,30],[50,10]])] },
  { label: 'P', strokes: [pts([[15,90],[15,10]]), pts([[15,10],[65,10],[80,28],[65,45],[15,45]])] },
  { label: 'Q', strokes: [pts([[50,10],[80,30],[80,70],[50,90],[20,70],[20,30],[50,10]]), pts([[55,65],[85,95]])] },
  { label: 'R', strokes: [pts([[15,90],[15,10]]), pts([[15,10],[65,10],[80,28],[65,45],[15,45]]), pts([[45,45],[80,90]])] },
  { label: 'S', strokes: [pts([[80,25],[55,10],[25,15],[15,32],[35,48],[65,52],[85,68],[75,85],[45,90],[20,75]])] },
  { label: 'T', strokes: [pts([[15,10],[85,10]]), pts([[50,10],[50,90]])] },
  { label: 'U', strokes: [pts([[15,10],[15,65],[35,90],[65,90],[85,65],[85,10]])] },
  { label: 'V', strokes: [pts([[15,10],[50,90],[85,10]])] },
  { label: 'W', strokes: [pts([[15,10],[30,90],[50,45],[70,90],[85,10]])] },
  { label: 'X', strokes: [pts([[15,10],[85,90]]), pts([[85,10],[15,90]])] },
  { label: 'Y', strokes: [pts([[15,10],[50,50],[85,10]]), pts([[50,50],[50,90]])] },
  { label: 'Z', strokes: [pts([[15,10],[85,10],[15,90],[85,90]])] }
];

const TRACE_NUMBERS = [
  { label: '0', strokes: [pts([[50,10],[80,30],[80,70],[50,90],[20,70],[20,30],[50,10]])] },
  { label: '1', strokes: [pts([[35,25],[50,10],[50,90]])] },
  { label: '2', strokes: [pts([[20,28],[35,10],[65,10],[80,28],[70,50],[20,90],[85,90]])] },
  { label: '3', strokes: [pts([[20,15],[65,10],[80,28],[60,48],[80,65],[65,90],[20,82]])] },
  { label: '4', strokes: [pts([[65,10],[20,60],[85,60]]), pts([[65,10],[65,90]])] },
  { label: '5', strokes: [pts([[80,10],[20,10],[15,45],[55,45],[80,60],[70,85],[20,90]])] },
  { label: '6', strokes: [pts([[75,20],[45,10],[20,40],[20,75],[45,90],[75,80],[75,55],[45,45],[20,55]])] },
  { label: '7', strokes: [pts([[15,10],[85,10],[40,90]])] },
  { label: '8', strokes: [pts([[50,10],[30,20],[30,45],[50,55],[30,65],[30,85],[50,95],[70,85],[70,65],[50,55],[70,45],[70,20],[50,10]])] },
  { label: '9', strokes: [pts([[75,45],[55,55],[30,45],[30,20],[55,10],[78,20],[80,58],[75,80],[50,90],[30,80]])] }
];
