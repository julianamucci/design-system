import { getContext, setContext } from 'svelte';

/**
 * Liga o gatilho ao balão — o que o `bits-ui` começa e não termina.
 *
 * A lib escreve `aria-describedby` no gatilho a partir de `contentNode.id`, mas
 * NUNCA renderiza `id` no elemento do balão: `PopperLayer` e `PopperLayerInner`
 * tiram `id` das props antes de chegar ao snippet, e o estado do conteúdo
 * flutuante só publica `data-side`, `data-align` e `style`. Como `Element.id` de
 * um nó sem id devolve string vazia, o gatilho fica com `aria-describedby=""` —
 * atributo presente, descrição inalcançável, e valor inválido para o axe.
 *
 * As outras quatro stacks entregam o par id/describedby sozinhas. Aqui ele é
 * montado por fora: a raiz gera o id e publica abertura e montagem, o conteúdo
 * carimba o id no nó e avisa que montou, e o gatilho escreve o atributo depois.
 *
 * `montado` existe por causa da ORDEM: o gatilho só pode escrever o atributo
 * depois de a lib ter escrito o dela, e a escrita da lib acontece no flush em
 * que o balão monta. Depender de `montado` põe o efeito do gatilho nesse mesmo
 * flush, e efeitos de usuário rodam depois dos de render — é o que faz a nossa
 * ser a última palavra.
 */
export type TooltipDescription = {
  readonly id: string;
  readonly aberto: boolean;
  readonly montado: boolean;
  marcarMontado(valor: boolean): void;
};

const CHAVE = Symbol('nds-tooltip-descricao');

export function fornecerDescription(descricao: TooltipDescription): void {
  setContext(CHAVE, descricao);
}

export function usarDescription(): TooltipDescription | undefined {
  return getContext<TooltipDescription | undefined>(CHAVE);
}
