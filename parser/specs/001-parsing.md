# Parser spec

## Overview

The Mind Control Code parser extracts prompts from TypeScript/JavaScript source code. It identifies strings that should be treated as prompts based on specific patterns and provides structured output for the VS Code extension.

## Tech

- **Oxc parser ecosystem**: High-performance JavaScript/TypeScript parser to parse and walk the tree.
  - `oxc_parser`: AST parsing.
  - `oxc_ast`: AST node types and visitor patterns
  - `oxc_span`: Source code span handling for precise text extraction.
  - `oxc_allocator`: Memory management.
- **Serde**: JSON serialization for cross-language data exchange

## Requirements

### Patterns

The parser identifies prompts using three detection patterns:

1. Variable name pattern.
2. Inline comment pattern.
3. Variable declaration comment pattern.

#### Variable name pattern

Variables containing "prompt" in their name (case-insensitive):

```ts
const userPrompt = `Hello, ${name}!`;
const GREETING_PROMPT = `Welcome ${user}`;
```

#### Inline comment pattern

Template literals with `@prompt` comment immediately before:

```ts
/* @prompt */ `Hello, ${name}!`
/* @prompt greeting */ `Welcome, ${user}!`;
```

#### Variable declaration comment pattern

Variables declared with `@prompt` comment before declaration:

```ts
/* @prompt */
const greeting = `Hello, ${name}!`;

// Multiple blank lines allowed
/* @prompt user greeting */

const message = `Welcome, ${user.name}!`;
```

### Performance

Since it is used in the editor, practically on each keystroke, the parser must be highly efficient and optimized for performance.

### Wasm-compatibility

Since the parser is compiled to WebAssembly (Wasm), the dependencies have to be compatible with the Wasm environment.

### JS-interop

The parser exposes the `parsePrompts` function that returns an array of prompt objects with all the data required to work with the prompts.
