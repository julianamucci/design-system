import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, expect } from 'storybook/test';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './index';
import { Code2, Eye, Settings2, User, Shield } from 'lucide-vue-next';

const meta: Meta<any> = {
  title: 'UI/Tabs/Compositions',
  component: Tabs,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes reais de Tabs: controlado com analytics, com ícones, vertical para configurações e modo manual.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = { Tabs, TabsList, TabsTrigger, TabsContent };

export const Controlled: Story = {
  render: () => ({
    components: sharedComponents,
    setup() {
      const value = ref<string>('overview');
      return { value };
    },
    template: `
      <div class="nds-w-full nds-max-w-md" data-spacing="sm">
        <p class="nds-text-caption nds-text-muted-foreground">
          Tab ativa: <code>{{ value }}</code>
        </p>
        <Tabs
          :model-value="value"
          @update:model-value="value = String($event)"
          class="nds-w-full"
        >
          <TabsList aria-label="Seções do componente">
            <TabsTrigger value="overview">Visão geral</TabsTrigger>
            <TabsTrigger value="properties">Propriedades</TabsTrigger>
            <TabsTrigger value="examples">Exemplos</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
            Estado gerenciado externamente via model-value + @update:model-value.
          </TabsContent>
          <TabsContent value="properties" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
            Útil para sincronizar com URL, query string ou outro componente.
          </TabsContent>
          <TabsContent value="examples" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
            Permite disparar analytics no @update:model-value.
          </TabsContent>
        </Tabs>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Tabs controladas — model-value + @update:model-value sincronizam o estado com a aplicação. Padrão para analytics, deep-linking e integração com router.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');

    await step('Trocar para "Propriedades" atualiza o estado externo', async () => {
      await userEvent.click(tabs[1]);
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      const indicator = canvas.getByText('properties');
      await expect(indicator).toBeInTheDocument();
    });
  },
};

export const WithIcons: Story = {
  render: () => ({
    components: { ...sharedComponents, Code2, Eye, Settings2 },
    template: `
      <Tabs default-value="preview" class="nds-w-full nds-max-w-md">
        <TabsList variant="line" aria-label="Modos de visualização">
          <TabsTrigger value="preview">
            <Eye class="nds-size-4" aria-hidden="true" />
            Preview
          </TabsTrigger>
          <TabsTrigger value="code">
            <Code2 class="nds-size-4" aria-hidden="true" />
            Código
          </TabsTrigger>
          <TabsTrigger value="settings">
            <Settings2 class="nds-size-4" aria-hidden="true" />
            Ajustes
          </TabsTrigger>
        </TabsList>
        <TabsContent value="preview" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Visualização renderizada do componente.
        </TabsContent>
        <TabsContent value="code" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Snippet copiável em React/Vue/Svelte.
        </TabsContent>
        <TabsContent value="settings" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Ajustes de tema, locale e variantes.
        </TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Tabs com ícone à esquerda do label. Ícones têm aria-hidden="true" — o texto do trigger já descreve a tab para leitores de tela.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.firstElementChild).toBeTruthy();
  },
};

export const VerticalSettings: Story = {
  render: () => ({
    components: { ...sharedComponents, User, Settings2, Shield },
    template: `
      <Tabs default-value="profile" orientation="vertical" class="nds-w-full max-w-2xl">
        <TabsList aria-label="Configuracoes da conta">
          <TabsTrigger value="profile">
            <User class="nds-size-4" aria-hidden="true" />
            Perfil
          </TabsTrigger>
          <TabsTrigger value="account">
            <Settings2 class="nds-size-4" aria-hidden="true" />
            Conta
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield class="nds-size-4" aria-hidden="true" />
            Segurança
          </TabsTrigger>
        </TabsList>
        <TabsContent value="profile" class="nds-text-body" style="padding-left: 1rem">
          <h3 class="nds-font-medium nds-text-foreground">Perfil público</h3>
          <p class="nds-mt-1 nds-text-muted-foreground">Nome, foto e bio visíveis para outros usuários.</p>
        </TabsContent>
        <TabsContent value="account" class="nds-text-body" style="padding-left: 1rem">
          <h3 class="nds-font-medium nds-text-foreground">Conta</h3>
          <p class="nds-mt-1 nds-text-muted-foreground">E-mail, idioma e preferências regionais.</p>
        </TabsContent>
        <TabsContent value="security" class="nds-text-body" style="padding-left: 1rem">
          <h3 class="nds-font-medium nds-text-foreground">Segurança</h3>
          <p class="nds-mt-1 nds-text-muted-foreground">Senha, autenticação em dois fatores e sessões.</p>
        </TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Padrão clássico de tela de configurações — orientation="vertical" com lista lateral + conteúdo extenso à direita. ↑↓ navegam entre tabs.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const list = canvas.getByRole('tablist');

    await step('TabsList tem aria-orientation=vertical', async () => {
      await expect(list).toHaveAttribute('aria-orientation', 'vertical');
    });

    await step('ArrowDown move para a próxima tab', async () => {
      const tabs = canvas.getAllByRole('tab');
      tabs[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });
  },
};

export const ModoManual: Story = {
  render: () => ({
    components: sharedComponents,
    template: `
      <Tabs default-value="overview" activation-mode="manual" class="nds-w-full nds-max-w-md">
        <TabsList aria-label="Seções do componente">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="properties">Propriedades</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          activation-mode="manual": setas movem o foco mas não ativam a tab. Pressione Enter ou Space para ativar.
        </TabsContent>
        <TabsContent value="properties" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Indicado quando trocar de tab tem custo (fetch de dados, animação pesada).
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
        story: 'Modo manual — setas movem apenas o foco; Enter/Space ativa a tab focada. Use quando trocar de painel tem custo (fetch, render pesado).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');

    await step('ArrowRight move o foco sem ativar (mode manual)', async () => {
      tabs[0].focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(tabs[1]).toHaveFocus();
      await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    });

    await step('Enter ativa a tab focada', async () => {
      await userEvent.keyboard('{Enter}');
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });
  },
};
