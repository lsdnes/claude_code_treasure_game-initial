Deploy this project to Vercel and return the live URL.

## Steps

1. **Check Vercel CLI** — run `vercel --version` to see if it's installed. If not, install it globally with `npm install -g vercel`.

2. **Check/create `vercel.json`** — if a `vercel.json` does not exist at the project root, create one with this content:
   ```json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "build",
     "framework": null,
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
   This tells Vercel to build the Vite frontend and serve it as a SPA.

   > **Note on the backend:** The Express + SQLite API server (`server.js`) cannot run on Vercel's serverless platform as-is (SQLite requires a persistent filesystem). Only the React frontend will be deployed. Signed-in features (scores, auth) won't work on the deployed URL unless the backend is separately hosted.

3. **Deploy** — run `vercel --prod --yes` in the project root. If this is the first deploy, Vercel may prompt for login or project setup; if so, tell the user to run `! vercel login` in the chat prompt first, then retry `/deploy_vercel`.

4. **Return the URL** — parse the deployment output for the production URL (line starting with `Production:` or ending in `.vercel.app`) and display it to the user as a clickable link.
