document.addEventListener("DOMContentLoaded", () => {
    const startButton = document.getElementById("startButton");
    const resultDiv = document.getElementById("result");
    let isRecording = false;
    let audioContext;
    let mediaStream;
    let analyser;
    const bufferSize = 2048;
    let dataArray;
    let lastDecibel = 0; // Variable to store the last recorded decibel value

    // Function to start measuring decibels
    function startDecibelMeasurement() {
        isRecording = true;

        // Initialize audio context and microphone
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => {
                mediaStream = stream;
                const microphone = audioContext.createMediaStreamSource(stream);
                analyser = audioContext.createAnalyser();
                analyser.fftSize = bufferSize;
                microphone.connect(analyser);
                dataArray = new Uint8Array(analyser.frequencyBinCount);

                // Start analyzing microphone data
                analyzeDecibels();
            })
            .catch(error => {
                console.error('Error accessing microphone:', error);
                resultDiv.textContent = "Error accessing microphone. Please check permissions.";
            });
    }

    // Function to analyze microphone data for decibel measurement
    function analyzeDecibels() {
        if (!isRecording) return;

        analyser.getByteFrequencyData(dataArray);
        let average = getAverageVolume(dataArray);

        // Calculate decibel level (example calculation, adjust as needed)
        let decibels = calculateDecibels(average);

        // Display decibel level
        resultDiv.textContent = `Current Decibel Level: ${decibels.toFixed(2)} dB`;

        // Store last recorded decibel value
        lastDecibel = decibels;

        // Continue analyzing microphone data
        requestAnimationFrame(analyzeDecibels);
    }

    // Helper function to calculate average volume from frequency data
    function getAverageVolume(array) {
        let values = 0;
        const length = array.length;
        for (let i = 0; i < length; i++) {
            values += array[i];
        }
        return values / length;
    }

    //calculation
    function calculateDecibels(averageVolume) {
        const reference = 1; // Reference amplitude for dB calculation
        //assumes that the reference level is 1 unit 
        //(e.g., 1 Pa for SPL measurements). 
        /*In practical applications, this reference level might vary 
        depending on the specific context (e.g., microphone sensitivity, calibration)*/
        
        if (averageVolume === 0) return 0; // Prevent log(0) error

        let dB = 20 * Math.log10(averageVolume / reference);
        return dB;
    }

    startButton.addEventListener("click", () => {
        if (!isRecording) {
            startDecibelMeasurement();
            startButton.textContent = "Stop";
        } else {
            isRecording = false;
            startButton.textContent = "Start";
           
            resultDiv.textContent = `Last Recorded Decibel Level: ${lastDecibel.toFixed(2)} dB`;
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
            if (audioContext) {
                audioContext.close().then(() => {
                    audioContext = null;
                    analyser = null;
                    dataArray = null;
                }).catch(error => {
                    console.error('Error closing AudioContext:', error);
                });
            }
        }
    });
});
