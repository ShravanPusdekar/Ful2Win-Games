/*!
 * Jeferson Luckas - Disinfect the virus
 *
 * Copyright (c) 2020 Jeferson Luckas
 * Released under the MIT license
 * https://github.com/JefersonLucas/disinfect-the-virus/blob/master/LICENSE
 *
 */

// Countdown timer variables
let countdownValue = 5;
let countdownTimer = null;

// Start countdown when page loads
window.addEventListener('DOMContentLoaded', function() {
	startCountdown();
});

function startCountdown() {
	const countdownElement = document.getElementById("countdown-number");
	
	if (countdownElement) {
		countdownElement.textContent = countdownValue;
	}

	// Start countdown
	countdownTimer = setInterval(() => {
		countdownValue--;
		
		if (countdownElement) {
			countdownElement.textContent = countdownValue;
		}

		// Auto-start on hard difficulty when countdown reaches 0
		if (countdownValue <= 0) {
			stopCountdown();
			window.location.href = "game.html?dificil";
		}
	}, 1000);
}

function stopCountdown() {
	if (countdownTimer) {
		clearInterval(countdownTimer);
		countdownTimer = null;
	}
}

// Start the Game

function iniciarJogo() {
	// Stop countdown when user clicks start
	stopCountdown();
	
	var nivel = document.getElementById("nivel").value;

	if (nivel === "") {
		alert("Select an item from the list.");
		return false;
	}
	else {
		window.location.href = "game.html?" + nivel;
	}
}