/*
|--------------------------------------------------------------------------
| Variables
|--------------------------------------------------------------------------
*/
let userInput = { questions: '', category: '', difficulty: '', type: '' };
let questionsRemaining, quizInterval, looper, currentIndex, i = 0, correctAnswers = 0, counter = 1, limit = 10, timeout = 3000;
let apiResponse;

var timer;

let categories = {
    any: 'Any',
    9: 'General Knowledge', 10: 'Entertainment: Books', 11: 'Entertainment: Film', 12: 'Entertainment: Music', 13: 'Entertainment: Musicals Theatres',
    14: 'Entertainment: Television', 15: 'Entertainment: Video Games', 16: 'Entertainment: Board Games', 17: 'Science Nature', 18: 'Science: Computers',
    19: 'Science: Mathematics', 20: 'Mythology', 21: 'Sports', 22: 'Geography', 23: 'History',
    24: 'Politics', 25: 'Art', 26: 'Celebrities', 27: 'Animals', 28: 'Vehicles',
    29: 'Entertainment: Comics', 30: 'Science: Gadgets', 31: 'Entertainment: Japanese Anime Manga', 32: 'Entertainment: Cartoon Animations'
};

let difficulties = {
    any: 'Any',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard'
};

let types = {
    any: 'Any',
    multiple: 'Multiple Choice',
    boolean: 'True / False'
};

/*
|--------------------------------------------------------------------------
| AJAX
|--------------------------------------------------------------------------
*/
let baseURL = 'https://opendb.com/api.php';

$('#quiz-selector').on('submit', function(e) {
   e.preventDefault();
   $('#quiz-selector button').addClass('disabled');
   $('#quiz-selector button').text('Fetching Quiz...');

   var amount = document.getElementById('amount').value;
   var category = document.getElementById('category').value;
   var difficulty = document.getElementById('difficulty').value;
   var type = document.getElementById('type').value;

   var url = baseURL + '?amount=' + amount;
   url += (category !== 'any') ? '&category=' + category : '';
   url += (difficulty !== 'any') ? '&difficulty=' + difficulty : '';
   url += (type !== 'any') ? '&type=' + type : '';

   $.ajax({
       url: url,
       success: function(response) {
           apiResponse = response;
           initiate();
       },
       error: function(xhr, status, error) {
           $('#ajax-error').modal('show');
       },
       complete: function () {
           $('#quiz-selector button').removeClass('disabled');
           $('#quiz-selector button').text('Get Quiz');
       }
   })

});

/*
|--------------------------------------------------------------------------
| Event Listeners
|--------------------------------------------------------------------------
*/
// Getting started button
$('#initiate').on('click', function() {
    $('#quiz-selector').removeClass('d-none');
    $('#welcome .buttons').hide();
});

// Start the quiz
$('#quiz-start').on('click', function() {
    $('#quiz-intro').addClass('d-none');
    $('#quiz-body').removeClass('d-none');

    play();
});

// Multiple Choice Answers
$('.btn-multiple').on('click', function() {
    // clearInterval(timer);
    $('.btn-multiple').prop('disabled', true);
    if ( this.value === apiResponse.results[currentIndex].correct_answer ) {
        setCorrectAnswer($(this), 'multiple');
    } else {
        setIncorrectAnswer($(this), 'multiple');
    }
    updateProgress();
    nextQuestion();
});

// True / False Answers
$('.btn-boolean').on('click', function() {
    // clearInterval(timer);
    $('.btn-boolean').prop('disabled', true);
    if ( this.value === apiResponse.results[currentIndex].correct_answer ) {
        setCorrectAnswer($(this), 'boolean');
    } else {
        setIncorrectAnswer($(this), 'boolean');
    }
    updateProgress();
    nextQuestion();
});

// Starting a new quiz
$('#new-quiz').on('click', function() {
    reset();
    $('#quiz-selector').show();
    hideResults();
});

// Retake same quiz
$('#retake-quiz').on('click', function () {
    hideResults();
    resetCounters();
    $('#quiz-body').removeClass('d-none');
    $('.progress-bar').css('width', '5%').text('0/' + userInput.questions);
    play();
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
*/
// Basic setup for quiz
function initiate() {
    // Get User Input
    userInput.questions = $('#amount').val();
    userInput.category = categories[ $('#category').val() ];
    userInput.difficulty = difficulties[ $('#difficulty').val() ];
    userInput.type = types[ $('#type').val() ];
    questionsRemaining = userInput.questions;

    // Display Selections
    $('.display-amount').text(userInput.questions);
    $('.display-category').text(userInput.category);
    $('.display-difficulty').text(userInput.difficulty);
    $('.display-type').text(userInput.type);

    $('#questions-remaining').text(questionsRemaining);

    // Hide the Form
    $('#quiz-selector').hide();

    // Show Quiz Start
    $('#quiz-container').removeClass('d-none');
    $('#quiz-intro').removeClass('d-none');

    // Update the progress bar
    $('.progress-bar').css('width', '5%').text('0/' + userInput.questions);
}

// Play the quiz
function play() {
    if ( questionsRemaining > 0 ) {
        iterateQuiz();
        updateQuestionsRemaining();

        timer = setInterval(function () {
            updateTimer();

            if ( counter > 10 ) {
                counter = 1;
                clearInterval(timer);
                displayAnswer(apiResponse.results[currentIndex].type);
                setTimeout(function () {
                    play();
                }, timeout);
            }

        }, 1000);
    } else {
        setTimeout(function () {
            endQuiz();
        }, timeout);
    }
}

// End the quiz
function endQuiz() {
    $('#quiz-body').addClass('d-none');
    $('#quiz-results').removeClass('d-none');
    $('.display-score').text((correctAnswers / userInput.questions) * 100 + '%');
}

// Move onto the next question
function iterateQuiz() {
    resetAnswerInput();
    $('#question-timer').text( limit );
    currentIndex = i;
    setQuestion(i);
    i++;
}

// Display a question
function setQuestion(i) {
    var questions = apiResponse.results;
    $('#quiz-question').html(questions[i].question);

    // Hide Answers Containers
    $('#multiple-container').addClass('d-none');
    $('#boolean-container').addClass('d-none');

    if ( questions[i].type === 'multiple' ) {
        // Mix up Answers
        var answers = [];
        // Must loop as to not use the actual object reference
        for ( var x = 0; x < questions[i].incorrect_answers.length; x++ ) {
            answers[x] = questions[i].incorrect_answers[x]
        }
        answers.push(questions[i].correct_answer);
        answers.sort(function(a, b){return 0.5 - Math.random()});

        $('#multiple-container button').each(function (i) {
            $(this).val(answers[i]);
            $(this).html(answers[i]);
        });

        $('#multiple-container').removeClass('d-none');
    } else {
        $('#boolean-container').removeClass('d-none');
    }
}

// Move onto the next question after one is answered
function nextQuestion() {
    clearInterval(timer);
    resetTimer();
    if ( questionsRemaining > 0 ) {
        setTimeout(function() {
            play();
        }, timeout);
    } else {
        setTimeout(function() {
            endQuiz();
        }, timeout);
    }
}

// Updates the quiz timer.
function updateTimer() {
    $('#question-timer').text( limit - counter );
    // console.log("Counter is: " + counter);
    counter++;
}

// Reset the timer
function resetTimer() {
    counter = 1;
}

// Updates the number of questions remaining display.
function updateQuestionsRemaining() {
    questionsRemaining--;
    $('#questions-remaining').text(questionsRemaining);
}

// Update the progress bar to show live results.
function updateProgress() {
    var percentage = (correctAnswers / userInput.questions) * 100;
    if ( percentage === 0 ) {
        percentage = 5;
    }
    var value = correctAnswers + '/' + userInput.questions;
    $('.progress-bar').css('width', percentage + '%').text(value)
}

// Display the correct, and incorrect answers.
function displayAnswer(type) {
    $('.btn-' + type).removeClass('btn-primary').addClass('btn-danger').prop('disabled', true);

    var correct = $('.btn-' + type + '[value="' + apiResponse.results[currentIndex].correct_answer + '"]');
    correct.removeClass('btn-danger');
    correct.addClass('btn-success');
}

// Increment and show correct answer
function setCorrectAnswer(btn, type) {
    correctAnswers++;
    btn.removeClass('btn-primary').addClass('btn-success');
}

// Show incorrect answer
function setIncorrectAnswer(btn, type) {
    btn.removeClass('btn-primary').addClass('btn-danger');

    // Show correct answers
    var correct = $('.btn-' + type + '[value="' + apiResponse.results[currentIndex].correct_answer + '"]');
    correct.removeClass('btn-primary').addClass('btn-success');
}

// Remove all styling from answer buttons
function resetAnswerInput() {
    $('.btn-multiple').prop('disabled', false)
        .removeClass('btn-success')
        .removeClass('btn-danger')
        .addClass('btn-primary');

    $('.btn-boolean').prop('disabled', false)
        .removeClass('btn-success')
        .removeClass('btn-danger')
        .addClass('btn-primary');
}

// // Reset all counter variables
function resetCounters() {
    questionsRemaining = userInput.questions;
    correctAnswers = 0;
    timer = 0;
    i = 0;
    currentIndex = 0;
    resetTimer();
}

// // Hide the final quiz results
function hideResults() {
    $('#quiz-results').addClass('d-none');
    // $('#quiz-container').addClass('d-none');
    $('#quiz-intro').addClass('d-none');
    $('#quiz-body').addClass('d-none');
}

// Reset the display and values for the quiz
function reset() {
    // Clear Quiz Settings
    $('.display-amount').text('');
    $('.display-category').text('');
    $('.display-difficulty').text('');
    $('.display-type').text('');

    $('#quiz-question').html('');

    // Hide Answers Containers
    $('#multiple-container').addClass('d-none');
    $('#boolean-container').addClass('d-none');

    $('#multiple-container button').val('').html('');

    resetCounters();

    $('#quiz-container').addClass('d-none');
    $('#quiz-body').addClass('d-none');
    $('#quiz-results').addClass('d-none');
}
