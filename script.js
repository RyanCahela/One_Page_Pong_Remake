const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const STEP = 1 / 60;
const MAX_STEP = STEP * 5;

let deltaTime = 0;
let timeOfLastFrame = 0;
canvas.addEventListener("mousemove", (e) => handleMouseMove(e));

//ENTITIES
const playerPaddle = {
  fillStyle: "blue",
  height: 100,
  position: { x: 25, y: 0 },
  width: 20,
};

const aiPaddle = {
  fillStyle: "lightgreen",
  height: 100,
  position: { x: WIDTH - 25, y: 0 },
  width: 20,
};

const ball = {
  direction: { x: 1, y: 1 },
  fillStyle: "red",
  height: 20,
  speed: 500,
  position: { x: 50, y: 50 },
  width: 20,
};

//END ENETITIES

//GAME LOOP
function loop(ms) {
  requestAnimationFrame(loop);
  const currentTime = ms / 1000;
  deltaTime = Math.min(currentTime - timeOfLastFrame, MAX_STEP);
  timeOfLastFrame = currentTime;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  updatePositions();

  checkForCollisions();

  drawRect(playerPaddle);
  drawRect(aiPaddle);
  drawRect(ball);
}
//END GAME LOOP

//HELPER FUNCTIONS
function updatePositions() {
  ball.position.x += ball.speed * ball.direction.x * deltaTime;
  ball.position.y += ball.speed * ball.direction.y * deltaTime;

  aiPaddle.position.y = ball.position.y - aiPaddle.height / 2;
}

function checkForCollisions() {
  const { position: ballPos, direction: ballDir } = ball;
  const { position: paddlePos } = playerPaddle;
  const { position: aiPaddlePos } = aiPaddle;
  const topBound = 0;
  const leftBound = 0;
  const rightBound = WIDTH;
  const bottomBound = HEIGHT;

  //ball collisions with map
  if (ballPos.x + ball.width > rightBound) {
    ball.direction.x = flipSignValue(ballDir.x);
  }
  if (ballPos.x < leftBound) {
    resetBall();
  }
  if (ballPos.y + ball.height > bottomBound) {
    ball.direction.y = flipSignValue(ballDir.y);
  }
  if (ballPos.y < topBound) {
    ball.direction.y = flipSignValue(ballDir.y);
  }

  //Define Axis-Aligned Bounding Boxes
  const paddleY1 = paddlePos.y;
  const paddleY2 = paddlePos.y + playerPaddle.height;
  const paddleX1 = paddlePos.x;
  const paddleX2 = paddlePos.x + playerPaddle.width;

  const aiPaddleY1 = aiPaddlePos.y;
  const aiPaddleY2 = aiPaddlePos.y + aiPaddle.height;
  const aiPaddleX1 = aiPaddlePos.x;
  const aiPaddleX2 = aiPaddlePos.x + aiPaddle.width;

  const ballY1 = ballPos.y;
  const ballY2 = ballPos.y + ball.height;
  const ballX1 = ballPos.x;
  const ballX2 = ballPos.x + ball.width;

  //ball collides with player paddle
  if (
    paddleX2 >= ballX1 &&
    paddleX1 <= ballX2 &&
    paddleY1 <= ballY2 &&
    paddleY2 >= ballY1
  ) {
    //calculate ball trajetory depending where it hit paddle
    const d = distanceFromCenter(ball, playerPaddle);
    console.log("d", d);
    ball.direction.y = flipSignValue(d);
    ball.direction.x = flipSignValue(ballDir.x);
  }
  //end ball collision with player paddle

  //ball collision with AI paddle
  if (
    aiPaddleX1 <= ballX2 &&
    aiPaddleX2 >= ballX1 &&
    aiPaddleY1 <= ballY2 &&
    aiPaddleY2 >= ballY1
  ) {
    console.log("hit!");
    const d = distanceFromCenter(ball, aiPaddle);
    ball.direction.y = flipSignValue(d);
    ball.direction.x = flipSignValue(ballDir.x);
  }
  //end ball coliison with AI
}

function distanceFromCenter(ball, paddle) {
  const ballYCenter = ball.position.y + ball.height / 2;
  const paddleYCenter = paddle.position.y + paddle.height / 2;
  const distanceFromCenter = (paddleYCenter - ballYCenter) * 0.01;

  console.log("distanceFromCenter", distanceFromCenter);

  return clamp(distanceFromCenter, -2, 2);
}

function flipSignValue(value) {
  return -value;
}

function drawCircle(entity) {
  const { position, fillStyle, radius } = entity;
  ctx.fillStyle = fillStyle;
  ctx.beginPath();
  ctx.arc(position.x, position.y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawRect(entity) {
  const { position, fillStyle, width, height } = entity;
  ctx.fillStyle = fillStyle;
  ctx.fillRect(position.x, position.y, width, height);
}

function resetBall() {
  ball.position = { x: 50, y: 50 };
  ball.direction = { x: 1, y: 1 };
}

function handleMouseMove(e) {
  const { offsetX, offsetY } = e;
  playerPaddle.position.y = offsetY - playerPaddle.height / 2;
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}

requestAnimationFrame(loop);
