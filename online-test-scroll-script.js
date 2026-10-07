// ============================================================
// ONLINE QUIZ SCRIPT (Timer + Analysis, No Leaderboard)
// ============================================================

// ---------------- CONFIGURATION ----------------
const quizConfig = document.getElementById("quizConfig");
const TIME_IN_MINUTES = parseInt(quizConfig?.dataset.time || "15", 10);

// ---------------- HTML ELEMENTS ----------------
const quizDiv = document.getElementById("quiz");
const timerDiv = document.getElementById("timer");
const submitBtn = document.getElementById("submitBtn");
const resetBtn = document.getElementById("resetBtn");
const retakeFromReportBtn = document.getElementById("retakeFromReportBtn");

const reportCard = document.getElementById("reportCard");
const analysisCard = document.getElementById("analysisCard");

const viewAnalysisBtn = document.getElementById("viewAnalysisBtn");
const backToResultsBtn = document.getElementById("backToResultsBtn");

const initialStartScreen = document.getElementById("initialStartScreen");
const centerStartBtn = document.getElementById("centerStartBtn");
const quizBox = document.getElementById("quizBox");

const questionCountDisplay = document.getElementById("questionCountDisplay");
const progressBar = document.getElementById("progressBar");

// ---------------- QUIZ VARIABLES ----------------
let selectedAnswers = [];
let quizLocked = [];
let correctCount = 0;

let timer = TIME_IN_MINUTES * 60;
let timerInterval = null;

let quizStarted = false;
let quizSubmitted = false;

const questions = [];

// ============================================================
// 1. LOAD QUESTIONS FROM HTML
// ============================================================
function loadQuestionsFromHTML() {
    questions.length = 0;

    document.querySelectorAll(".question-data").forEach(qEl => {
        const qElement = qEl.querySelector(".q");
        const optionElements = qEl.querySelectorAll(".opt");

        if (!qElement || optionElements.length === 0) {
            return;
        }

        const question = qElement.innerHTML;
        const options = Array.from(optionElements).map(el => el.innerHTML);
        const answer = parseInt(qEl.getAttribute("data-answer"), 10);
        const explanation = qEl.getAttribute("data-explanation") || "";

        questions.push({
            question: question,
            options: options,
            answer: answer,
            explanation: explanation
        });
    });

    selectedAnswers = new Array(questions.length);
    quizLocked = new Array(questions.length).fill(false);
}

// ============================================================
// 2. RENDER ALL QUESTIONS
// ============================================================
function renderAllQuestions() {
    if (!quizDiv) return;

    let html = "";
    let attemptedCount = 0;

    questions.forEach((q, index) => {
        if (selectedAnswers[index] !== undefined) {
            attemptedCount++;
        }

        html += `
        <div class="question-card">
            <div class="question-number-circle">${index + 1}</div>
            <div class="question">${q.question}</div>
            <div class="options">
        `;

        q.options.forEach((opt, i) => {
            const isSelected = selectedAnswers[index] === i ? " selected" : "";
            const onClickAttr = quizLocked[index] ? "" : `onclick="selectAnswer(${index}, ${i})"`;

            html += `
                <div class="option${isSelected}" ${onClickAttr}>
                    ${opt}
                </div>
            `;
        });

        html += `
            </div>
        </div>
        `;
    });

    quizDiv.innerHTML = html;

    // Question count
    if (questionCountDisplay) {
        questionCountDisplay.textContent = `Questions : ${attemptedCount}/${questions.length}`;
    }

    // Progress bar
    if (progressBar) {
        const percentage = questions.length > 0 ? (attemptedCount / questions.length) * 100 : 0;
        progressBar.style.width = `${percentage}%`;
    }
}

// ============================================================
// 3. SELECT ANSWER
// ============================================================
window.selectAnswer = function(qIndex, aIndex) {
    if (quizLocked[qIndex] || quizSubmitted) {
        return;
    }

    selectedAnswers[qIndex] = aIndex;
    renderAllQuestions();
};

// ============================================================
// 4. TIMER
// ============================================================
function updateTimer() {
    if (!timerDiv) return;

    if (timer <= 0) {
        timer = 0;
        timerDiv.textContent = "🕛 00:00:00";
        clearInterval(timerInterval);
        submitResults();
        return;
    }

    const hours = Math.floor(timer / 3600);
    const minutes = Math.floor((timer % 3600) / 60);
    const seconds = timer % 60;

    const hDisplay = hours < 10 ? "0" + hours : hours;
    const mDisplay = minutes < 10 ? "0" + minutes : minutes;
    const sDisplay = seconds < 10 ? "0" + seconds : seconds;

    timerDiv.textContent = `🕛 ${hDisplay}:${mDisplay}:${sDisplay}`;

    // Last 2 minutes warning
    if (timer <= 120) {
        timerDiv.style.color = "red";
        timerDiv.classList.add("timer-low");
    } else {
        timerDiv.style.color = "";
        timerDiv.classList.remove("timer-low");
    }

    timer--;
}

function startTimer() {
    clearInterval(timerInterval);
    timer = TIME_IN_MINUTES * 60;
    updateTimer();
    timerInterval = setInterval(updateTimer, 1000);
}

// ============================================================
// 5. SUBMIT TEST
// ============================================================
function submitResults() {
    if (quizSubmitted) return;

    quizSubmitted = true;
    clearInterval(timerInterval);

    // Lock all questions
    quizLocked = questions.map(() => true);
    renderAllQuestions();

    // Hide quiz buttons
    if (submitBtn) submitBtn.style.display = "none";
    if (resetBtn) resetBtn.style.display = "none";

    // Show report
    if (reportCard) reportCard.style.display = "block";

    const attempted = selectedAnswers.filter(v => v !== undefined).length;
    correctCount = selectedAnswers.filter((v, i) => v !== undefined && questions[i] && v === questions[i].answer).length;
    const wrong = attempted - correctCount;

    // Report values
    const totalEl = document.getElementById("total");
    const attemptedEl = document.getElementById("attempted");
    const correctEl = document.getElementById("correct");
    const wrongEl = document.getElementById("wrong");
    const scoreEl = document.getElementById("score");
    const totalScoreEl = document.getElementById("totalScore");

    if (totalEl) totalEl.textContent = questions.length;
    if (attemptedEl) attemptedEl.textContent = attempted;
    if (correctEl) correctEl.textContent = correctCount;
    if (wrongEl) wrongEl.textContent = wrong;
    if (scoreEl) scoreEl.textContent = correctCount;
    if (totalScoreEl) totalScoreEl.textContent = questions.length;

    setTimeout(() => {
        if (reportCard) {
            reportCard.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    }, 300);
}

// ============================================================
// 6. QUESTION ANALYSIS
// ============================================================
function showAnalysis() {
    if (!analysisCard) return;

    analysisCard.style.display = "block";

    const container = document.getElementById("analysisContent");
    if (!container) return;

    container.innerHTML = questions.map((q, i) => {
        const userAns = selectedAnswers[i];

        const feedbackClass = userAns === undefined
            ? "not-attempted-feedback"
            : (userAns === q.answer ? "correct-feedback" : "wrong-feedback");

        const feedbackText = userAns === undefined
            ? "Not Attempted"
            : (userAns === q.answer ? "Correct" : "Wrong");

        const optionsHTML = q.options.map((opt, j) => {
            let optionClass = "";
            if (j === q.answer) {
                optionClass = "correct";
            } else if (j === userAns && userAns !== q.answer) {
                optionClass = "wrong";
            }

            return `<div class="option ${optionClass}">${opt}</div>`;
        }).join("");

        const explanationHTML = q.explanation ? `
            <div class="explanation-box">
                <b>📝 स्पष्टीकरण :</b> ${q.explanation}
            </div>
        ` : "";

        return `
        <div class="analysis-box">
            <div class="question-number-circle">${i + 1}</div>
            <b>${q.question}</b>
            ${optionsHTML}
            <div class="feedback ${feedbackClass}">${feedbackText}</div>
            ${explanationHTML}
        </div>
        `;
    }).join("");

    setTimeout(() => {
        analysisCard.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
}

// ============================================================
// 7. EVENT LISTENERS & SETUP
// ============================================================
function restartTest() {
    location.reload();
}

if (centerStartBtn) {
    centerStartBtn.onclick = () => {
        if (quizStarted) return;
        quizStarted = true;

        loadQuestionsFromHTML();

        if (initialStartScreen) initialStartScreen.style.display = "none";
        if (reportCard) reportCard.style.display = "none";
        if (analysisCard) analysisCard.style.display = "none";
        if (quizBox) quizBox.style.display = "block";
        if (submitBtn) submitBtn.style.display = "block";
        if (resetBtn) resetBtn.style.display = "block";

        renderAllQuestions();
        startTimer();
    };
}

if (submitBtn) submitBtn.onclick = submitResults;
if (resetBtn) resetBtn.onclick = restartTest;
if (retakeFromReportBtn) retakeFromReportBtn.onclick = restartTest;
if (viewAnalysisBtn) viewAnalysisBtn.onclick = showAnalysis;

if (backToResultsBtn) {
    backToResultsBtn.onclick = () => {
        if (analysisCard) analysisCard.style.display = "none";
        if (reportCard) {
            reportCard.style.display = "block";
            reportCard.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };
}

// Initial setup
loadQuestionsFromHTML();
renderAllQuestions();

if (timerDiv) {
    const initialHours = Math.floor(timer / 3600);
    const initialMinutes = Math.floor((timer % 3600) / 60);
    const initialSeconds = timer % 60;

    const h = initialHours < 10 ? "0" + initialHours : initialHours;
    const m = initialMinutes < 10 ? "0" + initialMinutes : initialMinutes;
    const s = initialSeconds < 10 ? "0" + initialSeconds : initialSeconds;

    timerDiv.textContent = `🕛 ${h}:${m}:${s}`;
}
