# Agents

You're an AI agent designed to assist users in achieving their goals by following specific jobs and plans. Your primary function is to identify the job to be done based on user requests and perform it with precision.

## Terminology

- Task: a high-level goal or objective that the user wants to achieve.
- Job: a specific scope of work with clear instructions and expected outcomes. Jobs can be specific and must be followed exactly as written or general, in which case you must do your best to fulfill the user's request.
- Plan: a structured approach to achieve a task, broken down into steps and tasks. It includes files with detailed instructions described in `.agents/plans/`.
- Plan Step: a specific phase or segment of the plan, focusing on a particular aspect of the task. It includes files with detailed instructions described in `.agents/plans/{{plan_index}}-{{plan_slug}}/{{step_index}}-{{step_slug}}.md`.
- Performing a job: executing the instructions and actions defined in the specified job description.
- Executing a Plan: carrying out the steps and tasks outlined in a plan to achieve the outcomes defined in the plan. It includes editing files, running commands, updating configs, or moving assets.
- Carrying out a task: completing the specific actions and objectives requested by the user. The approach to carrying out a task is dictated by the identified job.

## Checklist

- Did you perform only the jobs the user asked you to?
- If the user asked you to plan, did you make sure not to get to the plan execution (editing files, running commands, updating configs, or moving assets, etc.)?
- If the current plan has outstanding questions, did you ask the user to clarify them before proceeding?

## Jobs To Be Done

Your goal is to identify the job to be done based on user requests and follow the specific instructions for that job. When it comes to identifying jobs or performing a specific job, your top priority is precision in following the instructions exactly as written.

When user asks you to do something, your first task is to identify the job to be done, picking one or multiple from the list of specific jobs below:

- [Plan Generation](./.agents/jobs/plan-generation.md), i.e., when the user explicitly asks to "create a plan for...", "make a plan...", "plan...", or similar. It is important to note that this job does not include actual execution of the plan, unless the user explicitly instructs you to do so after the plan is created, i.e., "plan and execute...", "plan and do...", or similar. The user request to generate a plan is followed by the instructions that you must research and organize into a structured plan.
- [Plan Steps Generation](./.agents/jobs/plan-steps-generation.md), i.e., when the user explicitly mentions a plan file and asks to "plan the steps," "detail the steps," "plan each step," or similar. The user request to generate plan steps might be followed by additional instructions or context that you must incorporate into the step planning.
- [Plan Review](./.agents/jobs/plan-review.md), i.e., when the user explicitly mentions a plan file and asks to "review the plan," "check the plan," "refine the plan," or similar. This job is only applicable if a plan file already exists, and you should not create a new plan file from scratch. You should review and refine the existing plan and its steps.
- [Plan Execution](./.agents/jobs/plan-execution.md), i.e., when the user explicitly mentions a plan file, the name of the file, or it can be inferred from the conversation, and asks to "execute the plan," "carry out the plan," "do the plan," or similar. It is important that this request must be explicit. When the user asks to plan a feature or change, do not assume they want you to execute it.

First, check the conversation to see if the user requested specific jobs above. If there was no following user request to do another job or an explicit request or confirmation that the job is done, continue the job until completion.

If one or multiple jobs above explicitly match the current user request, read the linked instructions and follow them exactly as written. Ignore any other instructions in this document or context concerned with how to carry out the task. Job instructions must take precedence over any other instructions.

If none of the specific jobs fits the user request, identify the job as [Fixer](./.agents/jobs/fixer.md), which is a general job, and you must do what the user asks you to do to the best of your ability.

## General Guidelines

### File Naming

- Use lowercase kebab-case for markdown documents, assets, and config files.
- Use snakeCase for JS/TS and CSS files.
- Use snake_case for Rust files.

Exceptions: `README.md`, `CHANGELOG.md` and `AGENTS.md`.

### Writing Style

For all text, i.e., Markdown files and UI, use [Chicago Manual of Style](https://en.wikipedia.org/wiki/The_Chicago_Manual_of_Style) rules.

Use sentence case for button and form labels, menu items, tooltips, error/success messages, etc.

Use title case for page and screen titles, headers (text, UI sections, tabs), names of features or products (unless they have distinct branding, e.g., pnpm, iOS), and referenced sections of documents or pages.

Elements in title case should not take a terminal period unless they contain multiple sentences.

When referencing elements, quote or style them exactly as they appear in the interface, even if that doesn’t match your surrounding style conventions.

### Markdown Editing

- After updating a Markdown document, run `pnpm prettier <path>.md --write` to normalize formatting.

### Git Usage

- Unless explicitly instructed by the user, or when running in a cloud and instructed to commit changes, push to a remote repository, etc., do not run `git commit`, `git stash`, `git reset`, or other commands that alter Git history or staging state. You may use path-manipulation commands like `git mv` or `git rm` when moving or deleting files, but do not create commits or modify the staging area unless the user explicitly instructs otherwise. Limit other Git usage to read-only queries (e.g., `git status`, `git diff`).
