# VidSrcMe — Nuvio Addon
### Complete Beginner Walkthrough

This deploys a VidSrcMe addon on **Vercel** (free hosting) that works in
both **Nuvio** and **Stremio**. You get a permanent public URL like
`https://vidsrcme-addon.vercel.app/manifest.json` that you paste into either app.

No plugins, no GitHub raw URLs, no 404 errors.

---

## What you need before starting

| Thing | Why you need it | Where to get it |
|-------|----------------|-----------------|
| GitHub account (free) | Stores your code | https://github.com/signup |
| Vercel account (free) | Hosts your addon online | https://vercel.com/signup |
| TMDb API key (free) | Looks up TV show IDs | https://www.themoviedb.org/settings/api |

---

## STEP 1 — Get your TMDb API key

1. Go to https://www.themoviedb.org and create a free account
2. After logging in go to: https://www.themoviedb.org/settings/api
3. Click **Create** → choose **Developer**
4. Fill in the form — you can put anything for app name/description
5. Copy the **API Key (v3 auth)** — it looks like `a1b2c3d4e5f6...`
   ⚠️ Make sure it's the "API Key (v3 auth)", NOT the "API Read Access Token"

Save this somewhere — you'll paste it into Vercel in Step 5.

---

## STEP 2 — Create a GitHub account (skip if you have one)

1. Go to https://github.com/signup
2. Enter a username, email, and password
3. Verify your email

---

## STEP 3 — Create a new GitHub repository

1. Go to https://github.com/new
2. Fill in:
   - **Repository name**: `vidsrcme-addon`
   - Visibility: **Public** ← important
   - Check ✅ **Add a README file**
3. Click **Create repository**

You now have a repo at `https://github.com/YOUR_USERNAME/vidsrcme-addon`

---

## STEP 4 — Add the 4 addon files

You need to add 4 files. For each one:
- Click **Add file → Create new file** in your repo
- Type the filename exactly as shown
- Paste the file contents
- Click **Commit new file**

Do this 4 times, one file at a time:

---

### File 1 of 4 — `index.js`

Filename: `index.js`

Paste the entire contents of the `index.js` file from this package.

---

### File 2 of 4 — `vercel-handler.js`

Filename: `vercel-handler.js`

Paste the entire contents of the `vercel-handler.js` file from this package.

---

### File 3 of 4 — `package.json`

Filename: `package.json`

Paste the entire contents of the `package.json` file from this package.

---

### File 4 of 4 — `vercel.json`

Filename: `vercel.json`

Paste the entire contents of the `vercel.json` file from this package.

---

After all 4 files are added your repo should look like this:

```
vidsrcme-addon/
├── index.js
├── vercel-handler.js
├── package.json
├── vercel.json
└── README.md   ← auto-created by GitHub, ignore it
```

---

## STEP 5 — Deploy to Vercel

1. Go to https://vercel.com and sign up / log in (free)

2. Click **Add New…** → **Project**

3. Click **Import Git Repository**
   - If this is your first time, click **Connect GitHub** and authorize Vercel

4. Find `vidsrcme-addon` in the list and click **Import**

5. On the configuration screen, **before clicking Deploy**,
   look for the **Environment Variables** section and click to expand it

6. Add your TMDb key:
   - Click **Add**
   - Name: `TMDB_KEY`
   - Value: paste your TMDb API key from Step 1
   - Click **Save**

7. Now click **Deploy**

8. Wait about 1–2 minutes. When you see confetti 🎉 and a green checkmark — it worked!

---

## STEP 6 — Get your addon URL

After deployment Vercel shows you a URL like:
```
https://vidsrcme-addon.vercel.app
```

Your addon manifest URL is that URL plus `/manifest.json`:
```
https://vidsrcme-addon.vercel.app/manifest.json
```

**Test it first** — paste that full URL into your phone or computer browser.
You should see a page of JSON text starting with `{"id":"community.vidsrcme"...}`
If you see that, everything is working perfectly.

---

## STEP 7 — Install in Nuvio

1. Open the **Nuvio** app
2. Go to **Settings → Addons** (not Plugins — Addons)
3. Tap the **+** button or **Add Addon**
4. Paste your manifest URL:
   ```
   https://vidsrcme-addon.vercel.app/manifest.json
   ```
5. Tap **Install** or **Add**
6. You should see **VidSrcMe** appear in your addons list ✅

---

## STEP 8 — Install in Stremio (optional, same addon works in both)

1. Open **Stremio**
2. Click the 🔍 search icon
3. Click **Addons** in the sidebar
4. Paste your manifest URL in the search bar
5. Click **Install**

---

## STEP 9 — Test it

1. Open any movie or TV show in Nuvio
2. Tap to load streams
3. You should see **▶ VidSrcMe** as a stream option

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Vercel deployment failed | Make sure all 4 files are in the **root** of your repo, not inside a subfolder |
| manifest.json shows an error | Double-check you added the `TMDB_KEY` environment variable in Vercel before deploying |
| No streams show for a title | vsembed.su may be temporarily down. Open `https://vsembed.su/embed/movie?imdb=tt0111161` in your browser to test |
| Streams open in browser instead of playing | This is normal — vsembed.su is an embed page. Nuvio/Stremio opens it externally |
| Forgot to add TMDB_KEY before deploying | Go to Vercel → your project → Settings → Environment Variables → add it → Redeploy |

---

## Updating the addon later

If you need to make changes to the code:

1. Go to your GitHub repo
2. Click the file you want to edit
3. Click the ✏️ pencil icon
4. Make your changes and click **Commit changes**
5. Vercel automatically redeploys within ~1 minute — no action needed

---

## Your permanent addon URL (fill this in)

```
https://_______________________.vercel.app/manifest.json
```

Write your Vercel URL here so you don't lose it!
