import React from 'react';

interface AnatomyItem {
  name: string;
  description: string;
  component?: string;
}

interface AnatomyProps {
  items: AnatomyItem[];
  tree?: string;
}

export function Anatomy({ items, tree }: AnatomyProps) {
  return (
    <div className="space-y-8">
      {/* Lista de partes numeradas */}
      <div className="space-y-4">
        <ol className="space-y-4">
          {items.map((item, index) => (
            <li key={item.name} className="flex gap-4 items-start">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                {index + 1}
              </span>
              <div className="space-y-1">
                <p className="text-sm font-semibold leading-none">
                  {item.name}
                  {item.component && (
                    <code className="ml-2 text-[10px] bg-muted px-1 py-0.5 rounded text-muted-foreground font-mono">
                      {item.component}
                    </code>
                  )}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* Árvore de subcomponentes */}
      {tree && (
        <div className="bg-muted/50 rounded-xl p-6 border border-border/50">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">Estrutura de Subcomponentes</p>
          <pre className="text-sm font-mono overflow-x-auto">
            {tree}
          </pre>
        </div>
      )}
    </div>
  );
}
