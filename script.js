// 1. Firebase Configuration (USE YOUR PROVIDED KEYS)
const firebaseConfig = {
    apiKey: "AIzaSyBLyf_dz6xPC9wdthZSVtpatkc8JgFhE4Q",
    authDomain: "chatbox-chats.firebaseapp.com",
    projectId: "chatbox-chats",
    storageBucket: "chatbox-chats.appspot.com",
    messagingSenderId: "10200860576",
    appId: "1:10200860576:web:262315d86f6d1732ddc6c5"
};

try {
    firebase.initializeApp(firebaseConfig);
    console.log("Firebase initialized successfully.");
} catch (error) {
    console.error("Firebase initialization failed:", error);
    document.getElementById('game-status').textContent = 'Error Initializing Firebase';
    document.getElementById('game-status').className = 'status-indicator error';
}

const database = firebase.database();
// Reference to store all drawing segments
const drawingRef = database.ref('game/currentDrawing');
const statusDiv = document.getElementById('game-status');

// 2. Canvas Setup
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
const controls = {
    color: document.getElementById('color-picker'),
    width: document.getElementById('line-width'),
    clear: document.getElementById('clear-button')
};

// Set canvas size (Fixed large size for consistency, can be adjusted with resize observer)
const CANVAS_WIDTH = 800; 
const CANVAS_HEIGHT = 600;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

// Drawing state variables
let isDrawing = false;
let lastX_norm = 0; // Normalized last X (0 to 1)
let lastY_norm = 0; // Normalized last Y (0 to 1)

// 3. Drawing Functions
function startDrawing(clientX, clientY) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    // Normalize coordinates relative to canvas size (0 to 1)
    lastX_norm = (clientX - rect.left) / CANVAS_WIDTH;
    lastY_norm = (clientY - rect.top) / CANVAS_HEIGHT;
}

function draw(clientX, clientY) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    // Current normalized coordinates
    const currentX_norm = (clientX - rect.left) / CANVAS_WIDTH;
    const currentY_norm = (clientY - rect.top) / CANVAS_HEIGHT;
    
    const data = {
        x: currentX_norm,
        y: currentY_norm,
        lastX: lastX_norm,
        lastY: lastY_norm,
        color: controls.color.value,
        width: controls.width.value
    };

    // Send Real-Time Data to Firebase
    drawingRef.push(data); 

    // Update last normalized coordinates for the next segment
    lastX_norm = currentX_norm;
    lastY_norm = currentY_norm;
}

// Function to draw a segment on the canvas (used locally AND for remote data)
function drawSegment(data) {
    ctx.strokeStyle = data.color;
    ctx.lineWidth = data.width;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    
    // Convert normalized coordinates back to canvas pixels
    const startX = data.lastX * CANVAS_WIDTH;
    const startY = data.lastY * CANVAS_HEIGHT;
    const endX = data.x * CANVAS_WIDTH;
    const endY = data.y * CANVAS_HEIGHT;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
}

// 4. Event Listeners (Mouse & Touch for better compatibility)
canvas.addEventListener('mousedown', (e) => startDrawing(e.clientX, e.clientY));
canvas.addEventListener('touchstart', (e) => {
    e.preventDefault(); // Prevent scrolling
    startDrawing(e.touches[0].clientX, e.touches[0].clientY);
});

canvas.addEventListener('mouseup', () => isDrawing = false);
canvas.addEventListener('mouseout', () => isDrawing = false);
canvas.addEventListener('touchend', () => isDrawing = false);

canvas.addEventListener('mousemove', (e) => draw(e.clientX, e.clientY));
canvas.addEventListener('touchmove', (e) => {
    e.preventDefault(); // Prevent scrolling
    draw(e.touches[0].clientX, e.touches[0].clientY);
});


// 5. Firebase Real-Time Listener
drawingRef.on('child_added', (snapshot) => {
    // Renders every new stroke segment pushed to Firebase (by any user)
    const data = snapshot.val();
    drawSegment(data);
});


// 6. Clear Button Logic
controls.clear.addEventListener('click', () => {
    // Clear the local canvas
    ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    // Clear the Firebase database to synchronize with all users
    drawingRef.remove().then(() => {
        console.log("Canvas cleared and Firebase data removed.");
    }).catch(error => {
        console.error("Error clearing Firebase data:", error);
    });
});


// 7. Connection Status & Game Hint Placeholder
database.ref('.info/connected').on('value', (snapshot) => {
    if (snapshot.val() === true) {
        statusDiv.textContent = 'Status: Connected';
        statusDiv.className = 'status-indicator connected';
    } else {
        statusDiv.textContent = 'Status: Disconnected';
        statusDiv.className = 'status-indicator error';
    }
});

// ********************************************
// * GAME LOGIC PLACEHOLDER *
// ********************************************
const guessInput = document.getElementById('guess-input');
const sendGuessBtn = document.getElementById('send-guess');
const chatList = document.getElementById('chat-list');
let currentWord = "FIREBASE"; 

sendGuessBtn.addEventListener('click', () => {
    const guess = guessInput.value.trim();
    if (guess === "") return;
    
    const isCorrect = guess.toUpperCase() === currentWord;

    const message = isCorrect
        ? `🟢 CORRECT! Player guessed the word: ${currentWord}`
        : `🟠 Guess: ${guess}`;
    
    // In a real multi-user game, you would push this message to a separate 'chatRef' in Firebase.
    const li = document.createElement('li');
    li.innerHTML = message;
    chatList.appendChild(li);
    chatList.scrollTop = chatList.scrollHeight; // Auto-scroll
    
    guessInput.value = ''; 
});
