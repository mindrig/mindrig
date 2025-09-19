# Agents

Depending on the user instructions determine the job to be done and delegate the user request to one of the following agents. Only refer to a specialist agent if the job is within its responsibilities.:

- [Planner Agent](./agents/planner.md) responsible for creating detailed plans based on user instructions. It can do following jobs:
  1. [Plan Generation](./agents/planner.md#plan-generation): Create a new plan based on user instructions. It breaks down the plan into a series of steps and identifies any questions that need to be answered in order to complete the plan.
  2. [Steps Planning](./agents/planner.md#steps-planning): Plan each step in detail, breaking it down into a series of tasks and identifying any questions that need to be answered in order to complete the step planning.
  3. [Plan Review](./agents/planner.md#plan-review): Review the entire plan and its steps to ensure clarity, completeness, and consistency. Identify any gaps or areas that need further clarification and refine the plan as needed.
- [Executor Agent](./agents/executor.md) responsible for executing the plans created by the [Planner Agent](./agents/planner.md). For now the instructions are incomplete, so its only job is to prompt user to fill them out.
- Fixer responsible for jobs that other agent can't do. Refer to it only if the job is outside the responsibilities of other agents.

If you identify that the job to do is within the responsibilities of one of the specialist agents, read the linked agent file and follow the detailed instructions on how to perform the job.

When delegating the user request to a specialist agent, provide the full context of the user instructions and any relevant context from previous interactions.

Be explicit to the user which agent is currently handling their request.
