# Security Policy

## Supported versions

| Version | Supported |
|---|---|
| Latest (main branch) | ✅ |
| Older builds | ❌ |

Only the latest deployed version receives security fixes.

---

## Reporting a vulnerability

**Please do NOT open a public GitHub issue for security vulnerabilities.**

Send a report to: **ansonfull@gmail.com**

Include in your report:

- Description of the vulnerability and its potential impact
- Steps to reproduce (proof of concept if possible)
- Affected component (e.g. note editor, import/export, Firebase sync)
- Your preferred contact method for follow-up

---

## Response timeline

| Stage | Target time |
|---|---|
| Acknowledgement | Within 72 hours |
| Initial assessment | Within 7 days |
| Fix or mitigation | Within 30 days for critical issues |
| Public disclosure | After fix is deployed (coordinated disclosure) |

We follow **responsible disclosure**: we ask that you give us reasonable time to fix the issue before making it public. We will credit you in the release notes unless you prefer to remain anonymous.

---

## Scope

The following are **in scope**:

- Cross-site scripting (XSS) in the note editor or task fields
- Data exfiltration via import/export or Firebase sync
- Authentication bypass in the Firebase sync feature
- Firestore security rules misconfiguration allowing access to other users' data
- Supply chain vulnerabilities in bundled dependencies

The following are **out of scope**:

- Vulnerabilities requiring physical access to the user's device
- Self-XSS (attacks that require the victim to execute code themselves)
- Attacks on Google's Firebase infrastructure (report to Google directly)
- Denial of service via `localStorage` quota exhaustion (known limitation, tracked)
- Browser-level vulnerabilities (report to the browser vendor)

---

## Security design notes

- All user data is stored locally in `localStorage` by default — no server receives data without explicit opt-in.
- When Firebase sync is enabled, Firestore rules enforce that each user can only read and write their own data (`/users/{uid}/workspace`).
- The Firebase API key in the source code is intentionally public (it is not a secret); it is protected by Firestore security rules and Firebase App Check.
- HTML content in notes is sanitized with DOMPurify before being rendered or stored.
- No analytics, tracking scripts, or third-party advertising SDKs are included.

---

## Contact

**ansonfull@gmail.com**
