import type { ReactNode } from "react";
import { AREA_CLICK_DIREITO } from "@shared/testing/context-menu-area";
import { ContextMenuTrigger } from "./context-menu";

// Fixture compartilhada pelas stories do ContextMenu.
//
// Fica fora dos `*.stories.tsx` porque no CSF todo export nomeado é lido como
// story: um helper exportado de um arquivo de story apareceria na sidebar como
// se fosse um exemplo.
//
// As duas cópias que existiam eram idênticas — o que é justamente o risco: a
// área é o alvo de TODA play do slug (`data-testid="area"` é por onde o gesto
// de clique direito entra), e mudar o gancho numa cópia deixaria o outro
// arquivo apontando para um alvo que não existe mais.

/** A área de clique direito das demonstrações, com o gancho que as plays usam. */
export function AreaTrigger({ children }: { children: ReactNode }) {
  return (
    <ContextMenuTrigger
      className={AREA_CLICK_DIREITO}
      data-align="center"
      data-justify="center"
      data-testid="area"
    >
      {children}
    </ContextMenuTrigger>
  );
}
