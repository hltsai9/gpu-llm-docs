# Tool use and agents

Tool use — letting the model call functions in your code — is the mechanism that turns a chatbot into an application. Combined with a loop, it turns an application into an agent. Both are more powerful than text generation alone and more dangerous than most teams plan for.

## Tool use: the mechanics

A "tool" is a function you declare to the model: a name, a description, and a schema for its arguments. When the model decides the tool would be useful, instead of producing text, it produces a structured call.

```python
tools = [
    {
        "name": "get_weather",
        "description": "Get the current weather for a city.",
        "input_schema": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "City name"},
                "units": {"type": "string", "enum": ["C", "F"]},
            },
            "required": ["city"],
        },
    }
]

response = client.messages.create(
    model="claude-sonnet-4-6",
    tools=tools,
    messages=[{"role": "user", "content": "What's the weather in Taipei?"}],
)

# response.content might be:
# [{"type": "tool_use", "name": "get_weather", "input": {"city": "Taipei", "units": "C"}}]
```

You then:

1. Execute the tool (call your actual weather API).
2. Append the result to the message history with role `tool` (or `tool_result`, depending on provider).
3. Call the model again. Now it has the tool's output and can respond to the user.

<div class="analogy" markdown>
Tool use is a reliable handshake. Without it, if you ask the model "what's the weather?", it makes something up — there's no weather API in its head. With tools, the model says "I don't know, but please call the weather tool with `city=Taipei`," your code calls the real API, hands the result back, and the model presents it.
</div>

## Why this is different from "parse the output and call a function"

Tool use is structurally reliable in a way ad-hoc parsing isn't:

- **The schema is enforced.** The model can't produce arguments that don't match your types.
- **The model knows when not to call.** If the question doesn't need a tool, it just answers.
- **Multiple tools compose.** The model picks the right one (or none).
- **Retries and validation work cleanly.** If the call fails, you can return the error as a tool result and the model will often correct itself.

Building this on top of "parse the response and see if it mentions a function" works in demos and breaks in production.

## Tool design: the part people undercook

Tools are part of your prompt. Their names and descriptions are read by the model every time. A well-designed tool:

- **Has a name that describes the action.** `get_weather`, not `weather_tool_v2`.
- **Has a short, concrete description.** "Get the current weather for a city. Use when the user asks about weather conditions or temperature."
- **Has strict argument types.** Enums, string patterns, and required fields. The looser the schema, the more the model has to guess.
- **Returns structured results.** JSON the model can parse. Human-readable is fine; machine-readable is better.
- **Has a budget.** Rate limit it, cost-limit it, size-limit the output.

**Bad tool design:**

- A single `execute_sql` tool with no constraints. The model will write arbitrary queries and you'll have no defense.
- A `search_web` tool that returns 10KB of HTML. The model's context fills up instantly.
- Tools whose descriptions overlap ("`get_user_info`" and "`fetch_user_data`"). The model will pick inconsistently.

## The agent loop

An **agent** is a program that lets the model call tools, observe their results, and call more tools, until it decides it's done.

Minimal loop:

```python
messages = [{"role": "user", "content": user_query}]
for step in range(MAX_STEPS):
    response = client.messages.create(model=MODEL, tools=tools, messages=messages)

    # Model responded with text → done
    if response.stop_reason == "end_turn":
        return response.content

    # Model called a tool → execute, append result, continue loop
    for block in response.content:
        if block.type == "tool_use":
            result = run_tool(block.name, block.input)
            messages.append({"role": "assistant", "content": response.content})
            messages.append({"role": "user", "content": [{
                "type": "tool_result",
                "tool_use_id": block.id,
                "content": result,
            }]})

raise RuntimeError("Agent didn't complete within MAX_STEPS")
```

That's it. Most "agent frameworks" are this loop with extra decorations — memory layers, multi-agent routing, planning phases. All of those are worth considering, but the primitive is small.

## What can go wrong

### Infinite loops

The model keeps calling tools that don't make progress. Defenses:

- **`MAX_STEPS` cap.** Absolute. Usually 10–20 for production.
- **Step budget.** Track tokens or cost; abort when a threshold is hit.
- **Progress detection.** If the last 3 tool calls are identical, abort.
- **Decreasing-budget prompt.** At step 5, tell the model "you have 3 tool calls remaining — focus."

### Tool failures

The tool returns an error. The model often handles this gracefully if you:

- Return the error *as a tool result*, not as an exception.
- Include the error message verbatim (hides nothing).
- If the tool is rate-limited, tell the model — it can back off.

### Hallucinated tool calls

The model calls a tool that doesn't exist, or with arguments that don't match the schema. Rare with modern models, but catch it:

- Validate the tool name against your list; if unknown, return an error.
- Let the provider's schema validation reject bad arguments.
- On repeated failures, inject a correction message and try once more.

### Prompt injection via tool results

If a tool returns user-influenced content (a fetched webpage, a document, an email), that content can contain instructions that the model may follow.

**Mitigation principles:**

- **Treat tool output as untrusted.** Don't let it change the model's goal.
- **Sandbox tools.** A `send_email` tool should require a whitelisted domain or a user approval. Not "here's SMTP; do what you want."
- **Separate capability tools from information tools.** Reading information (web fetch, doc search) vs. taking action (send email, make payment). Agent loops should be more constrained when actions are involved.
- **Human-in-the-loop for high-stakes actions.** Always.

### Cost explosions

An agent with unlimited tool budget can spend real money fast. Caps:

- **Per-agent token budget.** Hard cap.
- **Per-tool-call limit.** A web search that returns 100KB is usually a misuse.
- **Downstream cost caps.** If the agent uses a paid API (maps, search, weather), rate-limit per user.

One horror story you don't want to become: an agent in a loop calling a paid API 10,000 times and generating a five-figure invoice overnight.

## Agent patterns

Beyond the basic loop, a few patterns are worth knowing:

### ReAct (Reason + Act)

Classic pattern: the model alternates between "thought" text and tool calls. Works especially well for exploratory tasks. Most modern agent frameworks default to this.

### Plan-then-execute

Have the model produce a plan as a first step (list of sub-tasks), then execute each in sequence. Easier to audit, often more reliable for complex tasks.

### Multi-agent

Multiple specialized agents (a planner, a researcher, a critic), orchestrated by a coordinator. Sometimes helps for very complex workflows; often is overkill.

### Router

An initial model call classifies the query and routes to a specialized agent or workflow. Good when you have heterogeneous inputs (support, sales, billing, etc.).

## Agents vs. workflows

Not everything that looks "agentic" should be. A **workflow** is a fixed sequence of steps; an **agent** is a loop that decides what to do next.

Workflows are cheaper, more reliable, and easier to reason about. Use them when:

- The steps are known in advance.
- Error modes are bounded.
- The task doesn't branch meaningfully.

Agents are justified when:

- The path depends on intermediate results.
- Novel queries need novel combinations of tools.
- The flexibility is worth the unpredictability.

Most teams start with "we need an agent" and end up with "actually we needed a well-designed workflow with one LLM call for the tricky step."

## Evaluation

Agent evals are harder than single-turn evals because there are more paths. Focus:

- **End-to-end task success.** Did the agent achieve the user's goal? (Binary is fine; "mostly" is not.)
- **Number of steps.** A well-trained agent is efficient. Monitor for regressions where it takes 15 steps instead of 3.
- **Tool usage correctness.** Did it use the right tool, with the right arguments?
- **Cost per task.** Dollars and tokens per successful completion.
- **Tail behavior.** Sample failed tasks manually and find the failure pattern.

See [evals](evals.md).

## Common mistakes

- **Unconstrained tools.** Especially SQL, shell, or code execution. Scope everything.
- **No step cap.** Your first runaway loop will teach you.
- **Trusting tool output.** Retrieved text, fetched pages, file contents — all user-influenceable.
- **Too many tools.** 15 tools confuses the model. Start with 3–5; grow only when needed.
- **Forgetting to include the tool result in the next message.** The model then hallucinates what happened.
- **Agentic sprawl.** "Should this be an agent?" Usually the answer is "no, a workflow."

## In one sentence

Tool use is structured function calling; an agent is tool use in a loop — both are powerful, both fail in predictable ways (injection, loops, cost blowups), and both need explicit budgets, sandboxed tools, and human oversight for any consequential action.

Next: [Evaluation that works →](evals.md)
