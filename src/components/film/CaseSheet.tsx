"use client";

import { useEffect, useRef } from "react";
import { play } from "@/lib/sound";

/** "Read the case study": the rest of a system's case study, in a sheet over
 *  its scene. A modal dialog, so the page behind is inert; it does not scroll
 *  either, and the film's wheel handler stands aside while the sheet is open.
 *  Escape, Close or a click outside the panel close it, and focus returns to
 *  the key that opened it. It sounds like the menu as it opens and closes. */
export default function CaseSheet({ id, name, children }: { id: string; name: string; children: React.ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const overflow = useRef("");
  // Whether the press that ends in a click began on the backdrop: a text
  // selection dragged out of the panel must not close it.
  const pressedOutside = useRef(false);

  // However it closes (Escape, Close, the backdrop), one handler hands the
  // page back.
  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    const onClose = () => {
      document.documentElement.style.overflow = overflow.current;
      play("close");
      opener.current?.focus({ preventScroll: true });
    };
    d.addEventListener("close", onClose);
    return () => d.removeEventListener("close", onClose);
  }, []);

  const open = () => {
    const d = dialog.current;
    if (!d || d.open) return;
    overflow.current = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    d.showModal();
    play("open");
  };

  // A click on the backdrop lands on the dialog itself, outside its panel.
  const outside = (e: React.MouseEvent<HTMLDialogElement>) => {
    const d = dialog.current;
    if (!d || e.target !== d) return false;
    const r = d.getBoundingClientRect();
    return e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
  };
  const onPress = (e: React.MouseEvent<HTMLDialogElement>) => {
    pressedOutside.current = outside(e);
  };
  const onBackdrop = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (pressedOutside.current && outside(e)) dialog.current?.close();
    pressedOutside.current = false;
  };

  return (
    <>
      <button ref={opener} type="button" data-sfx="" aria-haspopup="dialog" className="key key-primary key-sm" onClick={open}>
        Read the case study
      </button>
      <dialog ref={dialog} aria-labelledby={`${id}-sheet-title`} className="sheet" onMouseDown={onPress} onClick={onBackdrop}>
        <div className="sheet-head">
          <h2 id={`${id}-sheet-title`} className="t-h3 text-ink">
            {name}
          </h2>
          <button type="button" data-sfx="" className="key key-secondary key-sm" onClick={() => dialog.current?.close()}>
            Close
          </button>
        </div>
        <div className="sheet-body">{children}</div>
      </dialog>
    </>
  );
}
