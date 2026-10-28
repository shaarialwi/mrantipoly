# MRANTI Park Online — Google Workspace edition

Prepared for:
- Website: https://monopoly.shaarialwi.com/index.html
- Repository: https://github.com/shaarialwi/mrantipoly
- Firebase project: premium-hybrid-471106-a7
- Functions region: asia-southeast1 (Singapore)

This package is configured with your supplied Firebase web app settings. It has NOT been uploaded to your repository or deployed to Firebase. Live Google sign-in and multi-laptop play require the steps below.

## 1. Authorise the game website

Firebase Console → Authentication → Settings → Authorized domains → Add domain:

    monopoly.shaarialwi.com

Enter only the hostname, without https:// or /index.html. If the game is also opened directly through GitHub Pages, add shaarialwi.github.io as well. Do not remove Firebase's existing domains.

Google must be Enabled under Authentication → Sign-in method. If prompted inside Google provider settings, select a project support email and save. Email/Password is not needed by this game. Do not disable providers used by other applications in this shared project.

## 2. Create or inspect the default Firestore database

In Firebase, open Databases & Storage → Firestore Database.

If no database exists, create a Standard edition database with ID `(default)`, select Singapore (`asia-southeast1`) if available, and start in Production mode.

If a database already exists, keep it. Do not delete data or recreate it. Check whether it serves another application before changing rules. The supplied rules only allow this game's room access and deny all other client access. In a shared database, merge the `/rooms/{code}` match into the existing rules instead of replacing other applications' rules. Review broad existing wildcard allows: Firestore grants access if ANY matching allow succeeds, so a permissive catch-all can defeat the room restrictions.

The backend writes `rooms` and `roomLimits`. Check for name conflicts with existing collections before deploying.

## 3. Deploy backend and rules

On your Mac, unzip the package. Open Terminal in the extracted folder containing firebase.json. Install Node.js 22 if necessary.

```bash
npm install -g firebase-tools
firebase login
npm --prefix functions install
node tests/identity.test.cjs
node tests/engine.test.cjs
node tests/backend.test.cjs
firebase deploy --project premium-hybrid-471106-a7 --only firestore:rules,functions
```

Only deploy the rules after reviewing step 2 for existing applications. Four functions are deployed: createRoom, joinRoom, startRoom and gameAction. The Firebase project already has Blaze billing according to your setup screen. Usage charges can apply; budget alerts are notifications, not spending caps. No additional billing configuration is included in this package.

If Firebase deploy asks to enable required Google Cloud APIs or accept terms, review the request in your own account.

## 4. Update GitHub

Unzip MRANTI-Park-Online.zip. In shaarialwi/mrantipoly, upload these extracted files to the SAME folder that currently supplies the live index.html:

- index.html
- online.js
- firebase-config.js
- CNAME (contains monopoly.shaarialwi.com; preserve your existing custom domain)
- .nojekyll (optional)

Replace the corresponding game files and commit. Do not upload the ZIP as the website. Do not upload node_modules or private credentials. Backend files do not run on GitHub Pages; they are deployed in step 3. You may store backend source in the repository, but it is not needed to serve the frontend.

Keep the repository's existing GitHub Pages publishing configuration and custom domain. Wait for its Pages deployment to finish, then open https://monopoly.shaarialwi.com/index.html and refresh.

## 5. Test Google sign-in

Click Sign in with Google and select your @mranti.my account. No separate game password or verification email is needed when Google supplies a verified account.

Create a room, share its code, and have another colleague sign in on a different laptop. The host can start with 2–6 players. Each player controls their own turn. Rejoin with the same account and code after a disconnect. Rooms expire after seven days; expiry blocks use but does not delete records automatically. Optionally configure Firestore TTL on rooms.expiresAt for eventual deletion. Account deletion and roomLimits cleanup remain administrative tasks.

Google may still authenticate a non-MRANTI user and create a Firebase Authentication account record. This game immediately signs that user out and denies game functions and room reads. This package restricts GAME ACCESS; it does not configure an Identity Platform blocking function to prevent all non-MRANTI Firebase account creation across the project.

The hd: mranti.my account-picker hint is a convenience only. Enforcement requires the deployed backend and Firestore rules: verified email, exact mranti.my domain, Google provider, and room membership. Server-side dice, transaction revisions and turn checks prevent clients from changing balances or playing out of turn.

If the organisation blocks the OAuth app, ask your Google Workspace administrator to review its access policy. Do not bypass organisational restrictions.

## Verification status

Local tests cover 100 games at 2–6 players, room capacity, rejoining, host controls, stale revision rejection, invalid turns, and domain/provider/email verification checks. Browser syntax and HTML structure checks pass. Live Firebase rules, email identity tokens, OAuth popups, multi-browser syncing and visual layout have NOT been verified against your project.

After deployment, test:
- Two MRANTI accounts can sign in and see the same room and board.
- A Gmail account is signed out and cannot read rooms or call game functions.
- An authenticated MRANTI account outside the room cannot read it.
- Browser direct writes to rooms are denied.
- Inactive users cannot roll, buy or upgrade.
- Refresh/rejoin preserves a seat; stale duplicate actions are rejected.
- Host can skip a stalled turn only after two minutes.

## Troubleshooting

- auth/unauthorized-domain: add monopoly.shaarialwi.com in Authentication → Settings → Authorized domains.
- auth/popup-blocked: allow the sign-in popup for your game and click again.
- Function not found/internal: confirm all four functions deployed in asia-southeast1 in premium-hybrid-471106-a7.
- Permission denied: deploy reviewed rules and backend; use a verified MRANTI Google account, then join via room code.
- Old email/password form: replace index.html and online.js, wait for the GitHub Pages build, then hard-refresh.
- Incorrect Firebase configuration: use the exact supplied web configuration; never substitute a service-account key.

## Sources

https://firebase.google.com/docs/auth/web/google-signin
https://firebase.google.com/docs/firestore/security/rules-conditions
https://firebase.google.com/docs/functions/callable
