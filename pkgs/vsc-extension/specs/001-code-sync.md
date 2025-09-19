# Code synchronization

## Overview

The Mind Control Code extension synchronizes code edits between the VS Code editor and the webview interface, ensuring a seamless user experience.

## Problem

One of the main features of the Mind Control Code is the rich prompt editor. It detects prompt strings in the open file with the help of the parser [`./parser/specs/001-parsing.md`](../../parser/specs/001-parsing.md) and exposes them to the prompt editor in the webview. The user then can edit those prompts right in the webview, which introduces the problem of synchronization.

If the extension were to start messing with the source code, the user would immediately lose full confidence in the product. So it is crucial to maintain a consistent and reliable synchronization between the webview and the editor.

### Parsing

To prevent the webview editor from lagging while they are typing, we parse the source code asynchronously. Currently it is done on the extension backend that has the up-to-date context. As the parse result is used to update the prompts, we have to deal with parse results not corresponding to the prompt state.

### Background edits

Code can be edited in the background by another user (Live Share or Workspace features) or by a locally running agent, so the naive approach of simply sending back the latest webview code state would not work as it can lead to lost work and confusion.

## Solution

To provide a robust experience,ce the extension must introduce a mechanism for synchronizing any code changes between the webview and the extension backend.

This should be achieved by using CRDTs (Conflict-free Replicated Data Types).

### Tech

- [Yjs](https://docs.yjs.dev/) - CRDT implementation.
