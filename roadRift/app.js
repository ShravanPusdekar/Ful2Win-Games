const score = document.querySelector(".score");
const gameArea = document.querySelector(".gameArea");
const carGame = document.querySelector(".carGame");
const leftBtn = document.getElementById("left-btn");
const rightBtn = document.getElementById("right-btn");
const joystick = document.getElementById("joystick");
const stick = document.getElementById("stick");
const timerEl = document.getElementById("timer");
const blurOverlay = document.getElementById("blur-overlay");

document.addEventListener("keydown", keyDown);
document.addEventListener("keyup", keyUp);

let player = { speed: 5 };
window.game = window.game || { score: 0 };
let endTime = 0;
let gameOverSent = false;

// removed start screen – game starts automatically

let keys = {
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
};

function setupButton(btn, key) {
    if (!btn) return;
    const press = (e) => {
        if (e && e.cancelable) e.preventDefault();
        keys[key] = true;
    };
    const release = (e) => {
        if (e && e.cancelable) e.preventDefault();
        keys[key] = false;
    };
    btn.addEventListener("pointerdown", press, { passive: false, capture: true });
    btn.addEventListener("pointerup", release, { passive: false, capture: true });
    btn.addEventListener("pointerleave", release, { passive: false, capture: true });
    btn.addEventListener("pointercancel", release, { passive: false, capture: true });
    btn.addEventListener("touchstart", press, { passive: false, capture: true });
    btn.addEventListener("touchend", release, { passive: false, capture: true });
    btn.addEventListener("touchcancel", release, { passive: false, capture: true });
}

setupButton(leftBtn, "ArrowLeft");
setupButton(rightBtn, "ArrowRight");

let joy = { active: false, x: 0, y: 0 };

function startJoystickAt(e) {
    if (!joystick || !stick) return;
    if (e && e.cancelable) e.preventDefault();
    joy.active = true;
    const p = e.touches && e.touches[0] ? e.touches[0] : e;
    const size = { w: joystick.offsetWidth, h: joystick.offsetHeight };
    joystick.style.left = Math.max(0, p.clientX - size.w / 2) + "px";
    joystick.style.top = Math.max(0, p.clientY - size.h / 2) + "px";
    joystick.style.display = "block";
    moveJoystick(e);
}

function moveJoystick(e) {
    if (!joy.active || !joystick || !stick) return;
    const rect = joystick.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const p = e.touches && e.touches[0] ? e.touches[0] : e;
    let dx = p.clientX - cx;
    let dy = p.clientY - cy;
    const max = (rect.width - stick.offsetWidth) / 2;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > max) {
        const r = max / dist;
        dx *= r;
        dy *= r;
    }
    stick.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    joy.x = dx / max;
    joy.y = dy / max;
}

function releaseJoystick(e) {
    if (e && e.cancelable) e.preventDefault();
    joy.active = false;
    joy.x = 0;
    joy.y = 0;
    if (stick) stick.style.transform = "translate(-50%, -50%)";
    if (joystick) joystick.style.display = "none";
}

function bindJoystick() {
    if (!joystick || !stick) return;
    joystick.addEventListener("pointerdown", startJoystickAt, { passive: false, capture: true });
    joystick.addEventListener("pointerup", releaseJoystick, { passive: false, capture: true });
    joystick.addEventListener("pointercancel", releaseJoystick, { passive: false, capture: true });
    joystick.addEventListener("pointerleave", releaseJoystick, { passive: false, capture: true });
    joystick.addEventListener("touchstart", startJoystickAt, { passive: false, capture: true });
    joystick.addEventListener("touchend", releaseJoystick, { passive: false, capture: true });
    joystick.addEventListener("touchcancel", releaseJoystick, { passive: false, capture: true });
    gameArea.addEventListener("pointerdown", startJoystickAt, { passive: false, capture: true });
    gameArea.addEventListener("touchstart", startJoystickAt, { passive: false, capture: true });
    if (carGame) {
        carGame.addEventListener("pointerdown", startJoystickAt, { passive: false, capture: true });
        carGame.addEventListener("touchstart", startJoystickAt, { passive: false, capture: true });
    }
    document.addEventListener("pointermove", moveJoystick, { passive: false, capture: true });
    document.addEventListener("touchmove", moveJoystick, { passive: false, capture: true });
    document.addEventListener("pointerup", releaseJoystick, { passive: false, capture: true });
    document.addEventListener("touchend", releaseJoystick, { passive: false, capture: true });
}

bindJoystick();

function blockScroll(e) { if (e && e.cancelable) e.preventDefault(); }
["touchmove","wheel","gesturestart","gesturechange","gestureend"].forEach((t)=>{
    document.addEventListener(t, blockScroll, { passive: false, capture: true });
});
document.addEventListener("contextmenu", blockScroll, { passive: false, capture: true });
document.addEventListener("dragstart", blockScroll, { passive: false, capture: true });

function keyDown(e) {
    e.preventDefault();
    keys[e.key] = true;
}
function keyUp(e) {
    e.preventDefault();
    keys[e.key] = false;
}

function gamePlay() {
    let car = document.querySelector(".car");
    let road = gameArea.getBoundingClientRect();

    if (player.start) {
        const now = performance.now();
        const remainingMs = Math.max(0, endTime - now);
        if (timerEl) {
            const totalSec = Math.ceil(remainingMs / 1000);
            const m = String(Math.floor(totalSec / 60)).padStart(2, "0");
            const s = String(totalSec % 60).padStart(2, "0");
            timerEl.textContent = `${m}:${s}`;
        }
        if (remainingMs <= 0) {
            endGame();
            return;
        }
        moveLines();
        moveEnemyCar(car);

        const maxX = road.width - car.offsetWidth - 10;
        const maxY = road.height - car.offsetHeight - 10;
        if (keys.ArrowUp && player.y > 0) {
            player.y -= player.speed;
        }
        if (keys.ArrowDown && player.y < maxY) {
            player.y += player.speed;
        }
        if (keys.ArrowLeft && player.x > 0) {
            player.x -= player.speed;
        }
        if (keys.ArrowRight && player.x < maxX) {
            player.x += player.speed;
        }
        if (joy.x || joy.y) {
            player.x += joy.x * player.speed;
            player.y += joy.y * player.speed;
        }
        player.x = Math.max(0, Math.min(maxX, player.x));
        player.y = Math.max(0, Math.min(maxY, player.y));

        car.style.top = `${player.y}px`;
        car.style.left = `${player.x}px`;

        window.requestAnimationFrame(gamePlay);

        player.score++;
        window.game.score = player.score;
        score.innerHTML = "Score: " + player.score;
    }
}
function moveLines() {
    let lines = document.querySelectorAll(".line");
    const h = gameArea.clientHeight;
    const resetAt = h + 50;
    const resetDist = h + 100;
    lines.forEach((line) => {
        if (line.y >= resetAt) {
            line.y -= resetDist;
        }
        line.y += player.speed;
        line.style.top = line.y + "px";
    });
}

function isCollide(car, enemyCar) {
    carRect = car.getBoundingClientRect();
    enemyCarRect = enemyCar.getBoundingClientRect();

    return !(
        carRect.top > enemyCarRect.bottom ||
        carRect.left > enemyCarRect.right ||
        carRect.right < enemyCarRect.left ||
        carRect.bottom < enemyCarRect.top
    );
}

function moveEnemyCar(car) {
    let enemyCars = document.querySelectorAll(".enemyCar");
    const h = gameArea.clientHeight;
    const w = gameArea.clientWidth;
    enemyCars.forEach((enemyCar) => {
        if (isCollide(car, enemyCar)) {
            endGame();
        }

        if (enemyCar.y >= h + 50) {
            enemyCar.y = -Math.floor(h * 0.4);
            const maxLeft = Math.max(0, w - enemyCar.offsetWidth - 10);
            enemyCar.style.left = Math.floor(Math.random() * (maxLeft + 1)) + "px";
        }
        enemyCar.y += player.speed;
        enemyCar.style.top = enemyCar.y + "px";
    });
}

function startGame() {
    if (player.start) return;
    gameArea.innerHTML = "";

    player.start = true;
    player.score = 0;
    window.game.score = 0;
    endTime = performance.now() + 120000;
    gameOverSent = false;
    window.requestAnimationFrame(gamePlay);

    if (carGame) carGame.classList.add("playing");

    const lineGap = 150;
    const lineCount = Math.ceil(gameArea.clientHeight / lineGap) + 2;
    for (let i = 0; i < lineCount; i++) {
        let roadLine = document.createElement("div");
        roadLine.setAttribute("class", "line");
        roadLine.y = i * 150;
        roadLine.style.top = roadLine.y + "px";
        gameArea.appendChild(roadLine);
    }

    let car = document.createElement("div");
    car.setAttribute("class", "car");

    gameArea.appendChild(car);

    player.x = car.offsetLeft;
    player.y = car.offsetTop;

    const gap = Math.floor(gameArea.clientHeight * 0.5);
    for (let i = 0; i < 3; i++) {
        let enemyCar = document.createElement("div");
        enemyCar.setAttribute("class", "enemyCar");
        enemyCar.y = (i + 1) * gap * -1;
        enemyCar.style.top = enemyCar.y + "px";
        enemyCar.style.backgroundImage = `url("./images/car${i + 1}.png")`;
        const maxLeft = Math.max(0, gameArea.clientWidth - car.offsetWidth - 10);
        enemyCar.style.left = Math.floor(Math.random() * (maxLeft + 1)) + "px";
        gameArea.appendChild(enemyCar);
    }
}

function endGame() {
    if (!player.start) return;
    player.start = false;
    if (carGame) carGame.classList.remove("playing");
    if (joystick) joystick.style.display = "none";
    if (blurOverlay) blurOverlay.style.display = "block";
    if (!gameOverSent) {
        gameOverSent = true;
        try { window.parent.postMessage({ type: "GAME_OVER", score: window.game.score }, "*"); } catch (e) {}
    }
}

window.addEventListener("load", startGame);
