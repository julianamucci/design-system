import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, userEvent } from 'storybook/test';
import { Bold } from 'lucide';
import { createToggle } from './toggle';

const meta: Meta = {
  tags: ['form'],
  title: 'UI/Toggle/Estados',
  parameters: {
    actions: { disable: true },
    layout: 'centered',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Estados do Toggle: Off, On, Disabled (off), DisabledOn, Invalid (aria-invalid) e FocoVisivel. O factory custom Basecoat aplica `aria-pressed` + `data-state` automaticamente no click — para estados visuais como invalid, basta setar atributos extras no botão retornado.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Lucide helper ────────────────────────────────────────────────────────────

type LucideIconNode = [string, Record<string, string>];

function buildBoldIcon(): SVGSVGElement {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('fill', 'none');
  svg.setAttribute('stroke', 'currentColor');
  svg.setAttribute('stroke-width', '2');
  svg.setAttribute('stroke-linecap', 'round');
  svg.setAttribute('stroke-linejoin', 'round');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'nds-icon-sm');
  for (const [tag, attrs] of Bold as unknown as LucideIconNode[]) {
    const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
    svg.appendChild(child);
  }
  return svg;
}

function wrapBoldIcon(): HTMLSpanElement {
  const span = document.createElement('span');
  span.style.display = 'inline-flex';
  span.appendChild(buildBoldIcon());
  return span;
}

function makeToggle(opts: { pressed?: boolean; disabled?: boolean; ariaLabel?: string }): HTMLButtonElement {
  const btn = createToggle({
    pressed: opts.pressed ?? false,
    disabled: opts.disabled ?? false,
    children: wrapBoldIcon(),
  });
  btn.setAttribute('aria-label', opts.ariaLabel ?? 'Negrito');
  return btn;
}

// ─── Off ──────────────────────────────────────────────────────────────────────

export const Off: Story = {
  render: () => makeToggle({ pressed: false }),
  parameters: {
    docs: { description: { story: 'Estado padrão inativo (`aria-pressed="false"`, `data-state="off"`). Fundo transparente.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button');
    await step('aria-pressed é "false"', async () => {
      await expect(btn).toHaveAttribute('aria-pressed', 'false');
    });
    await step('data-state é "off"', async () => {
      await expect(btn).toHaveAttribute('data-state', 'off');
    });
  },
};

// ─── On ───────────────────────────────────────────────────────────────────────

export const On: Story = {
  render: () => makeToggle({ pressed: true }),
  parameters: {
    docs: { description: { story: 'Estado ativo (`aria-pressed="true"`, `data-state="on"`). Fundo `bg-accent`.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button');
    await step('aria-pressed é "true"', async () => {
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
    });
    await step('data-state é "on"', async () => {
      await expect(btn).toHaveAttribute('data-state', 'on');
    });
  },
};

// ─── Disabled ─────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  render: () => makeToggle({ pressed: false, disabled: true }),
  parameters: {
    docs: { description: { story: 'Toggle desabilitado em estado off. `opacity-50`, `pointer-events-none`, não responde a clique nem teclado.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button');
    await step('Atributo disabled presente', async () => {
      await expect(btn).toBeDisabled();
    });
    await step('Clique não altera o estado', async () => {
      await userEvent.click(btn, { pointerEventsCheck: 0 });
      await expect(btn).toHaveAttribute('aria-pressed', 'false');
    });
  },
};

// ─── DisabledOn ───────────────────────────────────────────────────────────────

export const DisabledOn: Story = {
  render: () => makeToggle({ pressed: true, disabled: true }),
  parameters: {
    docs: { description: { story: 'Toggle desabilitado em estado on. Estado preservado, mas bloqueado para edição.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button');
    await step('Permanece pressionado', async () => {
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
    });
    await step('Clique não muda nada', async () => {
      await userEvent.click(btn, { pointerEventsCheck: 0 });
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
    });
  },
};

// ─── Invalid ──────────────────────────────────────────────────────────────────

export const Invalid: Story = {
  render: () => {
    const wrapper = document.createElement('div');
    wrapper.className = 'nds-stack';
    wrapper.dataset.spacing = 'xs';
    wrapper.style.alignItems = 'flex-start';

    const btn = makeToggle({ pressed: false, ariaLabel: 'Aceitar termos' });
    btn.setAttribute('aria-invalid', 'true');
    btn.setAttribute('aria-describedby', 'toggle-invalid-msg');
    btn.classList.add('nds-border-destructive');
    btn.style.boxShadow = '0 0 0 2px color-mix(in srgb, var(--destructive) 20%, transparent)';

    const msg = document.createElement('p');
    msg.id = 'toggle-invalid-msg';
    msg.className = 'nds-text-body nds-text-destructive';
    msg.textContent = 'Você precisa ativar esta opção para continuar.';

    wrapper.append(btn, msg);
    return wrapper;
  },
  parameters: {
    docs: { description: { story: 'Estado de erro via `aria-invalid="true"`. Adicionamos borda + anel `destructive` manualmente e associamos a mensagem via `aria-describedby`.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button');
    await step('aria-invalid presente', async () => {
      await expect(btn).toHaveAttribute('aria-invalid', 'true');
    });
    await step('aria-describedby aponta para a mensagem', async () => {
      await expect(btn).toHaveAttribute('aria-describedby', 'toggle-invalid-msg');
    });
  },
};

// ─── FocoVisivel ──────────────────────────────────────────────────────────────

export const FocoVisivel: Story = {
  render: () => makeToggle({ pressed: false }),
  parameters: {
    docs: { description: { story: 'Estado de foco via teclado. Pressione Tab para navegar — anel `ring-1 ring-ring` visível. Space/Enter alternam.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const btn = canvas.getByRole('button');

    await step('Toggle recebe foco programaticamente', async () => {
      (btn as HTMLElement).focus();
      await expect(btn).toHaveFocus();
    });

    await step('Space alterna o estado quando focado', async () => {
      await userEvent.keyboard(' ');
      await expect(btn).toHaveAttribute('aria-pressed', 'true');
    });

    await step('Enter alterna novamente', async () => {
      await userEvent.keyboard('{Enter}');
      await expect(btn).toHaveAttribute('aria-pressed', 'false');
    });
  },
};
