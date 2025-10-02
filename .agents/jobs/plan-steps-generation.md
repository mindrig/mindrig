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

## Details

### Step File Template

Use user instructions with any additional context from the plan file and generate step files using the following template:

```md
# {{step_title}}

## Brief

{{step_brief}}

## Tasks

- [ ] {{task_n_title}}: {{task_n_summary}}

{{remaining_tasks_todos}}

### {{task_n_title}}

{{task_n_description}}

#### Notes

{{task_n_notes}}

{{remaining_tasks_sections}}

## Questions

### {{question_n_title}}

{{question_n_details}}

#### Answer

{{question_n_answer}}

## Notes

{{step_notes}}

## ADRs

None.
```

Where:

- `{{step_title}}`: The title of the step, corresponding to the step title in the plan file Steps TODO list.
- `{{step_brief}}`: A brief specification of the step, summarizing its objectives and requirements.
- `{{task_n_title}}`: A short, descriptive title of the task.
- `{{task_n_summary}}`: A one-sentence summary of the task.
- `{{task_n_description}}`: A detailed description of the task, outlining the specific actions to be taken.
- `{{task_n_notes}}`: Any additional notes or context relevant to the task.
- `{{question_n_title}}`: A concise title for each question that needs to be answered to complete the step planning.
- `{{question_n_details}}`: A detailed description of the question, providing context and any relevant information.
- `{{question_n_answer}}`: The answer to the question, based on user input or explanations if the answer is not known.
- `{{step_notes}}`: Any additional notes or considerations relevant to the step.

Fill in ADRs section only during the execution job, use "None." as a placeholder.
