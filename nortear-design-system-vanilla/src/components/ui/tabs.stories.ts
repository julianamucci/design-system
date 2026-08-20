import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createTabs, type TabsItemDef } from './tabs';
import { ativar, makePanel } from './tabs.fixtures';
import { tabsSource } from './tabs.source';
import { createTabsDocs } from '@/components/docs/TabsDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type TabsArgs = {
  defaultValue: string;
  'aria-label': string;
};

const meta: Meta<TabsArgs> = {
  title: 'UI/Tabs',
  tags: ['autodocs', 'navigation'],
  parameters: {
    docs: { page: withAutoDocsTab(createTabsDocs), source: { transform: tabsSource } },
  },
  argTypes: {
    defaultValue: {
      control: 'select',
      options: ['overview', 'properties', 'examples'],
      description: 'Tab ativa inicial (não-controlada).',
    },
    'aria-label': {
      control: 'text',
      description: 'aria-label do TabsList — OBRIGATÓRIO. Descreve o agrupamento de tabs.',
    },
  },
  args: {
    defaultValue: 'overview',
    'aria-label': 'Seções do componente',
  },
};

export default meta;
type Story = StoryObj<TabsArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ROTULOS: Record<string, string> = {
  overview: 'Visão geral',
  properties: 'Propriedades',
  examples: 'Exemplos',
};

function buildItems(): TabsItemDef[] {
  return [
    { value: 'overview',   label: ROTULOS.overview,   content: makePanel('Conteúdo da visão geral.') },
    { value: 'properties', label: ROTULOS.properties, content: makePanel('Lista de propriedades.') },
    { value: 'examples',   label: ROTULOS.examples,   content: makePanel('Exemplos de uso.') },
  ];
}

// ─── Playground ───────────────────────────────────────────────────────────────

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
  },
  render: (args) => {
    const root = createTabs({
      defaultValue: args.defaultValue,
      class: 'nds-w-full nds-max-w-lg',
      items: buildItems(),
      // ARIA: nome da lista de abas, OBRIGATÓRIO. A opção escreve no
      // `role="tablist"`, que é o elemento que o leitor de tela anuncia.
      'aria-label': args['aria-label'],
    });
    return root;
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const lista = canvas.getByRole('tablist');
    const abas = canvas.getAllByRole('tab');
    const inicial = canvas.getByRole('tab', { name: ROTULOS[args.defaultValue] });
    const propriedades = canvas.getByRole('tab', { name: ROTULOS.properties });
    const exemplos = canvas.getByRole('tab', { name: ROTULOS.examples });
    const primeira = canvas.getByRole('tab', { name: ROTULOS.overview });

    await step('Os três papéis do padrão tabs estão no DOM', async () => {
      // A asserção já existia e passava — com a story escrevendo o atributo por
      // fora. O que ela prova agora é que a OPÇÃO da factory chega ao tablist.
      await expect(lista).toHaveAttribute('aria-label', args['aria-label']);
      await expect(abas).toHaveLength(3);
      // Só o painel da aba ativa está na árvore de acessibilidade — os demais
      // saem por `hidden`, que é o que impede o leitor de tela de lê-los.
      await expect(canvas.getAllByRole('tabpanel')).toHaveLength(1);
    });

    await step('aria-selected e roving tabindex apontam a mesma aba', async () => {
      const inativas = abas.filter((aba) => aba !== inicial);
      await expect(inicial).toHaveAttribute('aria-selected', 'true');
      await expect(inicial).toHaveAttribute('tabindex', '0');
      await expect(inativas.map((a) => a.getAttribute('aria-selected'))).toEqual(['false', 'false']);
      await expect(inativas.map((a) => a.getAttribute('tabindex'))).toEqual(['-1', '-1']);
    });

    await step('aria-controls e aria-labelledby fecham o par nos dois sentidos', async () => {
      const painel = canvas.getByRole('tabpanel');
      await expect(inicial.getAttribute('aria-controls')).toBe(painel.id);
      await expect(painel.getAttribute('aria-labelledby')).toBe(inicial.id);
    });

    await step('Clicar numa aba ativa ela e troca o painel', async () => {
      await ativar(propriedades);
      await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', propriedades.id);
    });

    await step('ArrowRight move o foco e ativa a aba seguinte', async () => {
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(exemplos).toHaveAttribute('aria-selected', 'true'));
      await expect(exemplos).toHaveFocus();
    });

    await step('End vai à última e Home volta à primeira', async () => {
      await userEvent.keyboard('{End}');
      await waitFor(() => expect(exemplos).toHaveAttribute('aria-selected', 'true'));
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(primeira).toHaveAttribute('aria-selected', 'true'));
      // Fecha o ciclo no estado de montagem, qualquer que seja o defaultValue
      // escolhido no painel de controles.
      await ativar(inicial);
    });
  },
};
