import React from 'react';
import { Badge } from '@/components/ui/badge';
import { LanguageSwitcher } from '@/components/product/LanguageSwitcher';

export interface DocsHeaderProps {
  title: string;
  description: string;
  category: string;
  type: string;
  installNote?: string;
}

export function DocsHeader({ title, description, category, type, installNote }: DocsHeaderProps) {
  return (
    <header className="ds-docs mb-12 border-b pb-8 border-border/50">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-primary/5 text-primary border-primary/10 hover:bg-primary/5 font-medium px-2 py-0"
          >
            {category}
          </Badge>
          <Badge variant="outline" className="text-muted-foreground font-normal px-2 py-0">
            {type}
          </Badge>
        </div>
        <LanguageSwitcher />
      </div>

      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-foreground">{title}</h1>
        <p className="text-muted-foreground text-lg max-w-3xl leading-relaxed">{description}</p>
      </div>

      {installNote && (
        <div className="mt-6 flex items-center gap-3 text-sm text-muted-foreground/80">
          <span className="flex items-center gap-1.5">
            <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono border border-border/50">
              {installNote}
            </code>
          </span>
        </div>
      )}
    </header>
  );
}
