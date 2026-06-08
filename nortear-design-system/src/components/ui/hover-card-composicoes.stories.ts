import type { Meta, StoryObj } from '@storybook/html';
import { within, expect, waitFor } from 'storybook/test';
import { createHoverCard } from './hover-card';

const meta: Meta = {
  tags: ['overlay'],
  title: 'UI/HoverCard/Composicoes',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      description: {
        component:
          'Composicoes do HoverCard: PerfilDeUsuario (avatar + bio + métrica), PreviewDeLink (favicon + URL + título), DefinicaoDeTermo (texto explicativo) e MetricaExplicada (KPI + descrição em dashboard).',
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
  wrapper.className = 'nds-cluster nds-w-full';
  wrapper.dataset.justify = 'center';
  wrapper.style.minHeight = '260px';
  wrapper.appendChild(child);
  return wrapper;
}

function buildLink(label: string, href = '/preview'): HTMLAnchorElement {
  const a = document.createElement('a');
  a.href = href;
  a.className = 'nds-text-body nds-font-medium nds-text-primary';
  a.style.textDecoration = 'underline';
  a.style.textUnderlineOffset = '4px';
  a.textContent = label;
  return a;
}

function buildSpan(label: string): HTMLElement {
  const s = document.createElement('button');
  s.type = 'button';
  s.className =
    'nds-text-body nds-font-medium nds-text-primary nds-bg-transparent';
  s.style.textDecoration = 'underline dotted';
  s.style.textUnderlineOffset = '4px';
  s.style.cursor = 'help';
  s.style.border = '0';
  s.style.padding = '0';
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
    content.className = 'nds-cluster';
    content.dataset.spacing = 'md';
    content.dataset.align = 'start';

    const avatar = document.createElement('div');
    avatar.className =
      'nds-cluster nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-muted-foreground nds-text-body nds-font-medium';
    avatar.dataset.justify = 'center';
    avatar.style.width = '3rem';
    avatar.style.height = '3rem';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = 'JS';

    const info = document.createElement('div');
    info.className = 'nds-stack';
    info.dataset.spacing = 'xs';

    const name = document.createElement('p');
    name.className = 'nds-text-body nds-font-medium nds-leading-none';
    name.textContent = 'Joana Silva';

    const handle = document.createElement('p');
    handle.className = 'nds-text-caption nds-text-muted-foreground';
    handle.textContent = '@joana · Designer';

    const bio = document.createElement('p');
    bio.className = 'nds-text-caption';
    bio.style.lineHeight = '1.375';
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
    content.className = 'nds-stack';
    content.dataset.spacing = 'sm';

    const header = document.createElement('div');
    header.className = 'nds-cluster';
    header.dataset.spacing = 'sm';

    const favicon = document.createElement('div');
    favicon.className = 'nds-rounded-sm nds-bg-primary';
    favicon.style.width = '1rem';
    favicon.style.height = '1rem';
    favicon.setAttribute('aria-hidden', 'true');

    const url = document.createElement('p');
    url.className = 'nds-text-caption nds-text-muted-foreground nds-truncate';
    url.textContent = 'design-system.dev';

    header.append(favicon, url);

    const title = document.createElement('p');
    title.className = 'nds-text-body nds-font-medium';
    title.style.lineHeight = '1.375';
    title.textContent = 'Design System — Documentação completa';

    const desc = document.createElement('p');
    desc.className = 'nds-text-caption nds-text-muted-foreground';
    desc.style.lineHeight = '1.375';
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
    content.className = 'nds-stack';
    content.dataset.spacing = 'xs';

    const term = document.createElement('p');
    term.className = 'nds-text-body nds-font-medium';
    term.textContent = 'WCAG 2.1 AA';

    const def = document.createElement('p');
    def.className = 'nds-text-caption nds-text-muted-foreground';
    def.style.lineHeight = '1.375';
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
    content.className = 'nds-stack';
    content.dataset.spacing = 'sm';

    const head = document.createElement('div');
    head.className = 'nds-cluster';
    head.dataset.spacing = 'sm';
    head.dataset.justify = 'between';
    head.dataset.align = 'baseline';

    const metric = document.createElement('p');
    metric.className = 'nds-text-body nds-font-medium';
    metric.textContent = 'Largest Contentful Paint';

    const value = document.createElement('span');
    value.className = 'nds-text-caption nds-font-medium nds-text-success';
    value.textContent = '1.8s';

    head.append(metric, value);

    const desc = document.createElement('p');
    desc.className = 'nds-text-caption nds-text-muted-foreground';
    desc.style.lineHeight = '1.375';
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
