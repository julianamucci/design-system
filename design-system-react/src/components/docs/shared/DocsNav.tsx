import React from 'react';

export interface DocsNavSection {
  id: string;
  label: string;
}

export interface DocsNavGroup {
  label: string;
  sections: DocsNavSection[];
}

export interface DocsNavProps {
  groups: DocsNavGroup[];
  activeSection?: string;
}

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function DocsNav({ groups, activeSection }: DocsNavProps) {
  return (
    <div className="space-y-6">
      {groups.map((group) => (
        <div key={group.label}>
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">
            {group.label}
          </p>
          <ul className="list-none space-y-1 p-0 m-0">
            {group.sections.map((section) => {
              const isActive = activeSection === section.id;
              return (
                <li key={section.id} className="list-none">
                  <button
                    type="button"
                    onClick={() => scrollTo(section.id)}
                    aria-current={isActive ? 'location' : undefined}
                    className={[
                      'w-full text-left px-2 py-1.5 text-sm rounded-md transition-colors',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
                    ].join(' ')}
                  >
                    {section.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
