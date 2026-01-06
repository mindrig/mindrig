# Change Log

All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning].

This change log follows the format documented in [Keep a CHANGELOG].

[semantic versioning]: http://semver.org/
[keep a changelog]: http://keepachangelog.com/

## v0.7.0 - 2026-01-06

### Fixed

- Fixed result columns layout overflow issue.

- Fixed Python f-strings interpolation issue.

- Fixed missing names for freshly added model developers.

### Added

- Added support for Ruby, PHP, Go, C#, and Java.

- Added prompt detection for more patterns like `"Hello, " + name + "!"`, `"Hello, {}!".format(name)`, `["Hello, ", name, "!"].join("")` and many others.

### Changed

- Updated internal models database data.

- Made All selection the default one when loading CSV datasets.

- Misc micro UI improvements.

## v0.6.0 - 2025-12-19

### Added

- Added video demo link to the README and tips sections.

## v0.5.0 - 2025-12-17

### Added

- Added GitHub & Discord links to the extension webview footer and tips sections.

## v0.4.0 - 2025-12-17

### Changed

- Updated extension icon to the new design.

- Updated Discord invite link.

## v0.3.1 - 2025-12-17

### Fixed

- Fixed screenshot URL in the README.

## v0.3.0 - 2025-12-17

### Changed

- New toolbar icon matching the logotype.

- Fixed incorrect link in README, added logotype image.

## v0.2.0 - 2025-12-16

### Fixed

- Fixed clearing Vercel Gateway key flow.

- Fixed small layout issues.

### Added

- Added prompt parsing tip to empty prompt state.

- Added info about Vercel Gateway to the API key form.

## v0.1.4 - 2025-12-16

### Fixed

- Fixed "Cannot change the id of an item" exception in the extension webview. The bug was fixed earlier, but due to Turborepo inputs misconfiguration, the old build was still being used.

## v0.1.3 - 2025-12-16

### Fixed

- Fixed Open VSX extension URL in the README.

## v0.1.2 - 2025-12-16

### Fixed

- Fixed screenshot URL in the README.

## v0.1.1 - 2025-12-15

### Fixed

- Replaced dummy README with actual README in VS Code extension package.

## v0.1.0 - 2025-12-15

Initial version
