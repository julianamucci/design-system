import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, waitFor, expect } from 'storybook/test';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './index';
import {
  tabsAbaAtivaSource,
  tabsAbaDesabilitadaSource,
  tabsPadraoSource,
} from './tabs.source';

const meta: Meta<any> = {
  title: 'UI/Tabs/States',
  component: Tabs,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Foco e hover não se escrevem: o conjunto canônico serve para as stories
      // cujo assunto é um estado que o navegador produz.
      source: { transform: tabsPadraoSource },
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
      <Tabs default-value="overview" class="nds-w-cap-md">
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
      <Tabs default-value="properties" class="nds-w-cap-md">
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
      // Quem nasce ativa é outra aba, e é `default-value` que decide — a do meta
      // parte da primeira e esconderia justamente a prop em questão.
      source: { transform: tabsAbaAtivaSource },
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
      <Tabs default-value="overview" class="nds-w-cap-md">
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
      <Tabs default-value="overview" class="nds-w-cap-md">
        <TabsList aria-label="Seções do componente">
          <TabsTrigger value="overview">Visão geral</TabsTrigger>
          <TabsTrigger value="properties" :disabled="true">Propriedades</TabsTrigger>
          <TabsTrigger value="examples">Exemplos</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">
          Conteúdo da visão geral.
        </TabsContent>
        <TabsContent value="properties" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">—</TabsContent>
        <TabsContent value="examples" class="nds-text-body nds-text-muted-foreground" style="padding-top: 0.75rem">Exemplos.</TabsContent>
      </Tabs>
    `,
  }),
  parameters: {
    covers: ['visual.item4', 'functional.item5', 'accessibility.item6'],
    docs: {
      // `disabled` é prop de UMA aba, não do conjunto: o snippet precisa mostrar
      // em qual gatilho ela entra.
      source: { transform: tabsAbaDesabilitadaSource },
      description: {
        story:
          'Aba desabilitada — esmaecida e fora do alcance do ponteiro, mas ainda alcançável '
          + 'pela seta para que o leitor de tela a anuncie como indisponível.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = canvas.getAllByRole('tab') as HTMLElement[];
    const [primeira, desabilitada, ultima] = abas;

    // Precondição de CADA passo, e não herança do anterior: o painel Interactions
    // reexecuta a play no mesmo DOM.
    const voltarAoInicio = async () => {
      if (primeira.getAttribute('aria-selected') !== 'true') await userEvent.click(primeira);
      await waitFor(() => expect(primeira).toHaveAttribute('aria-selected', 'true'));
    };

    await step('Anuncia-se desabilitada sem sair do alcance do foco', async () => {
      await expect(desabilitada).toHaveAttribute('aria-disabled', 'true');
      // O atributo nativo é justamente o que NÃO pode estar aqui: ele remove o
      // botão do alcance do foco, e a aba deixa de ser anunciada.
      await expect(desabilitada).not.toBeDisabled();
      await expect(desabilitada).toHaveAttribute('aria-selected', 'false');
    });

    await step('E aparece esmaecida e inerte ao ponteiro', async () => {
      await expect(Number(getComputedStyle(desabilitada).opacity)).toBeLessThan(1);
      await expect(getComputedStyle(desabilitada).pointerEvents).toBe('none');
    });

    await step('A seta ALCANÇA a aba desabilitada, e não a ativa', async () => {
      await voltarAoInicio();
      primeira.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(desabilitada).toHaveFocus());
      // Alcançar não é ativar: com ativação automática, focar uma aba habilitada
      // já trocaria o painel. Nesta, o painel tem de continuar o mesmo.
      await expect(desabilitada).toHaveAttribute('aria-selected', 'false');
      await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', primeira.id);
    });

    await step('Enter e Espaço com ela em foco não trocam o painel', async () => {
      await voltarAoInicio();
      desabilitada.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      await expect(desabilitada).toHaveAttribute('aria-selected', 'false');
      await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', primeira.id);
    });

    await step('O clique também não', async () => {
      await voltarAoInicio();
      // `pointerEventsCheck: 0` é obrigatório: com `pointer-events: none` o
      // userEvent RECUSA o clique e o teste passaria sem exercitar nada.
      await userEvent.click(desabilitada, { pointerEventsCheck: 0 });
      await expect(desabilitada).toHaveAttribute('aria-selected', 'false');
      await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', primeira.id);
    });

    await step('A seta segue adiante a partir dela', async () => {
      // Sem isto, a aba desabilitada viraria um beco sem saída para o teclado —
      // pior que a exclusão que o alcance veio corrigir.
      desabilitada.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(ultima).toHaveFocus());
      await voltarAoInicio();
    });
  },
};
