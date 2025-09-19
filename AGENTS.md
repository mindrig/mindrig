# Agents

Depending on the user instructions determine the job to be done and delegate the user request to one of the defined agents. Apply specialist agent instructions if the job is within its responsibilities, ignore any other agent instructions. Always follow the instructions in this document first. Carefully follow the specialist agent instructions.

If user explicitly requests a job listed assigned to a specialist agent or you identify the job as within the agent's responsibilities, delegate the request to that agent even if you think you can do it yourself. Read and follow linked agent instructions. If the agent instructions require you to wait for user confirmation or input before proceeding with execution or to a next stage, do so. Follow the instructions exactly as written, e.g. when delegating to the [Planner Agent](./agents/planner.md), do not start any execution work until the user explicitly approves moving forward.

Identify the job to be done based on the user instructions and context of previous interactions. Follow the specialist agent instructions exactly as written. Ignore any other job instructions. Proceed to the next job or delegate to another agent only if the instructions or user explicitly allow or require you to do so.

## Specialist Agents

- [Planner Agent](./agents/planner.md) responsible for creating detailed plans based on user instructions. It can do following jobs:
  1. [Plan Generation](./agents/planner.md#plan-generation): Create a new plan based on user instructions. It breaks down the plan into a series of steps and identifies any questions that need to be answered in order to complete the plan.
  2. [Steps Planning](./agents/planner.md#steps-planning): Plan each step in detail, breaking it down into a series of tasks and identifying any questions that need to be answered in order to complete the step planning.
  3. [Plan Review](./agents/planner.md#plan-review): Review the entire plan and its steps to ensure clarity, completeness, and consistency. Identify any gaps or areas that need further clarification and refine the plan as needed.
- [Executor Agent](./agents/executor.md) responsible for executing the plans created by the [Planner Agent](./agents/planner.md). When delegated, it must perform the concrete changes the plan describes (code edits, moves, command runs, etc.), updating plan artifacts only to record progress or issues discovered during execution.
- Fixer responsible for jobs that other agent can't do. Refer to it only if the job is outside the responsibilities of other agents.

When delegating the user request to a specialist agent, provide the full context of the user instructions and any relevant context from previous interactions.

Be explicit to the user which agent is currently handling their request.

- Did the user request planning or reference Planner docs? If yes, stop and invoke the Planner Agent.
- Has the Planner finished Plan Generation, Steps Planning, and Plan Review (or the user explicitly accepted an earlier stopping point)? If not, do not execute.
- Has the user explicitly delegated execution to the Executor Agent (or otherwise approved moving forward)? If not, keep waiting.
- Before hand-off, verify the plan tasks are actionable. If steps only describe further planning (e.g., "design move matrix" without the actual move), route back to the Planner Agent or ask the user to refine the plan.
