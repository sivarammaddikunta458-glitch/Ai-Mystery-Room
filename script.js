
let selectedLevel = "Easy";
let currentGameId = null;
let score = 0;
let answerSubmitted = false;

// Get HTML elements
const levelButtons = document.querySelectorAll(".level");
const startButton = document.getElementById("startButton");
const message = document.getElementById("message");

const clueButtons = document.querySelectorAll(".clue-btn");
const clueResult = document.getElementById("clue-result");

const suspectButtons = document.querySelectorAll(".suspect-btn");
const suspectResult = document.getElementById("suspect-result");

const answerButtons = document.querySelectorAll(".answer-btn");
const answerResult = document.getElementById("answer-result");

const scoreDisplay = document.getElementById("score");

// Clues
const clues = [
    "Clue 1: The glass case is unlocked. There are no broken pieces of glass.",
    "Clue 2: The museum window is open, but the dust on the windowsill is undisturbed.",
    "Clue 3: Small muddy footprints lead toward the museum storage room."
];

// Suspect statements
const statements = {
    Alex: "Alex says: I was guarding the museum entrance last night.",
    Maya: "Maya says: I was researching old paintings in the museum library.",
    Ryan: "Ryan says: I visited the museum, but I left before closing."
};

// Update score and hint count
function updateScore() {
    if (scoreDisplay !== null) {
        scoreDisplay.textContent = score;
    }
}

// Reset the game interface
function resetGame() {
    score = 0;
    
    answerSubmitted = false;

    updateScore();


    answerButtons.forEach(button => {
        button.disabled = false;
    });

    answerResult.textContent = "Choose who you think stole the diamond.";
    clueResult.textContent = "Your clues will appear here.";
    suspectResult.textContent = "Choose a suspect to begin questioning.";
}

// Select difficulty
levelButtons.forEach(button => {
    button.addEventListener("click", () => {
        selectedLevel = button.dataset.level;

        levelButtons.forEach(btn => {
            btn.classList.remove("active");
        });

        button.classList.add("active");
        message.textContent = "Selected difficulty: " + selectedLevel;
    });
});

// Start a new investigation

startButton.addEventListener("click", async () => {
    currentGameId = null;
    resetGame();

    message.textContent = "Creating your mystery...";

    try {
        const response = await fetch(
            "http://127.0.0.1:5000/api/cases",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    difficulty: selectedLevel
                })
            }
        );

        const data = await response.json();
        console.log("Backend response:", data);

        if (!response.ok) {
            message.textContent =
                data.error || "Could not create mystery.";
            return;
        }

        currentGameId = data.game_id;

        message.textContent =
            data.story +
            "\n\nDifficulty: " + data.difficulty +
            "\nGame ID: " + currentGameId +
            "\n\nSuspects:\n" +
            data.suspects.map(suspect =>
                suspect.name + " - " + suspect.role
            ).join("\n");

    } catch (error) {
        console.error("Investigation error:", error);
        message.textContent =
            "Request failed. Check the browser Console.";
    }
});


// Display clues
clueButtons.forEach(button => {
    button.addEventListener("click", () => {
        const clueIndex = Number(button.dataset.clue);
        clueResult.textContent = clues[clueIndex];
    });
});

// Display suspect statements
suspectButtons.forEach(button => {
    button.addEventListener("click", () => {
        const name = button.dataset.suspect;
        suspectResult.textContent = statements[name];
    });
});


// Submit answer, update score, and save to MySQL
answerButtons.forEach(button => {
    button.addEventListener("click", async () => {
        if (answerSubmitted) {
            answerResult.textContent =
                "Answer already submitted. Start a new investigation to play again.";
            return;
        }

        if (currentGameId === null) {
            answerResult.textContent =
                "Please click Start Investigation first!";
            return;
        }

        const answer = button.dataset.answer;

        answerResult.textContent = "Saving your answer...";

        try {
            const response = await fetch(
                "http://127.0.0.1:5000/api/solve",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        game_id: currentGameId,
                        chosen_suspect: answer
                    })
                }
            );

            const data = await response.json();

            if (!response.ok) {
                answerResult.textContent =
                    data.error || "Could not save answer.";
                return;
            }

            answerSubmitted = true;

            if (data.is_solved) {
                score += 100;
                answerResult.textContent =
                    "Correct! Maya stole the diamond! +100 points.";
            } else {
                score -= 10;
                answerResult.textContent =
                    "Wrong answer! -10 points. Mystery ended.";
            }

            updateScore();

            answerButtons.forEach(btn => {
                btn.disabled = true;
            });

        

        } catch (error) {
            answerResult.textContent =
                "Backend connection failed. Check Flask.";
            console.error(error);
        }
    });
});

// Initialize score display
updateScore();
