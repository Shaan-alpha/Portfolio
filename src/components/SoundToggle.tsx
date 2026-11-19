"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { installSound, prefetchSound, setSoundOn, useSoundOn } from "@/lib/sound";

/** Mutes and unmutes the page. It also wires the page's sound, so a page
 *  without this toggle (the 404) plays none: no way to mute, no sound. */
export default function SoundToggle() {
  const on = useSoundOn();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => installSound(), []);

  const label = on ? "Turn sound off" : "Turn sound on";
  // A muted visitor has not downloaded uisfx; start on intent so unmuting
  // answers with its confirming click as soon as possible.
  const warm = () => {
    if (!on) prefetchSound();
  };

  return (
    <button
      type="button"
      onClick={() => setSoundOn(!on)}
      onPointerEnter={warm}
      onFocus={warm}
      aria-label={label}
      title={label}
      className="grid h-10 w-9 place-items-center rounded-[10px] text-ink-2 transition-colors hover:bg-ground-2 hover:text-ink md:w-10"
    >
      {/* Before mount the preference is unknown; an empty box keeps the layout still. */}
      {mounted ? on ? <Volume2 className="h-[18px] w-[18px]" /> : <VolumeX className="h-[18px] w-[18px]" /> : null}
    </button>
  );
}
