# Mind Control Code

Mind Control Code is an editor companion that helps to work on, test (in a playground and using evals) defined in source code. Right now it's in progress, so now all features planned are implemented.

## Project Structure

This is a monorepo with the following packages:

### [`vscode`](./vscode/)

VS Code extension that adds Mind Control Code panel with AI playground.

**Stack:**

- TypeScript
- React 18
- Vite (build tool)
- Tailwind CSS
- VS Code Extension API
- Vitest (unit testing)
- vscode-test (extension integration tests)

## Development Plan

- [ ] MVP with playground for prompts defined in source code
- [ ] Prompts explorer that allows to find all prompts and quickly navigate
- [ ] Prompt evals to automatically test project prompts

# Claude Code Instructions

## React Component Code Style

Use the following pattern for React components:

```tsx
export namespace ComponentName {
  export interface Props {
    // Component props interface
  }
}

export function ComponentName(props: ComponentName.Props) {
  const {
    /* Destructure props here */
  } = props;

  return <div>...</div>;
}
```

**Simplification rules:**

- If component has no props, omit the Props interface and namespace
- If props are not destructured, omit the destructuring assignment
- Only include what is actually needed

```tsx
// Simple component with no props
export function SimpleComponent() {
  return <div>Simple content</div>;
}
```

This approach provides:

- Clear namespace organization when needed
- Type safety with props interface
- Consistent destructuring pattern
- Explicit function component definition
- Minimal boilerplate for simple cases

## Code Formatting

- Use Prettier with default settings (configured in [`.prettierrc`](./.prettierrc))
- When executing multi-step plans, format code once after the entire plan is executed rather than on each individual step
- This improves efficiency and reduces unnecessary intermediate formatting operations
- Always run `pnpm run format` after completing a plan to ensure consistent code formatting across the entire codebase

## CLAUDE.md Style

### Markdown Code Style

- Use links for file references instead of plain text
- Example: [`package.json`](./package.json) instead of `package.json`
- This makes files clickable and easier to navigate in IDEs

### Task Lists

- Use checkbox syntax for tasks and future plans: `- [ ]` for incomplete, `- [x]` for completed
- This provides clear visual status and allows for easy tracking of progress

### Content Guidelines

- When adding new instructions, ensure they are not redundant with existing content
- Check that new guidelines do not contradict previous instructions
- Keep examples consistent with established patterns and naming conventions
- Remove or update conflicting information when making changes
