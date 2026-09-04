import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect } from 'storybook/test';
import {
  waitForOpen,
  waitForClosed,
  accessibleName,
  panelOpen,
  leaveWithPointer,
} from '@shared/testing/hover-card-probe';
import HoverCardStory from './HoverCardStory.svelte';
import HoverCardDocs from '@/components/docs/HoverCardDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { hoverCardSource } from './hover-card.source';

const meta: Meta = {
  title: 'Components/Overlay/HoverCard',
  component: HoverCardStory,
  tags: ['autodocs', 'overlay'],
  parameters: {
    layout: 'centered',
    docs: {
      page: withAutoDocsTab(HoverCardDocs),
      source: { transform: hoverCardSource },
      description: {
        component:
          'Cartão flutuante exibido em hover ou foco, com espera configurável e posicionamento side/align. O gatilho descreve o painel enquanto ele está aberto, e é assim que o conteúdo chega ao leitor de tela. Usar para previews opcionais — nunca para ações críticas, que ninguém alcança no toque.',
      },
    },
  },
  argTypes: {
    triggerLabel: {
      control: 'text',
      description:
        'Texto do gatilho. Conteúdo natural (uma menção, um nome), nunca “passe o mouse aqui”.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '@joana' } },
    },
    side: {
      control: 'inline-radio',
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Lado preferido de abertura. Vira sozinho quando não cabe.',
      table: { type: { summary: "'top' | 'bottom' | 'left' | 'right'" }, defaultValue: { summary: "'bottom'" } },
    },
    align: {
      control: 'inline-radio',
      options: ['start', 'center', 'end'],
      description: 'Alinhamento do painel no eixo do lado escolhido.',
      table: { type: { summary: "'start' | 'center' | 'end'" }, defaultValue: { summary: "'center'" } },
    },
    openDelay: {
      control: { type: 'number', min: 0, step: 50 },
      description: 'Espera em ms antes de abrir, no ponteiro e no foco.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '600' } },
    },
    closeDelay: {
      control: { type: 'number', min: 0, step: 50 },
      description: 'Espera em ms antes de fechar depois que o cursor sai.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '300' } },
    },
    defaultOpen: {
      control: 'boolean',
      description: 'Estado inicial em modo não-controlado.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    variant: {
      control: 'select',
      options: ['default', 'withDelay', 'userProfile', 'linkPreview', 'definition', 'metric', 'extraClass'],
      description: 'Composição interna usada na demonstração.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'default'" } },
    },
  },
  args: {
    side: 'bottom',
    align: 'center',
    // Espera curta no playground: quem abre a story quer ver o cartão, não
    // cronometrar 600ms. O padrão real está descrito nos argTypes.
    openDelay: 150,
    closeDelay: 100,
    defaultOpen: false,
    triggerLabel: '@joana',
    variant: 'default',
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item3', 'functional.item4',
      'accessibility.item1', 'accessibility.item3', 'accessibility.item4',
      'accessibility.item6',
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('link', { name: /@joana/i });

    await step('O gatilho continua sendo um link de verdade', async () => {
      // O cartão é ENRIQUECIMENTO: quem está no toque, ou num leitor de tela,
      // chega ao perfil pelo clique. É exigência do componente, não do exemplo.
      await expect(trigger).toHaveAttribute('href', '/users/joana');
      await expect(trigger).toHaveAttribute('data-slot', 'hover-card-trigger');
    });

    // Estado conhecido antes das afirmações: o painel Interactions REEXECUTA a
    // play no mesmo DOM, e um passo que dependa do que a rodada anterior deixou
    // inverte de resultado na segunda vez.
    await userEvent.keyboard('{Escape}');
    await waitForClosed('no reset inicial');

    await step('Fechado, não existe painel no documento', async () => {
      await expect(panelOpen()).toBeNull();
    });

    await step('Passar o ponteiro abre o cartão', async () => {
      await userEvent.hover(trigger);
      const panel = await waitForOpen();
      await expect(panel).toBeVisible();
      // Sem `role`: o painel é conteúdo descritivo, não um diálogo. Quem o liga
      // ao gatilho é o `aria-describedby`, e é ele que faz o leitor de tela
      // anunciar o CONTEÚDO do cartão em vez de só o gatilho.
      await expect(panel).not.toHaveAttribute('role');
      await expect(accessibleName(panel)).toBe('');
      await expect(trigger).toHaveAttribute('aria-describedby', panel.id);
      await expect(panel).toHaveClass(/nds-hover-card-content/);
    });

    await step('Levar o ponteiro para longe fecha o cartão', async () => {
      await leaveWithPointer(trigger, panelOpen()!);
      await waitForClosed('depois do ponteiro sair');
      await expect(panelOpen()).toBeNull();
    });

    await step('Tab alcança o gatilho e abre o cartão sem ponteiro nenhum', async () => {
      // É o que sustenta a WCAG 1.4.13 para quem navega por teclado: o mesmo
      // conteúdo, pelo foco.
      await userEvent.tab();
      await expect(trigger).toHaveFocus();
      const panel = await waitForOpen('depois do foco');
      await expect(panel).toBeVisible();
    });

    await step('Escape fecha o cartão', async () => {
      // O foco está no gatilho, não dentro do painel: o listener é do
      // documento, e é isso que faz o atalho valer de qualquer lugar.
      await userEvent.keyboard('{Escape}');
      await waitForClosed('depois do Escape');
      await expect(panelOpen()).toBeNull();
      // A descrição sai com o painel: sobrando, apontaria para um `id` que já
      // não está no documento.
      await expect(trigger).not.toHaveAttribute('aria-describedby');
    });
  },
};
