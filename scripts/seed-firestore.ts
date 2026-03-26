/**
 * Push `suite/cards` from `src/defaultCards.ts` to Firestore (Admin SDK bypasses rules).
 *
 * One-time setup:
 *   Firebase Console → Project settings → Service accounts → Generate new private key
 *   Save JSON as `serviceAccount.json` in the project root (gitignored), or set env below.
 *
 * Run:
 *   npm run seed:firestore
 *
 * With explicit path:
 *   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/key.json npm run seed:firestore
 */

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import admin from "firebase-admin";
import { DEFAULT_CARDS } from "../src/defaultCards.ts";

function initAdmin(): void {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
  const credJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (credPath) {
    const abs = resolve(process.cwd(), credPath);
    const sa = JSON.parse(readFileSync(abs, "utf8")) as admin.ServiceAccount;
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    return;
  }
  if (credJson) {
    const sa = JSON.parse(credJson) as admin.ServiceAccount;
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    return;
  }

  const fallback = resolve(process.cwd(), "serviceAccount.json");
  try {
    const sa = JSON.parse(readFileSync(fallback, "utf8")) as admin.ServiceAccount;
    admin.initializeApp({ credential: admin.credential.cert(sa) });
    return;
  } catch {
    // fall through to error
  }

  console.error(`
No service account found.

  1. Firebase Console → Project settings → Service accounts
  2. Generate new private key → save as serviceAccount.json in whiterock-suite/

  Or set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON.
`);
  process.exit(1);
}

async function main(): Promise<void> {
  initAdmin();
  const db = admin.firestore();
  await db
    .collection("suite")
    .doc("cards")
    .set({
      cards: DEFAULT_CARDS,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

  console.log(
    `OK — Firestore suite/cards updated (${DEFAULT_CARDS.length} items from src/defaultCards.ts).`
  );
}

main().catch((e: unknown) => {
  console.error(e);
  process.exit(1);
});
