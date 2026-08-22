import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import TabsStory from './TabsStory.svelte';
import {
  tabsAbaInicialSource,
  tabsDesabilitadaSource,
  tabsSource,
} from './tabs.source';

const meta: Meta = {
  title: 'UI/Tabs/States',
  component: TabsStory,
  tags: ['navigation'],
  parameters: {
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; Active e FocusVisible não
      // têm marcação própria e ficam com a forma canônica.
      source: { transform: tabsSource },
    },
  },
};

export default meta;
type Story = StoryObj;

const ITEMS = [
  { value: 'overview',   label: 'Visão geral',  content: 'Conteúdo da visão geral.' },
  { value: 'properties', label: 'Propriedades', content: 'Lista de propriedades.'   },
  { value: 'examples',   label: 'Exemplos',     content: 'Exemplos de uso.'         },
];

export const Default: Story = {
  render: () => ({
    Component: TabsStory,
    props: {
      items: ITEMS,
      defaultValue: 'properties',
      ariaLabel: 'Seções do componente',
      class: 'nds-w-lg',
    },
  }),
  parameters: {
    docs: {
      source: { transform: tabsAbaInicialSource },
      description: {
        story:
          'Aba inativa: texto em tom apagado, sem fundo próprio e fora da ordem de tabulação. ' +
          'A ativa é a única que se anuncia selecionada e a única que recebe o foco pelo Tab.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const visaoGeral = canvas.getByRole('tab', { name: 'Visão geral' });
    const propriedades = canvas.getByRole('tab', { name: 'Propriedades' });

    await step('A aba escolhida na montagem é a ativa', async () => {
      await waitFor(() => expect(propriedades).toHaveAttribute('aria-selected', 'true'));
      await expect(visaoGeral).toHaveAttribute('aria-selected', 'false');
    });

    await step('A inativa fica fora da ordem de tabulação', async () => {
      // Roving tabindex: a fileira inteira é UMA parada de Tab, não três.
      await expect(propriedades).toHaveAttribute('tabindex', '0');
      await expect(visaoGeral).toHaveAttribute('tabindex', '-1');
    });

    await step('O painel visível é o da aba ativa', async () => {
      const painel = canvas.getByRole('tabpanel');
      await expect(painel).toHaveTextContent('Lista de propriedades');
      await expect(painel.getAttribute('aria-labelledby')).toBe(propriedades.id);
    });
  },
};

export const Active: Story = {
  render: () => ({
    Component: TabsStory,
    props: {
      items: ITEMS,
      defaultValue: 'overview',
      ariaLabel: 'Seções do componente',
      class: 'nds-w-lg',
    },
  }),
  parameters: {
    docs: {
      description: {
        story:
          'Aba ativa na variante default: fundo do próprio cartão, texto em contraste cheio e ' +
          'uma sombra suave que a levanta do trilho.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const visaoGeral = canvas.getByRole('tab', { name: 'Visão geral' });
    const exemplos = canvas.getByRole('tab', { name: 'Exemplos' });

    await step('A primeira aba está ativa', async () => {
      await waitFor(() => expect(visaoGeral).toHaveAttribute('aria-selected', 'true'));
      await expect(visaoGeral).toHaveAttribute('data-state', 'active');
    });

    await step('O destaque é de fundo, não só de cor de texto', async () => {
      await expect(getComputedStyle(visaoGeral).backgroundColor).not.toBe(
        getComputedStyle(exemplos).backgroundColor,
      );
    });

    await step('O painel ativo é o único visível e aponta para a aba', async () => {
      const painel = canvas.getByRole('tabpanel');
      await expect(painel).toHaveTextContent('Conteúdo da visão geral');
      await expect(visaoGeral.getAttribute('aria-controls')).toBe(painel.id);
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    Component: TabsStory,
    props: {
      items: [
        { value: 'overview',   label: 'Visão geral',  content: 'Conteúdo da visão geral.' },
        { value: 'properties', label: 'Propriedades', content: 'Lista de propriedades.', disabled: true },
        { value: 'examples',   label: 'Exemplos',     content: 'Exemplos de uso.'         },
      ],
      defaultValue: 'overview',
      ariaLabel: 'Seções do componente',
      class: 'nds-w-lg',
    },
  }),
  parameters: {
    covers: ['visual.item4', 'functional.item5', 'accessibility.item6'],
    docs: {
      source: { transform: tabsDesabilitadaSource },
      description: {
        story:
          'Aba desabilitada: aparece esmaecida e não responde ao clique, mas continua ' +
          'alcançável pela seta para que o leitor de tela a anuncie como indisponível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const visaoGeral = canvas.getByRole('tab', { name: 'Visão geral' });
    const propriedades = canvas.getByRole('tab', { name: 'Propriedades' });
    const exemplos = canvas.getByRole('tab', { name: 'Exemplos' });

    // Precondição de CADA passo, e não herança do anterior: o painel Interactions
    // reexecuta a play no mesmo DOM.
    const voltarAoInicio = async () => {
      if (visaoGeral.getAttribute('aria-selected') !== 'true') await userEvent.click(visaoGeral);
      await waitFor(() => expect(visaoGeral).toHaveAttribute('aria-selected', 'true'));
    };

    await step('Anuncia-se desabilitada sem sair do alcance do foco', async () => {
      await expect(propriedades).toHaveAttribute('aria-disabled', 'true');
      // O atributo nativo é justamente o que NÃO pode estar aqui: ele remove o
      // botão do alcance do foco, e a aba deixa de ser anunciada.
      await expect(propriedades).not.toBeDisabled();
      await expect(propriedades).toHaveAttribute('aria-selected', 'false');
    });

    await step('E se mostra desabilitada', async () => {
      await expect(Number(getComputedStyle(propriedades).opacity)).toBeLessThan(1);
      await expect(getComputedStyle(propriedades).pointerEvents).toBe('none');
    });

    await step('A seta ALCANÇA a aba desabilitada, e não a ativa', async () => {
      await voltarAoInicio();
      visaoGeral.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(propriedades).toHaveFocus());
      // Alcançar não é ativar: com ativação automática, focar uma aba habilitada
      // já trocaria o painel. Nesta, o painel tem de continuar o mesmo.
      await expect(propriedades).toHaveAttribute('aria-selected', 'false');
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Conteúdo da visão geral');
    });

    await step('Enter e Espaço com ela em foco não trocam o painel', async () => {
      await voltarAoInicio();
      propriedades.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      await expect(propriedades).toHaveAttribute('aria-selected', 'false');
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Conteúdo da visão geral');
    });

    await step('O clique também não', async () => {
      await voltarAoInicio();
      // `pointerEventsCheck: 0` é obrigatório: com `pointer-events: none` o
      // userEvent RECUSA o clique e o teste passaria sem exercitar nada.
      await userEvent.click(propriedades, { pointerEventsCheck: 0 });
      await expect(propriedades).toHaveAttribute('aria-selected', 'false');
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Conteúdo da visão geral');
    });

    await step('A seta segue adiante a partir dela', async () => {
      // Sem isto, a aba desabilitada viraria um beco sem saída para o teclado —
      // pior que a exclusão que o alcance veio corrigir.
      propriedades.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(exemplos).toHaveFocus());
      await voltarAoInicio();
    });
  },
};

export const FocusVisible: Story = {
  render: () => ({
    Component: TabsStory,
    props: {
      items: ITEMS,
      defaultValue: 'overview',
      ariaLabel: 'Seções do componente',
      class: 'nds-w-lg',
    },
  }),
  parameters: {
    covers: ['functional.item4', 'accessibility.item3'],
    docs: {
      description: {
        story:
          'Percurso do teclado: um Tab entra na fileira e para na aba ativa, com anel de foco ' +
          'visível; o Tab seguinte cai dentro do painel, sem passar pelas abas inativas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const doc = canvasElement.ownerDocument;
    const visaoGeral = canvas.getByRole('tab', { name: 'Visão geral' });
    const propriedades = canvas.getByRole('tab', { name: 'Propriedades' });

    await step('A fileira inteira é uma única parada de Tab', async () => {
      await expect(visaoGeral).toHaveAttribute('tabindex', '0');
      await expect(propriedades).toHaveAttribute('tabindex', '-1');
    });

    await step('A aba focada por teclado ganha anel visível', async () => {
      // O foco chega por Tab, não por `.focus()`: `:focus-visible` é estado de
      // foco por TECLADO, e o foco programático não o dispara — o anel ficaria
      // ausente e a asserção reprovaria um CSS que está certo.
      (doc.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(visaoGeral).toHaveFocus();
      await expect(getComputedStyle(visaoGeral).boxShadow).not.toBe('none');
    });

    await step('O Tab seguinte cai dentro do painel ativo', async () => {
      const painel = canvas.getByRole('tabpanel');
      await expect(painel).toHaveAttribute('tabindex', '0');
      await userEvent.tab();
      await expect(painel).toHaveFocus();
    });
  },
};
