# Build & verify static output

## Spec

Produce the static Storybook bundle and manually confirm the generated assets in `pkgs/storybook/dist` meet expectations.

## Tasks

- [ ] [Run Storybook build](#run-storybook-build): Execute the static build command and capture logs for troubleshooting.
- [ ] [Inspect dist artifacts](#inspect-dist-artifacts): Verify the expected HTML, JS, and asset structure lands in `pkgs/storybook/dist`.
- [ ] [Sanity-check rendered stories](#sanity-check-rendered-stories): Open the static output locally to confirm the sample stories render correctly.
- [ ] [Document validation results](#document-validation-results): Record findings and any follow-up actions in the plan artifacts.

### Run Storybook build

#### Summary

Generate the static site using workspace scripts.

#### Description

- Execute `pnpm --filter @wrkspc/storybook build` from the repo root.
- Confirm the CLI reports success and note build duration and warnings.
- If the build fails, capture the error output and create TODOs referencing the failing components or configs.

### Inspect dist artifacts

#### Summary

Ensure the build output shape is correct.

#### Description

- List contents of `pkgs/storybook/dist` and check for key files (`index.html`, `iframe.html`, `storybook-static/` structure depending on Storybook version).
- Verify that asset subdirectories (e.g., `assets/`, `sb-manager.js`) exist and that source maps are generated if expected.
- Remove any leftover generator artifacts (e.g., `stories/Button.mdx`) that should not ship.

### Sanity-check rendered stories

#### Summary

Confirm the sample stories work in the static bundle.

#### Description

- Run a static server (`pnpm dlx serve pkgs/storybook/dist` or similar) and navigate to the bundle in a browser.
- Check that `UI/Button` and `FileLabel` entries appear in the sidebar and render without runtime errors.
- Toggle controls to ensure Args work as intended and styling matches the app.

### Document validation results

#### Summary

Record the verification for future reference.

#### Description

- Append a short validation log to `agents/plans/001-storybook-integration/artifacts/build-verification.md`, including command used, timestamp, and any issues found.
- Note whether additional follow-up is required before merging (e.g., missing fonts, noisy console warnings).
- If everything passes, mark this step ready for execution and mention any recommended automation (e.g., adding a Turbo pipeline check).

## Questions

None.

## Notes

- If static hosting requires a different output directory in the future, update both the build script and documentation simultaneously.
