import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, userEvent } from 'storybook/test';
import { injectToastStyles } from './sonner';
import { sanitizeHtml } from '@/lib/sanitize-html';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Sonner/Composições',
  parameters: {
    controls: { disable: true },
    docs: {
      description: {
        component: 'Composições de toast: com descrição, com ação, promise e persistente.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildToastEl(opts: {
  type: 'default' | 'success' | 'error' | 'info' | 'loading';
  message: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  persistent?: boolean;
}): HTMLElement {
  const RICH_COLORS: Record<string, string> = {
    default: 'bg-background text-foreground border-border',
    success: 'bg-green-50 text-green-800 border-green-200',
    error:   'bg-red-50 text-red-800 border-red-200',
    info:    'bg-blue-50 text-blue-800 border-blue-200',
    loading: 'bg-background text-foreground border-border',
  };

  const ICONS: Record<string, string> = {
    default:  '',
    success:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
    error:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
    info:     '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    loading:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ds-toast-spin" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
  };

  const colorClass = RICH_COLORS[opts.type] ?? RICH_COLORS.default;

  const toastEl = document.createElement('div');
  toastEl.setAttribute('data-sonner-toast', '');
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  toastEl.className = `pointer-events-auto w-full max-w-sm rounded-lg border p-4 shadow-lg flex items-start gap-3 ${colorClass}`;

  const icon = ICONS[opts.type];
  if (icon) {
    const iconWrap = document.createElement('span');
    iconWrap.className = 'flex-shrink-0 mt-0.5';
    iconWrap.innerHTML = sanitizeHtml(icon);
    toastEl.appendChild(iconWrap);
  }

  const contentEl = document.createElement('div');
  contentEl.className = 'flex-1 min-w-0';

  const titleEl = document.createElement('p');
  titleEl.className = 'text-sm font-medium';
  titleEl.textContent = opts.message;
  contentEl.appendChild(titleEl);

  if (opts.description) {
    const descEl = document.createElement('p');
    descEl.className = 'text-sm text-muted-foreground mt-1';
    descEl.textContent = opts.description;
    contentEl.appendChild(descEl);
  }

  if (opts.actionLabel && opts.onAction) {
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'mt-2 text-sm font-medium text-primary hover:text-primary/80 underline-offset-4 hover:underline';
    actionBtn.textContent = opts.actionLabel;
    actionBtn.dataset.actionBtn = 'true';
    actionBtn.addEventListener('click', () => {
      opts.onAction!();
      toastEl.style.opacity = '0';
      setTimeout(() => toastEl.remove(), 200);
    });
    contentEl.appendChild(actionBtn);
  }

  toastEl.appendChild(contentEl);

  // close button (always shown; for persistent toasts it's the only way to close)
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Fechar');
  closeBtn.className = 'flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors';
  closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  closeBtn.addEventListener('click', () => {
    toastEl.style.opacity = '0';
    setTimeout(() => toastEl.remove(), 200);
  });
  toastEl.appendChild(closeBtn);

  return toastEl;
}

function createComposicaoStory(opts: {
  btnLabel: string;
  buildFn: () => HTMLElement;
  previewFn: () => HTMLElement;
  persistent?: boolean;
}): HTMLElement {
  injectToastStyles();

  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position: relative; contain: layout; min-height: 140px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;';

  const toastContainer = document.createElement('div');
  toastContainer.style.cssText = 'position: absolute; top: 5rem; right: 1rem; display: flex; flex-direction: column; gap: 0.5rem; pointer-events: none; max-width: 420px; width: 100%;';

  const btn = document.createElement('button');
  btn.type = 'button';
  btn.textContent = opts.btnLabel;
  btn.className = 'inline-flex self-start items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2';

  btn.addEventListener('click', () => {
    const toastEl = opts.buildFn();
    toastEl.style.opacity = '0';
    toastEl.style.transform = 'translateY(8px)';
    toastContainer.appendChild(toastEl);

    requestAnimationFrame(() => {
      toastEl.style.transition = 'opacity 200ms, transform 200ms';
      toastEl.style.opacity = '1';
      toastEl.style.transform = 'translateY(0)';
    });

    if (!opts.persistent) {
      setTimeout(() => {
        toastEl.style.opacity = '0';
        toastEl.style.transform = 'translateY(8px)';
        setTimeout(() => toastEl.remove(), 200);
      }, 4000);
    }
  });

  wrapper.appendChild(btn);
  wrapper.appendChild(toastContainer);

  // Static preview
  const preview = opts.previewFn();
  preview.style.maxWidth = '420px';
  wrapper.appendChild(preview);

  return wrapper;
}

// ─── WithDescription ──────────────────────────────────────────────────────────

export const WithDescription: Story = {
  render: () => createComposicaoStory({
    btnLabel: 'Com descrição',
    buildFn: () => buildToastEl({
      type: 'default',
      message: 'Preferências atualizadas.',
      description: 'Suas configurações foram salvas e entrarão em vigor na próxima sessão.',
    }),
    previewFn: () => buildToastEl({
      type: 'default',
      message: 'Preferências atualizadas.',
      description: 'Suas configurações foram salvas e entrarão em vigor na próxima sessão.',
    }),
  }),
  play: async ({ canvasElement, step }) => {
    await step('Toast com descrição renderizado', async () => {
      const toast = canvasElement.querySelector('[data-sonner-toast]');
      await expect(toast).toBeTruthy();
    });

    await step('Descrição está presente no toast', async () => {
      const desc = canvasElement.querySelector('.text-muted-foreground');
      await expect(desc).toBeTruthy();
    });
  },
};

// ─── WithAction ───────────────────────────────────────────────────────────────

export const WithAction: Story = {
  render: () => createComposicaoStory({
    btnLabel: 'Com ação',
    buildFn: () => buildToastEl({
      type: 'default',
      message: 'Item excluído.',
      actionLabel: 'Desfazer',
      onAction: () => { /* undo logic */ },
    }),
    previewFn: () => buildToastEl({
      type: 'default',
      message: 'Item excluído.',
      actionLabel: 'Desfazer',
      onAction: () => { /* undo logic */ },
    }),
  }),
  play: async ({ canvasElement, step }) => {
    await step('Toast com ação renderizado', async () => {
      const toast = canvasElement.querySelector('[data-sonner-toast]');
      await expect(toast).toBeTruthy();
    });

    await step('Botão de ação está presente', async () => {
      const actionBtn = canvasElement.querySelector('[data-action-btn]');
      await expect(actionBtn).toBeTruthy();
    });
  },
};

// ─── WithPromise ──────────────────────────────────────────────────────────────

export const WithPromise: Story = {
  render: () => {
    injectToastStyles();

    const wrapper = document.createElement('div');
    wrapper.style.cssText = 'position: relative; contain: layout; min-height: 140px; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem;';

    const toastContainer = document.createElement('div');
    toastContainer.style.cssText = 'position: absolute; top: 5rem; right: 1rem; display: flex; flex-direction: column; gap: 0.5rem; pointer-events: none; max-width: 420px; width: 100%;';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = 'Com promise';
    btn.className = 'inline-flex self-start items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2';

    btn.addEventListener('click', () => {
      // Show loading toast
      const loadingEl = buildToastEl({ type: 'loading', message: 'Enviando arquivo...' });
      loadingEl.style.opacity = '0';
      loadingEl.style.transform = 'translateY(8px)';
      toastContainer.appendChild(loadingEl);

      requestAnimationFrame(() => {
        loadingEl.style.transition = 'opacity 200ms, transform 200ms';
        loadingEl.style.opacity = '1';
        loadingEl.style.transform = 'translateY(0)';
      });

      // Simulate async operation (2s)
      const fakePromise = new Promise<void>(resolve => setTimeout(resolve, 2000));

      fakePromise.then(() => {
        loadingEl.style.opacity = '0';
        setTimeout(() => {
          loadingEl.remove();
          const successEl = buildToastEl({ type: 'success', message: 'Arquivo enviado com sucesso.' });
          successEl.style.opacity = '0';
          successEl.style.transform = 'translateY(8px)';
          toastContainer.appendChild(successEl);
          requestAnimationFrame(() => {
            successEl.style.transition = 'opacity 200ms, transform 200ms';
            successEl.style.opacity = '1';
            successEl.style.transform = 'translateY(0)';
          });
          setTimeout(() => {
            successEl.style.opacity = '0';
            setTimeout(() => successEl.remove(), 200);
          }, 4000);
        }, 200);
      });
    });

    wrapper.appendChild(btn);
    wrapper.appendChild(toastContainer);

    // Static preview — loading state
    const preview = buildToastEl({ type: 'loading', message: 'Enviando arquivo...' });
    preview.style.maxWidth = '420px';
    wrapper.appendChild(preview);

    return wrapper;
  },
  play: async ({ canvasElement, step }) => {
    await step('Toast loading (promise) renderizado', async () => {
      const toast = canvasElement.querySelector('[data-sonner-toast]');
      await expect(toast).toBeTruthy();
    });
  },
};

// ─── Persistent ───────────────────────────────────────────────────────────────

export const Persistent: Story = {
  render: () => createComposicaoStory({
    btnLabel: 'Persistente',
    persistent: true,
    buildFn: () => buildToastEl({
      type: 'error',
      message: 'Falha crítica no servidor.',
      description: 'Feche este aviso apenas após resolver o problema.',
    }),
    previewFn: () => buildToastEl({
      type: 'error',
      message: 'Falha crítica no servidor.',
      description: 'Feche este aviso apenas após resolver o problema.',
    }),
  }),
  play: async ({ canvasElement, step }) => {
    await step('Toast persistente renderizado', async () => {
      const toast = canvasElement.querySelector('[data-sonner-toast]');
      await expect(toast).toBeTruthy();
    });

    await step('Botão de fechar está presente', async () => {
      const closeBtn = canvasElement.querySelector('[aria-label="Fechar"]');
      await expect(closeBtn).toBeTruthy();
    });
  },
};
