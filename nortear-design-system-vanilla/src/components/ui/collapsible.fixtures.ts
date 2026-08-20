/**
 * Andaime das demonstrações do Collapsible — um construtor, dois arquivos.
 *
 * Este módulo existe porque num `*.stories.ts` todo export nomeado vira story:
 * o andaime não pode ser exportado de lá, e a saída fácil é copiar a `function`
 * para cada arquivo. Cópia divergida não é variação — é o defeito, porque
 * corrigir uma delas deixa a outra errada sem nenhum sinal.
 *
 * Aqui nada variava: `makeContent` e `PAINEL_CLASSES` estavam idênticas em
 * composições e estados. É dívida mecânica, e veio como estava — o painel de
 * composições monta conteúdo próprio em duas stories, e por isso a constante
 * também é exportada.
 */

/** Moldura do painel aberto: mesma borda, mesmo fundo e mesmo respiro em toda demonstração. */
export const PAINEL_CLASSES =
  'nds-stack nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-mt-2';

/** Painel com um parágrafo por item. */
export function makeContent(items: string[]): HTMLElement {
  const div = document.createElement('div');
  div.className = PAINEL_CLASSES;
  div.dataset.spacing = 'sm';
  for (const text of items) {
    const p = document.createElement('p');
    p.textContent = text;
    div.appendChild(p);
  }
  return div;
}
