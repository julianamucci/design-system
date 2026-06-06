import type { Meta, StoryObj } from '@storybook/html';
import { within, expect } from 'storybook/test';
import { toast, injectToastStyles } from './sonner';
import { createSonnerDocs } from '@/components/docs/SonnerDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import { sanitizeHtml } from '@/lib/sanitize-html';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type SonnerArgs = {
  position: 'top-right' | 'top-center' | 'top-left' | 'bottom-right' | 'bottom-center' | 'bottom-left';
  richColors: boolean;
  duration: number;
};

const meta: Meta<SonnerArgs> = {
  title: 'UI/Sonner',
  tags: ['autodocs', 'feedback'],
  parameters: {
    docs: { page: withAutoDocsTab(createSonnerDocs) },
  },
  argTypes: {
    position: {
      control: 'select',
      options: ['top-right', 'top-center', 'top-left', 'bottom-right', 'bottom-center', 'bottom-left'],
      description: 'Posição dos toasts na tela.',
    },
    richColors: {
      control: 'boolean',
      description: 'Aplica cores semânticas do tema para cada tipo de toast.',
    },
    duration: {
      control: 'number',
      description: 'Duração em ms antes do toast fechar automaticamente.',
    },
  },
  args: {
    position: 'top-right',
    richColors: true,
    duration: 4000,
  },
};

export default meta;
type Story = StoryObj<SonnerArgs>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function createLocalToastContainer(position: string): HTMLElement {
  const container = document.createElement('div');
  container.setAttribute('role', 'region');
  container.setAttribute('aria-label', 'Notifications');
  container.setAttribute('data-sonner-toaster', '');
  container.style.cssText = 'position: absolute; z-index: 9999; pointer-events: none; max-width: 420px; width: 100%;';

  const posMap: Record<string, string> = {
    'top-right':     'top: 1rem; right: 1rem;',
    'top-center':    'top: 1rem; left: 50%; transform: translateX(-50%);',
    'top-left':      'top: 1rem; left: 1rem;',
    'bottom-right':  'bottom: 1rem; right: 1rem;',
    'bottom-center': 'bottom: 1rem; left: 50%; transform: translateX(-50%);',
    'bottom-left':   'bottom: 1rem; left: 1rem;',
  };
  container.style.cssText += posMap[position] ?? posMap['top-right'];
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.gap = '0.5rem';

  return container;
}

function fireLocalToast(
  type: 'default' | 'success' | 'error' | 'warning' | 'info' | 'loading',
  message: string,
  container: HTMLElement,
  opts: { description?: string; richColors?: boolean; duration?: number; action?: { label: string; onClick: () => void } } = {},
): void {
  injectToastStyles();

  const ICONS: Record<string, string> = {
    default:  '',
    success:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
    error:    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>',
    warning:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
    info:     '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    loading:  '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="ds-toast-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>',
  };

  type ToastStyle = { bg: string; color: string; borderColor: string };
  const RICH_COLORS: Record<string, ToastStyle> = {
    default: { bg: 'var(--background)',  color: 'var(--foreground)', borderColor: 'var(--border)' },
    success: { bg: '#f0fdf4',            color: '#166534',           borderColor: '#bbf7d0' },
    error:   { bg: '#fef2f2',            color: '#991b1b',           borderColor: '#fecaca' },
    warning: { bg: '#fefce8',            color: '#854d0e',           borderColor: '#fef08a' },
    info:    { bg: '#eff6ff',            color: '#1e40af',           borderColor: '#bfdbfe' },
    loading: { bg: 'var(--background)',  color: 'var(--foreground)', borderColor: 'var(--border)' },
  };

  const richColors = opts.richColors ?? true;
  const duration = opts.duration ?? (type === 'loading' ? undefined : 4000);

  const toastEl = document.createElement('div');
  toastEl.setAttribute('data-sonner-toast', '');
  toastEl.setAttribute('role', 'status');
  toastEl.setAttribute('aria-live', 'polite');
  const palette = richColors ? (RICH_COLORS[type] ?? RICH_COLORS.default) : RICH_COLORS.default;
  toastEl.className = 'nds-cluster nds-w-full nds-rounded-lg nds-p-4 nds-shadow-lg';
  toastEl.dataset.spacing = 'sm';
  toastEl.dataset.align = 'start';
  toastEl.style.pointerEvents = 'auto';
  toastEl.style.background = palette.bg;
  toastEl.style.color = palette.color;
  toastEl.style.border = `1px solid ${palette.borderColor}`;
  toastEl.style.transition = 'opacity 200ms, transform 200ms';
  toastEl.style.opacity = '0';
  toastEl.style.transform = 'translateY(8px)';

  if (ICONS[type]) {
    const iconWrap = document.createElement('span');
    iconWrap.className = 'nds-shrink-0';
    iconWrap.style.marginTop = '0.125rem';
    iconWrap.setAttribute('aria-hidden', 'true');
    iconWrap.innerHTML = sanitizeHtml(ICONS[type]);
    toastEl.appendChild(iconWrap);
  }

  const contentEl = document.createElement('div');
  contentEl.className = 'nds-flex-1 nds-min-w-0';

  const titleEl = document.createElement('p');
  titleEl.className = 'nds-text-body nds-font-medium';
  titleEl.textContent = message;
  contentEl.appendChild(titleEl);

  if (opts.description) {
    const descEl = document.createElement('p');
    descEl.className = 'nds-text-body nds-text-muted-foreground nds-mt-1';
    descEl.textContent = opts.description;
    contentEl.appendChild(descEl);
  }

  if (opts.action) {
    const actionBtn = document.createElement('button');
    actionBtn.type = 'button';
    actionBtn.className = 'nds-mt-2 nds-text-body nds-font-medium nds-text-primary nds-hover-underline';
    actionBtn.style.textUnderlineOffset = '4px';
    actionBtn.textContent = opts.action.label;
    actionBtn.addEventListener('click', () => {
      opts.action!.onClick();
      toastEl.style.opacity = '0';
      setTimeout(() => toastEl.remove(), 200);
    });
    contentEl.appendChild(actionBtn);
  }

  toastEl.appendChild(contentEl);

  // close button
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.className = 'nds-shrink-0 nds-text-muted-foreground nds-hover-text-foreground';
  closeBtn.style.transition = 'color 150ms';
  closeBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>';
  closeBtn.addEventListener('click', () => {
    toastEl.style.opacity = '0';
    setTimeout(() => toastEl.remove(), 200);
  });
  toastEl.appendChild(closeBtn);

  container.appendChild(toastEl);

  requestAnimationFrame(() => {
    toastEl.style.opacity = '1';
    toastEl.style.transform = 'translateY(0)';
  });

  if (duration !== undefined) {
    setTimeout(() => {
      toastEl.style.opacity = '0';
      toastEl.style.transform = 'translateY(8px)';
      setTimeout(() => toastEl.remove(), 200);
    }, duration);
  }
}

function createPlaygroundWrapper(args: SonnerArgs): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.cssText = 'position: relative; contain: layout; min-height: 200px; padding: 1.5rem; display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: flex-start;';

  const toastContainer = createLocalToastContainer(args.position);
  wrapper.appendChild(toastContainer);

  const btnConfigs: Array<{ label: string; fn: () => void }> = [
    { label: 'Default',  fn: () => fireLocalToast('default',  'Código copiado.',                      toastContainer, { richColors: args.richColors, duration: args.duration }) },
    { label: 'Success',  fn: () => fireLocalToast('success',  'Alterações salvas.',                   toastContainer, { richColors: args.richColors, duration: args.duration }) },
    { label: 'Error',    fn: () => fireLocalToast('error',    'Não foi possível salvar.',              toastContainer, { richColors: args.richColors, duration: args.duration }) },
    { label: 'Warning',  fn: () => fireLocalToast('warning',  'Sua sessão expira em 5 minutos.',      toastContainer, { richColors: args.richColors, duration: args.duration }) },
    { label: 'Info',     fn: () => fireLocalToast('info',     'Nova versão disponível.',              toastContainer, { richColors: args.richColors, duration: args.duration }) },
    { label: 'Loading',  fn: () => fireLocalToast('loading',  'Enviando arquivo...',                  toastContainer, { richColors: args.richColors }) },
  ];

  for (const { label, fn } of btnConfigs) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    btn.className = 'btn btn-outline';
    btn.addEventListener('click', fn);
    wrapper.appendChild(btn);
  }

  return wrapper;
}

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  render: (args) => createPlaygroundWrapper(args),
  play: async ({ canvasElement, step }) => {
    await step('Wrapper do playground está presente', async () => {
      const wrapper = canvasElement.querySelector('[style*="contain: layout"]');
      await expect(wrapper).toBeTruthy();
    });

    await step('Botões de disparo estão presentes', async () => {
      const buttons = canvasElement.querySelectorAll('button');
      await expect(buttons.length).toBeGreaterThanOrEqual(6);
    });
  },
};
