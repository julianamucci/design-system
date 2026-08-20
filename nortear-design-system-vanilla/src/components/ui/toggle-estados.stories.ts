import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect, userEvent } from 'storybook/test';
import { Bold, Italic } from 'lucide';
import {
  contrasteDoToggleNosDoisTemas,
  descreverFalhasDeContraste,
  medirAnelDeFoco,
} from '@shared/testing/toggle-probe';
import { createToggle, type ToggleOptions } from './toggle';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Toggle/States',
  parameters: {
    layout: 'centered',
    // Sem argTypes neste arquivo: os painéis ficariam vazios.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Toggle: off, on, foco por teclado, desabilitado e inválido (aria-invalid).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers locais ───────────────────────────────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

function buildLucideSvg(icon: unknown): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  for (const [tag, attrs] of icon as unknown as LucideIconNode[]) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

function makeToggle(opts: {
  icon?: unknown;
  pressed?: boolean;
  disabled?: boolean;
  'aria-label': string;
  variant?: ToggleOptions['variant'];
}): HTMLButtonElement {
  return createToggle({
    pressed: opts.pressed ?? false,
    disabled: opts.disabled ?? false,
    variant: opts.variant ?? 'default',
    children: buildLucideSvg(opts.icon ?? Bold),
    'aria-label': opts['aria-label'],
  });
}

function cluster(...filhos: HTMLElement[]): HTMLElement {
  const wrap = document.createElement('div');
  wrap.className = 'nds-cluster';
  wrap.dataset.spacing = 'sm';
  wrap.append(...filhos);
  return wrap;
}

// ─── Off ──────────────────────────────────────────────────────────────────────

export const Off: Story = {
  parameters: { covers: ['visual.item1'] },
  render: () => makeToggle({ 'aria-label': 'Negrito' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: 'Negrito' });

    await step('Estado inativo em aria-pressed e data-state', async () => {
      await expect(btn).toHaveAttribute('aria-pressed', 'false');
      await expect(btn).toHaveAttribute('data-state', 'off');
    });

    await step('Fundo transparente — o estado inativo não pinta nada', async () => {
      await expect(getComputedStyle(btn).backgroundColor).toMatch(
        /rgba\(0, 0, 0, 0\)|transparent/,
      );
    });
  },
};

// ─── On ───────────────────────────────────────────────────────────────────────

export const On: Story = {
  parameters: { covers: ['visual.item2', 'accessibility.item2'] },
  render: () =>
    cluster(
      makeToggle({ 'aria-label': 'Negrito inativo' }),
      makeToggle({ 'aria-label': 'Negrito ativo', pressed: true }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const off = canvas.getByRole('button', { name: 'Negrito inativo' });
    const on = canvas.getByRole('button', { name: 'Negrito ativo' });

    await step('O estado inicial nasce refletido nos dois atributos', async () => {
      await expect(on).toHaveAttribute('aria-pressed', 'true');
      await expect(on).toHaveAttribute('data-state', 'on');
      await expect(off).toHaveAttribute('aria-pressed', 'false');
    });

    await step('O estado ativo tem fundo próprio, não só atributo', async () => {
      const fundoOn = getComputedStyle(on).backgroundColor;
      await expect(fundoOn).not.toBe(getComputedStyle(off).backgroundColor);
      await expect(fundoOn).not.toMatch(/rgba\(0, 0, 0, 0\)|transparent/);
    });

    await step('O contraste do estado ATIVO passa de 4.5:1 nos DOIS temas', async () => {
      // Contraste é aritmética, não olhômetro: o axe não mede ícone (não é
      // texto) e só enxerga o tema claro. Sem esta conta o item de contraste do
      // contrato ficava declarado e nunca verificado. Mede só o estado ativo —
      // é o único par de cores que o componente define; em repouso ele herda
      // as da página.
      const falhas = contrasteDoToggleNosDoisTemas(canvasElement);
      await expect(falhas.length === 0 ? '' : `\n${descreverFalhasDeContraste(falhas)}`).toBe('');
    });
  },
};

// ─── FocusVisible ─────────────────────────────────────────────────────────────

export const FocusVisible: Story = {
  parameters: { covers: ['accessibility.item3'] },
  render: () =>
    cluster(
      makeToggle({ 'aria-label': 'Negrito' }),
      makeToggle({ 'aria-label': 'Itálico', icon: Italic, variant: 'outline' }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const padrao = canvas.getByRole('button', { name: 'Negrito' });
    const contorno = canvas.getByRole('button', { name: 'Itálico' });

    await step('Tab leva o foco ao toggle, na ordem natural do DOM', async () => {
      // userEvent.tab() e não .focus(): o documentado é "recebe foco na ordem
      // natural". Forçar o foco passaria até com tabindex="-1".
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(padrao).toHaveFocus();
    });

    await step('O anel de foco aparece nas DUAS variantes', async () => {
      // Medir `boxShadow !== 'none'` era o que escondia o defeito: a variante
      // outline tem sombra de elevação o tempo todo, e a asserção passava com
      // zero anel. O que prova o anel é a sombra MUDAR ao focar.
      for (const btn of [padrao, contorno]) {
        await expect(medirAnelDeFoco(btn).mudou).toBe(true);
      }
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  parameters: { covers: ['visual.item4', 'functional.item4'] },
  render: () =>
    cluster(
      makeToggle({ 'aria-label': 'Negrito', disabled: true }),
      makeToggle({
        'aria-label': 'Itálico ativo e desabilitado',
        icon: Italic,
        disabled: true,
        pressed: true,
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const off = canvas.getByRole('button', { name: 'Negrito' });
    const on = canvas.getByRole('button', { name: 'Itálico ativo e desabilitado' });

    await step('É o disabled NATIVO, não um aria-disabled', async () => {
      // `disabled` nativo é a forma forte: além de anunciar o estado, tira o
      // elemento da ordem de tabulação. Um `aria-disabled` sozinho anunciaria
      // e deixaria o foco entrar.
      await expect(off).toBeDisabled();
      await expect(on).toBeDisabled();
      await expect(on).toHaveAttribute('data-state', 'on');
    });

    await step('O clique não altera o estado', async () => {
      // Elemento desabilitado não muda de estado em rodada nenhuma — este é o
      // caso em que o clique cego é idempotente por natureza.
      const antes = off.getAttribute('aria-pressed');
      await userEvent.click(off, { pointerEventsCheck: 0 });
      await expect(off.getAttribute('aria-pressed')).toBe(antes);
    });

    await step('O teclado também não alcança o controle', async () => {
      (canvasElement.ownerDocument.activeElement as HTMLElement | null)?.blur();
      await userEvent.tab();
      await expect(off).not.toHaveFocus();
    });
  },
};

// ─── Invalid ──────────────────────────────────────────────────────────────────

export const Invalid: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'xs';

    // A story NÃO pinta o anel: quem pinta é a regra
    // `.nds-toggle[aria-invalid="true"]` da folha compartilhada. Fazer isso à
    // mão (classe extra mais `style.boxShadow`) escondia a ausência da regra e
    // ainda punha valor de design em estilo inline.
    const btn = createToggle({ children: buildLucideSvg(Bold), 'aria-label': 'Negrito' });
    btn.setAttribute('aria-invalid', 'true');
    btn.setAttribute('aria-describedby', 'toggle-invalid-msg');

    const msg = document.createElement('p');
    msg.id = 'toggle-invalid-msg';
    msg.className = 'nds-text-body nds-text-destructive';
    msg.textContent = 'Selecione ao menos uma formatação.';

    wrapper.append(btn, msg);
    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button', { name: 'Negrito' });

    await step('O erro é anunciado pelo par aria-invalid + aria-describedby', async () => {
      await expect(btn).toHaveAttribute('aria-invalid', 'true');
      await expect(btn).toHaveAttribute('aria-describedby', 'toggle-invalid-msg');
      await expect(canvas.getByText('Selecione ao menos uma formatação.')).toBeVisible();
    });

    await step('O anel destrutivo vem do CSS do componente, não da story', async () => {
      await expect(getComputedStyle(btn).boxShadow).not.toBe('none');
    });

    await step('Focar o inválido continua mostrando o foco', async () => {
      await expect(medirAnelDeFoco(btn).mudou).toBe(true);
    });
  },
};
