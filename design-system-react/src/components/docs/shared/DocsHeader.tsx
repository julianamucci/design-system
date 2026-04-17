import React from 'react';
import { Badge } from '@/components/ui/badge';

function isSafeUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['https:', 'http:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

interface DocsHeaderProps {
  category: 'Layout' | 'Navigation' | 'Form' | 'Feedback' | 'Display' | 'Overlay' | 'Interaction';
  complexity: 'Simples' | 'Composto' | 'Complexo';
  title: string;
  description: string;
  shadcnCommand?: string;
  figmaLink?: string;
  updatedAt?: string;
}

export function DocsHeader({
  category,
  complexity,
  title,
  description,
  shadcnCommand,
  figmaLink,
  updatedAt,
}: DocsHeaderProps) {
  return (
    <header className="space-y-4">
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="border-primary/20 text-primary">
          {category}
        </Badge>
        <Badge variant="outline" className="border-muted-foreground/20 text-muted-foreground">
          {complexity}
        </Badge>
      </div>
      <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
      <p className="text-xl text-muted-foreground">
        {description}
      </p>
      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
        {shadcnCommand && (
          <span>Shadcn/UI: <code className="bg-muted px-1.5 py-0.5 rounded text-foreground">{shadcnCommand}</code></span>
        )}
        {figmaLink && isSafeUrl(figmaLink) && (
          <span>Figma: <a href={figmaLink} target="_blank" rel="noreferrer" className="text-primary underline underline-offset-4">Ver no Figma</a></span>
        )}
        {updatedAt && (
          <span>Atualizado em: {updatedAt}</span>
        )}
      </div>
    </header>
  );
}
