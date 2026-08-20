import { userEvent, waitFor, expect } from 'storybook/test';

/**
 * Painel de exemplo do Tabs — um construtor, quatro arquivos de story.
 *
 * O módulo existe porque num `*.stories.ts` todo export nomeado vira story: a
 * função exportada de um deles apareceria como uma aba fantasma na barra
 * lateral. Sem lugar para morar, ela foi copiada quatro vezes — e a cópia de
 * `tabs-composicoes` perdeu `nds-text-muted-foreground` pelo caminho.
 *
 * O texto é o mesmo tipo de conteúdo de preenchimento nos quatro arquivos
 * ("Mostrando todos os itens." e irmãs), então a divergência era acidental, e a
 * versão que ficou é a de três dos quatro: COM `nds-text-muted-foreground`. Só
 * `tabs-composicoes` muda de aparência, e nenhuma play de lá mede classe ou cor
 * do painel.
 */

/** Painel de conteúdo da aba — a moldura de preenchimento das stories. */
export function makePanel(text: string): HTMLElement {
  const p = document.createElement('div');
  p.className =
    'nds-text-body nds-text-muted-foreground nds-p-4 nds-rounded-md nds-border-default nds-bg-card';
  p.textContent = text;
  return p;
}

/**
 * Ativa uma aba de forma idempotente: só clica quando ela ainda não está ativa.
 *
 * O painel Interactions reexecuta a play no mesmo DOM — clique cego inverteria
 * o estado a cada rodada. Estava copiada em três arquivos de story, idêntica no
 * corpo; só o comentário variava de tamanho.
 */
export async function ativar(aba: HTMLElement): Promise<void> {
  if (aba.getAttribute('aria-selected') !== 'true') await userEvent.click(aba);
  await waitFor(() => expect(aba).toHaveAttribute('aria-selected', 'true'));
}
