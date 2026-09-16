/**
 * Fixtures do Tooltip — o caminho até o balão, a limpeza do portal e a moldura
 * que reserva espaço para ele abrir.
 *
 * O módulo existe porque num `*.stories.ts` todo export nomeado vira story: a
 * função exportada de um deles apareceria como uma aba fantasma na barra
 * lateral. Sem lugar para morar, `balaoDe` e `clearPortal` foram copiadas nos
 * quatro arquivos de story e `wrap` em três.
 *
 * O que variava: a altura mínima da moldura. Composições reservam 200px porque a
 * composição é maior; estados e variantes ficam em 180px. Não é acidente — virou
 * parâmetro, com 180px de padrão, e cada call site passa a sua medida.
 */

export type Side = 'top' | 'right' | 'bottom' | 'left';

/** O balão vive num portal no `body` — o caminho até ele é o aria-describedby. */
export function balaoDe(trigger: HTMLElement): HTMLElement | null {
  const id = trigger.getAttribute('aria-describedby');
  const target = id ? document.getElementById(id) : null;
  return target?.closest<HTMLElement>('[data-slot="tooltip-content"]') ?? null;
}

/**
 * Espera o `data-side` chegar ao lado ESPERADO, e devolve o balão.
 *
 * Mora aqui, e não num arquivo de story, porque DUAS o usam — a cena dos quatro
 * lados e a da colisão, em `-compositions`, mais as variantes que fotografam o
 * balão aberto. Copiada, ela seria a mesma função com dois donos, que é o que
 * `fixture_duplicada_entre_stories` existe para reprovar.
 *
 * Afirmar logo depois de o balão existir lê o valor errado: o atributo nasce com
 * o lado PEDIDO e só vira no instante em que o posicionador mede. A asserção
 * passaria pelo primeiro paint — inclusive quando o flip deveria ter virado o
 * painel —, que é a forma de portão sem dentes que esta rodada existe para matar.
 *
 * Laço de RELÓGIO, e não `waitFor`: a condição é leitura pura (`getAttribute`),
 * mas `waitFor` reagenda por observador de mutação e qualquer vizinho que mexa
 * no DOM realimenta o laço. O prazo estoura em erro NOMEADO, dizendo o último
 * lado visto — sem isso a falha chega como "timeout" e não distingue "não virou"
 * de "não abriu".
 */
export async function aguardarLado(
  trigger: HTMLElement,
  esperado: Side,
  prazoMs = 2000,
): Promise<HTMLElement> {
  const fim = performance.now() + prazoMs;
  for (;;) {
    const balao = balaoDe(trigger);
    const visto = balao?.getAttribute('data-side') ?? null;
    if (balao && visto === esperado) return balao;
    if (performance.now() >= fim) {
      throw new Error(
        `o balão não chegou a data-side="${esperado}" em ${prazoMs}ms ` +
          `(último lado visto: ${visto ?? 'nenhum balão no portal'})`,
      );
    }
    await new Promise((resolver) => setTimeout(resolver, 16));
  }
}

/** Distância em px entre uma borda do gatilho e a borda da JANELA. */
function folgaAte(alvo: HTMLElement, side: Side): number {
  const r = alvo.getBoundingClientRect();
  if (side === 'top') return r.top;
  if (side === 'bottom') return window.innerHeight - r.bottom;
  if (side === 'left') return r.left;
  return window.innerWidth - r.right;
}

/**
 * `GAP` de `tooltip.ts` — `sideOffset` (4) mais a altura da seta (5).
 *
 * É o vão entre gatilho e balão, e entra na conta do espaço necessário: sem ele
 * a premissa aprovaria um palco onde o balão cabe mas o vão não.
 */
const VAO = 9;

/**
 * Quanto espaço há de um lado do gatilho, e quanto o balão precisaria.
 *
 * Existe porque afirmar o lado EXATO sem garantir a folga não mede o
 * componente: mede o tamanho da janela de quem roda a suíte. Sem espaço do lado
 * pedido o `flip` vira o balão e está CERTO — a story é que estaria perguntando
 * a coisa errada, e passaria ou reprovaria conforme o quadro do runner.
 *
 * A folga é POR EIXO: altura não compra lado horizontal. Quem pede `top` precisa
 * de espaço ACIMA, quem pede `left` precisa de espaço à ESQUERDA.
 *
 * Os números vão na mensagem de propósito — palco apertado reprova dizendo o que
 * faltou, em vez de empurrar a story de volta para `[lado, oposto]`, que passa de
 * qualquer jeito. É o par da `Collision`, que declara a premissa OPOSTA.
 */
export function cabeNoLado(
  trigger: HTMLElement,
  balao: HTMLElement,
  side: Side,
): { folga: number; preciso: number; viewport: string } {
  const b = balao.getBoundingClientRect();
  const preciso = (side === 'top' || side === 'bottom' ? b.height : b.width) + VAO;
  return {
    folga: folgaAte(trigger, side),
    preciso,
    // O tamanho do quadro vai junto: sem ele, "faltaram 6px" não diz se o palco
    // é grande demais ou se o quadro do runner é que é pequeno.
    viewport: `${window.innerWidth}×${window.innerHeight}`,
  };
}

/** Tira do DOM qualquer balão que tenha sobrado antes do axe varrer a página. */
export function clearPortal(): void {
  document.querySelectorAll('[data-slot="tooltip-content"]').forEach((n) => n.remove());
}

/**
 * Moldura da demonstração: centraliza o gatilho e reserva altura para o balão
 * abrir sem empurrar o resto da página.
 */
export function wrap(child: HTMLElement, alturaMinima = '180px'): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.style.minHeight = alturaMinima;
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.appendChild(child);
  return wrapper;
}
