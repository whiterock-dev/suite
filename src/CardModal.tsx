import { useEffect, useState, type FormEvent } from "react";
import type { SuiteCard } from "./types";

type Props = {
  open: boolean;
  card: SuiteCard | null;
  onClose: () => void;
  onSave: (card: SuiteCard) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function CardModal({ open, card, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const isEdit = Boolean(card?.id);

  useEffect(() => {
    if (!open) return;
    setLocalError(null);
    if (card) {
      setTitle(card.title);
      setDescription(card.description);
      setUrl(card.url);
    } else {
      setTitle("");
      setDescription("");
      setUrl("");
    }
  }, [open, card]);

  if (!open) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const t = title.trim();
    const u = url.trim();
    if (!t) {
      setLocalError("Title is required.");
      return;
    }
    if (!u) {
      setLocalError("URL is required.");
      return;
    }
    setSaving(true);
    setLocalError(null);
    try {
      const next: SuiteCard = {
        id: card?.id ?? crypto.randomUUID(),
        title: t,
        description: description.trim(),
        url: u,
      };
      await onSave(next);
    } catch {
      setLocalError("Save failed. Check your connection and permissions.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!card?.id) return;
    if (!window.confirm("Remove this application from the suite?")) return;
    setDeleting(true);
    setLocalError(null);
    try {
      await onDelete(card.id);
    } catch {
      setLocalError("Delete failed. Check your connection and permissions.");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="card-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 id="card-modal-title" className="modal-title">
            {isEdit ? "Edit application" : "Add application"}
          </h2>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          {localError ? <p className="modal-error">{localError}</p> : null}
          <label className="field">
            <span className="field-label">Title</span>
            <input
              className="field-input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="field">
            <span className="field-label">Description</span>
            <textarea
              className="field-input field-textarea"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </label>
          <label className="field">
            <span className="field-label">URL</span>
            <input
              className="field-input"
              type="text"
              inputMode="url"
              placeholder="https://example.whiterock.co.in"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              autoComplete="off"
            />
          </label>
          <div className="modal-actions">
            {isEdit ? (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={saving || deleting}
              >
                {deleting ? "Removing…" : "Remove"}
              </button>
            ) : (
              <span />
            )}
            <div className="modal-actions-right">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
                disabled={saving || deleting}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={saving || deleting}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
