/**
 * Geometria da seta do tooltip, medida no DOM renderizado.
 *
 * Existe porque DUAS regressões de posição da seta passaram pelas cinco suítes
 * em 2026-09-04 — nenhuma asserção olhava para onde a seta ficava. As duas
 * foram relatadas por quem abriu o Storybook, que é o pior lugar para um
 * defeito de layout aparecer. As stories que existiam mediam o ATRIBUTO
 * (`data-side === 'top'`) e passavam com o balão nunca posicionado.
 *
 * As medidas são deliberadamente INDEPENDENTES do lado pedido. O lado efetivo
 * pode ser trocado pelo flip quando falta espaço na moldura da story, e uma
 * asserção presa ao `side` reprovaria por causa do layout, não do componente.
 * Tudo aqui sai da geometria: em que borda do balão a seta está encostada, e a
 * que distância ela para do gatilho.
 *
 * NÃO chame de dentro de `waitFor`. As leituras forçam layout, e condição que
 * mexe no DOM dentro de `waitFor` reagenda a si mesma até a aba travar sem
 * reportar nada — ver a regra no CLAUDE.md. Espere o balão existir primeiro,
 * depois meça.
 */

/** Borda do BALÃO em que a base da seta está encostada. */
export type BordaDaSeta = 'top' | 'bottom' | 'left' | 'right';

export interface MedidaDaSeta {
  /** Em que borda do balão a seta encostou. Sai da geometria, não do `side`. */
  borda: BordaDaSeta;
  /** Distância entre a base da seta e a borda do balão. Tem de ser 0. */
  vaoAteOBalao: number;
  /** Distância entre o bico da seta e o gatilho. É o `sideOffset` documentado. */
  vaoAteOGatilho: number;
  /** Centro da seta contra o centro do gatilho, no eixo perpendicular à borda. */
  desvioNoGatilho: number;
  /** Centro da seta contra o centro do balão, no mesmo eixo. Informativo. */
  desvioNoBalao: number;
  largura: number;
  altura: number;
}

function arredondar(n: number): number {
  return Math.round(n * 10) / 10;
}

/** A seta de um balão, ou `null` — a classe é a mesma nas cinco stacks. */
export function setaDe(balao: HTMLElement): HTMLElement | null {
  return balao.querySelector<HTMLElement>('.nds-tooltip-arrow');
}

/**
 * Mede a seta contra o balão e o gatilho.
 *
 * @throws se o balão não tiver seta — ausência é o defeito que a stack sem
 *         Arrow tinha, e devolver `null` aqui faria a asserção de quem chama
 *         passar por vacuidade.
 */
export function medirSeta(balao: HTMLElement, gatilho: HTMLElement): MedidaDaSeta {
  const seta = setaDe(balao);
  if (!seta) throw new Error('O balão não tem `.nds-tooltip-arrow` — a seta não foi composta.');

  const s = seta.getBoundingClientRect();
  const b = balao.getBoundingClientRect();
  const g = gatilho.getBoundingClientRect();

  // A borda sai de qual lado do balão a seta está POR FORA. A tolerância de 1px
  // absorve o arredondamento de subpixel do posicionamento da lib.
  let borda: BordaDaSeta;
  if (s.bottom <= b.top + 1) borda = 'top';
  else if (s.top >= b.bottom - 1) borda = 'bottom';
  else if (s.right <= b.left + 1) borda = 'left';
  else if (s.left >= b.right - 1) borda = 'right';
  else
    throw new Error(
      `A seta não está encostada em borda nenhuma do balão — ela está DENTRO dele. ` +
        `seta ${JSON.stringify({ x: s.x, y: s.y, w: s.width, h: s.height })}, ` +
        `balão ${JSON.stringify({ x: b.x, y: b.y, w: b.width, h: b.height })}.`,
    );

  const vertical = borda === 'top' || borda === 'bottom';
  const vaoAteOBalao = { top: b.top - s.bottom, bottom: s.top - b.bottom, left: b.left - s.right, right: s.left - b.right }[borda];
  const vaoAteOGatilho = { top: s.top - g.bottom, bottom: g.top - s.bottom, left: s.left - g.right, right: g.left - s.right }[borda];

  const centroSeta = vertical ? s.x + s.width / 2 : s.y + s.height / 2;
  const centroGatilho = vertical ? g.x + g.width / 2 : g.y + g.height / 2;
  const centroBalao = vertical ? b.x + b.width / 2 : b.y + b.height / 2;

  return {
    borda,
    vaoAteOBalao: arredondar(vaoAteOBalao),
    vaoAteOGatilho: arredondar(vaoAteOGatilho),
    desvioNoGatilho: arredondar(centroSeta - centroGatilho),
    desvioNoBalao: arredondar(centroSeta - centroBalao),
    largura: arredondar(s.width),
    altura: arredondar(s.height),
  };
}

export interface OpcoesDaSeta {
  /** Vão esperado entre o bico e o gatilho. Padrão 4, o `sideOffset` documentado. */
  folga?: number;
  /** Frouxidão em px para subpixel e para o clamp da lib. */
  tolerancia?: number;
}

/**
 * Confere as três invariantes da seta e devolve a medida.
 *
 * 1. encosta no balão sem vão — foi o que o `position: absolute` na folha
 *    quebrou, colapsando o wrapper que a lib posiciona;
 * 2. aponta para o gatilho — foi o que o mesmo defeito desalinhou em meia
 *    largura de seta;
 * 3. para à `folga` documentada do gatilho, sem invadi-lo.
 */
export function conferirSeta(
  balao: HTMLElement,
  gatilho: HTMLElement,
  { folga = 4, tolerancia = 2 }: OpcoesDaSeta = {},
): MedidaDaSeta {
  const m = medirSeta(balao, gatilho);
  const onde = `(borda ${m.borda}, medida ${JSON.stringify(m)})`;

  if (Math.abs(m.vaoAteOBalao) > tolerancia)
    throw new Error(`A seta não encosta no balão: ${m.vaoAteOBalao}px de vão ${onde}.`);

  if (Math.abs(m.desvioNoGatilho) > tolerancia)
    throw new Error(`A seta não aponta para o gatilho: ${m.desvioNoGatilho}px fora do centro ${onde}.`);

  if (Math.abs(m.vaoAteOGatilho - folga) > tolerancia)
    throw new Error(`A folga entre o bico e o gatilho é ${m.vaoAteOGatilho}px, esperada ${folga}px ${onde}.`);

  if (m.largura <= 0 || m.altura <= 0)
    throw new Error(`A seta não tem tamanho ${onde}.`);

  return m;
}

export interface OpcoesDeEspera extends OpcoesDaSeta {
  /** Prazo total da espera, em ms. */
  prazoMs?: number;
  /** Intervalo entre tentativas, em ms. */
  intervaloMs?: number;
}

/**
 * Espera a lib assentar e então confere. É esta que as plays devem chamar.
 *
 * O `data-side` aparece ANTES de a posição estar calculada — medido em
 * 2026-09-04: no Svelte, onde cada lado é uma story própria, a medição feita
 * logo após o atributo pegava o balão no meio do caminho e reprovava por 33px
 * num componente correto. Nas stacks em que os quatro lados vivem numa story só,
 * o tempo de montar os quatro já escondia isso — o defeito era de tempo, e a
 * story é que decidia se ele aparecia.
 *
 * Laço de RELÓGIO, e não `waitFor`: a condição aqui lê `getBoundingClientRect`,
 * que força layout, e condição que mexe no DOM dentro de `waitFor` reagenda a si
 * mesma pelo observador de mutação — o prazo nunca chega, a aba trava e o
 * arquivo inteiro morre sem reportar. Está no CLAUDE.md, medido: 420s de CPU
 * sem resultado contra 2,2s reprovando.
 *
 * Ao estourar o prazo, relança o ÚLTIMO erro, não um genérico: a mensagem traz a
 * medida, que é o que diz se o defeito é de posição, de vão ou de tamanho.
 */
export async function aguardarSeta(
  balao: HTMLElement,
  gatilho: HTMLElement,
  { prazoMs = 2000, intervaloMs = 50, ...resto }: OpcoesDeEspera = {},
): Promise<MedidaDaSeta> {
  const fim = performance.now() + prazoMs;
  let ultimo: unknown;
  for (;;) {
    try {
      return conferirSeta(balao, gatilho, resto);
    } catch (erro) {
      ultimo = erro;
    }
    if (performance.now() >= fim) break;
    await new Promise((resolver) => setTimeout(resolver, intervaloMs));
  }
  throw ultimo;
}
