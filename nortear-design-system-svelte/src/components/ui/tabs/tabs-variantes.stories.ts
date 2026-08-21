import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, waitFor } from 'storybook/test';
import {
  desviosDaCaixaDoTrilho,
  medirCrescimentoDoTrilho,
} from '@shared/testing/tabs-probe';
import TabsStory from './TabsStory.svelte';
import { tabsLineSource, tabsSource, tabsVerticalSource } from './tabs.source';

const meta: Meta = {
  title: 'UI/Tabs/Variants',
  component: TabsStory,
  tags: ['navigation'],
  parameters: {
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; Line e Vertical sobrescrevem
      // com a própria composição, e Default fica com a forma canônica.
      source: { transform: tabsSource },
      description: {
        component:
          'Estilo da lista (`variant`) e direção (`orientation`). A variante decide se há ' +
          'trilho com fundo ou apenas uma linha sob a aba ativa; a orientação decide o layout ' +
          'e quais setas navegam.',
      },
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

const lista = (el: HTMLElement): HTMLElement =>
  el.querySelector<HTMLElement>('[data-slot="tabs-list"]')!;

const raiz = (el: HTMLElement): HTMLElement =>
  el.querySelector<HTMLElement>('[data-slot="tabs"]')!;

export const Default: Story = {
  parameters: {
    covers: ['visual.item1', 'accessibility.item2'],
    docs: {
      description: {
        story:
          'Variante default: trilho com fundo próprio e a aba ativa em relevo por cima. ' +
          'Use em painéis de configuração e abas de conteúdo.',
      },
    },
  },
  render: () => ({
    Component: TabsStory,
    props: {
      items: ITEMS,
      defaultValue: 'overview',
      variant: 'default',
      ariaLabel: 'Seções do componente',
      class: 'nds-w-lg',
    },
  }),
  // Sem interação de propósito: esta é a story que registra o estado de
  // montagem (três abas, a primeira ativa) para a regressão visual. Uma play
  // que clicasse terminaria em outra aba e o retrato sairia de outro estado.
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const l = lista(canvasElement);

    await step('A variante default chega ao markup', async () => {
      // O seletor do CSS é `[data-variant="…"]`: afirmar o atributo resultante é
      // o que impede a variante de deixar de pintar em silêncio.
      await waitFor(() => expect(l).toHaveAttribute('data-variant', 'default'));
      await expect(l).toHaveClass('nds-tabs-list');
    });

    await step('Três abas, e a primeira já vem ativa', async () => {
      await expect(canvas.getAllByRole('tab')).toHaveLength(3);
      await expect(canvas.getByRole('tab', { name: 'Visão geral' })).toHaveAttribute(
        'aria-selected',
        'true',
      );
    });

    await step('O trilho tem fundo próprio', async () => {
      // É o que distingue esta variante da `line`: fundo sob a fileira inteira.
      const fundo = getComputedStyle(l).backgroundColor;
      await expect(fundo).not.toBe('rgba(0, 0, 0, 0)');
      await expect(fundo).not.toBe('transparent');
    });

    await step('A aba ativa se distingue por fundo, não só por cor de texto', async () => {
      // Critério 1.4.1 na prática: o estado ativo não pode depender de matiz.
      const ativa = canvas.getByRole('tab', { name: 'Visão geral' });
      const inativa = canvas.getByRole('tab', { name: 'Exemplos' });
      await expect(getComputedStyle(ativa).backgroundColor).not.toBe(
        getComputedStyle(inativa).backgroundColor,
      );
    });

    await step('A caixa do trilho é resultado do respiro, não medida cravada', async () => {
      // Ler a altura UMA vez não distingue as duas coisas: respiro e `height`
      // cravada devolvem os mesmos 36px. Dobrar a fonte da raiz também não
      // bastava — `--size-lg` é declarado em `rem` e dobrava junto. O que
      // separa gaiola de resultado é EMPURRAR o conteúdo para além da caixa:
      // com altura cravada o trilho fica parado e o gatilho vaza para fora do
      // fundo arredondado. O colhedor devolve a fonte e o gatilho ao original.
      const m = medirCrescimentoDoTrilho(canvasElement);
      await expect(desviosDaCaixaDoTrilho(m), JSON.stringify(m)).toEqual([]);
    });
  },
};

export const Line: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      source: { transform: tabsLineSource },
      description: {
        story:
          'Variante line: sem trilho, com uma linha sob a aba ativa. Útil para sub-navegação ' +
          'dentro de páginas.',
      },
    },
  },
  render: () => ({
    Component: TabsStory,
    props: {
      items: ITEMS,
      defaultValue: 'overview',
      variant: 'line',
      ariaLabel: 'Seções do componente',
      class: 'nds-w-lg',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const l = lista(canvasElement);
    const ativa = canvas.getByRole('tab', { name: 'Visão geral' });
    const inativa = canvas.getByRole('tab', { name: 'Exemplos' });

    await step('A variante line chega ao markup', async () => {
      await waitFor(() => expect(l).toHaveAttribute('data-variant', 'line'));
      await expect(ativa).toHaveAttribute('aria-selected', 'true');
    });

    await step('O trilho desaparece', async () => {
      // Se o atributo não chegasse, esta asserção pegaria o fundo da variante
      // default em vez do transparente.
      await expect(getComputedStyle(l).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    await step('A linha marca a aba ativa e some das inativas', async () => {
      // A linha é um `::after` com `opacity` — o único jeito de olhá-la é pelo
      // pseudo-elemento; procurar um nó no DOM não acharia nada. O `waitFor`
      // existe porque a opacidade tem transição.
      await waitFor(() => expect(getComputedStyle(ativa, '::after').opacity).toBe('1'));
      await expect(getComputedStyle(inativa, '::after').opacity).toBe('0');
    });
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: { transform: tabsVerticalSource },
      description: {
        story:
          'Orientação vertical: lista à esquerda e conteúdo à direita. As setas de cima e de ' +
          'baixo passam a ser as teclas de navegação.',
      },
    },
  },
  render: () => ({
    Component: TabsStory,
    props: {
      items: ITEMS,
      defaultValue: 'overview',
      variant: 'default',
      orientation: 'vertical',
      ariaLabel: 'Seções do componente',
      class: 'nds-w-lg',
    },
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A orientação chega à raiz e ao tablist', async () => {
      await waitFor(() =>
        expect(raiz(canvasElement)).toHaveAttribute('data-orientation', 'vertical'),
      );
      await expect(lista(canvasElement)).toHaveAttribute('aria-orientation', 'vertical');
    });

    await step('As abas ficam empilhadas', async () => {
      const abas = canvas.getAllByRole('tab');
      await expect(abas).toHaveLength(3);
      const esquerdas = new Set(abas.map((a) => Math.round(a.getBoundingClientRect().left)));
      await expect(esquerdas.size).toBe(1);
    });

    await step('O painel fica ao lado da lista, não abaixo', async () => {
      const l = lista(canvasElement).getBoundingClientRect();
      const painel = canvas.getByRole('tabpanel').getBoundingClientRect();
      await expect(painel.left).toBeGreaterThanOrEqual(l.right);
    });
  },
};
