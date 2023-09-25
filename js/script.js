let timerInterval = 0;
let questions = [];

async function loadXML(filePath) {
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(`Network response was not ok ${response.statusText}`);
        }
        const text = await response.text();
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, "text/xml");
        return xmlDoc;
    } catch (error) {
        console.error('There has been a problem with your fetch operation:', error);
    }
}

function renderAnswers(question, questionId) {
    return Array.from(question.getElementsByTagName("answer")).map((answer, index) => `
        <div class="form-check">
            <input class="form-check-input" type="radio" name="q${questionId}" value="${answer.getAttribute("id")}" id="q${questionId}a${index}">
            <label class="form-check-label" for="q${questionId}a${index}">
                ${answer.textContent}
            </label>
        </div>
    `).join('');
}


async function startQuiz() {
    const xmlDoc = await loadXML('./data/python.xml');
    questions = xmlDoc.getElementsByTagName('question');
    let quizContainer = document.getElementById('quiz-container');

    document.getElementById('quiz-container').style.display = 'block';
    document.getElementById('submit-button').style.display = 'block';
    document.getElementById('sticky-container').style.display = 'block';
    document.getElementById('start-button').style.display = 'none';

    const questionsNav = document.getElementById('questions-nav');

    for (let question of questions) {
        let questionDiv = document.createElement('div');
        questionDiv.className = 'question border-bottom border-2 border-secondary mb-1 p-2 pb-3';  // Bootstrap margin bottom
        let questionText = question.getElementsByTagName("text")[0].textContent;
        let questionId = question.getAttribute("id");

        // Add question to the navigation bar
        let questionNav = document.createElement('li');
        questionNav.className = 'page-item';
        questionNav.innerHTML = `<a class="page-link" href="#q${questionId}">${questionId}</a>`;
        questionsNav.appendChild(questionNav);
        
        // Check for the presence of a <code> tag
        let codeSegment = question.getElementsByTagName("code")[0];
        let codeHTML = '';
        if (codeSegment) {
            codeHTML = '<pre class="code"><code class="language-python">' +codeSegment.textContent + '</code></pre>';
        }
    
        questionDiv.innerHTML = `
            <p style="vertical-align: middle;" id="q${questionId}"><b><span class="question-number">${questionId}</span> ${questionText}</b></p>
            ${codeHTML}
            ${renderAnswers(question, question.getAttribute("id"))}
        `;
        
        quizContainer.appendChild(questionDiv);
    }

    // Timer
    let endTime = new Date().getTime() + 60 * 60 * 1000;

    function updateTimer() {
        let now = new Date().getTime();
        let distance = endTime - now;

        // Calculating minutes and seconds from milliseconds
        let minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((distance % (1000 * 60)) / 1000);

        // Updating the timer element
        document.getElementById('timer').innerText = `${minutes}m ${seconds}s`;

        if (distance < 0) {
            clearInterval(timerInterval);
            document.getElementById('timer').innerText = "Time's Up!";
            submitQuiz();
        }
    }

    timerInterval = setInterval(updateTimer, 1000);
    updateTimer();
    Prism.highlightAll();
}

function submitQuiz() {
    clearInterval(timerInterval);

    let score = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;

    for (let question of questions) {
        let selectedAnswer = document.querySelector(`input[name="q${question.getAttribute("id")}"]:checked`);
        let correctAnswer = question.getElementsByTagName("correct")[0].textContent;

        if (selectedAnswer && selectedAnswer.value === correctAnswer) {
            score += 1;
            correctAnswers += 1;
        } else {
            score -= 1;
            incorrectAnswers += 1;
        }
    }

    // Inject result into modal body
    const finalResult = score/40 * 100 <= 0 ? 0 : score/40 * 100;
    document.getElementById('resultModalBody').innerHTML = `Your score is: ${finalResult}%.<br/>
    Correct answers: ${correctAnswers}. Incorrect answers: ${incorrectAnswers}.`;

    // Show the modal
    var resultModal = new bootstrap.Modal(document.getElementById('resultModal'));
    resultModal.show();
}