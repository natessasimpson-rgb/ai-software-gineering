// Simple Pong game: left paddle = player (mouse + arrow keys), right paddle = computer AI.

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

// DOM score elements
const playerScoreEl = document.getElementById('playerScore');
const computerScoreEl = document.getElementById('computerScore');

// Paddle config
const P_WIDTH = 10;
const P_HEIGHT = 100;
const P_MARGIN = 14;
const PLAYER_SPEED = 7;
const AI_SPEED = 5;

// Ball config
const BALL_RADIUS = 8;
const BALL_BASE_SPEED = 5;
const BALL_SPEED_INCREASE = 1.05;

// Game state
let playerScore = 0;
let computerScore = 0;

const player = {
  x: P_MARGIN,
  y: (H - P_HEIGHT) / 2,
  width: P_WIDTH,
  height: P_HEIGHT,
  dy: 0
};

const computer = {
  x: W - P_MARGIN - P_WIDTH,
  y: (H - P_HEIGHT) / 2,
  width: P_WIDTH,
  height: P_HEIGHT,
  dy: 0
};

const ball = {
  x: W / 2,
  y: H / 2,
  vx: 0,
  vy: 0,
  speed: BALL_BASE_SPEED,
  radius: BALL_RADIUS
};

// Controls
const keys = { ArrowUp: false, ArrowDown: false };
let mouseActive = false;

// Utility
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

// Initialize / serve ball (direction: -1 to left, 1 to right, or random)
function serve(direction = (Math.random() < 0.5 ? -1 : 1)) {
  ball.x = W / 2;
  ball.y = H / 2;
  ball.speed = BALL_BASE_SPEED;
  const angle = (Math.random() * Math.PI / 3) - (Math.PI / 6); // -30° .. 30°
  ball.vx = direction * ball.speed * Math.cos(angle);
  ball.vy = ball.speed * Math.sin(angle);
}

// Reset scores and ball
function resetScores() {
  playerScore = 0;
  computerScore = 0;
  updateScoreboard();
  serve();
}

// Update scoreboard DOM
function updateScoreboard(){
  playerScoreEl.textContent = playerScore;
  computerScoreEl.textContent = computerScore;
}

// Draw helpers
function drawRect(x,y,w,h,color='#fff'){
  ctx.fillStyle = color;
  ctx.fillRect(x,y,w,h);
}
function drawCircle(x,y,r,color='#fff'){
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x,y,r,0,Math.PI*2);
  ctx.fill();
}
function drawCenterLine(){
  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 2;
  ctx.setLineDash([10, 14]);
  ctx.beginPath();
  ctx.moveTo(W/2, 0);
  ctx.lineTo(W/2, H);
  ctx.stroke();
  ctx.setLineDash([]);
}

// Collision detection between ball and paddle (AABB vs circle approximation)
function hitPaddle(paddle) {
  // A simple and effective check: if ball within paddle's x-range and y-range.
  const left = paddle.x;
  const right = paddle.x + paddle.width;
  const top = paddle.y;
  const bottom = paddle.y + paddle.height;

  if (ball.x - ball.radius <= right && ball.x + ball.radius >= left &&
      ball.y + ball.radius >= top && ball.y - ball.radius <= bottom) {
    return true;
  }
  return false;
}

// Game loop
function update() {
  // Player keyboard movement
  if (!mouseActive) {
    if (keys.ArrowUp) player.y -= PLAYER_SPEED;
    if (keys.ArrowDown) player.y += PLAYER_SPEED;
  } else {
    // mouse sets position directly in mousemove handler
    // keyboard still works in case user presses keys while mouse outside
    if (keys.ArrowUp) player.y -= PLAYER_SPEED;
    if (keys.ArrowDown) player.y += PLAYER_SPEED;
  }
  // Clamp player
  player.y = clamp(player.y, 0, H - player.height);

  // Simple AI: move toward the ball
  const targetY = ball.y - computer.height / 2;
  if (computer.y + computer.height/2 < ball.y - 6) {
    computer.y += AI_SPEED;
  } else if (computer.y + computer.height/2 > ball.y + 6) {
    computer.y -= AI_SPEED;
  }
  // Clamp computer
  computer.y = clamp(computer.y, 0, H - computer.height);

  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Top/bottom collision
  if (ball.y - ball.radius <= 0) {
    ball.y = ball.radius;
    ball.vy *= -1;
  } else if (ball.y + ball.radius >= H) {
    ball.y = H - ball.radius;
    ball.vy *= -1;
  }

  // Paddle collisions
  if (hitPaddle(player) && ball.vx < 0) {
    // Reflect
    ball.x = player.x + player.width + ball.radius; // push outside paddle
    ball.vx = Math.abs(ball.vx) * BALL_SPEED_INCREASE;
    // adjust vy based on where it hit the paddle
    const relativeY = (ball.y - (player.y + player.height/2));
    ball.vy = relativeY * 0.12;
  } else if (hitPaddle(computer) && ball.vx > 0) {
    ball.x = computer.x - ball.radius; // push outside paddle
    ball.vx = -Math.abs(ball.vx) * BALL_SPEED_INCREASE;
    const relativeY = (ball.y - (computer.y + computer.height/2));
    ball.vy = relativeY * 0.12;
  }

  // Left/right goals
  if (ball.x + ball.radius < 0) {
    // computer scores
    computerScore++;
    updateScoreboard();
    serve(1); // serve to left player
  } else if (ball.x - ball.radius > W) {
    // player scores
    playerScore++;
    updateScoreboard();
    serve(-1); // serve to right/player
  }
}

function render() {
  ctx.clearRect(0,0,W,H);

  // Background and center line
  drawCenterLine();

  // Paddles
  drawRect(player.x, player.y, player.width, player.height, '#ffffff');
  drawRect(computer.x, computer.y, computer.width, computer.height, '#ffffff');

  // Ball
  drawCircle(ball.x, ball.y, ball.radius, '#00d4ff');
}

// Main loop
function loop() {
  update();
  render();
  requestAnimationFrame(loop);
}

// Input handlers
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const mouseY = e.clientY - rect.top;
  // Center paddle on mouse Y
  player.y = clamp(mouseY - player.height / 2, 0, H - player.height);
  mouseActive = true;
});
canvas.addEventListener('mouseleave', () => { mouseActive = false; });

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    keys[e.key] = true;
    e.preventDefault(); // prevent page scroll
  }
});
window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    keys[e.key] = false;
    e.preventDefault();
  }
});

// Start the game
updateScoreboard();
serve(); // initial serve
requestAnimationFrame(loop);
