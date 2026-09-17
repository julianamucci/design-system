/**
 * Um painel por vez — a modalidade do Sheet, na forma que esta stack alcança.
 *
 * O Sheet é MODAL: dois painéis ao mesmo tempo escondem o de baixo atrás do véu
 * do de cima e criam duas armadilhas de foco na mesma tela. O Vanilla, que é a
 * referência do contrato, fecha o painel anterior ao abrir outro
 * (`sheet.ts:231-237`, `:342`) e relata `api` — ninguém dispensou aquele painel,
 * foi o componente que o recolheu. A bits-ui, como as outras três libs, empilha.
 *
 * Por que um registro de módulo e não um contexto de componente: os painéis que
 * disputam a tela não têm ancestral comum nenhum — na docs page são quinze
 * `<Sheet>` irmãos espalhados por seções diferentes, e no produto são pedaços de
 * telas distintas. Quem precisa ser único é a TELA, e o módulo é o que tem esse
 * alcance.
 *
 * Nada aqui toca em DOM: o registro decide QUEM sai, e quem sabe sair é o
 * próprio painel, pelo `dismiss` que ele registra.
 */

/** O painel que está na tela, e o que ele faz quando outro toma o lugar dele. */
export interface OpenSheetPanel {
  /**
   * Recolhe este painel.
   *
   * Quem implementa avisa `onOpenChange(false)` junto: o painel que sai da TELA
   * tem de sair também do relatório, senão a série de abre/fecha do GA4 não
   * fecha a conta — foi esse o defeito medido no Vanilla em 2026-09-11.
   */
  dismiss(): void;
}

let current: OpenSheetPanel | null = null;

/**
 * Anuncia que este painel abriu, recolhendo o que estava na tela.
 *
 * A ORDEM importa, e é a mesma do Vanilla: o novo entra no registro ANTES de o
 * anterior sair. Recolher o anterior dispara o `release` dele, e se o registro
 * ainda apontasse para ele esse `release` apagaria o painel recém-chegado —
 * ficaria aberto na tela e ausente do registro, que é o estado em que o
 * PRÓXIMO painel não recolhe ninguém.
 */
export function claimOpenSheet(panel: OpenSheetPanel): void {
  const previous = current;
  current = panel;
  if (previous && previous !== panel) previous.dismiss();
}

/**
 * Anuncia que este painel saiu da tela — fechado, ou desmontado.
 *
 * Só solta se ele AINDA for o painel da vez: um `release` atrasado de quem já
 * foi substituído não pode derrubar o registro de quem está na tela.
 *
 * Soltar NÃO é fechar, e por isso esta função não avisa ninguém: desmontar um
 * painel aberto (a troca de idioma de uma docs page é exatamente isso) emitiria
 * um fechamento que ninguém provocou.
 */
export function releaseOpenSheet(panel: OpenSheetPanel): void {
  if (current === panel) current = null;
}
