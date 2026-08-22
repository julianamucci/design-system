import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  boxDoTrackDesvios,
  trackMeasureCrescimento,
} from '@shared/testing/tabs-probe';
import { createTabs, type TabsItemDef } from './tabs';
import { makePanel } from './tabs.fixtures';
import { tabsSource, tabsSourceWith } from './tabs.source';

const meta: Meta = {
  tags: ['navigation'],
  title: 'UI/Tabs/Variants',
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      source: { transform: tabsSource },
      description: {
        component:
          'As variantes saem das opções `variant` e `orientation` da factory: elas escrevem ' +
          '`data-variant` na lista e `data-orientation` na raiz, e o CSS do design system ' +
          'faz o resto. Nada de ajuste no DOM depois de criado — valor de design cravado ' +
          'inline escapa do tema e da densidade.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function items(): TabsItemDef[] {
  return [
    { value: 'overview',   label: 'Visão geral',  content: makePanel('Conteúdo da visão geral.') },
    { value: 'properties', label: 'Propriedades', content: makePanel('Lista de propriedades.') },
    { value: 'examples',   label: 'Exemplos',     content: makePanel('Exemplos de uso.') },
  ];
}

const TRANSPARENTE = 'rgba(0, 0, 0, 0)';

// ─── Default ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    covers: ['visual.item1', 'accessibility.item2'],
    docs: { description: { story: 'Padrão: as abas correm sobre um trilho, e a ativa ganha fundo próprio.' } },
  },
  render: () => {
    const root = createTabs({
      defaultValue: 'overview',
      class: 'nds-w-md',
      items: items(),
      'aria-label': 'Seções do componente',
    });
    return root;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const lista = canvas.getByRole('tablist');
    const abas = canvas.getAllByRole('tab');

    await expect(abas).toHaveLength(3);
    await expect(abas[0]).toHaveAttribute('aria-selected', 'true');
    await expect(lista).toHaveAttribute('data-variant', 'default');
    // Horizontal é o padrão implícito de `tablist`: escrever aria-orientation
    // aqui só repetiria o que o papel já diz.
    await expect(lista).not.toHaveAttribute('aria-orientation');
    // O trilho existe: a lista pinta fundo próprio.
    await expect(getComputedStyle(lista).backgroundColor).not.toBe(TRANSPARENTE);
    // A aba ativa se distingue por FUNDO, não só por cor de texto (WCAG 1.4.1).
    await expect(getComputedStyle(abas[0]).backgroundColor)
      .not.toBe(getComputedStyle(abas[1]).backgroundColor);

    await step('A caixa do trilho é resultado do respiro, não medida cravada', async () => {
      // Ler a altura UMA vez não distingue as duas coisas: respiro e `height`
      // cravada devolvem os mesmos 36px. Dobrar a fonte da raiz também não
      // bastava — `--size-lg` é declarado em `rem` e dobrava junto. O que
      // separa gaiola de resultado é EMPURRAR o conteúdo para além da caixa:
      // com altura cravada o trilho fica parado e o gatilho vaza para fora do
      // fundo arredondado. O colhedor devolve a fonte e o gatilho ao original.
      const m = trackMeasureCrescimento(canvasElement);
      await expect(boxDoTrackDesvios(m), JSON.stringify(m)).toEqual([]);
    });
  },
};

// ─── Line ─────────────────────────────────────────────────────────────────────

export const Line: Story = {
  parameters: {
    covers: ['visual.item2'],
    docs: {
      source: { transform: tabsSourceWith({ variant: 'line' }) },
      description: {
        story:
          'Variante line: sem trilho, o ativo é marcado por um traço fino desenhado em `::after`. ' +
          'Boa para sub-navegação dentro de uma página, onde o trilho competiria com os containers em volta.',
      },
    },
  },
  render: () => {
    const root = createTabs({
      defaultValue: 'overview',
      variant: 'line',
      class: 'nds-w-md',
      items: items(),
      'aria-label': 'Seções do componente',
    });
    return root;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const lista = canvas.getByRole('tablist');
    const [ativa, inativa] = canvas.getAllByRole('tab');

    await expect(lista).toHaveAttribute('data-variant', 'line');
    // O trilho some — é o que separa "line" de "default".
    await expect(getComputedStyle(lista).backgroundColor).toBe(TRANSPARENTE);
    await expect(getComputedStyle(ativa).backgroundColor).toBe(TRANSPARENTE);
    // O indicador é pseudo-elemento: procurar nó no DOM não acha nada. O que
    // distingue ativo de inativo é a opacidade do ::after.
    await waitFor(() => expect(getComputedStyle(ativa, '::after').opacity).toBe('1'));
    await expect(getComputedStyle(inativa, '::after').opacity).toBe('0');
  },
};

// ─── Vertical ─────────────────────────────────────────────────────────────────

export const Vertical: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: {
      source: { transform: tabsSourceWith({ orientation: 'vertical' }) },
      description: {
        story:
          'Orientação vertical: lista empilhada à esquerda, painel ao lado. ' +
          'A navegação por seta acompanha a direção — para cima e para baixo.',
      },
    },
  },
  render: () => {
    const root = createTabs({
      defaultValue: 'overview',
      orientation: 'vertical',
      class: 'nds-w-md',
      items: items(),
      'aria-label': 'Seções do componente',
    });
    return root;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const raiz = canvasElement.querySelector('[data-slot="tabs"]')!;
    const lista = canvas.getByRole('tablist');
    const abas = canvas.getAllByRole('tab');
    const painel = canvas.getByRole('tabpanel');

    await expect(raiz).toHaveAttribute('data-orientation', 'vertical');
    await expect(lista).toHaveAttribute('aria-orientation', 'vertical');
    // Empilhadas: todas começam na mesma coluna.
    const borders = new Set(abas.map((a) => Math.round(a.getBoundingClientRect().left)));
    await expect(borders.size).toBe(1);
    // O painel fica AO LADO da lista, não abaixo dela.
    await expect(painel.getBoundingClientRect().left)
      .toBeGreaterThanOrEqual(lista.getBoundingClientRect().right);

    // A seta segue a orientação. ArrowUp devolve o conjunto ao estado inicial,
    // para o replay da play começar de onde começou.
    abas[0].focus();
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(abas[1]).toHaveAttribute('aria-selected', 'true'));
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(abas[0]).toHaveAttribute('aria-selected', 'true'));
  },
};
