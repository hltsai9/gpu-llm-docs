# Quiz — Evaluation that works

Six questions on building evals that turn LLM demos into production features. Chapter: [Evaluation that works](../06-building/evals.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> Why doesn't classical unit testing translate directly to LLM features?",
      "choices": {
        "A": "LLMs run too slowly for unit tests",
        "B": "LLMs are trained in a sandbox and lose their skills outside it",
        "C": "LLMs aren't deterministic even at temperature=0, most inputs have no single correct answer, behavior drifts as models update, and failure modes (a confident hallucination) are silent rather than exceptions",
        "D": "Providers forbid automated testing"
      },
      "explain": "<p>Classical tests check deterministic outcomes against fixed inputs. LLM features need a different discipline — closer to integration tests against a flaky external service whose behavior evolves, combined with search-style quality metrics. That's why evals aren't \"just tests.\"</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> What is a \"golden dataset\" in eval practice?",
      "choices": {
        "A": "A leaderboard benchmark like MMLU",
        "B": "A curated set of 50–200 representative inputs with known-good outputs, version-controlled, run before any model or prompt change to measure accuracy, quality, cost, and latency",
        "C": "The set of all production requests",
        "D": "A dataset from OpenAI's evals library"
      },
      "explain": "<p>A golden set is the regression-test suite for LLM features. You grow it from real traffic, bug reports, edge cases, and adversarial inputs. Run it on every prompt/model change. Keep it versioned, balanced, and periodically audited — its quality directly determines how reliable your \"it's shipping\" decision is.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> When using another LLM as a judge to grade subjective outputs (summaries, rewrites), what's a common bias to control for?",
      "choices": {
        "A": "Judges always prefer negative outputs",
        "B": "Judges only work on classification tasks",
        "C": "Judges can't be used for multi-turn conversations",
        "D": "Position bias (preferring A over B when shown A-vs-B), verbosity bias (preferring longer answers), and self-preference (a model rating its own output higher). Randomize order, control for length, use a different model as judge"
      },
      "explain": "<p>LLM-as-judge works surprisingly well but has systematic biases. Position bias can be mitigated by randomizing the order of compared outputs; verbosity bias by setting explicit length criteria; self-preference by choosing a different model family as the judge. Validate the judge against a small human-graded sample to check calibration.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> Which of these should be <em>rule-based</em> checks before you reach for LLM-as-judge?",
      "choices": {
        "A": "Format compliance (valid JSON? matches schema?), substring requirements, forbidden-phrase scans, length bounds, citation accuracy (are all cited sources present?)",
        "B": "Overall answer quality",
        "C": "Tone assessment",
        "D": "Whether the answer is \"helpful\""
      },
      "explain": "<p>Rules are fast, deterministic, and free. Use them as the first layer: did the output parse as JSON? Does it contain the required fields? Does it avoid forbidden phrases? LLM-as-judge handles the subjective part rules can't capture — but running both is cheaper and more reliable than judging everything.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> A team has a RAG system. What's a useful <em>retrieval</em> metric (as opposed to answer quality)?",
      "choices": {
        "A": "BLEU score on the final answer",
        "B": "Temperature sensitivity",
        "C": "Recall@K: fraction of queries where the correct chunk is in the top K retrieved chunks — directly measures whether retrieval is surfacing the right source",
        "D": "Total tokens generated"
      },
      "explain": "<p>RAG needs evals at two levels. Retrieval quality (Recall@K, MRR, NDCG) measures whether you retrieved the right documents. Answer quality (faithfulness, correctness, citation accuracy) measures whether the model used them correctly. Many RAG failures are retrieval failures hidden behind plausible-sounding answers.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> Why is a \"red-team set\" valuable, and what should it grow over time?",
      "choices": {
        "A": "It's a legal document required for deployment",
        "B": "It captures deliberately adversarial inputs — prompt injections, jailbreaks, data-leakage attempts, tool-abuse patterns — so new attacks can be added as they emerge and you can measure defense rate before each deploy",
        "C": "It's an alternative training dataset",
        "D": "It replaces the golden set"
      },
      "explain": "<p>Red-team sets are a separate axis from quality evals: they measure whether the feature resists misuse. New adversarial patterns appear monthly; maintaining a growing red-team set and running it pre-deploy makes security posture measurable rather than aspirational.</p>"
    }
  ]
}
</script>
