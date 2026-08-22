/**
 * Sonda de comparação da Caixa de seleção entre as cinco stacks.
 *
 * A pergunta que originou esta sonda veio da rodada do Label: `label[for]` só
 * alcança CONTROLE ROTULÁVEL do HTML (button, input, select, textarea, meter,
 * output, progress). Onde a caixa não é um deles, o par rótulo+caixa fica inerte
 * ao clique no texto — e a story antiga passava havia anos porque conferia
 * `label.htmlFor`, nunca o EFEITO.
 *
 * Por isso a medição central aqui tem DOIS eixos, e o resultado só é bom quando
 * os dois valem:
 *
 *   1. clicar no texto do rótulo ALTERNA o estado da caixa;
 *   2. clicar no texto do rótulo move o FOCO para a caixa visível.
 *
 * A sonda procura os elementos pelo contrato `.nds-*` / `data-slot`. Onde o
 * contrato não é cumprido o campo vem `null` — e isso É o achado, não falha da
 * medição.
 *
 * Armadilhas evitadas aqui (todas tropeçadas de verdade em rodadas anteriores):
 *
 *   - `console.log` não chega ao terminal: o addon do Storybook instrumenta o
 *     console dentro da `play`. O canal é a exceção — ver `reportProbe`.
 *   - Atributo de PRESENÇA casa o valor `"false"`. `[data-indeterminate]` casa
 *     `data-indeterminate="false"`, que algumas libs emitem em todos os nós.
 *     Aqui se lê o valor, nunca só a presença.
 *   - `HTMLElement.click()` na CAIXA não move o foco (não roda os passos de
 *     foco do clique real), então usá-lo para medir "o clique foca" mediria a
 *     API, não o produto. Por isso a focabilidade da caixa é medida à parte, com
 *     `focus()`; o clique no RÓTULO, esse sim, é medido com `.click()` — ali o
 *     foco é efeito da ativação sintética do `<label>`, que é comportamento do
 *     navegador.
 *   - Toda medição é DESFEITA: o estado marcável volta ao valor anterior e o
 *     foco volta a quem o tinha. Sem isso a sonda mudaria o resultado da story
 *     seguinte e a foto do Chromatic.
 */

// ─── Vocabulário ──────────────────────────────────────────────────────────────

/** Elementos que o HTML deixa um `<label for>` alcançar. */
const ROTULAVEIS = ['button', 'input', 'meter', 'output', 'progress', 'select', 'textarea'];

const SELECTOR_BOX = '[data-slot="checkbox"], .nds-checkbox, [role="checkbox"]';

const texto = (el: Element | null | undefined): string | null =>
  el?.textContent?.trim().replace(/\s+/g, ' ') || null;

const classesDe = (el: Element | null | undefined): string[] =>
  (el?.getAttribute('class') || '').split(/\s+/).filter(Boolean);

const describeIn = (el: Element | null): string | null =>
  el ? [el.tagName.toLowerCase(), ...classesDe(el)].join('.') : null;

/** Valor do atributo, tratando presença vazia como `"true"` e `"false"` como falso. */
function presenca(el: Element | null, nome: string): boolean | null {
  if (!el) return null;
  if (!el.hasAttribute(nome)) return false;
  return el.getAttribute(nome) !== 'false';
}

// ─── Estado marcável ──────────────────────────────────────────────────────────

export type Checked = boolean | 'mixed' | null;

/**
 * Estado da caixa como o leitor de tela o entende.
 *
 * `aria-checked` vem primeiro de propósito: é o único canal que as cinco stacks
 * emitem, e é o que a WAI-ARIA define. `data-state` e o input nativo entram só
 * como reserva, para que a sonda ainda meça uma stack que não cumpra o contrato
 * ARIA — medir o descumprimento é justamente o objetivo.
 */
export function stateChecked(el: Element | null): Checked {
  if (!el) return null;
  const aria = el.getAttribute('aria-checked');
  if (aria === 'mixed') return 'mixed';
  if (aria === 'true' || aria === 'false') return aria === 'true';
  const estado = el.getAttribute('data-state');
  if (estado === 'indeterminate') return 'mixed';
  if (estado === 'checked' || estado === 'unchecked') return estado === 'checked';
  if (el instanceof HTMLInputElement && el.type === 'checkbox') {
    return el.indeterminate ? 'mixed' : el.checked;
  }
  return null;
}

/** `true` quando a caixa está desabilitada por atributo nativo OU por ARIA. */
export function estaDesabilitada(el: Element | null): boolean | null {
  if (!el) return null;
  if ((el as HTMLButtonElement).disabled === true) return true;
  return el.getAttribute('aria-disabled') === 'true';
}

/** `true` quando o foco do documento está na caixa (ou dentro dela). */
export function focusEstaIn(el: Element | null): boolean {
  if (!el) return false;
  const ativo = el.ownerDocument.activeElement;
  return ativo === el || el.contains(ativo);
}

// ─── Nome acessível ───────────────────────────────────────────────────────────

/**
 * Aproximação do nome acessível, com a ORIGEM registrada.
 *
 * A origem é o achado que interessa: duas stacks podem anunciar o mesmo texto,
 * uma pelo `aria-labelledby` que a própria story escreveu à mão e outra pela
 * associação nativa do `<label for>`. A primeira é andaime; a segunda é produto.
 */
function nomeAcessivel(caixa: Element | null) {
  if (!caixa) return { valor: null, origem: null } as const;
  const doc = caixa.ownerDocument;

  const labelledBy = caixa.getAttribute('aria-labelledby');
  if (labelledBy) {
    const partes = labelledBy
      .split(/\s+/)
      .map((id) => texto(doc.getElementById(id)))
      .filter(Boolean);
    if (partes.length) return { valor: partes.join(' '), origem: 'aria-labelledby' } as const;
  }

  const rotulo = caixa.getAttribute('aria-label');
  if (rotulo) return { valor: rotulo, origem: 'aria-label' } as const;

  const id = caixa.getAttribute('id');
  if (id) {
    const associado = doc.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`);
    if (associado) {
      // `for` apontando para elemento NÃO rotulável não nomeia nada: o
      // navegador ignora a associação, e o leitor de tela anuncia a caixa sem
      // nome. Registrar "label[for]" aqui esconderia exatamente o defeito que a
      // sonda existe para achar — por isso a origem diz que a associação é nula.
      const vale = ROTULAVEIS.includes(caixa.tagName.toLowerCase());
      return vale
        ? ({ valor: texto(associado), origem: 'label[for]' } as const)
        : ({ valor: null, origem: 'label[for] inerte (caixa não é rotulável)' } as const);
    }
  }

  const ancestral = caixa.closest('label');
  if (ancestral) return { valor: texto(ancestral), origem: 'label ancestral' } as const;

  const own = texto(caixa);
  if (own) return { valor: own, origem: 'conteúdo' } as const;

  return { valor: null, origem: null } as const;
}

/**
 * Ordem em que um leitor de tela anuncia a caixa.
 *
 * Não é a fala literal de um leitor específico — é a ORDEM dos canais que todos
 * eles percorrem (nome, papel, estado, obrigatoriedade, validade, desabilitado).
 * O que a sonda compara entre stacks é a presença e a sequência, não o texto.
 */
function leituraOrder(caixa: Element | null): string[] {
  if (!caixa) return [];
  const partes: string[] = [];
  const nome = nomeAcessivel(caixa).valor;
  if (nome) partes.push(`nome:${nome}`);
  partes.push(`papel:${caixa.getAttribute('role') ?? caixa.tagName.toLowerCase()}`);
  const marcado = stateChecked(caixa);
  partes.push(`estado:${marcado === null ? 'ausente' : String(marcado)}`);
  if (caixa.getAttribute('aria-required') === 'true' || (caixa as HTMLInputElement).required) {
    partes.push('obrigatório');
  }
  if (caixa.getAttribute('aria-invalid') === 'true') partes.push('inválido');
  if (caixa.getAttribute('aria-readonly') === 'true') partes.push('somente leitura');
  if (estaDesabilitada(caixa)) partes.push('desabilitado');
  return partes;
}

// ─── Medição do clique no rótulo ──────────────────────────────────────────────

/**
 * A pergunta inteira desta sonda: clicar no TEXTO do rótulo foca e alterna?
 *
 * `HTMLElement.click()` no `<label>` executa a ativação sintética que o
 * navegador define para o elemento — é o caminho do produto, não uma simulação
 * da biblioteca de teste, e por isso responde pelo que o usuário vê.
 *
 * Tudo é restaurado no fim.
 */
function labelAoClick(rotulo: HTMLElement | null, caixa: Element | null) {
  if (!rotulo) return { focou: null, focusFoiTo: null, alternou: null, erro: 'sem rótulo' };

  const doc = rotulo.ownerDocument;
  const focusPrevious = doc.activeElement as HTMLElement | null;
  const antes = stateChecked(caixa);

  let focou: boolean | null = null;
  let focusFoiTo: string | null = null;
  let alternou: boolean | null = null;
  let erro: string | null = null;

  try {
    rotulo.click();
    focou = focusEstaIn(caixa);
    focusFoiTo = describeIn(doc.activeElement);
    const depois = stateChecked(caixa);
    alternou = antes === null ? null : depois !== antes;
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e);
  }

  // Desfaz: devolve a caixa ao estado original e o foco a quem o tinha.
  if (antes !== null && stateChecked(caixa) !== antes) (caixa as HTMLElement).click();
  if (focusPrevious && focusPrevious !== doc.body) focusPrevious.focus();
  else (doc.activeElement as HTMLElement | null)?.blur?.();

  return { focou, focusFoiTo, alternou, erro };
}

/** Clicar na própria caixa alterna? (o foco do clique real é medido à parte) */
function boxAoClick(caixa: Element | null) {
  if (!caixa) return { alternou: null, erro: 'sem caixa' };
  const antes = stateChecked(caixa);
  let alternou: boolean | null = null;
  let erro: string | null = null;
  try {
    (caixa as HTMLElement).click();
    const depois = stateChecked(caixa);
    alternou = antes === null ? null : depois !== antes;
  } catch (e) {
    erro = e instanceof Error ? e.message : String(e);
  }
  if (antes !== null && stateChecked(caixa) !== antes) (caixa as HTMLElement).click();
  return { alternou, erro };
}

/** A caixa aceita foco programático, e sobra foco visível? */
function focabilidade(caixa: Element | null) {
  if (!caixa) return { aceitaFocus: null, focusRing: null };
  const doc = caixa.ownerDocument;
  const focusPrevious = doc.activeElement as HTMLElement | null;
  (caixa as HTMLElement).focus?.();
  const aceitaFocus = doc.activeElement === caixa;
  let focusRing: boolean | null = null;
  if (aceitaFocus) {
    const cs = getComputedStyle(caixa);
    focusRing = cs.outlineStyle !== 'none' || cs.boxShadow !== 'none';
  }
  if (focusPrevious && focusPrevious !== doc.body) focusPrevious.focus();
  else (doc.activeElement as HTMLElement | null)?.blur?.();
  return { aceitaFocus, focusRing };
}

/** Quem recebe o clique no centro do elemento — pega peça coberta por overlay. */
function quemRecebeOClique(el: Element | null): string | null {
  if (!el) return null;
  const caixa = el.getBoundingClientRect();
  if (caixa.width === 0 || caixa.height === 0) return null;
  const alvo = el.ownerDocument.elementFromPoint(
    caixa.left + caixa.width / 2,
    caixa.top + caixa.height / 2,
  );
  return describeIn(alvo);
}

// ─── Medição ──────────────────────────────────────────────────────────────────

/** Mede UMA caixa e o rótulo que a rotula. `raiz` é o wrapper do cenário. */
export function measureBox(raiz: HTMLElement) {
  const caixa = raiz.querySelector<HTMLElement>(SELECTOR_BOX);
  if (!caixa) return { presente: false } as const;

  const doc = caixa.ownerDocument;
  const classes = classesDe(caixa);
  const cs = getComputedStyle(caixa);
  const retangulo = caixa.getBoundingClientRect();

  const rotulo =
    raiz.querySelector<HTMLLabelElement>('label[data-slot="label"]') ??
    raiz.querySelector<HTMLLabelElement>('label');

  const htmlFor = rotulo?.getAttribute('for') ?? null;
  const forTarget = htmlFor ? doc.getElementById(htmlFor) : null;

  const indicador = caixa.querySelector<HTMLElement>(
    '[data-slot="checkbox-indicator"], .nds-checkbox-indicator',
  );
  const inputEscondido = raiz.querySelector<HTMLInputElement>('input[type="checkbox"]');

  return {
    presente: true,

    // ── Estrutura: é rotulável pelo HTML? é aí que o defeito nasce ────────────
    caixa: {
      tag: caixa.tagName.toLowerCase(),
      /** O eixo do defeito: `label[for]` só alcança elemento rotulável. */
      ehRotulavelPeloHtml: ROTULAVEIS.includes(caixa.tagName.toLowerCase()),
      type: caixa.getAttribute('type'),
      role: caixa.getAttribute('role'),
      id: caixa.getAttribute('id'),
      dataSlot: caixa.getAttribute('data-slot'),
      tabIndex: caixa.getAttribute('tabindex'),
      /**
       * O tabIndex EFETIVO, não o atributo. Um `<button disabled>` continua
       * reportando `0` aqui e não tem atributo `tabindex` nenhum — o que o tira
       * da ordem de tabulação é o `disabled`, não o índice. Ler só o atributo
       * responderia "0" nas duas situações opostas, que é exatamente o erro que
       * esta sonda existe para não cometer.
       */
      tabIndexEfetivo: (caixa as HTMLElement).tabIndex,
      temClasseBase: classes.includes('nds-checkbox'),
      /** Classe sem o prefixo do design system: inerte, não pinta nada. */
      classesInertes: classes.filter((c) => !c.startsWith('nds-')),
      largura: Math.round(retangulo.width),
      altura: Math.round(retangulo.height),
      cursor: cs.cursor,
    },

    // ── Estado tri-valorado ──────────────────────────────────────────────────
    estado: {
      ariaChecked: caixa.getAttribute('aria-checked'),
      dataState: caixa.getAttribute('data-state'),
      dataChecked: presenca(caixa, 'data-checked'),
      dataIndeterminate: presenca(caixa, 'data-indeterminate'),
      marcado: stateChecked(caixa),
      background: cs.backgroundColor,
    },

    // ── Desabilitado: atributo nativo × ARIA ─────────────────────────────────
    desabilitado: {
      atributoNativo: (caixa as HTMLButtonElement).disabled === true,
      ariaDisabled: caixa.getAttribute('aria-disabled'),
      dataDisabled: presenca(caixa, 'data-disabled'),
      efetivo: estaDesabilitada(caixa),
      opacidade: Number(cs.opacity),
    },

    // ── Contrato ARIA que o WAI-ARIA pede para role="checkbox" ───────────────
    aria: {
      ariaRequired: caixa.getAttribute('aria-required'),
      ariaInvalid: caixa.getAttribute('aria-invalid'),
      ariaReadonly: caixa.getAttribute('aria-readonly'),
      ariaLabelledby: caixa.getAttribute('aria-labelledby'),
      ariaLabel: caixa.getAttribute('aria-label'),
      ariaDescribedby: caixa.getAttribute('aria-describedby'),
    },

    nome: nomeAcessivel(caixa),
    leitura: leituraOrder(caixa),

    // ── Rótulo e a associação ────────────────────────────────────────────────
    rotulo: {
      existe: !!rotulo,
      dataSlot: rotulo?.getAttribute('data-slot') ?? null,
      htmlFor,
      texto: texto(rotulo),
      alvoDoForExiste: htmlFor ? !!forTarget : null,
      /** `false` aqui significa: o `for` aponta para outra coisa (input oculto). */
      alvoDoForEhACaixa: forTarget ? forTarget === caixa : null,
      alvoDoForTag: forTarget?.tagName.toLowerCase() ?? null,
      cursor: rotulo ? getComputedStyle(rotulo).cursor : null,
      /** Ouvinte de clique escrito na story para compensar o componente. */
      temAndaimeDeClique: rotulo?.hasAttribute('data-andaime-clique') ?? null,
    },

    // ── Input nativo escondido (participação em formulário) ──────────────────
    inputEscondido: {
      existe: !!inputEscondido,
      id: inputEscondido?.getAttribute('id') ?? null,
      tabIndex: inputEscondido?.getAttribute('tabindex') ?? null,
      ariaHidden: inputEscondido?.getAttribute('aria-hidden') ?? null,
      name: inputEscondido?.getAttribute('name') ?? null,
      checked: inputEscondido?.checked ?? null,
      indeterminate: inputEscondido?.indeterminate ?? null,
      /** O `for` do rótulo caindo no input oculto é o defeito do React. */
      ehAlvoDoFor: inputEscondido ? forTarget === inputEscondido : null,
    },

    // ── Indicador: traço (misto) × marca de seleção ──────────────────────────
    indicador: {
      existe: !!indicador,
      desenho: indicador?.querySelector('line')
        ? 'traço'
        : indicador?.querySelector('polyline, path')
          ? 'marca'
          : null,
      visible: indicador ? getComputedStyle(indicador).display !== 'none' : null,
    },

    // ── OS DOIS EIXOS ────────────────────────────────────────────────────────
    cliqueNoRotulo: labelAoClick(rotulo, caixa),
    cliqueNaCaixa: boxAoClick(caixa),
    focus: focabilidade(caixa),

    reach: {
      centroDaCaixa: quemRecebeOClique(caixa),
      centroDoRotulo: quemRecebeOClique(rotulo),
    },
  };
}

/**
 * Mede os cenários marcados com `data-sonda="<nome>"` dentro de `raiz`.
 * Cenário ausente vem `null` — é o achado de "a stack não monta este caso".
 */
export function measureBoxes(raiz: HTMLElement, cenarios: string[]) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    registro[cenario] = alvo ? measureBox(alvo) : null;
  }
  return registro;
}

/**
 * O MESMO clique no rótulo, mas pelo caminho da biblioteca de teste.
 *
 * Existem dois canais e eles podem divergir: `label.click()` dispara a ativação
 * sintética que o navegador define para o `<label>`; `userEvent.click()` simula
 * a sequência de ponteiro (pointerdown → mousedown → focus → click) e tem lógica
 * própria de foco. A asserção permanente vai rodar pelo segundo — então medir só
 * o primeiro deixaria a asserção sem lastro.
 *
 * Há um segundo motivo, medido: `measureBox` é SÍNCRONO e lê o estado no
 * instante seguinte ao `.click()`. Onde o renderizador aplica a mudança em
 * microtarefa ou em ciclo próprio de detecção, aquele campo sai `alternou:false`
 * mesmo com o componente correto — falso negativo de medição, não defeito. Foi
 * o que aconteceu com três das cinco stacks, enquanto ESTA função, que aguarda,
 * devolveu `true` nas cinco. Ao comparar as stacks, o campo desta função é o que
 * vale; o de `medirCaixa.cliqueNoRotulo` só serve como pista.
 */
export async function usuarioMeasureClick(
  raiz: HTMLElement,
  cenarios: string[],
  click: (el: HTMLElement) => Promise<unknown>,
) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    const caixa = alvo?.querySelector<HTMLElement>(SELECTOR_BOX) ?? null;
    const rotulo = alvo?.querySelector<HTMLLabelElement>('label') ?? null;
    if (!alvo || !rotulo) {
      registro[cenario] = null;
      continue;
    }
    const doc = rotulo.ownerDocument;
    const antes = stateChecked(caixa);
    let resultado: Record<string, unknown>;
    try {
      await click(rotulo);
      resultado = {
        focou: focusEstaIn(caixa),
        focusFoiTo: describeIn(doc.activeElement),
        alternou: antes === null ? null : stateChecked(caixa) !== antes,
      };
    } catch (e) {
      resultado = { erro: e instanceof Error ? e.message : String(e) };
    }
    // Desfaz, para não envenenar o cenário seguinte nem a foto do Chromatic.
    if (antes !== null && stateChecked(caixa) !== antes) caixa?.click();
    (doc.activeElement as HTMLElement | null)?.blur?.();
    registro[cenario] = resultado;
  }
  return registro;
}

// ─── Alcance por teclado ──────────────────────────────────────────────────────

/** Teto de Tabs por cenário. Alto o bastante para o pior caso, finito de propósito. */
const LIMIT_TAB = 12;

export type KeyboardFerramentas = {
  /** `userEvent.tab` da stack. */
  tab: () => Promise<unknown>;
  /** `userEvent.keyboard` da stack. */
  teclar: (sequencia: string) => Promise<unknown>;
  /** `userEvent.click` da stack — o caminho de ponteiro real, não `.click()`. */
  click: (el: HTMLElement) => Promise<unknown>;
};

/**
 * Mede o que o `tabIndex` NÃO responde: a caixa entra na ordem de tabulação, e o
 * que acontece quando ela é ativada por teclado e por ponteiro.
 *
 * A pergunta desta rodada tem três eixos, e o resultado só é bom quando os três
 * valem ao mesmo tempo na peça desabilitada:
 *
 *   1. Tab PARA na caixa — ela continua alcançável;
 *   2. Espaço NÃO alterna;
 *   3. o clique de ponteiro NÃO alterna.
 *
 * Por que Tab de verdade, e não `focus()`: `focus()` passa em elemento com
 * `tabindex="-1"`, e é exatamente essa a diferença entre "focável" e "alcançável
 * pelo teclado". Medir com `focus()` daria verde numa caixa que ninguém alcança.
 *
 * Tudo é desfeito: o estado marcável volta ao valor anterior e o foco é solto.
 */
export async function keyboardMeasureReach(
  raiz: HTMLElement,
  cenarios: string[],
  { tab, teclar, click }: KeyboardFerramentas,
) {
  const registro: Record<string, unknown> = {};

  for (const cenario of cenarios) {
    const alvo = raiz.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    const caixa = alvo?.querySelector<HTMLElement>(SELECTOR_BOX) ?? null;
    if (!caixa) {
      registro[cenario] = null;
      continue;
    }

    const doc = caixa.ownerDocument;
    const inicial = stateChecked(caixa);

    // ── 1. Tab para na caixa? ────────────────────────────────────────────────
    (doc.activeElement as HTMLElement | null)?.blur?.();
    let tabAlcancada = false;
    let tabsAteChegar: number | null = null;
    const paradasDoTab: string[] = [];
    for (let i = 1; i <= LIMIT_TAB && !tabAlcancada; i += 1) {
      await tab();
      paradasDoTab.push(describeIn(doc.activeElement) ?? 'nenhum');
      if (focusEstaIn(caixa)) {
        tabAlcancada = true;
        tabsAteChegar = i;
      }
    }

    // ── 2. Espaço alterna? ───────────────────────────────────────────────────
    // Foco programático como reserva: sem foco, a tecla iria para o documento e
    // a medição responderia "não alterna" pelo motivo errado.
    let espacoAlterna: boolean | null = null;
    let teclaFocusAceito = tabAlcancada;
    if (!tabAlcancada) {
      caixa.focus?.();
      teclaFocusAceito = doc.activeElement === caixa;
    }
    if (teclaFocusAceito) {
      const antes = stateChecked(caixa);
      await teclar(' ');
      espacoAlterna = antes === null ? null : stateChecked(caixa) !== antes;
      if (antes !== null && stateChecked(caixa) !== antes) await teclar(' ');
    }

    // ── 3. O clique de ponteiro alterna? ─────────────────────────────────────
    let clickAlterna: boolean | null = null;
    let clickError: string | null = null;
    {
      const antes = stateChecked(caixa);
      try {
        await click(caixa);
        clickAlterna = antes === null ? null : stateChecked(caixa) !== antes;
      } catch (e) {
        clickError = e instanceof Error ? e.message : String(e);
      }
    }

    // Desfaz tudo o que a medição possa ter mudado.
    if (inicial !== null && stateChecked(caixa) !== inicial) caixa.click();
    (doc.activeElement as HTMLElement | null)?.blur?.();

    registro[cenario] = {
      tabAlcancada,
      tabsAteChegar,
      paradasDoTab,
      teclaFocusAceito,
      espacoAlterna,
      clickAlterna,
      clickError,
      estadoPreservado: stateChecked(caixa) === inicial,
    };
  }

  return registro;
}

// ─── Contrato do estado desabilitado ──────────────────────────────────────────

/**
 * Reprovas da caixa DESABILITADA, como lista fechada. Vazia significa correta.
 *
 * Existe compartilhado, e não copiado em cinco stories, porque o contrato é um
 * só e a divergência entre cópias foi o defeito da rodada anterior: cada stack
 * afirmava o estado desabilitado por um canal diferente, e três delas afirmavam
 * justamente o comportamento que a dona decidiu abandonar.
 *
 * O que se exige, e por quê:
 *
 *   1. **`aria-disabled="true"`, sem `disabled` nativo.** Os dois juntos não
 *      existem: o nativo tira da tabulação, que é o que se quer evitar. Checar a
 *      ausência do nativo é o que faz esta asserção PODER falhar se alguém
 *      reintroduzir o atributo — `aria-disabled` sozinho passaria nas duas.
 *   2. **Tab alcança a caixa.** Com Tab de verdade, nunca `focus()`: o
 *      programático passa até em `tabindex="-1"`, e foi exatamente essa a
 *      diferença que a sonda encontrou no Vanilla.
 *   3. **Espaço não alterna.**
 *   4. **O clique não alterna.**
 *
 * `toBeDisabled()` do jest-dom NÃO serve para nada disto: ele lê o atributo
 * nativo e ignora `aria-disabled`, então passaria a valer o contrário do
 * contrato — e a versão negada (`not.toBeDisabled()`) viraria asserção que não
 * pode falhar.
 *
 * Cada verificação estabelece a própria precondição (solta o foco, relê o
 * estado antes de cada ação), e o estado de uma caixa desabilitada não muda em
 * rodada nenhuma — então a lista sobrevive ao REPLAY do painel Interactions.
 */
export async function disabledReprovas(
  caixa: HTMLElement,
  { tab, teclar, click }: KeyboardFerramentas,
): Promise<string[]> {
  const reprovas: string[] = [];
  const doc = caixa.ownerDocument;

  // 1. Anunciada como indisponível, pelo canal que não tira da tabulação.
  if (caixa.getAttribute('aria-disabled') !== 'true') {
    reprovas.push(
      `não é anunciada como desabilitada: aria-disabled=${JSON.stringify(
        caixa.getAttribute('aria-disabled'),
      )}`,
    );
  }
  if ((caixa as HTMLButtonElement).disabled === true) {
    reprovas.push('carrega o atributo `disabled` nativo, que a tira da ordem de tabulação');
  }

  // 2. Tab alcança a caixa.
  (doc.activeElement as HTMLElement | null)?.blur?.();
  let alcancada = false;
  for (let i = 0; i < LIMIT_TAB && !alcancada; i += 1) {
    await tab();
    if (focusEstaIn(caixa)) alcancada = true;
  }
  if (!alcancada) {
    reprovas.push(`o Tab não alcança a caixa em ${LIMIT_TAB} passos`);
  }

  // 3. Espaço não alterna. Só faz sentido perguntar com o foco na caixa.
  if (alcancada) {
    const antes = stateChecked(caixa);
    await teclar(' ');
    if (stateChecked(caixa) !== antes) {
      reprovas.push(`Espaço alternou o estado: ${String(antes)} → ${String(stateChecked(caixa))}`);
    }
  }

  // 4. O clique não alterna. `pointerEventsCheck: 0` fica a cargo de quem chama:
  // `cursor: not-allowed` não bloqueia ponteiro, mas a checagem do userEvent
  // reprova antes de clicar em parte das stacks.
  {
    const antes = stateChecked(caixa);
    await click(caixa);
    if (stateChecked(caixa) !== antes) {
      reprovas.push(`o clique alternou o estado: ${String(antes)} → ${String(stateChecked(caixa))}`);
    }
  }

  (doc.activeElement as HTMLElement | null)?.blur?.();
  return reprovas;
}

/**
 * Emite o registro para fora do navegador.
 *
 * Via exceção, e não `console.log`: o addon do Storybook instrumenta o console
 * dentro da play e nada do que se escreve ali chega ao terminal do vitest.
 */
export async function reportProbe(
  stack: string,
  raiz: HTMLElement,
  cenarios: string[],
  ferramentas: KeyboardFerramentas,
) {
  const registro = {
    dom: measureBoxes(raiz, cenarios),
    cliqueDoUsuario: await usuarioMeasureClick(raiz, cenarios, ferramentas.click),
    teclado: await keyboardMeasureReach(raiz, cenarios, ferramentas),
  };
  throw new Error(`SONDA::${stack}::${JSON.stringify(registro)}`);
}
