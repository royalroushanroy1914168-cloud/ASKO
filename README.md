# Asko Village Portal — Community Edition

This version adds a citizen social/community area inspired by familiar social-feed layouts (not an exact Facebook clone).

## New citizen flow

1. Citizen taps **Citizen Login / Register**.
2. Enters phone number with country code, e.g. +91XXXXXXXXXX.
3. Firebase Phone Authentication sends an OTP.
4. Citizen verifies the OTP.
5. First-time users enter their **name** and optionally a **profile picture**.
6. The site opens their community profile/feed.
7. They can write a post and optionally attach a photo.
8. The post is saved in Firestore and appears in the shared **Asko Community** home feed and is tied to that user's profile.

## Firebase setup (required for real OTP and social feed)

1. Create a Firebase project.
2. Add a Web App.
3. Copy its web configuration into `public/firebase-config.js`.
4. In Firebase Authentication, enable **Phone** sign-in.
5. Configure the authorized domain(s) for your deployed site.
6. Create a Firestore database.
7. Create a Storage bucket.
8. Apply `firestore.rules` and `storage.rules`.
9. For production, enable Firebase App Check and review your security rules.

Firebase Phone Authentication may use reCAPTCHA as part of the verification flow. Test on your actual deployed domain.

## OpenAI / Ask ChatGPT

Copy `.env.example` to `.env` and add your server-side OpenAI API key. Never place the key in `public/`.

## Run locally

npm install
npm start

Then open http://localhost:3000

## Important privacy/safety choices

- Phone numbers are used by Firebase Authentication and should not be displayed publicly in profiles.
- Profile photos and posts are stored in Firebase Storage/Firestore.
- Before launch, add Terms, Privacy Policy, Report Post, Block User and moderation/admin controls.
- Do not present the site as a government website unless it is officially authorized.
- Verify the current Pradhan/Sarpanch, MLA, MP, Panchayat coordinates and other changing facts before publication.


## Separate pages

The navigation is now split into independent pages:
- `index.html` — Home
- `about.html` — About Asko
- `citizen-login.html` — Citizen Login / Register
- `community.html` — Citizen social feed
- `panchayat.html`
- `representatives.html`
- `festivals.html`
- `gallery.html`
- `ask.html`

The Citizen Login page handles Phone OTP and first-time profile setup. After successful setup/login it opens the separate Community page.
