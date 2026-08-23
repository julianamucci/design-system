import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { parseDate, type DateValue } from '@internationalized/date';
import { NdsCalendar } from './calendar';
import { NDS_POPOVER } from './popover';
import { NdsButton } from './button';
import { FOCUS_RULE_GUARDA } from '@/lib/wait-for-portal';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O Calendar dentro de um Popover é o que o resto do mundo chama de DatePicker.
// Não existe um componente `DatePicker` neste sistema de propósito: seria um
// invólucro que só junta duas peças que já se compõem, e que passaria a ter
// versão própria, prop própria e bug próprio.
//
// Data fixa: com `new Date()` a foto do Chromatic mudaria toda virada de mês.

const meta: Meta = {
  title: 'UI/Calendar/Compositions',
  decorators: [moduleMetadata({ imports: [NdsCalendar, ...NDS_POPOVER, NdsButton] })],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    a11y: { config: { rules: [FOCUS_RULE_GUARDA] } },
    docs: {
      description: {
        component:
          'O Calendar composto com o Popover forma o seletor de data. O gatilho mostra a escolha em texto, e é ele quem recebe o foco de volta quando o painel fecha.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const InPopover: Story = {
  parameters: {
    covers: ['visual.item5'],
    docs: {
      description: {
        story:
          'Seletor de data: o gatilho abre a grade num painel e mostra a escolha por extenso. Ao abrir, o foco vai direto para o dia em vista — sem isso, quem chega por teclado precisa tabular pela grade inteira antes de escolher.',
      },
    },
  },
  render: () => ({
    props: {
      month: parseDate('2026-04-01'),
      value: undefined as DateValue | undefined,
      // O rótulo do gatilho sai do mesmo formatador que a grade usa, no mesmo
      // locale — escrever "15/04/2026" à mão aqui criaria uma segunda forma de
      // escrever data na mesma tela.
      label(v: DateValue | undefined): string {
        if (!v) return 'Escolher data';
        return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(
          new Date(v.year, v.month - 1, v.day),
        );
      },
    },
    template: `
      <div ndsPopover>
        <button ndsPopoverTrigger ndsButton variant="outline" data-testid="gatilho">
          {{ label(value) }}
        </button>

        <ng-template ndsPopoverContent side="bottom" align="start">
          <div
            ndsCalendar
            locale="pt-BR"
            [defaultMonth]="month"
            [(value)]="value"
            [initialFocus]="true"
          ></div>
        </ng-template>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = () => canvas.getByTestId('gatilho');
    const grid = () => document.querySelector<HTMLElement>('.nds-calendar-root');

    await step('Fechado, o gatilho convida e não mostra grade', async () => {
      await expect(trigger()).toHaveTextContent('Escolher data');
      await expect(grid()).toBeNull();
    });

    await step('Abrir leva o foco para dentro da grade', async () => {
      await userEvent.click(trigger());
      // O painel entra no DOM ANTES de o floating-ui medir e antes de o foco
      // inicial assentar; ler qualquer coisa no primeiro quadro é ler o estado
      // de transição.
      await waitFor(() => expect(grid()).not.toBeNull());
      // O foco tem que parar num DIA, não no primeiro tabulável do painel. Sem
      // esta distinção o teste passaria com o foco no botão de mês anterior —
      // que foi o estado real medido antes do conserto, e que obriga quem chega
      // por teclado a atravessar a navegação inteira para escolher uma data.
      // O foco tem que parar num DIA, não no primeiro tabulável do painel. Sem
      // esta distinção o teste passaria com o foco no botão de mês anterior —
      // que foi o estado real medido antes do conserto, e que obriga quem chega
      // por teclado a atravessar a navegação inteira para escolher uma data.
      await waitFor(() =>
        expect(document.activeElement?.classList.contains('nds-calendar-day-btn')).toBe(true),
      );
    });

    await step('Escolher um dia escreve a data no gatilho', async () => {
      // O painel NÃO fecha sozinho na escolha, e é de propósito: o Popover não
      // sabe o que a grade dentro dele significa, e fechar por conta seria a
      // peça de fora decidindo pela de dentro. Quem quiser esse comportamento
      // liga o `open` ao evento de escolha — a composição permite, o padrão não
      // impõe.
      const quinze = grid()!.querySelector<HTMLElement>(
        '.nds-calendar-day-btn[data-value="2026-04-15"]',
      )!;
      await userEvent.click(quinze);
      await waitFor(() => expect(trigger()).toHaveTextContent('15 de abril de 2026'));
    });

    await step('Escape fecha e devolve o foco ao gatilho', async () => {
      // Sem a devolução, o Tab recomeçaria do topo da página depois de escolher
      // a data, e a pessoa perderia o lugar no formulário que preenchia.
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(grid()).toBeNull());
      await waitFor(() => expect(document.activeElement).toBe(trigger()));
    });
  },
};
