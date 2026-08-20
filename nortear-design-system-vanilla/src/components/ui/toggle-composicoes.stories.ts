import type { Meta, StoryObj } from '@storybook/html-vite';
import { toggleSource, toggleSourceBarra, toggleSourceCom, toggleSourceFileira } from './toggle.source';
import { within, expect, userEvent } from 'storybook/test';
import { Bold, Italic, Underline, List, Eye } from 'lucide';
import { createToggle, type ToggleOptions } from './toggle';
import { buildLucideSvg } from './toggle.fixtures';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Toggle/Compositions',
  parameters: {
    layout: 'centered',
    // Sem argTypes neste arquivo: os painéis ficariam vazios.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: toggleSource },
      description: {
        component:
          'As duas composições documentadas — toolbar de formatação e lista de filtros — mais o padrão controlado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers locais ───────────────────────────────────────────────────────────

function toggle(opts: {
  icon: unknown;
  'aria-label'?: string;
  texto?: string;
  pressed?: boolean;
  variant?: ToggleOptions['variant'];
  onClick?: (pressed: boolean) => void;
}): HTMLButtonElement {
  // Ícone e texto como filhos DIRETOS: o espaço vem do `gap` do `.nds-toggle`.
  const filhos = opts.texto
    ? [buildLucideSvg(opts.icon), opts.texto]
    : [buildLucideSvg(opts.icon)];
  return createToggle({
    pressed: opts.pressed ?? false,
    variant: opts.variant ?? 'default',
    onClick: opts.onClick,
    children: filhos,
    'aria-label': opts['aria-label'],
  });
}

/**
 * Leva o toggle a um estado conhecido clicando SÓ quando ele ainda não está
 * lá. O painel Interactions reexecuta a play no mesmo DOM: um clique cego
 * partiria do estado que a rodada anterior deixou e inverteria o resultado.
 */
async function definir(btn: HTMLElement, alvo: boolean) {
  if ((btn.getAttribute('aria-pressed') === 'true') !== alvo) await userEvent.click(btn);
  await expect(btn).toHaveAttribute('aria-pressed', String(alvo));
}

// ─── FormattingToolbar ────────────────────────────────────────────────────────

export const FormattingToolbar: Story = {
  parameters: {
    // Override: a composição é o grupo NOMEADO em volta dos toggles, e é ela
    // que a story documenta.
    docs: {
      source: {
        transform: toggleSourceBarra(
          [
            { icon: 'Bold', 'aria-label': 'Negrito' },
            { icon: 'Italic', 'aria-label': 'Itálico' },
            { icon: 'Underline', 'aria-label': 'Sublinhado' },
            { icon: 'List', 'aria-label': 'Lista' },
          ],
          'Formatação de texto',
        ),
      },
    },
  },
  render: () => {
    const toolbar = document.createElement('div');
    toolbar.className = 'nds-cluster nds-rounded-lg nds-border-default nds-p-1';
    toolbar.dataset.spacing = 'xs';
    toolbar.dataset.align = 'center';
    toolbar.setAttribute('role', 'group');
    toolbar.setAttribute('aria-label', 'Formatação de texto');

    toolbar.append(
      toggle({ icon: Bold, 'aria-label': 'Negrito' }),
      toggle({ icon: Italic, 'aria-label': 'Itálico' }),
      toggle({ icon: Underline, 'aria-label': 'Sublinhado' }),
      toggle({ icon: List, 'aria-label': 'Lista' }),
    );

    return toolbar;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O conjunto é anunciado como grupo, com nome próprio', async () => {
      const grupo = canvas.getByRole('group', { name: 'Formatação de texto' });
      await expect(grupo).toBeVisible();
      await expect(within(grupo).getAllByRole('button')).toHaveLength(4);
    });

    await step('Cada toggle icon-only tem nome acessível próprio', async () => {
      for (const nome of ['Negrito', 'Itálico', 'Sublinhado', 'Lista']) {
        const btn = canvas.getByRole('button', { name: nome });
        await expect(btn).toHaveAttribute('aria-label', nome);
        await expect(btn.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('Os toggles são independentes: ativar um não mexe no vizinho', async () => {
      const negrito = canvas.getByRole('button', { name: 'Negrito' });
      const italico = canvas.getByRole('button', { name: 'Itálico' });
      await definir(negrito, false);
      await definir(italico, false);
      // O par idempotente também prova o clique DESTA rodada: se o toggle já
      // estivesse ligado, o `definir` acima o teria desligado antes.
      await definir(negrito, true);
      await expect(italico).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

// ─── FilterList ───────────────────────────────────────────────────────────────

export const FilterList: Story = {
  parameters: {
    docs: {
      source: {
        transform: toggleSourceFileira([
          { icon: 'Eye', label: 'Mostrar ocultos', variant: 'outline' },
          { icon: 'List', label: 'Visão compacta', variant: 'outline', pressed: true },
        ]),
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';

    const titulo = document.createElement('p');
    titulo.className = 'nds-text-body nds-font-semibold';
    titulo.textContent = 'Filtros de exibição';

    const row = document.createElement('div');
    row.className = 'nds-cluster';
    row.dataset.spacing = 'sm';
    row.append(
      toggle({ icon: Eye, texto: 'Mostrar ocultos', variant: 'outline' }),
      toggle({ icon: List, texto: 'Visão compacta', variant: 'outline', pressed: true }),
    );

    wrapper.append(titulo, row);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O rótulo visível é o nome acessível de cada filtro', async () => {
      // Sem interação nesta story de propósito: a asserção de estado INICIAL
      // não sobreviveria ao replay se um clique a precedesse.
      const ocultos = canvas.getByRole('button', { name: 'Mostrar ocultos' });
      const compacta = canvas.getByRole('button', { name: 'Visão compacta' });
      await expect(ocultos.getAttribute('aria-label')).toBe(null);
      await expect(compacta.getAttribute('aria-label')).toBe(null);
    });

    await step('Cada filtro é uma escolha booleana isolada, e podem combinar', async () => {
      const ocultos = canvas.getByRole('button', { name: 'Mostrar ocultos' });
      const compacta = canvas.getByRole('button', { name: 'Visão compacta' });
      await expect(ocultos).toHaveAttribute('aria-pressed', 'false');
      await expect(compacta).toHaveAttribute('aria-pressed', 'true');
    });

    await step('Os dois filtros usam a variante outline', async () => {
      for (const nome of ['Mostrar ocultos', 'Visão compacta']) {
        await expect(canvas.getByRole('button', { name: nome })).toHaveAttribute(
          'data-variant',
          'outline',
        );
      }
    });
  },
};

// ─── Controlled ───────────────────────────────────────────────────────────────

export const Controlled: Story = {
  parameters: {
    docs: {
      source: {
        transform: toggleSourceCom({
          icon: 'Bold',
          'aria-label': 'Negrito',
          onClick: '(pressed) => { saida.textContent = String(pressed); }',
        }),
      },
    },
  },
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'sm';

    const saida = document.createElement('p');
    saida.className = 'nds-text-caption nds-text-muted-foreground';

    const valor = document.createElement('code');
    valor.className = 'nds-font-mono';
    valor.textContent = 'false';
    saida.append('Estado atual: ', valor);

    const btn = toggle({
      icon: Bold,
      'aria-label': 'Negrito',
      onClick: (pressed) => {
        valor.textContent = String(pressed);
      },
    });

    wrapper.append(btn, saida);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: 'Negrito' });

    await step('O estado externo acompanha o toggle ao ligar', async () => {
      // O par (desliga, liga) garante um clique REAL nesta rodada, venha o DOM
      // de onde vier: sem ele, o replay partiria do estado que a rodada
      // anterior deixou e a asserção absoluta inverteria.
      await definir(btn, false);
      await definir(btn, true);
      await expect(canvas.getByText('true')).toBeVisible();
    });

    await step('E acompanha também ao desligar', async () => {
      await definir(btn, false);
      await expect(canvas.getByText('false')).toBeVisible();
    });
  },
};
