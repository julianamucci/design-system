import React from 'react';
import { Card } from '@/components/ui/card';

export function ComponentDemo({ children }: { children: React.ReactNode }) {
  return (
    // As classes aqui eram Tailwind (`flex items-center justify-center p-4 mt-2
    // bg-background`), inertes desde a migração para `.nds-*`: o container
    // renderizava sem padding, sem centralização e sem superfície própria.
    <Card className="nds-cluster nds-p-4 nds-mt-2 nds-bg-background" data-justify="center" data-docs-preview="demonstracao">
      {children}
    </Card>
  );
}
