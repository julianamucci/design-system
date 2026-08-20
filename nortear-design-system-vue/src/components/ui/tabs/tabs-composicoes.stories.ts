import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { within, userEvent, waitFor, expect } from 'storybook/test';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './index';
import { ativar } from './tabs.fixtures';
import { Badge } from '@/components/ui/badge';
import { Code2, Eye, Settings2, User, Shield } from 'lucide-vue-next';
import {
  tabsComContadorSource,
  tabsComIconesSource,
  tabsConfiguracoesVerticaisSource,
  tabsControladoSource,
  tabsModoManualSource,
} from './tabs.source';

const meta: Meta<any> = {
  title: 'UI/Tabs/Compositions',
  component: Tabs,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: tabsControladoSource },
      description: {
        component:
          'Composicoes reais de Tabs: controlado com analytics, com ícones, com contador, vertical para configurações e modo manual.',
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
      <div class="nds-stack nds-w-full nds-max-w-md" data-spacing="sm">
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
    covers: ['functional.item1'],
    docs: {
      description: {
        story: 'Tabs controladas — model-value + @update:model-value sincronizam o estado com a aplicação. Padrão para analytics, deep-linking e integração com router.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const propriedades = canvas.getByRole('tab', { name: 'Propriedades' });
    const visaoGeral = canvas.getByRole('tab', { name: 'Visão geral' });

    await step('Trocar para "Propriedades" ativa o painel e o estado externo', async () => {
      await ativar(propriedades);
      await expect(visaoGeral).toHaveAttribute('aria-selected', 'false');
      await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', propriedades.id);
      await expect(canvas.getByText('properties')).toBeInTheDocument();
    });

    await step('Voltar para "Visão geral" devolve o estado externo', async () => {
      await ativar(visaoGeral);
      await expect(canvas.getByText('overview')).toBeInTheDocument();
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
          Snippet copiável do componente.
        </TabsContent>
        <TabsContent value="settings" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Ajustes de tema, locale e variantes.
        </TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    covers: ['accessibility.item4'],
    docs: {
      // O gatilho deixa de ser uma linha de texto e passa a ter ícone dentro —
      // com ele, o import do conjunto de ícones e o `aria-hidden`.
      source: { transform: tabsComIconesSource },
      description: {
        story: 'Abas com ícone à esquerda do rótulo. O ícone é decorativo — o texto do gatilho já descreve a aba para leitores de tela.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Os três papéis do padrão estão presentes', async () => {
      await expect(canvas.getByRole('tablist')).toHaveAttribute('aria-label', 'Modos de visualização');
      await expect(canvas.getAllByRole('tab')).toHaveLength(3);
      await expect(canvas.getAllByRole('tabpanel')).toHaveLength(1);
    });

    await step('O nome acessível de cada aba é apenas o rótulo', async () => {
      await expect(canvas.getByRole('tab', { name: 'Preview' })).toHaveAttribute('aria-selected', 'true');
      await expect(canvas.getByRole('tab', { name: 'Código' })).toHaveAttribute('aria-selected', 'false');
      await expect(canvas.getByRole('tab', { name: 'Ajustes' })).toHaveAttribute('aria-selected', 'false');
    });

    await step('Os ícones são decorativos, desenham algo e não interceptam o clique', async () => {
      const icones = Array.from(canvasElement.querySelectorAll('[role="tab"] svg'));
      await expect(icones).toHaveLength(3);
      for (const icone of icones) {
        await expect(icone).toHaveAttribute('aria-hidden', 'true');
        await expect(icone.childElementCount).toBeGreaterThan(0);
        await expect(getComputedStyle(icone).pointerEvents).toBe('none');
      }
    });
  },
};

export const WithBadge: Story = {
  render: () => ({
    components: { ...sharedComponents, Badge },
    template: `
      <Tabs default-value="inbox" class="nds-w-full nds-max-w-md">
        <TabsList aria-label="Caixas de mensagem">
          <TabsTrigger value="inbox">
            Caixa de entrada
            <Badge as="span">12</Badge>
          </TabsTrigger>
          <TabsTrigger value="spam">
            Spam
            <Badge as="span" variant="destructive">3</Badge>
          </TabsTrigger>
          <TabsTrigger value="trash">Lixeira</TabsTrigger>
        </TabsList>
        <TabsContent value="inbox" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Mensagens recebidas.
        </TabsContent>
        <TabsContent value="spam" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Mensagens marcadas como spam.
        </TabsContent>
        <TabsContent value="trash" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Mensagens excluídas.
        </TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    covers: ['functional.item1'],
    docs: {
      // O contador entra DENTRO do gatilho e vira parte do nome acessível: é a
      // posição no markup que ensina isso, e o meta não a tem.
      source: { transform: tabsComContadorSource },
      description: {
        story: 'Aba com contador — o número entra no nome acessível do gatilho e não vira um segundo alvo de foco. Use para caixas de mensagem e listas com pendências.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const entrada = canvas.getByRole('tab', { name: 'Caixa de entrada 12' });
    const spam = canvas.getByRole('tab', { name: 'Spam 3' });

    await step('O contador entra no nome da aba sem criar outro alvo de foco', async () => {
      await expect(canvas.getAllByRole('tab')).toHaveLength(3);
      const contadores = Array.from(canvasElement.querySelectorAll('[role="tab"] [data-slot="badge"]'));
      await expect(contadores).toHaveLength(2);
      for (const contador of contadores) {
        await expect(contador.getAttribute('tabindex')).toBeNull();
        await expect(contador.getAttribute('role')).toBeNull();
      }
    });

    await step('Clicar na aba com contador ativa o painel correspondente', async () => {
      await ativar(spam);
      await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', spam.id);
      await ativar(entrada);
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Mensagens recebidas.');
    });
  },
};

export const VerticalSettings: Story = {
  render: () => ({
    components: { ...sharedComponents, User, Settings2, Shield },
    template: `
      <Tabs default-value="profile" orientation="vertical" class="nds-w-full nds-max-w-lg">
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
        <TabsContent value="profile" class="nds-text-body nds-pl-4">
          <h3 class="nds-font-medium nds-text-foreground">Perfil público</h3>
          <p class="nds-mt-1 nds-text-muted-foreground">Nome, foto e bio visíveis para outros usuários.</p>
        </TabsContent>
        <TabsContent value="account" class="nds-text-body nds-pl-4">
          <h3 class="nds-font-medium nds-text-foreground">Conta</h3>
          <p class="nds-mt-1 nds-text-muted-foreground">E-mail, idioma e preferências regionais.</p>
        </TabsContent>
        <TabsContent value="security" class="nds-text-body nds-pl-4">
          <h3 class="nds-font-medium nds-text-foreground">Segurança</h3>
          <p class="nds-mt-1 nds-text-muted-foreground">Senha, autenticação em dois fatores e sessões.</p>
        </TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    docs: {
      // Eixo vertical e painel com título próprio: a cor atenuada desce do
      // painel para o parágrafo, e o respiro passa a ser lateral.
      source: { transform: tabsConfiguracoesVerticaisSource },
      description: {
        story: 'Padrão clássico de tela de configurações — orientation="vertical" com lista lateral + conteúdo extenso à direita. ↑↓ navegam entre abas.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const lista = canvas.getByRole('tablist');
    const abas = canvas.getAllByRole('tab') as HTMLElement[];

    await step('A lista anuncia a orientação vertical', async () => {
      await expect(lista).toHaveAttribute('aria-orientation', 'vertical');
    });

    await step('ArrowDown move o foco e ativa a próxima aba', async () => {
      abas[0].focus();
      await userEvent.keyboard('{ArrowDown}');
      await waitFor(() => expect(abas[1]).toHaveAttribute('aria-selected', 'true'));
      await expect(abas[1]).toHaveFocus();
    });

    await step('Home devolve o conjunto ao estado inicial', async () => {
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(abas[0]).toHaveAttribute('aria-selected', 'true'));
      await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', abas[0].id);
    });
  },
};

export const ManualMode: Story = {
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
          activation-mode="manual": setas movem o foco mas não ativam a aba. Pressione Enter ou Space para ativar.
        </TabsContent>
        <TabsContent value="properties" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Indicado quando trocar de aba tem custo (fetch de dados, animação pesada).
        </TabsContent>
        <TabsContent value="examples" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Exemplos de uso.
        </TabsContent>
      </Tabs>
    `,
  }),
  // Sem `covers`: esta story demonstra o oposto de `functional.item2` (a seta
  // aqui NÃO ativa). Declarar o item seria cobertura fantasma.
  parameters: {
    docs: {
      // `activation-mode` é prop da raiz e não aparece na composição controlada
      // que o meta mostra.
      source: { transform: tabsModoManualSource },
      description: {
        story: 'Modo manual — setas movem apenas o foco; Enter/Space ativa a aba focada. Use quando trocar de painel tem custo (fetch, render pesado).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const visaoGeral = canvas.getByRole('tab', { name: 'Visão geral' });
    const propriedades = canvas.getByRole('tab', { name: 'Propriedades' });

    await step('Ponto de partida: primeira aba ativa', async () => {
      await ativar(visaoGeral);
    });

    await step('ArrowRight move o foco sem ativar', async () => {
      visaoGeral.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(propriedades).toHaveFocus());
      await expect(propriedades).toHaveAttribute('aria-selected', 'false');
      await expect(visaoGeral).toHaveAttribute('aria-selected', 'true');
    });

    await step('Enter ativa a aba focada', async () => {
      await userEvent.keyboard('{Enter}');
      await waitFor(() => expect(propriedades).toHaveAttribute('aria-selected', 'true'));
      await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', propriedades.id);
    });
  },
};
