document.addEventListener('DOMContentLoaded', function() {
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    const statusDiv = document.getElementById('status');
    const chatHistory = document.getElementById('chat-history');
    const detectedTone = document.getElementById('detected-tone');
    const waveContainer = document.getElementById('wave-container');
    const speechIndicator = document.getElementById('speech-indicator');

    // Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        statusDiv.textContent = "Speech recognition not supported in your browser";
        statusDiv.classList.add('error');
        startBtn.disabled = true;
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    let isListening = false;
    let isSpeaking = false;
    let recognitionRestart = false;

    // Initialize speech synthesis
    const synth = window.speechSynthesis;

    startBtn.addEventListener('click', function() {
        try {
            isListening = true;
            recognition.start();
            startBtn.disabled = true;
            stopBtn.disabled = false;
            statusDiv.textContent = "Listening...";
            statusDiv.className = 'status listening';
            waveContainer.classList.add('active');
            
            // Add animation with delay for visual appeal
            setTimeout(() => {
                startListeningAnimation();
            }, 300);
        } catch (error) {
            console.error("Error starting recognition:", error);
            statusDiv.textContent = "Error starting speech recognition";
            statusDiv.className = 'status error';
            startBtn.disabled = false;
        }
    });

    stopBtn.addEventListener('click', function() {
        isListening = false;
        recognition.stop();
        startBtn.disabled = false;
        stopBtn.disabled = true;
        statusDiv.textContent = "Stopped";
        statusDiv.className = 'status';
        waveContainer.classList.remove('active');
        stopListeningAnimation();
    });

    recognition.onresult = function(event) {
        const transcript = event.results[event.results.length - 1][0].transcript;
        
        // Add user message to chat
        addMessage(transcript, 'user');
        
        statusDiv.textContent = "Processing...";
        statusDiv.className = 'status processing';
        stopListeningAnimation();
        
        // Temporarily pause recognition while processing
        recognition.stop();
        recognitionRestart = true;
        
        // Send to backend
        fetch('/process-speech', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text: transcript })
        })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server responded with status ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            // Display the detected tone with animation
            updateDetectedTone(data.tone.trim());
            
            // Add bot response to chat
            addMessage(data.response, 'bot');
            
            // Speak the response
            speakText(data.response);
            
            statusDiv.textContent = "Bot is speaking...";
            statusDiv.className = 'status speaking';
        })
        .catch(error => {
            console.error('Error:', error);
            statusDiv.textContent = "Error occurred";
            statusDiv.className = 'status error';
            
            // Restart recognition after error
            if (isListening && recognitionRestart) {
                setTimeout(() => {
                    try {
                        recognition.start();
                        statusDiv.textContent = "Listening...";
                        statusDiv.className = 'status listening';
                        startListeningAnimation();
                    } catch (e) {
                        console.error("Failed to restart recognition:", e);
                    }
                }, 1000);
                recognitionRestart = false;
            }
        });
    };

    recognition.onerror = function(event) {
        console.error('Speech recognition error:', event.error);
        statusDiv.textContent = "Error: " + event.error;
        statusDiv.className = 'status error';
        startBtn.disabled = false;
        stopBtn.disabled = true;
        waveContainer.classList.remove('active');
        stopListeningAnimation();
    };

    recognition.onend = function() {
        if (isListening && recognitionRestart) {
            try {
                setTimeout(() => {
                    recognition.start();
                    statusDiv.textContent = "Listening...";
                    statusDiv.className = 'status listening';
                    if (!isSpeaking) {
                        startListeningAnimation();
                    }
                }, 300);
                recognitionRestart = false;
            } catch (e) {
                console.error("Failed to restart recognition:", e);
                isListening = false;
                startBtn.disabled = false;
                stopBtn.disabled = true;
            }
        } else if (!isListening) {
            startBtn.disabled = false;
            stopBtn.disabled = true;
            statusDiv.textContent = "Ready";
            statusDiv.className = 'status';
            waveContainer.classList.remove('active');
            stopListeningAnimation();
        }
    };

    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(sender + '-message');
        messageDiv.textContent = text;
        
        // Apply staggered animation
        messageDiv.style.animationDelay = '0.1s';
        
        chatHistory.appendChild(messageDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
    }

    function speakText(text) {
        // Stop any ongoing speech
        synth.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        
        // Animation when bot starts speaking
        utterance.onstart = function() {
            isSpeaking = true;
            startSpeakingAnimation();
            statusDiv.textContent = "Bot is speaking...";
            statusDiv.className = 'status speaking';
        };
        
        // Animation when bot stops speaking
        utterance.onend = function() {
            isSpeaking = false;
            stopSpeakingAnimation();
            
            // Resume listening animation if still listening
            if (isListening) {
                statusDiv.textContent = "Listening...";
                statusDiv.className = 'status listening';
                startListeningAnimation();
                
                // Make sure recognition is running
                try {
                    recognition.start();
                } catch (e) {
                    // Recognition might already be running, ignore the error
                    if (e.name !== 'InvalidStateError') {
                        console.error("Error restarting recognition:", e);
                    }
                }
            } else {
                statusDiv.textContent = "Ready";
                statusDiv.className = 'status';
            }
        };
        
        // Handle errors in speech synthesis
        utterance.onerror = function(event) {
            console.error("Speech synthesis error:", event.error);
            isSpeaking = false;
            stopSpeakingAnimation();
            
            if (isListening) {
                statusDiv.textContent = "Listening...";
                statusDiv.className = 'status listening';
                startListeningAnimation();
                
                // Make sure recognition is running
                try {
                    recognition.start();
                } catch (e) {
                    // Recognition might already be running, ignore the error
                    if (e.name !== 'InvalidStateError') {
                        console.error("Error restarting recognition:", e);
                    }
                }
            } else {
                statusDiv.textContent = "Ready";
                statusDiv.className = 'status';
            }
        };
        
        synth.speak(utterance);
    }
    
    function updateDetectedTone(tone) {
        detectedTone.textContent = tone;
        
        // Add a highlight animation
        detectedTone.style.transform = 'scale(1.1)';
        detectedTone.style.backgroundColor = 'rgba(108, 99, 255, 0.2)';
        
        setTimeout(() => {
            detectedTone.style.transform = 'scale(1)';
            detectedTone.style.backgroundColor = 'rgba(108, 99, 255, 0.1)';
        }, 300);
    }
    
    function startListeningAnimation() {
        if (!isSpeaking) {
            speechIndicator.classList.add('active');
        }
    }
    
    function stopListeningAnimation() {
        speechIndicator.classList.remove('active');
    }
    
    function startSpeakingAnimation() {
        stopListeningAnimation();
        waveContainer.classList.add('active');
    }
    
    function stopSpeakingAnimation() {
        waveContainer.classList.remove('active');
    }
});
