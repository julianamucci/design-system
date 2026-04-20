import React from 'react';

export interface DocsImportProps {
  title: string;
  description?: string;
  code: string;
  secondaryCode?: string;
  secondaryDescription?: string;
}

export function DocsImport({ title, description, code, secondaryCode, secondaryDescription }: DocsImportProps) {
  return (
    <section id="importacao">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      {description && <p className="text-sm text-muted-foreground mb-3">{description}</p>}
      <div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto">
        <code className="whitespace-pre">{code}</code>
      </div>
      {secondaryCode && (
        <>
          {secondaryDescription && (
            <p className="text-sm text-muted-foreground mt-4 mb-3">{secondaryDescription}</p>
          )}
          <div className="bg-muted p-4 rounded-lg font-mono text-sm border overflow-x-auto mt-3">
            <code className="whitespace-pre">{secondaryCode}</code>
          </div>
        </>
      )}
    </section>
  );
}
