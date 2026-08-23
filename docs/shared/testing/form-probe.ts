/**
 * Sonda de comparação do Form entre as stacks.
 *
 * O Form é o único componente do design system cujo produto NÃO é o que se vê:
 * o que ele entrega é a costura entre rótulo, controle, texto de apoio e
 * mensagem de erro — e essa costura só existe em atributo. Um campo pode estar
 * perfeito na tela e mudo no leitor de tela, e nenhuma foto do Chromatic acusa.
 *
 * Por isso toda medida aqui é de ASSOCIAÇÃO RESOLVIDA, nunca de atributo
 * presente. A distinção não é teórica: na rodada do textarea a story passava um
 * id para `aria-describedby`, a asserção conferia o ATRIBUTO, e o elemento
 * apontado não existia — o leitor não anunciava erro nenhum e a suíte ficou
 * verde. Aqui `alvoDescribedbyExiste: false` é o achado.
 *
 * A busca é pelo contrato `.nds-*` / `data-slot`. Onde o contrato não é
 * cumprido o campo vem `null` — e isso É o achado, não falha da medição.
 *
 * Armadilhas já pagas, herdadas dos colhedores anteriores:
 *
 *   - `console.log` não chega ao terminal (o addon instrumenta o console dentro
 *     da play). O canal é a exceção — ver `reportProbeForm`.
 *   - ler estilo logo após trocar de tema devolve o PRIMEIRO QUADRO da
 *     transição. Todo acesso a cor passa por `noTransicao`.
 *   - atributo de presença casa valor `"false"`: `[data-error]` casaria
 *     `data-error="false"`. Os seletores usam `:not([attr="false"])`.
 *   - contraste é aritmética, não olhômetro, e o fundo do container costuma ter
 *     alfa. `ratio`/`backgroundEffective` de `cor.ts` fazem a composição.
 */

import { backgroundEffective, darkLigarTheme, ratio, noTransicao, type Contrast } from './cor';

export type { Contrast };
export { darkLigarTheme, noTransicao };

// ─── Seletores do contrato ────────────────────────────────────────────────────

export const SELECTOR_FIELD = '[data-slot="field"], .nds-form-field';
export const SELECTOR_LABEL = '[data-slot="label"], .nds-form-label';
export const SELECTOR_DESCRIPTION = '[data-slot="field-description"], .nds-form-description';
export const SELECTOR_ERROR = '[data-slot="field-error"], .nds-form-error';
export const SELECTOR_FIELDSET = '[data-slot="fieldset"], .nds-form-fieldset';
export const SELECTOR_CAPTION = '[data-slot="fieldset-legend"], .nds-form-legend';

/**
 * O controle do campo, na ordem que o próprio Form usa para achá-lo.
 *
 * Os `data-slot` compostos vêm ANTES dos elementos nativos de propósito:
 * checkbox, switch e select desta família renderizam um `<input>` escondido
 * para participar do formulário, e ele casaria com `input` antes do controle
 * de verdade.
 */
const SELECTORS_CONTROL = [
  '[data-slot="input-group-control"]',
  '[data-slot="checkbox"]',
  '[data-slot="switch"]',
  '[data-slot="select-trigger"]',
  '[data-slot="slider"]',
  'input:not([type="hidden"])',
  'textarea',
  'select',
];

export function controlOf(field: HTMLElement): HTMLElement | null {
  for (const selector of SELECTORS_CONTROL) {
    const finding = field.querySelector<HTMLElement>(selector);
    if (finding) return finding;
  }
  return null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const text = (el: Element | null | undefined): string | null =>
  el?.textContent?.trim().replace(/\s+/g, ' ') || null;

const classes = (el: Element | null | undefined): string[] =>
  (el?.getAttribute('class') || '').split(/\s+/).filter(Boolean);

/** Classe sem o prefixo do design system: inerte, não pinta nada. */
const inertes = (el: Element | null | undefined): string[] =>
  classes(el).filter((c) => !c.startsWith('nds-'));

/**
 * Nome acessível pela ordem que o leitor usa.
 *
 * `null` é campo sem nome — o defeito que a associação rótulo↔controle existe
 * para impedir, e o que separa "tem um `for`" de "o leitor lê o rótulo".
 */
export function accessibleName(el: Element | null | undefined): string | null {
  if (!el) return null;
  const labelled = el.getAttribute('aria-labelledby');
  if (labelled) {
    const target = el.ownerDocument.getElementById(labelled.split(/\s+/)[0]);
    if (target?.textContent?.trim()) return target.textContent.trim();
  }
  const label = el.getAttribute('aria-label');
  if (label?.trim()) return label.trim();
  const id = el.getAttribute('id');
  if (id) {
    const label = el.ownerDocument.querySelector(`label[for="${CSS.escape(id)}"]`);
    if (label?.textContent?.trim()) return label.textContent.trim();
  }
  const inside = el.closest('label');
  if (inside?.textContent?.trim()) return inside.textContent.trim();
  // Último degrau: os elementos cujo NOME é o próprio conteúdo. Sem ele o botão
  // de envio de um formulário saía `null` numa lista em que todo campo tinha
  // nome — um falso achado, porque `<button>Salvar</button>` é nomeado.
  // `<input>` fica de fora de propósito: o valor digitado não é nome.
  if (el.matches('button, [role="button"], a[href], [role="link"], summary')) {
    const own = el.textContent?.trim().replace(/\s+/g, ' ');
    if (own) return own;
  }
  return null;
}

/**
 * Resolve `aria-describedby` em ELEMENTOS, não em ids.
 *
 * `presentes` é o que o leitor de tela realmente vai ler. `orfaos` é o defeito
 * que passa por qualquer asserção de atributo: id escrito, alvo inexistente.
 */
export function descriptionResolvida(control: HTMLElement | null) {
  const raw = control?.getAttribute('aria-describedby') ?? null;
  if (!control || !raw) {
    return { atributo: raw, ids: [] as string[], presentes: [] as string[], orfaos: [] as string[] };
  }
  const ids = raw.split(/\s+/).filter(Boolean);
  const presentes: string[] = [];
  const orfaos: string[] = [];
  for (const id of ids) {
    const target = control.ownerDocument.getElementById(id);
    if (target) presentes.push(text(target) ?? '');
    else orfaos.push(id);
  }
  return { atributo: raw, ids, presentes, orfaos };
}

/**
 * A mensagem de erro é ANUNCIADA?
 *
 * Não basta existir e estar vermelha. Só é anunciada se estiver numa região
 * viva — `aria-live` no próprio elemento ou num ancestral, ou um `role` que já
 * seja região viva por definição.
 */
export function regiaoViva(el: HTMLElement | null) {
  if (!el) return null;
  const own = el.getAttribute('aria-live');
  const papel = el.getAttribute('role');
  const ancestral = el.closest('[aria-live]');
  const roleVivo = papel === 'alert' || papel === 'status';
  return {
    ariaLive: own,
    papel,
    ariaLiveHerdado: ancestral && ancestral !== el ? ancestral.getAttribute('aria-live') : null,
    /** `false` é erro que aparece na tela e não chega a quem não olha. */
    anunciada: Boolean(own) || roleVivo || Boolean(ancestral),
  };
}

// ─── Medição de um campo ──────────────────────────────────────────────────────

export function measureField(root: HTMLElement) {
  const field = root.matches(SELECTOR_FIELD)
    ? root
    : root.querySelector<HTMLElement>(SELECTOR_FIELD);
  if (!field) return { presente: false } as const;

  const label = field.querySelector<HTMLLabelElement>(SELECTOR_LABEL);
  const control = controlOf(field);
  const descricao = field.querySelector<HTMLElement>(SELECTOR_DESCRIPTION);
  const error = field.querySelector<HTMLElement>(SELECTOR_ERROR);

  const cs = getComputedStyle(field);
  const background = backgroundEffective(field);

  const described = descriptionResolvida(control);
  const idsDescribed = new Set(described.ids);

  return {
    presente: true,
    estrutura: {
      tag: field.tagName.toLowerCase(),
      dataSlot: field.getAttribute('data-slot'),
      temClasseBase: classes(field).includes('nds-form-field'),
      classesInertes: inertes(field),
      /** Ordem visual das peças: rótulo, controle, apoio, erro. */
      order: Array.from(field.children).map(
        (c) => c.getAttribute('data-slot') ?? c.tagName.toLowerCase(),
      ),
      hasLabel: Boolean(label),
      temControle: Boolean(control),
      hasDescription: Boolean(descricao),
      hasError: Boolean(error),
    },
    associacao: {
      /** `for` do rótulo e `id` do controle — os dois lados do mesmo fio. */
      rotuloFor: label?.getAttribute('for') ?? null,
      controleId: control?.id || null,
      /** `null` quando falta um dos lados; `true` só quando o fio fecha. */
      forCasaComId:
        label && control ? (label.getAttribute('for') || null) === (control.id || null) : null,
      /** O rótulo ENVOLVE o controle — a outra forma válida de associar. */
      rotuloEnvolve: label && control ? label.contains(control) : null,
      /** O que o leitor de tela realmente anuncia como nome do campo. */
      accessibleName: accessibleName(control),
      idGerado: Boolean(control?.id && !control.getAttribute('data-id-escrito')),
      textoDoRotulo: text(label),
    },
    helper: {
      text: text(descricao),
      id: descricao?.id || null,
      /** Visível e mudo é o defeito: existe na tela, fora do describedby. */
      noDescribedby: descricao ? idsDescribed.has(descricao.id) : null,
      classesInertes: inertes(descricao),
      tag: descricao?.tagName.toLowerCase() ?? null,
    },
    error: {
      text: text(error),
      id: error?.id || null,
      noDescribedby: error ? idsDescribed.has(error.id) : null,
      viva: regiaoViva(error),
      classesInertes: inertes(error),
      tag: error?.tagName.toLowerCase() ?? null,
    },
    control: control
      ? {
          tag: control.tagName.toLowerCase(),
          dataSlot: control.getAttribute('data-slot'),
          ariaInvalid: control.getAttribute('aria-invalid'),
          ariaRequired: control.getAttribute('aria-required'),
          required: (control as HTMLInputElement).required ?? null,
          disabled: (control as HTMLInputElement).disabled ?? null,
          describedby: described,
        }
      : null,
    label: label
      ? {
          /** `data-error` é o gancho que pinta o rótulo de destructive. */
          dataError: label.getAttribute('data-error'),
          /** Marcado de erro DE VERDADE — `"false"` não conta. */
          marcadoComErro: label.matches('[data-error]:not([data-error="false"])'),
          cor: getComputedStyle(label).color,
          peso: getComputedStyle(label).fontWeight,
          size: getComputedStyle(label).fontSize,
        }
      : null,
    geometria: {
      /** O ritmo interno do campo — 6px pelo contrato (`--spacing-1-5`). */
      espacoEntrePecas: Math.round(parseFloat(cs.rowGap || '0')),
      direction: cs.flexDirection,
      display: cs.display,
      width: Math.round(field.getBoundingClientRect().width),
    },
    contraste: {
      label: label && background ? ratio(getComputedStyle(label).color, background) : null,
      helper: descricao && background ? ratio(getComputedStyle(descricao).color, background) : null,
      error: error && background ? ratio(getComputedStyle(error).color, background) : null,
    },
  };
}

// ─── Medição de um agrupamento ────────────────────────────────────────────────

export function measureFieldset(root: HTMLElement) {
  const group = root.matches(SELECTOR_FIELDSET)
    ? root
    : root.querySelector<HTMLElement>(SELECTOR_FIELDSET);
  if (!group) return { presente: false } as const;

  const caption = group.querySelector<HTMLElement>(SELECTOR_CAPTION);
  const cs = getComputedStyle(group);
  const background = backgroundEffective(group);

  return {
    presente: true,
    estrutura: {
      /** `<div>` com um título por cima parece igual e não anuncia grupo nenhum. */
      tag: group.tagName.toLowerCase(),
      nativo: group.tagName === 'FIELDSET',
      dataSlot: group.getAttribute('data-slot'),
      classesInertes: inertes(group),
      legendaTag: caption?.tagName.toLowerCase() ?? null,
      legendaNativa: caption?.tagName === 'LEGEND',
      /** A legenda tem que ser o PRIMEIRO filho; senão não rotula o grupo. */
      legendaPrimeira: caption ? group.firstElementChild === caption : null,
      text: text(caption),
      fields: group.querySelectorAll(SELECTOR_FIELD).length,
    },
    semantica: {
      /** O que o leitor anuncia antes de cada campo do grupo. */
      nomeDoGrupo: accessibleName(group) ?? text(caption),
      papel: group.getAttribute('role'),
    },
    geometria: {
      /** 16px pelo contrato (`--spacing-4`). */
      espacoEntreCampos: Math.round(parseFloat(cs.rowGap || '0')),
      direction: cs.flexDirection,
      border: cs.borderTopWidth,
      padding: cs.paddingTop,
      margem: cs.marginTop,
    },
    contraste: {
      caption: caption && background ? ratio(getComputedStyle(caption).color, background) : null,
    },
  };
}

// ─── Ordem de tabulação ───────────────────────────────────────────────────────

/**
 * Os controles alcançáveis por Tab, na ordem em que o teclado os visita.
 *
 * Sem `tabindex` positivo em jogo, essa ordem é a do DOM — e é exatamente isso
 * que o contrato afirma. Devolve o nome ACESSÍVEL de cada um: uma ordem certa
 * de campos anônimos não é uma ordem útil.
 */
export function tabulacaoOrder(root: HTMLElement) {
  const focalizaveis = Array.from(
    root.querySelectorAll<HTMLElement>(
      'input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])',
    ),
  );
  return focalizaveis.map((el) => ({
    name: accessibleName(el),
    tag: el.tagName.toLowerCase(),
    tabindex: el.getAttribute('tabindex'),
  }));
}

/**
 * O primeiro campo inválido do formulário — para onde o foco deve ir no envio.
 *
 * `null` quando não há nenhum, o que é o estado válido. A story compara o foco
 * DEPOIS do envio com o que esta função aponta ANTES.
 */
export function firstInvalido(root: HTMLElement): HTMLElement | null {
  return root.querySelector<HTMLElement>('[aria-invalid="true"], :invalid:not(form)');
}

// ─── Tema escuro ──────────────────────────────────────────────────────────────

/**
 * Contraste do rótulo, do apoio e do erro nos DOIS modos.
 *
 * O axe do test-runner mede só o que está na tela, e a tela está sempre no tema
 * claro — metade do produto ficava sem medição enquanto o contrato afirmava
 * "4.5:1 em todos os temas". A classe sai no `finally`: deixá-la posta envenena
 * a story seguinte e a foto do Chromatic.
 */
export function contrastesNosDoisModos(root: HTMLElement) {
  const measure = (mode: 'claro' | 'escuro') => {
    const m = measureField(root);
    if (!m.presente) return null;
    return {
      mode,
      label: m.contraste.label?.ratio ?? null,
      helper: m.contraste.helper?.ratio ?? null,
      error: m.contraste.error?.ratio ?? null,
    };
  };

  const field = root.matches(SELECTOR_FIELD) ? root : root.querySelector<HTMLElement>(SELECTOR_FIELD);
  const light = measure('claro');
  const desfazer = darkLigarTheme(root.ownerDocument);
  let escuro: ReturnType<typeof measure> = null;
  try {
    escuro = field ? noTransicao(field, () => measure('escuro')) : measure('escuro');
  } finally {
    desfazer();
  }
  return [light, escuro].filter(Boolean) as {
    mode: string; label: number | null; helper: number | null; error: number | null;
  }[];
}

// ─── Saída ────────────────────────────────────────────────────────────────────

/**
 * Emite o registro para fora do navegador.
 *
 * Via exceção, e não `console.log`: o addon do Storybook instrumenta o console
 * dentro da play e nada do que se escreve ali chega ao terminal do vitest.
 */
export function reportProbeForm(stack: string, cenario: string, data: unknown): never {
  throw new Error(`SONDA::${stack}::${cenario}::${JSON.stringify(data)}`);
}

/**
 * Mede os cenários marcados com `data-sonda="<nome>"` dentro de `root`.
 * Cenário ausente vem `null` — o achado de "esta stack não monta este caso".
 */
export function measureCenarios(root: HTMLElement, cenarios: string[]) {
  const registro: Record<string, unknown> = {};
  for (const cenario of cenarios) {
    const target = root.querySelector<HTMLElement>(`[data-sonda="${cenario}"]`);
    if (!target) {
      registro[cenario] = null;
      continue;
    }
    registro[cenario] = target.matches(SELECTOR_FIELDSET) ? measureFieldset(target) : measureField(target);
  }
  return registro;
}
