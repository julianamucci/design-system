import React from 'react';
import { ComponentDemo } from '@/components/ComponentDemo';

export interface DocsDemonstrationProps {
  title: string;
  children: React.ReactNode;
}

export function DocsDemonstration({ title, children }: DocsDemonstrationProps) {
  return (
    <section id="demonstracao">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <ComponentDemo>{children}</ComponentDemo>
    </section>
  );
}
