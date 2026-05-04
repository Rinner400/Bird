const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const stateEl = document.getElementById('state');

const GAME_STATE = {
  WAITING: 'waiting',
  PLAYING: 'playing',
  GAME_OVER: 'game_over'
};

const world = {
  width: canvas.width,
  height: canvas.height,
  gravity: 1650,
  flapVelocity: -420,
  scrollSpeed: 160,
  groundHeight: 90,
  pipeWidth: 70,
  pipeGap: 170,
  pipeInterval: 1.45,
  minPipeTop: 60,
  maxPipeTop: 340
};

let gameState = GAME_STATE.WAITING;
let score = 0;
let best = Number(localStorage.getItem('flappy-best') ?? 0);
let pipes = [];
let pipeSpawnTimer = 0;

const bird = {
  x: 110,
  y: world.height / 2,
  radius: 16,
  velocityY: 0,
  rotation: 0
};

bestEl.textContent = String(best);

function resetRound() {
  score = 0;
  pipes = [];
  pipeSpawnTimer = 0;
  bird.y = world.height / 2;
  bird.velocityY = 0;
  bird.rotation = 0;
  scoreEl.textContent = '0';
}

function startGame() {
  resetRound();
  gameState = GAME_STATE.PLAYING;
  stateEl.textContent = 'Playing';
  flap();
}

function flap() {
  if (gameState === GAME_STATE.WAITING) {
    startGame();
    return;
  }
  if (gameState === GAME_STATE.GAME_OVER) {
    gameState = GAME_STATE.WAITING;
    stateEl.textContent = 'Press Space / Click to Start';
    resetRound();
    return;
  }
  bird.velocityY = world.flapVelocity;
}

function spawnPipe() {
  const topHeight = Math.random() * (world.maxPipeTop - world.minPipeTop) + world.minPipeTop;
  pipes.push({
    x: world.width,
    topHeight,
    passed: false
  });
}

function setGameOver() {
  gameState = GAME_STATE.GAME_OVER;
  stateEl.textContent = 'Game Over — Press Space / Click to Restart';
  if (score > best) {
    best = score;
    localStorage.setItem('flappy-best', String(best));
    bestEl.textContent = String(best);
  }
}

function intersectsPipe(pipe) {
  const gapTop = pipe.topHeight;
  const gapBottom = pipe.topHeight + world.pipeGap;
  const birdLeft = bird.x - bird.radius;
  const birdRight = bird.x + bird.radius;

  const insidePipeX = birdRight > pipe.x && birdLeft < pipe.x + world.pipeWidth;
  if (!insidePipeX) return false;

  return bird.y - bird.radius < gapTop || bird.y + bird.radius > gapBottom;
}

function update(dt) {
  if (gameState !== GAME_STATE.PLAYING) return;

  bird.velocityY += world.gravity * dt;
  bird.y += bird.velocityY * dt;
  bird.rotation = Math.max(-0.6, Math.min(1.2, bird.velocityY / 500));

  pipeSpawnTimer += dt;
  if (pipeSpawnTimer >= world.pipeInterval) {
    pipeSpawnTimer = 0;
    spawnPipe();
  }

  for (const pipe of pipes) {
    pipe.x -= world.scrollSpeed * dt;

    if (!pipe.passed && pipe.x + world.pipeWidth < bird.x) {
      pipe.passed = true;
      score += 1;
      scoreEl.textContent = String(score);
    }

    if (intersectsPipe(pipe)) {
      setGameOver();
    }
  }

  pipes = pipes.filter((pipe) => pipe.x + world.pipeWidth > -10);

  const hitGround = bird.y + bird.radius >= world.height - world.groundHeight;
  const hitCeiling = bird.y - bird.radius <= 0;
  if (hitGround || hitCeiling) {
    setGameOver();
  }
}

function drawBackground() {
  const h = world.height - world.groundHeight;
  ctx.fillStyle = '#70c5ce';
  ctx.fillRect(0, 0, world.width, h);

  ctx.fillStyle = '#8ed081';
  ctx.fillRect(0, h, world.width, world.groundHeight);

  ctx.fillStyle = '#70b860';
  ctx.fillRect(0, h, world.width, 12);
}

function drawPipes() {
  for (const pipe of pipes) {
    const gapBottom = pipe.topHeight + world.pipeGap;

    ctx.fillStyle = '#4caf50';
    ctx.fillRect(pipe.x, 0, world.pipeWidth, pipe.topHeight);
    ctx.fillRect(pipe.x, gapBottom, world.pipeWidth, world.height - gapBottom - world.groundHeight);

    ctx.fillStyle = '#3e8f42';
    ctx.fillRect(pipe.x - 4, pipe.topHeight - 22, world.pipeWidth + 8, 22);
    ctx.fillRect(pipe.x - 4, gapBottom, world.pipeWidth + 8, 22);
  }
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x, bird.y);
  ctx.rotate(bird.rotation);

  ctx.fillStyle = '#ffd54f';
  ctx.beginPath();
  ctx.arc(0, 0, bird.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(6, -5, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(7, -5, 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ff8f00';
  ctx.beginPath();
  ctx.moveTo(12, 2);
  ctx.lineTo(22, 0);
  ctx.lineTo(12, -2);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function render() {
  ctx.clearRect(0, 0, world.width, world.height);
  drawBackground();
  drawPipes();
  drawBird();
}

let last = performance.now();
function loop(now) {
  const dt = Math.min((now - last) / 1000, 0.033);
  last = now;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' || e.code === 'ArrowUp') {
    e.preventDefault();
    flap();
  }
});

canvas.addEventListener('pointerdown', flap);

resetRound();
render();
requestAnimationFrame(loop);
