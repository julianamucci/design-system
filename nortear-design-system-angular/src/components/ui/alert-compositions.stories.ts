import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent, waitFor } from 'storybook/test';
import {
  NdsAlert,
  NdsAlertTitle,
  NdsAlertDescription,
  NdsAlertAction,
  NdsAlertIcon,
} from './alert';
import { NdsButton } from './button';
import {
  alertAdditionalClassSource,
  alertLayoutWithoutIconSource,
  alertWithActionAndDismissSource,
  alertWithActionSource,
  alertWithIconSource,
} from './alert.source';
import { measureActionDismiss } from '@shared/testing/alert-probe';

const meta: Meta = {
  title: 'Components/Feedback/Alert/Compositions',
  tags: ['feedback'],
  decorators: [
    moduleMetadata({
      imports: [
        NdsAlert,
        NdsAlertTitle,
        NdsAlertDescription,
        NdsAlertAction,
        NdsAlertIcon,
        NdsButton,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    design: figmaDesign('alert'),
    controls: { disable: true },
    // Painel Actions desligado, como nas outras quatro stacks.
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

export const WithIcon: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item2'],
    docs: { source: { transform: alertWithIconSource } },
  },
  render: () => ({
    template: `
      <div ndsAlert>
        <svg ndsAlertIcon kind="info"></svg>
        <h4 ndsAlertTitle>Informação</h4>
        <section ndsAlertDescription>Ícone SVG posicionado automaticamente.</section>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alerta = canvas.getByRole('alert');

    await step('O ícone é filho direto e decorativo', async () => {
      // Filho DIRETO porque é `.nds-alert:has(> svg)` que abre a coluna do
      // ícone; `aria-hidden` porque o texto já descreve o estado (WCAG 1.4.1).
      const icon = alerta.querySelector<SVGSVGElement>(':scope > svg')!;
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon.parentElement).toBe(alerta);
    });

    await step('O ícone é alinhado à esquerda do texto', async () => {
      const icon = alerta.querySelector<SVGSVGElement>(':scope > svg')!;
      const title = canvas.getByText('Informação');
      await expect(icon.getBoundingClientRect().right).toBeLessThanOrEqual(
        title.getBoundingClientRect().left,
      );
    });
  },
};

export const WithAction: Story = {
  parameters: { docs: { source: { transform: alertWithActionSource } } },
  render: () => ({
    template: `
      <div ndsAlert>
        <svg ndsAlertIcon kind="info"></svg>
        <h4 ndsAlertTitle>Atualização disponível</h4>
        <section ndsAlertDescription>Uma nova versão está pronta para instalação.</section>
        <div ndsAlertAction>
          <button ndsButton variant="default" size="sm">Atualizar</button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A ação é um botão acessível dentro do alert', async () => {
      const alerta = canvas.getByRole('alert');
      await expect(within(alerta).getByRole('button', { name: 'Atualizar' })).toBeVisible();
    });

    await step('O slot de ação usa a classe do componente', async () => {
      const acao = canvasElement.querySelector('[data-slot="alert-action"]');
      await expect(acao).toHaveClass('nds-alert-action');
    });

    await step('Tab leva o foco direto ao botão interno', async () => {
      // `accessibility.keyboard` documenta Tab e Enter. O alert em si não é
      // focável — o Tab tem que chegar direto ao botão.
      const alerta = canvas.getByRole('alert');
      await expect(alerta).not.toHaveAttribute('tabindex');
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(within(alerta).getByRole('button', { name: 'Atualizar' })).toHaveFocus();
    });
  },
};

/**
 * Extensibilidade: a classe que quem usa escreve no elemento SOMA às do design
 * system — o Angular mescla, e é por isso que nenhum subcomponente daqui tem
 * input `class`.
 *
 * `nds-w-full` no alert (que já é block e ocupa a largura) e `nds-w-auto` no
 * slot de ação (coluna `auto` do grid, já na largura do conteúdo) são inertes de propósito:
 * a story prova a composição de classes sem mexer no snapshot visual.
 */
export const AdditionalClass: Story = {
  parameters: { docs: { source: { transform: alertAdditionalClassSource } } },
  render: () => ({
    template: `
      <div ndsAlert class="nds-w-full">
        <svg ndsAlertIcon kind="info"></svg>
        <h4 ndsAlertTitle class="nds-w-full">Classe adicional</h4>
        <section ndsAlertDescription class="nds-w-full">A classe do consumidor convive com as do design system.</section>
        <div ndsAlertAction class="nds-w-auto">
          <button ndsButton variant="default" size="sm">Ação</button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A classe do consumidor soma à do design system', async () => {
      const alerta = canvas.getByRole('alert');
      await expect(alerta).toHaveClass('nds-alert', 'nds-w-full');

      const slots = [
        ['alert-title', 'nds-alert-title', 'nds-w-full'],
        ['alert-description', 'nds-alert-description', 'nds-w-full'],
        ['alert-action', 'nds-alert-action', 'nds-w-auto'],
      ] as const;
      for (const [slot, base, extra] of slots) {
        await expect(alerta.querySelector(`[data-slot="${slot}"]`)).toHaveClass(base, extra);
      }
    });
  },
};

export const WithoutIcon: Story = {
  parameters: {
    covers: ['visual.item4'],
    docs: { source: { transform: alertLayoutWithoutIconSource } },
  },
  render: () => ({
    template: `
      <div ndsAlert>
        <h4 ndsAlertTitle>Sem ícone</h4>
        <section ndsAlertDescription>Alert sem ícone mantém layout de coluna única.</section>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alerta = canvas.getByRole('alert');

    await step('Nenhum SVG filho direto', async () => {
      await expect(alerta.querySelector(':scope > svg')).toBeNull();
      await expect(canvas.getByText('Sem ícone')).toBeVisible();
    });

    await step('A coluna do ícone fica com largura zero', async () => {
      // `grid-template-columns: 0 1fr` na regra base: sem ícone o texto encosta
      // na borda do padding, sem buraco à esquerda.
      const colunas = getComputedStyle(alerta).gridTemplateColumns.split(' ');
      await expect(parseFloat(colunas[0])).toBe(0);
    });
  },
};

/**
 * Ação E botão de fechar no mesmo alerta. A ação é a terceira coluna do grid e
 * o X segue na calha dele, à direita; a medida é de CAIXA, pela sonda compartilhada, e
 * não de classe — as classes estariam certas com a ação encostada no X.
 */
export const WithActionAndDismiss: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item6'],
    docs: { source: { transform: alertWithActionAndDismissSource } },
  },
  render: () => ({
    template: `
      <div ndsAlert dismissible>
        <svg ndsAlertIcon kind="info"></svg>
        <h4 ndsAlertTitle>Sessão expira em 5 minutos</h4>
        <section ndsAlertDescription>Salve seu trabalho para não perder as alterações.</section>
        <div ndsAlertAction>
          <button ndsButton variant="default" size="sm">Salvar agora</button>
        </div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alerta = canvas.getByRole('alert');

    await step('A ação e o botão de fechar estão no alerta, o X por último', async () => {
      const action = within(alerta).getByRole('button', { name: 'Salvar agora' });
      const close = within(alerta).getByRole('button', { name: 'Fechar alerta' });
      await waitFor(() => expect(close).toBeVisible());
      await expect(action).toBeVisible();
      await expect(alerta.lastElementChild).toBe(close);
    });

    await step('A ação e o X não se sobrepõem, e o texto termina antes da ação', async () => {
      // A entrada anima escala e opacidade: medir caixas no meio dela daria
      // um retângulo que não é o de repouso. Leitura pura dentro do waitFor.
      await waitFor(() => expect(alerta).not.toHaveClass('nds-animate-in'));
      const layout = measureActionDismiss(alerta);
      await expect(layout.overlap).toBe(false);
      await expect(layout.gap).toBeGreaterThanOrEqual(0);
      await expect(layout.textClearsAction).toBe(true);
    });
  },
};
