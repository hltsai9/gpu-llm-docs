// Simple interactive quiz for MkDocs Material.
// Structure (HTML inside .md):
//   <div class="quiz">
//     <div class="q" data-answer="B">
//       <p class="stem">...</p>
//       <button data-choice="A">...</button>
//       <button data-choice="B">...</button>
//       <div class="explain">...</div>
//     </div>
//     ...
//   </div>

function initQuizzes() {
  document.querySelectorAll(".quiz").forEach(function (quiz) {
    if (quiz.dataset.initialized === "1") return;
    quiz.dataset.initialized = "1";

    var questions = quiz.querySelectorAll(".q");
    if (questions.length === 0) return;

    var score = document.createElement("div");
    score.className = "quiz-score";
    score.textContent = "Answered 0 / " + questions.length;
    quiz.appendChild(score);

    var answered = 0;
    var correctCount = 0;

    questions.forEach(function (q) {
      var answer = (q.dataset.answer || "").trim().toUpperCase();
      var buttons = q.querySelectorAll("button[data-choice]");

      buttons.forEach(function (btn) {
        btn.type = "button";
        btn.addEventListener("click", function () {
          if (q.classList.contains("done")) return;

          var chosen = (btn.dataset.choice || "").trim().toUpperCase();

          buttons.forEach(function (b) {
            b.disabled = true;
            if ((b.dataset.choice || "").trim().toUpperCase() === answer) {
              b.classList.add("correct");
            }
          });

          if (chosen === answer) {
            btn.classList.add("chose-correct");
            correctCount += 1;
          } else {
            btn.classList.add("chose-wrong");
          }

          q.classList.add("done");
          var explain = q.querySelector(".explain");
          if (explain) explain.classList.add("show");

          answered += 1;
          if (answered < questions.length) {
            score.textContent =
              "Answered " + answered + " / " + questions.length +
              " · Correct: " + correctCount;
          } else {
            score.textContent =
              "Final score: " + correctCount + " / " + questions.length;
            score.classList.add("final");
          }
        });
      });
    });

    // "Reset" button per quiz
    var reset = document.createElement("button");
    reset.type = "button";
    reset.className = "quiz-reset";
    reset.textContent = "Reset quiz";
    reset.addEventListener("click", function () {
      answered = 0;
      correctCount = 0;
      questions.forEach(function (q) {
        q.classList.remove("done");
        q.querySelectorAll("button[data-choice]").forEach(function (b) {
          b.disabled = false;
          b.classList.remove("correct", "chose-correct", "chose-wrong");
        });
        var explain = q.querySelector(".explain");
        if (explain) explain.classList.remove("show");
      });
      score.textContent = "Answered 0 / " + questions.length;
      score.classList.remove("final");
    });
    quiz.appendChild(reset);
  });
}

// Run on page load
document.addEventListener("DOMContentLoaded", initQuizzes);

// Re-run on Material's instant-navigation (SPA-style) page changes
if (typeof document$ !== "undefined" && document$.subscribe) {
  document$.subscribe(initQuizzes);
}
