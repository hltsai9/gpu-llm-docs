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
        "A": "LLM inference is too slow to be practical in unit test suites",
        "B": "LLMs are trained in isolated sandbox environments and lose capabilities outside",
        "C": "LLMs aren't deterministic at temperature=0, most inputs lack a single...",
        "D": "Providers prohibit automated testing of their APIs"
      },
      "explain": "<p>Classical tests check deterministic outcomes against fixed inputs. LLM features need a different discipline — closer to integration tests against a flaky external service whose behavior evolves, combined with search-style quality metrics. That's why evals aren't \"just tests.\"</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> What is a \"golden dataset\" in eval practice?",
      "choices": {
        "A": "A public leaderboard benchmark dataset like MMLU",
        "B": "A curated 50–200 representative inputs with known-good...",
        "C": "The complete set of all production requests ever received",
        "D": "A pre-built dataset downloaded from OpenAI's evals library"
      },
      "explain": "<p>A golden set is the regression-test suite for LLM features. You grow it from real traffic, bug reports, edge cases, and adversarial inputs. Run it on every prompt/model change. Keep it versioned, balanced, and periodically audited — its quality directly determines how reliable your \"it's shipping\" decision is.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> When using another LLM as a judge to grade subjective outputs (summaries, rewrites), what's a common bias to control for?",
      "choices": {
        "A": "Judges systematically prefer lower-quality and negative-sentiment outputs",
        "B": "Judges are only applicable to classification and binary tasks",
        "C": "Judges cannot evaluate multi-turn conversational outputs",
        "D": "Position bias (prefer A vs B order), verbosity bias (prefer longer),..."
      },
      "explain": "<p>LLM-as-judge works surprisingly well but has systematic biases. Position bias can be mitigated by randomizing the order of compared outputs; verbosity bias by setting explicit length criteria; self-preference by choosing a different model family as the judge. Validate the judge against a small human-graded sample to check calibration.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> Which of these should be <em>rule-based</em> checks before you reach for LLM-as-judge?",
      "choices": {
        "A": "Format compliance (valid JSON, schema match), substring...",
        "B": "Overall subjective quality assessment across dimensions",
        "C": "Evaluation of the emotional tone and voice register",
        "D": "Determination of whether the answer is subjectively helpful"
      },
      "explain": "<p>Rules are fast, deterministic, and free. Use them as the first layer: did the output parse as JSON? Does it contain the required fields? Does it avoid forbidden phrases? LLM-as-judge handles the subjective part rules can't capture — but running both is cheaper and more reliable than judging everything.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> A team has a RAG system. What's a useful <em>retrieval</em> metric (as opposed to answer quality)?",
      "choices": {
        "A": "BLEU score computed on the final answer text",
        "B": "The sensitivity of model output to temperature changes",
        "C": "Recall@K: fraction of queries where correct chunk is in...",
        "D": "Total number of tokens generated in the final answer"
      },
      "explain": "<p>RAG needs evals at two levels. Retrieval quality (Recall@K, MRR, NDCG) measures whether you retrieved the right documents. Answer quality (faithfulness, correctness, citation accuracy) measures whether the model used them correctly. Many RAG failures are retrieval failures hidden behind plausible-sounding answers.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> Why is a \"red-team set\" valuable, and what should it grow over time?",
      "choices": {
        "A": "It is a mandatory legal compliance document required prior to any deployment",
        "B": "It captures adversarial inputs — prompt injections, jailbreaks,...",
        "C": "It serves as an alternative training dataset for fine-tuning models",
        "D": "It completely supersedes and replaces the golden set"
      },
      "explain": "<p>Red-team sets are a separate axis from quality evals: they measure whether the feature resists misuse. New adversarial patterns appear monthly; maintaining a growing red-team set and running it pre-deploy makes security posture measurable rather than aspirational.</p>"
    }
  ]
}
</script>
