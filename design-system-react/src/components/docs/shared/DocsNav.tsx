import React, { useEffect, useState } from "react";

export interface DocSection {
  id: string;
  label: string;
  block: number;
}

interface DocsNavProps {
  sections: readonly DocSection[];
}

const blockLabels: Record<number, string> = {
  1: "Visão Geral",
  2: "Referência Técnica",
  3: "Contexto",
  4: "Qualidade",
};

function useActiveSection(ids: string[]) {
  const [activeId, setActiveId] = useState<string>(ids[0]);

  useEffect(() => {
    const observers = ids.map((id) => {
      const el = document.getElementById(id);
      if (!el) return null;
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setActiveId(id); },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
      );
      observer.observe(el);
      return observer;
    });
    return () => observers.forEach((obs) => obs?.disconnect());
  }, [ids]);

  return activeId;
}

export function DocsNav({ sections }: DocsNavProps) {
  const ids = sections.map((s) => s.id);
  const activeId = useActiveSection(ids);
  const blocks = Array.from(new Set(sections.map(s => s.block))).sort((a, b) => a - b);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      const offset = 80; // Account for the sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth"
      });
    }
  };

  return (
    <nav
      aria-label="Navegação das seções do componente"
      className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b border-border -mx-8 px-8 py-3 mb-8"
    >
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        {blocks.map((block) => (
          <div key={block} className="flex items-center gap-1">
            <span className="hidden lg:inline text-[10px] uppercase tracking-wider text-muted-foreground mr-1 font-bold">
              {blockLabels[block]}:
            </span>

            {sections
              .filter((s) => s.block === block)
              .map((section, index, arr) => (
                <span key={section.id} className="flex items-center gap-1">
                  <button
                    onClick={() => scrollTo(section.id)}
                    aria-current={activeId === section.id ? "location" : undefined}
                    className={[
                      "text-xs px-2 py-1 rounded-md transition-colors",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1",
                      activeId === section.id
                        ? "bg-primary text-primary-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted",
                    ].join(" ")}
                  >
                    {section.label}
                  </button>
                  {index < arr.length - 1 && (
                    <span className="text-border text-xs" aria-hidden="true">·</span>
                  )}
                </span>
              ))}

            {block < Math.max(...blocks) && (
              <span className="text-muted-foreground/40 ml-2 text-sm" aria-hidden="true">|</span>
            )}
          </div>
        ))}
      </div>
    </nav>
  );
}
