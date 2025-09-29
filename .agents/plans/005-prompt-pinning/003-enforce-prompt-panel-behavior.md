# Enforce prompt panel behavior

## Spec

Ensure the blueprint always displays the pinned prompt source regardless of user settings, stabilize the prompt selection logic, and cover the behavior with focused tests while disabling flaky suites.

## Tasks

- [ ] [Override prompt visibility](#override-prompt-visibility): Update `pkgs/vsc-webview/src/aspects/blueprint/Blueprint.tsx` to show `PromptSource` whenever a prompt is pinned, ignoring `settings.playground.showSource`.
- [ ] [Stabilize prompt resolution](#stabilize-prompt-resolution): Refine `Index.tsx` logic so the blueprint receives the pinned prompt/file when pinned and reverts to cursor-driven prompts when unpinned.
- [ ] [Add targeted React tests](#add-targeted-react-tests): Create new tests under `pkgs/vsc-webview/src/__tests__/` using Testing Library + happy-dom that assert the pinned prompt stays visible and updates on select changes.
- [ ] [Disable flaky suites](#disable-flaky-suites): Skip or comment out the existing webview unit and extension e2e test runners per guidance so only the new targeted tests execute locally/CI.

### Override prompt visibility

#### Summary

Render the prompt panel whenever the pin is active.

#### Description

- Extend `Blueprint` props with an `isPromptPinned` flag (or similar) and use it to force-render `PromptSource`.
- Ensure the component still respects settings when not pinned.
- Verify styling remains consistent (no duplicate padding/borders).

### Stabilize prompt resolution

#### Summary

Guarantee the pinned prompt drives the blueprint until unpinned.

#### Description

- Adjust the memoization in `Index.tsx` so `targetPrompt` prefers the pinned prompt, falling back to `findPromptAtCursor` otherwise.
- Ensure assessments and any downstream components use the same prompt reference to avoid mismatched renders.
- Confirm prompt state resets cleanly when the user unpins.

### Add targeted React tests

#### Summary

Provide regression coverage for the new behavior.

#### Description

- Configure a new test file (e.g., `prompt-pinning.test.tsx`) that mounts `Index` or a smaller slice with mocked context.
- Use Testing Library queries to assert the thumbtack toggle updates and `PromptSource` remains visible after switching files/prompts.
- Run tests under happy-dom (`vitest --environment happy-dom`) to align with guidance.

### Disable flaky suites

#### Summary

Turn off the unreliable tests that are out of scope for this feature.

#### Description

- Update webview Vitest config to skip the legacy unit suite (e.g., by commenting out glob patterns or flipping a feature flag).
- Document the temporary skip in a TODO so it can be re-enabled later.
- Ensure the extension e2e test scripts are not invoked by the repo test command (adjust `package.json` or CI config if necessary).

## Questions

None.

## Notes

- Keep the new tests narrow so they execute quickly and provide precise feedback on the pinned flow.
- Coordinate with tooling owners before re-enabling the skipped suites in future work.
