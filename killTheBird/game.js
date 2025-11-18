document.addEventListener('DOMContentLoaded', () => {
  const birds = Array.from(document.querySelectorAll('.pajaro'));
  const birdsKilledEl = document.getElementById('birdsKilled');
  const scoreEl = document.getElementById('score');
  const gunEl = document.querySelector('.gun');
  const wrapper = document.querySelector('.wrapper');

  let birdsKilled = 0;
  let score = 0;
  let aliveCount = birds.length;
  let threshold = getRandomThreshold(); // random 1-6
  let gameOverSent = false;
  let comboMultiplier = 1;
  let lastKillTime = 0; // ms timestamp

  // expose score for container integration
  window.game = window.game || {};
  window.game.score = 0;

  // Movement state for each bird
  const birdState = birds.map((bird, index) => ({
    el: bird,
    x: -150 - index * 120,
    y: 0,       // will be set after layout
    // gentle speed: 0.05 - 0.09 px per ms
    speed: 0.05 + Math.random() * 0.04,
    baseY: 0,
    amp: 10 + Math.random() * 15,     // vertical wave amplitude
    freq: 0.001 + Math.random() * 0.0015, // wave frequency
    phase: Math.random() * Math.PI * 2
  }));

  function getRandomThreshold() {
    return Math.floor(Math.random() * 6) + 1; // 1..6
  }

  function updateUI() {
    if (birdsKilledEl) birdsKilledEl.textContent = birdsKilled.toString();
    if (scoreEl) scoreEl.textContent = score.toString();
    window.game.score = score;
  }

  function triggerGunRecoil() {
    if (!gunEl) return;
    gunEl.classList.remove('shoot');
    // force reflow so animation can restart
    void gunEl.offsetWidth;
    gunEl.classList.add('shoot');
  }

  function killBird(bird) {
    if (bird.classList.contains('dead')) return;

    bird.classList.add('dead');
    bird.style.opacity = '0';
    bird.style.pointerEvents = 'none';

    const msg = bird.querySelector('span');
    if (msg) {
      msg.style.display = 'block';
    }

    birdsKilled += 1;

    // combo scoring based on time between kills
    const now = performance.now();
    if (lastKillTime && now - lastKillTime <= 1500) {
      // quick successive kill: increase combo up to 5x
      comboMultiplier = Math.min(comboMultiplier + 1, 5);
    } else {
      // too slow or first kill: reset combo
      comboMultiplier = 1;
    }
    lastKillTime = now;

    const basePoints = 10;
    score += basePoints * comboMultiplier;
    aliveCount -= 1;

    triggerGunRecoil();
    updateUI();

    if (aliveCount <= threshold) {
      // small delay so the last kill feels visible
      setTimeout(respawnAllBirds, 400);
    }
  }

  function respawnAllBirds() {
    birds.forEach(bird => {
      bird.classList.remove('dead');
      bird.style.opacity = '1';
      bird.style.pointerEvents = 'auto';

      const msg = bird.querySelector('span');
      if (msg) {
        msg.style.display = 'none';
      }
    });
    aliveCount = birds.length;
    threshold = getRandomThreshold();
  }

  birds.forEach(bird => {
    bird.addEventListener('click', () => killBird(bird));
  });

  // Clean up the shoot class when animation ends so it can retrigger
  if (gunEl) {
    gunEl.addEventListener('animationend', () => {
      gunEl.classList.remove('shoot');
    });
  }

  updateUI();

  // ---- GAME OVER HANDLING (2 minutes) ----
  // CSS timer and overlay are 120s; mirror that here.
  setTimeout(() => {
    if (gameOverSent) return;
    gameOverSent = true;
    try {
      window.parent.postMessage({ type: "GAME_OVER", score: window.game.score }, "*");
    } catch (e) {
      // ignore if not in iframe/parent context
    }
  }, 120000);

  // --------- JS-driven bird movement (non-overlapping bands) ---------
  function setupBirdPositions() {
    const width = wrapper ? wrapper.clientWidth : window.innerWidth;
    const height = wrapper ? wrapper.clientHeight : window.innerHeight;

    const topMargin = 80;
    const bottomMargin = 180;
    const availableHeight = Math.max(100, height - topMargin - bottomMargin);
    const bandHeight = availableHeight / birds.length;

    birdState.forEach((b, index) => {
      b.x = -150 - index * 120;
      // center each bird in its vertical band
      b.baseY = topMargin + bandHeight * index + bandHeight / 2;
      b.y = b.baseY;
      b.el.style.left = b.x + 'px';
      b.el.style.top = b.y + 'px';
    });
  }

  let lastTime = 0;
  function animate(time) {
    if (!lastTime) lastTime = time;
    const dt = time - lastTime; // ms
    lastTime = time;

    const width = wrapper ? wrapper.clientWidth : window.innerWidth;
    const height = wrapper ? wrapper.clientHeight : window.innerHeight;
    const topMargin = 80;
    const bottomMargin = 180;
    const availableHeight = Math.max(100, height - topMargin - bottomMargin);
    const bandHeight = availableHeight / birds.length;

    birdState.forEach((b, index) => {
      if (!b.el.classList.contains('dead')) {
        // horizontal movement
        b.x += b.speed * dt;
      }

      if (b.x > width + 150) {
        // wrap around and slightly jitter the base band position
        b.x = -150;
        const jitter = bandHeight * 0.3;
        b.baseY = topMargin + bandHeight * index + bandHeight / 2 + (Math.random() * jitter - jitter / 2);
      }

      // non-linear vertical motion: sine wave around baseY
      const t = time;
      b.y = b.baseY + Math.sin(t * b.freq + b.phase) * b.amp;

      b.el.style.left = b.x + 'px';
      b.el.style.top = b.y + 'px';
    });

    requestAnimationFrame(animate);
  }

  setupBirdPositions();
  window.addEventListener('resize', setupBirdPositions);
  requestAnimationFrame(animate);
});
