/*!
 * Jeferson Luckas - Disinfect the virus
 *
 * Copyright (c) 2020 Jeferson Luckas
 * Released under the MIT license
 * https://github.com/JefersonLucas/disinfect-the-virus/blob/master/LICENSE
 *
 */

// Global variables

let altura = largura = pontos = 0;
let vidas = 1;
let tempo = 120;
let tempoVirus = 1500;
let nivel = window.location.search;
let cronometro;
let criaVirus;

// Retrieve and set the game level

nivel = nivel === "" ? window.location.href = "index.html" : nivel.replace("?" , "");

if (nivel === "normal") {
	tempoVirus = 1500;
	nivel = "no";
}
else if (nivel === "dificil") {
	tempoVirus = 1000;
	nivel = "di";
}
else if (nivel === "impossivel") {
	tempoVirus = 750;
	nivel = "im";
}

// Game height and width

let ajustaTamanhoPalco = function() {
	altura = window.innerHeight;
	largura = window.innerWidth;
}

window.addEventListener('resize', ajustaTamanhoPalco);

// Random position

function valorAleatorio(valor) {
	let aleatorio = Math.floor(Math.random() * valor);
	return aleatorio;
}

function posicaoAleatoria() {

	// Remove previous virus
	
	if(document.getElementById("virus")) {
	
		document.getElementById("virus").remove();

		if (vidas > 3) {
			// Send game over message to parent window
			const gameData = { 
				type: "GAME_OVER", 
				score: parseInt(pontos)
			};
			console.log('Game Over - Sending message to parent:', gameData);
			window.parent.postMessage(gameData, "*");
			
			window.location.href = "game-over.html?" + nivel + "&" + pontos;
		}
		else {
			document.getElementById("v" + vidas).className = "coracao far fa-heart fa-lg";
			vidas++;
		}
	}

	let posicaoX = valorAleatorio(largura) - 90;
	let posicaoY = valorAleatorio(altura) - 90;

	// Virus position should not disappear in browser

	posicaoX = posicaoX < 0 ? 0 : posicaoX;
	posicaoY = posicaoY < 0 ? 0 : posicaoY;

	// Creating HTML elements

	const virus = document.createElement("img");
	const classe = tamanhoAleatorio() +" "+ ladoAleatorio()
	virus.src = virusAleatorio();
	virus.className = classe;
	virus.style.left = `${posicaoX}px`;
	virus.style.top = `${posicaoY}px`;
	virus.style.position = "absolute";
	virus.id = "virus";

	virus.onclick = function() {

		pontos++;
		pontos = pontos < 10 ? pontos = "0"+pontos : pontos;
		document.getElementById("pontos").innerHTML = pontos;
		
		document.getElementById("virus").remove();
	}
	document.body.appendChild(virus);
}

// Random size

function tamanhoAleatorio() {

	let tamanho = valorAleatorio(3);

	switch(tamanho){
		case 0:
			return "tamanho-1";
		case 1:
			return "tamanho-2";
		case 2:
			return "tamanho-3";
	}
}

// Random side

function ladoAleatorio() {

	let lado = valorAleatorio(2);

	switch(lado) {
		case 0:
			return "lado-A";
		case 1:
			return "lado-B";
	}
}

// Random virus

function virusAleatorio() {	

	let virus = valorAleatorio(4);

	switch(virus){
		case 0:
			return "assets/img/virus-01.png";
		case 1:
			return "assets/img/virus-02.png";
		case 2:
			return "assets/img/virus-03.png";
		case 3:
			return "assets/img/virus-04.png";
	}
}

// Timer

function startTimer() {
    cronometro = setInterval(function() {
        if (tempo < 0) {
            clearInterval(cronometro);
            clearInterval(criaVirus);
            const gameData = { type: "GAME_OVER", score: parseInt(pontos) };
            console.log('Game Won - Sending message to parent:', gameData);
            window.parent.postMessage(gameData, "*");
            window.location.href = "you-win.html?" + nivel + "&" + pontos;
        }
        else {
            let minutes = Math.floor(tempo / 60);
            let seconds = tempo % 60;
            let formattedTime = (minutes < 10 ? "0" + minutes : minutes) + ":" + (seconds < 10 ? "0" + seconds : seconds);
            if (tempo < 10) {
                let estiloCronometro = document.getElementById("cronometro");
                estiloCronometro.style.color = "#f44336";
                estiloCronometro.style.animationName = "piscar";
                estiloCronometro.style.animationDuration = "1s";
                estiloCronometro.style.animationIterationCount = "infinite";	
            }
            document.getElementById("tempo").innerHTML = formattedTime;
        }
        tempo--;
    }, 1000);
}

function startSpawner() {
    criaVirus = setInterval(function() { posicaoAleatoria(); }, tempoVirus);
}

function startGame() {
    ajustaTamanhoPalco();
    startTimer();
    startSpawner();
}

function preloadAssets(onProgress, onComplete) {
    const assets = [
        "assets/img/virus-01.png",
        "assets/img/virus-02.png",
        "assets/img/virus-03.png",
        "assets/img/virus-04.png",
        "assets/img/alcool-01.png",
        "assets/img/alcool-02.png",
        "assets/sound/aplausos.mp3",
        "assets/sound/bola.mp3"
    ];
    const total = assets.length;
    if (total === 0) { if (onComplete) onComplete(); return; }
    let loaded = 0;
    const update = () => {
        loaded++;
        if (onProgress) onProgress(Math.round((loaded / total) * 100));
        if (loaded >= total && onComplete) onComplete();
    };
    assets.forEach(url => {
        if (/\.(mp3|ogg|wav)$/i.test(url)) {
            const audio = new Audio();
            const onReady = () => { audio.removeEventListener('canplaythrough', onReady); audio.removeEventListener('error', onReady); update(); };
            audio.preload = 'auto';
            audio.addEventListener('canplaythrough', onReady, { once: true });
            audio.addEventListener('error', onReady, { once: true });
            audio.src = url;
            try { audio.load(); } catch (e) { }
        } else {
            const img = new Image();
            img.onload = update;
            img.onerror = update;
            img.src = url;
        }
    });
}

function initPreloadAndStart() {
    const preloader = document.getElementById('preloader');
    const percent = document.getElementById('loader-percent');
    preloadAssets(p => { if (percent) percent.textContent = p + '%'; }, () => {
        if (preloader) preloader.style.display = 'none';
        startGame();
    });
}

initPreloadAndStart();

function initTouchCursor() {
    const el = document.getElementById('touch-cursor');
    if (!el) return;
    const isCoarse = (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) || ('ontouchstart' in window);
    if (!isCoarse) return;
    el.style.display = 'block';
    let grabOffsetX = Math.max(1, el.offsetWidth / 2);
    let grabOffsetY = Math.max(1, el.offsetHeight / 2);
    const move = (x, y) => { el.style.transform = 'translate(' + (x - grabOffsetX) + 'px,' + (y - grabOffsetY) + 'px)'; };
    // Show bottle centered before touching
    const initX = Math.round(window.innerWidth * 0.5);
    const initY = Math.round(window.innerHeight * 0.5);
    move(initX, initY);
    el.classList.add('touch-cursor-active');
    return;
    const attemptKill = () => {
        const virus = document.getElementById('virus');
        if (!virus) return;
        const cr = el.getBoundingClientRect();
        const vr = virus.getBoundingClientRect();
        if (!(cr.right < vr.left || cr.left > vr.right || cr.bottom < vr.top || cr.top > vr.bottom)) {
            virus.click();
        }
    };
    let isDragging = false;
    let activeId = null;
    const onPointerDown = (e) => {
        const r = el.getBoundingClientRect();
        const cx = e.clientX, cy = e.clientY;
        if (cx < r.left || cx > r.right || cy < r.top || cy > r.bottom) return; // start only if pressed on bottle
        isDragging = true;
        activeId = e.pointerId || 1;
        el.classList.add('pressing');
        grabOffsetX = Math.max(1, cx - r.left);
        grabOffsetY = Math.max(1, cy - r.top);
        if (el.setPointerCapture && e.pointerId != null) el.setPointerCapture(e.pointerId);
        e.preventDefault();
        attemptKill();
    };
    const onPointerMove = (e) => {
        if (!isDragging) return;
        if (activeId != null && e.pointerId != null && e.pointerId !== activeId) return;
        move(e.clientX, e.clientY);
        attemptKill();
    };
    const onPointerUp = (e) => {
        if (activeId != null && e.pointerId != null && e.pointerId !== activeId) return;
        isDragging = false;
        activeId = null;
        el.classList.remove('pressing');
        if (el.releasePointerCapture && e.pointerId != null) el.releasePointerCapture(e.pointerId);
    };
    if (window.PointerEvent) {
        el.addEventListener('pointerdown', onPointerDown, { passive: false });
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        window.addEventListener('pointerup', onPointerUp, { passive: true });
        window.addEventListener('pointercancel', onPointerUp, { passive: true });
    } else {
        // Touch fallback
        const onTouchStart = (e) => {
            const t = e.touches && e.touches[0]; if (!t) return;
            const r = el.getBoundingClientRect();
            const within = (t.clientX >= r.left && t.clientX <= r.right && t.clientY >= r.top && t.clientY <= r.bottom);
            if (!within) return;
            isDragging = true;
            el.classList.add('pressing');
            grabOffsetX = Math.max(1, t.clientX - r.left);
            grabOffsetY = Math.max(1, t.clientY - r.top);
            e.preventDefault();
            attemptKill();
        };
        const onTouchMove = (e) => {
            if (!isDragging) return;
            const t = e.touches && e.touches[0]; if (!t) return;
            move(t.clientX, t.clientY);
            attemptKill();
        };
        const onTouchEnd = () => { isDragging = false; el.classList.remove('pressing'); };
        el.addEventListener('touchstart', onTouchStart, { passive: false });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onTouchEnd, { passive: true });
        window.addEventListener('touchcancel', onTouchEnd, { passive: true });

        // Mouse fallback
        const onMouseDown = (e) => {
            const r = el.getBoundingClientRect();
            if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
            isDragging = true;
            el.classList.add('pressing');
            grabOffsetX = Math.max(1, e.clientX - r.left);
            grabOffsetY = Math.max(1, e.clientY - r.top);
            e.preventDefault();
            attemptKill();
        };
        const onMouseMove = (e) => {
            if (!isDragging) return;
            move(e.clientX, e.clientY);
            attemptKill();
        };
        const onMouseUp = () => { isDragging = false; el.classList.remove('pressing'); };
        el.addEventListener('mousedown', onMouseDown, { passive: false });
        window.addEventListener('mousemove', onMouseMove, { passive: true });
        window.addEventListener('mouseup', onMouseUp, { passive: true });
    }
}

initTouchCursor();
