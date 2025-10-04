# Assess Current Webview State

## Brief

Catalog the existing screens, state containers, and persistence mechanisms in the VS Code webview so we understand which user inputs must survive navigation changes.

## Tasks

- [ ] Inventory entry layout and routing points: Trace `App.tsx` and related layout components to document how the index view is composed today.
- [ ] Audit state providers and hooks: Map the stores, contexts, and reducers that drive prompt playground data, including selected data sources, variables, and CSV selection.
- [ ] Review current persistence logic: Identify where local storage or extension messaging already saves or restores state, noting coverage gaps.
- [ ] Summarize preservation requirements: Produce a short doc outlining which fields must persist across route changes and which modules own them.

### Inventory entry layout and routing points

Open `pkgs/vsc-webview/src/app/App.tsx` and any imported layout or shell components to record how the main screen renders, capturing opportunities to introduce hash routing boundaries.

#### Notes

Focus on structural understanding; no code changes yet.

### Audit state providers and hooks

Inspect the hooks and providers under `pkgs/vsc-webview/src` (e.g., context files, Zustand stores) to list the exact pieces of user-editable state that need persistence.

#### Notes

Document findings inline in the step notes or in a scratch file for later reference.

### Review current persistence logic

Search for local storage usage and message handlers that sync prompt state; note what triggers saves, what keys are used, and any missing data.

#### Notes

Use `rg "localStorage" pkgs/vsc-webview/src` or similar to locate relevant code.

### Summarize preservation requirements

Compile a concise summary (bullet list) of all data that must persist and the gaps to address in later steps; store it in this step file or a linked doc for execution reference.

#### Notes

Keep the summary close at hand for execution; it will inform later tasks.

## Questions

None.

## Notes

Capture any VS Code messaging constraints encountered so later steps can account for them.

## ADRs

None.
