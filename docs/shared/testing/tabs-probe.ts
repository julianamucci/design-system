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
 * As teclas e o clique entram por injeção (`Acoes`) porque `userEvent` mora no
 * pacote de teste de cada stack, e `docs/shared` não depende de nenhuma.
 */

/** Torneira de interação — cada stack passa a sua, vinda de `storybook/test`. */
export interface Acoes {
  /** Envia uma tecla ao elemento em foco. Ex.: `'{ArrowRight}'`. */
  apertar: (tecla: string) => Promise<void>;
  /** Clica ignorando `pointer-events: none` (senão o clique nem é tentado). */
  clicar: (el: HTMLElement) => Promise<void>;
}

// ─── Leitura do DOM ───────────────────────────────────────────────────────────

/** O que a aba emite, cru. É a assinatura do mecanismo escolhido pela stack. */
export interface AtributosDaAba {
  /** Atributo `disabled` nativo — o que tira o botão do alcance do foco. */
  disabledNativo: boolean;
  ariaDisabled: string | null;
  dataDisabled: string | null;
  ariaSelected: string | null;
  dataState: string | null;
  tabindex: string | null;
  role: string | null;
  nomeAcessivel: string;
}

export function lerAba(aba: HTMLElement): AtributosDaAba {
  return {
    disabledNativo:
      aba.hasAttribute('disabled') || (aba as HTMLButtonElement).disabled === true,
    ariaDisabled: aba.getAttribute('aria-disabled'),
    dataDisabled: aba.getAttribute('data-disabled'),
    ariaSelected: aba.getAttribute('aria-selected'),
    dataState: aba.getAttribute('data-state'),
    tabindex: aba.getAttribute('tabindex'),
    role: aba.getAttribute('role'),
    nomeAcessivel: aba.getAttribute('aria-label') || (aba.textContent ?? '').trim(),
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
export interface AnuncioDaAba {
  papel: string | null;
  nome: string;
  /** A aba pode receber foco? Botão nativo desabilitado não pode. */
  alcancavel: boolean;
  /** Existe estado de desabilitado exposto à árvore de acessibilidade? */
  anunciadaComoDesabilitada: boolean;
  selecionada: boolean;
}

export function anuncioDaAba(aba: HTMLElement): AnuncioDaAba {
  const a = lerAba(aba);
  return {
    papel: a.role,
    nome: a.nomeAcessivel,
    // `disabled` nativo vence tudo: o elemento não é focável nem por script.
    alcancavel: !a.disabledNativo,
    // O `disabled` nativo TAMBÉM é anunciado — quando alcançado. O ponto é que
    // ele quase nunca é, e é isso que `alcancavel` separa.
    anunciadaComoDesabilitada: a.ariaDisabled === 'true' || a.disabledNativo,
    selecionada: a.ariaSelected === 'true',
  };
}

// ─── Medição completa da aba desabilitada ─────────────────────────────────────

export interface MedidaDaAbaDesabilitada {
  atributos: AtributosDaAba;
  anuncio: AnuncioDaAba;
  /** Está esmaecida? (a WCAG isenta controle inativo, mas o desenho promete.) */
  opacidade: number;
  pointerEvents: string;
  /** A seta partindo da aba anterior pousou NELA? */
  setaAlcanca: boolean;
  /** Onde a seta realmente pousou — o nome acessível, para o diff ficar legível. */
  setaPousouEm: string | null;
  /** Clicar mudou o painel visível? */
  cliqueAtivou: boolean;
  /** Enter com a aba em foco mudou o painel? `null` = não deu para focar. */
  enterAtivou: boolean | null;
  /** Espaço com a aba em foco mudou o painel? `null` = não deu para focar. */
  espacoAtivou: boolean | null;
  /** Só o foco (ativação automática) já mudou o painel? `null` = não focável. */
  focoAtivou: boolean | null;
  /**
   * A seta CONTINUA a partir da aba desabilitada?
   *
   * Alcançar sem poder sair seria pior que a exclusão que o alcance corrige: a
   * aba viraria um beco sem saída para quem navega por teclado. Em lib que
   * mantém o índice do foco itinerante à parte do DOM, é aqui que a falha
   * aparece. `null` = não deu para focar a aba.
   */
  setaSegueAdiante: boolean | null;
  /** Onde a seta seguinte pousou, para o diff ficar legível. */
  seguiuPara: string | null;
}

/** Texto do painel visível — é o efeito que prova ativação, não o atributo. */
function painelVisivel(raiz: HTMLElement): string {
  const painel = Array.from(
    raiz.querySelectorAll<HTMLElement>('[role="tabpanel"]'),
  ).find((p) => !p.hasAttribute('hidden'));
  return (painel?.textContent ?? '').trim();
}

function abas(raiz: HTMLElement): HTMLElement[] {
  return Array.from(raiz.querySelectorAll<HTMLElement>('[role="tab"]'));
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
export async function medirAbaDesabilitada(
  raiz: HTMLElement,
  nomeDesabilitada: string,
  acoes: Acoes,
): Promise<MedidaDaAbaDesabilitada> {
  const todas = abas(raiz);
  const idx = todas.findIndex(
    (a) => (a.getAttribute('aria-label') || a.textContent || '').trim() === nomeDesabilitada,
  );
  if (idx < 1) {
    throw new Error(
      `SONDA: aba "${nomeDesabilitada}" não encontrada (ou é a primeira, e a medição ` +
        `da seta precisa de uma aba anterior). Abas: ` +
        todas.map((a) => (a.textContent ?? '').trim()).join(' | '),
    );
  }
  const alvo = todas[idx];
  const anterior = todas[idx - 1];
  const estilo = getComputedStyle(alvo);
  const doc = raiz.ownerDocument;

  const painelDeOrigem = painelVisivel(raiz);

  // ── A seta alcança? ────────────────────────────────────────────────────────
  // Parte SEMPRE da aba anterior, focada por script: o que se mede aqui é o
  // alcance da seta, não a ordem de tabulação (essa é medida à parte).
  anterior.focus();
  await acoes.apertar('{ArrowRight}');
  const pousou = doc.activeElement as HTMLElement | null;
  const setaAlcanca = pousou === alvo;
  const setaPousouEm = pousou ? (pousou.getAttribute('aria-label') || pousou.textContent || '').trim() : null;

  // ── O foco sozinho ativa? (ativação automática) ────────────────────────────
  const focoAtivou = setaAlcanca ? painelVisivel(raiz) !== painelDeOrigem : null;

  // ── Restaura o painel de origem antes de medir o clique ────────────────────
  const voltarAoInicio = async () => {
    if (painelVisivel(raiz) === painelDeOrigem) return;
    anterior.focus();
    await acoes.apertar('{ArrowLeft}');
    // Se a seta não resolveu, o clique na aba anterior resolve.
    if (painelVisivel(raiz) !== painelDeOrigem) await acoes.clicar(anterior);
  };
  await voltarAoInicio();

  // ── O clique ativa? ────────────────────────────────────────────────────────
  await acoes.clicar(alvo);
  const cliqueAtivou = painelVisivel(raiz) !== painelDeOrigem;
  await voltarAoInicio();

  // ── Enter e Espaço ativam? ─────────────────────────────────────────────────
  let enterAtivou: boolean | null = null;
  let espacoAtivou: boolean | null = null;
  alvo.focus();
  if (doc.activeElement === alvo) {
    await acoes.apertar('{Enter}');
    enterAtivou = painelVisivel(raiz) !== painelDeOrigem;
    await voltarAoInicio();

    alvo.focus();
    await acoes.apertar(' ');
    espacoAtivou = painelVisivel(raiz) !== painelDeOrigem;
    await voltarAoInicio();
  }

  // ── A seta continua a partir dela? ─────────────────────────────────────────
  let setaSegueAdiante: boolean | null = null;
  let seguiuPara: string | null = null;
  const seguinte = todas[idx + 1];
  if (seguinte) {
    alvo.focus();
    if (doc.activeElement === alvo) {
      await acoes.apertar('{ArrowRight}');
      const parou = doc.activeElement as HTMLElement | null;
      setaSegueAdiante = parou === seguinte;
      seguiuPara = parou ? (parou.getAttribute('aria-label') || parou.textContent || '').trim() : null;
      await voltarAoInicio();
    }
  }

  (doc.activeElement as HTMLElement | null)?.blur();

  return {
    atributos: lerAba(alvo),
    anuncio: anuncioDaAba(alvo),
    opacidade: Number(estilo.opacity),
    pointerEvents: estilo.pointerEvents,
    setaAlcanca,
    setaPousouEm,
    cliqueAtivou,
    enterAtivou,
    espacoAtivou,
    focoAtivou,
    setaSegueAdiante,
    seguiuPara,
  };
}

/**
 * O veredito do design system sobre a medida — o que a dona decidiu.
 *
 * Devolve a lista de desvios; lista vazia é o resultado bom. Serve tanto para a
 * sonda (que relata) quanto para a asserção permanente (que reprova).
 */
export function desviosDaAbaDesabilitada(m: MedidaDaAbaDesabilitada): string[] {
  const desvios: string[] = [];
  if (m.atributos.disabledNativo)
    desvios.push('emite `disabled` nativo — a aba sai do alcance da seta e do leitor de tela');
  if (m.atributos.ariaDisabled !== 'true')
    desvios.push(`aria-disabled=${JSON.stringify(m.atributos.ariaDisabled)} (esperado "true")`);
  if (!m.setaAlcanca)
    desvios.push(`a seta não alcança a aba (pousou em ${JSON.stringify(m.setaPousouEm)})`);
  if (!m.anuncio.anunciadaComoDesabilitada)
    desvios.push('nada expõe o estado desabilitado à árvore de acessibilidade');
  if (m.cliqueAtivou) desvios.push('o clique ATIVOU a aba');
  if (m.enterAtivou) desvios.push('o Enter ATIVOU a aba');
  if (m.espacoAtivou) desvios.push('o Espaço ATIVOU a aba');
  if (m.focoAtivou) desvios.push('o foco pela seta ATIVOU a aba (ativação automática não foi contida)');
  if (m.anuncio.selecionada) desvios.push('a aba desabilitada está marcada como selecionada');
  if (m.setaSegueAdiante === false)
    desvios.push(`a seta não sai da aba desabilitada (pousou em ${JSON.stringify(m.seguiuPara)})`);
  return desvios;
}

/**
 * Canal de saída da sonda.
 *
 * `console.log` NÃO chega ao terminal — o addon do Storybook instrumenta o
 * console dentro da `play`. A exceção chega.
 */
export function relatar(stack: string, cenario: string, dados: unknown): never {
  throw new Error(`SONDA::${stack}::${cenario}::${JSON.stringify(dados)}`);
}
