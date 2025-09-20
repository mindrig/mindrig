# Agents

You're an AI agent designed to assist users in achieving their goals by following specific jobs and plans. Your primary function is to identify the job to be done based on user requests and perform it with precision.

## Terminology

- Task: a high-level goal or objective that the user wants to achieve.
- Job: a specific scope of work with clear instructions and expected outcomes. Jobs can be specific and must be followed exactly as written, or general, in which case you must do your best to fulfill the user's request.
- Plan: a structured approach to achieve a task, broken down into steps and tasks. It includes files with detailed instructions described in `agents/plans/`.
- Plan Step: a specific phase or segment of the overall plan, focusing on a particular aspect of the task. It includes files with detailed instructions describe in `agents/plans/{{plan_index}}-{{plan_slug}}/{{step_index}}-{{step_slug}}.md`.
- Performing a Job: executing the instructions and actions defined in a job description.
- Executing a Plan: carrying out the steps and tasks outlined in a plan to achieve the oucomes defined in the plan.

## Jobs To Be Done

Your goal is to identify the job to be done based on user requests and follow the specific instructions for that job. When it comes to identifying jobs or performing a specific job, your top priority is precision in following the instructions exactly as written.

When user asks you to do something, your first task is to identify the job to be done, picking one or multiple from the list of specific jobs below:

- [Plan Generation](./agents/jobs/plan-generation.md), i.e. when the user explicitly asks to "create a plan for...", "make a plan...", "plan ...", or similar. It is important to note that this job does not include actual execution of the plan, unless the user explicitly instructs you to do so after the plan is created, i.e. "plan and execute...", "plan and do...", or similar. The user request to generate a plan is followed by the instructions that you must research and organize into a structured plan.
- [Plan Steps Generation](./agents/jobs/plan-steps-generation.md), i.e. when the user explicitly mentions a plan file and asks to "plan the steps", "detail the steps", "plan each step", or similar. The user request to generate plan steps might be followed by additional instructions or context that you must incorporate into the step planning.
- [Plan Review](./agents/jobs/plan-review.md), i.e. when the user explicitly mentions a plan file and asks to "review the plan", "check the plan", "refine the plan", or similar. This job is only applicable if a plan file already exists, and you should not create a new plan file from scratch. You should review and refine the existing plan and its steps.
- [Plan Execution](./agents/jobs/plan-execution.md), i.e. when the user explicitly mentions a plan file, name of the file, or it can be inferred from the conversation and asks to "execute the plan", "carry out the plan", "do the plan", or similar. It is important to this request must be explicit. When user asks to plan a feature or change, do not assume they want you to execute it.

Never assume or infer jobs from the conversation. Only act on explicit user instructions that match the job descriptions above.

If one or multiple jobs above explicitly match the user request, read the linked instructions and follow them exactly as written. Ignore any other instructions in this document or context. Job instructions must take precedence over any other instructions.

If none of specific jobs fits the user request, identify the job as [Fixer](./agents/jobs/fixer.md), which is a general job, and you must do what the user asks you to do to the best of your ability.
