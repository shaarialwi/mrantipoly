# Verification — Spark edition, maximum four players

Passed JavaScript syntax checks for the HTML inline script, online.js and game-engine.js.

Passed actual local Firestore emulator tests with the supplied rules:
- Verified MRANTI Google accounts can create and join rooms.
- Other email domains, unverified accounts and password-provider tokens are denied.
- Room listing and outsider access to started games are denied.
- Four seats can be filled; a fifth player is rejected.
- Only the host can start; membership and host changes are blocked.
- Inactive-player moves, replayed revisions and premature host skips are denied.
- A full four-player game completed through the rules.

This is local emulation, not a deployment or live Google sign-in/browser test. After publishing the rules and uploading website files, test Create/Join with two separate MRANTI Google accounts on separate laptops. Confirm a fifth account cannot join a full room.

Game calculations remain client-side; these rules do not provide comprehensive anti-cheating protection. No live project settings, billing settings or repository files were changed by preparing this ZIP.
