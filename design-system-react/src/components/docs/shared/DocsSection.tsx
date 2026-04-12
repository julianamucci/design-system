import React from 'react';
import { cn } from '@/lib/utils';

interface DocsSectionProps {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  noSeparator?: boolean;
}

export function DocsSection({ id, title, description, children, className, noSeparator }: DocsSectionProps) {
  return (
    <section id={id} className={cn("space-y-4 scroll-mt-24", className)}>
      {!noSeparator && <hr className="border-border my-12" />}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
        {description && (
          <p className="text-muted-foreground">{description}</p>
        )}
      </div>
      <div>
        {children}
      </div>
    </section>
  );
}
