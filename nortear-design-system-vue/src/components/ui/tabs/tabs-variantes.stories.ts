import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect } from 'storybook/test';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './index';

const meta: Meta<any> = {
  title: 'UI/Tabs/Variantes',
  component: Tabs,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Variantes visuais do Tabs: Default (fundo muted + sombra), Line (linha inferior minimalista) e Vertical (orientação vertical com lista lateral).',
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
      <Tabs default-value="overview" class="nds-w-full nds-max-w-md">
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
    docs: {
      description: {
        story: 'Variante default — fundo muted arredondado e sombra suave na tab ativa. Indicada para a maioria dos contextos.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tablist = await canvas.findByRole('tablist');
    await expect(tablist).toHaveAttribute('aria-label', 'Seções do componente');
    const active = await canvas.findByRole('tab', { selected: true });
    await expect(active).toHaveTextContent('Visão geral');
  },
};

export const Line: Story = {
  render: () => ({
    components: sharedComponents,
    template: `
      <Tabs default-value="overview" class="nds-w-full nds-max-w-md">
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
    docs: {
      description: {
        story: 'Variante line — visual minimalista com linha inferior na tab ativa. Útil para sub-navegação dentro de páginas.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const Vertical: Story = {
  render: () => ({
    components: sharedComponents,
    template: `
      <Tabs default-value="profile" orientation="vertical" class="nds-w-full max-w-xl">
        <TabsList aria-label="Configuracoes da conta">
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="account">Conta</TabsTrigger>
          <TabsTrigger value="security">Segurança</TabsTrigger>
        </TabsList>
        <TabsContent value="profile" class="nds-text-body nds-text-muted-foreground" style="padding-left: 1rem">
          Configuracoes do perfil — nome, foto e bio.
        </TabsContent>
        <TabsContent value="account" class="nds-text-body nds-text-muted-foreground" style="padding-left: 1rem">
          Configuracoes da conta — e-mail, idioma e fuso.
        </TabsContent>
        <TabsContent value="security" class="nds-text-body nds-text-muted-foreground" style="padding-left: 1rem">
          Configuracoes de segurança — senha e 2FA.
        </TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Variante vertical — orientation="vertical" empilha as tabs em coluna à esquerda e exibe o conteúdo à direita. Setas ↑↓ navegam entre tabs.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};
