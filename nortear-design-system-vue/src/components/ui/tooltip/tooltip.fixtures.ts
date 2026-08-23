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
