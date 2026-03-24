import { useCallback, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { CardModal } from "./CardModal";
import { DEFAULT_CARDS } from "./defaultCards";
import { getAuthInstance, getDb, isFirebaseConfigured } from "./firebase";
import type { SuiteCard } from "./types";
import { hostLabel, hrefForUrl } from "./urls";

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
      return { id, title, description, url };
    })
    .filter((x): x is SuiteCard => x !== null);
}

export default function App() {
  const [cards, setCards] = useState<SuiteCard[]>(DEFAULT_CARDS);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [modalCard, setModalCard] = useState<SuiteCard | "new" | null>(null);

  const configured = isFirebaseConfigured();
  const canEdit = configured && Boolean(user);

  useEffect(() => {
    const auth = getAuthInstance();
    if (!auth) {
      setUser(null);
      return;
    }
    return onAuthStateChanged(auth, setUser);
  }, [configured]);

  useEffect(() => {
    const db = getDb();
    if (!db) {
      setCards(DEFAULT_CARDS);
      setLoading(false);
      return;
    }
    const docRef = doc(db, "suite", "cards");
    const unsub = onSnapshot(
      docRef,
      (snap) => {
        if (!snap.exists()) {
          setCards(DEFAULT_CARDS);
          setLoading(false);
          return;
        }
        const raw = snap.data()?.cards;
        if (Array.isArray(raw)) {
          const next = normalizeCards(raw);
          setCards(next);
        } else {
          setCards(DEFAULT_CARDS);
        }
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setSaveError(err.message);
        setCards(DEFAULT_CARDS);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [configured]);

  const persistCards = useCallback(
    async (next: SuiteCard[]) => {
      const db = getDb();
      const auth = getAuthInstance();
      if (!db || !auth?.currentUser) return;
      setSaveError(null);
      await setDoc(
        doc(db, "suite", "cards"),
        { cards: next, updatedAt: serverTimestamp() },
        { merge: true }
      );
    },
    []
  );

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

  const handleSaveCard = async (card: SuiteCard) => {
    const exists = cards.some((c) => c.id === card.id);
    const next = exists
      ? cards.map((c) => (c.id === card.id ? card : c))
      : [...cards, card];
    await persistCards(next);
    setModalCard(null);
  };

  const handleDeleteCard = async (id: string) => {
    const next = cards.filter((c) => c.id !== id);
    await persistCards(next);
    setModalCard(null);
  };

  const modalOpen = modalCard !== null;
  const modalEditing =
    modalCard === "new" ? null : modalCard === null ? null : modalCard;

  return (
    <div className="page">
      <header className="header">
        <div className="header-row">
          <div className="header-text">
            <h1 className="title">Whiterock Suite</h1>
            <p className="subtitle">Internal applications</p>
          </div>
          <div className="toolbar">
            {configured && canEdit ? (
              <>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  onClick={() => setModalCard("new")}
                >
                  Add application
                </button>
                <span className="toolbar-user" title={user?.email ?? ""}>
                  {user?.email}
                </span>
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => void signOutUser()}
                >
                  Sign out
                </button>
              </>
            ) : null}
            {configured && !user ? (
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => void signIn()}
              >
                Sign in with Google
              </button>
            ) : null}
          </div>
        </div>
        {!configured ? (
          <p className="banner banner-muted">
            Editing and sign-in require Firebase env variables (
            <code className="inline-code">VITE_FIREBASE_*</code>). Visitors
            still see the default list.
          </p>
        ) : null}
        {configured && !user ? (
          <p className="banner banner-muted">
            Sign in with Google to edit links, descriptions, or add applications.
          </p>
        ) : null}
        {authError ? <p className="banner banner-error">{authError}</p> : null}
        {saveError ? <p className="banner banner-error">{saveError}</p> : null}
      </header>

      <main className="main">
        {loading ? (
          <p className="loading-msg">Loading…</p>
        ) : cards.length === 0 ? (
          <p className="empty-msg">
            No applications yet.
            {canEdit
              ? " Use “Add application” to create one."
              : " Sign in to add some."}
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
                    className="card"
                    href={hrefForUrl(card.url)}
                    rel="noopener noreferrer"
                  >
                    <span className="card-name">{card.title}</span>
                    <span className="card-desc">{card.description}</span>
                    <span className="card-host">{hostLabel(card.url)}</span>
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
