/**
 * Sonda de comparação do Pagination entre as cinco stacks.
 *
 * Mesmo papel das sondas do Calendar e do Alert: medir as cinco de uma vez, com
 * o mesmo colhedor, para a divergência aparecer como diferença de valor e não
 * como impressão de quem olha.
 *
 * O que interessa aqui:
 *
 * 1. **Markup** — a mesma faixa tem que sair com a mesma anatomia
 *    (`nav > ul > li > a`), os mesmos `data-slot` e as mesmas classes `.nds-*`.
 *    O Vanilla é a referência.
 * 2. **Nome acessível** — rótulo do landmark, de cada controle e das
 *    reticências. Rótulo em inglês numa doc em português já apareceu em três
 *    componentes.
 * 3. **Estado desabilitado** — a pergunta não é qual classe está escrita, e sim
 *    se o clique chega. `pointerEvents` computado e `elementFromPoint` no centro
 *    do controle respondem isso; nome de classe não responde.
 * 4. **Alvo de toque** — WCAG 2.5.8 pede 24×24 CSS px. Os números da paginação
 *    são pequenos por natureza, então a medida vale a pena.
 *
 * O colhedor busca pelos seletores do CONTRATO. Onde o contrato não é cumprido
 * o campo vem `null` — e isso É o achado.
 */

export interface ControlMeasurement {
  /** Tag do elemento (`A`, `BUTTON`, `SPAN`). */
  tag: string | null;
  /** `data-slot` — o contrato de markup que as cinco stacks compartilham. */
  slot: string | null;
  /** Nome acessível efetivo: `aria-label` quando existe, senão o texto. */
  name: string | null;
  /** Classes `.nds-*` do elemento, em ordem alfabética. */
  classesNds: string[];
  /** Caixa em px CSS, arredondada. */
  box: { width: number; height: number } | null;
  /** `pointer-events` computado — o que de fato barra (ou não) o mouse. */
  pointerEvents: string | null;
  /** Opacidade computada. */
  opacity: number | null;
  tabindex: string | null;
  ariaDisabled: string | null;
  ariaCurrent: string | null;
  /** `disabled` nativo — só existe em `<button>`. */
  disabledNativo: boolean;
  /**
   * O que o navegador entrega no centro do controle. Igual ao próprio elemento
   * (ou a um descendente dele) = o clique chega. Diferente = algo o barra.
   */
  alcancavel: boolean | null;
}

export interface PaginationMeasurement {
  /** Raiz: tag, classes e rótulo do landmark. */
  root: {
    tag: string | null;
    role: string | null;
    label: string | null;
    classesNds: string[];
  } | null;
  /** Lista: tag e classes. */
  list: { tag: string | null; classesNds: string[]; items: number } | null;
  /** Controle anterior, o que fica desabilitado na primeira página. */
  previous: ControlMeasurement | null;
  /** Controle próximo. */
  next: ControlMeasurement | null;
  /** Primeiro link numerado inativo encontrado. */
  numeroInativo: ControlMeasurement | null;
  /** Link numerado da página atual. */
  numeroAtivo: ControlMeasurement | null;
  /** Reticências, quando a faixa as tem. */
  reticencias:
    | (ControlMeasurement & { text: string | null; ariaHidden: string | null })
    | null;
  /** Quantidade de reticências na faixa. */
  totalReticencias: number;
}

function classesNds(el: Element): string[] {
  return Array.from(el.classList)
    .filter((c) => c.startsWith('nds-'))
    .sort();
}

function accessibleName(el: Element): string | null {
  const label = el.getAttribute('aria-label');
  if (label) return label;
  const text = (el.textContent ?? '').trim();
  return text || null;
}

/**
 * `elementFromPoint` no centro do controle.
 *
 * É a única forma honesta de responder "o clique chega?": `pointer-events: none`
 * faz o navegador devolver o que está ATRÁS do elemento, e nenhuma leitura de
 * classe revela isso.
 */
function alcancavel(el: Element): boolean | null {
  const box = el.getBoundingClientRect();
  if (box.width === 0 || box.height === 0) return null;
  const target = el.ownerDocument.elementFromPoint(
    box.left + box.width / 2,
    box.top + box.height / 2,
  );
  if (!target) return null;
  return target === el || el.contains(target);
}

function measureControl(el: Element | null): ControlMeasurement | null {
  if (!el) return null;
  const estilo = getComputedStyle(el);
  const box = el.getBoundingClientRect();
  return {
    tag: el.tagName,
    slot: el.getAttribute('data-slot'),
    name: accessibleName(el),
    classesNds: classesNds(el),
    box:
      box.width || box.height
        ? { width: Math.round(box.width), height: Math.round(box.height) }
        : null,
    pointerEvents: estilo.pointerEvents,
    opacity: Number(estilo.opacity),
    tabindex: el.getAttribute('tabindex'),
    ariaDisabled: el.getAttribute('aria-disabled'),
    ariaCurrent: el.getAttribute('aria-current'),
    disabledNativo: (el as HTMLButtonElement).disabled === true,
    alcancavel: alcancavel(el),
  };
}

/**
 * Colhe a faixa inteira a partir de um contêiner.
 *
 * Os controles direcionais são procurados por `data-slot` E por classe, porque a
 * divergência de vocabulário entre stacks é justamente um dos achados: aceitar
 * as duas formas evita que o campo venha `null` por falha do seletor em vez de
 * falha do componente.
 */
export function measurePagination(raizBusca: HTMLElement): PaginationMeasurement {
  const nav = raizBusca.querySelector('[data-slot="pagination"]') ?? raizBusca.querySelector('nav');
  const list =
    raizBusca.querySelector('[data-slot="pagination-content"]') ?? raizBusca.querySelector('ul');

  const previous =
    raizBusca.querySelector('[data-slot="pagination-previous"]') ??
    raizBusca.querySelector('.nds-pagination-prev') ??
    raizBusca.querySelector('li:first-child > *');

  const next =
    raizBusca.querySelector('[data-slot="pagination-next"]') ??
    raizBusca.querySelector('.nds-pagination-next') ??
    raizBusca.querySelector('li:last-child > *');

  const numbered = Array.from(
    raizBusca.querySelectorAll('[data-slot="pagination-link"], .nds-pagination-link'),
  ).filter((el) => /^\d+$/.test((el.textContent ?? '').trim()));

  const reticencias = Array.from(
    raizBusca.querySelectorAll('[data-slot="pagination-ellipsis"], .nds-pagination-ellipsis'),
  );
  const firstReticencia = reticencias[0] ?? null;
  const measurementReticencia = measureControl(firstReticencia);

  return {
    root: nav
      ? {
          tag: nav.tagName,
          role: nav.getAttribute('role'),
          label: nav.getAttribute('aria-label'),
          classesNds: classesNds(nav),
        }
      : null,
    list: list
      ? { tag: list.tagName, classesNds: classesNds(list), items: list.children.length }
      : null,
    previous: measureControl(previous),
    next: measureControl(next),
    numeroInativo: measureControl(
      numbered.find((el) => el.getAttribute('aria-current') !== 'page') ?? null,
    ),
    numeroAtivo: measureControl(
      numbered.find((el) => el.getAttribute('aria-current') === 'page') ?? null,
    ),
    reticencias:
      measurementReticencia && firstReticencia
        ? {
            ...measurementReticencia,
            text: (firstReticencia.textContent ?? '').trim() || null,
            ariaHidden: firstReticencia.getAttribute('aria-hidden'),
          }
        : null,
    totalReticencias: reticencias.length,
  };
}

/**
 * Canal de saída da sonda.
 *
 * `console.log` não chega ao terminal — o addon do Storybook instrumenta o
 * console dentro da `play`. A exceção chega.
 */
export function reportProbe(stack: string, cenario: string, measurement: unknown): never {
  throw new Error(`SONDA::${stack}::${cenario}::${JSON.stringify(measurement)}`);
}

// ─── Contraste ───────────────────────────────────────────────────────────────
//
// Contraste é aritmética, não olhômetro: o axe mede, mas só o estado que a story
// renderiza, e o número dele não aparece em lugar nenhum quando passa. Aqui a
// conta é explícita e nomeia quem falhou.

/** `rgb(...)`/`rgba(...)` → canais; `null` quando o valor é transparente. */
function canais(value: string): [number, number, number] | null {
  const raw = value.match(/rgba?\(([^)]+)\)/);
  if (!raw) return null;
  const partes = raw[1].split(/[,/]/).map((p) => Number.parseFloat(p));
  if (partes.length >= 4 && partes[3] === 0) return null;
  return [partes[0], partes[1], partes[2]];
}

/** Luminância relativa da WCAG 2.2 (fórmula de 1.4.3). */
function luminancia([r, g, b]: [number, number, number]): number {
  const linear = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

export function contrastRatio(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const [light, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return Math.round(((light + 0.05) / (escuro + 0.05)) * 100) / 100;
}

/**
 * Primeiro fundo OPACO subindo a árvore.
 *
 * O link ghost não pinta o próprio fundo, e um fundo com alfa devolve uma cor
 * que ninguém vê — medir contra ela daria um número que não existe na tela.
 */
export function backgroundEffective(elemento: Element): [number, number, number] {
  let no: Element | null = elemento;
  while (no) {
    const cor = canais(getComputedStyle(no).backgroundColor);
    if (cor) return cor;
    no = no.parentElement;
  }
  return [255, 255, 255];
}

export interface ContrastMeasurement {
  name: string;
  ratio: number;
}

/**
 * Razão de contraste do texto de CADA controle da faixa contra o fundo em que
 * ele aparece. O limite é 4.5 — o texto da paginação é de 14px, tamanho normal
 * pela WCAG (grande é ≥24px, ou ≥18.66px em negrito).
 */
export function rangeContrastes(raizBusca: HTMLElement): ContrastMeasurement[] {
  const controles = Array.from(
    raizBusca.querySelectorAll<HTMLElement>(
      '[data-slot="pagination-link"], [data-slot="pagination-previous"], [data-slot="pagination-next"], .nds-pagination-link',
    ),
  );
  const vistos = new Set<Element>();
  const measurements: ContrastMeasurement[] = [];
  for (const control of controles) {
    if (vistos.has(control)) continue;
    vistos.add(control);
    const cor = canais(getComputedStyle(control).color);
    if (!cor) continue;
    measurements.push({
      name: accessibleName(control) ?? '(sem nome)',
      ratio: contrastRatio(cor, backgroundEffective(control)),
    });
  }
  return measurements;
}

// ─── Alvo de toque ───────────────────────────────────────────────────────────

export interface TargetMedido {
  name: string;
  width: number;
  height: number;
}

/**
 * Controles cuja caixa não alcança o mínimo da WCAG 2.5.8 (24×24 CSS px).
 *
 * Devolve a lista de faltantes com a medida, e não um booleano: quando falha,
 * o teste precisa dizer QUAL controle e por quanto — foi assim que apareceu um
 * direcional de 32×16, encolhido porque o rótulo textual estava escondido por
 * uma classe morta e não sobrava nada para o padding crescer.
 */
export function minimumTargetsBelow(raizBusca: HTMLElement, minimum = 24): TargetMedido[] {
  const controles = Array.from(
    raizBusca.querySelectorAll<HTMLElement>(
      '[data-slot="pagination-link"], [data-slot="pagination-previous"], [data-slot="pagination-next"], .nds-pagination-link',
    ),
  );
  const vistos = new Set<Element>();
  const faltantes: TargetMedido[] = [];
  for (const control of controles) {
    if (vistos.has(control)) continue;
    vistos.add(control);
    const box = control.getBoundingClientRect();
    if (box.width < minimum || box.height < minimum) {
      faltantes.push({
        name: accessibleName(control) ?? '(sem nome)',
        width: Math.round(box.width),
        height: Math.round(box.height),
      });
    }
  }
  return faltantes;
}
