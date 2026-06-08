import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, userEvent } from 'storybook/test';
import { injectToastStyles } from './sonner';
import { sanitizeHtml } from '@/lib/sanitize-html';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  tags: ['feedback'],
  title: 'UI/Sonner/Composicoes',
  parameters: {
    actions: { disable: true },
    controls: { disable: true },
    docs: {
      description: {
        component: 'Composicoes de toast: com descrição, com ação, promise e persistente.',
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
  const RICH_COLORS: Record<string, { bg: string; color: string; borderColor: string }> = {
    default: { bg: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border)' },
    success: { bg: '#f0fdf4',           color: '#166534',           borderColor: '#bbf7d0' },
    error:   { bg: '#fef2f2',           color: '#991b1b',           borderColor: '#fecaca' },
    info:    { bg: '#eff6ff',           color: '#1e40af',           borderColor: '#bfdbfe' },
    loading: { bg: 'var(--background)', color: 'var(--foreground)', borderColor: 'var(--border)' },
  };

  const ICONS: Record<string, string> = {
    default:  '',
    success:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
    error:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
    info:     '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    loading:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ds-toast-spin" aria-hidden="true"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
  };

  const palette = RICH_COLORS[opts.type] ?? RICH_COLORS.default;

  const toastEl = document.createElement('div');
  toastEl.setAttribute('data-sonner-toast', '');
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  toastEl.className = 'nds-cluster nds-w-full nds-max-w-sm nds-rounded-lg nds-p-4 nds-shadow-lg';
  toastEl.dataset.spacing = 'sm';
  toastEl.dataset.align = 'start';
  toastEl.style.pointerEvents = 'auto';
  toastEl.style.background = palette.bg;
  toastEl.style.color = palette.color;
  toastEl.style.border = `1px solid ${palette.borderColor}`;

  const icon = ICONS[opts.type];
  if (icon) {
    const iconWrap = document.createElement('span');
    iconWrap.className = 'nds-shrink-0';
    iconWrap.style.marginTop = '0.125rem';
    iconWrap.innerHTML = sanitizeHtml(icon);
    toastEl.appendChild(iconWrap);
  }

  const contentEl = document.createElement('div');
  contentEl.className = 'nds-flex-1 nds-min-w-0';

  const titleEl = document.createElement('p');
  titleEl.className = 'nds-text-body nds-font-medium';
  titleEl.textContent = opts.message;
  contentEl.appendChild(titleEl);

  if (opts.description) {
    const descEl = document.createElement('p');
    descEl.className = 'nds-text-body nds-text-muted-foreground nds-mt-1';
    descEl.textContent = opts.description;
    contentEl.appendChild(descEl);
  }

  if (opts.actionLabel && opts.onAction) {
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'nds-mt-2 nds-text-body nds-font-medium nds-text-primary nds-hover-underline';
    actionBtn.style.textUnderlineOffset = '4px';
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
  closeBtn.className = 'nds-shrink-0 nds-text-muted-foreground nds-hover-text-foreground';
  closeBtn.style.transition = 'color 150ms';
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
  btn.className = 'btn btn-outline';
  btn.style.alignSelf = 'flex-start';

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
      const desc = canvasElement.querySelector('.nds-text-muted-foreground');
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
    btn.className = 'btn btn-outline';
  btn.style.alignSelf = 'flex-start';

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
