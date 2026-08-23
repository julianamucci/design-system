/**
 * Colhedor compartilhado do Tabs — as cinco stacks medem a aba DESABILITADA com
 * este arquivo.
 *
 * O eixo que nenhum check pegava: **como cada stack desabilita uma aba**. O
 * padrão WAI-ARIA para o papel `tab` pede que a aba desabilitada continue
 * alcançável pela seta, para que o leitor de tela a anuncie e a pessoa descubra
 * que ela existe; um `<button disabled>` faz o oposto — some do alcance do foco
 * e nunca é anunciado. As duas formas passam igualmente num teste que só olha
 * "o clique não ativou", e foi por isso que o repositório carregou as duas ao
 * mesmo tempo sem nenhuma suíte reclamar.
 *
 * O colhedor mede o EFEITO, nunca o nome da classe:
 *   · o que o elemento emite (`disabled`, `aria-disabled`, `data-disabled`);
 *   · se a seta consegue pousar nele;
 *   · se o clique e o Enter/Espaço mudam o painel;
 *   · o que o leitor de tela tem para anunciar.
 *
 * Campo `null` significa "não foi possível medir" e É o achado — não falha do
 * colhedor.
 *
 * As teclas e o clique entram por injeção (`Actions`) porque `userEvent` mora no
 * pacote de teste de cada stack, e `docs/shared` não depende de nenhuma.
 */

/** Torneira de interação — cada stack passa a sua, vinda de `storybook/test`. */
export interface Actions {
  /** Envia uma tecla ao elemento em foco. Ex.: `'{ArrowRight}'`. */
  apertar: (tecla: string) => Promise<void>;
  /** Clica ignorando `pointer-events: none` (senão o clique nem é tentado). */
  click: (el: HTMLElement) => Promise<void>;
}

// ─── Leitura do DOM ───────────────────────────────────────────────────────────

/** O que a aba emite, cru. É a assinatura do mecanismo escolhido pela stack. */
export interface AbaAttrs {
  /** Atributo `disabled` nativo — o que tira o botão do alcance do foco. */
  disabledNativo: boolean;
  ariaDisabled: string | null;
  dataDisabled: string | null;
  ariaSelected: string | null;
  dataState: string | null;
  tabindex: string | null;
  role: string | null;
  accessibleName: string;
}

export function lerAba(aba: HTMLElement): AbaAttrs {
  return {
    disabledNativo:
      aba.hasAttribute('disabled') || (aba as HTMLButtonElement).disabled === true,
    ariaDisabled: aba.getAttribute('aria-disabled'),
    dataDisabled: aba.getAttribute('data-disabled'),
    ariaSelected: aba.getAttribute('aria-selected'),
    dataState: aba.getAttribute('data-state'),
    tabindex: aba.getAttribute('tabindex'),
    role: aba.getAttribute('role'),
    accessibleName: aba.getAttribute('aria-label') || (aba.textContent ?? '').trim(),
  };
}

/**
 * O que o leitor de tela tem para anunciar sobre a aba.
 *
 * Um botão com `disabled` nativo é removido da árvore de foco e, na prática, a
 * pessoa nunca chega nele para ouvir coisa alguma — por isso `alcancavel` faz
 * parte do anúncio, e não é um dado à parte. `aria-disabled="true"` é o que faz
 * o leitor dizer "indisponível" mantendo a aba no percurso das setas.
 */
export interface AbaAnnouncement {
  papel: string | null;
  name: string;
  /** A aba pode receber foco? Botão nativo desabilitado não pode. */
  alcancavel: boolean;
  /** Existe estado de desabilitado exposto à árvore de acessibilidade? */
  anunciadaComoDesabilitada: boolean;
  selecionada: boolean;
}

export function abaAnnouncement(aba: HTMLElement): AbaAnnouncement {
  const a = lerAba(aba);
  return {
    papel: a.role,
    name: a.accessibleName,
    // `disabled` nativo vence tudo: o elemento não é focável nem por script.
    alcancavel: !a.disabledNativo,
    // O `disabled` nativo TAMBÉM é anunciado — quando alcançado. O ponto é que
    // ele quase nunca é, e é isso que `alcancavel` separa.
    anunciadaComoDesabilitada: a.ariaDisabled === 'true' || a.disabledNativo,
    selecionada: a.ariaSelected === 'true',
  };
}

// ─── Medição completa da aba desabilitada ─────────────────────────────────────

export interface AbaDesabilitadaMeasurement {
  attrs: AbaAttrs;
  anuncio: AbaAnnouncement;
  /** Está esmaecida? (a WCAG isenta controle inativo, mas o desenho promete.) */
  opacity: number;
  pointerEvents: string;
  /** A seta partindo da aba anterior pousou NELA? */
  arrowAlcanca: boolean;
  /** Onde a seta realmente pousou — o nome acessível, para o diff ficar legível. */
  arrowPousouIn: string | null;
  /** Clicar mudou o painel visível? */
  clickAtivou: boolean;
  /** Enter com a aba em foco mudou o painel? `null` = não deu para focar. */
  enterAtivou: boolean | null;
  /** Espaço com a aba em foco mudou o painel? `null` = não deu para focar. */
  espacoAtivou: boolean | null;
  /** Só o foco (ativação automática) já mudou o painel? `null` = não focável. */
  focusAtivou: boolean | null;
  /**
   * A seta CONTINUA a partir da aba desabilitada?
   *
   * Alcançar sem poder sair seria pior que a exclusão que o alcance corrige: a
   * aba viraria um beco sem saída para quem navega por teclado. Em lib que
   * mantém o índice do foco itinerante à parte do DOM, é aqui que a falha
   * aparece. `null` = não deu para focar a aba.
   */
  arrowSegueAdiante: boolean | null;
  /** Onde a seta seguinte pousou, para o diff ficar legível. */
  seguiuTo: string | null;
}

/** Texto do painel visível — é o efeito que prova ativação, não o atributo. */
function panelVisible(root: HTMLElement): string {
  const panel = Array.from(
    root.querySelectorAll<HTMLElement>('[role="tabpanel"]'),
  ).find((p) => !p.hasAttribute('hidden'));
  return (panel?.textContent ?? '').trim();
}

function abas(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('[role="tab"]'));
}

/**
 * Mede a aba desabilitada de um conjunto horizontal de abas.
 *
 * Cada passo estabelece a própria precondição — o colhedor roda dentro de `play`
 * e precisa sobreviver ao REPLAY do painel Interactions, que reexecuta no MESMO
 * DOM. Por isso toda medição parte de "foca a aba anterior" e não de "onde o
 * passo passado deixou".
 *
 * @param raiz elemento que contém o conjunto
 * @param nomeDesabilitada nome visível da aba desabilitada
 * @param acoes teclado e ponteiro da stack
 */
export async function measureAbaDesabilitada(
  root: HTMLElement,
  nomeDesabilitada: string,
  actions: Actions,
): Promise<AbaDesabilitadaMeasurement> {
  const all = abas(root);
  const idx = all.findIndex(
    (a) => (a.getAttribute('aria-label') || a.textContent || '').trim() === nomeDesabilitada,
  );
  if (idx < 1) {
    throw new Error(
      `SONDA: aba "${nomeDesabilitada}" não encontrada (ou é a primeira, e a medição ` +
        `da seta precisa de uma aba anterior). Abas: ` +
        all.map((a) => (a.textContent ?? '').trim()).join(' | '),
    );
  }
  const target = all[idx];
  const previous = all[idx - 1];
  const estilo = getComputedStyle(target);
  const doc = root.ownerDocument;

  const origemPanel = panelVisible(root);

  // ── A seta alcança? ────────────────────────────────────────────────────────
  // Parte SEMPRE da aba anterior, focada por script: o que se mede aqui é o
  // alcance da seta, não a ordem de tabulação (essa é medida à parte).
  previous.focus();
  await actions.apertar('{ArrowRight}');
  const pousou = doc.activeElement as HTMLElement | null;
  const arrowAlcanca = pousou === target;
  const arrowPousouIn = pousou ? (pousou.getAttribute('aria-label') || pousou.textContent || '').trim() : null;

  // ── O foco sozinho ativa? (ativação automática) ────────────────────────────
  const focusAtivou = arrowAlcanca ? panelVisible(root) !== origemPanel : null;

  // ── Restaura o painel de origem antes de medir o clique ────────────────────
  const startVoltar = async () => {
    if (panelVisible(root) === origemPanel) return;
    previous.focus();
    await actions.apertar('{ArrowLeft}');
    // Se a seta não resolveu, o clique na aba anterior resolve.
    if (panelVisible(root) !== origemPanel) await actions.click(previous);
  };
  await startVoltar();

  // ── O clique ativa? ────────────────────────────────────────────────────────
  await actions.click(target);
  const clickAtivou = panelVisible(root) !== origemPanel;
  await startVoltar();

  // ── Enter e Espaço ativam? ─────────────────────────────────────────────────
  let enterAtivou: boolean | null = null;
  let espacoAtivou: boolean | null = null;
  target.focus();
  if (doc.activeElement === target) {
    await actions.apertar('{Enter}');
    enterAtivou = panelVisible(root) !== origemPanel;
    await startVoltar();

    target.focus();
    await actions.apertar(' ');
    espacoAtivou = panelVisible(root) !== origemPanel;
    await startVoltar();
  }

  // ── A seta continua a partir dela? ─────────────────────────────────────────
  let arrowSegueAdiante: boolean | null = null;
  let seguiuTo: string | null = null;
  const seguinte = all[idx + 1];
  if (seguinte) {
    target.focus();
    if (doc.activeElement === target) {
      await actions.apertar('{ArrowRight}');
      const parou = doc.activeElement as HTMLElement | null;
      arrowSegueAdiante = parou === seguinte;
      seguiuTo = parou ? (parou.getAttribute('aria-label') || parou.textContent || '').trim() : null;
      await startVoltar();
    }
  }

  (doc.activeElement as HTMLElement | null)?.blur();

  return {
    attrs: lerAba(target),
    anuncio: abaAnnouncement(target),
    opacity: Number(estilo.opacity),
    pointerEvents: estilo.pointerEvents,
    arrowAlcanca,
    arrowPousouIn,
    clickAtivou,
    enterAtivou,
    espacoAtivou,
    focusAtivou,
    arrowSegueAdiante,
    seguiuTo,
  };
}

/**
 * O veredito do design system sobre a medida — o que a dona decidiu.
 *
 * Devolve a lista de desvios; lista vazia é o resultado bom. Serve tanto para a
 * sonda (que relata) quanto para a asserção permanente (que reprova).
 */
export function desviosDaAbaDesabilitada(m: AbaDesabilitadaMeasurement): string[] {
  const desvios: string[] = [];
  if (m.attrs.disabledNativo)
    desvios.push('emite `disabled` nativo — a aba sai do alcance da seta e do leitor de tela');
  if (m.attrs.ariaDisabled !== 'true')
    desvios.push(`aria-disabled=${JSON.stringify(m.attrs.ariaDisabled)} (esperado "true")`);
  if (!m.arrowAlcanca)
    desvios.push(`a seta não alcança a aba (pousou em ${JSON.stringify(m.arrowPousouIn)})`);
  if (!m.anuncio.anunciadaComoDesabilitada)
    desvios.push('nada expõe o estado desabilitado à árvore de acessibilidade');
  if (m.clickAtivou) desvios.push('o clique ATIVOU a aba');
  if (m.enterAtivou) desvios.push('o Enter ATIVOU a aba');
  if (m.espacoAtivou) desvios.push('o Espaço ATIVOU a aba');
  if (m.focusAtivou) desvios.push('o foco pela seta ATIVOU a aba (ativação automática não foi contida)');
  if (m.anuncio.selecionada) desvios.push('a aba desabilitada está marcada como selecionada');
  if (m.arrowSegueAdiante === false)
    desvios.push(`a seta não sai da aba desabilitada (pousou em ${JSON.stringify(m.seguiuTo)})`);
  return desvios;
}

// ─── Caixa do trilho — WCAG 1.4.4 e 2.5.8 ────────────────────────────────────
//
// O trilho (`.nds-tabs-list`) tinha `height: var(--size-lg)` cravada. Medir a
// altura UMA vez não distingue "36px porque o respiro pede" de "36px porque
// alguém escreveu 36px": os dois devolvem 36. E dobrar a fonte da raiz também
// não distingue, porque `--size-lg` é declarado em `rem` e dobra junto — foi
// exatamente o que a medição mostrou antes da correção (36 → 72, fator 2.0,
// com a altura cravada no lugar).
//
// O que separa gaiola de resultado é EMPURRAR o conteúdo: um gatilho mais alto
// que o trilho faz o trilho crescer quando a altura é resultado, e vaza para
// fora do fundo arredondado quando é cravada. É esse estímulo que a asserção
// permanente aplica, e é ele que fica vermelho se o `height` voltar.

/** WCAG 2.5.8 (Target Size, Minimum) — piso absoluto, em CSS px. */
export const TARGET_MINIMUM_PX = 24;

export interface TrackBox {
  /** Altura do `.nds-tabs-list`. */
  track: number;
  /** Altura do gatilho mais alto. */
  trigger: number;
  /** Respiro somado do trilho (topo + base). */
  respiro: number;
  /**
   * Sobra entre o interior do trilho e o gatilho. Negativa significa que o
   * gatilho vazou para fora do trilho — o sintoma da altura cravada.
   */
  folga: number;
}

function trackOf(root: HTMLElement): HTMLElement {
  const el = root.querySelector<HTMLElement>('.nds-tabs-list');
  if (!el) throw new Error('SONDA: nenhum .nds-tabs-list em cena');
  return el;
}

const arred = (n: number) => Math.round(n * 100) / 100;

/** Lê a caixa do trilho e do gatilho mais alto, no estado atual do documento. */
export function trackMeasureBox(root: HTMLElement): TrackBox {
  const list = trackOf(root);
  const cs = getComputedStyle(list);
  const respiro = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
  const triggers = Array.from(list.querySelectorAll<HTMLElement>('[role="tab"]'));
  const trigger = Math.max(...triggers.map((g) => g.getBoundingClientRect().height));
  const track = list.getBoundingClientRect().height;
  return {
    track: arred(track),
    trigger: arred(trigger),
    respiro: arred(respiro),
    folga: arred(track - respiro - trigger),
  };
}

export interface TrackCrescimento {
  /** Caixa com a fonte da raiz no valor normal. */
  normal: TrackBox;
  /** Caixa com a fonte da raiz DOBRADA. */
  dobrada: TrackBox;
  /** `dobrada.trilho / normal.trilho`. 1.0 é altura presa; ~2.0 é altura que acompanha. */
  fator: number;
  /** Caixa com um gatilho forçado a ficar mais alto que o trilho de hoje. */
  empurrado: TrackBox;
  /** Quanto o trilho cresceu sob o empurrão. Zero é gaiola. */
  ganho: number;
}

/**
 * Mede a caixa do trilho em três situações, e devolve a fonte e o gatilho ao
 * estado original em `finally` — fonte ou estilo vazado envenena a story
 * seguinte e a foto do Chromatic.
 *
 * 1. fonte da raiz normal;
 * 2. fonte da raiz DOBRADA (é o `<html>` que `rem` referencia e que a
 *    configuração do navegador mexe);
 * 3. um gatilho empurrado para além da caixa atual — o estímulo que distingue
 *    respiro de altura cravada.
 */
export function trackMeasureCrescimento(root: HTMLElement): TrackCrescimento {
  const list = trackOf(root);
  const html = root.ownerDocument.documentElement;
  const fonteOriginal = html.style.fontSize;
  const trigger = list.querySelector<HTMLElement>('[role="tab"]')!;
  const minOriginal = trigger.style.minHeight;
  const reflow = () => void root.offsetHeight;

  try {
    const normal = trackMeasureBox(root);

    const emPx = parseFloat(getComputedStyle(html).fontSize) || 16;
    html.style.fontSize = `${emPx * 2}px`;
    reflow();
    const dobrada = trackMeasureBox(root);

    if (fonteOriginal) html.style.fontSize = fonteOriginal;
    else html.style.removeProperty('font-size');
    reflow();

    // O empurrão parte da caixa MEDIDA, não de um número escrito à mão: assim
    // ele continua sendo "mais alto que o trilho" em qualquer densidade, tema
    // ou família de fonte.
    trigger.style.minHeight = `${normal.track + 8}px`;
    reflow();
    const empurrado = trackMeasureBox(root);

    return {
      normal,
      dobrada,
      fator: normal.track > 0 ? arred(dobrada.track / normal.track) : 0,
      empurrado,
      ganho: arred(empurrado.track - normal.track),
    };
  } finally {
    if (fonteOriginal) html.style.fontSize = fonteOriginal;
    else html.style.removeProperty('font-size');
    if (minOriginal) trigger.style.minHeight = minOriginal;
    else trigger.style.removeProperty('min-height');
    reflow();
  }
}

/**
 * O veredito da dona sobre a caixa do trilho. Lista vazia é o resultado bom.
 *
 * Não afirma nada sobre nome de classe nem sobre qual propriedade foi escrita —
 * só sobre o efeito medido.
 */
export function boxDoTrackDesvios(m: TrackCrescimento): string[] {
  const d: string[] = [];
  if (m.fator < 1.9)
    d.push(
      `o trilho não acompanha a fonte da raiz: ${m.normal.track}px → ${m.dobrada.track}px ` +
        `(fator ${m.fator}, esperado ~2)`,
    );
  if (m.ganho <= 0)
    d.push(
      `o trilho não cresce com o conteúdo: gatilho empurrado para além dele e o trilho ` +
        `ficou em ${m.empurrado.track}px (era ${m.normal.track}px) — altura cravada`,
    );
  if (m.empurrado.folga < 0)
    d.push(
      `o gatilho vazou para fora do trilho sob o empurrão (folga ${m.empurrado.folga}px)`,
    );
  if (m.normal.folga < 0)
    d.push(`o gatilho já vaza para fora do trilho em repouso (folga ${m.normal.folga}px)`);
  if (m.normal.trigger < TARGET_MINIMUM_PX)
    d.push(
      `alvo de toque do gatilho em ${m.normal.trigger}px, abaixo dos ${TARGET_MINIMUM_PX}px da WCAG 2.5.8`,
    );
  return d;
}

/**
 * Canal de saída da sonda.
 *
 * `console.log` NÃO chega ao terminal — o addon do Storybook instrumenta o
 * console dentro da `play`. A exceção chega.
 */
export function relatar(stack: string, cenario: string, data: unknown): never {
  throw new Error(`SONDA::${stack}::${cenario}::${JSON.stringify(data)}`);
}
