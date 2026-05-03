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
        "A": "It's always correct — LLMs can do anything now, making binary framing an oversimplification of what's true",
        "B": "It overlooks cost and SLA risk: binary \"can/can't\" ignores budget constraints and operational trade-offs in practice",
        "C": "Most failed products shipped Yellow as Green. Binary misses the hard middle: guardrails, evals, human review, scope",
        "D": "Legal will object to binary claims, requiring risk disclaimers and compliance review on all shipped capabilities"
      },
      "explain": "<p>The capability map has three colors, not two. Green ships with normal engineering hygiene; Yellow works but requires guardrails, evals, and human fallback; Red isn't reliable enough yet. Mislabeling Yellow as Green is the most common product failure pattern in LLM features.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> Which of these is Green (reliable with normal engineering hygiene) in 2025?",
      "choices": {
        "A": "Summarization of known text, tone rewrites, translation, structured extraction, short-list classification — all well-bounded",
        "B": "Medical diagnosis from symptoms, even with domain fine-tuning, due to plausible-sounding error liability in healthcare",
        "C": "Autonomous agents taking irreversible actions without human approval (sending money, emails, contract signatures)",
        "D": "Multi-day planning requiring consistent reasoning and state tracking across many sequential API calls and decisions"
      },
      "explain": "<p>Green capabilities have low failure rates <em>and</em> bounded failure costs. Medical diagnosis, autonomous financial actions, and long-horizon planning are Red — not because the model is always wrong, but because the occasional confident wrong answer has an unacceptable cost. Ship Green; scope Yellow carefully; avoid building on Red.</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> Why is \"factual recall on specialized domains\" (medical, legal, regulatory) Red rather than Green?",
      "choices": {
        "A": "The model never saw those domains in training and cannot learn specialized terminology from questions",
        "B": "Licensed professional requirements mean licensing laws prevent model-generated answers in these domains",
        "C": "API rate limits block specialized domain queries and prevent retrieval of authoritative reference material",
        "D": "Models are confidently wrong — hallucinations sound plausible and error cost is high. Use RAG from authoritative sources only"
      },
      "explain": "<p>The failure mode is confident plausibility. A hallucinated medical dosage or legal citation looks just like a correct one. RAG from an authoritative source is the only responsible pattern — and even then, expert review is usually required before the output reaches a user.</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q4.</strong> A benchmark shows a new model scoring 10 points higher than the one you're using. What does that tell you about <em>your</em> feature's quality?",
      "choices": {
        "A": "It will definitely improve by 10 points, assuming your task distribution exactly matches the benchmark's",
        "B": "It predicts your feature's performance only if your feature resembles the benchmark — build a 50-example eval on your actual task",
        "C": "It's mostly irrelevant; benchmark performance rarely correlates with real production success on customer features",
        "D": "Benchmark scores are the most reliable signal for evaluating model changes across your entire product roadmap"
      },
      "explain": "<p>Benchmarks are filters, not predictions. They tell you which models deserve a closer look — but the only number that tells you what your users will experience is the score on your own eval set. Run 2–3 candidate models on 50 representative cases from your actual workload.</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> What's the right way to plan for capabilities that will \"probably get better soon\"?",
      "choices": {
        "A": "Ship now and assume the model improves post-launch, planning to reduce guardrails once reliability increases",
        "B": "Wait indefinitely for the capability to become clearly Green, which may never happen on foundational features",
        "C": "Build architecture around Yellow baseline (guardrails, evals, fallbacks); relax as reliability grows; re-eval after model releases",
        "D": "Write a prompt telling the model to try harder, be careful, or focus specifically on accuracy for this feature"
      },
      "explain": "<p>Don't bet the roadmap on \"it'll get better.\" But do build architecture that can benefit when it does: guardrails can be loosened, human review can be sampled rather than required, tools can expand in scope. Keep prompts and tools stable so model upgrades mostly just improve quality without code rewrites.</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> Before specing an LLM feature, which of these questions is most useful to answer first?",
      "choices": {
        "A": "What's the failure cost? If wrong 5% of the time: reversible annoyance, embarrassment, legal exposure, or real harm?",
        "B": "What's the model's MMLU accuracy score, a standard benchmark for general knowledge and reasoning capability?",
        "C": "Which vendor offers the best pricing per token or most competitive on-demand rates for your request volume?",
        "D": "Should we self-host the model, deploy on our own infrastructure, or use a managed API endpoint?"
      },
      "explain": "<p>Failure cost drives the design. Reversible failures on low-stakes features can ship at Yellow with basic refusal paths. High-stakes failures (medical, legal, financial, privacy-sensitive) may require Red → wait or build with expert-in-the-loop. Cost, hosting, and model choice are downstream of this question.</p>"
    }
  ]
}
</script>
