# Services Layout

## Services

### Production Services

| Service     | Id        | Production URL                                             | Dev URL                                        | Description         |
| ----------- | --------- | ---------------------------------------------------------- | ---------------------------------------------- | ------------------- |
| Home Page   | `home`    | [https://mindrig.dev](https://mindrig.dev)                 | [http://localhost:3100](http://localhost:3100) | Main website.       |
| Gateway API | `gateway` | [https://gateway.mindrig.dev](https://gateway.mindrig.dev) | [http://localhost:3110](http://localhost:3110) | Global gateway API. |

### Dev Tools Services

| Dev Tool  | URL                                            | Description         |
| --------- | ---------------------------------------------- | ------------------- |
| Storybook | [http://localhost:3190](http://localhost:3190) | Storybook instance. |

## Dev Port Assignments

Mind Rig reserves `31xx` ports for its services. `xx` consists of two digits, first representing the service group and the second the service index within that group.

When adding new services, to avoid port conflicts, please follow the existing pattern adding it to corresponding group and using next available service index.

### Service Group Ports

| Service Group | Index | Description                                      |
| ------------- | ----- | ------------------------------------------------ |
| User-Facing   | `0`   | User-facing services, i.e. home page or web app. |
| APIs          | `1`   | API services, i.e., global gateway API.          |
| Dev Tools     | `9`   | Development tools, i.e., Vite dev server.        |

### Service Ports

| Service Name                         | Group       | Index | Port   | Description                                |
| ------------------------------------ | ----------- | ----- | ------ | ------------------------------------------ |
| Home Page                            | User-Facing | `0`   | `3100` | Main website.                              |
| Gateway API                          | APIs        | `1`   | `3110` | Global gateway API.                        |
| Storybook                            | Dev Tools   | `9`   | `3190` | Storybook instance.                        |
| VS Code Webview Dev Server           | Dev Tools   | `9`   | `3191` | VS Code extension webview Vite dev server. |
| VS Code Extension Auto Reload Server | Dev Tools   | `9`   | `3192` | VS Code extension auto reload server.      |
| Local LM Studio                      | Dev Tools   | `9`   | `3193` | VS Code extension auto reload server.      |
