(function () {
  "use strict";

  const COLS = 10;
  const ROWS = 20;
  /** Je Tetromino-Typ eine eigene Farbe (rgb für maximale Browser-Kompatibilität) */
  const COLORS = {
    I: "rgb(0, 240, 240)",
    O: "rgb(255, 230, 0)",
    T: "rgb(200, 100, 255)",
    S: "rgb(0, 230, 80)",
    Z: "rgb(255, 80, 80)",
    J: "rgb(60, 140, 255)",
    L: "rgb(255, 150, 40)",
    ghost: "rgba(200, 220, 255, 0.45)",
    fallback: "rgb(255, 0, 255)",
  };

  function fillForPiece(type) {
    const c = COLORS[type];
    return typeof c === "string" ? c : COLORS.fallback;
  }

  /** 4 Rotationen je Form: 4×4-Matrix, 1 = Block */
  const SHAPES = {
    I: [
      [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 1, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
      ],
    ],
    O: [
      [
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    T: [
      [
        [0, 1, 0, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [1, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    S: [
      [
        [0, 1, 1, 0],
        [1, 1, 0, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [0, 1, 1, 0],
        [1, 1, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [1, 0, 0, 0],
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    Z: [
      [
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [1, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [1, 1, 0, 0],
        [1, 0, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    J: [
      [
        [1, 0, 0, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [1, 1, 1, 0],
        [0, 0, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [1, 1, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
    L: [
      [
        [0, 0, 1, 0],
        [1, 1, 1, 0],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0],
      ],
      [
        [0, 0, 0, 0],
        [1, 1, 1, 0],
        [1, 0, 0, 0],
        [0, 0, 0, 0],
      ],
      [
        [1, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 1, 0, 0],
        [0, 0, 0, 0],
      ],
    ],
  };

  const BAG = Object.keys(SHAPES);

  const tetField = document.getElementById("tet-field");
  const fieldMsg = document.getElementById("field-msg");
  const nextField = document.getElementById("next-field");
  const tetCells = [];
  for (let i = 0; i < ROWS * COLS; i++) {
    const el = document.createElement("div");
    el.className = "tet-cell";
    tetField.appendChild(el);
    tetCells.push(el);
  }
  const nextCells = [];
  for (let i = 0; i < 16; i++) {
    const el = document.createElement("div");
    el.className = "next-cell";
    nextField.appendChild(el);
    nextCells.push(el);
  }

  const elScore = document.getElementById("score");
  const elLevel = document.getElementById("level");
  const elLines = document.getElementById("lines");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const startBtn = document.getElementById("start-btn");
  const startLevelInput = document.getElementById("start-level");

  let board = [];
  let bag = [];
  let current = null;
  let nextType = null;
  let score = 0;
  let linesTotal = 0;
  let startLevel = 1;
  let level = 1;
  let dropMs = 800;
  let lastTick = 0;
  let running = false;
  let paused = false;
  let animFrame = null;

  /** Nach let board/bag/nextType — sonst TDZ: „can't access lexical declaration 'board' before initialization“. */
  emptyBoard();
  refillBag();
  nextType = pullFromBag();

  function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function refillBag() {
    bag = shuffle([...BAG]);
  }

  function pullFromBag() {
    if (bag.length === 0) refillBag();
    return bag.pop();
  }

  function emptyBoard() {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
  }

  function clampStartLevel(value) {
    const parsed = Number.parseInt(String(value), 10);
    if (!Number.isFinite(parsed)) return 1;
    return Math.max(1, Math.min(10, parsed));
  }

  function speedForLevel(currentLevel) {
    return Math.max(120, 800 - (currentLevel - 1) * 75);
  }

  function getShapeCells(type, rot) {
    const rots = SHAPES[type];
    const r = rots.length === 1 ? 0 : rot % rots.length;
    return rots[r];
  }

  function spawnPiece(type) {
    const shape = getShapeCells(type, 0);
    let minC = 4,
      maxC = -1,
      minR = 4,
      maxR = -1;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (shape[r][c]) {
          minC = Math.min(minC, c);
          maxC = Math.max(maxC, c);
          minR = Math.min(minR, r);
          maxR = Math.max(maxR, r);
        }
      }
    }
    const w = maxC - minC + 1;
    const col = Math.floor((COLS - w) / 2) - minC;
    const row = -minR;
    return { type, rot: 0, row, col };
  }

  function collides(piece, dRow, dCol, newRot) {
    const rot = newRot !== undefined ? newRot : piece.rot;
    const shape = getShapeCells(piece.type, rot);
    const row = piece.row + dRow;
    const col = piece.col + dCol;
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!shape[r][c]) continue;
        const br = row + r;
        const bc = col + c;
        if (bc < 0 || bc >= COLS) return true;
        if (br >= ROWS) return true;
        if (br >= 0 && board[br][bc]) return true;
      }
    }
    return false;
  }

  /** Einfache Wand-Kicks: verschiedene Verschiebungen probieren */
  function tryRotate() {
    if (!current) return;
    const rots = SHAPES[current.type];
    const len = rots.length;
    if (len <= 1) return;
    const newRot = (current.rot + 1) % len;
    const kicks = [0, -1, 1, -2, 2];
    for (const k of kicks) {
      if (!collides(current, 0, k, newRot)) {
        current.col += k;
        current.rot = newRot;
        return;
      }
    }
  }

  function mergePiece() {
    const shape = getShapeCells(current.type, current.rot);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!shape[r][c]) continue;
        const br = current.row + r;
        const bc = current.col + c;
        if (br < 0) {
          gameOver();
          return;
        }
        board[br][bc] = current.type;
      }
    }
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; ) {
      if (board[r].every((cell) => cell !== null)) {
        board.splice(r, 1);
        board.unshift(Array(COLS).fill(null));
        cleared++;
      } else {
        r--;
      }
    }
    if (cleared > 0) {
      const lineScores = [0, 100, 300, 500, 800];
      score += lineScores[cleared] * level;
      linesTotal += cleared;
      level = Math.min(10, startLevel + Math.floor(linesTotal / 10));
      dropMs = speedForLevel(level);
    }
  }

  function ghostPosition() {
    if (!current) return null;
    let gr = current.row;
    while (!collides({ ...current, row: gr + 1 }, 0, 0)) gr++;
    return { ...current, row: gr };
  }

  /** Liegt der Stein `piece` (mit row/col/rot) auf Spielfeldzelle (br, bc)? */
  function pieceAtCell(piece, br, bc) {
    const shape = getShapeCells(piece.type, piece.rot);
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!shape[r][c]) continue;
        if (piece.row + r === br && piece.col + c === bc) return true;
      }
    }
    return false;
  }

  function styleTetCell(el, bg, borderStrong) {
    if (bg) {
      el.style.backgroundColor = bg;
      el.style.borderColor = borderStrong
        ? "rgba(255,255,255,0.6)"
        : "rgba(255,255,255,0.35)";
      el.style.boxShadow = borderStrong
        ? "inset 0 0 0 1px rgba(255,255,255,0.25)"
        : "none";
    } else {
      el.style.backgroundColor = "#0d1117";
      el.style.borderColor = "rgba(255,255,255,0.16)";
      el.style.boxShadow = "none";
    }
  }

  function updateFieldMsg() {
    fieldMsg.classList.remove("is-on", "is-pause");
    fieldMsg.textContent = "";
    if (paused && running) {
      fieldMsg.textContent = "Pause · P";
      fieldMsg.classList.add("is-on", "is-pause");
    } else if (!running && !current) {
      fieldMsg.textContent = "Zuerst „Spiel starten“ klicken";
      fieldMsg.classList.add("is-on");
    }
  }

  function renderField() {
    const gh = current ? ghostPosition() : null;
    for (let r = 0; r < ROWS; r++) {
      const row = board[r];
      if (!row) continue;
      for (let c = 0; c < COLS; c++) {
        const el = tetCells[r * COLS + c];
        let bg = null;
        let strong = true;
        if (row[c]) {
          bg = fillForPiece(row[c]);
        } else if (current && pieceAtCell(current, r, c)) {
          bg = fillForPiece(current.type);
        } else if (gh && pieceAtCell(gh, r, c)) {
          bg = COLORS.ghost;
          strong = false;
        }
        styleTetCell(el, bg, strong);
      }
    }
    updateFieldMsg();
  }

  function renderNext() {
    for (let i = 0; i < 16; i++) {
      const el = nextCells[i];
      el.style.backgroundColor = "#161b22";
      el.style.borderColor = "rgba(255,255,255,0.22)";
      el.style.boxShadow = "none";
    }
    if (!nextType) return;
    const shape = getShapeCells(nextType, 0);
    const color = fillForPiece(nextType);
    for (let sr = 0; sr < 4; sr++) {
      for (let sc = 0; sc < 4; sc++) {
        const el = nextCells[sr * 4 + sc];
        if (shape[sr][sc]) {
          el.style.backgroundColor = color;
          el.style.borderColor = "rgba(255,255,255,0.55)";
          el.style.boxShadow = "inset 0 0 0 1px rgba(255,255,255,0.3)";
        }
      }
    }
  }

  function updateHud() {
    elScore.textContent = String(score);
    elLevel.textContent = String(level);
    elLines.textContent = String(linesTotal);
  }

  function tick() {
    if (!running || paused) return;
    const now = performance.now();
    if (now - lastTick >= dropMs) {
      lastTick = now;
      if (current && !collides(current, 1, 0)) {
        current.row += 1;
      } else if (current) {
        mergePiece();
        if (!running) return;
        clearLines();
        current = spawnPiece(nextType);
        nextType = pullFromBag();
        if (collides(current, 0, 0)) gameOver();
      }
      updateHud();
    }
  }

  function loop() {
    tick();
    renderField();
    renderNext();
    animFrame = requestAnimationFrame(loop);
  }

  function gameOver() {
    running = false;
    overlayTitle.textContent = "Game Over";
    overlayMsg.textContent = "Punkte: " + score + " · Linien: " + linesTotal;
    startBtn.textContent = "Nochmal";
    overlay.classList.remove("hidden");
  }

  function startGame() {
    overlay.classList.add("hidden");
    emptyBoard();
    refillBag();
    nextType = pullFromBag();
    current = spawnPiece(pullFromBag());
    score = 0;
    linesTotal = 0;
    startLevel = clampStartLevel(startLevelInput ? startLevelInput.value : 1);
    if (startLevelInput) startLevelInput.value = String(startLevel);
    level = startLevel;
    dropMs = speedForLevel(level);
    lastTick = performance.now();
    running = true;
    paused = false;
    updateHud();
  }

  startBtn.addEventListener("click", startGame);

  document.addEventListener("keydown", (e) => {
    if (e.key === "p" || e.key === "P") {
      if (!running && overlay.classList.contains("hidden")) return;
      if (!running && !overlay.classList.contains("hidden")) return;
      paused = !paused;
      e.preventDefault();
      return;
    }
    if (!running || paused) return;
    if (!current) return;
    if (e.key === "ArrowLeft") {
      if (!collides(current, 0, -1)) current.col -= 1;
      e.preventDefault();
    } else if (e.key === "ArrowRight") {
      if (!collides(current, 0, 1)) current.col += 1;
      e.preventDefault();
    } else if (e.key === "ArrowDown") {
      if (!collides(current, 1, 0)) {
        current.row += 1;
        score += 1;
        updateHud();
      }
      e.preventDefault();
    } else if (e.key === "ArrowUp") {
      tryRotate();
      e.preventDefault();
    } else if (e.key === " " || e.code === "Space") {
      while (!collides(current, 1, 0)) {
        current.row += 1;
        score += 2;
      }
      mergePiece();
      if (!running) return;
      clearLines();
      current = spawnPiece(nextType);
      nextType = pullFromBag();
      if (collides(current, 0, 0)) gameOver();
      updateHud();
      e.preventDefault();
    }
  });

  animFrame = requestAnimationFrame(loop);
  updateHud();
})();
