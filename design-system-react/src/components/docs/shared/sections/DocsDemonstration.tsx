import React from 'react';
import { ComponentDemo } from '@/components/ComponentDemo';

export interface DocsDemonstrationProps {
  title: string;
  children: React.ReactNode;
  /**
   * Slug do componente para tracking GA4 (ex.: "alert", "button"). Informativo —
   * este container não injeta `data-track*` nos elementos internos porque estes
   * vêm via `children` e são controlados pela docs page. Consumidores devem
   * aplicar manualmente os atributos nos triggers interativos dentro do slot:
   *
   * @example
   * <DocsDemonstration title="..." componentSlug="alert">
   *   <Button data-track="demo" data-track-id="alert:demo:save" data-track-label="Salvar">
   *     Salvar
   *   </Button>
   * </DocsDemonstration>
   *
   * O observer global do DocsPageLayout captura o click via `.closest('[data-track]')`.
   * Se ausente, o tracking pode ser desabilitado para esta docs page.
   */
  componentSlug?: string;
}

export function DocsDemonstration({ title, children }: DocsDemonstrationProps) {
  return (
    <section id="demonstracao">
      <h2 className="text-xl font-semibold mb-4">{title}</h2>
      <ComponentDemo>{children}</ComponentDemo>
    </section>
  );
}
