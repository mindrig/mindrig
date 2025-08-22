# Claude Code Instructions

## React Component Code Style

Use the following pattern for React components:

```tsx
import React from "react";

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

This approach provides:

- Clear namespace organization
- Type safety with props interface
- Consistent destructuring pattern
- Explicit function component definition

## Code Formatting

- Use Prettier with default settings (configured in [`.prettierrc`](./.prettierrc))
- When executing multi-step plans, format code once after the entire plan is executed rather than on each individual step
- This improves efficiency and reduces unnecessary intermediate formatting operations

## CLAUDE.md Style

### Markdown Code Style

- Use links for file references instead of plain text
- Example: [`package.json`](./package.json) instead of `package.json`
- This makes files clickable and easier to navigate in IDEs
