var ytMusicManager = (function () {
	function ytMusicManager () {
		var s = this;
		
		s.backgroundMusic = null;
		s.isPlaying = false;
		s.isMuted = false;
	}

	ytMusicManager.prototype.init = function () {
		var s = this;
		
		if (dataList["background_music"]) {
			s.backgroundMusic = new Audio();
			s.backgroundMusic.src = "./music/background.wav";
			s.backgroundMusic.loop = true;
			s.backgroundMusic.volume = 0.3; // Set volume to 30%
			s.backgroundMusic.preload = "auto";
			
			// Handle loading events
			s.backgroundMusic.addEventListener('canplaythrough', function() {
				console.log('Background music loaded and ready to play');
			});
			
			s.backgroundMusic.addEventListener('error', function(e) {
				console.log('Error loading background music:', e);
			});
		}
	};

	ytMusicManager.prototype.play = function () {
		var s = this;
		
		if (s.backgroundMusic && !s.isPlaying && !s.isMuted) {
			s.backgroundMusic.play().then(function() {
				s.isPlaying = true;
				console.log('Background music started');
			}).catch(function(error) {
				console.log('Error playing background music:', error);
			});
		}
	};

	ytMusicManager.prototype.pause = function () {
		var s = this;
		
		if (s.backgroundMusic && s.isPlaying) {
			s.backgroundMusic.pause();
			s.isPlaying = false;
		}
	};

	ytMusicManager.prototype.stop = function () {
		var s = this;
		
		if (s.backgroundMusic) {
			s.backgroundMusic.pause();
			s.backgroundMusic.currentTime = 0;
			s.isPlaying = false;
		}
	};

	ytMusicManager.prototype.mute = function () {
		var s = this;
		
		s.isMuted = true;
		if (s.backgroundMusic) {
			s.backgroundMusic.muted = true;
		}
	};

	ytMusicManager.prototype.unmute = function () {
		var s = this;
		
		s.isMuted = false;
		if (s.backgroundMusic) {
			s.backgroundMusic.muted = false;
		}
	};

	ytMusicManager.prototype.setVolume = function (volume) {
		var s = this;
		
		if (s.backgroundMusic) {
			s.backgroundMusic.volume = Math.max(0, Math.min(1, volume));
		}
	};

	return ytMusicManager;
})();

// Create global music manager instance
var musicManager = new ytMusicManager();
