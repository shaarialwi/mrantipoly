# MRANTI Park Online — Firebase Spark edition

Website: https://monopoly.shaarialwi.com/index.html
GitHub: https://github.com/shaarialwi/mrantipoly
Firebase project: premium-hybrid-471106-a7

This version uses Google Authentication and Cloud Firestore directly. NO Cloud Functions, Firebase CLI installation, backend deployment or billing upgrade is needed to run it. The Firebase web configuration and custom domain are already filled in. This download does not change your live Firebase settings or GitHub files.

## Step 1 — Create the database (if needed)

In Firebase Console select project ID premium-hybrid-471106-a7. Go to Databases & Storage → Firestore Database → Create database.

- Select Standard edition.
- Database ID: `(default)`.
- Choose Singapore (`asia-southeast1`) if available.
- Start in Production mode.

If a default database already exists, use it; do not delete or recreate it. This game uses a new collection, `sparkRooms`, so it does not reuse old Cloud Functions room records.

## Step 2 — Publish the Spark access rules (required)

1. Open Firestore Database → Rules.
2. Open `firestore.rules` from this download in a text editor.
3. If this database is only for the game, replace the rules editor contents with that complete file.
4. Click Publish.

If the database serves another app, preserve that app's rules and merge this file's helper functions and `/sparkRooms/{code}` match into the existing `match /databases/{database}/documents` block. Do not overwrite the rules of other applications. A broad existing wildcard allow can override restrictions on sparkRooms: rules are additive, so review overlapping matches. Do not use public test-mode rules or `allow read, write: if true`.

The Spark rules are DIFFERENT from the previous Cloud Functions edition. Keeping the old rules will block creating rooms.

## Step 3 — Confirm Google sign-in

Authentication → Sign-in method: Google Enabled.
Authentication → Settings → Authorized domains: add `monopoly.shaarialwi.com`.
If visiting the github.io URL directly, also add `shaarialwi.github.io`.

Only verified @mranti.my Google accounts can use the database. The account picker domain hint is not the security control; the rules enforce the domain, verified-email flag and Google sign-in provider. Other Google accounts may still get an Authentication record before the app signs them out, but cannot access game data.

## Step 4 — Update your GitHub website

Upload these FIVE files from the extracted ZIP to the same folder as the site's existing index.html, replacing older copies:

1. index.html
2. online.js
3. game-engine.js — NEW; must be uploaded
4. firebase-config.js
5. CNAME — preserves monopoly.shaarialwi.com

Optionally upload .nojekyll. Commit the changes and wait for GitHub Pages to publish. Keep the current Pages branch/folder and custom domain settings. The ZIP itself does not run as a website. Backend folders from earlier versions are not used; do not deploy them for Spark.

Refresh https://monopoly.shaarialwi.com/index.html. The header should say SPARK EDITION. If it does not, hard-refresh after the GitHub Pages deployment has finished.

## Step 5 — Play

- Sign in using your MRANTI Google account.
- Click Create a room; leave the join-code field blank when creating.
- Share the generated 20-character room code with colleagues. Do not invent a code such as shaari1234.
- Each colleague opens the website on their own laptop, signs in, and pastes that code into Join / rejoin.
- The host starts with 2–4 players. Online rooms have human players only.
- Only the active player submits moves. The host can skip a stalled turn after two minutes.
- Refresh or reconnect, then rejoin with the same Google account and code to keep your seat.
- Leaving the view keeps your seat. Start a new room for a different player list or rematch.

Old 10-character room codes from the Functions edition do not work in this version.

## Spark limits and casual-play scope

Live updates consume Firestore reads; writes occur on room joins, starts and player actions. Quotas are shared with other apps in this project. Usage may stop when a Spark quota is reached. Check the Firebase Usage dashboard; no automatic upgrade is performed.

Dice and game calculations run in the active player's browser. Rules enforce MRANTI identity, host identity, membership, lobby capacity, current-player write access, turn timestamps, version increments and basic data shape. They do not reproduce every Monopoly calculation or prove fair dice. A technically skilled participant could manipulate game results during their own turn. Use this version for casual colleague play, not prizes or competitive rankings.

A verified MRANTI user who knows an exact waiting-room code can view that lobby and join. Once started, only members can read the board. Room listing is denied. Store only display names, account IDs and game state; emails remain in Authentication. No player password is stored by the game.

Rooms expire after seven days. Expired records are inaccessible but are NOT automatically deleted; delete old sparkRooms documents manually through the console if storage grows. Do not enable paid TTL features just for this Spark setup. Avoid deleting other project resources. This package does not downgrade or unlink billing from your shared Google Cloud project; if it is currently Spark, keep it there.

## Troubleshooting

- `internal [0]`: the browser may still have the old Functions version. Replace all five files, verify SPARK EDITION, and hard-refresh.
- `permission-denied`: publish this package's Spark rules in the correct project/default database; sign in with a verified MRANTI Google account. Old rules block browser writes.
- `unavailable`: check the internet connection and default Firestore database setup.
- `resource-exhausted`: check Spark's usage quota and wait for the relevant quota reset.
- `auth/unauthorized-domain`: add monopoly.shaarialwi.com to Firebase Authorized domains.
- Board changed: another action or tab updated the room; wait for the latest view and retry.
- Cannot join an in-progress game: new players can join only while waiting; existing members can rejoin.
- Rules publish error: send the exact line and error; do not loosen the rules to make it work.

## Verification

See TEST-RESULTS.md for local verification and the remaining live-project checks.
