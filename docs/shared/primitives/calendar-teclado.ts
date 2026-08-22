/**
 * O resto do teclado da grade do Calendar.
 *
 * Seta, Enter e Espaço são o que toda lib headless já entrega. `Home`, `End`,
 * `PageUp` e `PageDown` não: medido nas cinco stacks, duas os implementavam
 * (uma à mão, outra pela lib), duas não faziam nada e a quinta mudava o mês e
 * largava o foco no `body`. O conteúdo compartilhado promete as quatro teclas
 * desde sempre — era promessa que três stacks não cumpriam, e nenhuma asserção
 * cobrava.
 *
 * O cálculo mora aqui, e não copiado em cada stack, por dois motivos: é
 * aritmética de calendário (nada de DOM, nada de framework), e três cópias
 * divergem na primeira correção — foi exatamente o que aconteceu com o rótulo
 * dos botões de mês antes de `calendar-labels.ts` existir.
 *
 * A semana começa no DOMINGO, como em todo o sistema: uma grade que muda de
 * primeira coluna conforme o idioma faria `Home` cair em dias diferentes na
 * troca de idioma.
 */

/** As teclas tratadas aqui. Seta, Enter e Espaço são da lib de cada stack. */
export const GRID_TECLAS = ['Home', 'End', 'PageUp', 'PageDown'] as const;

export type GridTecla = (typeof GRID_TECLAS)[number];

export function gridEhTecla(tecla: string): tecla is GridTecla {
  return (GRID_TECLAS as readonly string[]).includes(tecla);
}

/** Data de calendário em UTC — sem hora, sem fuso, sem virada de dia. */
function deIso(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
}

function toIso(d: Date): string {
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dia = String(d.getUTCDate()).padStart(2, '0');
  return `${d.getUTCFullYear()}-${mes}-${dia}`;
}

/**
 * Anda `meses` mantendo o dia do mês, e encolhe quando o mês de destino é mais
 * curto: 31 de março mais um mês é 30 de abril, não 1º de maio — que é o que a
 * aritmética ingênua devolve e o que faria o foco pular uma casa a mais.
 */
function somarMonths(d: Date, meses: number): Date {
  const ano = d.getUTCFullYear();
  const mes = d.getUTCMonth() + meses;
  const lastDay = new Date(Date.UTC(ano, mes + 1, 0)).getUTCDate();
  return new Date(Date.UTC(ano, mes, Math.min(d.getUTCDate(), lastDay)));
}

/**
 * Para onde a tecla leva o foco, em ISO. `null` quando a tecla não é destas ou
 * quando a data de partida não é legível — e aí quem chamou não previne nada.
 *
 * `Shift` em `PageUp`/`PageDown` anda um ANO, que é a convenção do padrão APG
 * para grade de datas.
 */
export function destinoDaTecla(
  isoAtual: string | null | undefined,
  evento: { key: string; shiftKey?: boolean },
): string | null {
  if (!isoAtual || !gridEhTecla(evento.key)) return null;
  const atual = deIso(isoAtual);
  if (!atual) return null;

  switch (evento.key) {
    case 'Home':
      return toIso(new Date(atual.getTime() - atual.getUTCDay() * 86_400_000));
    case 'End':
      return toIso(new Date(atual.getTime() + (6 - atual.getUTCDay()) * 86_400_000));
    case 'PageUp':
      return toIso(somarMonths(atual, evento.shiftKey ? -12 : -1));
    case 'PageDown':
      return toIso(somarMonths(atual, evento.shiftKey ? 12 : 1));
  }
}

/**
 * A data do elemento em foco, seja qual for o atributo que a stack usa.
 *
 * Uma lib grava `data-value`, outra `data-day`, e a terceira grava no `data-day`
 * do botão a data JÁ FORMATADA no locale — que não serve para aritmética. Por
 * isso o formato é conferido, e não só a presença do atributo.
 */
export function isoDoElemento(el: Element | null | undefined): string | null {
  if (!el) return null;
  for (const attr of ['data-value', 'data-day']) {
    const v = el.getAttribute(attr);
    if (v && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  }
  const celula = el.closest('[role="gridcell"], td');
  const ofCell = celula?.getAttribute('data-day');
  return ofCell && /^\d{4}-\d{2}-\d{2}$/.test(ofCell) ? ofCell : null;
}

/** O botão do dia com esta data, dentro da raiz — `null` se a grade não o traz. */
export function diaNaGrade(raiz: ParentNode, iso: string): HTMLElement | null {
  return raiz.querySelector<HTMLElement>(
    `.nds-calendar-day-btn[data-value="${iso}"], .nds-calendar-day-btn[data-day="${iso}"]`,
  );
}
