import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './index';
import TabsDocs from '@/components/docs/TabsDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

const meta: Meta<any> = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs', 'navigation'],
  parameters: {
    docs: {
      page: withAutoDocsTab(TabsDocs),
      description: {
        component:
          'Tabs (reka-ui) alterna entre views paralelas do mesmo nível hierárquico. role="tablist" automático, navegação por setas/Home/End, variantes default/line e orientação horizontal/vertical. aria-label no TabsList é obrigatório.',
      },
    },
  },
  argTypes: {
    defaultValue: {
      control: 'text',
      description: 'Valor inicial da tab ativa (não-controlado).',
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description: 'Direção da navegação por setas e do layout.',
    },
    activationMode: {
      control: 'inline-radio',
      options: ['automatic', 'manual'],
      description: 'automatic: setas ativam imediatamente. manual: setas movem foco, Enter/Space ativa.',
    },
  },
  args: {
    defaultValue: 'overview',
    orientation: 'horizontal',
    activationMode: 'automatic',
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => ({
    components: { Tabs, TabsList, TabsTrigger, TabsContent },
    setup() { return { args }; },
    template: `
      <Tabs v-bind="args" class="w-full max-w-md">
        <TabsList aria-label="Seções do componente">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="properties">Propriedades</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" class="pt-3 text-sm text-muted-foreground">
          Conteúdo da visão geral — resumo do componente e principais conceitos.
        </TabsContent>
        <TabsContent value="properties" class="pt-3 text-sm text-muted-foreground">
          Lista de propriedades, tipos e valores padrão.
        </TabsContent>
        <TabsContent value="examples" class="pt-3 text-sm text-muted-foreground">
          Exemplos de uso e snippets prontos para copiar.
        </TabsContent>
      </Tabs>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');

    await step('Primeira tab começa ativa (defaultValue=overview)', async () => {
      await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    });

    await step('TabsList expõe role="tablist" com aria-label', async () => {
      const list = canvas.getByRole('tablist');
      await expect(list).toHaveAttribute('aria-label', 'Seções do componente');
    });

    await step('Clicar em uma tab ativa o painel correspondente', async () => {
      await userEvent.click(tabs[1]);
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      await expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    });

    await step('ArrowRight move para próxima tab (mode automatic)', async () => {
      tabs[1].focus();
      await userEvent.keyboard('{ArrowRight}');
      await expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    });

    await step('Home volta para a primeira tab', async () => {
      await userEvent.keyboard('{Home}');
      await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });
  },
};
