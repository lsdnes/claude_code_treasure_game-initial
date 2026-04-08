Deploy this project to GitHub Pages and return the live URL.

> **Note on the backend:** The Express + SQLite API server (`server.js`) cannot run on GitHub Pages (static hosting only). Only the React frontend will be deployed. Signed-in features (scores, auth) won't work on the deployed URL unless the backend is separately hosted.

## Steps

### 1. Verify GitHub CLI is authenticated

Run `gh auth status`. If not logged in, tell the user to run `! gh auth login` in the chat prompt first, then retry `/deploy_github_page`.

### 2. Get GitHub username

Run `gh api user --jq '.login'` and save the result as `$GH_USER`.

### 3. Determine repository name

Use the current project folder name as the repo name (e.g. `claude_code_treasure_game-initial`). Save as `$REPO_NAME`.

### 4. Create or validate the GitHub repository

Run `gh repo view $GH_USER/$REPO_NAME 2>/dev/null` to check if the repo exists.
- If it does **not** exist: run `gh repo create $REPO_NAME --public --source=. --remote=origin --push` to create it and push.
- If it **exists**: ensure the remote `origin` points to `https://github.com/$GH_USER/$REPO_NAME.git`. If not, run `git remote set-url origin https://github.com/$GH_USER/$REPO_NAME.git`.

### 5. Ensure git is initialized and files are committed

- If `.git` does not exist: run `git init && git add . && git commit -m "Initial commit"`.
- If `.git` exists but there are uncommitted changes: run `git add . && git commit -m "Deploy to GitHub Pages"`.
- Push to origin main: `git push -u origin main` (or `master` if that's the default branch).

### 6. Configure Vite base path for GitHub Pages

GitHub Pages serves the site at `https://$GH_USER.github.io/$REPO_NAME/`, so Vite must know the sub-path.

Open `vite.config.ts` and add `base: '/$REPO_NAME/'` inside `defineConfig({...})` if it is not already set. Example:

```ts
export default defineConfig({
  base: '/claude_code_treasure_game-initial/',
  // ...rest of config
});
```

After editing, commit the change: `git add vite.config.ts && git commit -m "Set Vite base for GitHub Pages"`.

### 7. Install gh-pages package if needed

Run `npm list gh-pages --depth=0 2>/dev/null | grep gh-pages` to check if it is installed.
If not installed, run `npm install --save-dev gh-pages`.

### 8. Add deploy script to package.json if needed

Check `package.json` for a `"deploy"` script. If missing, add:
```json
"predeploy": "npm run build",
"deploy": "gh-pages -d build"
```
Commit: `git add package.json && git commit -m "Add gh-pages deploy script"`.

### 9. Build and deploy

Run `npm run deploy`. This will:
1. Build the Vite frontend into `./build/`
2. Push the `build/` directory to the `gh-pages` branch of the repository

### 10. Enable GitHub Pages (if first deploy)

Run `gh api repos/$GH_USER/$REPO_NAME/pages -X POST -f source[branch]=gh-pages -f source[path]=/ 2>/dev/null || true` to ensure GitHub Pages is configured to serve from the `gh-pages` branch.

### 11. Return the URL

The live URL will be: `https://$GH_USER.github.io/$REPO_NAME/`

Display it to the user as a clickable link. Note that GitHub Pages may take 1–2 minutes to go live after the first deploy.
