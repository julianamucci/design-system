<script lang="ts">
  import { Calendar } from './index';
  import * as Popover from '@/components/ui/popover/index.js';
  import { Button } from '@/components/ui/button/index.js';
  import { CalendarDate, getLocalTimeZone, type DateValue } from '@internationalized/date';

  interface Props {
    onSelect?: (v: DateValue | undefined) => void;
  }

  let { onSelect }: Props = $props();

  const formatador = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  let aberto = $state(false);
  let selecionada = $state<DateValue | undefined>(new CalendarDate(2026, 4, 12));
  let placeholder = $state<DateValue | undefined>(new CalendarDate(2026, 4, 15));

  // Fuso local, e não UTC: converter em UTC e formatar no fuso de quem lê
  // devolve o dia anterior em qualquer fuso a oeste de Greenwich.
  const rotulo = $derived(
    selecionada ? formatador.format(selecionada.toDate(getLocalTimeZone())) : 'Escolher data',
  );
</script>

<Popover.Root bind:open={aberto}>
  <Popover.Trigger>
    {#snippet child({ props })}
      <Button {...props} variant="outline">{rotulo}</Button>
    {/snippet}
  </Popover.Trigger>
  <Popover.Content>
    <Calendar
      type="single"
      bind:value={selecionada}
      bind:placeholder
      locale="pt-BR"
      onValueChange={(v: DateValue | undefined) => {
        selecionada = v;
        onSelect?.(v);
        // Escolhida a data, o popover não tem mais o que oferecer: mantê-lo
        // aberto obrigaria a fechá-lo à mão para ver o resultado.
        aberto = false;
      }}
    />
  </Popover.Content>
</Popover.Root>
