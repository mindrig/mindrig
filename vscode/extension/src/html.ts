export function getWebviewHtml(stylesUri: string, reactAppUri: string): string {
  return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link href="${stylesUri}" rel="stylesheet">
        <title>Mind Control Code</title>
    </head>
    <body class="bg-gray-100">
        <div id="root" class="min-h-screen"></div>
        <script src="${reactAppUri}"></script>
    </body>
    </html>`;
}
