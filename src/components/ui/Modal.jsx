import { useEffect } from "react";
import Icon from "./Icon";
import "./Modal.css";

export default function Modal({ open, title, onClose, children, footer, width = 520 }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose?.();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal__overlay" onClick={onClose}>
      <div className="modal card" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <h3>{title}</h3>
          <button className="modal__close" onClick={onClose} aria-label="Fechar"><Icon name="plus" size={20} style={{ transform: "rotate(45deg)" }} /></button>
        </div>
        <div className="modal__body">{children}</div>
        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
}
