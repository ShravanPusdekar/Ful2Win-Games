const basket = document.getElementById('basket');
const gameArea = document.getElementById('gameArea');
const scoreDisplay = document.getElementById('score');
const timerDisplay = document.getElementById('timer');
const startBtn = document.getElementById('startBtn');
const startPopup = document.getElementById('startPopup');
const resultPopup = document.getElementById('resultPopup');
const finalScore = document.getElementById('finalScore');
const eggSound = document.getElementById('eggSound');
const bombSound = document.getElementById('bombSound');

let score = 0;
let timeLeft = 60;
let gameRunning = false;
let items = [];
let eggCount = 0;
let keys = {};

document.addEventListener('keydown', (e) => keys[e.key] = true);
document.addEventListener('keyup', (e) => keys[e.key] = false);

document.getElementById('leftBtn').addEventListener('click', () => move('left'));
document.getElementById('rightBtn').addEventListener('click', () => move('right'));

startBtn.addEventListener('click', () => {
  startPopup.style.display = 'none';
  gameRunning = true;
  startGame();
});

function move(direction) {
  const step = 40; // faster
  let left = basket.offsetLeft;
  if (direction === 'left' && left > 0) {
    basket.style.left = `${left - step}px`;
  }
  if (direction === 'right' && left + basket.offsetWidth < gameArea.clientWidth) {
    basket.style.left = `${left + step}px`;
  }
}

function moveBasket() {
  const step = 8; // faster
  let left = basket.offsetLeft;
  if (keys['ArrowLeft'] && left > 0) {
    basket.style.left = `${left - step}px`;
  }
  if (keys['ArrowRight'] && left + basket.offsetWidth < gameArea.clientWidth) {
    basket.style.left = `${left + step}px`;
  }
}


function startGame() {
  // Center the basket properly
  basket.style.left = `${(gameArea.clientWidth - basket.offsetWidth) / 2}px`;

  countdown();
  spawnLoop();
  updateLoop();
}

function countdown() {
  const timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    if (timeLeft <= 0) {
      clearInterval(timer);
      gameRunning = false;
      showResult();
    }
  }, 1000);
}

function spawnLoop() {
  if (!gameRunning) return;
  spawnItem();
  setTimeout(spawnLoop, 800);
}

function spawnItem() {
  const item = document.createElement('div');
  item.classList.add('item');
  const isEgg = Math.random() > 0.3;
  item.classList.add(isEgg ? 'egg' : 'bomb');
  item.dataset.type = isEgg ? 'egg' : 'bomb';
  item.style.left = `${Math.random() * (gameArea.clientWidth - 40)}px`;
  gameArea.appendChild(item);
  items.push({ el: item, top: 0 });
}

function updateLoop() {
  if (gameRunning) requestAnimationFrame(updateLoop);
  moveBasket();
  updateItems();
}

function updateItems() {
  const basketRect = basket.getBoundingClientRect();

  items.forEach((item, index) => {
    item.top += 4;
    item.el.style.top = `${item.top}px`;
    const itemRect = item.el.getBoundingClientRect();

    if (
      itemRect.bottom >= basketRect.top &&
      itemRect.left < basketRect.right &&
      itemRect.right > basketRect.left
    ) {
      handleCollision(item);
      items.splice(index, 1);
    } else if (item.top > gameArea.clientHeight) {
      item.el.remove();
      items.splice(index, 1);
    }
  });
}

function handleCollision(item) {
  item.el.remove();
  const isEgg = item.el.dataset.type === 'egg';
  if (isEgg) {
    score++;
    eggCount++;
    eggSound.play();
  } else {
    score = Math.max(0, score - 1);
    eggCount = Math.max(0, eggCount - 1);
    bombSound.play();
  }
  scoreDisplay.textContent = score;

  basket.style.backgroundImage = eggCount >= 3 ? "url('basket-full.png')" : "url('basket.png')";
}

function showResult() {
  finalScore.textContent = score;
  resultPopup.style.display = 'block';
}
