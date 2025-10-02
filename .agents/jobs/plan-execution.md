# Plan Execution

## Checklist

- Did you make sure the plan actually exists and the users didn't make a mistake?
- Did you make sure all the questions in the plan and step files are answered before proceeding to actual execution?
- After completing a step, did you update the plan file to reflect its completion status?

## Algorithm

Use the following steps to execute the plan:

1. Read the specified plan file `.agents/plans/{{plan_index}}-{{plan_slug}}/000-plan.md` to understand the steps and objectives.
2. Take the first uncompleted step from the plan file's TODO list.
3. Read the step file `.agents/plans/{{plan_index}}-{{plan_slug}}/{{step_index}}-{{step_slug}}.md` to understand the specific actions required.
4. Take the first uncompleted step task from the step file's Tasks section.
5. Execute the step task, making the necessary changes to the codebase (including editing files, running commands, updating configs, or moving assets) as specified. Prefer applying changes immediately rather than describing how they would be done.
6. Update the step task's TODO item to reflect its completion status:
   - Immediately toggle the corresponding checkbox in BOTH the plan root file (`000-plan.md`) and the current step file.
   - If partially complete, leave the checkbox unchecked and add a one‑line note describing what remains.
7. If the step task cannot be completed due to an issue or blocker, document the problem in the plan step file Issues section and only proceed to the next task if it is not blocked. If it's blocked and no further step tasks can be done, stop and prompt for the user input on how to proceed. Identify if the user's answer is sufficient to address the issue, and if not, ask follow-up questions to clarify the answer. If the answer can address multiple issues, mark them as resolved, adding corresponding notes to those issues. If the issue can't be resolved based on user input or the user instructs to, instead of the resolution, explain why the issue is not resolved (starting with "TBD", i.e., "TBD: We will determine how to approach it after testing the prototype. The problem is...").
8. If, during the step task execution, new information or requirements arise that necessitate changes to the plan, document these changes in the relevant plan or step file Questions section. Prompt the user to answer any remaining questions before proceeding. Identify if the user's answer is sufficient to answer the question, and if not, ask follow-up questions to clarify the answer. If the answer can address multiple questions, mark them as answered, adding corresponding answers to those questions. If the question can't be answered based on user input or the user instructs to, instead of the answer, explain why the answer is not known (starting with "TBD", i.e., "TBD: We will determine how to approach it after testing the prototype. The problem is...").
9. Briefly document follow-up instructions that contradict or extend the plan in the plan file's `## Follow-Ups` section; skip minor wording tweaks and implementation trivia. Add related ADR notes in step files when relevant.
10. If during the step task execution any architectural decisions or deviations from the original plan occur, document these in the relevant plan or step file ADRs section.
11. Repeat algorithm steps 2-10 until all step tasks are completed.
12. Once all step tasks are completed, update the plan root file to reflect the step as completed in the Plan section and add a brief note summarizing what shipped to the corresponding step Status section. Describe what is deferred, and any links to Issues.
    12a. Do not proceed to the next step until these Markdown updates are applied.
13. If there's nothing awaiting for the user input, i.e. there's no unaddressed Questions or Issues, then commit changes (unless on `main` branch) following instructions in [Committing Changes](#committing-changes) section. If there's something awaiting for the user input, stop and prompt for the user input before proceeding.
14. Unless the user explicitly is instructed to wait between steps (e.g. "...wait for my input after each step..."), immediately proceed to the next plan step and repeat from step 2.
15. Once all steps in the plan are completed, inform the user that the plan execution is complete, clean up artifacts as applicable, and await further instructions.

## ADRs

If during a step execution you made any architectural decisions, i.e. when you presented with few alternatives and you picked one, document it in the step file ADRs section using the following template:

```md
## ADRs

### {{adr_n_title}}

{{adr_n_description}}

#### Options

- {{option_n_title}}: {{option_n_description}}

{{remaining_options}}

#### Decision

{{adr_n_decision}}
```

Where:

- `{{adr_n_title}}`: A concise title for the architectural decision.
- `{{adr_n_description}}`: A description of the architectural decision context.
- `{{option_n_title}}`: A short, descriptive option title.
- `{{option_n_description}}`: A concise, descriptive summary of the option with pros and cons.
- `{{remaining_options}}`: Repeat the `- {{option_n_title}}: {{option_n_description}}` line for each option considered.
- `{{adr_n_decision}}`: A summary of the chosen option and the rationale behind the decision.

## Follow-Ups

After initial plan execution, if the user requests additional changes or clarifications that extend or modify the original plan, treat these as follow-up tasks. Document them in the `## Follow-Ups` section of the relevant plan file. Use this template:

```md
## Follow-Ups

### {{follow_up_n_title}}

{{follow_up_n_description}}

#### Follow-Up Tasks

- [ ] {{follow_up_n_step_m_title}}: {{follow_up_n_step_m_brief}}

{{remaining_follow_up_n_steps_todos}}

#### Prompt

{{follow_up_n_user_prompt}}
```

Where:

- `{{follow_up_n_title}}`: A concise title for the follow-up task.
- `{{follow_up_n_description}}`: A description of the follow-up task.
- `{{follow_up_n_step_m_title}}`: A concise title for each step in the follow-up task.
- `{{follow_up_n_step_m_brief}}`: A brief description of each step in the follow-up task.
- `{{remaining_follow_up_n_steps_todos}}`: Repeat the `- [ ] {{follow_up_n_step_m_title}}: {{follow_up_n_step_m_brief}}` line for each step in the follow-up task.
- `{{follow_up_n_user_prompt}}`: The original user instructions that prompted the follow-up task. Try to keep it verbatim, except for fixing typos, grammar, punctuation, and formatting for clarity.

When executing follow-up tasks, make sure to check completed TODOs in the corresponding follow-up section in the plan file.

## Committing Changes

Unless you're on `main` branch, commit changes after each individual step completion (not a task or a follow-up!) with a message following this format:

```
Execute {{plan_index}}-{{plan_slug}}/{{step_index}}

{{step_change_summary}}
```

Where:

- `{{plan_index}}`: current plan index (e.g., 001, 002, etc.).
- `{{plan_slug}}`: current plan slug (e.g., `auth`).
- `{{step_index}}`: executed step index (e.g., 001, 002, etc.).
- `{{step_summary}}`: executed step summary from the plan file's #plan section.
