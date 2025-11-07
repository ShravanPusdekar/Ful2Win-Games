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

window.onresize = ajustaTamanhoPalco();

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

var cronometro = setInterval(function() {
	if (tempo < 0) {
		clearInterval(cronometro);
		clearInterval(criaVirus);
		
		// Send game over message to parent window (player won)
		const gameData = { 
			type: "GAME_OVER", 
			score: parseInt(pontos)
		};
		console.log('Game Won - Sending message to parent:', gameData);
		window.parent.postMessage(gameData, "*");
		
		window.location.href = "you-win.html?" + nivel + "&" + pontos;
	}
	else {
		// Format time as MM:SS
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

// Time interval for function call

var criaVirus = setInterval(
	function() {
		posicaoAleatoria();
	},
tempoVirus);
