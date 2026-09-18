import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { userEvent, within, expect, fn } from 'storybook/test';
import {
  waitForOpen,
  waitForClosed,
  accessibleName,
  panelOpen,
  leaveWithPointer,
  expectCentradoNoEixoCruzado,
  withSceneAwayFromEdge,
} from '@shared/testing/hover-card-probe';
import HoverCardStory from './HoverCardStory.svelte';
import HoverCardDocs from '@/components/docs/HoverCardDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { hoverCardSource } from './hover-card.source';

import { figmaDesign } from '@shared/figma/design-links';
const meta: Meta = {
  title: 'Components/Overlay/HoverCard',
  component: HoverCardStory,
  tags: ['autodocs', 'overlay'],
  parameters: {
    design: figmaDesign('hoverCard'),
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
    onOpenChange: {
      control: false,
      description: 'Chamado a cada abertura e fechamento, com o novo estado.',
      table: { type: { summary: '(open: boolean) => void' } },
    },
  },
  args: {
    side: 'bottom',
    align: 'center',
    // Espera do SISTEMA: 600ms para abrir e 300ms para fechar. O Playground é
    // o exemplo canônico, e a página exige espera de abertura de ao menos
    // 300ms — atraso customizado é assunto da variante `withDelay`.
    openDelay: 600,
    closeDelay: 300,
    defaultOpen: false,
    triggerLabel: '@joana',
    // O Playground abre no cartão de PERFIL, como nas outras quatro stacks — e
    // é esse exemplo que a Demonstração da docs page repete (guideline 08 §15).
    // A variante `default` continua existindo para a story de Variantes, que é
    // onde a espera padrão de 600ms/300ms é o assunto.
    variant: 'userProfile',
    onOpenChange: fn(),
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('link', { name: /@joana/i });
    const onOpenChange = args.onOpenChange as ReturnType<typeof fn>;

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
      // O contador é lido ANTES do gesto, e comparado depois: a play reexecuta
      // no mesmo DOM pelo painel Interactions, e `toHaveBeenCalled()` seco
      // passaria na segunda rodada com o callback desligado.
      const callsBefore = onOpenChange.mock.calls.length;
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
      await expect(onOpenChange.mock.calls.length).toBeGreaterThan(callsBefore);
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

    await step('O painel fica centrado no gatilho no eixo cruzado', async () => {
      // D11: o deslocamento cruzado é ZERO nas cinco. O que se afirma é a
      // COORDENADA — onde o painel FICOU —, e não o valor da opção: comparar
      // `alignOffset` com a constante seria repeti-la para ela mesma, que é a
      // forma de asserção que deixou a D8 passar meses.
      //
      // `withSceneAwayFromEdge` porque o executor não aplica o `layout:
      // 'centered'` — medido aqui: sem `#storybook-root`, canvas em bloco a
      // partir de `left 0`, gatilho com o centro em 144,8px de uma janela de
      // 1200, e o painel de 320px travado em `left 0` pelo posicionador. O
      // desvio de 15,2px que sobrava era da BORDA, não do deslocamento cruzado.
      // O auxiliar é o compartilhado de propósito: cinco formas de afastar a
      // cena seriam cinco asserções diferentes com o mesmo rótulo.
      //
      // Depois do passo do Tab, e não do passo do ponteiro: afastar a cena com
      // o ponteiro parado sobre o gatilho arriscaria fechar o cartão pela saída
      // do ponteiro, e a medida viraria outra coisa. Aberto por Tab, não há
      // ponteiro nenhum em jogo.
      await withSceneAwayFromEdge(canvasElement, () =>
        expectCentradoNoEixoCruzado(trigger, panelOpen()!, args.side ?? 'bottom'),
      );
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
