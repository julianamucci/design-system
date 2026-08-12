import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, waitFor, expect } from 'storybook/test';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './index';
import TabsDocs from '@/components/docs/TabsDocs.vue';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/**
 * Ativa uma aba de forma idempotente: só clica quando ela ainda não está ativa.
 * O painel Interactions reexecuta a play no mesmo DOM — clique cego inverteria
 * o estado a cada rodada.
 */
async function ativar(aba: HTMLElement) {
  if (aba.getAttribute('aria-selected') !== 'true') await userEvent.click(aba);
  await waitFor(() => expect(aba).toHaveAttribute('aria-selected', 'true'));
}

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
      <Tabs v-bind="args" class="nds-w-full nds-max-w-md">
        <TabsList aria-label="Seções do componente">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="properties">Propriedades</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Conteúdo da visão geral — resumo do componente e principais conceitos.
        </TabsContent>
        <TabsContent value="properties" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Lista de propriedades, tipos e valores padrão.
        </TabsContent>
        <TabsContent value="examples" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Exemplos de uso e snippets prontos para copiar.
        </TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
    ],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const lista = canvas.getByRole('tablist');
    const abas = canvas.getAllByRole('tab');
    const [visaoGeral, propriedades, exemplos] = abas as HTMLElement[];

    await step('Papéis ARIA: tablist rotulado, três tabs e um tabpanel visível', async () => {
      await expect(lista).toHaveAttribute('aria-label', 'Seções do componente');
      await expect(abas).toHaveLength(3);
      await expect(canvas.getAllByRole('tabpanel')).toHaveLength(1);
    });

    await step('aria-selected reflete a aba ativa na montagem', async () => {
      await expect(visaoGeral).toHaveAttribute('aria-selected', 'true');
      await expect(propriedades).toHaveAttribute('aria-selected', 'false');
      await expect(exemplos).toHaveAttribute('aria-selected', 'false');
    });

    await step('aria-controls e aria-labelledby casam nos dois sentidos', async () => {
      const painel = canvas.getByRole('tabpanel');
      await expect(visaoGeral).toHaveAttribute('aria-controls', painel.id);
      await expect(painel).toHaveAttribute('aria-labelledby', visaoGeral.id);
    });

    await step('Clicar em uma aba ativa o painel correspondente', async () => {
      await ativar(propriedades);
      await expect(visaoGeral).toHaveAttribute('aria-selected', 'false');
      const painel = canvas.getByRole('tabpanel');
      await expect(painel).toHaveAttribute('aria-labelledby', propriedades.id);
      await expect(painel).toHaveTextContent('Lista de propriedades');
    });

    await step('Roving tabindex: só a aba ativa entra na ordem de tabulação', async () => {
      await expect(propriedades).toHaveAttribute('tabindex', '0');
      await expect(visaoGeral).toHaveAttribute('tabindex', '-1');
      await expect(exemplos).toHaveAttribute('tabindex', '-1');
    });

    await step('ArrowRight move o foco e ativa a próxima aba', async () => {
      visaoGeral.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(propriedades).toHaveFocus());
      await expect(propriedades).toHaveAttribute('aria-selected', 'true');
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Lista de propriedades');
    });

    await step('End vai à última aba e Home volta à primeira', async () => {
      await userEvent.keyboard('{End}');
      await waitFor(() => expect(exemplos).toHaveAttribute('aria-selected', 'true'));
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(visaoGeral).toHaveAttribute('aria-selected', 'true'));
      await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', visaoGeral.id);
    });
  },
};
