# Plan Execution

## Checklist

- Did you make sure the plan actually exists and the users didn't make a mistake?
- Did you make sure all the questions in the plan and step files are answered before proceeding to actual execution?

## Algorithm

Use the following steps to execute the plan:

1. Read the specified plan file `.agents/plans/{{plan_index}}-{{plan_slug}}/000-plan.md` to understand the steps and objectives.
2. Take the first uncompleted task from the plan file's TODO list.
3. Read the plan's step file `.agents/plans/{{plan_index}}-{{plan_slug}}/{{step_index}}-{{step_slug}}.md` to understand the specific actions required.
4. Take the first uncompleted task from the step file's TODO list.
5. Execute the task, making the necessary changes to the codebase (including editing files, running commands, updating configs, or moving assets) as specified. Prefer applying changes immediately rather than describing how they would be done.
6. Update the task's TODO item to reflect its completion status:
   - Immediately toggle the corresponding checkbox in BOTH the plan root file (`000-plan.md`) and the current step file.
   - If partially complete, leave the checkbox unchecked and add a one‑line note describing what remains.
7. If the task cannot be completed due to an issue or blocker, document the problem in the plan step file "Issues" section and only proceed to the next task if it is not blocked. If it's blocked and no further tasks can be done, stop and prompt for the user input on how to proceed. Identify if the user's answer is sufficient to address the issue, and if not, ask follow-up questions to clarify the answer. If the answer can address multiple issues, mark them as resolved, adding corresponding notes to those issues. If the issue can't be resolved based on user input or the user instructs to, instead of the resolution, explain why the issue is not resolved (starting with "TBD", i.e., "TBD: We will determine how to approach it after testing the prototype. The problem is...").
8. If, during the task execution, new information or requirements arise that necessitate changes to the plan, document these changes in the relevant plan or step file Questions section. Prompt the user to answer any remaining questions before proceeding. Identify if the user's answer is sufficient to answer the question, and if not, ask follow-up questions to clarify the answer. If the answer can address multiple questions, mark them as answered, adding corresponding answers to those questions. If the question can't be answered based on user input or the user instructs to, instead of the answer, explain why the answer is not known (starting with "TBD", i.e., "TBD: We will determine how to approach it after testing the prototype. The problem is...").
9. Briefly document follow-up instructions that contradict or extend the plan in the plan file's `## Follow-Ups` section; skip minor wording tweaks and implementation trivia. Add related ADR notes in step files when relevant.
10. If during the task execution any architectural decisions or deviations from the original plan occur, document these in the relevant plan or step file ADRs section.
11. Repeat steps 2-10 until all tasks in the plan are completed.
12. Once all tasks in the plan step are completed, update the plan root file to reflect the step as completed and add a brief “Step Status” note summarizing what shipped, what is deferred, and any links to Issues.
    12a. Do not proceed to the next step until these Markdown updates are applied.
13. Unless the user is instructed to wait between steps, proceed to the next plan step and repeat from step 2.
14. Once all steps in the plan are completed, inform the user that the plan execution is complete, clean up artifacts as applicable, and await further instructions.

## Follow-Ups

After initial plan execution, if the user requests additional changes or clarifications that extend or modify the original plan, treat these as follow-up tasks. Document them in the `## Follow-Ups` section of the relevant plan file. Use this template:

```md
## Follow-Ups

### {{follow_up_n_title}}

{{follow_up_n_description}}

#### Plan

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
