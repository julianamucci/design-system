import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { injectToastStyles } from './sonner';
import { sanitizeHtml } from '@/lib/sanitize-html';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Sonner/Tipos',
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component: 'Tipos semânticos de toast. Cada tipo carrega ícone e cor correspondentes quando richColors está ativo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ICONS: Record<string, string> = {
  default:  '',
  success:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
  error:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
  warning:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
  info:     '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
  loading:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ds-toast-spin" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
};

const RICH_COLORS: Record<string, string> = {
  default: 'bg-background text-foreground border-border',
  success: 'bg-green-50 text-green-800 border-green-200',
  error:   'bg-red-50 text-red-800 border-red-200',
  warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  info:    'bg-blue-50 text-blue-800 border-blue-200',
  loading: 'bg-background text-foreground border-border',
};

function buildToastEl(type: string, message: string): HTMLElement {
  const colorClass = RICH_COLORS[type] ?? RICH_COLORS.default;
  const toastEl = document.createElement('div');
  toastEl.setAttribute('data-sonner-toast', '');
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  toastEl.className = `pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-lg flex items-start gap-3 ${colorClass}`;

  if (ICONS[type]) {
    const iconWrap = document.createElement('span');
    iconWrap.className = 'flex-shrink-0 mt-0.5';
    iconWrap.innerHTML = sanitizeHtml(ICONS[type]);
    toastEl.appendChild(iconWrap);
  }

  const contentEl = document.createElement('div');
  contentEl.className = 'flex-1 min-w-0';
  const titleEl = document.createElement('p');
  titleEl.className = 'text-sm font-medium';
  titleEl.textContent = message;
  contentEl.appendChild(titleEl);
  toastEl.appendChild(contentEl);

  return toastEl;
}

function createToastTipoStory(
  type: string,
  btnLabel: string,
  message: string,
): HTMLElement {
  injectToastStyles();

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position: relative; contain: layout; min-height: 120px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;';

  const toastContainer = document.createElement('div');
  toastContainer.style.cssText = 'position: absolute; top: 4rem; right: 1rem; display: flex; flex-direction: column; gap: 0.5rem; pointer-events: none; max-width: 420px; width: 100%;';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = btnLabel;
  btn.className = 'inline-flex self-start items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2';

  btn.addEventListener('click', () => {
    const toastEl = buildToastEl(type, message);
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateY(8px)';
    toastContainer.appendChild(toastEl);

    requestAnimationFrame(() => {
      toastEl.style.transition = 'opacity 200ms, transform 200ms';
      toastEl.style.opacity = '1';
      toastEl.style.transform = 'translateY(0)';
    });

    if (type !== 'loading') {
      setTimeout(() => {
        toastEl.style.opacity = '0';
        toastEl.style.transform = 'translateY(8px)';
        setTimeout(() => toastEl.remove(), 200);
      }, 4000);
    }
  });

  wrapper.appendChild(btn);
  wrapper.appendChild(toastContainer);

  // Show a static preview toast immediately
  const preview = buildToastEl(type, message);
  preview.style.maxWidth = '420px';
  wrapper.appendChild(preview);

  return wrapper;
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: () => createToastTipoStory('default', 'Disparar default', 'Código copiado.'),
  play: async ({ canvasElement, step }) => {
    await step('Toast default renderizado', async () => {
      const toast = canvasElement.querySelector('[data-sonner-toast]');
      await expect(toast).toBeTruthy();
    });
  },
};

export const Success: Story = {
  render: () => createToastTipoStory('success', 'Disparar success', 'Alterações salvas.'),
  play: async ({ canvasElement, step }) => {
    await step('Toast success renderizado', async () => {
      const toast = canvasElement.querySelector('[data-sonner-toast]');
      await expect(toast).toBeTruthy();
    });
  },
};

export const Error: Story = {
  render: () => createToastTipoStory('error', 'Disparar error', 'Não foi possível salvar. Tente novamente.'),
  play: async ({ canvasElement, step }) => {
    await step('Toast error renderizado', async () => {
      const toast = canvasElement.querySelector('[data-sonner-toast]');
      await expect(toast).toBeTruthy();
    });
  },
};

export const Warning: Story = {
  render: () => createToastTipoStory('warning', 'Disparar warning', 'Sua sessão expira em 5 minutos.'),
  play: async ({ canvasElement, step }) => {
    await step('Toast warning renderizado', async () => {
      const toast = canvasElement.querySelector('[data-sonner-toast]');
      await expect(toast).toBeTruthy();
    });
  },
};

export const Info: Story = {
  render: () => createToastTipoStory('info', 'Disparar info', 'Nova versão disponível.'),
  play: async ({ canvasElement, step }) => {
    await step('Toast info renderizado', async () => {
      const toast = canvasElement.querySelector('[data-sonner-toast]');
      await expect(toast).toBeTruthy();
    });
  },
};

export const Loading: Story = {
  render: () => createToastTipoStory('loading', 'Disparar loading', 'Enviando arquivo...'),
  play: async ({ canvasElement, step }) => {
    await step('Toast loading renderizado', async () => {
      const toast = canvasElement.querySelector('[data-sonner-toast]');
      await expect(toast).toBeTruthy();
    });
  },
};
