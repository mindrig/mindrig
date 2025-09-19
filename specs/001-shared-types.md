# Specification 001: Shared Types

## Overview

The Mind Control Code project uses [Genotype](https://github.com/kossnocorp/genotype) to define shared types that are synchronized between TypeScript and Rust code. This ensures type safety across the entire monorepo while maintaining a single source of truth for data structures.

## Architecture

### Type definitions

All type definitions are located in the [`./types/src/`](../types/src/) directory using Genotype syntax.

### Generated Output

The Genotype compiler (`gt build`) generates language-specific packages:

- **TypeScript**: [`./types/pkgs/ts/`](../types/pkgs/ts/).
- **Rust**: [`./types/pkgs/rs/`](../types/pkgs/rs/).
