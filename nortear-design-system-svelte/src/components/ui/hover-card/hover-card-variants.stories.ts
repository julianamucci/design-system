import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect } from 'storybook/test';
import {
  waitForOpen,
  waitForClosed,
  panelOpen,
} from '@shared/testing/hover-card-probe';
import HoverCardStory from './HoverCardStory.svelte';
import { hoverCardWaitDefaultSource, hoverCardSource } from './hover-card.source';

// O HoverCard não tem variante de cor nem de tamanho: o painel é um só. O que
// varia é o TEMPO — quanto o cartão espera antes de aparecer e antes de sumir —
// e essa escolha é de conteúdo, não de estilo: preview rico pede 300-500ms;
// enriquecimento opcional pede 600ms ou mais, para não abrir a cada passada de
// cursor.

const meta: Meta = {
  title: 'UI/HoverCard/Variants',
  component: HoverCardStory,
  tags: ['overlay'],
  parameters: {
    layout: 'centered',
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; a espera curta é exatamente
      // o que os args declaram, e a padrão sobrescreve logo abaixo.
      source: { transform: hoverCardSource },
      description: {
        component:
          'As duas configurações de tempo. Padrão usa a espera do próprio componente; a segunda encurta a espera, o que só se justifica quando o cartão traz informação que o leitor está procurando ativamente.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  name: 'Default (600ms / 300ms)',
  args: {
    defaultOpen: true,
    variant: 'default',
    triggerLabel: '@joana',
  },
  parameters: {
    docs: {
      source: { transform: hoverCardWaitDefaultSource },
      description: {
        story:
          'Espera padrão: 600ms para abrir, 300ms para fechar. Nenhum atraso é escrito no markup — o cartão nasce aberto aqui só para a captura visual, e no uso real responde ao ponteiro e ao foco.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Sem atraso escrito no markup, o cartão usa o padrão do componente', async () => {
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      await expect(within(panel).getByText(/600ms/)).toBeVisible();
      await expect(canvas.getByRole('link')).toHaveAttribute('data-slot', 'hover-card-trigger');
    });
  },
};

export const WithShortDelay: Story = {
  name: 'With short delay (150ms)',
  args: {
    defaultOpen: false,
    openDelay: 150,
    closeDelay: 100,
    variant: 'withDelay',
    triggerLabel: 'design-system.dev',
  },
  parameters: {
    covers: ['functional.item1'],
    docs: {
      description: {
        story:
          'Espera curta (150ms para abrir, 100ms para fechar) para previews que o leitor procura de propósito. Abaixo de ~300ms o cartão passa a abrir sozinho quando o cursor só atravessa o texto — é o que a diretriz de uso desaconselha.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('link');

    // Estado conhecido: a play reexecuta no mesmo DOM pelo painel Interactions.
    await userEvent.keyboard('{Escape}');
    await waitForClosed();

    await step('O cartão abre depois da espera pedida na raiz', async () => {
      await expect(panelOpen()).toBeNull();
      const start = performance.now();
      await userEvent.hover(trigger);
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      await expect(within(panel).getByText('Guia de overlays acessíveis')).toBeVisible();

      // O cronômetro é a prova de que o atraso CHEGOU ao primitivo: com o
      // binding perdido, o cartão usaria os 600ms padrão, muito acima deste
      // teto. A folga é larga de propósito — o que se mede é a diferença entre
      // 150 e 600, não a precisão do relógio.
      await expect(performance.now() - start).toBeLessThan(550);
    });
  },
};
