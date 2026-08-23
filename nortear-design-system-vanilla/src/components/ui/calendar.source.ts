// Snippet do painel Code do Calendar — ver `@/lib/story-source`.

import {
  chamada,
  importing,
  montar,
  opcoes,
  snippet,
  texto,
  type SourceTransform,
} from '@/lib/story-source';

/** O que as stories usam da `CalendarOptions` e que o snippet precisa mostrar. */
export type CalendarSnippetOptions = {
  mode?: 'single' | 'multiple' | 'range';
  /**
   * Valor inicial JÁ ESCRITO COMO CÓDIGO — `new Date(…)`, a lista do modo
   * múltiplo ou o par do intervalo. `undefined` é o calendário que abre sem
   * nenhuma data escolhida.
   */
  value?: string;
  /** Etiqueta BCP 47. Sem valor vale o padrão da fábrica. */
  locale?: string;
  numberOfMonths?: number;
  captionLayout?: 'label' | 'dropdown';
  showOutsideDays?: boolean;
  /** Expressão da regra que bloqueia datas. */
  disabled?: string;
  /** Expressão do callback de escolha. */
  onSelect?: string;
  /** Classes do consumidor no bloco raiz. */
  class?: string;
};

/** Data de exemplo dos snippets — a mesma que as stories mostram. */
export const DATA_DE_EXEMPLO = 'new Date(2026, 3, 12)';

/**
 * Uso canônico: uma data escolhida, no idioma da página.
 *
 * É o padrão de PARTIDA das transforms, e não um valor cravado dentro do
 * snippet: uma story que abre sem nenhuma data — o destaque de hoje — a
 * sobrepõe com `value: undefined` e o snippet sai sem a opção.
 */
const DEFAULT: CalendarSnippetOptions = { locale: 'pt-BR', value: DATA_DE_EXEMPLO };

/** A chamada real de `createCalendar` com as opções da story. */
export function calendarSnippet(o: CalendarSnippetOptions = {}): string {
  const lines = opcoes([
    ['mode', o.mode && o.mode !== 'single' ? texto(o.mode) : undefined],
    ['locale', o.locale ? texto(o.locale) : undefined],
    ['value', o.value],
    ['numberOfMonths', o.numberOfMonths && o.numberOfMonths !== 1 ? String(o.numberOfMonths) : undefined],
    ['captionLayout', o.captionLayout && o.captionLayout !== 'label' ? texto(o.captionLayout) : undefined],
    ['showOutsideDays', o.showOutsideDays === false ? 'false' : undefined],
    ['disabled', o.disabled],
    ['class', o.class ? texto(o.class) : undefined],
    ['onSelect', o.onSelect],
  ]);

  return snippet(
    importing('calendar', 'createCalendar'),
    `const calendario = ${chamada('createCalendar', lines)};`,
    montar('calendario'),
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. O Calendar não
 * tem control nenhum, então o que chega aqui é o padrão de partida.
 */
export const calendarSource: SourceTransform<CalendarSnippetOptions> = (_gerado, ctx) =>
  calendarSnippet({ ...DEFAULT, ...ctx.args });

/** Transform de story: mesma fábrica, opções fixas que os controls não cobrem. */
export function calendarSourceWith(
  fixas: CalendarSnippetOptions,
): SourceTransform<CalendarSnippetOptions> {
  return (_gerado, ctx) => calendarSnippet({ ...DEFAULT, ...ctx.args, ...fixas });
}

// ─── Seletor de data ──────────────────────────────────────────────────────────

/** O que o seletor de data precisa mostrar. */
export type CalendarWithPopoverSnippetOptions = {
  /** Texto do gatilho antes de haver data escolhida. */
  gatilho?: string;
  locale?: string;
  value?: string;
};

/**
 * A composição canônica: o calendário quase nunca aparece solto na página. Mora
 * num popover, atrás de um botão que mostra a data escolhida.
 */
export function calendarWithPopoverSnippet(o: CalendarWithPopoverSnippetOptions = {}): string {
  const locale = o.locale ?? 'pt-BR';

  return snippet(
    [
      importing('button', 'createButton'),
      importing('calendar', 'createCalendar'),
      importing('popover', 'createPopover'),
    ].join('\n'),
    `const formatador = new Intl.DateTimeFormat(${texto(locale)}, {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

const gatilho = createButton({ variant: 'outline', label: ${texto(o.gatilho ?? 'Escolher data')} });`,
    `const calendario = createCalendar({
  locale: ${texto(locale)},
  value: ${o.value ?? DATA_DE_EXEMPLO},
  onSelect: (valor) => {
    if (!(valor instanceof Date)) return;
    gatilho.textContent = formatador.format(valor);
    // Escolhida a data, o painel não tem mais o que oferecer: mantê-lo aberto
    // obrigaria a fechá-lo à mão para ver o resultado.
    gatilho.click();
  },
});`,
    'const seletor = createPopover({ trigger: gatilho, content: calendario });',
    montar('seletor'),
  );
}

/** Transform de story para o seletor de data. */
export function calendarWithPopoverSourceWith(
  fixas: CalendarWithPopoverSnippetOptions = {},
): SourceTransform<CalendarWithPopoverSnippetOptions> {
  return (_gerado, ctx) => calendarWithPopoverSnippet({ ...ctx.args, ...fixas });
}
