# Plan Generation

## Algorithm

Use the following algorithm to generate a plan file `.agents/plans/{{plan_index}}-{{plan_slug}}/000-plan.md`:

1. Generate a concise title (`{{plan_title}}`) and the brief specification (`{{brief_spec}}`) for the plan based on the user instructions. Include the document scaffold and the original user prompt (`{{user_prompt}}`) in the corresponding section. Try keeping the prompt verbatim, except for fixing typos, grammar, punctuation, and formatting for clarity.
2. Do research on the topic if needed to inform the planning process. If user instructions include any links, review them as part of the research.
3. If task is complex and can be done in distinct deliverable phases, break down the plan into multiple steps. If that's a case, break down the plan into a series of steps. Each step should have a concise title (`{{step_n_title}}`), a one-sentence summary (`{{step_n_summary}}`), and a detailed description (`{{step_n_description}}`). When doing so, also create an empty task file for each step. If the task is simple and can be done in a single phase, skip creating steps and define tasks directly in the plan file.
4. Identify any questions that need to be answered to complete the plan.
5. Prompt the user to answer the first unanswered question before proceeding to the next question. Identify if the user's answer is sufficient to answer the question, and if not, ask follow-up questions to clarify the answer. If the answer can address multiple questions, mark them as answered, adding corresponding answers to those questions. If the question can't be answered based on user input or the user instructs to, instead of the answer, explain why the answer is not known (starting with "TBD", i.e., "TBD: We will determine how to approach it after testing the prototype. The problem is...").
6. Proceed to the next question, repeating step 5 until all questions are answered.
7. Wait for all the questions to be answered before proceeding to the next step. If any question is still marked as "TODO", do not proceed until it is resolved. Skip "TBD" questions.
8. Document any additional notes or considerations relevant to the plan in the plan brief file.
9. Wait for explicit user instructions to proceed to the next job, [Plan Steps Generation](./plan-steps-generation.md).

## Details

### Plan File Structure

Use user instructions and generate plan files using the following schema:

- `.agents/plans/`: main plans directory.
- `.agents/plans/{{plan_index}}-{{plan_slug}}/`: directory for each plan.
- `.agents/plans/{{plan_index}}-{{plan_slug}}/000-plan.md`: plan brief file with the steps, TODO list linking to task files.
- `.agents/plans/{{plan_index}}-{{plan_slug}}/{{step_index}}-{{step_slug}}.md`: plan step file with step details, TODO and ongoing notes.

Where:

- `{{plan_index}}`: a zero-padded index of the plan (e.g., 001, 002, etc.).
- `{{plan_slug}}`: a short, hyphenated description of the plan (e.g., `auth`).
- `{{step_index}}`: a zero-padded index of the step within the plan (e.g., 001, 002, etc.).
- `{{step_slug}}`: a short, hyphenated description of the step (e.g., `bootstrap-auth-pkg`).

### Plan File Template

When generating a new plan, only fill out the plan brief file (`000-plan.md`) file using the following template, but do not fill out the step files yet until receiving further instructions to do so:

```md
# {{plan_title}}

## Brief

{{brief_spec}}

## Plan

- [ ] [{{step_n_title}}]({{step_n_file_path}}): {{step_n_summary}}

{{remaining_steps_todo}}

## Steps

### [{{step_n_title}}]({{step_n_file_path}})

{{step_n_description}}

{{remaining_steps_sections}}

## Questions

### {{question_n_title}}

{{question_n_details}}

#### Answer

{{question_n_answer}}

{{remaining_questions}}

## Notes

{{notes}}

## Prompt

{{user_prompt}}
```

Where:

- `{{user_prompt}}`: the original user instructions that prompted the plan generation. Try to keep it verbatim, except for fixing typos, grammar, punctuation, and formatting for clarity.
- `{{plan_title}}`: a short, descriptive title of the plan (e.g., "Auth").
- `{{brief_spec}}`: a brief specification of the task to be accomplished by the plan. Use the user instructions to inform this specification without copying verbatim. Don't include implementation details or steps here.
- `{{step_n_title}}`: a short, descriptive title of the step (e.g., "Bootstrap Auth Package").
- `{{step_n_file_path}}`: relative path to the step file (e.g., `.agents/plans/001-auth/001-bootstrap-auth-pkg.md`).
- `{{remaining_steps_todo}}`: repeat the `- [ ] [{{step_n_title}}]({{step_n_file_path}}): {{step_n_summary}}` line for each step in the plan.
- `{{step_n_summary}}`: a one-sentence summary of the step (e.g., "Set up the initial structure and configuration for the auth package").
- `{{step_n_description}}`: a detailed description of the step, including objectives, requirements, and any relevant context.
- `{{remaining_steps_sections}}`: repeat the `### [{{step_n_title}}]({{step_n_file_path}})` section for each step in the plan
- `{{question_n_title}}`: a short, descriptive title of the question (e.g., "Supported Authentication Methods").
- `{{question_n_details}}`: detailed description of the question, including context and any relevant information.
- `{{question_n_answer}}`: the documented answer to the question based on the user instructions. If the answer is not known yet, put "TODO". If the answer can't be answered based on user input or the user instructs to, instead of the answer, explain why the answer is not known (starting with "TBD", i.e., "TBD: We will determine how to approach it after testing the prototype. The problem is...").
- `{{remaining_questions}}`: repeat the `### {{question_n_title}}` section for each question in the plan.
- `{{notes}}`: any additional notes or considerations relevant to the plan. Use this section to document assumptions, constraints, or other important information.
