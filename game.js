(function () {
  "use strict";

  const COLS = 10;
  const ROWS = 20;
  const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|bmp|avif|svg|jpag)(\?.*)?$/i;
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
  const SHAPES = {
    I: [[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],[[0,0,1,0],[0,0,1,0],[0,0,1,0],[0,0,1,0]],[[0,0,0,0],[0,0,0,0],[1,1,1,1],[0,0,0,0]],[[0,1,0,0],[0,1,0,0],[0,1,0,0],[0,1,0,0]]],
    O: [[[0,1,1,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]]],
    T: [[[0,1,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],[[0,1,0,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],[[0,0,0,0],[1,1,1,0],[0,1,0,0],[0,0,0,0]],[[0,1,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]]],
    S: [[[0,1,1,0],[1,1,0,0],[0,0,0,0],[0,0,0,0]],[[0,1,0,0],[0,1,1,0],[0,0,1,0],[0,0,0,0]],[[0,0,0,0],[0,1,1,0],[1,1,0,0],[0,0,0,0]],[[1,0,0,0],[1,1,0,0],[0,1,0,0],[0,0,0,0]]],
    Z: [[[1,1,0,0],[0,1,1,0],[0,0,0,0],[0,0,0,0]],[[0,0,1,0],[0,1,1,0],[0,1,0,0],[0,0,0,0]],[[0,0,0,0],[1,1,0,0],[0,1,1,0],[0,0,0,0]],[[0,1,0,0],[1,1,0,0],[1,0,0,0],[0,0,0,0]]],
    J: [[[1,0,0,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],[[0,1,1,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]],[[0,0,0,0],[1,1,1,0],[0,0,1,0],[0,0,0,0]],[[0,1,0,0],[0,1,0,0],[1,1,0,0],[0,0,0,0]]],
    L: [[[0,0,1,0],[1,1,1,0],[0,0,0,0],[0,0,0,0]],[[0,1,0,0],[0,1,0,0],[0,1,1,0],[0,0,0,0]],[[0,0,0,0],[1,1,1,0],[1,0,0,0],[0,0,0,0]],[[1,1,0,0],[0,1,0,0],[0,1,0,0],[0,0,0,0]]],
  };
  const BAG = Object.keys(SHAPES);

  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayMsg = document.getElementById("overlay-msg");
  const pickFacesBtn = document.getElementById("pick-faces-btn");
  const faceFilesInput = document.getElementById("face-files");
  const faceStatus = document.getElementById("face-status");
  const startBtn = document.getElementById("start-btn");
  const startLevelInput = document.getElementById("start-level");
  const multiplayerToggle = document.getElementById("multiplayer-toggle");
  const player2Panel = document.getElementById("player2-panel");

  let createdFaceObjectUrls = [];
  let faceImages = [];
  let multiplayer = false;
  let paused = false;
  let animFrame = null;

  const players = [
    createPlayer({
      fieldId: "tet-field",
      msgId: "field-msg",
      nextId: "next-field",
      scoreId: "score",
      levelId: "level",
      linesId: "lines",
      dropKey: (e) => e.key === " " || e.code === "Space",
      leftKey: (e) => e.key === "a" || e.key === "A",
      rightKey: (e) => e.key === "d" || e.key === "D",
      downKey: (e) => e.key === "s" || e.key === "S",
      rotateKey: (e) => e.key === "w" || e.key === "W",
    }),
    createPlayer({
      fieldId: "tet-field-2",
      msgId: "field-msg-2",
      nextId: "next-field-2",
      scoreId: "score-2",
      levelId: "level-2",
      linesId: "lines-2",
      dropKey: (e) => e.key === "Enter",
      leftKey: (e) => e.key === "ArrowLeft",
      rightKey: (e) => e.key === "ArrowRight",
      downKey: (e) => e.key === "ArrowDown",
      rotateKey: (e) => e.key === "ArrowUp",
    }),
  ];

  function createPlayer(cfg) {
    const p = {
      enabled: false,
      running: false,
      controls: cfg,
      tetField: document.getElementById(cfg.fieldId),
      fieldMsg: document.getElementById(cfg.msgId),
      nextField: document.getElementById(cfg.nextId),
      elScore: document.getElementById(cfg.scoreId),
      elLevel: document.getElementById(cfg.levelId),
      elLines: document.getElementById(cfg.linesId),
      tetCells: [],
      nextCells: [],
      board: [],
      bag: [],
      current: null,
      nextType: null,
      nextFaceMap: null,
      score: 0,
      linesTotal: 0,
      level: 1,
      dropMs: 800,
      lastTick: 0,
    };
    for (let i = 0; i < ROWS * COLS; i++) {
      const el = document.createElement("div");
      el.className = "tet-cell";
      p.tetField.appendChild(el);
      p.tetCells.push(el);
    }
    for (let i = 0; i < 16; i++) {
      const el = document.createElement("div");
      el.className = "next-cell";
      p.nextField.appendChild(el);
      p.nextCells.push(el);
    }
    return p;
  }

  function fillForPiece(type) {
    const c = COLORS[type];
    return typeof c === "string" ? c : COLORS.fallback;
  }
  function shuffle(a) { for (let i = a.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function speedForLevel(level) { return Math.max(120, 800 - (level - 1) * 75); }
  function clampStartLevel(value) { const n = Number.parseInt(String(value), 10); return Number.isFinite(n) ? Math.max(1, Math.min(10, n)) : 1; }
  function getShapeCells(type, rot) { const rots = SHAPES[type]; return rots.length === 1 ? rots[0] : rots[rot % rots.length]; }

  function isImageFile(file) {
    if (!file) return false;
    if (typeof file.type === "string" && file.type.startsWith("image/")) return true;
    return IMAGE_EXT_RE.test(file.name || "");
  }
  function disposeFaceObjectUrls() { for (const url of createdFaceObjectUrls) URL.revokeObjectURL(url); createdFaceObjectUrls = []; }
  function setFaceStatus(msg) { if (faceStatus) faceStatus.textContent = msg; }
  function randomFaceStyle() {
    if (faceImages.length === 0) return null;
    return {
      image: faceImages[(Math.random() * faceImages.length) | 0],
      posX: 20 + ((Math.random() * 60) | 0),
      posY: 20 + ((Math.random() * 60) | 0),
      zoom: 170 + ((Math.random() * 90) | 0),
    };
  }
  function createFaceMap() {
    const map = Array.from({ length: 4 }, () => Array(4).fill(null));
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) map[r][c] = randomFaceStyle();
    return map;
  }
  function setFaceImagesFromFiles(fileList) {
    disposeFaceObjectUrls();
    const files = Array.from(fileList || []).filter(isImageFile);
    faceImages = files.map((f) => {
      const url = URL.createObjectURL(f);
      createdFaceObjectUrls.push(url);
      return url;
    });
    for (const p of players) {
      p.nextFaceMap = createFaceMap();
      if (p.current) p.current.faceMap = createFaceMap();
    }
    setFaceStatus(faceImages.length > 0 ? `${faceImages.length} Foto(s) geladen.` : "Keine Fotos gewählt (Farb-Fallback aktiv).");
  }

  function resetPlayer(p, startLevel) {
    p.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null));
    p.bag = shuffle([...BAG]);
    p.nextType = pullFromBag(p);
    p.nextFaceMap = createFaceMap();
    p.current = spawnPiece(p, pullFromBag(p), createFaceMap());
    p.score = 0;
    p.linesTotal = 0;
    p.level = startLevel;
    p.dropMs = speedForLevel(p.level);
    p.lastTick = performance.now();
    p.running = true;
    updateHud(p);
  }
  function pullFromBag(p) { if (p.bag.length === 0) p.bag = shuffle([...BAG]); return p.bag.pop(); }
  function spawnPiece(p, type, faceMap) {
    const shape = getShapeCells(type, 0);
    let minC = 4, maxC = -1, minR = 4;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (shape[r][c]) { minC = Math.min(minC, c); maxC = Math.max(maxC, c); minR = Math.min(minR, r); }
    const w = maxC - minC + 1;
    return { type, rot: 0, row: -minR, col: Math.floor((COLS - w) / 2) - minC, faceMap: faceMap || createFaceMap() };
  }
  function collides(p, piece, dRow, dCol, newRot) {
    const rot = newRot !== undefined ? newRot : piece.rot;
    const shape = getShapeCells(piece.type, rot);
    const row = piece.row + dRow, col = piece.col + dCol;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      if (!shape[r][c]) continue;
      const br = row + r, bc = col + c;
      if (bc < 0 || bc >= COLS || br >= ROWS) return true;
      if (br >= 0 && p.board[br][bc]) return true;
    }
    return false;
  }
  function rotate(p) {
    if (!p.current) return;
    const rots = SHAPES[p.current.type].length;
    if (rots <= 1) return;
    const nextRot = (p.current.rot + 1) % rots;
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!collides(p, p.current, 0, kick, nextRot)) { p.current.col += kick; p.current.rot = nextRot; return; }
    }
  }
  function mergePiece(p) {
    const shape = getShapeCells(p.current.type, p.current.rot);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
      if (!shape[r][c]) continue;
      const br = p.current.row + r, bc = p.current.col + c;
      if (br < 0) { p.running = false; return; }
      p.board[br][bc] = { type: p.current.type, face: p.current.faceMap ? p.current.faceMap[r][c] : null };
    }
  }
  function clearLines(p, startLevel) {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0;) {
      if (p.board[r].every((cell) => cell !== null)) { p.board.splice(r, 1); p.board.unshift(Array(COLS).fill(null)); cleared++; } else r--;
    }
    if (cleared > 0) {
      const lineScores = [0, 100, 300, 500, 800];
      p.score += lineScores[cleared] * p.level;
      p.linesTotal += cleared;
      p.level = Math.min(10, startLevel + Math.floor(p.linesTotal / 10));
      p.dropMs = speedForLevel(p.level);
    }
  }
  function pieceAtCell(piece, br, bc) {
    const shape = getShapeCells(piece.type, piece.rot);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (shape[r][c] && piece.row + r === br && piece.col + c === bc) return true;
    return false;
  }
  function ghostPosition(p) { if (!p.current) return null; let gr = p.current.row; while (!collides(p, { ...p.current, row: gr + 1 }, 0, 0)) gr++; return { ...p.current, row: gr }; }
  function styleCell(el, type, borderStrong, isGhost, faceStyle) {
    if (!type) { el.style.backgroundColor = "#0d1117"; el.style.backgroundImage = "none"; el.style.borderColor = "rgba(255,255,255,0.16)"; el.style.boxShadow = "none"; return; }
    const borderColor = fillForPiece(type);
    if (isGhost) { el.style.backgroundColor = COLORS.ghost; el.style.backgroundImage = "none"; }
    else if (faceStyle) { el.style.backgroundColor = borderColor; el.style.backgroundImage = `url("${faceStyle.image}")`; el.style.backgroundSize = `${faceStyle.zoom}%`; el.style.backgroundPosition = `${faceStyle.posX}% ${faceStyle.posY}%`; }
    else { el.style.backgroundColor = borderColor; el.style.backgroundImage = "none"; }
    el.style.borderColor = borderStrong ? borderColor : "rgba(255,255,255,0.35)";
    el.style.boxShadow = borderStrong ? "inset 0 0 0 1px rgba(255,255,255,0.25)" : "none";
  }
  function renderField(p) {
    const gh = p.current ? ghostPosition(p) : null;
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const el = p.tetCells[r * COLS + c];
      let type = null, face = null, isGhost = false, strong = true;
      const cell = p.board[r][c];
      if (cell) { type = cell.type; face = cell.face; }
      else if (p.current && pieceAtCell(p.current, r, c)) { type = p.current.type; const cr = r - p.current.row, cc = c - p.current.col; face = p.current.faceMap?.[cr]?.[cc] || null; }
      else if (gh && pieceAtCell(gh, r, c)) { type = p.current.type; isGhost = true; strong = false; }
      styleCell(el, type, strong, isGhost, face);
    }
    p.fieldMsg.classList.remove("is-on", "is-pause");
    p.fieldMsg.textContent = "";
    if (paused && p.running) { p.fieldMsg.textContent = "Pause · P"; p.fieldMsg.classList.add("is-on", "is-pause"); }
    else if (!p.running && !p.current) { p.fieldMsg.textContent = "Start drücken"; p.fieldMsg.classList.add("is-on"); }
  }
  function renderNext(p) {
    for (let i = 0; i < 16; i++) { const el = p.nextCells[i]; el.style.backgroundColor = "#161b22"; el.style.backgroundImage = "none"; el.style.borderColor = "rgba(255,255,255,0.22)"; }
    if (!p.nextType) return;
    const shape = getShapeCells(p.nextType, 0);
    const color = fillForPiece(p.nextType);
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (shape[r][c]) styleCell(p.nextCells[r * 4 + c], p.nextType, true, false, p.nextFaceMap?.[r]?.[c] || null), p.nextCells[r * 4 + c].style.borderColor = color;
  }
  function updateHud(p) { p.elScore.textContent = String(p.score); p.elLevel.textContent = String(p.level); p.elLines.textContent = String(p.linesTotal); }
  function anyRunning() { return players.some((p) => p.enabled && p.running); }

  function tickPlayer(p, startLevel) {
    if (!p.enabled || !p.running || paused) return;
    const now = performance.now();
    if (now - p.lastTick < p.dropMs) return;
    p.lastTick = now;
    if (!collides(p, p.current, 1, 0)) p.current.row += 1;
    else {
      mergePiece(p);
      if (!p.running) return;
      clearLines(p, startLevel);
      p.current = spawnPiece(p, p.nextType, p.nextFaceMap);
      p.nextType = pullFromBag(p);
      p.nextFaceMap = createFaceMap();
      if (collides(p, p.current, 0, 0)) p.running = false;
    }
    updateHud(p);
  }
  function hardDrop(p, startLevel) {
    if (!p.running || paused || !p.current) return;
    while (!collides(p, p.current, 1, 0)) { p.current.row += 1; p.score += 2; }
    mergePiece(p);
    if (!p.running) return;
    clearLines(p, startLevel);
    p.current = spawnPiece(p, p.nextType, p.nextFaceMap);
    p.nextType = pullFromBag(p);
    p.nextFaceMap = createFaceMap();
    if (collides(p, p.current, 0, 0)) p.running = false;
    updateHud(p);
  }

  function setMultiplayerUI() { if (player2Panel) player2Panel.classList.toggle("hidden", !multiplayer); }
  function startGame() {
    multiplayer = !!multiplayerToggle?.checked;
    setMultiplayerUI();
    const startLevel = clampStartLevel(startLevelInput ? startLevelInput.value : 1);
    if (startLevelInput) startLevelInput.value = String(startLevel);
    players[0].enabled = true;
    players[1].enabled = multiplayer;
    resetPlayer(players[0], startLevel);
    if (multiplayer) resetPlayer(players[1], startLevel);
    else { players[1].running = false; players[1].current = null; players[1].board = Array.from({ length: ROWS }, () => Array(COLS).fill(null)); updateHud(players[1]); }
    paused = false;
    overlay.classList.add("hidden");
    startBtn.textContent = "Neu starten";
  }

  pickFacesBtn?.addEventListener("click", () => faceFilesInput?.click());
  faceFilesInput?.addEventListener("change", () => setFaceImagesFromFiles(faceFilesInput.files));
  startBtn?.addEventListener("click", startGame);
  multiplayerToggle?.addEventListener("change", () => { multiplayer = !!multiplayerToggle.checked; setMultiplayerUI(); });

  document.addEventListener("keydown", (e) => {
    if (e.key === "p" || e.key === "P") {
      if (!anyRunning()) return;
      paused = !paused;
      e.preventDefault();
      return;
    }
    if (!anyRunning()) return;
    const startLevel = clampStartLevel(startLevelInput ? startLevelInput.value : 1);
    for (const p of players) {
      if (!p.enabled || !p.running || paused || !p.current) continue;
      if (p.controls.leftKey(e)) { if (!collides(p, p.current, 0, -1)) p.current.col -= 1; e.preventDefault(); }
      else if (p.controls.rightKey(e)) { if (!collides(p, p.current, 0, 1)) p.current.col += 1; e.preventDefault(); }
      else if (p.controls.downKey(e)) { if (!collides(p, p.current, 1, 0)) { p.current.row += 1; p.score += 1; updateHud(p); } e.preventDefault(); }
      else if (p.controls.rotateKey(e)) { rotate(p); e.preventDefault(); }
      else if (p.controls.dropKey(e)) { hardDrop(p, startLevel); e.preventDefault(); }
    }
  });

  function loop() {
    const startLevel = clampStartLevel(startLevelInput ? startLevelInput.value : 1);
    for (const p of players) tickPlayer(p, startLevel);
    for (const p of players) if (p.enabled) { renderField(p); renderNext(p); }
    if (!anyRunning() && overlay.classList.contains("hidden")) {
      const p1 = `P1: ${players[0].score}`;
      const p2 = multiplayer ? ` · P2: ${players[1].score}` : "";
      overlayTitle.textContent = "Game Over";
      overlayMsg.textContent = p1 + p2;
      overlay.classList.remove("hidden");
    }
    animFrame = requestAnimationFrame(loop);
  }

  setFaceStatus("Keine Fotos gewählt (Farb-Fallback aktiv).");
  setMultiplayerUI();
  for (const p of players) { p.board = Array.from({ length: ROWS }, () => Array(COLS).fill(null)); updateHud(p); renderField(p); renderNext(p); }
  animFrame = requestAnimationFrame(loop);
})();
