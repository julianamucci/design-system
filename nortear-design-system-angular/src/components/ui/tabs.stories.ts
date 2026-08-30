import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, fn, userEvent } from 'storybook/test';
import {
  NdsTabs,
  NdsTabsList,
  NdsTabsTrigger,
  NdsTabsContent,
  type TabsListVariant,
  type TabsOrientation,
  type TabsActivationMode,
} from './tabs';
import { NdsTabsDocs } from '@/components/docs/TabsDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type TabsArgs = {
  orientation: TabsOrientation;
  variant: TabsListVariant;
  activationMode: TabsActivationMode;
  onValueChange: (value: string) => void;
};

/**
 * O painel Code imprime o `template` da story como está escrito — com os
 * bindings ligados aos args (`[orientation]="orientation"`). Isso é o andaime da
 * story, não o que alguém escreve para usar Tabs. O `transform` devolve o uso
 * real, com os valores atuais dos controls já resolvidos (ver a nota em
 * `separator.stories.ts`).
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<TabsArgs> }): string {
  const {
    orientation = 'horizontal',
    variant = 'default',
    activationMode = 'automatic',
  } = ctx.args ?? {};

  // Só o que difere do default entra: snippet que repete valor padrão ensina
  // ruído a quem copia.
  const root = ['ndsTabs', 'defaultValue="overview"']
    .concat(orientation === 'horizontal' ? [] : [`orientation="${orientation}"`])
    .join(' ');
  const list = ['ndsTabsList', 'aria-label="Seções do componente"']
    .concat(variant === 'default' ? [] : [`variant="${variant}"`])
    .concat(activationMode === 'automatic' ? [] : [`activationMode="${activationMode}"`])
    .join(' ');

  return `import {
  NdsTabs, NdsTabsList, NdsTabsTrigger, NdsTabsContent,
} from '@/components/ui/tabs';

@Component({
  imports: [NdsTabs, NdsTabsList, NdsTabsTrigger, NdsTabsContent],
  template: \`
    <div ${root}>
      <div ${list}>
        <button ndsTabsTrigger value="overview">Visão geral</button>
        <button ndsTabsTrigger value="properties">Propriedades</button>
        <button ndsTabsTrigger value="examples">Exemplos</button>
      </div>
      <div ndsTabsContent value="overview">Conteúdo da visão geral</div>
      <div ndsTabsContent value="properties">Lista de propriedades</div>
      <div ndsTabsContent value="examples">Exemplos de uso</div>
    </div>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<TabsArgs> = {
  title: 'Primitives/Navigation/Tabs',
  tags: ['autodocs', 'navigation'],
  decorators: [
    moduleMetadata({ imports: [NdsTabs, NdsTabsList, NdsTabsTrigger, NdsTabsContent] }),
  ],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsTabsDocs) },
  },
  argTypes: {
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Direção da navegação por setas e do layout.',
    },
    variant: {
      control: { type: 'inline-radio' },
      options: ['default', 'line'],
      description: 'Estilo visual da lista: trilho com fundo, ou linha sob a aba ativa.',
    },
    activationMode: {
      control: { type: 'inline-radio' },
      options: ['automatic', 'manual'],
      description:
        'automatic: a seta já troca de aba. manual: a seta move o foco e Enter/Space troca.',
    },
    // Função em `args` sem entrada aqui NÃO chega ao template no renderer
    // Angular — o `(valueChange)` ficaria ligado a nada, sem erro nenhum.
    onValueChange: { control: false, table: { disable: true } },
  },
  args: {
    orientation: 'horizontal',
    variant: 'default',
    activationMode: 'automatic',
    onValueChange: fn(),
  },
};

export default meta;
type Story = StoryObj<TabsArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    docs: { source: { transform: playgroundSource } },
    // `visual.item1` NÃO entra aqui: ele é "Default (3 tabs, primeira ativa)" e
    // o Chromatic fotografa o estado FINAL da play — que é a terceira aba
    // ativa, não a primeira. Quem cobre esse item é a story `Default` de
    // variantes, que não clica em nada.
    covers: [
      'functional.item1',
      'accessibility.item1',
      'accessibility.item4',
      'accessibility.item5',
    ],
  },
  render: (args) => ({
    props: { ...args },
    template: `
      <div
        ndsTabs
        class="nds-max-w-lg"
        defaultValue="overview"
        [orientation]="orientation"
        (valueChange)="onValueChange($event)"
      >
        <div
          ndsTabsList
          aria-label="Seções do componente"
          [variant]="variant"
          [activationMode]="activationMode"
        >
          <button ndsTabsTrigger value="overview">Visão geral</button>
          <button ndsTabsTrigger value="properties">Propriedades</button>
          <button ndsTabsTrigger value="examples">Exemplos</button>
        </div>
        <div ndsTabsContent value="overview" class="nds-text-body">Conteúdo da visão geral</div>
        <div ndsTabsContent value="properties" class="nds-text-body">Lista de propriedades</div>
        <div ndsTabsContent value="examples" class="nds-text-body">Exemplos de uso</div>
      </div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('A lista é um tablist com nome acessível', async () => {
      // Sem `aria-label` o leitor de tela anuncia "lista de abas" e pronto —
      // é o item 4 da seção de acessibilidade do conteúdo.
      await expect(canvas.getByRole('tablist', { name: 'Seções do componente' })).toBeTruthy();
    });

    await step('Cada aba é um tab e só a ativa se anuncia selecionada', async () => {
      const abas = canvas.getAllByRole('tab');
      await expect(abas).toHaveLength(3);
      await expect(abas[0].getAttribute('aria-selected')).toBe('true');
      await expect(abas[1].getAttribute('aria-selected')).toBe('false');
    });

    await step('O painel ativo é o único visível e está ligado à sua aba', async () => {
      const panel = canvas.getByRole('tabpanel');
      await expect(panel.textContent).toContain('Conteúdo da visão geral');
      const aba = canvas.getByRole('tab', { name: 'Visão geral' });
      await expect(panel.getAttribute('aria-labelledby')).toBe(aba.id);
      await expect(aba.getAttribute('aria-controls')).toBe(panel.id);
    });

    await step('Clicar em "Propriedades" troca a aba e o painel', async () => {
      // Idempotente: clicar numa aba já ativa a mantém ativa, então o replay do
      // painel Interactions chega ao mesmo estado.
      const propriedades = canvas.getByRole('tab', { name: 'Propriedades' });
      await userEvent.click(propriedades);

      const selecionada = propriedades.getAttribute('aria-selected');
      await expect(selecionada).toBe('true');
      await expect(propriedades.getAttribute('data-state')).toBe('active');
      await expect(canvas.getByRole('tabpanel').textContent).toContain('Lista de propriedades');
      await expect(args.onValueChange).toHaveBeenCalledWith('properties');
    });
  },
};
