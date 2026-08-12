import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import TabsStory from './TabsStory.svelte';

const meta: Meta = {
  title: 'UI/Tabs/States',
  component: TabsStory,
  tags: ['navigation'],
  parameters: {
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
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
      class: 'nds-w-full nds-max-w-lg',
    },
  }),
  parameters: {
    docs: {
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
      class: 'nds-w-full nds-max-w-lg',
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
      class: 'nds-w-full nds-max-w-lg',
    },
  }),
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story:
          'Aba desabilitada: aparece esmaecida, não responde ao clique e a navegação por setas ' +
          'passa direto por ela.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const visaoGeral = canvas.getByRole('tab', { name: 'Visão geral' });
    const propriedades = canvas.getByRole('tab', { name: 'Propriedades' });
    const exemplos = canvas.getByRole('tab', { name: 'Exemplos' });

    await step('A aba se anuncia desabilitada', async () => {
      // Esta stack emite o `disabled` nativo do botão junto do `data-disabled`
      // que o CSS e a navegação por setas leem. Assere o que a stack REALMENTE
      // escreve — presumir `aria-disabled` daria verde sobre atributo ausente.
      await expect(propriedades).toBeDisabled();
      await expect(propriedades).toHaveAttribute('data-disabled');
    });

    await step('E se mostra desabilitada', async () => {
      await expect(Number(getComputedStyle(propriedades).opacity)).toBeLessThan(1);
      await expect(getComputedStyle(propriedades).pointerEvents).toBe('none');
    });

    await step('O clique não a ativa', async () => {
      // `pointerEventsCheck: 0` é obrigatório: com `pointer-events: none` o
      // userEvent RECUSA o clique e o teste passaria sem exercitar nada.
      await userEvent.click(propriedades, { pointerEventsCheck: 0 });
      await expect(propriedades).toHaveAttribute('aria-selected', 'false');
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Conteúdo da visão geral');
    });

    await step('A seta pula a aba desabilitada', async () => {
      visaoGeral.focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(exemplos).toHaveFocus();
      await waitFor(() => expect(exemplos).toHaveAttribute('aria-selected', 'true'));
    });

    await step('Home devolve o estado inicial', async () => {
      // Fecha o ciclo: a rodada seguinte do painel Interactions começa onde esta
      // começou.
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(visaoGeral).toHaveAttribute('aria-selected', 'true'));
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
      class: 'nds-w-full nds-max-w-lg',
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
