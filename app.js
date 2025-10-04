// Priority Queue implementation for learning reinforcement
class PriorityQueue {
    constructor() {
        this.items = [];
    }

    enqueue(element, priority) {
        const queueElement = { element, priority };
        let added = false;

        for (let i = 0; i < this.items.length; i++) {
            if (queueElement.priority < this.items[i].priority) {
                this.items.splice(i, 0, queueElement);
                added = true;
                break;
            }
        }

        if (!added) {
            this.items.push(queueElement);
        }
    }

    dequeue() {
        return this.items.shift();
    }

    isEmpty() {
        return this.items.length === 0;
    }

    size() {
        return this.items.length;
    }

    updatePriority(element, newPriority) {
        const index = this.items.findIndex(item => 
            item.element.num1 === element.num1 && 
            item.element.num2 === element.num2
        );
        
        if (index !== -1) {
            this.items.splice(index, 1);
            this.enqueue(element, newPriority);
        }
    }
}

// Question class to represent each addition problem
class Question {
    constructor(num1, num2, level = 1) {
        this.num1 = num1;
        this.num2 = num2;
        this.answer = num1 + num2;
        this.level = level; // Learning level (priority)
    }
    
    // Get normalized key for commutative property (3+4 = 4+3)
    getNormalizedKey() {
        const min = Math.min(this.num1, this.num2);
        const max = Math.max(this.num1, this.num2);
        return `q_${min}_${max}`;
    }
}

// Main Game Controller
class AdditionGame {
    constructor() {
        this.questions = new PriorityQueue();
        this.currentQuestion = null;
        this.questionCount = 0;
        this.correctCount = 0;
        this.totalQuestions = 39;
        this.numChoices = 3;
        this.requiredSuccessRate = 80;
        this.timeoutSeconds = 7;
        this.timeoutTimer = null;
        this.timeoutInterval = null;
        this.timeRemaining = 0;
        this.recentQuestions = []; // Track recently shown questions
        this.minQuestionGap = 5; // Minimum gap between same question
        
        // Motivational messages
        this.correctMessages = [
            "🌟 Harika!",
            "🎉 Mükemmel!",
            "⭐ Süpersin!",
            "🚀 Fantastik!",
            "💫 Muhteşem!",
            "🏆 Çok iyi!",
            "✨ Aferin!",
            "🎯 Bravo!",
            "🌈 Harikasın!",
            "💪 Çok güzel!"
        ];
        
        this.incorrectMessages = [
            "💪 Tekrar dene!",
            "🌟 Devam et!",
            "⭐ Neredeyse!",
            "🚀 İyi deneme!",
            "💫 Denemeye devam!",
            "🌈 Pes etme!",
            "✨ Yapabilirsin!",
            "🎯 Çok yaklaştın!"
        ];

        this.init();
        this.loadProgress();
        this.loadSettings();
    }

    init() {
        // Initialize all single-digit addition problems (0-9 + 0-9)
        for (let i = 0; i <= 9; i++) {
            for (let j = 0; j <= 9; j++) {
                const savedLevel = this.getQuestionLevel(i, j);
                const question = new Question(i, j, savedLevel);
                // Use level as priority (lower level = lower priority value = higher priority)
                this.questions.enqueue(question, savedLevel);
            }
        }
    }

    getQuestionLevel(num1, num2) {
        // Use normalized key for commutative property
        const min = Math.min(num1, num2);
        const max = Math.max(num1, num2);
        const key = `q_${min}_${max}`;
        const saved = localStorage.getItem(key);
        return saved ? parseInt(saved) : 1;
    }

    saveQuestionLevel(question) {
        // Use normalized key for commutative property
        const key = question.getNormalizedKey();
        localStorage.setItem(key, question.level.toString());
    }

    loadProgress() {
        // Progress is automatically loaded via getQuestionLevel
    }

    loadSettings() {
        const numChoices = localStorage.getItem('numChoices');
        const numQuestions = localStorage.getItem('numQuestions');
        const successRate = localStorage.getItem('successRate');
        const timeoutSeconds = localStorage.getItem('timeoutSeconds');

        if (numChoices) this.numChoices = parseInt(numChoices);
        if (numQuestions) this.totalQuestions = parseInt(numQuestions);
        if (successRate) this.requiredSuccessRate = parseInt(successRate);
        if (timeoutSeconds) this.timeoutSeconds = parseInt(timeoutSeconds);
    }

    saveSettings() {
        localStorage.setItem('numChoices', this.numChoices.toString());
        localStorage.setItem('numQuestions', this.totalQuestions.toString());
        localStorage.setItem('successRate', this.requiredSuccessRate.toString());
        localStorage.setItem('timeoutSeconds', this.timeoutSeconds.toString());
    }

    resetProgress() {
        // Clear all question levels from localStorage using normalized keys
        for (let i = 0; i <= 9; i++) {
            for (let j = i; j <= 9; j++) {  // Only iterate j >= i to avoid duplicates
                const key = `q_${i}_${j}`;
                localStorage.removeItem(key);
            }
        }
        
        // Reinitialize the priority queue
        this.questions = new PriorityQueue();
        this.init();
    }

    startSession() {
        this.questionCount = 0;
        this.correctCount = 0;
        this.recentQuestions = []; // Clear recent questions history
        this.nextQuestion();
    }

    nextQuestion() {
        if (this.questionCount >= this.totalQuestions) {
            this.showResults();
            return;
        }

        console.log('=== Next Question ===');
        console.log('Recent questions:', this.recentQuestions);
        console.log('Queue size:', this.questions.items.length);

        let selectedQuestion = null;
        let lowestLevel = this.questions.items.length > 0 ? this.questions.items[0].priority : 1;
        const maxLevel = 5;
        
        // Try to find a question that hasn't been shown recently
        // Start from lowest level and go up if needed
        for (let currentLevel = lowestLevel; currentLevel <= maxLevel && !selectedQuestion; currentLevel++) {
            const sameLevelIndices = [];
            
            // Collect all questions at this level
            for (let i = 0; i < this.questions.items.length; i++) {
                if (this.questions.items[i].priority === currentLevel) {
                    sameLevelIndices.push(i);
                } else if (this.questions.items[i].priority > currentLevel) {
                    break; // Since items are sorted by priority
                }
            }
            
            if (sameLevelIndices.length === 0) continue;
            
            console.log(`Checking level ${currentLevel}: found ${sameLevelIndices.length} questions`);
            
            // Filter out recently shown questions
            const availableIndices = sameLevelIndices.filter(index => {
                const question = this.questions.items[index].element;
                const min = Math.min(question.num1, question.num2);
                const max = Math.max(question.num1, question.num2);
                const normalizedKey = `q_${min}_${max}`;
                return !this.recentQuestions.includes(normalizedKey);
            });
            
            console.log(`After filtering recent: ${availableIndices.length} available`);
            
            // If we found available questions at this level, pick one
            if (availableIndices.length > 0) {
                const randomIndex = availableIndices[Math.floor(Math.random() * availableIndices.length)];
                selectedQuestion = this.questions.items.splice(randomIndex, 1)[0];
                console.log(`Selected from level ${currentLevel}: ${selectedQuestion.element.num1} + ${selectedQuestion.element.num2}`);
                break;
            }
        }
        
        // If still no question found (all questions in queue were recent), take any from lowest level
        if (!selectedQuestion) {
            console.log('All questions were recent, taking from lowest level anyway');
            selectedQuestion = this.questions.items.shift();
        }
        
        this.currentQuestion = selectedQuestion.element;
        console.log(`Final selection: ${this.currentQuestion.num1} + ${this.currentQuestion.num2}`);
        
        this.questionCount++;
        this.displayQuestion();
    }
    
    markQuestionAsRecent(question) {
        // Add to recent questions and maintain the gap
        const min = Math.min(question.num1, question.num2);
        const max = Math.max(question.num1, question.num2);
        const normalizedKey = `q_${min}_${max}`;
        
        console.log(`Marking as recent: ${normalizedKey}`);
        
        // Only add if not already in recent questions
        if (!this.recentQuestions.includes(normalizedKey)) {
            this.recentQuestions.push(normalizedKey);
            
            // Keep only the last minQuestionGap questions in recent history
            if (this.recentQuestions.length > this.minQuestionGap) {
                this.recentQuestions.shift();
            }
        }
        
        console.log('Recent questions after marking:', this.recentQuestions);
    }

    displayQuestion() {
        // Update question counter and progress bar
        document.getElementById('questionCounter').textContent = 
            `Soru ${this.questionCount}/${this.totalQuestions}`;
        document.getElementById('scoreDisplay').textContent = 
            `Puan: ${this.correctCount}/${this.questionCount - 1}`;
        
        const progress = ((this.questionCount - 1) / this.totalQuestions) * 100;
        document.getElementById('progressBar').style.width = `${progress}%`;

        // Display the question
        document.getElementById('number1').textContent = this.currentQuestion.num1;
        document.getElementById('number2').textContent = this.currentQuestion.num2;

        // Display learning level
        this.displayLearningLevel();

        // Clear motivational message
        document.getElementById('motivationalMessage').textContent = '';
        document.getElementById('motivationalMessage').className = 'motivational-message';

        // Generate answer choices
        this.generateChoices();
        
        // Start timeout timer
        this.startTimeout();
    }

    displayLearningLevel() {
        const levelStarsContainer = document.getElementById('levelStars');
        const levelNumber = document.getElementById('levelNumber');
        
        // Update level number (max level is now 5)
        levelNumber.textContent = `${this.currentQuestion.level}/5`;
        
        // Generate stars (5 stars instead of 10)
        levelStarsContainer.innerHTML = '';
        for (let i = 1; i <= 5; i++) {
            const star = document.createElement('span');
            star.className = `level-star ${i <= this.currentQuestion.level ? 'filled' : 'empty'}`;
            star.textContent = '⭐';
            levelStarsContainer.appendChild(star);
        }
    }

    startTimeout() {
        // Clear any existing timers
        this.clearTimers();
        
        // Initialize time remaining
        this.timeRemaining = this.timeoutSeconds;
        
        // Update display
        const timeoutBar = document.getElementById('timeoutBar');
        const timeoutCounter = document.getElementById('timeoutCounter');
        timeoutBar.style.width = '100%';
        timeoutBar.className = 'timeout-bar';
        timeoutCounter.textContent = `${this.timeRemaining}s`;
        
        // Update timer every 100ms for smooth animation
        this.timeoutInterval = setInterval(() => {
            this.timeRemaining -= 0.1;
            
            if (this.timeRemaining <= 0) {
                this.handleTimeout();
                return;
            }
            
            // Update progress bar
            const percentage = (this.timeRemaining / this.timeoutSeconds) * 100;
            timeoutBar.style.width = `${percentage}%`;
            
            // Update counter (round to 1 decimal)
            timeoutCounter.textContent = `${Math.ceil(this.timeRemaining)}s`;
            
            // Change color based on remaining time
            if (this.timeRemaining <= 2) {
                timeoutBar.className = 'timeout-bar danger';
            } else if (this.timeRemaining <= 4) {
                timeoutBar.className = 'timeout-bar warning';
            }
        }, 100);
    }

    clearTimers() {
        if (this.timeoutTimer) {
            clearTimeout(this.timeoutTimer);
            this.timeoutTimer = null;
        }
        if (this.timeoutInterval) {
            clearInterval(this.timeoutInterval);
            this.timeoutInterval = null;
        }
    }

    handleTimeout() {
        this.clearTimers();
        
        // Treat timeout as incorrect answer
        const messageEl = document.getElementById('motivationalMessage');
        messageEl.textContent = '⏰ Süre doldu! Hadi başka bir soru deneyelim!';
        messageEl.className = 'motivational-message incorrect';
        
        // Disable all choice buttons
        const allButtons = document.querySelectorAll('.choice-btn');
        allButtons.forEach(btn => {
            btn.style.pointerEvents = 'none';
            if (parseInt(btn.textContent) === this.currentQuestion.answer) {
                btn.classList.add('correct');
            }
        });
        
        // Decrease learning level (lower level = higher priority in future)
        this.currentQuestion.level = Math.max(this.currentQuestion.level - 1, 1);
        this.saveQuestionLevel(this.currentQuestion);
        
        // Re-enqueue the question with updated priority (level is used as priority)
        this.questions.enqueue(this.currentQuestion, this.currentQuestion.level);
        
        // Mark question as recently shown AFTER re-enqueueing
        this.markQuestionAsRecent(this.currentQuestion);
        
        // Move to next question after delay
        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    }

    generateChoices() {
        const choicesContainer = document.getElementById('choicesContainer');
        choicesContainer.innerHTML = '';

        const correctAnswer = this.currentQuestion.answer;
        const choices = new Set([correctAnswer]);

        // Generate incorrect choices
        while (choices.size < this.numChoices) {
            const offset = Math.floor(Math.random() * 10) - 5; // Random offset between -5 and 4
            const choice = correctAnswer + offset;
            if (choice >= 0 && choice <= 18 && choice !== correctAnswer) {
                choices.add(choice);
            }
        }

        // Convert to array and shuffle
        const choicesArray = Array.from(choices).sort(() => Math.random() - 0.5);

        // Create choice buttons
        choicesArray.forEach(choice => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = choice;
            button.onclick = () => this.checkAnswer(choice, button);
            choicesContainer.appendChild(button);
        });
    }

    checkAnswer(selectedAnswer, button) {
        // Clear timeout timers
        this.clearTimers();
        
        const isCorrect = selectedAnswer === this.currentQuestion.answer;
        const messageEl = document.getElementById('motivationalMessage');

        // Disable all choice buttons
        const allButtons = document.querySelectorAll('.choice-btn');
        allButtons.forEach(btn => btn.style.pointerEvents = 'none');

        if (isCorrect) {
            this.correctCount++;
            button.classList.add('correct');
            
            // Show motivational message
            const message = this.correctMessages[Math.floor(Math.random() * this.correctMessages.length)];
            messageEl.textContent = message;
            messageEl.className = 'motivational-message correct';

            // Increase learning level (higher level = lower priority in future)
            this.currentQuestion.level = Math.min(this.currentQuestion.level + 1, 5);
        } else {
            button.classList.add('incorrect');
            
            // Show encouraging message
            const message = this.incorrectMessages[Math.floor(Math.random() * this.incorrectMessages.length)];
            messageEl.textContent = message;
            messageEl.className = 'motivational-message incorrect';

            // Highlight correct answer
            allButtons.forEach(btn => {
                if (parseInt(btn.textContent) === this.currentQuestion.answer) {
                    btn.classList.add('correct');
                }
            });

            // Decrease learning level (lower level = higher priority in future)
            this.currentQuestion.level = Math.max(this.currentQuestion.level - 1, 1);
        }

        // Save updated level
        this.saveQuestionLevel(this.currentQuestion);

        // Re-enqueue the question with updated priority (level is used as priority)
        this.questions.enqueue(this.currentQuestion, this.currentQuestion.level);
        
        // Mark question as recently shown AFTER re-enqueueing
        this.markQuestionAsRecent(this.currentQuestion);

        // Move to next question after delay
        setTimeout(() => {
            this.nextQuestion();
        }, 1500);
    }

    showResults() {
        const successRate = (this.correctCount / this.totalQuestions) * 100;
        const passed = successRate >= this.requiredSuccessRate;

        document.getElementById('totalAnswered').textContent = this.totalQuestions;
        document.getElementById('correctAnswers').textContent = this.correctCount;
        document.getElementById('finalSuccessRate').textContent = `${successRate.toFixed(1)}%`;

        const resultIcon = document.getElementById('resultIcon');
        const resultTitle = document.getElementById('resultTitle');
        const resultMessage = document.getElementById('resultMessage');

        if (passed) {
            resultIcon.textContent = '🎉';
            resultTitle.textContent = 'Harika İş!';
            resultMessage.textContent = `Toplama yıldızısın! %${successRate.toFixed(1)} doğru cevap verdin!`;
            resultTitle.style.color = '#4caf50';
        } else {
            resultIcon.textContent = '🌟';
            resultTitle.textContent = 'Güzel Çaba!';
            resultMessage.textContent = `Pratik yapmaya devam et! %${successRate.toFixed(1)} doğru cevap verdin. Yapabilirsin!`;
            resultTitle.style.color = '#f5576c';
        }

        showScreen('resultsScreen');
    }
}

// Initialize the game
let game;
let currentScreen = 'welcomeScreen';

// Screen navigation
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    currentScreen = screenId;
}

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    game = new AdditionGame();

    // Welcome screen
    document.getElementById('startBtn').addEventListener('click', () => {
        showScreen('gameScreen');
        game.startSession();
    });

    document.getElementById('settingsBtn').addEventListener('click', () => {
        // Load current settings
        document.getElementById('numChoices').value = game.numChoices;
        document.getElementById('numQuestions').value = game.totalQuestions;
        document.getElementById('successRate').value = game.requiredSuccessRate;
        document.getElementById('timeoutSeconds').value = game.timeoutSeconds;
        showScreen('settingsScreen');
    });

    // Settings screen
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
        game.numChoices = parseInt(document.getElementById('numChoices').value);
        game.totalQuestions = parseInt(document.getElementById('numQuestions').value);
        game.requiredSuccessRate = parseInt(document.getElementById('successRate').value);
        game.timeoutSeconds = parseInt(document.getElementById('timeoutSeconds').value);
        game.saveSettings();
        showScreen('welcomeScreen');
    });

    document.getElementById('backToWelcomeBtn').addEventListener('click', () => {
        showScreen('welcomeScreen');
    });

    // Game screen
    document.getElementById('quitBtn').addEventListener('click', () => {
        if (confirm('Bu oturumu bitirmek istediğinizden emin misiniz?')) {
            game.clearTimers();
            showScreen('welcomeScreen');
        }
    });

    // Results screen
    document.getElementById('playAgainBtn').addEventListener('click', () => {
        showScreen('gameScreen');
        game.startSession();
    });

    document.getElementById('resetProgressBtn').addEventListener('click', () => {
        if (confirm('Tüm ilerlemeyi sıfırlamak istediğinizden emin misiniz? Bu işlem tüm öğrenme seviyelerini sıfırlayacaktır.')) {
            game.resetProgress();
            alert('İlerleme sıfırlandı! Tüm sorular 1. seviyeye döndü.');
        }
    });

    document.getElementById('backToMenuBtn').addEventListener('click', () => {
        showScreen('welcomeScreen');
    });
    
    // Reset progress from welcome screen
    document.getElementById('resetProgressBtnWelcome').addEventListener('click', () => {
        if (confirm('Tüm ilerlemeyi sıfırlamak istediğinizden emin misiniz? Bu işlem tüm öğrenme seviyelerini sıfırlayacaktır.')) {
            game.resetProgress();
            alert('İlerleme sıfırlandı! Tüm sorular 1. seviyeye döndü.');
        }
    });
    
    // ESC key to quit session
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && currentScreen === 'gameScreen') {
            if (confirm('Bu oturumu bitirmek istediğinizden emin misiniz?')) {
                game.clearTimers();
                showScreen('welcomeScreen');
            }
        }
    });
});
