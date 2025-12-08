This is a VS Code extension that helps to test prompts against different models and values right in the editor. The workflow looks like this: developers open source code, focus a prompt and use playground rendered in a webview, to test it. They can select matrix of models and variables to test prompts comparing results side by side.

It is monorepo with packages in ./pkgs and ./subs/\*/pkgs. It mixes TypeScript (most of the code) and Rust (for performance critical parts like code & prompts parsing).

TypeScript stack is pnpm, Vite, Vitest, React, Tailwind.
