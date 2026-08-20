/**
 * Transforms do painel Code do Calendar.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * Nesta stack a data é um `DateValue` de `@internationalized/date`, e não o
 * `Date` nativo — é o tipo que o componente recebe e devolve, então é ele que o
 * snippet mostra.
 */
import { svelteSnippet } from '@/lib/story-source';

const IMPORT = `import { Calendar } from "@/components/ui/calendar";
import { CalendarDate } from "@internationalized/date";`;

/** A data de abertura das stories é fixa para a foto não mudar todo dia. */
const DATA_INICIAL = `let data = $state(new CalendarDate(2026, 4, 12));`;

/**
 * Forma canônica: uma data por vez, com os rótulos no idioma pedido. O
 * `placeholder` fica de fora de propósito — sem ele o calendário abre no mês da
 * data escolhida, que é o que quase todo formulário quer.
 */
export function calendarSource(): string {
  return svelteSnippet(
    `${IMPORT}\n\n${DATA_INICIAL}`,
    `<Calendar type="single" bind:value={data} locale="pt-BR" />`,
  );
}

/** Modo múltiplo: a escolha vira uma LISTA, e clicar de novo tira da lista. */
export function calendarMultiploSource(): string {
  return svelteSnippet(
    `${IMPORT}

let datas = $state([
  new CalendarDate(2026, 4, 8),
  new CalendarDate(2026, 4, 12),
  new CalendarDate(2026, 4, 16),
]);`,
    `<Calendar type="multiple" bind:value={datas} locale="pt-BR" />`,
  );
}

/**
 * Modo intervalo: é outro componente, e não uma prop do Calendar — o valor tem
 * duas pontas e o miolo entre elas é desenhado junto.
 */
export function calendarIntervaloSource(): string {
  return svelteSnippet(
    `import { RangeCalendar } from "@/components/ui/range-calendar";
import { CalendarDate } from "@internationalized/date";

let periodo = $state({
  start: new CalendarDate(2026, 4, 10),
  end: new CalendarDate(2026, 4, 18),
});`,
    `<RangeCalendar bind:value={periodo} locale="pt-BR" />`,
  );
}

/** Estado bloqueado: a regra recebe cada dia e diz se ele pode ser escolhido. */
export function calendarBloqueadoSource(): string {
  return svelteSnippet(
    `import { Calendar } from "@/components/ui/calendar";
import { CalendarDate, type DateValue } from "@internationalized/date";

${DATA_INICIAL}

const limite = new CalendarDate(2026, 4, 10);
const antesDoLimite = (dia: DateValue) => dia.compare(limite) < 0;`,
    `<Calendar
  type="single"
  bind:value={data}
  locale="pt-BR"
  isDateDisabled={antesDoLimite}
/>`,
  );
}

/**
 * Sem data escolhida: o calendário abre no mês corrente e marca o dia de hoje.
 * Marcar hoje não é escolhê-lo — a marcação de escolha continua vazia.
 */
export function calendarHojeSource(): string {
  return svelteSnippet(
    `import { Calendar } from "@/components/ui/calendar";
import type { DateValue } from "@internationalized/date";

let data = $state<DateValue>();`,
    `<Calendar type="single" bind:value={data} locale="pt-BR" />`,
  );
}

/**
 * Seis linhas de semana sempre, completadas com os dias do mês vizinho: a
 * altura do bloco para de pular quando o mês vira.
 */
export function calendarSemanasFixasSource(): string {
  return svelteSnippet(
    `${IMPORT}\n\n${DATA_INICIAL}`,
    `<Calendar type="single" bind:value={data} locale="pt-BR" fixedWeeks />`,
  );
}

/** Legenda em texto (padrão): mês e ano escritos, sem nada para operar. */
export function calendarLegendaTextoSource(): string {
  return svelteSnippet(
    `${IMPORT}\n\n${DATA_INICIAL}`,
    `<Calendar
  type="single"
  bind:value={data}
  locale="pt-BR"
  captionLayout="label"
/>`,
  );
}

/** Legenda em seletores: mês e ano viram controles, para saltar de período. */
export function calendarLegendaSeletoresSource(): string {
  return svelteSnippet(
    `${IMPORT}\n\n${DATA_INICIAL}`,
    `<Calendar
  type="single"
  bind:value={data}
  locale="pt-BR"
  captionLayout="dropdown"
/>`,
  );
}

/** Dois meses lado a lado, para escolher datas que atravessam a virada. */
export function calendarDoisMesesSource(): string {
  return svelteSnippet(
    `${IMPORT}\n\n${DATA_INICIAL}`,
    `<Calendar
  type="single"
  bind:value={data}
  locale="pt-BR"
  numberOfMonths={2}
/>`,
  );
}

/**
 * Composição canônica: o calendário quase nunca aparece solto na página. Mora
 * dentro de um popover, atrás de um botão que mostra a data escolhida — e
 * escolher uma data fecha o painel, que já não tem o que oferecer.
 */
export function calendarEmPopoverSource(): string {
  return svelteSnippet(
    `import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { CalendarDate, getLocalTimeZone } from "@internationalized/date";

const formatador = new Intl.DateTimeFormat("pt-BR", {
  day: "2-digit",
  month: "long",
  year: "numeric",
});

let aberto = $state(false);
${DATA_INICIAL}

// Fuso local, e não UTC: converter em UTC e formatar no fuso de quem lê devolve
// o dia anterior em qualquer fuso a oeste de Greenwich.
const rotulo = $derived(formatador.format(data.toDate(getLocalTimeZone())));`,
    `<Popover bind:open={aberto}>
  <PopoverTrigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline">{rotulo}</Button>
    {/snippet}
  </PopoverTrigger>
  <PopoverContent>
    <Calendar
      type="single"
      bind:value={data}
      locale="pt-BR"
      onValueChange={() => (aberto = false)}
    />
  </PopoverContent>
</Popover>`,
  );
}
