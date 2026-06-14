import { useState, type ReactNode } from 'react';

export function AnimatedAccordion({
  question,
  children,
}: {
  question: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelId = `faq-${question.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
  return (
    <div className="rounded-[1.3rem] border border-slate-200 bg-white shadow-[0_10px_35px_rgb(15_23_42/0.05)]">
      <button
        aria-controls={panelId}
        aria-expanded={open}
        className="flex min-h-14 w-full items-center justify-between gap-4 p-5 text-left font-extrabold"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        {question}
        <span
          aria-hidden
          className={`text-xl text-[#087f8c] transition ${open ? 'rotate-45' : ''}`}
        >
          +
        </span>
      </button>
      <div
        className={`accordion-grid ${open ? 'is-open' : ''}`}
        id={panelId}
      >
        <div>
          <div className="px-5 pb-5 text-sm leading-7 text-slate-600">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
