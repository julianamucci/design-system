import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createTabs, type TabsItemDef } from './tabs';
import { ativar, makePanel } from './tabs.fixtures';
import { tabsSource, tabsSourceWith } from './tabs.source';

const meta: Meta = {
  tags: ['navigation'],
  title: 'Components/Navigation/Tabs/States',
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
    docs: { source: { transform: tabsSource } },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function baseItems(): TabsItemDef[] {
  return [
    { value: 'overview',   label: 'Visão geral',  content: makePanel('Conteúdo da visão geral.') },
    { value: 'properties', label: 'Propriedades', content: makePanel('Lista de propriedades.') },
    { value: 'examples',   label: 'Exemplos',     content: makePanel('Exemplos de uso.') },
  ];
}

function withDisabled(): TabsItemDef[] {
  return [
    { value: 'overview',   label: 'Visão geral',  content: makePanel('Conteúdo ativo.') },
    { value: 'properties', label: 'Propriedades', content: makePanel('Conteúdo bloqueado.'), disabled: true },
    { value: 'examples',   label: 'Exemplos',     content: makePanel('Outro conteúdo.') },
  ];
}

const LABEL_LIST = 'Seções do componente';

/** O nome da lista de abas vem da opção da factory, não de um retoque no DOM. */
function group(defaultValue: string, items: TabsItemDef[]): HTMLElement {
  return createTabs({
    defaultValue,
    class: 'nds-w-md',
    items,
    'aria-label': LABEL_LIST,
  });
}

// ─── Default (primeira ativa) ─────────────────────────────────────────────────

export const Default: Story = {
  render: () => group('overview', baseItems()),
  parameters: {
    docs: { description: { story: 'Estado inicial: primeira aba ativa, demais inativas, um único painel visível.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = canvas.getAllByRole('tab');

    await step('Só a primeira aba está selecionada', async () => {
      await expect(abas.map((a) => a.getAttribute('aria-selected'))).toEqual(['true', 'false', 'false']);
      await expect(abas.map((a) => a.getAttribute('tabindex'))).toEqual(['0', '-1', '-1']);
    });

    await step('Um único painel visível, o da aba ativa', async () => {
      const panel = canvas.getByRole('tabpanel');
      await expect(canvas.getAllByRole('tabpanel')).toHaveLength(1);
      await expect(panel).toHaveAttribute('aria-labelledby', abas[0].id);
    });
  },
};

// ─── Active (segunda ativa via defaultValue) ──────────────────────────────────

export const Active: Story = {
  render: () => group('properties', baseItems()),
  parameters: {
    docs: {
      source: { transform: tabsSourceWith({ defaultValue: 'properties' }) },
      description: { story: 'Aba ativa escolhida na montagem. O painel visível é o dela, e a seleção não depende de clique.' },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = canvas.getAllByRole('tab');

    await step('A aba escolhida na montagem é a selecionada', async () => {
      await expect(abas.map((a) => a.getAttribute('aria-selected'))).toEqual(['false', 'true', 'false']);
      await expect(canvas.getByRole('tabpanel')).toHaveAttribute('aria-labelledby', abas[1].id);
    });

    await step('A aba ativa se distingue por fundo, não só por cor de texto', async () => {
      await expect(getComputedStyle(abas[1]).backgroundColor)
        .not.toBe(getComputedStyle(abas[0]).backgroundColor);
    });
  },
};

// ─── Focus visible ────────────────────────────────────────────────────────────

export const FocusVisible: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item3'],
    docs: { description: { story: 'Foco por teclado: anel visível na aba focada. Roving tabindex — só a aba ativa entra na ordem de Tab, e o Tab seguinte cai no painel.' } },
  },
  render: () => group('overview', baseItems()),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const abas = canvas.getAllByRole('tab');
    const panel = canvas.getByRole('tabpanel');

    // O foco tem que CHEGAR por teclado: `:focus-visible` não dispara em foco
    // programático, e o anel apareceria ausente num CSS que está certo.
    (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();

    await step('Tab leva o foco à aba ativa e o anel aparece', async () => {
      await userEvent.tab();
      await expect(abas[0]).toHaveFocus();
      await expect(getComputedStyle(abas[0]).boxShadow).not.toBe('none');
    });

    await step('O Tab seguinte cai no painel da aba ativa', async () => {
      await expect(panel).toHaveAttribute('tabindex', '0');
      await userEvent.tab();
      await expect(panel).toHaveFocus();
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  parameters: {
    covers: ['visual.item4', 'functional.item5', 'accessibility.item6'],
    docs: {
      // A aba bloqueada é o assunto: sem o override o snippet mostraria três
      // abas iguais.
      source: {
        transform: tabsSourceWith({
          items: [
            { value: 'overview', label: 'Visão geral', content: 'Conteúdo ativo.' },
            { value: 'properties', label: 'Propriedades', content: 'Conteúdo bloqueado.', disabled: true },
            { value: 'examples', label: 'Exemplos', content: 'Outro conteúdo.' },
          ],
        }),
      },
      description: {
        story:
          'Aba desabilitada: esmaecida e sem resposta ao ponteiro, mas ainda alcançável pela '
          + 'seta para que o leitor de tela a anuncie como indisponível.',
      },
    },
  },
  render: () => group('overview', withDisabled()),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const first = canvas.getByRole('tab', { name: 'Visão geral' });
    const bloqueada = canvas.getByRole('tab', { name: 'Propriedades' });
    const last = canvas.getByRole('tab', { name: 'Exemplos' });

    await step('Anuncia-se desabilitada sem sair do alcance do foco', async () => {
      await expect(bloqueada).toHaveAttribute('aria-disabled', 'true');
      // O atributo nativo é justamente o que NÃO pode estar aqui: ele remove o
      // botão do alcance do foco, e a aba deixa de ser anunciada — a pessoa
      // nunca descobre que ela existe.
      await expect(bloqueada).not.toBeDisabled();
      await expect(bloqueada).toHaveAttribute('aria-selected', 'false');
      await expect(Number(getComputedStyle(bloqueada).opacity)).toBeLessThan(1);
      await expect(getComputedStyle(bloqueada).pointerEvents).toBe('none');
    });

    await step('A seta ALCANÇA a aba desabilitada, e não a ativa', async () => {
      await ativar(first);
      first.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(bloqueada).toHaveFocus());
      // Alcançar não é ativar: com ativação automática, focar uma aba habilitada
      // já trocaria o painel. Nesta, a seleção tem de continuar onde estava.
      await expect(bloqueada).toHaveAttribute('aria-selected', 'false');
      await expect(first).toHaveAttribute('aria-selected', 'true');
    });

    await step('Enter e Espaço com ela em foco não mudam a seleção', async () => {
      await ativar(first);
      bloqueada.focus();
      await userEvent.keyboard('{Enter}');
      await userEvent.keyboard(' ');
      await expect(bloqueada).toHaveAttribute('aria-selected', 'false');
      await expect(first).toHaveAttribute('aria-selected', 'true');
    });

    await step('Clicar nela também não', async () => {
      await ativar(first);
      // `pointerEventsCheck: 0` é obrigatório: com pointer-events none o
      // userEvent RECUSA o clique, e o teste passaria sem exercitar nada.
      await userEvent.click(bloqueada, { pointerEventsCheck: 0 });
      await expect(bloqueada).toHaveAttribute('aria-selected', 'false');
      await expect(first).toHaveAttribute('aria-selected', 'true');
    });

    await step('A seta segue adiante a partir dela', async () => {
      // Sem isto, a aba desabilitada viraria um beco sem saída para o teclado —
      // pior que a exclusão que o alcance veio corrigir.
      bloqueada.focus();
      await userEvent.keyboard('{ArrowRight}');
      await waitFor(() => expect(last).toHaveAttribute('aria-selected', 'true'));
      // Home devolve o conjunto ao estado de montagem para o próximo replay.
      await userEvent.keyboard('{Home}');
      await waitFor(() => expect(first).toHaveAttribute('aria-selected', 'true'));
    });
  },
};
