/** A still of one shot for the current theme: what visitors see while the 3D
 *  loads, and all they get without WebGL or with Save-Data on. A server
 *  component, passed into the stage, so its markup never ships as client JS. */
export default function Still({ shot, className }: { shot: string; className?: string }) {
  return (
    <div className={className} aria-hidden>
      {(["light", "dark"] as const).map((theme) => (
        <picture key={theme} className={theme === "light" ? "dark:hidden" : "hidden dark:block"}>
          <source srcSet={`/stills/${shot}-${theme}.avif`} type="image/avif" />
          {/* Lazy, so the theme that is display: none is never downloaded. */}
          <img
            src={`/stills/${shot}-${theme}.webp`}
            alt=""
            width={1600}
            height={1200}
            loading="lazy"
            decoding="async"
            className="h-full w-full object-cover"
          />
        </picture>
      ))}
    </div>
  );
}
