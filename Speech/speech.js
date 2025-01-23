// Check if browser supports Web Audio API and SpeechRecognition
if (
  !("webkitSpeechRecognition" in window) ||
  !navigator.mediaDevices.getUserMedia
) {
  alert(
    "Your browser does not support the required features. Please use Chrome or Firefox."
  );
}

const startButton = document.getElementById("startRecording");
const stopButton = document.getElementById("stopRecording");
const audioPlayer = document.getElementById("audioPlayer");
const audioSource = document.getElementById("audioSource");
const timeDisplay = document.getElementById("timeDisplay");
const translationPrompt = document.getElementById("translationPrompt");
const recordAgainPrompt = document.getElementById("recordAgainPrompt");
const translateYes = document.getElementById("translateYes");
const translateNo = document.getElementById("translateNo");
const recordYes = document.getElementById("recordYes");
const recordNo = document.getElementById("recordNo");
const loadingSpinner = document.getElementById("loadingSpinner");

let mediaRecorder;
let audioChunks = [];
let timerInterval;
let seconds = 0;

// Start recording function
function startRecording() {
  startButton.disabled = true;
  stopButton.disabled = false;

  // Reset time display
  seconds = 0;
  timeDisplay.innerText = "Time: 0.00s";

  // Access the microphone
  navigator.mediaDevices
    .getUserMedia({ audio: true })
    .then((stream) => {
      // Show the "Listening..." message
      const listeningMessage = document.getElementById("listeningMessage");
      listeningMessage.style.display = "block"; // Show the message
      // Once access is granted, start the timer
      timerInterval = setInterval(() => {
        seconds += 0.1;
        timeDisplay.innerText = `Time: ${seconds.toFixed(2)}s`;
      }, 100);

      // Start the media recorder
      mediaRecorder = new MediaRecorder(stream);

      // When audio data is available, store it in audioChunks
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      // Once the recording stops, save and display the .wav file
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        console.log(audioBlob);
        const audioURL = URL.createObjectURL(audioBlob);
        audioSource.src = audioURL; // Set the audio URL in the source element
        audioPlayer.load(); // Reload audio player to play the new file
        audioChunks = []; // Reset audioChunks for the next recording

        // Show the translation prompt after the file is ready
        translationPrompt.style.display = "block";
      };

      // Start the recording
      mediaRecorder.start();
    })
    .catch((error) => {
      alert("Error accessing microphone: " + error);
    });
}

// Stop the recording
function stopRecording() {
  stopButton.disabled = true;
  startButton.disabled = false;

  // Stop the media recorder
  mediaRecorder.stop();
  // Hide the "Listening..." message
  const listeningMessage = document.getElementById("listeningMessage");
  listeningMessage.style.display = "none";
  // Stop the timer by clearing the interval
  clearInterval(timerInterval);
}

// Enable start/stop button functionality
startButton.addEventListener("click", () => {
  startRecording();
});

stopButton.addEventListener("click", () => {
  stopRecording();
});
translateYes.addEventListener("click", () => {
  // Show the loading spinner and message
  loadingSpinner.style.display = "block";

  // Hide translation prompt
  translationPrompt.style.display = "none";

  // Combine audioChunks into one Blob
  const audioBlob = new Blob(audioChunks, { type: "audio/wav" });

  // Create a FormData object and send the .wav file to the backend
  const formData = new FormData();
  formData.append("file", audioBlob, "audio.wav");

  // Send the request to the backend
  fetch("http://127.0.0.1:8000/process_audio/", {
    method: "POST",
    headers: {
        // No need to set Content-Type header for FormData
    },
    body: formData,
  })
  .then(response => {
    if (!response.ok) {
        throw new Error('Failed to fetch audio from backend');
    }
    return response.json();  // Parse JSON response
  })
  .then((data) => {
    console.log(data);  // Log the data to verify the response structure
    if (data.audio) {
        // Convert the base64 audio string into a Blob
        const audioData = data.audio.split(',')[1]; // Remove the prefix part (data:audio/wav;base64,)
        const byteArray = Uint8Array.from(atob(audioData), c => c.charCodeAt(0));
        const audioBlob = new Blob([byteArray], { type: "audio/wav" });

        // Create an object URL for the audio Blob
        const modifiedAudioURL = URL.createObjectURL(audioBlob);
        
        // Set the audio player's source to the Blob URL
        audioPlayer.src = modifiedAudioURL;

        // Add event listener to check if the audio is loaded
        audioPlayer.addEventListener("canplay", function () {
            console.log("Audio loaded and ready to play");
            audioPlayer.play(); // Play the audio once it's loaded
        });

        // Error handling if the audio fails to load
        audioPlayer.addEventListener("error", function (e) {
            console.error("Error loading the audio:", e);
            alert("Error loading the audio");
        });

        loadingSpinner.style.display = "none";
        recordAgainPrompt.style.display = "block"; // Show the option to record again
    } else {
      alert("No audio found in response");
    }
  })
  .catch((error) => {
    console.error("Error during audio processing:", error);
    loadingSpinner.style.display = "none";
    if (error.message.includes("Failed to fetch")) {
      alert("Unable to connect to the backend. Please ensure the server is running.");
    } else {
      alert("Error processing audio: " + error.message);
    }
  });
});
// Send the request to the backend
// fetch("http://127.0.0.1:8000/process_audio/", {
//   method: "POST",
//   headers: {
//       // Remove any Content-Type header as it's set automatically for FormData
//   },
//   body: formData,
// })
// .then(response => {
//   if (!response.ok) {
//       throw new Error(`HTTP error! status: ${response.status}`);
//   }
//   return response.blob();
// })
// .then((data) => {
//   const modifiedAudioURL = URL.createObjectURL(data);
//   audioPlayer.src = modifiedAudioURL;
//   audioPlayer.load();
//   audioPlayer.play();
//   loadingSpinner.style.display = "none";
//   recordAgainPrompt.style.display = "block";
// })
// .catch((error) => {
//   console.error("Error during audio processing:", error);
//   loadingSpinner.style.display = "none";
//   alert("Error processing audio: " + error.message);
// });
// });

 
translateNo.addEventListener("click", () => {
  translationPrompt.style.display = "none";
  recordAgainPrompt.style.display = "block";
});

recordYes.addEventListener("click", () => {
  recordAgainPrompt.style.display = "none";
  startRecording();
});

// Reset everything when user chooses 'No' for recording again
recordNo.addEventListener("click", () => {
  alert("Thank you for using the app!");

  // Reset audio data and clear UI elements
  audioChunks = [];
  const audioSource = document.getElementById("audioSource");
  if (audioSource) audioSource.src = "";
  const audioPlayer = document.getElementById("audioPlayer");
  if (audioPlayer) audioPlayer.src = "";

  // Clear the timer
  clearInterval(timerInterval);
  timeDisplay.innerText = "Time: 0.00s"; // Reset timer display
});
