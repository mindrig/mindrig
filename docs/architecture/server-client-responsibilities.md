# Server-Client Responsibilities

This document defines when to handle certain events or data processing on the server (i.e., VS Code extension backend) and when on the client (i.e., VS Code extension webview).

## Context

Mind Rig might look like a traditional SPA where UI is solely driven by the frontend and the backend plays the role of persistence layer. In such a web app, events come from the user input or browser events. However, most of the Mind Rig events that drive UI are happening on the backend.

For example, when a user changes a file's content or pulls changes from the repository, the events come to the extension backend. An attempt to stick to the traditional API architecture will meet the following issues:

1. **State desynchronization**: The extension sends state fragments individually through the messages, so active file changes and prompts' parse results will arrive individually, causing rendering from an incomplete state. Moreover, neither VS Code nor [`window.postMessage`](https://stackoverflow.com/a/7538092), used behind the scenes, guarantees delivery order.

2. **Heavyweight messages**: To resolve the state on the client, it needs complete data, leading to performance degradation due to excessive serialization/deserialization and increased memory consumption. It becomes more of a problem when dealing with large source files or datasets.

3. **Webview initialization delay**. The server state will be ready _before_ the webview is ready to accept it, adding complexity to the state fragments delivery. Furthermore, [VS Code recommends using `setState`/`getState` instead of `retainContextWhenHidden`](https://code.visualstudio.com/api/extension-guides/webview#getstate-and-setstate), essentially making webview unload and initialize multiple times per session.

Moving a significant part of UI state calculations to the server addresses all these issues, making the UI more responsive and consistent.

## Server Responsibilities

- **Resolve playground state**: After receiving an editor update, e.g., file save or content update, the server resolves the list of prompts for the prompt picker, the selected prompt, pin status, and file info. It sends it as a unified message to the webview.

## Client Responsibilities

- **Form management**: Handle user input (i.e., model selection or settings update), validate, and persist the form state.

- **Routing**: React to user actions, perform, and persist navigation state.

- **Requesting state**: When initializing, request state through messages.
