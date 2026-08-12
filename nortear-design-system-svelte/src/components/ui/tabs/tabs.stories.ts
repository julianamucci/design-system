import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { userEvent, within, expect, waitFor } from 'storybook/test';
import { Tabs } from './index';
import TabsStory from './TabsStory.svelte';
import TabsDocs from '@/components/docs/TabsDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

type TabsArgs = {
  orientation: 'horizontal' | 'vertical';
  activationMode: 'automatic' | 'manual';
};

/**
 * O gerador de source do @storybook/svelte monta a tag a partir de
 * `component.__docgen.name` e, sem docgen, cai em `component.name` — o nome
 * interno da função compilada. Daí saía `<wrapper orientation="horizontal" …/>`,
 * que não é um componente que alguém possa importar, e ainda serializava os
 * `args` da raiz sobre o componente-wrapper da story. Enquanto o docgen estiver
 * desligado, o snippet vai explícito.
 *
 * `transform` e não `code`: um snippet fixo deixaria de acompanhar os controls —
 * trocar a orientação não mudaria nada na caixa de código.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<TabsArgs> }): string {
  const { orientation = 'horizontal', activationMode = 'automatic' } = ctx.args ?? {};

  // Só o que difere do padrão entra: snippet que repete valor padrão ensina
  // ruído a quem copia.
  const attrs = ['bind:value']
    .concat(orientation === 'horizontal' ? [] : [`orientation="${orientation}"`])
    .concat(activationMode === 'automatic' ? [] : [`activationMode="${activationMode}"`])
    .concat('class="nds-max-w-lg"')
    .join(' ');

  return `<script lang="ts">
  import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs";

  let value = $state("overview");
</script>

<Tabs ${attrs}>
  <TabsList aria-label="Seções do componente">
    <TabsTrigger value="overview">Visão geral</TabsTrigger>
    <TabsTrigger value="properties">Propriedades</TabsTrigger>
    <TabsTrigger value="examples">Exemplos</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Conteúdo da visão geral</TabsContent>
  <TabsContent value="properties">Lista de propriedades</TabsContent>
  <TabsContent value="examples">Exemplos de uso</TabsContent>
</Tabs>`;
}

const meta: Meta = {
  title: 'UI/Tabs',
  component: Tabs,
  tags: ['autodocs', 'navigation'],
  parameters: {
    docs: { page: withAutoDocsTab(TabsDocs) },
  },
  // A aba "API Reference" é montada só a partir destes argTypes: o docgen do
  // Svelte está desligado no .storybook/main.ts. Props com `control: false` são
  // documentação — o wrapper da story não as encaminha, e control ativo sem
  // fiação vira controle morto.
  argTypes: {
    orientation: {
      control: 'select',
      options: ['horizontal', 'vertical'],
      description: 'Direção da navegação por setas e do layout.',
      table: { type: { summary: "'horizontal' | 'vertical'" }, defaultValue: { summary: "'horizontal'" } },
    },
    activationMode: {
      control: 'select',
      options: ['automatic', 'manual'],
      description:
        'automatic: a seta já troca de aba. manual: a seta move o foco e Enter/Space troca.',
      table: { type: { summary: "'automatic' | 'manual'" }, defaultValue: { summary: "'automatic'" } },
    },
    value: {
      control: false,
      description: 'Aba ativa, bindable com bind:value. Define também o estado inicial.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" } },
    },
    onValueChange: {
      control: false,
      description: 'Callback disparado quando a aba ativa muda.',
      table: { type: { summary: '(value: string) => void' } },
    },
    loop: {
      control: false,
      description: 'Faz a navegação por setas voltar à primeira aba depois da última.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    disabled: {
      control: false,
      description: 'Desabilita todas as abas de uma vez.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    class: {
      control: false,
      description: 'Classes adicionais no elemento raiz. Esta stack usa class, não className.',
      table: { type: { summary: 'string' } },
    },
  },
  args: {
    orientation: 'horizontal',
    activationMode: 'automatic',
  },
};

export default meta;
type Story = StoryObj;

/**
 * Idempotente: clicar numa aba já ativa a MANTÉM ativa, então o par certo é
 * garantir o alvo e esperar o estado. Sem isto, o replay do painel Interactions
 * parte do estado que a rodada anterior deixou e inverte o resultado.
 */
const ativar = async (aba: HTMLElement) => {
  if (aba.getAttribute('aria-selected') !== 'true') await userEvent.click(aba);
  await waitFor(() => expect(aba).toHaveAttribute('aria-selected', 'true'));
};

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'functional.item3',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
    ],
    docs: { source: { transform: playgroundSource } },
  },
  render: (args) => ({
    Component: TabsStory,
    props: {
      orientation: args.orientation,
      activationMode: args.activationMode,
      defaultValue: 'overview',
      ariaLabel: 'Seções do componente',
      class: 'nds-w-full nds-max-w-lg',
    },
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const visaoGeral = canvas.getByRole('tab', { name: 'Visão geral' });
    const propriedades = canvas.getByRole('tab', { name: 'Propriedades' });
    const exemplos = canvas.getByRole('tab', { name: 'Exemplos' });

    // A tecla de navegação segue o eixo escolhido no control, senão trocar a
    // orientação no painel deixaria a própria play vermelha.
    const seta = args.orientation === 'vertical' ? '{ArrowDown}' : '{ArrowRight}';
    // No modo manual a seta só move o foco — quem troca a aba é o Enter.
    const confirmar = async () => {
      if (args.activationMode === 'manual') await userEvent.keyboard('{Enter}');
    };

    await step('A fileira é um tablist com nome acessível e três abas', async () => {
      // Sem `aria-label` o leitor de tela anuncia "lista de abas" e pronto.
      await expect(canvas.getByRole('tablist', { name: 'Seções do componente' })).toBeInTheDocument();
      await expect(canvas.getAllByRole('tab')).toHaveLength(3);
    });

    await step('Uma aba ativa por vez, e só ela se anuncia selecionada', async () => {
      await ativar(visaoGeral);
      await expect(propriedades).toHaveAttribute('aria-selected', 'false');
      await expect(exemplos).toHaveAttribute('aria-selected', 'false');
    });

    await step('Aba e painel se apontam de verdade', async () => {
      // Par cruzado: já achamos `aria-controls` apontando para um id que não
      // existia. Assere os dois lados, não presuma.
      const painel = canvas.getByRole('tabpanel');
      await expect(painel).toHaveTextContent('Conteúdo da visão geral');
      await expect(painel.getAttribute('aria-labelledby')).toBe(visaoGeral.id);
      await expect(visaoGeral.getAttribute('aria-controls')).toBe(painel.id);
    });

    await step('Só a aba ativa é parada de tabulação (roving tabindex)', async () => {
      await expect(visaoGeral).toHaveAttribute('tabindex', '0');
      await expect(propriedades).toHaveAttribute('tabindex', '-1');
      await expect(exemplos).toHaveAttribute('tabindex', '-1');
    });

    await step('Clicar numa aba troca a aba e o painel', async () => {
      await ativar(propriedades);
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Lista de propriedades');
      await expect(visaoGeral).toHaveAttribute('aria-selected', 'false');
    });

    await step('A seta move o foco para a próxima aba', async () => {
      propriedades.focus();
      await userEvent.keyboard(seta);
      await expect(exemplos).toHaveFocus();
      await confirmar();
      await waitFor(() => expect(exemplos).toHaveAttribute('aria-selected', 'true'));
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Exemplos de uso');
    });

    await step('End vai à última aba e Home volta à primeira', async () => {
      // Nesta ordem de propósito: a play termina no mesmo estado em que começou,
      // então a rodada seguinte não parte torta.
      await userEvent.keyboard('{End}');
      await expect(exemplos).toHaveFocus();
      await userEvent.keyboard('{Home}');
      await expect(visaoGeral).toHaveFocus();
      await confirmar();
      await waitFor(() => expect(visaoGeral).toHaveAttribute('aria-selected', 'true'));
      await expect(canvas.getByRole('tabpanel')).toHaveTextContent('Conteúdo da visão geral');
    });
  },
};
