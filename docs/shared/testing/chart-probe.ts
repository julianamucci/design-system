/**
 * Colhedor compartilhado do Chart — as cinco stacks medem o mesmo desenho com
 * o mesmo código.
 *
 * Duas famílias de implementação convivem: quatro stacks embrulham o ECharts e
 * o Angular desenha o SVG à mão. O que o design system promete, porém, é o
 * mesmo nas cinco — e é isso que este arquivo mede, pelo contrato observável
 * (`.nds-chart`, `role="img"`, o texto do desenho, o contorno das formas), não
 * pelo detalhe de quem desenhou.
 *
 * Nada aqui olha pixel: gráfico tem dimensão calculada, e asserção de pixel num
 * container que ainda está medindo a si mesmo é o caminho mais curto para um
 * teste intermitente. O que se mede é presença, texto, papel e razão de
 * contraste.
 */

import { contraste, darkLigarTheme } from './alert-probe';

export { contraste, darkLigarTheme };

/** O container do gráfico, do jeito que o CSS compartilhado o define. */
export function chartRoot(insideOf: HTMLElement): HTMLElement | null {
  return insideOf.querySelector<HTMLElement>('.nds-chart');
}

/** Idem, mas explode com mensagem útil em vez de devolver `null`. */
export function exigirRoot(insideOf: HTMLElement): HTMLElement {
  const root = chartRoot(insideOf);
  if (!root) throw new Error('nenhum .nds-chart no canvas da story');
  return root;
}

/** O desenho já saiu? `svg` no renderer padrão, `canvas` no alternativo. */
export function designRenderizado(root: HTMLElement): Element | null {
  return root.querySelector('svg, canvas');
}

/**
 * O desenho já pintou o DADO?
 *
 * Esperar o `<svg>` aparecer não basta, e esperar "qualquer marca" também não:
 * medido no navegador, a raiz nasce vazia no `init`, a grade e os rótulos de
 * eixo entram num flush, e as formas de dado só no seguinte — no gráfico de
 * barras de série única, as barras são os nós 42 a 49 de 57. Quem medisse no
 * intervalo veria eixo completo e zero barras, e a asserção falharia por chegar
 * cedo, não por defeito. Foi assim que sete stories falharam de uma vez, de
 * forma intermitente, que é o pior dos dois mundos.
 *
 * Por isso o marco é a primeira FORMA DE DADO, não o primeiro pixel.
 */
export function designPintado(root: HTMLElement): boolean {
  if (root.querySelector('canvas')) return true;
  return datumFormas(root).length > 0;
}

/**
 * Todo texto escrito DENTRO do desenho: marca de eixo, nome de série na
 * legenda, título, rótulo de valor.
 *
 * É a sonda mais estável que um gráfico tem — não depende de como a lib nomeia
 * seus grupos, e é literalmente o que a pessoa lê na tela.
 */
export function designTexts(root: HTMLElement): string[] {
  return [...root.querySelectorAll('svg text')]
    .map((t) => (t.textContent ?? '').trim())
    .filter(Boolean);
}

/** O desenho escreve este texto em algum lugar? */
export function designEscreve(root: HTMLElement, text: string): boolean {
  return designTexts(root).some((t) => t.includes(text));
}

/**
 * Ids de trama (`<pattern>`) referenciados por alguma forma preenchida.
 *
 * A trama é o que faz a série continuar distinguível quando a cor sai de cena
 * (WCAG 1.4.1). Medir os `<pattern>` do `<defs>` contaria trama declarada e não
 * usada; o que interessa é a que chegou a uma forma.
 */
export function tramasAplicadas(root: HTMLElement): Set<string> {
  const ids = new Set<string>();
  for (const el of root.querySelectorAll('svg [fill^="url(#"]')) {
    const id = (el.getAttribute('fill') ?? '').match(/url\(#([^)]+)\)/)?.[1];
    if (id) ids.add(id);
  }
  return ids;
}

/**
 * Cor de um token do tema, já resolvida pelo navegador, no formato em que o
 * `getComputedStyle` de um elemento a devolveria.
 *
 * Serve de ALVO para a medição de troca de tema: o token acompanha a classe do
 * documento na hora, enquanto o desenho leva alguns quadros para repintar.
 * Esperar o desenho chegar a este valor é determinístico — bem melhor que
 * esperar um tempo fixo e torcer.
 */
export function tokenColor(token: string, perto: HTMLElement): string {
  const doc = perto.ownerDocument;
  const canais = getComputedStyle(doc.documentElement).getPropertyValue(`--${token}`).trim();
  const probe = doc.createElement('span');
  probe.style.color = `hsl(${canais})`;
  // FORA DO FLUXO, e no <body>, não ao lado do gráfico.
  //
  // A primeira versão pendurava a sonda no irmão do gráfico. Dentro de um
  // `waitFor`, isso reflui o bloco a cada sondagem, o observador de tamanho
  // repinta os dois gráficos junto, e sessenta voltas disso derrubavam a aba —
  // a story de tema escuro fechava o navegador em vez de falhar.
  probe.style.position = 'absolute';
  probe.style.visibility = 'hidden';
  probe.style.pointerEvents = 'none';
  doc.body.appendChild(probe);
  try {
    return getComputedStyle(probe).color;
  } finally {
    probe.remove();
  }
}

/**
 * Garante que o desenho está pintado com o tema que o documento tem AGORA.
 *
 * Por que isto existe, medido no navegador: a lib de gráfico congela o tema no
 * momento em que cria a instância. Quando uma tela escura é seguida por uma
 * clara no MESMO documento — o que só acontece na suíte, porque no Storybook e
 * na regressão visual cada tela tem o seu —, a troca de classe cai numa janela
 * em que a nova instância já nasceu e ainda não há quem escute a mudança. O
 * desenho fica com o contorno claro sobre fundo claro, e a medição de contraste
 * acusa 1.04:1 sem que a paleta tenha nada de errado.
 *
 * A ida e volta na classe é uma PRECONDIÇÃO, não um afrouxamento: depois dela a
 * asserção continua medindo o traço realmente desenhado contra o fundo
 * realmente pintado. É o mesmo princípio do replay — cada passo estabelece o
 * estado de que precisa em vez de herdar o que a tela anterior deixou.
 */
export async function settleTheme(doc: Document = document): Promise<void> {
  const html = doc.documentElement;
  const darkEra = html.classList.contains('dark');
  html.classList.toggle('dark', !darkEra);
  await new Promise((r) => setTimeout(r, 60));
  html.classList.toggle('dark', darkEra);
  await new Promise((r) => setTimeout(r, 150));
}

/**
 * Formas de dado: barra, fatia, símbolo de ponto.
 *
 * O recorte é `preenchida E contornada` — linha de grade e eixo têm
 * `fill: none`, e por isso ficam de fora sem precisar saber o nome que cada
 * implementação dá aos seus grupos.
 */
export function datumFormas(root: HTMLElement): SVGGraphicsElement[] {
  return [...root.querySelectorAll<SVGGraphicsElement>('svg path, svg rect')].filter((el) => {
    const s = getComputedStyle(el);
    return s.fill !== 'none' && s.stroke !== 'none' && parseFloat(s.strokeWidth || '0') > 0;
  });
}

/**
 * Cor de fundo realmente enxergada atrás de `el`.
 *
 * Sobe até achar uma cor opaca: fundo semitransparente devolve uma cor que
 * ninguém vê, e dividir por ela dá um número que não existe na tela.
 */
export function backgroundOpacoAtras(el: Element): string {
  let current: Element | null = el;
  while (current) {
    const cor = getComputedStyle(current).backgroundColor;
    const alfa = cor.match(/rgba?\([^)]*?,\s*([\d.]+)\)/);
    if (cor && cor !== 'transparent' && (!alfa || Number(alfa[1]) === 1)) return cor;
    current = current.parentElement;
  }
  return 'rgb(255, 255, 255)';
}

/**
 * A assinatura de FORMA de um caminho: só as letras de comando do atributo `d`.
 *
 * Serve para contar quantas formas DIFERENTES um desenho põe na tela sem
 * depender da posição de cada uma — as coordenadas mudam a cada ponto, as
 * letras não. Medido contra o que a lib emite:
 *
 *   circle `MAA` · rect `MlllZ` · triangle `MLLZ` · diamond `MLLLZ` · arrow `MLLLLZ`
 *
 * Existe por causa da dispersão, o tipo em que a forma do símbolo é o sinal
 * PRIMÁRIO e não o reforço: ali a trama não serve (ver a decisão 3 no cabeçalho
 * do componente), então é a forma que cumpre a WCAG 1.4.1 e é ela que precisa
 * ser medida no DOM. Ler a forma do option provaria só que ela foi PEDIDA.
 */
export function shapeSignature(shape: Element): string {
  const d = shape.getAttribute('d') ?? '';
  return (d.match(/[A-Za-z]/g) ?? []).join('');
}

/** Quantas formas distintas há num conjunto de caminhos já filtrado. */
export function distinctShapes(shapes: Element[]): Set<string> {
  return new Set(shapes.map(shapeSignature));
}

/**
 * Espera a contagem de formas PARAR DE MUDAR, por laço de relógio.
 *
 * Existe porque `drawingSettled` não alcança a varredura da rosca. Ele espera o
 * retângulo transparente da legenda ficar sozinho, o que acontece no primeiro
 * quadro; a rosca, porém, entra com as fatias em ângulo ZERO e as abre ao longo
 * da animação. Medido no react, com a rosca aninhada: no instante em que
 * `drawingSettled` volta, as oito fatias medem `0x48` e `0x40` — largura zero —
 * e só aos 1,5s chegam ao tamanho real.
 *
 * E o laço é de RELÓGIO, não `waitFor`, pelo motivo que o CLAUDE.md registra: a
 * leitura aqui chama `getBBox()`, que força layout. `waitFor` reagenda por
 * observador de mutação, então uma condição que força layout provoca a própria
 * reexecução — o prazo não chega e a animação não avança no meio. Medido: a
 * mesma asserção dentro de `waitFor` reprovou com ZERO forma depois de três
 * segundos, enquanto a leitura por relógio via as oito em 1,5s.
 *
 * Não afirma nada: devolve a última contagem e deixa a asserção para quem
 * chamou, que é quem sabe o número esperado.
 */
export async function waitForStableCount(
  read: () => number,
  { timeout = 4000, interval = 100, stableReads = 3 }: {
    timeout?: number;
    interval?: number;
    stableReads?: number;
  } = {},
): Promise<number> {
  const deadline = Date.now() + timeout;
  let previous = -1;
  let repeats = 0;
  let current = read();
  while (Date.now() < deadline) {
    current = read();
    // Zero não conta como estável: antes do primeiro quadro TODA leitura devolve
    // zero, e três zeros seguidos encerrariam a espera num desenho que ainda não
    // existe — portão verde medindo tela vazia.
    if (current > 0 && current === previous) {
      if (++repeats >= stableReads) return current;
    } else {
      previous = current;
      repeats = 0;
    }
    await new Promise((resolve) => setTimeout(resolve, interval));
  }
  return current;
}
