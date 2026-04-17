// Interactive quiz for MkDocs Material.
//
// Two rendering modes are supported on the same page:
//
// 1) JSON mode (preferred). Put a mount point next to a JSON data block:
//
//    <div class="quiz-mount"></div>
//    <script type="application/json" class="quiz-data">
//    {
//      "questions": [
//        { "answer": "B",
//          "stem": "<strong>Q1.</strong> ...",
//          "choices": { "A": "...", "B": "...", "C": "...", "D": "..." },
//          "explain": "<p>...</p>" }
//      ]
//    }
//    </script>
//
//    This sidesteps Python-Markdown's raw-HTML block parsing entirely —
//    the JSON lives inside a <script> tag whose contents are passed through
//    verbatim by the markdown engine.
//
// 2) Legacy HTML mode. Any pre-existing `.quiz` blocks with `.q[data-answer]`
//    children still work, so pages that weren't migrated are not broken.

(function () {
  "use strict";

  var CHOICE_KEYS = ["A", "B", "C", "D", "E", "F"];

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        if (k === "class") node.className = attrs[k];
        else if (k === "html") node.innerHTML = attrs[k];
        else node.setAttribute(k, attrs[k]);
      });
    }
    if (children) {
      children.forEach(function (c) {
        if (c == null) return;
        if (typeof c === "string") node.appendChild(document.createTextNode(c));
        else node.appendChild(c);
      });
    }
    return node;
  }

  function normalizeAnswer(a) {
    return (a || "").trim().toUpperCase();
  }

  // Build a single question element from a JSON object.
  function buildQuestion(qData) {
    var answer = normalizeAnswer(qData.answer);
    var qNode = el("div", { class: "q", "data-answer": answer });

    qNode.appendChild(el("p", { class: "stem", html: qData.stem || "" }));

    var choices = qData.choices || {};
    // Preserve a stable order: A, B, C, D, ... Only include keys that exist.
    CHOICE_KEYS.forEach(function (k) {
      if (Object.prototype.hasOwnProperty.call(choices, k)) {
        var btn = el("button", { "data-choice": k, type: "button" });
        btn.innerHTML = choices[k];
        qNode.appendChild(btn);
      }
    });

    if (qData.explain) {
      qNode.appendChild(el("div", { class: "explain", html: qData.explain }));
    }
    return qNode;
  }

  // Attach click handlers + score/reset UI to a `.quiz` container that already
  // has `.q[data-answer]` children populated (either from JSON or from legacy HTML).
  function wireQuiz(quiz) {
    if (quiz.dataset.initialized === "1") return;
    quiz.dataset.initialized = "1";

    var questions = quiz.querySelectorAll(".q");
    if (questions.length === 0) return;

    var score = el("div", { class: "quiz-score" });
    score.textContent = "Answered 0 / " + questions.length;
    quiz.appendChild(score);

    var answered = 0;
    var correctCount = 0;

    questions.forEach(function (q) {
      var answer = normalizeAnswer(q.dataset.answer);
      var buttons = q.querySelectorAll("button[data-choice]");

      buttons.forEach(function (btn) {
        // Ensure buttons never submit a parent form.
        btn.type = "button";
        btn.addEventListener("click", function () {
          if (q.classList.contains("done")) return;

          var chosen = normalizeAnswer(btn.dataset.choice);

          buttons.forEach(function (b) {
            b.disabled = true;
            if (normalizeAnswer(b.dataset.choice) === answer) {
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

    var reset = el("button", { type: "button", class: "quiz-reset" });
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
  }

  // Find each `.quiz-mount`, pull the nearest `<script class="quiz-data">`,
  // render the questions into the mount, and wire handlers.
  function renderJsonMounts(root) {
    var mounts = (root || document).querySelectorAll(".quiz-mount");
    mounts.forEach(function (mount) {
      // If questions are already rendered in this mount, just ensure handlers
      // are wired (wireQuiz is itself idempotent) and move on.
      if (mount.querySelector(".q")) {
        wireQuiz(mount);
        return;
      }

      // The data script is typically the immediate next sibling. Fall back to
      // any sibling within the same parent, then to a page-wide search.
      var script =
        (mount.nextElementSibling &&
          mount.nextElementSibling.matches &&
          mount.nextElementSibling.matches('script.quiz-data,script[type="application/json"].quiz-data')
          ? mount.nextElementSibling
          : null) ||
        (mount.parentElement && mount.parentElement.querySelector('script.quiz-data,script[type="application/json"].quiz-data'));

      if (!script) {
        console.warn("[quiz] No quiz-data <script> found near mount", mount);
        return;
      }

      var data;
      try {
        data = JSON.parse(script.textContent);
      } catch (e) {
        console.error("[quiz] Failed to parse quiz JSON:", e, script.textContent);
        return;
      }

      var questions = (data && data.questions) || [];
      // Promote the mount to a fully-functional `.quiz` container.
      mount.classList.add("quiz");

      questions.forEach(function (q) {
        mount.appendChild(buildQuestion(q));
      });

      // Let wireQuiz own the `initialized` flag — setting it here would make
      // wireQuiz bail out at its top and silently skip click-handler wiring.
      wireQuiz(mount);
    });
  }

  function initAll() {
    // 1) Legacy: any pre-authored `.quiz` container with inline .q children.
    document.querySelectorAll(".quiz").forEach(function (quiz) {
      // Skip mounts we will handle in step 2 — they start empty and are
      // promoted to `.quiz` by renderJsonMounts.
      if (quiz.classList.contains("quiz-mount") && quiz.children.length === 0) return;
      wireQuiz(quiz);
    });
    // 2) JSON-driven mounts.
    renderJsonMounts(document);
  }

  // Initial load.
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initAll);
  } else {
    initAll();
  }

  // Material's instant-navigation swaps page content without a full reload.
  // `document$` is an RxJS Subject exposed by the theme; subscribe to re-init.
  if (typeof window !== "undefined") {
    // Access via window to avoid ReferenceError if not present.
    var ds = window["document$"];
    if (ds && typeof ds.subscribe === "function") {
      ds.subscribe(function () {
        initAll();
      });
    }
  }
})();
