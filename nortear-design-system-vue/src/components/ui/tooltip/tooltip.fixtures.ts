// Caminho até o balão, compartilhado pelas quatro stories do Tooltip.
//
// Fica fora do arquivo de story porque no CSF todo export nomeado vira story:
// um helper exportado apareceria na sidebar como se fosse um exemplo.
//
// Eram QUATRO cópias idênticas, cada uma com um pedaço diferente da explicação
// do porquê. A consulta depende de um detalhe de implementação da lib headless
// (onde ela põe o id do `aria-describedby`): no dia em que esse detalhe mudar,
// uma cópia esquecida derruba uma suíte inteira sem que nada da story mude.

/**
 * O balão vive num portal no `body` — o caminho até ele é o aria-describedby.
 *
 * A lib põe o id referenciado num `<span>` de leitura DENTRO do balão (uma
 * cópia acessível do texto, que é também por que `textContent` vem duplicado),
 * então subir até o `[data-slot="tooltip-content"]` é o que devolve o balão em
 * si — e continua correto onde o id está no próprio balão.
 */
export function balaoDe(trigger: HTMLElement): HTMLElement | null {
  const id = trigger.getAttribute('aria-describedby');
  const target = id ? document.getElementById(id) : null;
  return target?.closest<HTMLElement>('[data-slot="tooltip-content"]') ?? null;
}

/**
 * De que lado o balão nasceu — o gancho `data-side` que o CSS lê.
 *
 * Aqui pelo mesmo motivo do `balaoDe`: eram três cópias, uma por arquivo de
 * story. O atributo pode estar no próprio balão ou no invólucro que o
 * posicionador escreve, e `closest` cobre os dois — detalhe de lib, que muda
 * num lugar só no dia em que a lib mudar.
 */
export function sideOf(balao: HTMLElement | null): string | null {
  return balao?.closest('[data-side]')?.getAttribute('data-side') ?? null;
}

/** O vão que `side-offset` e seta somam entre o gatilho e o balão. */
export const ARROW_GAP = 9;

/**
 * Espaço livre entre o gatilho e a borda da JANELA, do lado pedido.
 *
 * Contra a janela, e não contra o contêiner da story: é a janela que o
 * posicionador usa como limite para decidir se vira o balão.
 */
export function spaceOnSide(trigger: HTMLElement, side: string): number {
  const r = trigger.getBoundingClientRect();
  if (side === 'top') return r.top;
  if (side === 'bottom') return window.innerHeight - r.bottom;
  if (side === 'left') return r.left;
  return window.innerWidth - r.right;
}

/** Quanto o balão ocupa no eixo do lado pedido — altura ou largura. */
export function sizeOnAxis(balao: HTMLElement, side: string): number {
  const r = balao.getBoundingClientRect();
  return side === 'top' || side === 'bottom' ? r.height : r.width;
}
