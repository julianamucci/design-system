/**
 * Colhedor compartilhado do Toggle — as cinco stacks medem com este arquivo.
 *
 * Duas coisas aqui não tinham medição em lugar nenhum, e as duas custaram caro:
 *
 * 1. **O anel de foco.** A asserção que existia media `boxShadow !== 'none'`,
 *    e a variante outline tem sombra de ELEVAÇÃO o tempo todo — a asserção
 *    passava com zero anel na tela. O anel só se prova pela sombra MUDAR entre
 *    o estado sem foco e o estado com foco.
 *
 * 2. **O contraste do estado ativo, nos DOIS temas.** O axe mede o que está na
 *    tela, e a tela está sempre no tema claro; e o ícone de um toggle icon-only
 *    não é texto, então o axe não o mede em tema nenhum. Contraste é
 *    aritmética: sem a conta, o item do contrato ficava declarado e nunca
 *    verificado.
 *
 * A composição de fundo, a resolução de `--background` e a troca de tema já
 * estavam resolvidas no colhedor do Alert — reusadas aqui em vez de copiadas,
 * porque duas cópias da mesma conta divergem na primeira correção.
 */

import { contraste, backgroundEffective, darkLigarTheme } from './alert-probe';

export { contraste, backgroundEffective, darkLigarTheme };

// ─── Anel de foco ─────────────────────────────────────────────────────────────

export interface RingMeasurement {
  noFocus: string;
  withFocus: string;
  /** O foco por teclado mudou alguma sombra ou contorno? É isto que prova o anel. */
  mudou: boolean;
}

/**
 * Mede o anel de foco de um controle: lê a sombra com o foco em outro lugar,
 * foca, e lê de novo.
 *
 * `focus()` e não `userEvent.tab()` de propósito — o alvo aqui é a REGRA de
 * `:focus-visible`, não a ordem de tabulação (essa é verificada à parte, e com
 * Tab de verdade). Em navegador, focar por script depois de uma interação de
 * teclado satisfaz `:focus-visible`.
 */
export function focusMeasureRing(btn: HTMLElement): RingMeasurement {
  const doc = btn.ownerDocument;
  (doc.activeElement as HTMLElement | null)?.blur();
  const antes = getComputedStyle(btn);
  const noFocus = `${antes.boxShadow} | ${antes.outlineStyle} ${antes.outlineWidth}`;
  btn.focus();
  const depois = getComputedStyle(btn);
  const withFocus = `${depois.boxShadow} | ${depois.outlineStyle} ${depois.outlineWidth}`;
  return { noFocus, withFocus, mudou: noFocus !== withFocus && withFocus !== 'none | none 0px' };
}

/** Toggles da tela cujo anel de foco NÃO aparece — a lista vazia é o resultado bom. */
export function focusTogglesNoRing(root: HTMLElement): string[] {
  const failures: string[] = [];
  for (const btn of root.querySelectorAll<HTMLElement>('.nds-toggle')) {
    if (btn.hasAttribute('disabled')) continue;
    if (!focusMeasureRing(btn).mudou) failures.push(describeToggle(btn));
  }
  (root.ownerDocument.activeElement as HTMLElement | null)?.blur();
  return failures;
}

// ─── Contraste ────────────────────────────────────────────────────────────────

export interface ContrastToggleFailure {
  toggle: string;
  theme: string;
  contraste: number;
}

/** Identificação legível: variante, tamanho e o nome acessível. */
export function describeToggle(btn: HTMLElement): string {
  const variant = btn.getAttribute('data-variant') ?? 'default';
  const size = btn.getAttribute('data-size') ?? 'default';
  const name = btn.getAttribute('aria-label') || btn.textContent?.trim() || '(sem nome)';
  return `${variant}/${size} "${name}"`;
}

/**
 * Contraste entre o conteúdo do toggle (texto e ícone herdam `color`) e o fundo
 * que a pessoa realmente vê.
 */
export function toggleContrast(btn: HTMLElement): number {
  return contraste(getComputedStyle(btn).color, backgroundEffective(btn));
}

/**
 * Toggles no estado ATIVO — as três formas que a folha compartilhada aceita.
 *
 * `[attr]:not([attr="false"])` e não `[attr]`: um seletor de presença casa
 * também o valor `"false"`, que algumas libs emitem em todos os elementos.
 */
const ACTIVE =
  '.nds-toggle[data-state="on"], .nds-toggle[aria-pressed="true"], ' +
  '.nds-toggle[data-pressed]:not([data-pressed="false"])';

function contrastFailures(
  root: HTMLElement,
  minimum: number,
  theme: string,
): ContrastToggleFailure[] {
  const encontradas: ContrastToggleFailure[] = [];
  // Só o estado ATIVO. É o que o contrato documenta ("texto/ícone contra o
  // fundo ativo") e é o único par de cores que o componente REALMENTE define:
  // em repouso ele declara `background: transparent` e `color: inherit`, então
  // quem responde pelo contraste é a superfície da página, não o toggle.
  // Medir o repouso aqui dava 1.1:1 no escuro — não porque o toggle esteja
  // errado, mas porque o harness não repinta o `body` ao trocar de tema: a cor
  // herdada continua a do claro enquanto `--background` já virou escuro.
  for (const btn of root.querySelectorAll<HTMLElement>(ACTIVE)) {
    // O desabilitado tem opacidade reduzida por contrato — a WCAG isenta
    // controle inativo (1.4.3), e medi-lo produziria falha que não é defeito.
    if (btn.hasAttribute('disabled')) continue;
    const ratio = toggleContrast(btn);
    if (ratio < minimum) encontradas.push({ toggle: describeToggle(btn), theme, contraste: ratio });
  }
  return encontradas;
}

/**
 * Contraste dos toggles ATIVOS da tela, no claro e no escuro.
 *
 * O limite padrão é 4.5 porque o conteúdo documentado inclui rótulo em texto de
 * 14px — que pela WCAG não é texto grande. A classe `.dark` sai no `finally`
 * mesmo se a medição falhar: deixá-la posta envenenaria a story seguinte e a
 * foto do Chromatic.
 */
export function toggleNosDoisThemesContrast(
  root: HTMLElement,
  minimum = 4.5,
): ContrastToggleFailure[] {
  const unfreeze = freezeTransitions(root.ownerDocument);
  try {
    const light = contrastFailures(root, minimum, 'claro');
    const desfazer = darkLigarTheme(root.ownerDocument);
    try {
      return [...light, ...contrastFailures(root, minimum, 'escuro')];
    } finally {
      desfazer();
    }
  } finally {
    unfreeze();
  }
}

/**
 * Congela transição e animação enquanto se mede. Devolve a função que desfaz.
 *
 * Sem isto a medição do tema ESCURO lia um estado a meio caminho, e o número
 * que saía não era o de tema nenhum. O toggle declara
 * `transition: background-color …, color …`: pôr a classe `.dark` não troca as
 * cores, INICIA uma transição, e o computado logo em seguida devolve o valor de
 * PARTIDA — o do claro. A sonda de `--background`, por outro lado, é um
 * elemento recém-criado, sem transição de onde partir: ela já volta a
 * superfície escura. O resultado é tinta clara sobre fundo escuro, e a primeira
 * rodada da suíte do React reprovou o toggle ativo em 1.16:1 no escuro com a
 * paleta correta.
 *
 * É a mesma armadilha que já está descrita para `waitFor`, na outra ponta:
 * ali a espera nunca chega, aqui a leitura chega cedo demais. E é LATENTE —
 * quando as duas leituras pegam valores da mesma época, o número sai certo e
 * ninguém vê.
 *
 * Congelar, e não esperar: a conta é síncrona e todas as cinco stacks a chamam
 * assim. `!important` porque a regra precisa vencer a do componente, e a
 * própria inserção da folha força o recálculo — a primeira leitura seguinte já
 * é do valor final.
 */
function freezeTransitions(doc: Document): () => void {
  const style = doc.createElement('style');
  style.textContent =
    '*, *::before, *::after { transition: none !important; animation: none !important; }';
  doc.head.appendChild(style);
  return () => style.remove();
}

/** Mensagem de falha legível, com o número medido. */
export function contrastDescribeFailures(fs: ContrastToggleFailure[]): string {
  return fs.map((f) => `  · ${f.toggle} (${f.theme}) — ${f.contraste}:1`).join('\n');
}
