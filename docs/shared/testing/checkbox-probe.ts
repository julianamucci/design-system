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

const text = (el: Element | null | undefined): string | null =>
  el?.textContent?.trim().replace(/\s+/g, ' ') || null;

const classesDe = (el: Element | null | undefined): string[] =>
  (el?.getAttribute('class') || '').split(/\s+/).filter(Boolean);

const describeIn = (el: Element | null): string | null =>
  el ? [el.tagName.toLowerCase(), ...classesDe(el)].join('.') : null;

/** Valor do atributo, tratando presença vazia como `"true"` e `"false"` como falso. */
function presenca(el: Element | null, name: string): boolean | null {
  if (!el) return null;
  if (!el.hasAttribute(name)) return false;
  return el.getAttribute(name) !== 'false';
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
  const state = el.getAttribute('data-state');
  if (state === 'indeterminate') return 'mixed';
  if (state === 'checked' || state === 'unchecked') return state === 'checked';
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
  const active = el.ownerDocument.activeElement;
  return active === el || el.contains(active);
}

// ─── Nome acessível ───────────────────────────────────────────────────────────

/**
 * Aproximação do nome acessível, com a ORIGEM registrada.
 *
 * A origem é o achado que interessa: duas stacks podem anunciar o mesmo texto,
 * uma pelo `aria-labelledby` que a própria story escreveu à mão e outra pela
 * associação nativa do `<label for>`. A primeira é andaime; a segunda é produto.
 */
function accessibleName(box: Element | null) {
  if (!box) return { value: null, origem: null } as const;
  const doc = box.ownerDocument;

  const labelledBy = box.getAttribute('aria-labelledby');
  if (labelledBy) {
    const partes = labelledBy
      .split(/\s+/)
      .map((id) => text(doc.getElementById(id)))
      .filter(Boolean);
    if (partes.length) return { value: partes.join(' '), origem: 'aria-labelledby' } as const;
  }

  const label = box.getAttribute('aria-label');
  if (label) return { value: label, origem: 'aria-label' } as const;

  const id = box.getAttribute('id');
  if (id) {
    const associado = doc.querySelector<HTMLLabelElement>(`label[for="${CSS.escape(id)}"]`);
    if (associado) {
      // `for` apontando para elemento NÃO rotulável não nomeia nada: o
      // navegador ignora a associação, e o leitor de tela anuncia a caixa sem
      // nome. Registrar "label[for]" aqui esconderia exatamente o defeito que a
      // sonda existe para achar — por isso a origem diz que a associação é nula.
      const vale = ROTULAVEIS.includes(box.tagName.toLowerCase());
      return vale
        ? ({ value: text(associado), origem: 'label[for]' } as const)
        : ({ value: null, origem: 'label[for] inerte (caixa não é rotulável)' } as const);
    }
  }

  const ancestral = box.closest('label');
  if (ancestral) return { value: text(ancestral), origem: 'label ancestral' } as const;

  const own = text(box);
  if (own) return { value: own, origem: 'conteúdo' } as const;

  return { value: null, origem: null } as const;
}

/**
 * Ordem em que um leitor de tela anuncia a caixa.
 *
 * Não é a fala literal de um leitor específico — é a ORDEM dos canais que todos
 * eles percorrem (nome, papel, estado, obrigatoriedade, validade, desabilitado).
 * O que a sonda compara entre stacks é a presença e a sequência, não o texto.
 */
function leituraOrder(box: Element | null): string[] {
  if (!box) return [];
  const partes: string[] = [];
  const name = accessibleName(box).value;
  if (name) partes.push(`nome:${name}`);
  partes.push(`papel:${box.getAttribute('role') ?? box.tagName.toLowerCase()}`);
  const checked = stateChecked(box);
  partes.push(`estado:${checked === null ? 'ausente' : String(checked)}`);
  if (box.getAttribute('aria-required') === 'true' || (box as HTMLInputElement).required) {
    partes.push('obrigatório');
  }
  if (box.getAttribute('aria-invalid') === 'true') partes.push('inválido');
  if (box.getAttribute('aria-readonly') === 'true') partes.push('somente leitura');
  if (estaDesabilitada(box)) partes.push('desabilitado');
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
function labelAoClick(label: HTMLElement | null, box: Element | null) {
  if (!label) return { focou: null, focusFoiTo: null, alternou: null, error: 'sem rótulo' };

  const doc = label.ownerDocument;
  const focusPrevious = doc.activeElement as HTMLElement | null;
  const antes = stateChecked(box);

  let focou: boolean | null = null;
  let focusFoiTo: string | null = null;
  let alternou: boolean | null = null;
  let error: string | null = null;

  try {
    label.click();
    focou = focusEstaIn(box);
    focusFoiTo = describeIn(doc.activeElement);
    const depois = stateChecked(box);
    alternou = antes === null ? null : depois !== antes;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  // Desfaz: devolve a caixa ao estado original e o foco a quem o tinha.
  if (antes !== null && stateChecked(box) !== antes) (box as HTMLElement).click();
  if (focusPrevious && focusPrevious !== doc.body) focusPrevious.focus();
  else (doc.activeElement as HTMLElement | null)?.blur?.();

  return { focou, focusFoiTo, alternou, error };
}

/** Clicar na própria caixa alterna? (o foco do clique real é medido à parte) */
function boxAoClick(box: Element | null) {
  if (!box) return { alternou: null, error: 'sem caixa' };
  const antes = stateChecked(box);
  let alternou: boolean | null = null;
  let error: string | null = null;
  try {
    (box as HTMLElement).click();
    const depois = stateChecked(box);
    alternou = antes === null ? null : depois !== antes;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }
  if (antes !== null && stateChecked(box) !== antes) (box as HTMLElement).click();
  return { alternou, error };
}

/** A caixa aceita foco programático, e sobra foco visível? */
function focabilidade(box: Element | null) {
  if (!box) return { aceitaFocus: null, focusRing: null };
  const doc = box.ownerDocument;
  const focusPrevious = doc.activeElement as HTMLElement | null;
  (box as HTMLElement).focus?.();
  const aceitaFocus = doc.activeElement === box;
  let focusRing: boolean | null = null;
  if (aceitaFocus) {
    const cs = getComputedStyle(box);
    focusRing = cs.outlineStyle !== 'none' || cs.boxShadow !== 'none';
  }
  if (focusPrevious && focusPrevious !== doc.body) focusPrevious.focus();
  else (doc.activeElement as HTMLElement | null)?.blur?.();
  return { aceitaFocus, focusRing };
}

/** Quem recebe o clique no centro do elemento — pega peça coberta por overlay. */
function quemRecebeOClique(el: Element | null): string | null {
  if (!el) return null;
  const box = el.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return null;
  const target = el.ownerDocument.elementFromPoint(
    box.left + box.width / 2,
    box.top + box.height / 2,
  );
  return describeIn(target);
}

// ─── Medição ──────────────────────────────────────────────────────────────────

/** Mede UMA caixa e o rótulo que a rotula. `root` é o wrapper do cenário. */
export function measureBox(root: HTMLElement) {
  const box = root.querySelector<HTMLElement>(SELECTOR_BOX);
  if (!box) return { presente: false } as const;

  const doc = box.ownerDocument;
  const classes = classesDe(box);
  const cs = getComputedStyle(box);
  const retangulo = box.getBoundingClientRect();

  const label =
    root.querySelector<HTMLLabelElement>('label[data-slot="label"]') ??
    root.querySelector<HTMLLabelElement>('label');

  const htmlFor = label?.getAttribute('for') ?? null;
  const forTarget = htmlFor ? doc.getElementById(htmlFor) : null;

  const indicador = box.querySelector<HTMLElement>(
    '[data-slot="checkbox-indicator"], .nds-checkbox-indicator',
  );
  const inputEscondido = root.querySelector<HTMLInputElement>('input[type="checkbox"]');

  return {
    presente: true,

    // ── Estrutura: é rotulável pelo HTML? é aí que o defeito nasce ────────────
    box: {
      tag: box.tagName.toLowerCase(),
      /** O eixo do defeito: `label[for]` só alcança elemento rotulável. */
      ehRotulavelPeloHtml: ROTULAVEIS.includes(box.tagName.toLowerCase()),
      type: box.getAttribute('type'),
      role: box.getAttribute('role'),
      id: box.getAttribute('id'),
      dataSlot: box.getAttribute('data-slot'),
      tabIndex: box.getAttribute('tabindex'),
      /**
       * O tabIndex EFETIVO, não o atributo. Um `<button disabled>` continua
       * reportando `0` aqui e não tem atributo `tabindex` nenhum — o que o tira
       * da ordem de tabulação é o `disabled`, não o índice. Ler só o atributo
       * responderia "0" nas duas situações opostas, que é exatamente o erro que
       * esta sonda existe para não cometer.
       */
      tabIndexEfetivo: (box as HTMLElement).tabIndex,
      temClasseBase: classes.includes('nds-checkbox'),
      /** Classe sem o prefixo do design system: inerte, não pinta nada. */
      classesInertes: classes.filter((c) => !c.startsWith('nds-')),
      width: Math.round(retangulo.width),
      height: Math.round(retangulo.height),
      cursor: cs.cursor,
    },

    // ── Estado tri-valorado ──────────────────────────────────────────────────
    state: {
      ariaChecked: box.getAttribute('aria-checked'),
      dataState: box.getAttribute('data-state'),
      dataChecked: presenca(box, 'data-checked'),
      dataIndeterminate: presenca(box, 'data-indeterminate'),
      checked: stateChecked(box),
      background: cs.backgroundColor,
    },

    // ── Desabilitado: atributo nativo × ARIA ─────────────────────────────────
    disabled: {
      atributoNativo: (box as HTMLButtonElement).disabled === true,
      ariaDisabled: box.getAttribute('aria-disabled'),
      dataDisabled: presenca(box, 'data-disabled'),
      efetivo: estaDesabilitada(box),
      opacity: Number(cs.opacity),
    },

    // ── Contrato ARIA que o WAI-ARIA pede para role="checkbox" ───────────────
    aria: {
      ariaRequired: box.getAttribute('aria-required'),
      ariaInvalid: box.getAttribute('aria-invalid'),
      ariaReadonly: box.getAttribute('aria-readonly'),
      ariaLabelledby: box.getAttribute('aria-labelledby'),
      ariaLabel: box.getAttribute('aria-label'),
      ariaDescribedby: box.getAttribute('aria-describedby'),
    },

    name: accessibleName(box),
    leitura: leituraOrder(box),

    // ── Rótulo e a associação ────────────────────────────────────────────────
    label: {
      existe: !!label,
      dataSlot: label?.getAttribute('data-slot') ?? null,
      htmlFor,
      text: text(label),
      alvoDoForExiste: htmlFor ? !!forTarget : null,
      /** `false` aqui significa: o `for` aponta para outra coisa (input oculto). */
      alvoDoForEhACaixa: forTarget ? forTarget === box : null,
      alvoDoForTag: forTarget?.tagName.toLowerCase() ?? null,
      cursor: label ? getComputedStyle(label).cursor : null,
      /** Ouvinte de clique escrito na story para compensar o componente. */
      temAndaimeDeClique: label?.hasAttribute('data-andaime-clique') ?? null,
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
      design: indicador?.querySelector('line')
        ? 'traço'
        : indicador?.querySelector('polyline, path')
          ? 'marca'
          : null,
      visible: indicador ? getComputedStyle(indicador).display !== 'none' : null,
    },

    // ── OS DOIS EIXOS ────────────────────────────────────────────────────────
    cliqueNoRotulo: labelAoClick(label, box),
    cliqueNaCaixa: boxAoClick(box),
    focus: focabilidade(box),

    reach: {
      centroDaCaixa: quemRecebeOClique(box),
      centroDoRotulo: quemRecebeOClique(label),
    },
  };
}

/**
 * Mede os cenários marcados com `data-sonda="<nome>"` dentro de `root`.
 * Cenário ausente vem `null` — é o achado de "a stack não monta este caso".
 */
export function measureBoxes(root: HTMLElement, cenarios: string[]) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const target = root.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    registro[cenario] = target ? measureBox(target) : null;
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
  root: HTMLElement,
  cenarios: string[],
  click: (el: HTMLElement) => Promise<unknown>,
) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const target = root.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    const box = target?.querySelector<HTMLElement>(SELECTOR_BOX) ?? null;
    const label = target?.querySelector<HTMLLabelElement>('label') ?? null;
    if (!target || !label) {
      registro[cenario] = null;
      continue;
    }
    const doc = label.ownerDocument;
    const antes = stateChecked(box);
    let result: Record<string, unknown>;
    try {
      await click(label);
      result = {
        focou: focusEstaIn(box),
        focusFoiTo: describeIn(doc.activeElement),
        alternou: antes === null ? null : stateChecked(box) !== antes,
      };
    } catch (e) {
      result = { error: e instanceof Error ? e.message : String(e) };
    }
    // Desfaz, para não envenenar o cenário seguinte nem a foto do Chromatic.
    if (antes !== null && stateChecked(box) !== antes) box?.click();
    (doc.activeElement as HTMLElement | null)?.blur?.();
    registro[cenario] = result;
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
  root: HTMLElement,
  cenarios: string[],
  { tab, teclar, click }: KeyboardFerramentas,
) {
  const registro: Record<string, unknown> = {};

  for (const cenario of cenarios) {
    const target = root.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    const box = target?.querySelector<HTMLElement>(SELECTOR_BOX) ?? null;
    if (!box) {
      registro[cenario] = null;
      continue;
    }

    const doc = box.ownerDocument;
    const inicial = stateChecked(box);

    // ── 1. Tab para na caixa? ────────────────────────────────────────────────
    (doc.activeElement as HTMLElement | null)?.blur?.();
    let tabAlcancada = false;
    let tabsAteChegar: number | null = null;
    const paradasDoTab: string[] = [];
    for (let i = 1; i <= LIMIT_TAB && !tabAlcancada; i += 1) {
      await tab();
      paradasDoTab.push(describeIn(doc.activeElement) ?? 'nenhum');
      if (focusEstaIn(box)) {
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
      box.focus?.();
      teclaFocusAceito = doc.activeElement === box;
    }
    if (teclaFocusAceito) {
      const antes = stateChecked(box);
      await teclar(' ');
      espacoAlterna = antes === null ? null : stateChecked(box) !== antes;
      if (antes !== null && stateChecked(box) !== antes) await teclar(' ');
    }

    // ── 3. O clique de ponteiro alterna? ─────────────────────────────────────
    let clickAlterna: boolean | null = null;
    let clickError: string | null = null;
    {
      const antes = stateChecked(box);
      try {
        await click(box);
        clickAlterna = antes === null ? null : stateChecked(box) !== antes;
      } catch (e) {
        clickError = e instanceof Error ? e.message : String(e);
      }
    }

    // Desfaz tudo o que a medição possa ter mudado.
    if (inicial !== null && stateChecked(box) !== inicial) box.click();
    (doc.activeElement as HTMLElement | null)?.blur?.();

    registro[cenario] = {
      tabAlcancada,
      tabsAteChegar,
      paradasDoTab,
      teclaFocusAceito,
      espacoAlterna,
      clickAlterna,
      clickError,
      estadoPreservado: stateChecked(box) === inicial,
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
  box: HTMLElement,
  { tab, teclar, click }: KeyboardFerramentas,
): Promise<string[]> {
  const reprovas: string[] = [];
  const doc = box.ownerDocument;

  // 1. Anunciada como indisponível, pelo canal que não tira da tabulação.
  if (box.getAttribute('aria-disabled') !== 'true') {
    reprovas.push(
      `não é anunciada como desabilitada: aria-disabled=${JSON.stringify(
        box.getAttribute('aria-disabled'),
      )}`,
    );
  }
  if ((box as HTMLButtonElement).disabled === true) {
    reprovas.push('carrega o atributo `disabled` nativo, que a tira da ordem de tabulação');
  }

  // 2. Tab alcança a caixa.
  (doc.activeElement as HTMLElement | null)?.blur?.();
  let alcancada = false;
  for (let i = 0; i < LIMIT_TAB && !alcancada; i += 1) {
    await tab();
    if (focusEstaIn(box)) alcancada = true;
  }
  if (!alcancada) {
    reprovas.push(`o Tab não alcança a caixa em ${LIMIT_TAB} passos`);
  }

  // 3. Espaço não alterna. Só faz sentido perguntar com o foco na caixa.
  if (alcancada) {
    const antes = stateChecked(box);
    await teclar(' ');
    if (stateChecked(box) !== antes) {
      reprovas.push(`Espaço alternou o estado: ${String(antes)} → ${String(stateChecked(box))}`);
    }
  }

  // 4. O clique não alterna. `pointerEventsCheck: 0` fica a cargo de quem chama:
  // `cursor: not-allowed` não bloqueia ponteiro, mas a checagem do userEvent
  // reprova antes de clicar em parte das stacks.
  {
    const antes = stateChecked(box);
    await click(box);
    if (stateChecked(box) !== antes) {
      reprovas.push(`o clique alternou o estado: ${String(antes)} → ${String(stateChecked(box))}`);
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
  root: HTMLElement,
  cenarios: string[],
  ferramentas: KeyboardFerramentas,
) {
  const registro = {
    dom: measureBoxes(root, cenarios),
    cliqueDoUsuario: await usuarioMeasureClick(root, cenarios, ferramentas.click),
    teclado: await keyboardMeasureReach(root, cenarios, ferramentas),
  };
  throw new Error(`SONDA::${stack}::${JSON.stringify(registro)}`);
}
