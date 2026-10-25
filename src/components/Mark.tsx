/** The site mark: two plates of the stack with the model between them as a
 *  small yellow block, not a plate of its own. The hero model at 24px. */
export default function Mark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className={className}>
      <path d="M2 18.5 12 13.5 22 18.5 12 23.5Z" fill="currentColor" />
      <path d="M7 11.5 12 9 17 11.5 12 14Z" fill="var(--model)" />
      <path d="M7 11.5 12 14V18.5L7 16Z" fill="var(--model-edge)" />
      <path d="M12 14 17 11.5V16L12 18.5Z" fill="var(--model)" />
      <path d="M12 14 17 11.5V16L12 18.5Z" fill="#000" fillOpacity={0.12} />
      <path d="M2 5.5 12 0.5 22 5.5 12 10.5Z" fill="currentColor" stroke="var(--ground)" strokeWidth="1.25" strokeLinejoin="round" />
    </svg>
  );
}
