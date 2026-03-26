import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { isEditorEmail } from "./auth";
import { CardModal } from "./CardModal";
import { DEFAULT_CARDS } from "./defaultCards";
import { GoogleIcon } from "./GoogleIcon";
import { getAuthInstance, getDb, isFirebaseConfigured } from "./firebase";
import { parseCardColor } from "./colorUtils";
import type { SuiteCard } from "./types";
import { hrefForUrl } from "./urls";

function normalizeCards(raw: unknown[]): SuiteCard[] {
  return raw
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const o = item as Record<string, unknown>;
      const id = String(o.id ?? "");
      const title = String(o.title ?? "");
      const description = String(o.description ?? "");
      const url = String(o.url ?? "");
      if (!id || !title) return null;
      const color = parseCardColor(o.color);
      const card: SuiteCard = { id, title, description, url };
      if (color) card.color = color;
      return card;
    })
    .filter((x): x is SuiteCard => x !== null);
}

export default function App() {
  const [cards, setCards] = useState<SuiteCard[]>(DEFAULT_CARDS);
  /** Once Firestore has delivered a snapshot, don’t wipe cards on read errors (e.g. after sign-out if rules wrongly require auth to read). */
  const firestoreHydratedRef = useRef(false);
  const [user, setUser] = useState<User | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [modalCard, setModalCard] = useState<SuiteCard | "new" | null>(null);

  const configured = isFirebaseConfigured();
  const canEdit =
    configured && Boolean(user) && isEditorEmail(user?.email ?? null);

  useEffect(() => {
    const auth = getAuthInstance();
    if (!auth) {
      setUser(null);
      return;
    }
    return onAuthStateChanged(auth, async (u) => {
      if (!u) {
        setUser(null);
        return;
      }
      if (!isEditorEmail(u.email)) {
        setAuthError(
          "This Google account is not authorized to edit the suite."
        );
        await signOut(auth);
        setUser(null);
        return;
      }
      setAuthError(null);
      setUser(u);
    });
  }, [configured]);

  useEffect(() => {
    const db = getDb();
    if (!db) {
      setCards(DEFAULT_CARDS);
      return;
    }
    const docRef = doc(db, "suite", "cards");
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        firestoreHydratedRef.current = true;
        setSaveError(null);
        if (!snap.exists()) {
          setCards(DEFAULT_CARDS);
          return;
        }
        const raw = snap.data()?.cards;
        if (Array.isArray(raw)) {
          const next = normalizeCards(raw);
          setCards(next);
        } else {
          setCards(DEFAULT_CARDS);
        }
      },
      (err) => {
        console.error(err);
        setSaveError(err.message);
        if (!firestoreHydratedRef.current) {
          setCards(DEFAULT_CARDS);
        }
      }
    );
    return () => unsub();
  }, [configured]);

  const persistCards = useCallback(async (next: SuiteCard[]) => {
    const db = getDb();
    const auth = getAuthInstance();
    if (!db || !auth?.currentUser) return;
    setSaveError(null);
    await setDoc(
      doc(db, "suite", "cards"),
      { cards: next, updatedAt: serverTimestamp() },
      { merge: true }
    );
  }, []);

  const signIn = async () => {
    const auth = getAuthInstance();
    if (!auth) return;
    setAuthError(null);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (e) {
      setAuthError(
        e instanceof Error ? e.message : "Sign-in failed. Try again."
      );
    }
  };

  const signOutUser = async () => {
    const auth = getAuthInstance();
    if (!auth) return;
    setAuthError(null);
    await signOut(auth);
  };

  const handleSaveCard = (card: SuiteCard) => {
    const previous = cards;
    const exists = cards.some((c) => c.id === card.id);
    const next = exists
      ? cards.map((c) => (c.id === card.id ? card : c))
      : [...cards, card];
    setCards(next);
    setModalCard(null);
    void persistCards(next)
      .then(() => setSaveError(null))
      .catch(() => {
        setCards(previous);
        setSaveError("Could not save changes. Try again.");
      });
  };

  const handleDeleteCard = (id: string) => {
    const previous = cards;
    const next = cards.filter((c) => c.id !== id);
    setCards(next);
    setModalCard(null);
    void persistCards(next)
      .then(() => setSaveError(null))
      .catch(() => {
        setCards(previous);
        setSaveError("Could not remove. Try again.");
      });
  };

  const modalOpen = modalCard !== null;
  const modalEditing =
    modalCard === "new" ? null : modalCard === null ? null : modalCard;

  return (
    <div className="page">
      <header className="header">
        <div className="header-title-row">
          <h1 className="title">WhiteRock Suite</h1>
          {configured ? (
            <div className="header-auth" aria-label="Account">
              {canEdit ? (
                <>
                  <button
                    type="button"
                    className="header-auth-btn header-auth-add"
                    onClick={() => setModalCard("new")}
                    title="Add application"
                  >
                    +
                  </button>
                  <span
                    className="header-auth-email"
                    title={user?.email ?? ""}
                  >
                    {user?.email}
                  </span>
                  <button
                    type="button"
                    className="header-auth-btn header-auth-out"
                    onClick={() => void signOutUser()}
                    title="Sign out"
                  >
                    Out
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="auth-google-btn"
                  onClick={() => void signIn()}
                  title="Sign in with Google"
                  aria-label="Sign in with Google"
                >
                  <GoogleIcon />
                </button>
              )}
            </div>
          ) : null}
        </div>
        <p className="subtitle">Internal applications</p>
        {!configured ? (
          <p className="banner banner-muted">
            Editing and sign-in require Firebase env variables (
            <code className="inline-code">VITE_FIREBASE_*</code>). Visitors
            still see the default list.
          </p>
        ) : null}
        {authError ? <p className="banner banner-error">{authError}</p> : null}
        {saveError ? <p className="banner banner-error">{saveError}</p> : null}
      </header>

      <main className="main">
        {cards.length === 0 ? (
          <p className="empty-msg">
            No applications yet.
            {canEdit
              ? " Use the + control to add one."
              : " Authorized editors can sign in to add some."}
          </p>
        ) : (
          <ul className="grid" role="list">
            {cards.map((card) => (
              <li key={card.id} className="grid-item">
                <div className="card-shell">
                  {canEdit ? (
                    <button
                      type="button"
                      className="card-edit"
                      onClick={() => setModalCard(card)}
                      aria-label={`Edit ${card.title}`}
                    >
                      Edit
                    </button>
                  ) : null}
                  <a
                    className={
                      card.color ? "card card--accent" : "card"
                    }
                    style={
                      card.color
                        ? ({
                            "--card-accent": card.color,
                          } as CSSProperties)
                        : undefined
                    }
                    href={hrefForUrl(card.url)}
                    rel="noopener noreferrer"
                  >
                    <span className="card-name">{card.title}</span>
                  </a>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      <footer className="footer">
        <p className="footer-disclaimer">
          The applications available on this page are exclusively designed and
          developed for use by WhiteRock (Royal Enterprise) employees and
          authorized users. Any unauthorized access, use, or distribution is
          strictly prohibited. For authorization or support, please reach out
          to{" "}
          <a href="mailto:shravansuthar80@gmail.com">shravansuthar80@gmail.com</a>
          .
        </p>
      </footer>

      <CardModal
        open={modalOpen}
        card={modalEditing}
        onClose={() => setModalCard(null)}
        onSave={handleSaveCard}
        onDelete={handleDeleteCard}
      />
    </div>
  );
}
