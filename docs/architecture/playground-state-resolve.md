# Playground State Resolve

This document describes the playground state calculation algorithm.

## Context

When an active file, cursor selection, or file content changes, it needs to be reflected in the UI. Since user input needs to be preserved and restored when moving the cursor or updating the active prompt, we need to reliably associate the settings with a particular prompt.

We can't rely on the prompt content as the identifier, as it might change. We also can't rely on the prompt index, as prompts might be reordered or new ones added to the beginning of the file.

So to address that, we use a combination of heuristics to identify the correct prompt playground state.

## High-Level Flow

The diagram bellow illustrates how different backend events trigger used to resolve the playground state.

```mermaid
---
label: Backend Events
config:
    layout: elk
---
flowchart TB
    backend@{ shape: circle, label: "Backend" }

    backend --> active-change
    backend --> cursor-update
    backend --> file-save
    backend --> file-update

    %% Active change

    active-change@{ shape: rounded }
    -->
    active-change-pinned?@{ shape: diamond, label: "Pinned?" }

    active-change-pinned? --> |Yes| no-changes
    active-change-pinned? --> |No| parse-prompts

    %% Cursor update

    cursor-update
    -->
    cursor-update-pinned?@{ shape: diamond, label: "Pinned?" }

    cursor-update-pinned? --> |Yes| no-changes
    cursor-update-pinned? --> |No| resolve-state


    %% File save

    file-save
    -->
    file-save-pinned?@{ shape: diamond, label: "Pinned?" }

    file-save-pinned? --> |Yes| file-save-current?
    file-save-pinned? --> |No| resolve-state

    file-save-current?@{ shape: diamond, label: "Current file?" }

    file-save-current? --> |Yes| resolve-state
    file-save-current? --> |No| no-changes

    %% File update

    file-update
    -->
    file-update-pinned?@{ shape: diamond, label: "Pinned?" }

    file-update-pinned? --> |Yes| file-update-current?
    file-update-pinned? --> |No| parse-prompts

    file-update-current?@{ shape: diamond, label: "Current file?" }
    file-update-current? --> |Yes| parse-prompts
    file-update-current? --> |No| no-changes

    %% Common

    parse-prompts@{ shape: subproc, label: "parsePrompts" }
    -->
    resolve-map@{ shape: subproc, label: "resolveFilePromptsMap" }
    --> resolve-state

    resolve-state@{ shape: subproc, label: "resolvePlaygroundState" }
    --> |Message| client
    client@{ shape: stadium, label: "Client" }

    no-changes@{ shape: stadium, label: "No changes" }
```

## Role of the Map

The idea of the map is to maintain a stable association between prompts and their playground state across file edits. Essentially it exists only to obtain the correct prompt reference (file and prompt IDs) to load the playground state from.

## Contracts

The VS Code extension and the webview exchange a canonical `PlaygroundState` payload exported from `@wrkspc/core/playground`. Playground state only contains prompt identifiers, trimmed previews, and the chosen prompt entry. The resolver tracks richer history inside `PlaygroundMap`, also exported from `@wrkspc/core/playground`, which maintains per-file prompt IDs, contents, and timestamps. `PlaygroundMap` never leaves the extension process; it is used to derive `PlaygroundState` snapshots emitted via the `VscMessagePlayground` message channel.

## Algorithms

### `resolveFilePromptsMap`

The function takes in the current `map`, `parsedPrompts`, and `file` state as inputs. It resolves the map by matching file and prompts and returns the updated `map`.

```mermaid
---
label: resolveFilePromptsMap
---
flowchart TB
    in-map@{ shape: lean-r, label: "map" } --> fn
    in-file@{ shape: lean-r, label: "file" } --> fn
    in-parsed-prompts@{ shape: lean-r, label: "parsedPrompts" } --> fn

    fn[resolveFilePromptsMap]@{ shape: circle }
    -->
    match-file@{ shape: subproc, label: "matchPlaygroundMapFile" }
    --> matched-file?

    matched-file?@{ shape: diamond, label: "Matched map file?" }
    matched-file? --> |Yes| update-map
    matched-file? --> |No| create-map-file

    create-map-file[Create map file from parsed prompts]
    --> update-map

    update-map[Update map with map file]
    --> return

    return@{ shape: stadium }

    return --> resolved-prompts@{ shape: lean-r, label: "map" }
```

### `matchPlaygroundMapFile`

The function takes in `map`, `parsedPrompts`, and `file` as inputs. It uses the file path and the parsed prompts to find the corresponding map entry. If a match is found, it returns the `matchedMapFile`, otherwise returns `null`.

```mermaid
---
label: matchPlaygroundMapFile
config:
  layout: elk
---
flowchart TB
    in-map@{ shape: lean-r, label: "map" } --> fn
    in-file@{ shape: lean-r, label: "file" } --> fn
    in-parsed-prompts@{ shape: lean-r, label: "parsedPrompts" } --> fn

    fn[matchPlaygroundMapFile]@{ shape: circle }
    --> by-path

    by-path@{ shape: diamond, label: "Get by path?" }
    by-path --> |Some| by-path-distance
    by-path --> |None| by-distance
    by-path-distance@{ shape: subproc, label: "matchPlaygroundMapPrompts" }
    --> by-path-pass-threshold?

    by-path-pass-threshold?@{ shape: diamond, label: "Pass matchingByPathThreshold?" }
    by-path-pass-threshold? --> |Yes| return-some
    by-path-pass-threshold? --> |No| by-distance

    by-distance@{ shape: subproc, label: "matchPlaygroundMapFileByDistance" }
    by-distance --> |Some| return-some
    by-distance --> |None| return-none

    return-some@{ label: "return", shape: terminal }
    return-some --> out-some@{ shape: lean-r, label: "matchedMapFile" }

    return-none@{ label: "return", shape: terminal }
    return-none --> out-null@{ shape: lean-r, label: "null" }
```

### `matchPlaygroundMapFileByDistance`

The function takes in `map` and `parsedPrompts` as inputs. It finds the top scoring map file by matching prompts score and returns the `topScoringMapFile` if it meets the threshold, otherwise returns `null`.

```mermaid
---
label: matchPlaygroundMapFileByDistance
config:
  layout: elk
---
flowchart TB
    in-map@{ shape: lean-r, label: "map" } --> fn
    in-parsed-prompts@{ shape: lean-r, label: "parsedPrompts" } --> fn

    fn[matchPlaygroundMapFileByDistance]@{ shape: circle }
    --> next-file

    next-file@{ shape: diamond, label: "Next map file?" }
    next-file --> |Some| match-prompts
    next-file --> |None| return

    match-prompts@{ shape: subproc, label: "matchPlaygroundMapPrompts" }
    --> pass-threshold?

    pass-threshold?@{ shape: diamond, label: "Pass matchingByDistanceThreshold?" }
    pass-threshold? --> |Yes| top-score?
    pass-threshold? --> |No| next-file

    top-score?@{ shape: diamond, label: "matchingPromptsScore > topMatchingPromptsScore" }
    top-score? --> |Yes| assign-top-scored
    top-score? --> |No| next-file

    assign-top-scored["Assign topMatchingPromptsScore and topScoringMapFile"]
    --> next-file

    return@{ shape: terminal }
    return --> out-top-scoring@{ shape: lean-r, label: "topScoringMapFile" }
```

### `matchPlaygroundMapPrompts`

The function takes in `mapPrompts` and `parsedPrompts` as inputs. It matches prompts by content and then by distance, returning `matchedPrompts`, `unmatchedMapPrompts`, and `unmatchedParsedPrompts` sets as well as matching score `matchingScore`.

```mermaid
---
label: matchPlaygroundMapPrompts
config:
  layout: elk
---
flowchart TB
    in-map@{ shape: lean-r, label: "mapPrompts" } --> fn
    in-parsed-prompts@{ shape: lean-r, label: "parsedPrompts" } --> fn

    fn[matchPlaygroundMapPrompts]@{ shape: circle }
    --> match-by-content

    match-by-content@{ shape: subproc, label: "matchPlaygroundMapPromptsByContent" }
    -->
    match-by-distance@{ shape: subproc, label: "matchPlaygroundMapPromptsByDistance" }
    -->
    calc-matching-score@{ shape: subproc, label: "calcMatchingPromptsScore" }
    -->
    join-matched[Join matched prompts with unmatched parsed prompts]
    -->
    return@{ shape: terminal }

    return --> out-new-map-prompts@{ shape: lean-r, label: "nextMapPrompts" }
    return --> out-matching-score@{ shape: lean-r, label: "matchingPromptsScore" }
```

### `matchPlaygroundMapPromptsByContent`

The function takes in `unmatchedMapPrompts` and `unmatchedParsedPrompts` sets as inputs. It iterates through both sets to find exact content matches and returns `matchedMapPrompts`, `unmatchedMapPrompts`, and `unmatchedParsedPrompts` sets.

```mermaid
---
label: matchPlaygroundMapPromptsByContent
config:
  layout: elk
---
flowchart TB
    in-unmatched-map@{ shape: lean-r, label: "unmatchedMapPrompts" } --> fn
    in-unmatched-parsed@{ shape: lean-r, label: "unmatchedParsedPrompts" } --> fn

    fn[matchPlaygroundMapPromptsByContent]@{ shape: circle }
    --> next-map

    next-map@{ shape: diamond, label: "Next map prompt?" }
    next-map --> |Some| next-parsed
    next-map --> |None| return

    next-parsed@{ shape: diamond, label: "Next parsed prompt?" }
    next-parsed --> |Some| match-content?
    next-parsed --> |None| next-map

    match-content?@{ shape: diamond, label: "Content match?" }
    match-content? --> |Yes| remove-parsed
    match-content? --> |No| next-parsed

    remove-parsed[Remove prompts from unmatched sets]
    -->
    add-map[Add prompt to matched set]
    -->
    next-map

    return@{ shape: terminal }

    return --> out-matched@{ shape: lean-r, label: "matchedMapPrompts" }
    return --> out-unmatched-map@{ shape: lean-r, label: "unmatchedMapPrompts" }
    return --> out-unmatched-parsed@{ shape: lean-r, label: "unmatchedParsedPrompts" }
```

### `matchPlaygroundMapPromptsByDistance`

The function takes in `unmatchedMapPrompts` and `unmatchedParsedPrompts` sets as inputs. It uses levenshtein distance to find the closest matches and returns `matchedPrompts`, `unmatchedMapPrompts`, and `unmatchedParsedPrompts` sets.

```mermaid
---
label: matchPlaygroundMapPromptsByDistance
config:
  layout: elk
---
flowchart TB
    in-unmatched-map@{ shape: lean-r, label: "unmatchedMapPrompts" } --> fn
    in-unmatched-parsed@{ shape: lean-r, label: "unmatchedParsedPrompts" } --> fn

    fn[matchPlaygroundMapPromptsByDistance]
    --> next-map

    next-map@{ shape: diamond, label: "Next map prompt?" }
    next-map --> |Some| next-parsed
    next-map --> |None| sort-candidates[Sort candidate matches by distance]

    next-parsed@{ shape: diamond, label: "Next parsed prompt?" }
    next-parsed --> |Some| calc-distance
    next-parsed --> |None| next-map

    calc-distance[Calculate distance between prompts]
    -->
    distance-threshold?@{ shape: diamond, label: "Within threshold?" }

    distance-threshold? --> |Yes| add-candidate
    distance-threshold? --> |No| next-parsed

    add-candidate[Add prompt candidate]
    --> next-parsed

    sort-candidates[Sort candidate matches by distance]
    -->
    next-candidate@{ shape: diamond, label: "Next candidate?" }

    next-candidate --> |Some| review-candidate
    next-candidate --> |None| return

    review-candidate@{ shape: diamond, label: "Is map or parsed prompt in matched set?" }
    review-candidate --> |Yes| next-candidate
    review-candidate --> |No| candidate-to-map

    candidate-to-map[Update map with parsed prompt]
    -->
    remove-from-unmatched[Remove prompts from unmatched sets]
    -->
    candidate-to-matched[Add candidate prompts to matched set]
    --> next-candidate

    return@{ shape: terminal }

    return --> out-matched@{ shape: lean-r, label: "matchedPrompts" }
    return --> out-unmatched-map@{ shape: lean-r, label: "unmatchedMapPrompts" }
    return --> out-unmatched-parsed@{ shape: lean-r, label: "unmatchedParsedPrompts" }
```
