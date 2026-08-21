import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, waitFor, expect } from 'storybook/test';
import {
  desviosDaCaixaDoTrilho,
  medirCrescimentoDoTrilho,
} from '@shared/testing/tabs-probe';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './index';
import { tabsLinhaSource, tabsPadraoSource, tabsVerticalSource } from './tabs.source';

const TRANSPARENTE = 'rgba(0, 0, 0, 0)';

const meta: Meta<any> = {
  title: 'UI/Tabs/Variants',
  component: Tabs,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: tabsPadraoSource },
      description: {
        component:
          'Variantes visuais do Tabs: Default (trilho com fundo próprio), Line (indicador em linha, sem trilho) e Vertical (lista em coluna à esquerda do painel).',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { Tabs, TabsList, TabsTrigger, TabsContent };

export const Default: Story = {
  render: () => ({
    components: sharedComponents,
    template: `
      <Tabs default-value="overview" class="nds-w-md">
        <TabsList aria-label="Seções do componente">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="properties">Propriedades</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Conteúdo da visão geral.
        </TabsContent>
        <TabsContent value="properties" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Lista de propriedades.
        </TabsContent>
        <TabsContent value="examples" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Exemplos de uso.
        </TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    covers: ['visual.item1', 'accessibility.item2'],
    docs: {
      description: {
        story: 'Variante default — trilho com fundo próprio e aba ativa destacada por fundo, não só por cor de texto. Indicada para a maioria dos contextos.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const lista = canvas.getByRole('tablist');
    const abas = canvas.getAllByRole('tab') as HTMLElement[];

    await step('Três abas, a primeira ativa desde a montagem', async () => {
      await expect(abas).toHaveLength(3);
      await expect(abas[0]).toHaveAttribute('aria-selected', 'true');
      await expect(canvas.getByRole('tab', { selected: true })).toHaveTextContent('Visão geral');
    });

    await step('A lista declara a variante default e desenha o trilho', async () => {
      await expect(lista).toHaveAttribute('data-variant', 'default');
      await expect(getComputedStyle(lista).backgroundColor).not.toBe(TRANSPARENTE);
    });

    await step('A aba ativa se distingue por fundo, não só por cor de texto', async () => {
      const fundoAtiva = getComputedStyle(abas[0]).backgroundColor;
      const fundoInativa = getComputedStyle(abas[1]).backgroundColor;
      await expect(fundoAtiva).not.toBe(fundoInativa);
      await expect(fundoAtiva).not.toBe(TRANSPARENTE);
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
  render: () => ({
    components: sharedComponents,
    template: `
      <Tabs default-value="overview" class="nds-w-md">
        <TabsList variant="line" aria-label="Seções do componente">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="properties">Propriedades</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Conteúdo da visão geral.
        </TabsContent>
        <TabsContent value="properties" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Lista de propriedades.
        </TabsContent>
        <TabsContent value="examples" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Exemplos de uso.
        </TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    covers: ['visual.item2'],
    docs: {
      // `variant="line"` mora na LISTA, não na raiz: o snippet do meta não tem
      // onde mostrar isso sem apagar a diferença.
      source: { transform: tabsLinhaSource },
      description: {
        story: 'Variante line — sem trilho, com uma linha sob a aba ativa. Útil para sub-navegação dentro de páginas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const lista = canvas.getByRole('tablist');
    const abas = canvas.getAllByRole('tab') as HTMLElement[];

    await step('A lista declara a variante line e dispensa o trilho', async () => {
      await expect(lista).toHaveAttribute('data-variant', 'line');
      await expect(getComputedStyle(lista).backgroundColor).toBe(TRANSPARENTE);
    });

    await step('O indicador é a linha da aba ativa e some nas inativas', async () => {
      await waitFor(() =>
        expect(getComputedStyle(abas[0], '::after').opacity).toBe('1'),
      );
      await expect(getComputedStyle(abas[1], '::after').opacity).toBe('0');
      await expect(getComputedStyle(abas[2], '::after').opacity).toBe('0');
    });
  },
};

export const Vertical: Story = {
  render: () => ({
    components: sharedComponents,
    template: `
      <Tabs default-value="profile" orientation="vertical" class="nds-w-lg">
        <TabsList aria-label="Configuracoes da conta">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" class="nds-text-body nds-text-muted-foreground nds-pl-4">
          Configuracoes do perfil — nome, foto e bio.
        </TabsContent>
        <TabsContent value="account" class="nds-text-body nds-text-muted-foreground nds-pl-4">
          Configuracoes da conta — e-mail, idioma e fuso.
        </TabsContent>
        <TabsContent value="security" class="nds-text-body nds-text-muted-foreground nds-pl-4">
          Configuracoes de segurança — senha e 2FA.
        </TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    covers: ['visual.item3'],
    docs: {
      // O eixo troca a largura da moldura e move o respiro do painel para o
      // lado: outra composição, não outro valor de prop.
      source: { transform: tabsVerticalSource },
      description: {
        story: 'Variante vertical — orientation="vertical" empilha as abas em coluna à esquerda e exibe o painel à direita. Setas ↑↓ navegam entre abas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const lista = canvas.getByRole('tablist');
    const raiz = lista.closest('[data-slot="tabs"]') as HTMLElement;
    const abas = canvas.getAllByRole('tab') as HTMLElement[];

    await step('Raiz e lista anunciam a orientação vertical', async () => {
      await expect(raiz).toHaveAttribute('data-orientation', 'vertical');
      await expect(lista).toHaveAttribute('aria-orientation', 'vertical');
    });

    await step('As abas ficam empilhadas na mesma coluna', async () => {
      const colunas = new Set(abas.map((aba) => Math.round(aba.getBoundingClientRect().left)));
      await expect(colunas.size).toBe(1);
    });

    await step('O painel fica ao lado da lista, não abaixo dela', async () => {
      const painel = canvas.getByRole('tabpanel').getBoundingClientRect();
      await expect(painel.left).toBeGreaterThanOrEqual(lista.getBoundingClientRect().right);
    });
  },
};
