# AnTrack Privacy Policy

_Last updated: November 2026_

_This is an English translation of the [Spanish policy](/privacidad/). If the two versions differ, the Spanish one prevails._

---

## 1. Data controller

**AnTrack**
**Contact email:** migueangelcantos@gmail.com

---

## 2. What data we process and why

AnTrack is a **local-first** app: most of your data never leaves your device.

### 2.1 Local mode (no account)

| Data | Where it is stored | Purpose | Legal basis |
|---|---|---|---|
| Tasks, projects, notes, tags | Your browser's `localStorage`, on your device | Running the app | Performance of the service (Art. 6.1.b GDPR) |
| Theme and notification preferences | Your browser's `localStorage` | Personalisation | Legitimate interest (Art. 6.1.f GDPR) |

In this mode your tasks and the rest of your content **are not sent to any server**. The only thing that leaves your device is the anonymous visit statistics described in section 2.3, which you can turn off.

### 2.2 Synced mode (Google Sign-In, optional)

If you choose to turn on sync with Google:

| Data | Where it is stored | Purpose | Legal basis |
|---|---|---|---|
| Your Google account's email and name | Firebase Authentication (Google LLC) | Identification and sign-in | Consent (Art. 6.1.a GDPR) |
| Tasks, projects, notes | Firebase Firestore (Google LLC) | Syncing between devices | Consent (Art. 6.1.a GDPR) |
| Date of your last visit to the app (at most once a day) | Firebase Firestore (Google LLC) | Knowing whether the app is still being used, and by how many accounts | Legitimate interest (Art. 6.1.f GDPR) |

Sync is **entirely optional**. You can withdraw your consent at any time by signing out from the profile menu or from Settings → Account → "Sign out".

### 2.3 Anonymous visit statistics (Vercel Web Analytics)

To know how many people use AnTrack and on what kind of device, the app sends Vercel Web Analytics a notice for each page view. It is **on by default** and you can turn it off at any time.

| What is recorded | What is not recorded |
|---|---|
| Page viewed, referring page, country, device type, operating system and browser | Your tasks, notes, projects, habits, name or email |
| A visitor identifier that Vercel derives from the request and that **changes every day** | Your full IP address (it is not stored) |

- **No cookies:** nothing is stored on or read from your device for this measurement, so no cookie banner is required. The daily identifier cannot be used to follow you from one day to the next or across websites.
- **Legal basis:** legitimate interest (Art. 6.1.f GDPR) in knowing the aggregate use of the app in order to maintain and improve it, with as little data as possible.
- **How to turn it off:** Settings → Data → "Anonymous analytics". Your choice is saved on your device and respected on later visits. If your browser sends the **Global Privacy Control** signal, analytics stays off unless you turn it on yourself.
- **Provider:** Vercel Inc. (USA), acting as data processor. More information: [vercel.com/docs/analytics/privacy-policy](https://vercel.com/docs/analytics/privacy-policy).

### 2.4 Data we do NOT collect

- We do not use tracking or advertising cookies.
- We do not sell or hand over data to third parties for advertising.
- We do not record clicks, keystrokes or the content you type.

---

## 3. International transfers

Firebase Authentication and Firestore are services of Google LLC, a company based in the USA. These transfers rely on the **Standard Contractual Clauses** (SCCs) approved by the European Commission. More information: [Google Cloud Privacy](https://cloud.google.com/privacy).

If you live in the EU and turn on sync, you consent to this transfer.

Vercel Inc. (hosting and anonymous statistics, section 2.3) is also based in the USA; its transfers rely on the EU-U.S. Data Privacy Framework and on the Standard Contractual Clauses.

---

## 4. How long we keep data

- **Local data:** stays on your device until you delete it or clear your browser's storage.
- **Anonymous statistics:** Vercel only keeps aggregate figures; the visitor identifier is discarded every day.
- **Data in Firebase (if you use sync):** kept while your account is active. When you sign out of the app, the data stays in Firestore until you delete it or ask us to erase it (see section 5).

---

## 5. Your rights (GDPR)

You can exercise the following rights at any time by writing to **migueangelcantos@gmail.com**:

- **Access:** confirm whether we process your data and receive a copy.
- **Rectification:** correct inaccurate data.
- **Erasure ("right to be forgotten"):** ask for your data to be deleted from Firebase.
- **Portability:** export your data as JSON from the app itself (Settings → Data → "Export workspace").
- **Objection / Restriction:** object to certain processing or ask for it to be restricted. For the anonymous statistics, just turn them off in Settings → Data.
- **Withdrawal of consent:** sign out at any time; you can keep using the app locally.

If you believe the processing does not comply with the GDPR, you have the right to lodge a complaint with the **Spanish Data Protection Agency (AEPD)**: [www.aepd.es](https://www.aepd.es), or with the data protection authority of your own country.

---

## 6. Security

We apply reasonable technical measures to protect your data:

- Communication with Firebase goes over HTTPS/TLS.
- Firestore rules ensure that only you can read and write your own data.
- Local data is protected by the browser's sandboxing.

---

## 7. Third-party services

| Service | Provider | Purpose | Policy |
|---|---|---|---|
| Firebase Auth + Firestore | Google LLC | Sign-in and sync (opt-in) | [firebase.google.com/support/privacy](https://firebase.google.com/support/privacy) |
| Vercel Web Analytics | Vercel Inc. | Anonymous visit statistics, no cookies (on by default, can be turned off) | [vercel.com/docs/analytics/privacy-policy](https://vercel.com/docs/analytics/privacy-policy) |

Fonts (Inter, Bricolage Grotesque, JetBrains Mono) and icons (Lucide) are **self-hosted** on our own domain. Apart from the anonymous statistics (which you can turn off) and Firebase if you choose to sign in, **no requests are made to third-party servers**.

---

## 8. Changes to this policy

Any material change will be announced by updating the date at the top of this document and, if we have your email, by notifying you directly.

---

## 9. Contact

For any privacy question: **migueangelcantos@gmail.com**
