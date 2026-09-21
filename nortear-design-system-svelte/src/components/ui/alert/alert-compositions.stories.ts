import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, userEvent, waitFor } from 'storybook/test';
import { Alert } from './index';
import AlertStory from './AlertStory.svelte';
import AlertWithActionStory from './AlertWithActionStory.svelte';
import AlertAdditionalClassStory from './AlertAdditionalClassStory.svelte';
import AlertWithActionAndDismissStory from './AlertWithActionAndDismissStory.svelte';
import { measureActionDismiss } from '@shared/testing/alert-probe';
import {
  alertAdditionalClassSource,
  alertWithActionAndDismissSource,
  alertWithActionSource,
  alertLayoutWithoutIconSource,
  alertSource,
  alertWithIconSource,
} from './alert.source';

const meta: Meta = {
  parameters: {
    design: figmaDesign('alert'),
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; a composição que aninha
      // outro componente sobrescreve com a própria marcação logo abaixo.
      source: { transform: alertSource },
    },
  },
  title: 'Components/Feedback/Alert/Compositions',
  component: Alert,
  tags: ['feedback'],
};

export default meta;
type Story = StoryObj;

export const WithIcon: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item2'],
    // O snippet do meta escreve "Atenção"; esta story mostra outro texto.
    docs: { source: { transform: alertWithIconSource } },
  },
  render: () => ({
    Component: AlertStory,
    props: {
      title: 'Informação',
      description: 'Ícone SVG posicionado automaticamente.',
      showIcon: true,
      icon: 'info',
    },
  }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');

    await step('O ícone é filho DIRETO do alert e é decorativo', async () => {
      // `functional.item3`, que esta story declara cobrir, é literalmente
      // "renderizar com ícone filho direto" — e é `.nds-alert:has(> svg)` que
      // abre a coluna do ícone. `querySelector('svg')` casava qualquer
      // descendente (o X do botão de fechar, por exemplo): a asserção passava
      // com um wrapper no meio, que colapsaria o layout de duas colunas.
      const icon = alert.querySelector<SVGSVGElement>(':scope > svg');
      await expect(icon).not.toBeNull();
      await expect(icon).toHaveAttribute('aria-hidden', 'true');
      await expect(icon!.parentElement).toBe(alert);
    });

    await step('O ícone fica à esquerda do texto', async () => {
      // A consequência VISÍVEL de `.nds-alert:has(> svg)` é a coluna do ícone
      // abrindo antes do texto. Sem esta medida, o `:scope > svg` acima aprova
      // um ícone bem parentado e mal colocado — por exemplo com a coluna
      // colapsada e o SVG empilhado sobre o título.
      const icon = alert.querySelector<SVGSVGElement>(':scope > svg')!;
      const title = canvas.getByText('Informação');
      await expect(icon.getBoundingClientRect().right).toBeLessThanOrEqual(
        title.getBoundingClientRect().left,
      );
      await expect(title).toBeVisible();
    });
  },
};

export const WithAction: Story = {
  parameters: {
    docs: { source: { transform: alertWithActionSource } },
  },
  render: () => ({ Component: AlertWithActionStory }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A ação fica acessível como botão dentro do alert', async () => {
      const alert = await canvas.findByRole('alert');
      await expect(within(alert).getByRole('button', { name: 'Atualizar' })).toBeVisible();
    });

    await step('O slot de ação usa a classe do componente', async () => {
      const action = canvasElement.querySelector('[data-slot="alert-action"]');
      await expect(action).toHaveClass('nds-alert-action');
    });

    // `accessibility.keyboard` documenta Tab e Enter. O alert em si não é
    // focável — o Tab tem que chegar direto ao botão interno.
    await step('Tab leva o foco ao botão interno', async () => {
      const alert = await canvas.findByRole('alert');
      await expect(alert).not.toHaveAttribute('tabindex');
      await userEvent.tab();
      await expect(within(alert).getByRole('button', { name: 'Atualizar' })).toHaveFocus();
    });
  },
};

/**
 * Extensibilidade documentada: todos os subcomponentes aceitam classe do
 * consumidor, e ela SOMA às do design system — não substitui.
 */
export const AdditionalClass: Story = {
  parameters: {
    docs: { source: { transform: alertAdditionalClassSource } },
  },
  render: () => ({ Component: AlertAdditionalClassStory }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A classe do consumidor soma à do design system', async () => {
      const alert = await canvas.findByRole('alert');
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
  parameters: {
    covers: ['visual.item4'],
    docs: { source: { transform: alertLayoutWithoutIconSource } },
  },
  render: () => ({
    Component: AlertStory,
    props: {
      title: 'Sem ícone',
      description: 'Alert sem ícone mantém layout de coluna única.',
      showIcon: false,
    },
  }),

  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');
    await expect(alert.querySelector('svg')).toBeNull();
    await expect(canvas.getByText('Sem ícone')).toBeVisible();
  },
};

/**
 * Ação e botão de fechar no mesmo alerta. Até 2026-09-14 a folha os declarava
 * exclusivos só em comentário, e a ação encostava no X. A prova é de CAIXA, pela
 * sonda compartilhada: nada se cruza, a ação fica à esquerda do X e o texto
 * termina antes da ação.
 */
export const WithActionAndDismiss: Story = {
  parameters: {
    covers: ['functional.item8', 'visual.item6'],
    docs: { source: { transform: alertWithActionAndDismissSource } },
  },
  render: () => ({ Component: AlertWithActionAndDismissStory }),

  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const alert = await canvas.findByRole('alert');

    await step('Ação e botão de fechar estão no mesmo alerta', async () => {
      await expect(within(alert).getByRole('button', { name: 'Salvar agora' })).toBeInTheDocument();
      await expect(within(alert).getByRole('button', { name: 'Fechar alerta' })).toBeInTheDocument();
      // O X continua o último filho: o leitor encontra conteúdo e ação antes.
      await expect(alert.lastElementChild).toHaveAttribute('data-slot', 'alert-dismiss');
    });

    await step('As caixas não se cruzam e o texto não corre por baixo da ação', async () => {
      // O alerta dispensável ENTRA animado; a caixa só é medida depois de a
      // entrada assentar. Dentro do waitFor, leitura pura de classe.
      await waitFor(() => expect(alert).not.toHaveClass('nds-animate-in'));
      const layout = measureActionDismiss(alert);
      await expect(layout.overlap).toBe(false);
      await expect(layout.gap).toBeGreaterThanOrEqual(0);
      await expect(layout.textClearsAction).toBe(true);
    });
  },
};
