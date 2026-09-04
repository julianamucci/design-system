import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { fn, userEvent, waitFor, within, expect } from 'storybook/test';
import { computed, ref } from 'vue';
import { CalendarDate, getLocalTimeZone, type DateValue } from '@internationalized/date';
import { Calendar } from './index';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { waitForPortal, waitForPortalGone } from '@/lib/wait-for-portal';
import { dataCalendarSelectorSource } from './calendar.source';

const meta = {
  title: 'Components/Form/Calendar/Compositions',
  component: Calendar,
  tags: ['form'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: dataCalendarSelectorSource },
      description: {
        component:
          'A composição canônica do calendário: ele quase nunca aparece solto na página. Mora dentro de um popover, atrás de um botão que mostra a data escolhida.',
      },
    },
  },
} satisfies Meta<typeof Calendar>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSelect = fn();

const formatador = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: 'long',
  year: 'numeric',
});

export const DatePicker: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      description: {
        story:
          'O botão carrega a data escolhida; escolher uma nova atualiza o rótulo e fecha o popover.',
      },
    },
  },
  render: () => ({
    components: { Calendar, Popover, PopoverContent, PopoverTrigger, Button },
    setup() {
      const isOpen = ref(false);
      const selecionada = ref<DateValue | undefined>(new CalendarDate(2026, 4, 12));
      const placeholder = ref<DateValue>(new CalendarDate(2026, 4, 15));
      const label = computed(() =>
        selecionada.value
          // Fuso local, e não UTC: converter em UTC e formatar no fuso de quem
          // lê devolve o dia anterior em qualquer fuso a oeste de Greenwich.
          ? formatador.format(selecionada.value.toDate(getLocalTimeZone()))
          : 'Escolher data',
      );

      function choose(value: DateValue | undefined) {
        selecionada.value = value;
        onSelect(value);
        // Escolhida a data, o popover não tem mais o que oferecer: mantê-lo
        // aberto obrigaria a fechá-lo à mão para ver o resultado.
        isOpen.value = false;
      }

      return { isOpen, selecionada, placeholder, label, choose };
    },
    template: `
      <Popover v-model:open="isOpen">
        <PopoverTrigger as-child>
          <Button variant="outline">{{ label }}</Button>
        </PopoverTrigger>
        <PopoverContent>
          <Calendar
            :model-value="selecionada"
            :placeholder="placeholder"
            locale="pt-BR"
            @update:model-value="choose"
          />
        </PopoverContent>
      </Popover>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = () => canvas.getByRole('button');

    const open = async () => {
      if (trigger().getAttribute('aria-expanded') !== 'true') await userEvent.click(trigger());
      return waitForPortal('dialog');
    };
    const close = async () => {
      if (trigger().getAttribute('aria-expanded') === 'true') await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(trigger()).not.toHaveAttribute('aria-expanded', 'true'));
    };

    await step('O botão abre o calendário', async () => {
      // Cada passo estabelece a própria precondição: o par fechar/abrir garante
      // um clique real nesta rodada, inclusive no replay do painel.
      await close();
      const panel = await open();
      await expect(within(panel).getByRole('grid')).toBeInTheDocument();
    });

    await step('Escolher um dia atualiza o botão e fecha o popover', async () => {
      // É o contrato inteiro da composição: sem a atualização do rótulo, a
      // pessoa fecha o popover e não sabe o que escolheu.
      await close();
      const panel = await open();
      onSelect.mockClear();
      await userEvent.click(within(panel).getByRole('button', { name: /20 de abril de 2026/i }));
      await expect(onSelect).toHaveBeenCalledTimes(1);
      await waitFor(() => expect(trigger()).toHaveTextContent('20 de abril de 2026'));
      await waitForPortalGone('dialog');
    });
  },
};
