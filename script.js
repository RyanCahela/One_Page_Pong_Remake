const canvas = document.getElementById("canvas");
const playerSFX = document.getElementById("player_ping");
const aiSFX = document.getElementById("ai_ping");
const gameOverSFX = document.getElementById("game_over_ping");
const startGameButton = document.getElementById("start_game_button");
const restartGameButton = document.getElementById("restart_game_button");
const pauseGameButton = document.getElementById("pause_game_button");
const ctx = canvas.getContext("2d");
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const STEP = 1 / 60;
const MAX_STEP = STEP * 5;
const offBlack = "#212121";
const offWhite = "#FAFAFA";
const materialRed = "#f44336";
const materialBlue = "#2196F3";
const ballColors = [
  "#8BC34A",
  "#FF5722",
  "#9C27B0",
  "#E91E63",
  "#00BCD4",
  materialRed,
  materialBlue,
];
const indexTracker = createIndexTracker(ballColors.length - 1);

let loopId = null;
let deltaTime = 0;
let timeOfLastFrame = 0;
let scores = {
  player: 0,
  ai: 0,
};
canvas.addEventListener("mousemove", (e) => handleMouseMove(e));
startGameButton.addEventListener("click", startGame);
restartGameButton.addEventListener("click", restartGame);
pauseGameButton.addEventListener("click", pauseGame);

//ENTITIES
const playerPaddle = {
  fillStyle: materialBlue,
  height: 100,
  position: { x: 25, y: HEIGHT / 2 },
  width: 20,
};

const aiPaddle = {
  fillStyle: materialRed,
  height: 100,
  position: { x: WIDTH - 45, y: HEIGHT / 2 },
  width: 20,
  difficulty: 0.01, //percentToMove
};

const ball = {
  direction: { x: 1, y: 1 },
  fillStyle: ballColors[0],
  height: 20,
  speed: 400,
  position: { x: 50, y: 50 },
  width: 20,
};

//END ENETITIES

//GAME LOOP
function loop(ms) {
  loopId = requestAnimationFrame(loop);
  const currentTime = ms / 1000;
  deltaTime = Math.min(currentTime - timeOfLastFrame, MAX_STEP);
  timeOfLastFrame = currentTime;

  ctx.clearRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = offBlack;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  checkScore("player");
  checkScore("ai");
  displayScores(scores);
  drawMiddleNet();

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

  const ballCenterY = ball.position.y + ball.height / 2;
  const aiPaddleCenterY = aiPaddle.position.y + aiPaddle.height / 2;
  const aiPaddleY1 = aiPaddle.position.y;
  const aiPaddleY2 = aiPaddle.position.y + aiPaddle.height;

  if (aiPaddleY1 >= ballCenterY) {
    //ball above paddle - paddle need to move up
    aiPaddle.position.y -= Math.random() >= 0.5 ? 0 : 5;
  } else if (aiPaddleY2 <= ballCenterY) {
    //ball below paddle - paddle need to move down
    aiPaddle.position.y += Math.random() >= 0.5 ? 0 : 5;
  }
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
    resetBall("left");
    increaseScore("player");
    gameOverSFX.play();
  }
  if (ballPos.x < leftBound) {
    resetBall("right");
    increaseScore("ai");
    gameOverSFX.play();
  }
  if (ballPos.y + ball.height > bottomBound) {
    ball.position.y = HEIGHT - ball.height;
    ball.direction.y = flipSignValue(ballDir.y);
    playPlayerSFX();
  }
  if (ballPos.y < topBound) {
    ball.position.y = 0;
    ball.direction.y = flipSignValue(ballDir.y);
    playPlayerSFX();
  }
  //end ball collisions with map

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
  //end Define Axis-Alighed Bounding Boxes

  //paddles collide with top and bottom of map
  if (paddleY1 < topBound) playerPaddle.position.y = topBound;
  if (paddleY2 > bottomBound) {
    playerPaddle.position.y = bottomBound - playerPaddle.height;
  }
  if (aiPaddleY1 < topBound) aiPaddle.position.y = topBound;
  if (aiPaddleY2 > bottomBound) {
    console.log("locked");
    aiPaddle.position.y = bottomBound - aiPaddle.height;
  }
  //end paddles collide with top and bottom of map

  //ball collides with player paddle
  if (
    paddleX2 >= ballX1 &&
    paddleX1 <= ballX2 &&
    paddleY1 <= ballY2 &&
    paddleY2 >= ballY1
  ) {
    //calculate ball trajetory depending where it hit paddle
    const d = distanceFromCenter(ball, playerPaddle);
    ball.position.x = paddleX2;
    ball.direction.y = flipSignValue(d);
    ball.direction.x = flipSignValue(ballDir.x);
    playPlayerSFX();
    changeBallColor();
  }
  //end ball collision with player paddle

  //ball collision with AI paddle
  if (
    aiPaddleX1 <= ballX2 &&
    aiPaddleX2 >= ballX1 &&
    aiPaddleY1 <= ballY2 &&
    aiPaddleY2 >= ballY1
  ) {
    const d = distanceFromCenter(ball, aiPaddle);
    ball.position.x = aiPaddleX1 - ball.width;
    ball.direction.y = flipSignValue(d);
    ball.direction.x = flipSignValue(ballDir.x);
    playPlayerSFX();
    changeBallColor();
  }
  //end ball coliison with AI
}

function distanceFromCenter(ball, paddle) {
  const ballYCenter = ball.position.y + ball.height / 2;
  const paddleYCenter = paddle.position.y + paddle.height / 2;
  const distanceFromCenter = (paddleYCenter - ballYCenter) * 0.01;
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

function resetBall(sideOfScreen = "left") {
  switch (sideOfScreen) {
    case "left":
      ball.position = { x: WIDTH / 2, y: 10 };
      ball.direction = { x: 1, y: 1 };
      break;
    case "right":
      ball.position = { x: WIDTH / 2, y: 10 };
      ball.direction = { x: -1, y: 1 };
      break;
    default:
      console.error(`sideOfScrren was ${sideOfScreen}`);
  }
  resetAIPaddle();
}

function resetAIPaddle() {
  aiPaddle.position.x = WIDTH - 45;
  aiPaddle.position.y = HEIGHT / 2;
}

function handleMouseMove(e) {
  const { offsetX, offsetY } = e;
  playerPaddle.position.y = offsetY - playerPaddle.height / 2;
}

function clamp(num, min, max) {
  return Math.max(min, Math.min(num, max));
}

function increaseScore(personWhoScored) {
  if (scores[personWhoScored] === undefined) {
    console.error(`personWhoScored ${personWhoScored} not found`);
    return;
  }
  scores[personWhoScored]++;
}

function displayScores(scores) {
  const centerCanvas = WIDTH / 2;
  ctx.textAlign = "center";
  ctx.fillStyle = offWhite;
  ctx.font = "20pt sans-serif";
  ctx.fillText(scores.player, centerCanvas - 100, 50);
  ctx.fillText(scores.ai, centerCanvas + 100, 50);
}

function drawMiddleNet() {
  ctx.strokeStyle = offWhite;
  ctx.setLineDash([5, 10]);
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 0);
  ctx.lineTo(WIDTH / 2, HEIGHT);
  ctx.stroke();
}

function playPlayerSFX() {
  playerSFX.play();
}

function startGame() {
  loopId = requestAnimationFrame(loop);
}

function restartGame() {
  console.log(loopId);
  scores.player = 0;
  scores.ai = 0;
  resetBall("left");
  cancelAnimationFrame(loopId);
  startGame();
}

function pauseGame() {
  cancelAnimationFrame(loopId);
}

function playGame() {
  requestAnimationFrame(loop);
}

function checkScore(playerToCheck) {
  const scoreToWin = 5;
  if (scores[playerToCheck] === scoreToWin) {
    handleGameOver(playerToCheck);
  }
}

function handleGameOver(playerWhoWon) {
  pauseGame();
  ctx.fillStyle = offWhite;
  ctx.font = "20pt monospace";
  ctx.fillText(
    `Game over you ${playerWhoWon === "player" ? "WIN!" : "lose!"}`,
    WIDTH / 2,
    HEIGHT / 2
  );
}

function changeBallColor() {
  ball.fillStyle = ballColors[indexTracker()];
}
function createIndexTracker(maxIndex) {
  let currentIndex = 0;
  return () => {
    currentIndex++;
    return currentIndex % maxIndex;
  };
}
