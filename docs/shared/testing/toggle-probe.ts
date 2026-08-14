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

import { contraste, fundoEfetivo, ligarTemaEscuro } from './alert-probe';

export { contraste, fundoEfetivo, ligarTemaEscuro };

// ─── Anel de foco ─────────────────────────────────────────────────────────────

export interface MedidaDeAnel {
  semFoco: string;
  comFoco: string;
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
export function medirAnelDeFoco(btn: HTMLElement): MedidaDeAnel {
  const doc = btn.ownerDocument;
  (doc.activeElement as HTMLElement | null)?.blur();
  const antes = getComputedStyle(btn);
  const semFoco = `${antes.boxShadow} | ${antes.outlineStyle} ${antes.outlineWidth}`;
  btn.focus();
  const depois = getComputedStyle(btn);
  const comFoco = `${depois.boxShadow} | ${depois.outlineStyle} ${depois.outlineWidth}`;
  return { semFoco, comFoco, mudou: semFoco !== comFoco && comFoco !== 'none | none 0px' };
}

/** Toggles da tela cujo anel de foco NÃO aparece — a lista vazia é o resultado bom. */
export function togglesSemAnelDeFoco(raiz: HTMLElement): string[] {
  const falhas: string[] = [];
  for (const btn of raiz.querySelectorAll<HTMLElement>('.nds-toggle')) {
    if (btn.hasAttribute('disabled')) continue;
    if (!medirAnelDeFoco(btn).mudou) falhas.push(descreverToggle(btn));
  }
  (raiz.ownerDocument.activeElement as HTMLElement | null)?.blur();
  return falhas;
}

// ─── Contraste ────────────────────────────────────────────────────────────────

export interface FalhaDeContrasteToggle {
  toggle: string;
  tema: string;
  contraste: number;
}

/** Identificação legível: variante, tamanho e o nome acessível. */
export function descreverToggle(btn: HTMLElement): string {
  const variante = btn.getAttribute('data-variant') ?? 'default';
  const tamanho = btn.getAttribute('data-size') ?? 'default';
  const nome = btn.getAttribute('aria-label') || btn.textContent?.trim() || '(sem nome)';
  return `${variante}/${tamanho} "${nome}"`;
}

/**
 * Contraste entre o conteúdo do toggle (texto e ícone herdam `color`) e o fundo
 * que a pessoa realmente vê.
 */
export function contrasteDoToggle(btn: HTMLElement): number {
  return contraste(getComputedStyle(btn).color, fundoEfetivo(btn));
}

/**
 * Toggles no estado ATIVO — as três formas que a folha compartilhada aceita.
 *
 * `[attr]:not([attr="false"])` e não `[attr]`: um seletor de presença casa
 * também o valor `"false"`, que algumas libs emitem em todos os elementos.
 */
const ATIVO =
  '.nds-toggle[data-state="on"], .nds-toggle[aria-pressed="true"], ' +
  '.nds-toggle[data-pressed]:not([data-pressed="false"])';

function falhasDeContraste(
  raiz: HTMLElement,
  minimo: number,
  tema: string,
): FalhaDeContrasteToggle[] {
  const encontradas: FalhaDeContrasteToggle[] = [];
  // Só o estado ATIVO. É o que o contrato documenta ("texto/ícone contra o
  // fundo ativo") e é o único par de cores que o componente REALMENTE define:
  // em repouso ele declara `background: transparent` e `color: inherit`, então
  // quem responde pelo contraste é a superfície da página, não o toggle.
  // Medir o repouso aqui dava 1.1:1 no escuro — não porque o toggle esteja
  // errado, mas porque o harness não repinta o `body` ao trocar de tema: a cor
  // herdada continua a do claro enquanto `--background` já virou escuro.
  for (const btn of raiz.querySelectorAll<HTMLElement>(ATIVO)) {
    // O desabilitado tem opacidade reduzida por contrato — a WCAG isenta
    // controle inativo (1.4.3), e medi-lo produziria falha que não é defeito.
    if (btn.hasAttribute('disabled')) continue;
    const razao = contrasteDoToggle(btn);
    if (razao < minimo) encontradas.push({ toggle: descreverToggle(btn), tema, contraste: razao });
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
export function contrasteDoToggleNosDoisTemas(
  raiz: HTMLElement,
  minimo = 4.5,
): FalhaDeContrasteToggle[] {
  const claro = falhasDeContraste(raiz, minimo, 'claro');
  const desfazer = ligarTemaEscuro(raiz.ownerDocument);
  try {
    return [...claro, ...falhasDeContraste(raiz, minimo, 'escuro')];
  } finally {
    desfazer();
  }
}

/** Mensagem de falha legível, com o número medido. */
export function descreverFalhasDeContraste(fs: FalhaDeContrasteToggle[]): string {
  return fs.map((f) => `  · ${f.toggle} (${f.tema}) — ${f.contraste}:1`).join('\n');
}
