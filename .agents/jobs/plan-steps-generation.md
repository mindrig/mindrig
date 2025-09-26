# Plan Steps Generation

## Checklist

- Did you make sure the plan actually exists and the users didn't make a mistake?
- Did you make sure all the questions in the plan file are answered before proceeding to steps planning?

## Algorithm

Use the following algorithm to generate plan step files `.agents/plans/{{plan_index}}-{{plan_slug}}/{{step_index}}-{{step_slug}}.md`:

1. For each step in the plan, start with reviewing the plan brief file to understand the step's objectives and requirements.
2. Generate a brief step specification (`{{step_spec}}`) for the step based on the step description and any relevant context from the plan brief.
3. Break down the step into a series of **actionable** tasks. Each task should have a concise title (`{{task_n_title}}`), a one-sentence summary (`{{task_n_summary}}`), and a detailed description (`{{task_n_description}}`). Tasks must describe concrete execution work (e.g., running commands, editing files, moving directories) rather than additional planning. If prerequisite investigation is required, capture it as a short precursor task and follow it with the execution task it unblocks.
4. Identify any questions that need to be answered to complete the step planning.
5. Proceed to the next step, drafting, repeating 1-4 until all steps are drafted.
6. Prompt the user to answer the first unanswered question before proceeding to the next question. Identify if the user's answer is sufficient to answer the question, and if not, ask follow-up questions to clarify the answer. If the answer can address multiple questions, mark them as answered, adding corresponding answers to those questions. If the question can't be answered based on user input or the user instructs to, instead of the answer, explain why the answer is not known (starting with "TBD", i.e., "TBD: We will determine how to approach it after testing the prototype. The problem is...").
7. Wait for all the questions to be answered before proceeding to the next step. If any question is still marked as "TODO", do not proceed until it is resolved. Skip "TBD" questions.
8. For each step, document any additional notes or considerations relevant to the step in the step file. Use notes for context or assumptions, not as substitutes for actionable tasks.
9. Wait for explicit user instructions to proceed to the next job, [Plan Review](./plan-review.md).
