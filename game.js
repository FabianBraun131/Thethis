(function () {
  "use strict";

  const COLS = 10;
  const ROWS = 20;
  const BLOCK = 32;
  const COLORS = {
    I: "#5eead4",
    O: "#fde047",
    T: "#c084fc",
    S: "#4ade80",
    Z: "#f87171",
    J: "#60a5fa",
    L: "#fb923c",
    ghost: "rgba(255,255,255,0.28)",
    grid: "rgba(255,255,255,0.06)",
  };

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

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  const nextCanvas = document.getElementById("next-canvas");
  const nextCtx = nextCanvas.getContext("2d", { alpha: false });
  if (!ctx || !nextCtx) {
    document.body.innerHTML = "<p>Canvas wird in diesem Browser nicht unterstützt.</p>";
    throw new Error("no 2d context");
  }
  const elScore = document.getElementById("score");
  const elLevel = document.getElementById("level");
  const elLines = document.getElementById("lines");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const startBtn = document.getElementById("start-btn");

  let board = [];
  let bag = [];
  let current = null;
  let nextType = null;
  let score = 0;
  let linesTotal = 0;
  let level = 1;
  let dropMs = 800;
  let lastTick = 0;
  let running = false;
  let paused = false;
  let animFrame = null;

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
      level = Math.min(10, Math.floor(linesTotal / 10) + 1);
      dropMs = Math.max(120, 800 - (level - 1) * 75);
    }
  }

  function ghostPosition() {
    if (!current) return null;
    let gr = current.row;
    while (!collides({ ...current, row: gr + 1 }, 0, 0)) gr++;
    return { ...current, row: gr };
  }

  function drawBlock(x, y, color, alpha) {
    const pad = 1;
    const px = x * BLOCK + pad;
    const py = y * BLOCK + pad;
    const s = BLOCK - pad * 2;
    ctx.globalAlpha = alpha !== undefined ? alpha : 1;
    ctx.fillStyle = color;
    ctx.fillRect(px, py, s, s);
    ctx.strokeStyle = "rgba(255,255,255,0.55)";
    ctx.lineWidth = 2;
    ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
    ctx.globalAlpha = 1;
  }

  function drawBoard() {
    ctx.fillStyle = "#0d1117";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    for (let c = 0; c <= COLS; c++) {
      ctx.strokeStyle = COLORS.grid;
      ctx.beginPath();
      ctx.moveTo(c * BLOCK, 0);
      ctx.lineTo(c * BLOCK, ROWS * BLOCK);
      ctx.stroke();
    }
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK);
      ctx.lineTo(COLS * BLOCK, r * BLOCK);
      ctx.stroke();
    }
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) drawBlock(c, r, COLORS[board[r][c]]);
      }
    }
    if (!running && !current) {
      ctx.fillStyle = "rgba(230, 237, 243, 0.85)";
      ctx.font = "600 16px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Zuerst „Spiel starten“ klicken", canvas.width / 2, canvas.height / 2);
    }
    if (current) {
      const gh = ghostPosition();
      if (gh) {
        const s = getShapeCells(gh.type, gh.rot);
        for (let r = 0; r < 4; r++) {
          for (let c = 0; c < 4; c++) {
            if (!s[r][c]) continue;
            const br = gh.row + r,
              bc = gh.col + c;
            if (br >= 0 && br < ROWS) drawBlock(bc, br, COLORS.ghost, 0.5);
          }
        }
      }
      const shape = getShapeCells(current.type, current.rot);
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (!shape[r][c]) continue;
          const br = current.row + r,
            bc = current.col + c;
          if (br >= 0 && br < ROWS) drawBlock(bc, br, COLORS[current.type]);
        }
      }
    }
    if (paused && running) {
      ctx.fillStyle = "rgba(13, 17, 23, 0.65)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#e6edf3";
      ctx.font = "bold 28px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Pause · P", canvas.width / 2, canvas.height / 2);
    }
  }

  function drawNext() {
    const size = 24;
    nextCtx.fillStyle = "#161b22";
    nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
    if (!nextType) return;
    const shape = getShapeCells(nextType, 0);
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
    const h = maxR - minR + 1;
    const ox = (nextCanvas.width - w * size) / 2 - minC * size;
    const oy = (nextCanvas.height - h * size) / 2 - minR * size;
    const color = COLORS[nextType];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (!shape[r][c]) continue;
        const x = ox + c * size,
          y = oy + r * size;
        nextCtx.fillStyle = color;
        nextCtx.fillRect(x + 1, y + 1, size - 2, size - 2);
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
    drawBoard();
    drawNext();
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
    level = 1;
    dropMs = 800;
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
