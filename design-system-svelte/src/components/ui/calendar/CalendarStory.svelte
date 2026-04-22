<script lang="ts">
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

  // Reference date (today) used for stable stories. Reactive $state for interaction.
  const today = new Date();
  const refSingle = new CalendarDate(today.getFullYear(), today.getMonth() + 1, today.getDate());
  const refPrev = refSingle.subtract({ days: 1 });
  const refNext = refSingle.add({ days: 1 });

  // Intentional: initial state captured once at mount (stories mount fresh per render)
  // eslint-disable-next-line svelte/state_referenced_locally
  let single = $state<DateValue | undefined>(
    variant === 'selected' || variant === 'single' ? refSingle : undefined,
  );
  // eslint-disable-next-line svelte/state_referenced_locally
  let multiple = $state<DateValue[]>(
    variant === 'multiple' ? [refPrev, refSingle, refNext] : [],
  );

  // Disabled matcher for stories that need it.
  function isPast(date: DateValue): boolean {
    return date.compare(refSingle) < 0;
  }
</script>

{#if variant === 'single' || variant === 'selected' || variant === 'today'}
  <Calendar
    type="single"
    bind:value={single}
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
    {locale}
    captionLayout="label"
  />
{:else if variant === 'captionDropdown'}
  <Calendar
    type="single"
    bind:value={single}
    {locale}
    captionLayout="dropdown"
  />
{:else if variant === 'twoMonths'}
  <Calendar
    type="single"
    bind:value={single}
    {locale}
    numberOfMonths={2}
  />
{:else if variant === 'disabled'}
  <Calendar
    type="single"
    bind:value={single}
    {locale}
    isDateDisabled={isPast}
  />
{:else if variant === 'withOutsideDays'}
  <Calendar
    type="single"
    bind:value={single}
    {locale}
    fixedWeeks
  />
{/if}
