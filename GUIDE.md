# Graph Paper Games — from this folder to Google Play

Everything is built. Your part is: open the project in Android Studio, make the
signed release file, test it with 12 people for 14 days, then publish.

Plan on about 3 weeks in total, mostly waiting for the testing period.

---

## What's in this folder

| Path | What it is |
|---|---|
| `www/` | The game itself (HTML/CSS/JS). Edit here if you change the games. |
| `android/` | The Android Studio project, ready to build. |
| `assets/` | Source images for the app icon and splash screen. |
| `store/` | Play Store icon, feature graphic, listing text, privacy policy. |
| `capacitor.config.json` | App name and package ID: `com.monemshariar.graphpapergames` |

The package ID can never be changed after you upload. If you want a different
one, change `appId` in `capacitor.config.json` **before step 2**, delete the
`android/` folder and run `npx cap add android` again.

---

## Step 1 — Install the tools (one time, ~30 min)

1. **Node.js** (LTS version): https://nodejs.org
2. **Android Studio** (latest): https://developer.android.com/studio
   During setup, let it install the Android SDK.
3. Unzip this project somewhere simple, e.g. `C:\dev\graph-paper-games`.
4. Open a terminal in that folder and run:

   ```
   npm install
   npx cap sync android
   ```

## Step 2 — Try it on your phone

1. On your Android phone: Settings → About phone → tap **Build number** 7 times.
   Then Settings → Developer options → turn on **USB debugging**.
2. Connect the phone by USB.
3. Run `npx cap open android` (or open the `android` folder in Android Studio).
4. Wait for Gradle to finish syncing (first time can take 5–10 min).
5. Pick your phone in the device dropdown and press the green ▶ **Run** button.

Play every game and mode. For online play, install it on a second phone (or
ask a friend) and try **Create game** / **Join with code**.

## Step 3 — Make the signed release file (.aab)

1. In Android Studio: **Build → Generate Signed App Bundle or APK…**
2. Choose **Android App Bundle**, then **Next**.
3. Under *Key store path*, click **Create new…**
   - Save it OUTSIDE the project, e.g. `Documents/keys/graph-paper-games.jks`
   - Pick a strong password and write it down.
   - Alias: `upload`. Validity: 25 years. Fill in your name and country (CA).
4. **Next** → choose **release** → **Create**.
5. The file appears at `android/app/release/app-release.aab`.

> **Back up the .jks file and passwords** (USB stick + cloud). You need the
> same key for every future update. If you lose it, Google can reset it, but
> it takes days.

## Step 4 — Create your Google Play developer account

1. Go to https://play.google.com/console and sign in with a Google account.
2. Choose **Personal** account, pay the **US$25** one-time fee.
3. Verify your identity (government ID) and phone number. Google may also ask
   you to confirm you have an Android device using the Play Console app.
   Approval can take a few days.

## Step 5 — Create the app and fill in the listing

1. Play Console → **Create app**
   - App name: `Graph Paper Games` · Language: English (Canada or US)
   - App or game: **Game** · Free or paid: **Free**
   - Tick the declarations → **Create app**.
2. Upload `store/privacy-policy.html` to your website, e.g.
   `https://monemshariar.com/graph-paper-games/privacy`.
3. **Grow → Store presence → Main store listing**: copy the text from
   `store/store-listing.md`. Upload:
   - App icon: `store/play-icon-512.png`
   - Feature graphic: `store/feature-graphic-1024x500.png`
   - Phone screenshots: at least 2. On your phone, open each game mid-play and
     take a screenshot (Power + Volume down). 4–6 screenshots look best.
4. **Store settings**: Category **Board**, contact email `info@monemshariar.com`.

### "App content" section (Policy → App content)

Answer each item. Suggested answers for this app:

| Item | Answer |
|---|---|
| Privacy policy | Your privacy page URL from above |
| App access | All functionality available without special access |
| Ads | No, my app does not contain ads |
| Content rating | Fill the questionnaire: category **Game**. No violence, no sexual content, no gambling, no bad language. Users interact online: answer **yes** to users interacting, but there is **no chat** and **no sharing of personal info or content**. Expect an "Everyone"/PEGI 3 rating. |
| Target audience | **13–15, 16–17, 18+** (not under 13, keeps you out of the stricter Families program) |
| Data safety | Collects data: **No**. Shares data: **No**. (See the privacy policy for the online-play note.) |
| Government / financial / health / news | No |

## Step 6 — Closed test: 12 testers for 14 days (required for new accounts)

Google requires new personal accounts to run a closed test with **at least
12 testers who stay opted in for 14 days in a row** before you can publish.

1. **Test and release → Testing → Closed testing → Create track** (or use
   the default "Closed testing – Alpha").
2. **Testers** tab → create an email list and add 12–20 Gmail addresses
   (friends, family, classmates). Add more than 12 in case some drop out.
3. **Create new release** → upload `app-release.aab` → release name `1.0` →
   notes: "First test version" → **Review release** → **Start rollout**.
4. Wait for review (usually a few hours to 2 days).
5. Copy the **opt-in link** from the Testers tab and send it to everyone.
   Each person must: open the link → **Become a tester** → install from Play.
   Ask them to open the app a few times during the two weeks and send you
   any feedback. They must **not** leave the test before day 14.
6. If you fix something, bump the version (step 8) and upload a new release
   to the same closed track. This counts as good "engagement" for Google.

## Step 7 — Apply for production and publish

1. After 14 days, Play Console **Dashboard → Apply for production**.
2. Answer the three sections honestly: how you found testers, the feedback
   you got, and what you changed. Short, specific answers work well.
3. Google usually replies within about 7 days.
4. Once approved: **Production → Create new release** → reuse the same .aab
   (or a newer one) → **Countries: select all** → **Start rollout**.

Done. Your app goes live after the final review.

## Step 8 — Releasing updates later

1. Change the game in `www/`.
2. In `android/app/build.gradle`, increase `versionCode` by 1 (1 → 2) and set
   `versionName` (e.g. `"1.1"`).
3. Run `npx cap sync android`.
4. Build a new signed bundle (step 3) using the **same key**.
5. Upload it as a new release in Play Console.

---

## Good to know

- **Online play** uses the free public PeerJS connection service to introduce
  the two phones; after that they talk directly. It works on most home Wi-Fi
  and mobile data. Very strict networks (some offices/schools) can block it.
  If the free service is ever down, online play pauses but the other modes
  keep working.
- **Target SDK**: the project targets Android API 36, which is what Google
  Play requires for new apps from August 31, 2026.
- **New icons**: replace images in `assets/` and run `npm run icons`, then
  `npx cap sync android`.
- **Rules check**: Google's requirements change from time to time. If a
  Play Console screen looks different from this guide, follow what Play
  Console says.
