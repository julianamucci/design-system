// Regressão de foco na navegação das docs pages (contrato docs-nav-foco).
// Prova os dois consertos numa página real (BreadcrumbDocs — passa componentSlug,
// então os botões do menu carregam data-track-id com o id da seção alvo):
//   A. existe exatamente um <main> e ele tem nome acessível = título da página;
//   B. acionar um item do menu move o foco para dentro da seção alvo — sem
//      isso o leitor de tela não continua a leitura e o Tab volta pro menu.
// E cobre a infraestrutura das outras anatomias:
//   C. página de Foundations (SpacingDocs, renderer próprio) também tem <main>;
//   D. página sem componentSlug (AlertDocs) ainda emite data-track-id de 3
//      partes e o docs_nav_click reporta a seção de destino.
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, userEvent, within } from 'storybook/test';

import AlertDocs from './AlertDocs.svelte';
import BreadcrumbDocs from './BreadcrumbDocs.svelte';
import SpacingDocs from './SpacingDocs.svelte';

const meta = {
  title: 'QA/Docs Nav Focus',
  tags: ['!dev'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Mesmo cast do docs-smoke: as *Docs.svelte não recebem props.
const page = (Page: unknown) => () => ({ Component: Page as never });

export const LandmarkPrincipal: Story = {
  render: page(BreadcrumbDocs),
  play: async ({ canvasElement }) => {
    const mains = canvasElement.querySelectorAll('main');
    expect(mains).toHaveLength(1);

    const heading = canvasElement.querySelector('h1');
    expect(heading).not.toBeNull();

    const named = within(canvasElement).getByRole('main', {
      name: heading!.textContent!.trim(),
    });
    expect(named).toBe(mains[0]);
  },
};

export const FocoAoNavegar: Story = {
  render: page(BreadcrumbDocs),
  play: async ({ canvasElement }) => {
    const buttons = [
      ...canvasElement.querySelectorAll<HTMLButtonElement>('.nds-docs-nav-button'),
    ];
    expect(buttons.length).toBeGreaterThan(0);

    // Primeiro item do menu cuja seção alvo existe na página.
    const pair = buttons
      .map((button) => {
        const id = button.dataset.trackId?.split(':').pop() ?? '';
        return { button, section: id ? canvasElement.querySelector(`#${CSS.escape(id)}`) : null };
      })
      .find((entry): entry is { button: HTMLButtonElement; section: Element } => entry.section !== null);

    expect(pair).toBeDefined();

    await userEvent.click(pair!.button);

    // O foco tem de sair do botão do menu e cair dentro da seção alvo.
    expect(pair!.section.contains(document.activeElement)).toBe(true);
    expect(document.activeElement).not.toBe(pair!.button);
  },
};

// As páginas de Foundations não usam o DocsPageLayout — têm renderer próprio
// (FoundationPage). Sem <main> nelas o skip link não tem destino e o conteúdo
// fica fora de qualquer landmark.
export const LandmarkFoundations: Story = {
  render: page(SpacingDocs),
  play: async ({ canvasElement }) => {
    const mains = canvasElement.querySelectorAll('main');
    expect(mains).toHaveLength(1);

    const heading = canvasElement.querySelector('h1');
    expect(heading).not.toBeNull();

    const named = within(canvasElement).getByRole('main', {
      name: heading!.textContent!.trim(),
    });
    expect(named).toBe(mains[0]);
  },
};

// AlertDocs NÃO passa componentSlug (como outras 20 páginas): o DocsNav tem de
// derivar o slug do ?id= do iframe, igual ao observer, e o docs_nav_click tem
// de reportar a seção de DESTINO — não o literal "nav" do 2º segmento.
export const NavSemSlugRastreiaDestino: Story = {
  render: page(AlertDocs),
  play: async ({ canvasElement }) => {
    const button = canvasElement.querySelector<HTMLButtonElement>('.nds-docs-nav-button');
    expect(button).not.toBeNull();

    const parts = (button!.dataset.trackId ?? '').split(':');
    expect(parts).toHaveLength(3);
    expect(parts[0]).not.toBe('');           // slug derivado da URL
    expect(parts[1]).toBe('nav');
    // 3º segmento = id de uma seção real desta página
    expect(canvasElement.querySelector(`#${CSS.escape(parts[2])}`)).not.toBeNull();

    // Espiona o gtag do manager (track() encaminha para window.top.gtag).
    const events: Array<{ name: string; params: Record<string, unknown> }> = [];
    const targets: Window[] = [window];
    try {
      if (window.top && window.top !== window) targets.push(window.top);
    } catch {
      // cross-origin: sobra o window local, que é o que o track() usaria
    }
    const previous = targets.map((t) => t.gtag);
    const spy: Window['gtag'] = (command, ...args) => {
      if (command !== 'event') return;
      events.push({
        name: String(args[0]),
        params: (args[1] ?? {}) as Record<string, unknown>,
      });
    };
    targets.forEach((t) => { t.gtag = spy; });

    try {
      await userEvent.click(button!);
      const nav = events.find((e) => e.name === 'docs_nav_click');
      expect(nav).toBeDefined();
      expect(nav!.params.section_id).toBe(parts[2]);
    } finally {
      targets.forEach((t, i) => { t.gtag = previous[i]; });
    }
  },
};
