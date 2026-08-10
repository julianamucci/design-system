import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, userEvent } from 'storybook/test';
import { Alert, AlertAction, AlertTitle, AlertDescription } from './index';
import { Button } from '@/components/ui/button';
import { Info } from 'lucide-vue-next';

const meta = {
  title: 'UI/Alert/Compositions',
  component: Alert,
  tags: ['feedback'],
  parameters: {
    design: figmaDesign('alert'),
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithIcon: Story = {
  parameters: { covers: ['functional.item3', 'accessibility.item2'] },
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription, Info },
    setup() { return {}; },
    template: `
      <Alert>
        <Info class="nds-icon" aria-hidden="true" />
        <AlertTitle>Informação</AlertTitle>
        <AlertDescription>Ícone SVG posicionado automaticamente.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    await expect(canvas.getByText('Informação')).toBeVisible();
  },
};

export const WithAction: Story = {
  render: () => ({
    components: { Alert, AlertAction, AlertTitle, AlertDescription, Button, Info },
    setup() { return {}; },
    template: `
      <Alert>
        <Info class="nds-icon" aria-hidden="true" />
        <AlertTitle>Atualização disponível</AlertTitle>
        <AlertDescription>Uma nova versão está pronta para instalação.</AlertDescription>
        <AlertAction>
          <Button size="sm" variant="outline">Atualizar</Button>
        </AlertAction>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A ação fica acessível como botão dentro do alert', async () => {
      const alert = canvas.getByRole('alert');
      await expect(within(alert).getByRole('button', { name: 'Atualizar' })).toBeVisible();
    });

    await step('O slot de ação usa a classe do componente', async () => {
      const action = canvasElement.querySelector('[data-slot="alert-action"]');
      await expect(action).toHaveClass('nds-alert-action');
    });

    // `accessibility.keyboard` documenta Tab e Enter. O alert em si não é
    // focável — o Tab tem que chegar direto ao botão interno.
    await step('Tab leva o foco ao botão interno', async () => {
      const alert = canvas.getByRole('alert');
      await expect(alert).not.toHaveAttribute('tabindex');
      await userEvent.tab();
      await expect(within(alert).getByRole('button', { name: 'Atualizar' })).toHaveFocus();
    });
  },
};

/**
 * Extensibilidade documentada: todos os subcomponentes aceitam classe do
 * consumidor, e ela SOMA às do design system — não substitui.
 *
 * `nds-w-full` (block, já ocupa a largura) e `nds-w-auto` no slot de ação
 * (absoluto, shrink-to-fit por default) são inertes de propósito: a story prova
 * a composição de classes sem mexer no snapshot visual.
 */
export const AdditionalClass: Story = {
  render: () => ({
    components: { Alert, AlertAction, AlertTitle, AlertDescription, Button, Info },
    setup() { return {}; },
    template: `
      <Alert class="nds-w-full">
        <Info class="nds-icon" aria-hidden="true" />
        <AlertTitle class="nds-w-full">Classe adicional</AlertTitle>
        <AlertDescription class="nds-w-full">A classe do consumidor convive com as do design system.</AlertDescription>
        <AlertAction class="nds-w-auto">
          <Button size="sm" variant="outline">Ação</Button>
        </AlertAction>
      </Alert>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A classe do consumidor soma à do design system', async () => {
      const alert = canvas.getByRole('alert');
      await expect(alert).toHaveClass('nds-alert', 'nds-w-full');

      const slots = [
        ['alert-title', 'nds-alert-title', 'nds-w-full'],
        ['alert-description', 'nds-alert-description', 'nds-w-full'],
        ['alert-action', 'nds-alert-action', 'nds-w-auto'],
      ] as const;
      for (const [slot, base, extra] of slots) {
        await expect(alert.querySelector(`[data-slot="${slot}"]`)).toHaveClass(base, extra);
      }
    });
  },
};

export const WithoutIcon: Story = {
  parameters: { covers: ['visual.item4'] },
  render: () => ({
    components: { Alert, AlertTitle, AlertDescription },
    setup() { return {}; },
    template: `
      <Alert>
        <AlertTitle>Sem ícone</AlertTitle>
        <AlertDescription>Alert sem ícone mantém layout de coluna única.</AlertDescription>
      </Alert>
    `,
  }),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = canvas.getByRole('alert');
    await expect(alert.querySelector('svg')).toBeNull();
    await expect(canvas.getByText('Sem ícone')).toBeVisible();
  },
};
