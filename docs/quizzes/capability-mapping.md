# Quiz — Capability mapping

Six questions on Green/Yellow/Red capability calls and how to calibrate them. Chapter: [Capability mapping](../07-strategy/capability-mapping.md).

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> A PM is scoping an LLM feature and labels everything \"yes, the model can do this.\" Why is that a risk pattern?",
      "choices": {
        "A": "It's always correct — LLMs can do anything now",
        "B": "It overlooks cost; binary \"can/can't\" is about budget",
        "C": "Most failed AI products shipped a Yellow (works with guardrails and evals) as a Green (ships reliably). Binary thinking misses that the hard work is the middle — refusal paths, human review, evals, narrow scope",
        "D": "Legal will object to binary claims"
      },
      "explain": "<p>The capability map has three colors, not two. Green ships with normal engineering hygiene; Yellow works but requires guardrails, evals, and human fallback; Red isn't reliable enough yet. Mislabeling Yellow as Green is the most common product failure pattern in LLM features.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> Which of these is Green (reliable with normal engineering hygiene) in 2025?",
      "choices": {
        "A": "Summarization of known text, tone/style rewrites, translation between major languages, extraction from well-structured documents, classification from a short label list",
        "B": "Medical diagnosis from symptom descriptions",
        "C": "Autonomous agents that take irreversible actions (sending payments, emails) without human approval",
        "D": "Long-horizon planning over days"
      },
      "explain": "<p>Green capabilities have low failure rates <em>and</em> bounded failure costs. Medical diagnosis, autonomous financial actions, and long-horizon planning are Red — not because the model is always wrong, but because the occasional confident wrong answer has an unacceptable cost. Ship Green; scope Yellow carefully; avoid building on Red.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> Why is \"factual recall on specialized domains\" (medical, legal, regulatory) Red rather than Green?",
      "choices": {
        "A": "The model simply doesn't know those domains at all",
        "B": "These domains require licensed professionals",
        "C": "API rate limits block specialized queries",
        "D": "The model is confidently and often wrong — hallucinations sound plausible in expert-adjacent language, and the error cost is high. Use retrieval from authoritative sources; never rely on training-data recall"
      },
      "explain": "<p>The failure mode is confident plausibility. A hallucinated medical dosage or legal citation looks just like a correct one. RAG from an authoritative source is the only responsible pattern — and even then, expert review is usually required before the output reaches a user.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> A benchmark shows a new model scoring 10 points higher than the one you're using. What does that tell you about <em>your</em> feature's quality?",
      "choices": {
        "A": "It will definitely improve by 10 points on your feature",
        "B": "It predicts performance on your feature only insofar as your feature looks like the benchmark — build a 50-example eval set on your actual task and re-measure",
        "C": "It's irrelevant information",
        "D": "Benchmark scores are the only signal worth trusting"
      },
      "explain": "<p>Benchmarks are filters, not predictions. They tell you which models deserve a closer look — but the only number that tells you what your users will experience is the score on your own eval set. Run 2–3 candidate models on 50 representative cases from your actual workload.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> What's the right way to plan for capabilities that will \"probably get better soon\"?",
      "choices": {
        "A": "Ship now and assume the model will close the gap post-launch",
        "B": "Wait indefinitely until the capability is clearly Green",
        "C": "Build the product architecture around a Yellow baseline (guardrails, evals, human fallbacks) so you can relax them as reliability grows — and re-run evals after major model releases to detect quality jumps",
        "D": "Write a prompt that tells the model to try harder"
      },
      "explain": "<p>Don't bet the roadmap on \"it'll get better.\" But do build architecture that can benefit when it does: guardrails can be loosened, human review can be sampled rather than required, tools can expand in scope. Keep prompts and tools stable so model upgrades mostly just improve quality without code rewrites.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> Before specing an LLM feature, which of these questions is most useful to answer first?",
      "choices": {
        "A": "What's the failure cost? If the model gets 5% of cases wrong, what happens — reversible annoyance, embarrassment, legal exposure, real user harm?",
        "B": "What's the model's accuracy on MMLU?",
        "C": "Which vendor has the cheapest tokens?",
        "D": "Should we self-host?"
      },
      "explain": "<p>Failure cost drives the design. Reversible failures on low-stakes features can ship at Yellow with basic refusal paths. High-stakes failures (medical, legal, financial, privacy-sensitive) may require Red → wait or build with expert-in-the-loop. Cost, hosting, and model choice are downstream of this question.</p>"
    }
  ]
}
</script>
