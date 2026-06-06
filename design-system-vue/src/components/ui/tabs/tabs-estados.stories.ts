import type { Meta, StoryObj } from '@storybook/vue3';
import { userEvent, within, expect } from 'storybook/test';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './index';

const meta: Meta<any> = {
  title: 'UI/Tabs/Estados',
  component: Tabs,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados visuais e interativos do Tabs: Default, Active, Hover, Focus e Disabled.',
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
      <Tabs default-value="overview" class="w-full max-w-md">
        <TabsList aria-label="Seções do componente">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="properties">Propriedades</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" class="pt-3 text-sm text-muted-foreground">
          Primeira tab ativa por padrão; demais inativas.
        </TabsContent>
        <TabsContent value="properties" class="pt-3 text-sm text-muted-foreground">—</TabsContent>
        <TabsContent value="examples" class="pt-3 text-sm text-muted-foreground">—</TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Estado padrão — primeira tab ativa, demais inativas (texto foreground/60, sem fundo).',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');
    await step('Apenas a primeira tab tem aria-selected=true', async () => {
      await expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
      await expect(tabs[2]).toHaveAttribute('aria-selected', 'false');
    });
  },
};

export const Active: Story = {
  render: () => ({
    components: sharedComponents,
    template: `
      <Tabs default-value="properties" class="w-full max-w-md">
        <TabsList aria-label="Seções do componente">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="properties">Propriedades</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" class="pt-3 text-sm text-muted-foreground">—</TabsContent>
        <TabsContent value="properties" class="pt-3 text-sm text-muted-foreground">
          Tab "Propriedades" ativa — data-active, fundo background, sombra suave.
        </TabsContent>
        <TabsContent value="examples" class="pt-3 text-sm text-muted-foreground">—</TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Estado active — data-active, fundo background, texto foreground e sombra suave na variant default.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');
    await step('Tab "Propriedades" tem aria-selected=true', async () => {
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });
  },
};

export const Focus: Story = {
  render: () => ({
    components: sharedComponents,
    template: `
      <Tabs default-value="overview" class="w-full max-w-md">
        <TabsList aria-label="Seções do componente">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="properties">Propriedades</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" class="pt-3 text-sm text-muted-foreground">
          Navegue com Tab para ver o focus ring ring-[3px] ring-ring/50.
        </TabsContent>
        <TabsContent value="properties" class="pt-3 text-sm text-muted-foreground">—</TabsContent>
        <TabsContent value="examples" class="pt-3 text-sm text-muted-foreground">—</TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Estado focus — anel ring-[3px] ring-ring/50 visível ao navegar por teclado. Roving tabindex: apenas a tab ativa é focável via Tab; setas movem entre tabs.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');

    await step('Tab ativa recebe foco via Tab key', async () => {
      tabs[0].focus();
      await expect(tabs[0]).toHaveFocus();
    });

    await step('ArrowRight move foco e ativa próxima tab (automatic)', async () => {
      await userEvent.keyboard('{ArrowRight}');
      await expect(tabs[1]).toHaveFocus();
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
    });

    await step('End vai para a última tab', async () => {
      await userEvent.keyboard('{End}');
      await expect(tabs[2]).toHaveAttribute('aria-selected', 'true');
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    components: sharedComponents,
    template: `
      <Tabs default-value="overview" class="w-full max-w-md">
        <TabsList aria-label="Seções do componente">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="properties" :disabled="true">Propriedades</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" class="pt-3 text-sm text-muted-foreground">
          A tab "Propriedades" está desabilitada (opacity-50 e pointer-events-none).
        </TabsContent>
        <TabsContent value="properties" class="pt-3 text-sm text-muted-foreground">—</TabsContent>
        <TabsContent value="examples" class="pt-3 text-sm text-muted-foreground">Exemplos.</TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Tab disabled — opacity-50 e pointer-events-none. Use para seções temporariamente indisponíveis.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const tabs = canvas.getAllByRole('tab');

    await step('Segunda tab está desabilitada', async () => {
      await expect(tabs[1]).toBeDisabled();
    });

    await step('Clicar na disabled não ativa a tab', async () => {
      await userEvent.click(tabs[1], { pointerEventsCheck: 0 });
      await expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    });
  },
};
