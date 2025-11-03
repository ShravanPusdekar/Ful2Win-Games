/**
 * DIRECT AUDIO FIX - Bypasses ImpactJS sound system entirely
 * Creates HTML5 Audio elements and hooks into game events
 */
(function() {
    'use strict';
    
    console.log('🔊 DIRECT AUDIO FIX Loading...');
    
    // Pre-load audio files as HTML5 Audio
    var explosionSound = new Audio('media/sounds/explosion.mp3');
    var shootSound = new Audio('media/sounds/plasma-burst.mp3');
    var music = new Audio('media/music/xtype.mp3');
    
    explosionSound.volume = 1.0;  // Full volume for effects
    shootSound.volume = 1.0;      // Full volume for effects
    music.volume = 0.4;            // 30% volume for background music
    music.loop = true;
    
    var initialized = false;
    var soundsEnabled = true;
    var isGameActive = false;
    var isTabVisible = true;
    
    // Check if music should be playing
    function shouldMusicPlay() {
        return soundsEnabled && isGameActive && isTabVisible;
    }
    
    // Update music state
    function updateMusicState() {
        if (shouldMusicPlay()) {
            if (music.paused) {
                music.play().catch(function(e) {
                    console.log('Music play failed:', e.message);
                });
            }
        } else {
            if (!music.paused) {
                music.pause();
                console.log('🔇 Music paused (game inactive or tab hidden)');
            }
        }
    }
    
    // Initialize on first interaction
    function initAudio() {
        if (initialized) return;
        initialized = true;
        
        console.log('🎵 Initializing direct audio...');
        
        // Unlock all audio
        [explosionSound, shootSound, music].forEach(function(audio) {
            audio.play().then(function() {
                audio.pause();
                audio.currentTime = 0;
                console.log('✓ Audio unlocked');
            }).catch(function(e) {
                console.log('⚠️ Unlock failed:', e.message);
            });
        });
        
        // Start music after delay if conditions are met
        setTimeout(function() {
            updateMusicState();
        }, 1000);
    }
    
    // Monitor game mode changes
    function monitorGameMode() {
        setInterval(function() {
            if (window.ig && window.ig.game && window.ig.game.mode !== undefined) {
                // XType.MODE.GAME = 1 (gameplay)
                var wasActive = isGameActive;
                isGameActive = (window.ig.game.mode === 1);
                
                if (wasActive !== isGameActive) {
                    console.log('🎮 Game mode changed:', isGameActive ? 'ACTIVE' : 'INACTIVE');
                    updateMusicState();
                }
            }
        }, 500);
    }
    
    // Hook into game to play sounds
    function hookGameSounds() {
        // Wait for game to load
        var checkInterval = setInterval(function() {
            if (window.ig && window.ig.game) {
                clearInterval(checkInterval);
                console.log('✓ Game detected, hooking sounds...');
                
                // Override the play method on all Sound objects
                if (window.ig.Sound && window.ig.Sound.prototype) {
                    var originalPlay = window.ig.Sound.prototype.play;
                    window.ig.Sound.prototype.play = function() {
                        if (!soundsEnabled || !isGameActive) return;
                        
                        // Check which sound this is
                        if (this.path && this.path.indexOf('explosion') !== -1) {
                            console.log('🔊 Playing explosion');
                            explosionSound.currentTime = 0;
                            explosionSound.play().catch(function(e) {
                                console.log('Explosion play error:', e.message);
                            });
                        } else if (this.path && this.path.indexOf('plasma') !== -1) {
                            console.log('🔊 Playing shoot');
                            shootSound.currentTime = 0;
                            shootSound.play().catch(function(e) {
                                console.log('Shoot play error:', e.message);
                            });
                        }
                        
                        // Still call original in case it works
                        try {
                            originalPlay.call(this);
                        } catch(e) {}
                    };
                    console.log('✓ Sound.play() hooked');
                }
                
                // Also force enable ImpactJS sound
                if (window.ig.Sound) {
                    window.ig.Sound.enabled = true;
                    console.log('✓ ig.Sound.enabled = true');
                }
                
                // Start monitoring game mode
                monitorGameMode();
            }
        }, 100);
    }
    
    // Setup mute control
    window.toggleGameSound = function() {
        soundsEnabled = !soundsEnabled;
        updateMusicState();
        console.log(soundsEnabled ? '🔊 Sound ENABLED' : '🔇 Sound MUTED');
        return soundsEnabled;
    };
    
    // Handle tab visibility changes (pause when tab is hidden)
    document.addEventListener('visibilitychange', function() {
        isTabVisible = !document.hidden;
        console.log('👁️ Tab visibility:', isTabVisible ? 'VISIBLE' : 'HIDDEN');
        updateMusicState();
    });
    
    // Handle window blur/focus (backup for visibility)
    window.addEventListener('blur', function() {
        isTabVisible = false;
        updateMusicState();
    });
    
    window.addEventListener('focus', function() {
        isTabVisible = true;
        updateMusicState();
    });
    
    // Initialize on any interaction
    document.addEventListener('touchstart', initAudio, { passive: true, once: true });
    document.addEventListener('click', initAudio, { passive: true, once: true });
    
    // Hook game sounds
    hookGameSounds();
    
    console.log('✓ DIRECT AUDIO FIX Ready');
    console.log('  - Music pauses when: game inactive, tab hidden, or muted');
    console.log('  - Sound effects only play during active gameplay');
})();
