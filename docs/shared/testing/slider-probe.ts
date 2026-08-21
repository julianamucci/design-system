/**
 * Sonda do Slider — medição única, igual nas cinco stacks.
 *
 * ─── Duas anatomias legítimas, um só contrato ────────────────────────────────
 *
 * A alça com `role="slider"` aparece de duas formas, e nenhuma delas está
 * errada:
 *
 *   - **alça com `<input type="range">` dentro** — o papel e os limites são
 *     IMPLÍCITOS: quem responde por `role="slider"` é o input, e `aria-valuemin`
 *     / `aria-valuemax` não existem como atributo porque `min` e `max` já os
 *     expõem na árvore de acessibilidade. Escrevê-los seria redundante e a
 *     própria WAI-ARIA desaconselha;
 *   - **alça que É o elemento focável** — um `<span role="slider" tabindex="0">`
 *     com `aria-valuemin` / `aria-valuemax` / `aria-valuenow` explícitos, porque
 *     sem eles não haveria de onde tirar os limites.
 *
 * Asserção escrita contra UMA das formas reprova a outra sem que nada esteja
 * quebrado — foi o que derrubou a Playground do stack que usa input nativo,
 * afirmando `aria-valuemin` num elemento que expõe `min`. `limitesDaAlca` lê a
 * superfície que existir e devolve números; é sobre o número que a asserção
 * deve falar.
 *
 * ─── Contraste ──────────────────────────────────────────────────────────────
 *
 * O miolo da alça é da cor do fundo da página de propósito, então medir "alça
 * contra fundo" dá ~1:1 e não descreve nada. Quem separa a alça do trilho é a
 * BORDA dela, e é essa razão que a WCAG 1.4.11 cobra em 3:1.
 */

// ─── Peças ───────────────────────────────────────────────────────────────────

/** Acha a peça pelo `data-slot`, considerando o próprio nó recebido. */
function achar(raiz: ParentNode, slot: string): HTMLElement | null {
  const seletor = `[data-slot="${slot}"]`;
  if (raiz instanceof Element && raiz.matches(seletor)) return raiz as HTMLElement;
  return raiz.querySelector<HTMLElement>(seletor);
}

/** O trilho — a caixa por onde o preenchimento corre. */
export function trilhoDoSlider(raiz: ParentNode): HTMLElement {
  const el = achar(raiz, 'slider-track');
  if (!el) throw new Error('SONDA::slider: nenhum [data-slot="slider-track"] no canvas');
  return el;
}

/** O segmento preenchido. */
export function preenchimentoDoSlider(raiz: ParentNode): HTMLElement {
  const el = achar(raiz, 'slider-range');
  if (!el) throw new Error('SONDA::slider: nenhum [data-slot="slider-range"] no canvas');
  return el;
}

/** As alças, na ordem em que aparecem no DOM. */
export function alcasDoSlider(raiz: ParentNode): HTMLElement[] {
  return [...raiz.querySelectorAll<HTMLElement>('[data-slot="slider-thumb"]')];
}

/**
 * O elemento que responde por `role="slider"` dentro de uma alça.
 *
 * São TRÊS anatomias, não duas. Além do input dentro da alça e da alça que
 * acumula o papel, existe a terceira: **um `<input type="range">` nativo
 * sobreposto ao trilho, IRMÃO da alça** — a alça é só o desenho, e quem tem o
 * papel, o valor e o foco é o input ao lado dela. Procurar o input apenas
 * DENTRO da alça devolvia a própria alça, que não tem valor nenhum: `min`,
 * `max` e `value` saíam `NaN`, e `expect(NaN).toBe(NaN)` passa por
 * `Object.is` — a asserção existia e não podia reprovar.
 */
export function controleDaAlca(alca: HTMLElement): HTMLElement {
  const dentro = alca.querySelector<HTMLInputElement>('input[type="range"]');
  if (dentro) return dentro;
  if (alca instanceof HTMLInputElement && alca.type === 'range') return alca;
  const raiz = alca.closest<HTMLElement>('[data-slot="slider"], .nds-slider');
  return raiz?.querySelector<HTMLInputElement>('input[type="range"]') ?? alca;
}

// ─── Valor e limites ─────────────────────────────────────────────────────────

export type LimitesDaAlca = { min: number; max: number; agora: number };

/**
 * Lê valor e limites de uma alça, seja qual for a superfície que os expõe.
 *
 * `elemento` pode ser a alça, o input de dentro dela ou o próprio nó com
 * `role="slider"` — as três chamadas aparecem nas stories.
 */
export function limitesDaAlca(elemento: HTMLElement): LimitesDaAlca {
  const controle = controleDaAlca(elemento);
  const numero = (aria: string, nativo: string): number => {
    const doAria = controle.getAttribute(aria);
    if (doAria !== null && doAria !== '') return Number(doAria);
    // No input nativo a fonte é a PROPRIEDADE, não o atributo: `value` não
    // reflete para o HTML, então `getAttribute('value')` devolve `null` num
    // input que mostra 50 na tela. `min` e `max` refletem, mas ler os três pela
    // mesma superfície evita depender de qual reflete e qual não.
    if (controle instanceof HTMLInputElement) {
      const daPropriedade = controle[nativo as 'value' | 'min' | 'max'];
      if (daPropriedade !== undefined && daPropriedade !== '') return Number(daPropriedade);
    }
    const doNativo = controle.getAttribute(nativo);
    if (doNativo !== null && doNativo !== '') return Number(doNativo);
    return Number.NaN;
  };
  return {
    min: numero('aria-valuemin', 'min'),
    max: numero('aria-valuemax', 'max'),
    agora: numero('aria-valuenow', 'value'),
  };
}

/** Atalho para o valor corrente da alça. */
export function valorDaAlca(elemento: HTMLElement): number {
  return limitesDaAlca(elemento).agora;
}

/**
 * A alça está desabilitada?
 *
 * Três marcas para o mesmo estado, todas legítimas: o `disabled` nativo do
 * input, o `aria-disabled` de quem não tem input, e o `data-disabled` que as
 * libs headless escrevem para o CSS. `toBeDisabled()` só enxerga a primeira —
 * exigi-la reprovava, com o componente correto, as stacks cuja alça não é um
 * input.
 */
export function alcaDesabilitada(alca: HTMLElement): boolean {
  const controle = controleDaAlca(alca);
  const dataDisabled = (el: HTMLElement) => {
    const v = el.getAttribute('data-disabled');
    return v !== null && v !== 'false';
  };
  return (
    (controle as HTMLInputElement).disabled === true ||
    controle.getAttribute('aria-disabled') === 'true' ||
    dataDisabled(controle) ||
    dataDisabled(alca)
  );
}

// ─── Contraste (WCAG 1.4.11) ─────────────────────────────────────────────────

/** Luminância relativa de uma cor computada, achatada sobre um fundo opaco. */
function luminancia(cor: string, fundo: [number, number, number]): number {
  const [r = 0, g = 0, b = 0, a = 1] = cor.match(/[\d.]+/g)?.map(Number) ?? [];
  const canal = (v: number, base: number) => {
    const misturado = (v * a + base * (1 - a)) / 255;
    return misturado <= 0.03928 ? misturado / 12.92 : ((misturado + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * canal(r, fundo[0]) + 0.7152 * canal(g, fundo[1]) + 0.0722 * canal(b, fundo[2]);
}

/** Primeiro ancestral com fundo opaco — o que o olho realmente vê por baixo. */
function fundoOpaco(el: HTMLElement): [number, number, number] {
  let atual: HTMLElement | null = el;
  while (atual) {
    const [r = 0, g = 0, b = 0, a = 0] =
      getComputedStyle(atual).backgroundColor.match(/[\d.]+/g)?.map(Number) ?? [];
    if (a === 1) return [r, g, b];
    atual = atual.parentElement;
  }
  return [255, 255, 255];
}

/**
 * Razão de contraste entre a BORDA da alça e o fundo do trilho.
 *
 * O trilho tem alfa (é `--primary` a 20%), então a cor crua dele não é a que
 * aparece na tela: ela é composta sobre o primeiro ancestral opaco antes da
 * conta. Sem isso o número sai errado e para o lado errado.
 */
export function contrasteAlcaTrilho(raiz: ParentNode): number {
  const alca = alcasDoSlider(raiz)[0];
  if (!alca) throw new Error('SONDA::slider: nenhuma [data-slot="slider-thumb"] no canvas');
  const trilho = trilhoDoSlider(raiz);
  const base = fundoOpaco(trilho.parentElement ?? trilho);

  const a = luminancia(discoDaAlca(alca).borderTopColor, base);
  const b = luminancia(getComputedStyle(trilho).backgroundColor, base);
  const [claro, escuro] = a >= b ? [a, b] : [b, a];
  return (claro + 0.05) / (escuro + 0.05);
}

/**
 * As cores CRUAS que a razão acima resumiu, mais o estado global que as decide.
 *
 * Existe porque uma razão sozinha não diz o que houve. `expected 1.46 to be
 * greater than or equal to 3` foi visto uma vez, numa suíte de 3191 testes, e
 * não voltou — e sem as cores e sem a classe do `<html>` não dá para separar
 * "paleta errada" de "tema herdado de outro arquivo" de "elemento em transição".
 * Passe o retorno como MENSAGEM da asserção: ele só é lido quando ela reprova.
 */
export function contextoAlcaTrilho(raiz: ParentNode): string {
  const alca = alcasDoSlider(raiz)[0];
  if (!alca) return 'SONDA::slider: nenhuma alça';
  const trilho = trilhoDoSlider(raiz);
  const partes = [
    `borda=${discoDaAlca(alca).borderTopColor}`,
    `trilho=${getComputedStyle(trilho).backgroundColor}`,
    `base=rgb(${fundoOpaco(trilho.parentElement ?? trilho).join(", ")})`,
    `html="${raiz.ownerDocument?.documentElement.className ?? '?'}"`,
  ];
  return partes.join(' ');
}

/**
 * O estilo do DISCO — o que a pessoa enxerga da alça.
 *
 * A alça tem duas caixas com papéis distintos: o ELEMENTO é o alvo de toque
 * (24×24, transparente, WCAG 2.5.8) e o `::before` é o DESENHO (16px, com a
 * borda e a sombra). Contraste e anel de foco são propriedades do desenho —
 * lidos no elemento voltariam `rgba(0, 0, 0, 0)` e `none`, e a conta de
 * contraste passaria a comparar transparente com transparente.
 */
function discoDaAlca(alca: HTMLElement): CSSStyleDeclaration {
  return getComputedStyle(alca, '::before');
}

// ─── Foco (WCAG 2.4.7) ───────────────────────────────────────────────────────

/**
 * A alça focada está pintada com o anel de foco?
 *
 * Duas pinturas, porque o foco pousa em elementos diferentes conforme a
 * anatomia: a alça ganha `box-shadow` e a borda troca para `--ring`. Basta uma
 * das duas mudar em relação ao repouso para o anel existir — o que a regra
 * proíbe é a alça focada ficar idêntica à alça em repouso.
 */
export function aneisDeFoco(alca: HTMLElement): { sombra: string; borda: string } {
  // No `::before`, que é onde a borda e a sombra moram — ver `discoDaAlca`.
  const estilo = discoDaAlca(alca);
  return { sombra: estilo.boxShadow, borda: estilo.borderTopColor };
}

/**
 * O anel da alça EM REPOUSO — foco solto, transição terminada.
 *
 * Medir o repouso no início da play só vale na primeira montagem. O painel
 * Interactions reexecuta no MESMO DOM: na segunda rodada a alça chega focada
 * da rodada anterior, o "repouso" medido já é o anel aceso, e o passo seguinte
 * compara o anel consigo mesmo e reprova. Solta o foco e espera duas amostras
 * iguais antes de devolver.
 */
export async function anelEmRepouso(
  alca: HTMLElement,
  tempoMax = 2000,
): Promise<{ sombra: string; borda: string }> {
  (alca.ownerDocument.activeElement as HTMLElement | null)?.blur();
  const limite = Date.now() + tempoMax;
  let anterior = aneisDeFoco(alca);
  while (Date.now() < limite) {
    await new Promise((r) => setTimeout(r, 32));
    const agora = aneisDeFoco(alca);
    if (agora.sombra === anterior.sombra && agora.borda === anterior.borda) return agora;
    anterior = agora;
  }
  return anterior;
}

/**
 * O anel de foco DEPOIS que a transição assentou.
 *
 * A alça transiciona `border-color` e `box-shadow` em ~120ms. Lida no
 * instante seguinte ao Tab, `getComputedStyle` devolve o valor de PARTIDA —
 * idêntico ao repouso — e a asserção reprovava um anel que existe e aparece.
 * Medido: t=16ms ainda em repouso, t=100ms já no valor final.
 *
 * Não é afrouxar a asserção: continua exigindo que a alça focada difira da
 * alça parada. Só espera o desenho parar de se mexer antes de fotografá-lo.
 */
export async function anelDeFocoAssentado(
  alca: HTMLElement,
  repouso: { sombra: string; borda: string },
  tempoMax = 2000,
): Promise<{ sombra: string; borda: string }> {
  const limite = Date.now() + tempoMax;
  let atual = aneisDeFoco(alca);
  while (Date.now() < limite) {
    if (atual.sombra !== repouso.sombra || atual.borda !== repouso.borda) {
      // Mudou: deixa a transição terminar para não fotografar o meio dela.
      await new Promise((r) => setTimeout(r, 60));
      return aneisDeFoco(alca);
    }
    await new Promise((r) => setTimeout(r, 16));
    atual = aneisDeFoco(alca);
  }
  return atual;
}

// ─── Teclado ─────────────────────────────────────────────────────────────────

/**
 * Aperta uma tecla de verdade sobre o elemento focado.
 *
 * O `userEvent` do `storybook/test` monta eventos no DOM, e evento
 * **untrusted** não dispara a ação padrão do navegador: num
 * `<input type="range">` nativo a seta não move nada (medido: valor segue 50),
 * e `{Home}`/`{End}` ainda estouram em `setSelectionRange`, que não existe para
 * range. O resultado era uma suíte que parecia exercitar o teclado sem nunca
 * ter apertado uma tecla.
 *
 * O `userEvent` do vitest em modo browser passa pelo CDP e é entrada de
 * verdade: as mesmas teclas movem o input nativo (Home→0, End→100, PageDown→−10)
 * e disparam um `change` por tecla. É ele quando existe — o caminho do DOM fica
 * de reserva para o painel Interactions, onde não há CDP.
 */
export async function apertarTecla(elemento: HTMLElement, tecla: string): Promise<void> {
  elemento.focus();
  const real = await tecladoDoNavegador();
  if (real) {
    await real(tecla);
    return;
  }
  // @ts-expect-error -- resolvido pelo bundler de cada stack, não pelo tsconfig
  // que inclui este arquivo compartilhado: daqui o caminho de node_modules é o
  // de docs/shared, que não tem as libs de teste. O import é LITERAL de
  // propósito (vitest/browser é módulo virtual). Se algum dia resolver, este
  // marcador passa a acusar sozinho.
  const { userEvent } = await import('storybook/test');
  await userEvent.keyboard(tecla);
}

/**
 * O `userEvent` do vitest em modo browser, quando existir.
 *
 * `vitest/browser` é MÓDULO VIRTUAL: quem o resolve é o plugin do Vitest, em
 * tempo de build. O especificador precisa por isso ser LITERAL e chegar até o
 * plugin — a forma anterior pedia exatamente o contrário. Ela montava o import
 * a partir de uma variável e ainda marcava `@vite-ignore`, que manda o Vite não
 * tocar no import: o módulo virtual nunca era resolvido e o especificador cru
 * chegava ao navegador, onde nada o conhece. As duas tentativas falhavam em
 * silêncio, a função devolvia `null`, e TODO `apertarTecla` caía no caminho
 * sintético — que num `<input type="range">` não move valor nenhum, porque o
 * navegador só executa a ação padrão de evento trusted.
 *
 * O efeito era uma suíte de teclado inteira passando sem nunca ter apertado uma
 * tecla. Só apareceu quando as asserções passaram a comparar o valor DEPOIS com
 * o valor ANTES, em vez de afirmar que a tecla "foi enviada".
 *
 * `@vitest/browser/context` não entra na lista: nessa versão ele é um stub cujo
 * corpo é um `throw`, publicado justamente para dizer que o caminho certo é o
 * módulo virtual.
 *
 * Fora do modo browser (painel Interactions do Storybook) o import falha ou o
 * módulo lança — as duas coisas caem no `catch`, e o chamador usa o DOM.
 */
async function tecladoDoNavegador(): Promise<((s: string) => Promise<void>) | null> {
  try {
    // @ts-expect-error -- ver a nota do import de storybook/test acima.
    const mod = (await import('vitest/browser')) as {
      userEvent?: { keyboard?: (s: string) => Promise<void> };
    };
    const teclar = mod.userEvent?.keyboard;
    if (teclar) return (s: string) => teclar.call(mod.userEvent, s);
  } catch {
    // Sem modo browser: o chamador usa o caminho do DOM.
  }
  return null;
}

// ─── Ponteiro de verdade ─────────────────────────────────────────────────────

/**
 * Um clique de ponteiro REAL no centro do elemento.
 *
 * Mesmo motivo do `apertarTecla`: onde a alça é um `<input type="range">`
 * nativo, quem move o valor é o navegador, e ele só reage a evento trusted. O
 * `userEvent.pointer` do `storybook/test` monta `pointerdown`/`pointermove` no
 * DOM — as libs headless escutam isso em JS e respondem, mas o input nativo
 * ignora, e o "arrasto" media a si mesmo: nenhum callback disparava e o valor
 * não saía do lugar.
 *
 * Por que CLIQUE no trilho, e não arrasto por coordenada: o `cdp()` do provider
 * existe e aceita `Input.dispatchMouseEvent`, mas as coordenadas dele são do
 * TOPO da página enquanto `getBoundingClientRect()` é do iframe do tester.
 * Medido nesta suíte: um clique pedido a 75% do trilho aterrissou em 96%.
 * Converter exigiria descobrir o deslocamento do frame a cada rodada. O
 * `userEvent.click(elemento)` do vitest não tem esse problema — quem calcula o
 * ponto é o próprio driver, sobre o elemento, e o clique cai no centro dele:
 * pedido no trilho, o valor aterrissa em exatamente 50% (medido).
 *
 * O centro do trilho é ponto suficiente e melhor que um arbitrário: é
 * determinístico, e a asserção pode falar de um número exato em vez de uma
 * faixa de tolerância.
 */
export async function clicarNoCentro(elemento: HTMLElement): Promise<void> {
  const real = await ponteiroDoNavegador();
  if (real) {
    await real(elemento);
    return;
  }
  // @ts-expect-error -- resolvido pelo bundler de cada stack, não pelo tsconfig
  // que inclui este arquivo compartilhado: daqui o caminho de node_modules é o
  // de docs/shared, que não tem as libs de teste. O import é LITERAL de
  // propósito (vitest/browser é módulo virtual). Se algum dia resolver, este
  // marcador passa a acusar sozinho.
  const { userEvent } = await import('storybook/test');
  await userEvent.click(elemento);
}

async function ponteiroDoNavegador(): Promise<((el: Element) => Promise<void>) | null> {
  try {
    // @ts-expect-error -- ver a nota do import de storybook/test acima.
    const mod = (await import('vitest/browser')) as {
      userEvent?: { click?: (el: Element) => Promise<void> };
    };
    const clicar = mod.userEvent?.click;
    if (clicar) return (el: Element) => clicar.call(mod.userEvent, el);
  } catch {
    // Sem modo browser: o chamador usa o caminho do DOM.
  }
  return null;
}

// ─── Arrasto ─────────────────────────────────────────────────────────────────

/**
 * Faz a captura de ponteiro valer para o ponteiro SINTÉTICO do userEvent.
 *
 * Há lib headless que só trata `pointermove` quando
 * `event.target.hasPointerCapture(event.pointerId)` é verdadeiro. `setPointerCapture`
 * é do navegador e só conhece ponteiro de verdade: chamado com o id que o
 * userEvent inventa, ele não registra nada, e `hasPointerCapture` responde
 * `false` para sempre. O efeito era um arrasto pela metade — o `pointerdown`
 * levava a alça ao ponto do clique e nenhum movimento seguinte contava, com a
 * suíte apontando para a geometria como se o componente estivesse errado.
 *
 * O remendo é só a contabilidade da captura, no elemento e durante o arrasto.
 * Nada do componente é substituído: `slideMove` roda, o valor muda e a
 * geometria medida continua sendo a que o componente desenhou.
 *
 * Devolve a função que desfaz o remendo — chame-a no `finally`.
 */
export function remendarCapturaDePonteiro(): () => void {
  const proto = Element.prototype;
  const originais = {
    set: proto.setPointerCapture,
    has: proto.hasPointerCapture,
    release: proto.releasePointerCapture,
  };
  // Por elemento, e não num só: o `event.target` do `pointerdown` é o nó sob o
  // cursor — trilho, preenchimento ou alça conforme a coordenada —, não a raiz
  // onde o listener está. Remendar só a raiz deixava a captura registrada num
  // elemento e consultada em outro, que foi o arrasto parando no clique.
  const capturados = new WeakMap<Element, Set<number>>();
  proto.setPointerCapture = function (id: number) {
    let doElemento = capturados.get(this);
    if (!doElemento) capturados.set(this, (doElemento = new Set()));
    doElemento.add(id);
    try {
      originais.set.call(this, id);
    } catch {
      // Ponteiro sintético: o navegador recusa, a contabilidade acima basta.
    }
  };
  proto.hasPointerCapture = function (id: number) {
    if (capturados.get(this)?.has(id)) return true;
    try {
      return originais.has.call(this, id);
    } catch {
      return false;
    }
  };
  proto.releasePointerCapture = function (id: number) {
    capturados.get(this)?.delete(id);
    try {
      originais.release.call(this, id);
    } catch {
      /* idem */
    }
  };
  return () => {
    proto.setPointerCapture = originais.set;
    proto.hasPointerCapture = originais.has;
    proto.releasePointerCapture = originais.release;
  };
}
