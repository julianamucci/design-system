<script lang="ts">
  import { untrack } from 'svelte';
  import { Calendar } from './index';
  import { CalendarDate, type DateValue } from '@internationalized/date';

  type Variant =
    | 'single'
    | 'multiple'
    | 'captionLabel'
    | 'captionDropdown'
    | 'twoMonths'
    | 'selected'
    | 'disabled'
    | 'today'
    | 'withOutsideDays';

  interface Props {
    variant?: Variant;
    locale?: string;
    onValueChange?: (v: unknown) => void;
  }

  let { variant = 'single', locale = 'pt-BR', onValueChange }: Props = $props();

  // Mês fixo em abril de 2026, e não a data de hoje: o Chromatic fotografa
  // estas stories e um calendário ancorado no relógio gera diferença visual
  // todo dia, escondendo a regressão de verdade no meio do ruído. A exceção é
  // a variante `today`, que existe justamente para mostrar o dia corrente.
  const refSingle = new CalendarDate(2026, 4, 12);
  const refPlaceholder = new CalendarDate(2026, 4, 15);
  const refPrev = refSingle.subtract({ days: 4 });
  const refNext = refSingle.add({ days: 4 });

  // Intentional: initial state captured once at mount (stories mount fresh per render)
  let single = $state<DateValue | undefined>(
    untrack(() => (variant === 'today' ? undefined : refSingle)),
  );
  let multiple = $state<DateValue[]>(
    untrack(() => (variant === 'multiple' ? [refPrev, refSingle, refNext] : [])),
  );
  let placeholder = $state<DateValue | undefined>(
    untrack(() => (variant === 'today' ? undefined : refPlaceholder)),
  );

  /** Bloqueia tudo antes de 10/04/2026 — limite fixo, como o mês. */
  const limite = new CalendarDate(2026, 4, 10);
  function isPast(date: DateValue): boolean {
    return date.compare(limite) < 0;
  }
</script>

{#if variant === 'single' || variant === 'selected' || variant === 'today'}
  <Calendar
    type="single"
    bind:value={single}
    bind:placeholder
    {locale}
    onValueChange={(v: DateValue | undefined) => {
      single = v;
      onValueChange?.(v);
    }}
  />
{:else if variant === 'multiple'}
  <Calendar
    type="multiple"
    bind:value={multiple}
    bind:placeholder
    {locale}
    onValueChange={(v: DateValue[]) => {
      multiple = v;
      onValueChange?.(v);
    }}
  />
{:else if variant === 'captionLabel'}
  <Calendar
    type="single"
    bind:value={single}
    bind:placeholder
    {locale}
    captionLayout="label"
  />
{:else if variant === 'captionDropdown'}
  <Calendar
    type="single"
    bind:value={single}
    bind:placeholder
    {locale}
    captionLayout="dropdown"
  />
{:else if variant === 'twoMonths'}
  <Calendar
    type="single"
    bind:value={single}
    bind:placeholder
    {locale}
    numberOfMonths={2}
  />
{:else if variant === 'disabled'}
  <Calendar
    type="single"
    bind:value={single}
    bind:placeholder
    {locale}
    isDateDisabled={isPast}
  />
{:else if variant === 'withOutsideDays'}
  <Calendar
    type="single"
    bind:value={single}
    bind:placeholder
    {locale}
    fixedWeeks
  />
{/if}
