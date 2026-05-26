const canvas = document.getElementById("pinballCanvas");
const ctx = canvas.getContext("2d");
const nameInput = document.getElementById("nameInput");
const countText = document.getElementById("countText");
const statusText = document.getElementById("statusText");
const resultList = document.getElementById("resultList");
const resultModal = document.getElementById("resultModal");
const resultSummary = document.getElementById("resultSummary");
const sampleBtn = document.getElementById("sampleBtn");
const shuffleBtn = document.getElementById("shuffleBtn");
const startBtn = document.getElementById("startBtn");
const resetBtn = document.getElementById("resetBtn");
const copyBtn = document.getElementById("copyBtn");
const closeModalBtn = document.getElementById("closeModalBtn");
const confirmModalBtn = document.getElementById("confirmModalBtn");

const colors = ["#f3b83f", "#4f91ff", "#3bbf87", "#ec5b4e", "#9b6bff", "#f078b6"];
const fixedNames = [
  "김예담",
  "김은지",
  "유예지",
  "김민지",
  "김진은",
  "조유정",
  "임훈정",
  "김기영",
  "노러인",
  "정가현",
  "카밀라",
  "김예진",
  "파울",
  "정진성",
  "원유미",
  "임영현",
  "채영미",
  "박소영",
  "김승태",
  "양재욱",
  "마디나",
  "아지즈",
  "응엔띠하이엔",
  "최동욱",
  "최혜진",
  "홍정옥",
  "허연주",
  "김채호",
  "남미경",
  "오영재교수님",
  "박승배교수님",
  "이병학교수님",
  "편정민교수님",
  "박우혁교수님",
  "노준구교수님",
  "이은실교수님",
  "유은교수님"
];

let balls = [];
let pegs = [];
let results = [];
let animationId = null;
let running = false;
let finishCounter = 0;
let lastTime = 0;

function parseNames() {
  // 참가자 고정: 입력창 내용과 관계없이 고정 명단 사용
  return [...fixedNames];
}

function updateCount() {
  countText.textContent = parseNames().length;
}

function shuffle(array) {
  const next = [...array];
  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function getPrizeLane(label) {
  if (label === "거치대") return 0;
  if (label === "USB") return 1;
  if (label === "C타입 허브") return 2;
  return 3;
}

function getPrize(rank) {
  if (rank <= 15) return { label: "거치대", color: "#f3b83f" };
  if (rank <= 20) return { label: "USB", color: "#4f91ff" };
  if (rank <= 25) return { label: "C타입 허브", color: "#3bbf87" };
  return { label: "메모지", color: "#f4df9f" };
}

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(rect.width * ratio);
  canvas.height = Math.round(rect.height * ratio);
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  buildPegs(rect.width, rect.height);
  layoutFinishedBalls();
  if (!running) draw();
}

function buildPegs(width, height) {
  pegs = [];
  const rows = 12;
  const top = 92;
  const gapY = Math.max(32, (height - 250) / rows);
  const gapX = Math.max(48, width / 12);

  [
    { x: width / 2, y: top + 38, r: 22, bumper: true },
    { x: width / 2 - width * 0.16, y: top + 112, r: 18, bumper: true },
    { x: width / 2 + width * 0.16, y: top + 112, r: 18, bumper: true },
    { x: width / 2 - width * 0.28, y: top + 206, r: 15, bumper: true },
    { x: width / 2 + width * 0.28, y: top + 206, r: 15, bumper: true }
  ].forEach((bumper) => pegs.push(bumper));

  for (let row = 0; row < rows; row += 1) {
    const y = top + row * gapY;
    const offset = row % 2 === 0 ? gapX / 2 : 0;
    for (let x = gapX; x < width - gapX / 2; x += gapX) {
      const wave = Math.sin(row * 1.7 + x * 0.015) * 9;
      pegs.push({ x: x + offset + wave, y, r: row % 3 === 0 ? 9 : 7 });
    }
  }
}

function makeBalls(names) {
  const width = canvas.clientWidth;
  const directions = shuffle(names.map((_, index) => {
    const side = index % 2 === 0 ? 1 : -1;
    const strength = 44 + (index % 6) * 18;
    return side * strength;
  }));

  return names.map((name, index) => ({
    id: `${name}-${index}-${Date.now()}`,
    name,
    x: width / 2 + (Math.random() - 0.5) * 34,
    y: 36 + (Math.random() - 0.5) * 8,
    vx: directions[index] + (Math.random() - 0.5) * 24,
    vy: 18 + Math.random() * 18,
    r: 16,
    color: colors[index % colors.length],
    finished: false,
    rank: null,
    prize: null,
    drift: (Math.random() - 0.5) * 2,
    trail: []
  }));
}

function drawMachine(width, height) {
  ctx.clearRect(0, 0, width, height);

  ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
  ctx.fillRect(18, 18, width - 36, height - 36);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.22)";
  ctx.lineWidth = 3;
  ctx.strokeRect(20, 20, width - 40, height - 40);

  ctx.fillStyle = "#ec5b4e";
  ctx.beginPath();
  ctx.moveTo(width / 2 - 80, 24);
  ctx.lineTo(width / 2 + 80, 24);
  ctx.lineTo(width / 2 + 42, 76);
  ctx.lineTo(width / 2 - 42, 76);
  ctx.closePath();
  ctx.fill();

  pegs.forEach((peg) => {
    ctx.beginPath();
    ctx.arc(peg.x, peg.y, peg.r, 0, Math.PI * 2);
    ctx.fillStyle = peg.bumper ? "#ec5b4e" : "#f7f4ed";
    ctx.fill();
    ctx.strokeStyle = peg.bumper ? "rgba(255, 255, 255, 0.72)" : "rgba(0, 0, 0, 0.28)";
    ctx.lineWidth = peg.bumper ? 3 : 2;
    ctx.stroke();

    if (peg.bumper) {
      ctx.beginPath();
      ctx.arc(peg.x, peg.y, peg.r + 8, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(236, 91, 78, 0.24)";
      ctx.lineWidth = 5;
      ctx.stroke();
    }
  });

  const baseY = height - 86;
  const laneWidth = (width - 40) / 4;
  const laneColors = ["#f3b83f", "#4f91ff", "#3bbf87", "#f4df9f"];
  for (let i = 0; i < 4; i += 1) {
    ctx.fillStyle = laneColors[i];
    ctx.globalAlpha = 0.22;
    ctx.fillRect(20 + i * laneWidth, baseY, laneWidth, 48);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.35)";
    ctx.beginPath();
    ctx.moveTo(20 + i * laneWidth, baseY);
    ctx.lineTo(20 + i * laneWidth, height - 38);
    ctx.stroke();
  }

  ctx.fillStyle = "rgba(255, 255, 255, 0.88)";
  ctx.font = "700 13px Arial";
  ctx.textAlign = "center";
  ["거치대", "USB", "허브", "메모지"].forEach((label, i) => {
    ctx.fillText(label, 20 + laneWidth * i + laneWidth / 2, baseY + 30);
  });
}

function drawBallName(ball) {
  const label = ball.name.length > 3 ? ball.name.slice(0, 3) : ball.name;
  let fontSize = 13;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `900 ${fontSize}px Arial`;

  while (ctx.measureText(label).width > ball.r * 1.62 && fontSize > 9) {
    fontSize -= 1;
    ctx.font = `900 ${fontSize}px Arial`;
  }

  ctx.fillStyle = "#11151d";
  ctx.fillText(label, ball.x, ball.y + 0.5);
}

function drawBallTrail(ball) {
  if (ball.finished || ball.trail.length < 2) return;

  for (let i = 0; i < ball.trail.length; i += 1) {
    const point = ball.trail[i];
    const alpha = (i + 1) / ball.trail.length;
    ctx.beginPath();
    ctx.arc(point.x, point.y, ball.r * (0.36 + alpha * 0.24), 0, Math.PI * 2);
    ctx.fillStyle = `${ball.color}${Math.round(alpha * 58).toString(16).padStart(2, "0")}`;
    ctx.fill();
  }
}

function drawBall(ball) {
  drawBallTrail(ball);

  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = ball.prize?.color || ball.color;
  ctx.fill();
  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = 2;
  ctx.stroke();

  drawBallName(ball);
}

function draw() {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  drawMachine(width, height);
  balls.forEach(drawBall);
}

function resolvePegCollision(ball, peg) {
  const dx = ball.x - peg.x;
  const dy = ball.y - peg.y;
  const distance = Math.hypot(dx, dy);
  const minDistance = ball.r + peg.r;
  if (distance >= minDistance || distance === 0) return;

  const nx = dx / distance;
  const ny = dy / distance;
  const overlap = minDistance - distance;
  ball.x += nx * overlap;
  ball.y += ny * overlap;

  const velocityAlongNormal = ball.vx * nx + ball.vy * ny;
  if (velocityAlongNormal < 0) {
    const bounce = peg.bumper ? 2.45 : 1.95;
    ball.vx -= bounce * velocityAlongNormal * nx;
    ball.vy -= bounce * velocityAlongNormal * ny;
  }
  ball.vx += (Math.random() - 0.5) * (peg.bumper ? 230 : 142);
  ball.vy -= Math.random() * (peg.bumper ? 56 : 32);
}

function resolveBallCollision(a, b) {
  if (a.finished || b.finished) return;
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const distance = Math.hypot(dx, dy);
  const minDistance = a.r + b.r;
  if (distance >= minDistance || distance === 0) return;

  const nx = dx / distance;
  const ny = dy / distance;
  const overlap = (minDistance - distance) / 2;
  a.x += nx * overlap;
  a.y += ny * overlap;
  b.x -= nx * overlap;
  b.y -= ny * overlap;

  const tx = -ny;
  const ty = nx;
  const dpTanA = a.vx * tx + a.vy * ty;
  const dpTanB = b.vx * tx + b.vy * ty;
  const dpNormA = a.vx * nx + a.vy * ny;
  const dpNormB = b.vx * nx + b.vy * ny;

  a.vx = tx * dpTanA + nx * dpNormB;
  a.vy = ty * dpTanA + ny * dpNormB;
  b.vx = tx * dpTanB + nx * dpNormA;
  b.vy = ty * dpTanB + ny * dpNormA;
}

function positionFinishedBall(ball, laneOrder) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const laneWidth = (width - 40) / 4;
  const lane = getPrizeLane(ball.prize.label);
  const countInLane = laneOrder ?? balls.filter(
    (item) => item.finished && item.prize?.label === ball.prize.label && item.rank <= ball.rank
  ).length - 1;
  const diameter = ball.r * 2;
  const columns = Math.max(1, Math.floor((laneWidth - 22) / (diameter + 4)));
  const column = countInLane % columns;
  const row = Math.floor(countInLane / columns);
  const usableWidth = Math.max(diameter, laneWidth - 28);
  const gap = columns === 1 ? 0 : usableWidth / (columns - 1);
  const laneLeft = 20 + lane * laneWidth;

  ball.x = laneLeft + 14 + ball.r + column * gap;
  ball.y = height - 56 - row * (diameter * 0.86);
}

function layoutFinishedBalls() {
  const laneCounts = {};
  balls
    .filter((ball) => ball.finished)
    .sort((a, b) => a.rank - b.rank)
    .forEach((ball) => {
      const label = ball.prize.label;
      const laneOrder = laneCounts[label] || 0;
      positionFinishedBall(ball, laneOrder);
      laneCounts[label] = laneOrder + 1;
    });
}

function finishBall(ball) {
  finishCounter += 1;
  const prize = getPrize(finishCounter);
  ball.finished = true;
  ball.rank = finishCounter;
  ball.prize = prize;
  ball.vx = 0;
  ball.vy = 0;
  ball.trail = [];
  const laneOrder = results.filter((result) => result.prize === prize.label).length;
  positionFinishedBall(ball, laneOrder);

  results.push({ rank: finishCounter, name: ball.name, prize: prize.label });
  renderResults();

  if (results.length === balls.length) {
    running = false;
    startBtn.disabled = false;
    shuffleBtn.disabled = false;
    sampleBtn.disabled = false;
    statusText.textContent = "추첨 완료";
    cancelAnimationFrame(animationId);
    animationId = null;
    draw();
    showResultsModal();
  }
}

function step(timestamp) {
  if (!lastTime) lastTime = timestamp;
  const dt = Math.min((timestamp - lastTime) / 1000, 0.02);
  lastTime = timestamp;

  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const finishY = height - 92;

  balls.forEach((ball) => {
    if (ball.finished) return;

    const pulse = Math.sin(timestamp * 0.006 + ball.y * 0.045 + ball.x * 0.012);
    ball.vy += 470 * dt;
    const centerPush = ((ball.x - width / 2) / Math.max(1, width / 2)) * 28;
    ball.vx += (pulse * 74 + centerPush + ball.drift * 34) * dt + (Math.random() - 0.5) * 126 * dt;
    ball.x += ball.vx * dt;
    ball.y += ball.vy * dt;
    ball.trail.push({ x: ball.x, y: ball.y });
    if (ball.trail.length > 8) ball.trail.shift();

    if (ball.x - ball.r < 24) {
      ball.x = 24 + ball.r;
      ball.vx = Math.abs(ball.vx) * 0.9 + 26;
    }
    if (ball.x + ball.r > width - 24) {
      ball.x = width - 24 - ball.r;
      ball.vx = -Math.abs(ball.vx) * 0.9 - 26;
    }

    pegs.forEach((peg) => resolvePegCollision(ball, peg));

    ball.vx = Math.max(-330, Math.min(330, ball.vx * 0.991));
    ball.vy = Math.max(-210, Math.min(470, ball.vy * 0.996));

    if (ball.y > finishY) finishBall(ball);
  });

  for (let i = 0; i < balls.length; i += 1) {
    for (let j = i + 1; j < balls.length; j += 1) {
      resolveBallCollision(balls[i], balls[j]);
    }
  }

  draw();
  if (running) animationId = requestAnimationFrame(step);
}

function renderResults() {
  resultList.innerHTML = "";
  resultSummary.innerHTML = "";

  const summary = results.reduce(
    (acc, result) => {
      acc[result.prize] = (acc[result.prize] || 0) + 1;
      return acc;
    },
    { "거치대": 0, "USB": 0, "C타입 허브": 0, "메모지": 0 }
  );

  Object.entries(summary).forEach(([prize, count]) => {
    const item = document.createElement("span");
    item.textContent = `${prize} ${count}명`;
    resultSummary.appendChild(item);
  });

  results.forEach((result) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${result.rank}등</strong><span>${result.name}</span><em>${result.prize}</em>`;
    resultList.appendChild(item);
  });
}

function showResultsModal() {
  renderResults();
  resultModal.classList.add("open");
  resultModal.setAttribute("aria-hidden", "false");
  confirmModalBtn.focus();
}

function closeResultsModal() {
  resultModal.classList.remove("open");
  resultModal.setAttribute("aria-hidden", "true");
}

function resetGame(clearNames = false) {
  running = false;
  cancelAnimationFrame(animationId);
  animationId = null;
  balls = [];
  results = [];
  finishCounter = 0;
  lastTime = 0;
  startBtn.disabled = false;
  shuffleBtn.disabled = false;
  sampleBtn.disabled = false;
  statusText.textContent = "고정 참가자 명단으로 추첨을 시작하세요";
  if (clearNames) nameInput.value = fixedNames.join("\n");
  closeResultsModal();
  updateCount();
  renderResults();
  draw();
}

function prepareDraw() {
  const names = parseNames();
  if (!names.length) {
    statusText.textContent = "참가자 이름을 먼저 입력하세요";
    return false;
  }
  const mixed = shuffle(names);
  nameInput.value = fixedNames.join("\n");
  balls = makeBalls(mixed);
  results = [];
  finishCounter = 0;
  lastTime = 0;
  renderResults();
  updateCount();
  draw();
  return true;
}

sampleBtn.addEventListener("click", () => {
  if (running) return;
  nameInput.value = fixedNames.join("\n");
  resetGame(false);
  statusText.textContent = "고정 명단으로 설정되었습니다";
});

shuffleBtn.addEventListener("click", () => {
  if (running) return;
  if (prepareDraw()) statusText.textContent = "참가자 순서를 섞었습니다";
});

startBtn.addEventListener("click", () => {
  if (running) return;
  if (!prepareDraw()) return;
  running = true;
  startBtn.disabled = true;
  shuffleBtn.disabled = true;
  sampleBtn.disabled = true;
  statusText.textContent = "핀볼 추첨 진행 중";
  animationId = requestAnimationFrame(step);
});

resetBtn.addEventListener("click", () => resetGame(false));

copyBtn.addEventListener("click", async () => {
  const text = results.map((result) => `${result.rank}등 ${result.name} - ${result.prize}`).join("\n");
  if (!text) {
    statusText.textContent = "복사할 결과가 없습니다";
    return;
  }
  await navigator.clipboard.writeText(text);
  statusText.textContent = "결과를 복사했습니다";
});

closeModalBtn.addEventListener("click", closeResultsModal);
confirmModalBtn.addEventListener("click", closeResultsModal);
resultModal.addEventListener("click", (event) => {
  if (event.target === resultModal) closeResultsModal();
});
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && resultModal.classList.contains("open")) {
    closeResultsModal();
  }
});

nameInput.addEventListener("input", updateCount);
window.addEventListener("resize", resizeCanvas);

nameInput.value = fixedNames.join("\n");
nameInput.readOnly = true;
sampleBtn.disabled = true;
updateCount();
resizeCanvas();
