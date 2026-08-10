import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import { NDS_TABS } from './tabs';

const meta: Meta = {
  title: 'UI/Tabs/Variantes',
  tags: ['navigation'],
  decorators: [moduleMetadata({ imports: [...NDS_TABS] })],
  parameters: {
    layout: 'padded',
    // Sem `argTypes` nesta meta: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    docs: {
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

const lista = (el: HTMLElement): HTMLElement =>
  el.querySelector<HTMLElement>('[data-slot="tabs-list"]')!;

const raiz = (el: HTMLElement): HTMLElement =>
  el.querySelector<HTMLElement>('[data-slot="tabs"]')!;

export const Default: Story = {
  parameters: { covers: ['visual.item1', 'accessibility.item2'] },
  render: () => ({
    template: `
      <div ndsTabs class="nds-max-w-lg" defaultValue="overview">
        <div ndsTabsList aria-label="Seções do componente">
          <button ndsTabsTrigger value="overview">Visão geral</button>
          <button ndsTabsTrigger value="properties">Propriedades</button>
          <button ndsTabsTrigger value="examples">Exemplos</button>
        </div>
        <div ndsTabsContent value="overview" class="nds-text-body">Conteúdo da visão geral</div>
        <div ndsTabsContent value="properties" class="nds-text-body">Lista de propriedades</div>
        <div ndsTabsContent value="examples" class="nds-text-body">Exemplos de uso</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const l = lista(canvasElement);

    await step('A variante default é escrita no markup', async () => {
      // Afirmar o atributo resultante é o que impede o defeito silencioso do
      // fallback JIT: sob JIT os `input()` não são vistos e o componente
      // renderiza com os valores padrão, sem erro nenhum na tela.
      await expect(l.getAttribute('data-variant')).toBe('default');
      await expect(l.classList.contains('nds-tabs-list')).toBe(true);
    });

    await step('O trilho tem fundo próprio', async () => {
      // É o que distingue esta variante da `line`: fundo `muted` sob a fileira
      // inteira, com a aba ativa em relevo por cima.
      const fundo = getComputedStyle(l).backgroundColor;
      await expect(fundo).not.toBe('rgba(0, 0, 0, 0)');
      await expect(fundo).not.toBe('transparent');
    });

    await step('A aba ativa se destaca por fundo, não só por cor de texto', async () => {
      // Critério 1.4.1 na prática: o estado ativo não pode depender de matiz.
      const ativa = canvas.getByRole('tab', { name: 'Visão geral' });
      const inativa = canvas.getByRole('tab', { name: 'Exemplos' });
      await expect(getComputedStyle(ativa).backgroundColor).not.toBe(
        getComputedStyle(inativa).backgroundColor,
      );
    });
  },
};

export const Line: Story = {
  parameters: { covers: ['visual.item2'] },
  render: () => ({
    template: `
      <div ndsTabs class="nds-max-w-lg" defaultValue="overview">
        <div ndsTabsList variant="line" aria-label="Seções do componente">
          <button ndsTabsTrigger value="overview">Visão geral</button>
          <button ndsTabsTrigger value="properties">Propriedades</button>
          <button ndsTabsTrigger value="examples">Exemplos</button>
        </div>
        <div ndsTabsContent value="overview" class="nds-text-body">Conteúdo da visão geral</div>
        <div ndsTabsContent value="properties" class="nds-text-body">Lista de propriedades</div>
        <div ndsTabsContent value="examples" class="nds-text-body">Exemplos de uso</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const l = lista(canvasElement);

    await step('A variante line chega ao markup', async () => {
      await expect(l.getAttribute('data-variant')).toBe('line');
    });

    await step('O trilho desaparece', async () => {
      // O seletor do CSS é `[data-variant="line"]`: se o atributo não chegasse,
      // esta asserção pegaria o fundo `muted` da variante default.
      await expect(getComputedStyle(l).backgroundColor).toBe('rgba(0, 0, 0, 0)');
    });

    await step('A linha marca a aba ativa e some das inativas', async () => {
      // A linha é um `::after` com `opacity` — o único jeito de olhá-la é pelo
      // pseudo-elemento; procurar um nó no DOM não acharia nada.
      const ativa = canvas.getByRole('tab', { name: 'Visão geral' });
      const inativa = canvas.getByRole('tab', { name: 'Exemplos' });
      await expect(getComputedStyle(ativa, '::after').opacity).toBe('1');
      await expect(getComputedStyle(inativa, '::after').opacity).toBe('0');
    });
  },
};

export const Vertical: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    template: `
      <div ndsTabs class="nds-max-w-lg" orientation="vertical" defaultValue="profile">
        <div ndsTabsList aria-label="Configurações">
          <button ndsTabsTrigger value="profile">Perfil</button>
          <button ndsTabsTrigger value="account">Conta</button>
          <button ndsTabsTrigger value="security">Segurança</button>
        </div>
        <div ndsTabsContent value="profile" class="nds-text-body">Conteúdo da visão geral</div>
        <div ndsTabsContent value="account" class="nds-text-body">Lista de propriedades</div>
        <div ndsTabsContent value="security" class="nds-text-body">Exemplos de uso</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A orientação chega à raiz e ao tablist', async () => {
      await expect(raiz(canvasElement).getAttribute('data-orientation')).toBe('vertical');
      // `aria-orientation` só é escrito no caso vertical: no horizontal ele é o
      // padrão implícito do papel e repeti-lo é ruído.
      await expect(lista(canvasElement).getAttribute('aria-orientation')).toBe('vertical');
    });

    await step('As abas ficam empilhadas', async () => {
      const abas = canvas.getAllByRole('tab');
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
