/*!
 * Jeferson Luckas - Disinfect the virus
 *
 * Copyright (c) 2020 Jeferson Luckas
 * Released under the MIT license
 * https://github.com/JefersonLucas/disinfect-the-virus/blob/master/LICENSE
 *
 */

// Retrieve game result and show to player

let resultado = window.location.search;

if(resultado === "") {
	window.location.href = "index.html";
}
else {
	resultado.replace("?" , "");

	let nivel = resultado.substr(1,2);
	const pontos = resultado.substr(4,2);

	if (nivel === "no") {
		nivel = "Normal";
	}
	else if (nivel === "di") {
		nivel = "Hard";
	}
	else if (nivel === "im") {
		nivel = "Impossible";
	}

	// Confirm dialog removed - game result displayed on page instead
}

// Redirection

var reiniciar = document.getElementById("reiniciar");

if (reiniciar) {
	document.getElementById("reiniciar").onclick = function() {
	window.location.href = "index.html";
	}
}

