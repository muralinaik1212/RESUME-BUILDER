# ResumeForge – free resume builder for students
Static site on **GitHub Pages** + **Firebase (free Spark plan)** for login and database. No server, nothing runs on your laptop.

## 1. Firebase (free, no card)
1. https://console.firebase.google.com → Add project (turn Analytics off).
2. Build → **Authentication** → Get started → enable **Email/Password** and **Google**.
3. Build → **Firestore Database** → Create (production mode, region `asia-south1`). Open **Rules**, paste `firestore.rules`, Publish.
4. Project settings → Your apps → Web (`</>`) → copy the config into `firebase-config.js`.

## 2. GitHub
1. New public repo, upload all files (Add file → Upload files), commit.
2. Settings → Pages → Deploy from branch `main` / root. Your site: `https://USERNAME.github.io/REPO/`.
3. Firebase → Authentication → Settings → **Authorized domains** → add `USERNAME.github.io`.
4. Replace `YOUR-USERNAME/YOUR-REPO` in `index.html`, and fill the [PLACEHOLDERS] in `privacy.html` and `terms.html`.

## 3. Make yourself admin
Sign up on your site, then Firebase → Authentication → copy your **User UID**. In Firestore create collection `admins` → document ID = your UID (add any field, e.g. `ok: true`). Reload: an **Admin** button appears.

## Notes
- PDF uses the browser print dialog (Save as PDF). Word export is an HTML-based .doc that Word opens.
- Add a licence file (e.g. MIT) so others know how they may use your code.
- The legal pages are plain-language templates, not legal advice.
