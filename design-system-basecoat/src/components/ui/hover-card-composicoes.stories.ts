import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, waitFor } from 'storybook/test';
import { createHoverCard } from './hover-card';

const meta: Meta = {
  title: 'UI/HoverCard/Composições',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composições do HoverCard: PerfilDeUsuario (avatar + bio + métrica), PreviewDeLink (favicon + URL + título), DefinicaoDeTermo (texto explicativo) e MetricaExplicada (KPI + descrição em dashboard).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function wrap(child: HTMLElement): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.style.contain = 'layout';
  wrapper.className = 'w-full min-h-[260px] flex items-center justify-center';
  wrapper.appendChild(child);
  return wrapper;
}

function buildLink(label: string, href = '/preview'): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  a.className = 'underline underline-offset-4 text-sm font-medium text-primary';
  a.textContent = label;
  return a;
}

function buildSpan(label: string): HTMLElement {
  const s = document.createElement('button');
  s.type = 'button';
  s.className =
    'underline underline-offset-4 decoration-dotted text-sm font-medium text-primary cursor-help bg-transparent border-0 p-0';
  s.textContent = label;
  return s;
}

async function waitForOpen(): Promise<void> {
  const body = within(document.body);
  await waitFor(() => {
    if (!body.queryByRole('dialog')) throw new Error('hover card fechado');
  }, { timeout: 2000 });
}

async function cleanupPortal(): Promise<void> {
  document.querySelectorAll('[data-slot="hover-card-content"]').forEach((n) => n.remove());
  const body = within(document.body);
  await waitFor(() => {
    if (body.queryByRole('dialog')) throw new Error('still open');
  });
}

function fireOpen(trigger: HTMLElement): void {
  queueMicrotask(() => {
    trigger.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
  });
}

// ─── Stories ──────────────────────────────────────────────────────────────────

export const PerfilDeUsuario: Story = {
  name: 'Perfil de Usuário',
  render: () => {
    const trigger = buildLink('@joana');

    const content = document.createElement('div');
    content.className = 'flex gap-3 items-start';

    const avatar = document.createElement('div');
    avatar.className =
      'flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground text-sm font-medium';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'JS';

    const info = document.createElement('div');
    info.className = 'flex flex-col gap-1';

    const name = document.createElement('p');
    name.className = 'text-sm font-medium leading-none';
    name.textContent = 'Joana Silva';

    const handle = document.createElement('p');
    handle.className = 'text-xs text-muted-foreground';
    handle.textContent = '@joana · Designer';

    const bio = document.createElement('p');
    bio.className = 'text-xs leading-snug';
    bio.textContent = 'Trabalhando em sistemas de design acessíveis. 142 seguidores.';

    info.append(name, handle, bio);
    content.append(avatar, info);

    const el = createHoverCard({ trigger, content });
    fireOpen(trigger);
    return wrap(el);
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Content mostra perfil com avatar + nome + bio', async () => {
      await waitForOpen();
      const dialog = await body.findByRole('dialog');
      await expect(dialog).toBeVisible();
      await expect(dialog.textContent).toMatch(/Joana Silva/);
      await expect(dialog.textContent).toMatch(/Designer/);
    });
    await step('Cleanup', async () => {
      await cleanupPortal();
    });
  },
};

export const PreviewDeLink: Story = {
  name: 'Preview de Link',
  render: () => {
    const trigger = buildLink('design-system.dev', 'https://design-system.dev');

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-2';

    const header = document.createElement('div');
    header.className = 'flex items-center gap-2';

    const favicon = document.createElement('div');
    favicon.className = 'h-4 w-4 rounded-sm bg-primary';
    favicon.setAttribute('aria-hidden', 'true');

    const url = document.createElement('p');
    url.className = 'text-xs text-muted-foreground truncate';
    url.textContent = 'design-system.dev';

    header.append(favicon, url);

    const title = document.createElement('p');
    title.className = 'text-sm font-medium leading-snug';
    title.textContent = 'Design System — Documentação completa';

    const desc = document.createElement('p');
    desc.className = 'text-xs text-muted-foreground leading-snug';
    desc.textContent = 'Componentes acessíveis em React, Vue, Svelte e Basecoat.';

    content.append(header, title, desc);

    const el = createHoverCard({ trigger, content });
    fireOpen(trigger);
    return wrap(el);
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Content mostra preview de link com URL e título', async () => {
      await waitForOpen();
      const dialog = await body.findByRole('dialog');
      await expect(dialog.textContent).toMatch(/design-system\.dev/);
      await expect(dialog.textContent).toMatch(/Documentação completa/);
    });
    await step('Cleanup', async () => {
      await cleanupPortal();
    });
  },
};

export const DefinicaoDeTermo: Story = {
  name: 'Definição de Termo',
  render: () => {
    const trigger = buildSpan('WCAG 2.1 AA');

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-1';

    const term = document.createElement('p');
    term.className = 'text-sm font-medium';
    term.textContent = 'WCAG 2.1 AA';

    const def = document.createElement('p');
    def.className = 'text-xs text-muted-foreground leading-snug';
    def.textContent =
      'Web Content Accessibility Guidelines 2.1 — nível AA. Diretrizes de acessibilidade para conteúdo web, incluindo contraste mínimo 4.5:1 e operação por teclado.';

    content.append(term, def);

    const el = createHoverCard({ trigger, content });
    fireOpen(trigger);
    return wrap(el);
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Content mostra definição do termo', async () => {
      await waitForOpen();
      const dialog = await body.findByRole('dialog');
      await expect(dialog.textContent).toMatch(/WCAG/);
      await expect(dialog.textContent).toMatch(/Web Content Accessibility/);
    });
    await step('Cleanup', async () => {
      await cleanupPortal();
    });
  },
};

export const MetricaExplicada: Story = {
  name: 'Métrica Explicada',
  render: () => {
    const trigger = buildSpan('LCP 1.8s');

    const content = document.createElement('div');
    content.className = 'flex flex-col gap-2';

    const head = document.createElement('div');
    head.className = 'flex items-baseline justify-between gap-2';

    const metric = document.createElement('p');
    metric.className = 'text-sm font-medium';
    metric.textContent = 'Largest Contentful Paint';

    const value = document.createElement('span');
    value.className = 'text-xs font-medium text-emerald-600';
    value.textContent = '1.8s';

    head.append(metric, value);

    const desc = document.createElement('p');
    desc.className = 'text-xs text-muted-foreground leading-snug';
    desc.textContent =
      'Tempo até o maior elemento visível ser renderizado. Bom: <2.5s · Ruim: >4s.';

    content.append(head, desc);

    const el = createHoverCard({ trigger, content });
    fireOpen(trigger);
    return wrap(el);
  },
  play: async ({ step }) => {
    const body = within(document.body);
    await step('Content explica a métrica', async () => {
      await waitForOpen();
      const dialog = await body.findByRole('dialog');
      await expect(dialog.textContent).toMatch(/Largest Contentful Paint/);
      await expect(dialog.textContent).toMatch(/1\.8s/);
    });
    await step('Cleanup', async () => {
      await cleanupPortal();
    });
  },
};
