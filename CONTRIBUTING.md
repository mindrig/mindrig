# Contributing Guide

## Setting Up

1. Install `mise` by running:

   ```sh
   curl https://mise.run | sh
   ```

2. Integrate it into your shell and restart the terminal to apply the changes:

   ```sh
   curl "https://mise.run/$(basename $SHELL)" | sh
   ```

3. Create an `age` key for secrets:

   ```sh
   mkdir -p ~/.config/fnox/ && mise exec age -- age-keygen -o ~/.config/fnox/age.txt
   ```

4. Copy the public key from the previous command output, looking like this: `age1jm5g49tr96kf9qfhwurpkp3f6npucueec4q065pzrqux73d5qe0skawf43`.

5. Add the public key to [./knox.toml](./knox.toml) into the `recipients` array. Make sure to to add a comment with the description to the end of the line, e.g.,: `"<key>", # Sasha's MacBook Pro M1 Pro`.

6. If you don't have the secret values on hand, commit and push the changes to `knox.toml` and ask [Sasha](http://github.com/kossnocorp) to re-encrypt the secrets for you.

   Otherwise, run and then commit and push the `knox.toml` changes:

   ```sh
   ./scripts/secrets-reencrypt.sh
   ```

7. Open the project in VS Code (or a fork), and install [the Remote Development Extension Pack](https://marketplace.visualstudio.com/items?itemName=ms-vscode-remote.vscode-remote-extensionpack).

8. Run the command (`cmd+shift+p`/`ctrl+shift+p`) `Dev Containers: Rebuild and Reopen in Container` to start and set up the dev container.

9. You're done!
