import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, userEvent, waitFor, expect } from 'storybook/test';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './index';
import { ChevronDown, Filter } from 'lucide-vue-next';
import {
  collapsibleWithButtonSource,
  collapsibleWithChevronSource,
  collapsibleWithIconSource,
} from './collapsible.source';

// Mesmo markup do Playground e do Vanilla (referência cross-stack).
const PANEL_CLASSES =
  'nds-rounded-md nds-border-default nds-bg-muted-soft nds-p-4 nds-text-body nds-stack nds-mt-2';
const CHEVRON_CLASSES = 'nds-icon nds-shrink-0 nds-transition-transform nds-chevron';

const meta = {
  title: 'UI/Collapsible/Compositions',
  component: Collapsible,
  tags: ['disclosure'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    layout: 'centered',
    docs: {
      source: { transform: collapsibleWithButtonSource },
      description: {
        component: 'Composicoes do Collapsible: trigger estilizado como botão, ícone no trigger e chevron que gira ao abrir.',
      },
    },
  },
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Par idempotente — ver a nota em collapsible.stories.ts. */
const abrir = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'true') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'true'));
};
const fechar = async (t: HTMLElement) => {
  if (t.getAttribute('aria-expanded') !== 'false') await userEvent.click(t);
  await waitFor(() => expect(t).toHaveAttribute('aria-expanded', 'false'));
};

// ─── Trigger estilizado como botão ────────────────────────────────────────────

export const WithCustomButton: Story = {
  parameters: { covers: ['functional.item5'] },
  render: () => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, ChevronDown },
    setup() { return {}; },
    template: `
      <Collapsible class="nds-w-sm">
        <CollapsibleTrigger
          class="nds-button nds-button-outline nds-cluster nds-w-full nds-px-4"
          data-justify="between"
        >
          <span>Exibir opções avançadas</span>
          <ChevronDown aria-hidden="true" class="${CHEVRON_CLASSES}" />
        </CollapsibleTrigger>
        <CollapsibleContent class="${PANEL_CLASSES}" data-spacing="sm">
          <p>Opção avançada 1</p>
          <p>Opção avançada 2</p>
          <p>Opção avançada 3</p>
        </CollapsibleContent>
      </Collapsible>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: /Exibir opções avançadas/ });

    await step('o botão do design system E o trigger são o MESMO elemento', async () => {
      // Não há repasse de comportamento para um filho: as classes do Button
      // moram no próprio trigger, que por isso carrega aria-expanded e, aberto,
      // aria-controls, sem código de ligação.
      await expect(trigger).toHaveClass(/nds-button-outline/);
      await expect(trigger).toHaveAttribute('data-slot', 'collapsible-trigger');
      await expect(trigger).toHaveAttribute('aria-expanded');
    });

    await step('aberto, o mesmo botão aponta para o painel', async () => {
      await fechar(trigger);
      await abrir(trigger);
      const id = trigger.getAttribute('aria-controls');
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBe(
        canvasElement.querySelector('[data-slot="collapsible-content"]'),
      );
    });
  },
};

// ─── Com ícone no trigger ─────────────────────────────────────────────────────

export const WithIconInTrigger: Story = {
  parameters: {
    covers: ['accessibility.item4'],
    // O ícone dentro do rótulo é a sub-composição em questão, e ele traz um
    // import a mais — a do meta não mostra nenhum dos dois.
    docs: { source: { transform: collapsibleWithIconSource } },
  },
  render: () => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, ChevronDown, Filter },
    setup() { return {}; },
    template: `
      <Collapsible class="nds-w-sm">
        <CollapsibleTrigger
          class="nds-button nds-button-ghost nds-cluster nds-w-full nds-px-4"
          data-justify="between"
        >
          <span class="nds-cluster" data-spacing="sm">
            <Filter aria-hidden="true" class="nds-icon nds-shrink-0 nds-text-muted-foreground" />
            Filtros avançados
          </span>
          <ChevronDown aria-hidden="true" class="${CHEVRON_CLASSES}" />
        </CollapsibleTrigger>
        <CollapsibleContent class="${PANEL_CLASSES}" data-spacing="sm">
          <p class="nds-text-muted-foreground">Filtro avançado 1</p>
          <p class="nds-text-muted-foreground">Filtro avançado 2</p>
        </CollapsibleContent>
      </Collapsible>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // Achado pelo NOME acessível: se algum SVG entrasse no nome, este seletor já
    // não casaria — é a asserção real por trás do aria-hidden.
    const trigger = canvas.getByRole('button', { name: 'Filtros avançados' });

    await step('nenhum ícone entra no nome acessível', async () => {
      const svgs = trigger.querySelectorAll('svg');
      await expect(svgs.length).toBe(2);
      for (const svg of svgs) await expect(svg).toHaveAttribute('aria-hidden', 'true');
    });

    await step('o trigger continua alternando o painel', async () => {
      await fechar(trigger);
      await abrir(trigger);
      await expect(canvas.getByText('Filtro avançado 1')).toBeVisible();
    });
  },
};

// ─── Com chevron rotativo ─────────────────────────────────────────────────────
//
// Nome anterior: `WithRotatingIconório`, identificador corrompido que aparecia
// assim na barra lateral do Storybook. `WithRotatingChevron` é o nome do Vanilla.
export const WithRotatingChevron: Story = {
  parameters: {
    covers: ['visual.item4'],
    // O painel traz pares rótulo/valor em vez de parágrafos soltos: é outra
    // sub-composição, e é ela que a story fotografa.
    docs: { source: { transform: collapsibleWithChevronSource } },
  },
  render: () => ({
    components: { Collapsible, CollapsibleTrigger, CollapsibleContent, ChevronDown },
    setup() { return {}; },
    template: `
      <Collapsible class="nds-w-sm">
        <CollapsibleTrigger
          class="nds-button nds-button-outline nds-cluster nds-w-full nds-px-4"
          data-justify="between"
        >
          <span>Configurações avançadas</span>
          <ChevronDown aria-hidden="true" class="${CHEVRON_CLASSES}" />
        </CollapsibleTrigger>
        <CollapsibleContent class="${PANEL_CLASSES}" data-spacing="sm">
          <div class="nds-cluster" data-justify="between">
            <span class="nds-text-muted-foreground">Notificações</span>
            <span class="nds-font-medium">Ativadas</span>
          </div>
          <div class="nds-cluster" data-justify="between">
            <span class="nds-text-muted-foreground">Privacidade</span>
            <span class="nds-font-medium">Modo estrito</span>
          </div>
        </CollapsibleContent>
      </Collapsible>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole('button', { name: 'Configurações avançadas' });
    const chevron = trigger.querySelector<SVGElement>('svg')!;

    await step('o chevron é decorativo e carrega a classe da rotação', async () => {
      await expect(chevron).toHaveAttribute('aria-hidden', 'true');
      await expect(chevron.getAttribute('class')).toContain('nds-chevron');
    });

    await step('fechado, o ícone não está girado', async () => {
      await fechar(trigger);
      // waitFor porque `.nds-chevron` tem transition: transform — medido no
      // primeiro quadro, o valor computado ainda é a matriz da animação.
      await waitFor(() => expect(getComputedStyle(chevron).transform).toBe('none'));
    });

    await step('aberto, o CSS gira 180° a partir do estado no trigger', async () => {
      await abrir(trigger);
      // matrix(-1, 0, 0, -1, 0, 0) é a forma computada de rotate(180deg).
      await waitFor(() =>
        expect(getComputedStyle(chevron).transform).toBe('matrix(-1, 0, 0, -1, 0, 0)'),
      );
    });
  },
};
