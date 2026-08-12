import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, waitFor, expect } from 'storybook/test';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './index';

const meta: Meta<any> = {
  title: 'UI/Tabs/States',
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
      <Tabs default-value="overview" class="nds-w-full nds-max-w-md">
        <TabsList aria-label="Seções do componente">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="properties">Propriedades</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Primeira tab ativa por padrão; demais inativas.
        </TabsContent>
        <TabsContent value="properties" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">—</TabsContent>
        <TabsContent value="examples" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">—</TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Estado padrão — primeira aba ativa, demais inativas: texto atenuado e sem fundo próprio.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = canvas.getAllByRole('tab') as HTMLElement[];

    await step('Apenas a primeira aba está ativa', async () => {
      await expect(abas[0]).toHaveAttribute('aria-selected', 'true');
      await expect(abas[1]).toHaveAttribute('aria-selected', 'false');
      await expect(abas[2]).toHaveAttribute('aria-selected', 'false');
    });

    await step('Só o painel da aba ativa fica exposto', async () => {
      await expect(canvas.getAllByRole('tabpanel')).toHaveLength(1);
      await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', abas[0].id);
    });
  },
};

export const Active: Story = {
  render: () => ({
    components: sharedComponents,
    template: `
      <Tabs default-value="properties" class="nds-w-full nds-max-w-md">
        <TabsList aria-label="Seções do componente">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="properties">Propriedades</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">—</TabsContent>
        <TabsContent value="properties" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Aba "Propriedades" ativa — fundo próprio, texto em contraste cheio e sombra suave.
        </TabsContent>
        <TabsContent value="examples" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">—</TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'Estado ativo — a aba selecionada ganha fundo próprio, texto em contraste cheio e sombra suave na variante default.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = canvas.getAllByRole('tab') as HTMLElement[];

    await step('A aba indicada por defaultValue começa ativa', async () => {
      await expect(abas[1]).toHaveAttribute('aria-selected', 'true');
      await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', abas[1].id);
    });

    await step('O destaque da ativa é de fundo, não só de cor de texto', async () => {
      await expect(getComputedStyle(abas[1]).backgroundColor)
        .not.toBe(getComputedStyle(abas[0]).backgroundColor);
    });
  },
};

export const Focus: Story = {
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
          Navegue com Tab para ver o anel de foco; o Tab seguinte entra neste painel.
        </TabsContent>
        <TabsContent value="properties" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">—</TabsContent>
        <TabsContent value="examples" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">—</TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    covers: ['functional.item4', 'accessibility.item3'],
    docs: {
      description: {
        story: 'Estado de foco — anel visível ao navegar por teclado. A lista usa roving tabindex: um único Tab entra no conjunto de abas, e o Tab seguinte alcança o painel ativo.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = canvas.getAllByRole('tab') as HTMLElement[];
    const [visaoGeral, propriedades, exemplos] = abas;

    // A play é reexecutada no mesmo DOM: o foco precisa partir de fora sempre.
    (document.activeElement as HTMLElement | null)?.blur();

    await step('Um Tab entra no conjunto de abas e pousa na ativa', async () => {
      await userEvent.tab();
      await waitFor(() => expect(visaoGeral).toHaveFocus());
      await expect(getComputedStyle(visaoGeral).boxShadow).not.toBe('none');
    });

    await step('Roving tabindex: só a aba ativa é alcançável por Tab', async () => {
      await expect(visaoGeral).toHaveAttribute('tabindex', '0');
      await expect(propriedades).toHaveAttribute('tabindex', '-1');
      await expect(exemplos).toHaveAttribute('tabindex', '-1');
    });

    await step('O Tab seguinte move o foco para o painel ativo', async () => {
      const painel = canvas.getByRole('tabpanel');
      await expect(painel).toHaveAttribute('tabindex', '0');
      await userEvent.tab();
      await waitFor(() => expect(painel).toHaveFocus());
    });
  },
};

export const Disabled: Story = {
  render: () => ({
    components: sharedComponents,
    template: `
      <Tabs default-value="overview" class="nds-w-full nds-max-w-md">
        <TabsList aria-label="Seções do componente">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="properties" :disabled="true">Propriedades</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          A aba "Propriedades" está desabilitada: esmaecida e fora do alcance do ponteiro.
        </TabsContent>
        <TabsContent value="properties" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">—</TabsContent>
        <TabsContent value="examples" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">Exemplos.</TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    covers: ['visual.item4'],
    docs: {
      description: {
        story: 'Aba desabilitada — esmaecida e fora do alcance do ponteiro. Use para seções temporariamente indisponíveis.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = canvas.getAllByRole('tab') as HTMLElement[];
    const desabilitada = abas[1];

    await step('A segunda aba se anuncia desabilitada', async () => {
      await expect(desabilitada).toBeDisabled();
      await expect(desabilitada).toHaveAttribute('data-disabled');
    });

    await step('E aparece esmaecida e inerte ao ponteiro', async () => {
      await expect(Number(getComputedStyle(desabilitada).opacity)).toBeLessThan(1);
      await expect(getComputedStyle(desabilitada).pointerEvents).toBe('none');
    });

    await step('Clicar nela não ativa a aba nem troca o painel', async () => {
      await userEvent.click(desabilitada, { pointerEventsCheck: 0 });
      await expect(desabilitada).toHaveAttribute('aria-selected', 'false');
      await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', abas[0].id);
    });
  },
};
