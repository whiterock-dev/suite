import { useEffect, useState, type FormEvent } from "react";
import { FALLBACK_COLOR_PICKER, parseCardColor } from "./colorUtils";
import type { SuiteCard } from "./types";

type Props = {
  open: boolean;
  card: SuiteCard | null;
  onClose: () => void;
  onSave: (card: SuiteCard) => void;
  onDelete: (id: string) => void;
};

export function CardModal({ open, card, onClose, onSave, onDelete }: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [url, setUrl] = useState("");
  const [useAccent, setUseAccent] = useState(false);
  const [hex, setHex] = useState(FALLBACK_COLOR_PICKER);
  const [localError, setLocalError] = useState<string | null>(null);

  const isEdit = Boolean(card?.id);

  useEffect(() => {
    if (!open) return;
    setLocalError(null);
    if (card) {
      setTitle(card.title);
      setDescription(card.description);
      setUrl(card.url);
      const parsed = parseCardColor(card.color);
      if (parsed) {
        setUseAccent(true);
        setHex(parsed);
      } else {
        setUseAccent(false);
        setHex(FALLBACK_COLOR_PICKER);
      }
    } else {
      setTitle("");
      setDescription("");
      setUrl("");
      setUseAccent(false);
      setHex(FALLBACK_COLOR_PICKER);
    }
  }, [open, card]);

  if (!open) return null;

  function handleSubmit(e: FormEvent) {
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
    setLocalError(null);
    const next: SuiteCard = {
      id: card?.id ?? crypto.randomUUID(),
      title: t,
      description: description.trim(),
      url: u,
    };
    if (useAccent) {
      const c = parseCardColor(hex);
      if (!c) {
        setLocalError("Enter a valid hex color (e.g. #3b82f6).");
        return;
      }
      next.color = c;
    }
    onSave(next);
  }

  function handleDelete() {
    if (!card?.id) return;
    if (!window.confirm("Remove this application from the suite?")) return;
    setLocalError(null);
    onDelete(card.id);
  }

  function onHexTextChange(value: string) {
    setHex(value);
    if (parseCardColor(value)) setUseAccent(true);
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
          <div className="field">
            <span className="field-label">Box color</span>
            <div className="field-color-row">
              <input
                type="color"
                className="field-color-picker"
                disabled={!useAccent}
                value={parseCardColor(hex) ?? FALLBACK_COLOR_PICKER}
                onChange={(e) => {
                  setUseAccent(true);
                  setHex(e.target.value);
                }}
                aria-label="Pick accent color"
              />
              <input
                className="field-input field-color-hex"
                type="text"
                placeholder="#3b82f6"
                disabled={!useAccent}
                value={hex}
                onChange={(e) => onHexTextChange(e.target.value)}
                spellCheck={false}
                autoComplete="off"
              />
              <label className="field-color-default">
                <input
                  type="checkbox"
                  checked={!useAccent}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setUseAccent(false);
                    } else {
                      setUseAccent(true);
                    }
                  }}
                />
                Default (no color)
              </label>
            </div>
          </div>
          <div className="modal-actions">
            {isEdit ? (
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
              >
                Remove
              </button>
            ) : (
              <span />
            )}
            <div className="modal-actions-right">
              <button type="button" className="btn btn-ghost" onClick={onClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
