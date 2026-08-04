// ═══════════════════════════════════════════════
//  MINI-GAME — Birthday Games
//  3 games: Quiz → Puzzle → Cari Hati
// ═══════════════════════════════════════════════

// ── TOKEN GATE ──
const TOKEN_2 = 'hbd_t2_qR4wL7';
const TOKEN_3 = 'hbd_t3_nF8jZ5';
if (sessionStorage.getItem('hbd_token_2') !== TOKEN_2) {
  window.location.href = '../';
}

// ── STATE ────────────────────────────────────────
let quizScore = 0;
let currentQ  = 0;
let heartsFound = 0;
let moveCount = 0;

const $ = id => document.getElementById(id);
const delay = ms => new Promise(r => setTimeout(r, ms));

// ── QUIZ DATA ────────────────────────────────────
const QUESTIONS = [
  {
    type: 'pg',
    text: 'Kombinasi akhir angka aku dan kamu adalah…',
    options: ['2204', '2208', '0408', '9940'],
    correct: 3,  // "9940" — akhir angka 99 & 40
    correctDisplay: '9940 ✓'
  },
  {
    type: 'pg',
    text: 'Kalau tidur, aku suka pakai apa?',
    options: ['Piyama lengkap', 'Hanya celana dalam', 'Hanya celana, tanpa celana dalam', 'Pakai baju, tanpa celana'],
    correct: 2,
    correctDisplay: 'Hanya celana, tanpa celana dalam ✓'
  },
  {
    type: 'isian',
    text: 'Ketik nomor aku yang biasa kamu hubungin!',
    placeholder: 'Ketik nomor...',
    answerHash: 'd8492d0c8905a4da2b2cab26bda8892b21157471dc320e40730f9c9c2ded7984',
    hint: 'Jawabannya: 😋'
  },
  {
    type: 'isian',
    text: 'Password yang kamu pakai, tapi tau dari aku formatnya?',
    placeholder: 'ketik Password',
    answerHash: '7ba2e188ef874da270a5e15fd0781cd8d654fa962daf4c8d4e73192c257c7e99',
    hint: 'Jawabannya: Tanya yang buat 🔐'
  }
];

// ── PUZZLE CONFIG ─────────────────────────────────
const PUZZLE_IMG = 'puzzle.jpg';
const GRID_SIZE  = 4;
const TOTAL_TILES = GRID_SIZE * GRID_SIZE;

let puzzleState = []; // 0..14 = tile index, 15 = empty
let emptyPos    = TOTAL_TILES - 1;
let puzzleSolved = false;

// ── HEARTS GAME DATA ──────────────────────────────
// 10 items, 4 have hearts, 6 don't
const ITEMS = [
  { emoji: '🍓', hasHeart: true  },
  { emoji: '🌹', hasHeart: true },
  { emoji: '🐱', hasHeart: false  },
  { emoji: '🍎', hasHeart: false },
  { emoji: '🐶', hasHeart: false },
  { emoji: '🦋', hasHeart: true  },
  { emoji: '🍑', hasHeart: false },
  { emoji: '🌸', hasHeart: false },
  { emoji: '🎁', hasHeart: true  },
  { emoji: '🍰', hasHeart: false },
];

// ════════════════════════════════════════════════
//  PHASE TRANSITIONS
// ════════════════════════════════════════════════
function showSection(id) {
  document.querySelectorAll('.game-section').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
  // scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function markStepDone(i) {
  const step = $(`step-${i}`);
  step.classList.remove('active');
  step.classList.add('done');
  if (i < 2) {
    $(`line-${i}`).classList.add('filled');
    $(`step-${i + 1}`).classList.add('active');
  }
}

// ════════════════════════════════════════════════
//  GAME 1 — QUIZ
// ════════════════════════════════════════════════
function initQuiz() {
  currentQ = 0; quizScore = 0;
  renderQuestion();
}

function renderQuestion() {
  const q = QUESTIONS[currentQ];
  $('question-text').textContent = q.text;
  $('quiz-count').textContent = `${currentQ + 1} / 4`;
  $('quiz-fill').style.width = `${(currentQ / 4) * 100 + 25}%`;

  // Reset feedback & next btn
  const fb = $('feedback');
  fb.className = 'feedback hidden';
  $('btn-quiz-next').classList.add('hidden');

  if (q.type === 'pg') {
    $('isian-wrap').classList.add('hidden');
    const grid = $('options-grid');
    grid.classList.remove('hidden');
    const btns = grid.querySelectorAll('.option-btn');
    btns.forEach((btn, i) => {
      btn.textContent = q.options[i];
      btn.className = 'option-btn';
      btn.disabled = false;
      btn.onclick = () => handlePGAnswer(i);
    });
  } else {
    $('options-grid').classList.add('hidden');
    $('isian-wrap').classList.remove('hidden');
    const inp = $('isian-input');
    inp.value = '';
    inp.placeholder = q.placeholder || 'Ketik jawaban...';
    inp.focus();
    $('btn-isian-submit').onclick = handleIsianAnswer;
    inp.onkeydown = e => { if (e.key === 'Enter') handleIsianAnswer(); };
  }

  // Animate card in
  gsap.fromTo('#question-card',
    { opacity: 0, y: 24, scale: 0.97 },
    { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: 'back.out(1.4)' }
  );
}

function handlePGAnswer(i) {
  const q = QUESTIONS[currentQ];
  const btns = $('options-grid').querySelectorAll('.option-btn');

  const correct = i === q.correct;
  btns[i].classList.add(correct ? 'correct' : 'wrong');

  if (correct) {
    // Lock all buttons
    btns.forEach(b => { b.disabled = true; b.onclick = null; });
    quizScore++;
    showFeedback(true, 'Benar! 🎉');
    gsap.fromTo(btns[i], { x: 0 }, { x: [-4,4,-3,2,0], duration: 0.4 });
    setTimeout(() => {
      $('btn-quiz-next').classList.remove('hidden');
      gsap.from('#btn-quiz-next', { opacity: 0, y: 10, duration: 0.3 });
    }, 800);
  } else {
    showFeedback(false, 'Kurang tepat, coba lagi! 🤔');
    gsap.to(btns[i], { x: [-8,8,-6,4,0], duration: 0.4 });
    // Disable only the wrong button, let user try again
    btns[i].disabled = true;
    btns[i].onclick = null;
  }
}

async function sha256(text) {
  const enc = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest('SHA-256', enc);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

async function handleIsianAnswer() {
  const q = QUESTIONS[currentQ];
  const inp = $('isian-input');
  const val = inp.value.trim();
  if (!val) return;

  // Hash-based check
  const hash = await sha256(val.toLowerCase());
  const correct = hash === q.answerHash;
  if (correct) {
    quizScore++;
    inp.disabled = true;
    $('btn-isian-submit').disabled = true;
    inp.style.borderColor = 'var(--success)';
    inp.style.background = 'var(--success-light)';
    showFeedback(true, 'Tepat sekali! 🎊');
    setTimeout(() => {
      $('btn-quiz-next').classList.remove('hidden');
      gsap.from('#btn-quiz-next', { opacity: 0, y: 10, duration: 0.3 });
    }, 800);
  } else {
    inp.style.borderColor = 'var(--wrong)';
    inp.style.background = 'var(--wrong-light)';
    showFeedback(false, 'Kurang tepat, coba lagi! 🤔');
    // Shake input and reset after 1s so user can try again
    gsap.to(inp, { x: [-6,6,-4,2,0], duration: 0.35 });
    setTimeout(() => {
      inp.value = '';
      inp.style.borderColor = '';
      inp.style.background = '';
    }, 1200);
  }
}

function showFeedback(correct, msg) {
  const fb = $('feedback');
  fb.className = `feedback ${correct ? 'correct' : 'wrong'}`;
  $('feedback-icon').textContent = correct ? '✅' : '❌';
  $('feedback-text').textContent = msg;
  gsap.from(fb, { opacity: 0, y: 6, duration: 0.3 });
}

function nextQuestion() {
  currentQ++;
  if (currentQ < QUESTIONS.length) {
    // Reset isian styles
    const inp = $('isian-input');
    inp.style.borderColor = '';
    inp.style.background = '';
    inp.disabled = false;
    $('btn-isian-submit').disabled = false;
    renderQuestion();
  } else {
    // Quiz done → go to puzzle
    markStepDone(0);
    gsap.to('#game-quiz', {
      opacity: 0, x: -40, duration: 0.4, onComplete: () => {
        showSection('game-puzzle');
        gsap.from('#game-puzzle', { opacity: 0, x: 40, duration: 0.4 });
        initPuzzle();
      }
    });
  }
}

$('btn-quiz-next').onclick = nextQuestion;

// ════════════════════════════════════════════════
//  GAME 2 — DRAG & DROP PUZZLE
// ════════════════════════════════════════════════
let dragSrc = null;
let dragSrcPos = null;

function initPuzzle() {
  puzzleState = Array.from({ length: TOTAL_TILES }, (_, i) => i);
  moveCount = 0;
  $('move-count').textContent = '0';
  puzzleSolved = false;
  shufflePuzzle();
  renderPuzzle();
}

function shufflePuzzle() {
  // Fisher-Yates shuffle
  for (let i = puzzleState.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [puzzleState[i], puzzleState[j]] = [puzzleState[j], puzzleState[i]];
  }
}

function renderPuzzle() {
  const grid = $('puzzle-grid');
  grid.innerHTML = '';
  const tW = grid.offsetWidth || 300;

  puzzleState.forEach((tileIdx, pos) => {
    const tile = document.createElement('div');
    tile.className = 'puzzle-tile';
    tile.draggable = true;
    tile.dataset.pos = pos;
    tile.dataset.tile = tileIdx;

    // Show tile number for reference + background image
    const r = Math.floor(tileIdx / GRID_SIZE);
    const c = tileIdx % GRID_SIZE;
    tile.style.backgroundImage = `url('${PUZZLE_IMG}')`;
    tile.style.backgroundSize = `${tW}px ${tW}px`;
    tile.style.backgroundPosition = `-${c * (tW / GRID_SIZE)}px -${r * (tW / GRID_SIZE)}px`;

    // Highlight if tile is in correct position
    if (tileIdx === pos) tile.classList.add('correct-pos');

    // ─── Drag events (desktop) ───
    tile.addEventListener('dragstart', (e) => {
      dragSrc = tile;
      dragSrcPos = pos;
      tile.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', pos.toString());
    });
    tile.addEventListener('dragend', () => {
      tile.classList.remove('dragging');
      document.querySelectorAll('.puzzle-tile.drag-over').forEach(t => t.classList.remove('drag-over'));
    });
    tile.addEventListener('dragover', (e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; });
    tile.addEventListener('dragenter', (e) => { e.preventDefault(); tile.classList.add('drag-over'); });
    tile.addEventListener('dragleave', () => { tile.classList.remove('drag-over'); });
    tile.addEventListener('drop', (e) => {
      e.preventDefault();
      tile.classList.remove('drag-over');
      const fromPos = parseInt(e.dataTransfer.getData('text/plain'));
      const toPos = pos;
      if (fromPos !== toPos) doSwap(fromPos, toPos);
    });

    // ─── Touch events (mobile) ───
    tile.addEventListener('touchstart', (e) => {
      dragSrc = tile;
      dragSrcPos = pos;
      tile.classList.add('dragging');
    }, { passive: true });

    tile.addEventListener('touchend', (e) => {
      tile.classList.remove('dragging');
      const touch = e.changedTouches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      if (target && target.classList.contains('puzzle-tile') && target !== tile) {
        const toPos = parseInt(target.dataset.pos);
        doSwap(dragSrcPos, toPos);
      }
      document.querySelectorAll('.puzzle-tile.drag-over').forEach(t => t.classList.remove('drag-over'));
    });

    tile.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);
      document.querySelectorAll('.puzzle-tile.drag-over').forEach(t => t.classList.remove('drag-over'));
      if (target && target.classList.contains('puzzle-tile') && target !== tile) {
        target.classList.add('drag-over');
      }
    }, { passive: true });

    grid.appendChild(tile);
  });
}

function doSwap(fromPos, toPos) {
  if (puzzleSolved) return;
  [puzzleState[fromPos], puzzleState[toPos]] = [puzzleState[toPos], puzzleState[fromPos]];
  moveCount++;
  $('move-count').textContent = moveCount;
  renderPuzzle();

  // Animate swap feedback
  const tiles = $('puzzle-grid').children;
  gsap.from(tiles[fromPos], { scale: 0.85, duration: 0.2, ease: 'back.out(1.4)' });
  gsap.from(tiles[toPos], { scale: 0.85, duration: 0.2, ease: 'back.out(1.4)' });

  checkPuzzleSolved();
}

function checkPuzzleSolved() {
  const solved = puzzleState.every((v, i) => v === i);
  if (!solved) return;
  puzzleSolved = true;

  // All tiles glow
  document.querySelectorAll('.puzzle-tile').forEach(t => t.classList.add('correct-pos'));

  gsap.to('#puzzle-grid', {
    scale: 1.04, duration: 0.3, yoyo: true, repeat: 1,
    onComplete: () => {
      markStepDone(1);
      setTimeout(() => {
        gsap.to('#game-puzzle', {
          opacity: 0, x: -40, duration: 0.4, onComplete: () => {
            showSection('game-hearts');
            gsap.from('#game-hearts', { opacity: 0, x: 40, duration: 0.4 });
            initHearts();
          }
        });
      }, 800);
    }
  });
}

$('btn-shuffle').onclick = () => {
  shufflePuzzle();
  moveCount = 0;
  $('move-count').textContent = '0';
  renderPuzzle();
};

// ════════════════════════════════════════════════
//  GAME 3 — CARI HATI TERSEMBUNYI
// ════════════════════════════════════════════════
function initHearts() {
  heartsFound = 0;
  // Reset counter icons
  for (let i = 0; i < 4; i++) {
    $(`hc-${i}`).textContent = '🤍';
    $(`hc-${i}`).classList.remove('found');
  }

  // Shuffle items
  const shuffled = [...ITEMS].sort(() => Math.random() - 0.5);

  const grid = $('items-grid');
  grid.innerHTML = '';
  shuffled.forEach((item, idx) => {
    const cell = document.createElement('div');
    cell.className = 'item-cell';
    cell.innerHTML = `
      <span class="item-emoji">${item.emoji}</span>
      <span class="heart-reveal">❤️</span>
    `;
    cell.dataset.has = item.hasHeart ? '1' : '0';
    cell.dataset.revealed = '0';
    cell.onclick = () => tapItem(cell, idx);

    // Stagger entry
    gsap.from(cell, {
      opacity: 0, scale: 0.7, duration: 0.35, delay: idx * 0.05, ease: 'back.out(1.4)',
      onComplete() { gsap.set(cell, { clearProps: 'transform,opacity' }); }
    });
    grid.appendChild(cell);
  });
}

function tapItem(cell, idx) {
  if (cell.dataset.revealed === '1') return;
  cell.dataset.revealed = '1';

  if (cell.dataset.has === '1') {
    cell.classList.add('revealed');
    heartsFound++;

    // Update counter
    const hc = $(`hc-${heartsFound - 1}`);
    hc.textContent = '❤️';
    hc.classList.add('found');
    gsap.from(hc, { scale: 0, duration: 0.4, ease: 'back.out(2)' });

    // Bounce cell then reset to original size
    gsap.fromTo(cell,
      { scale: 1 },
      { scale: 1.15, duration: 0.15, yoyo: true, repeat: 1, ease: 'power2.out',
        onComplete: () => gsap.set(cell, { scale: 1, clearProps: 'transform' })
      }
    );

    if (heartsFound === 4) {
      setTimeout(onAllHeartsFound, 800);
    }
  } else {
    cell.classList.add('wrong-tap');
    // Shake
    gsap.to(cell, { x: [-4, 4, -3, 2, 0], duration: 0.35 });
    setTimeout(() => cell.classList.remove('wrong-tap'), 500);
  }
}

function onAllHeartsFound() {
  markStepDone(2);
  // Set token_3 — allows access to wish page
  sessionStorage.setItem('hbd_token_3', TOKEN_3);
  $('final-score').textContent = `${quizScore}/4`;
  $('complete-screen').classList.remove('hidden');
  gsap.from('.complete-content', { scale: 0.85, opacity: 0, duration: 0.5, ease: 'back.out(1.7)' });
  startConfetti();
}

// ════════════════════════════════════════════════
//  CONFETTI
// ════════════════════════════════════════════════
function startConfetti() {
  const canvas = $('confetti-canvas');
  const ctx = canvas.getContext('2d');
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;

  const COLORS = ['#FF6B9D','#A78BFA','#60A5FA','#FBBF24','#10B981','#F97316'];
  const pieces = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: Math.random() * canvas.height - canvas.height,
    w: 6 + Math.random() * 8,
    h: 3 + Math.random() * 5,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    vx: (Math.random() - 0.5) * 2,
    vy: 2 + Math.random() * 3,
    rot: Math.random() * 360,
    vr: (Math.random() - 0.5) * 6,
  }));

  let raf;
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    pieces.forEach(p => {
      p.x += p.vx; p.y += p.vy; p.rot += p.vr;
      if (p.y > canvas.height) { p.y = -20; p.x = Math.random() * canvas.width; }
      ctx.save();
      ctx.translate(p.x + p.w / 2, p.y + p.h / 2);
      ctx.rotate(p.rot * Math.PI / 180);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });
    raf = requestAnimationFrame(loop);
  }
  loop();
  // Stop after 6s
  setTimeout(() => cancelAnimationFrame(raf), 6000);
}

// ════════════════════════════════════════════════
//  INIT
// ════════════════════════════════════════════════
window.addEventListener('DOMContentLoaded', () => {
  initQuiz();
  // Puzzle renders on transition
});
