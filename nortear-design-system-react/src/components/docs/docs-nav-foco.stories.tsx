// Provas dos dois bugs de foco reportados com NVDA nas docs pages:
//
// 1. "Ir para o conteúdo" não alcançava nada — não havia landmark de conteúdo.
//    Agora o DocsPageLayout renderiza <main tabindex="-1"> rotulado pelo <h1>
//    do DocsHeader (aria-labelledby), então o leitor anuncia
//    "principal, <título da página>".
// 2. Acionar um item do menu só rolava; o foco ficava no botão do menu, a
//    leitura não continuava e o Tab seguinte voltava para o próximo item do
//    menu. Agora o DocsNav move o foco para a seção alvo.
//
// 3. O `docs_nav_click` reportava sempre `section_id: 'nav'` e as páginas que
//    não passam `componentSlug` nem emitiam `data-track-id`. Agora o id sai
//    completo (slug derivado do `?id=`) e o evento reporta a seção de destino.
//
// A fumaça (docs-smoke) roda axe nas 63 páginas; aqui provamos o comportamento
// e guardamos a SidebarDocs, cujo demo já rendeu landmark-no-duplicate-main.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { DocsHeader } from './shared/sections/DocsHeader';
import { DocsPageLayout } from './shared/sections/DocsPageLayout';
import { ButtonDocs } from './ButtonDocs';
import { SidebarDocs } from './SidebarDocs';
import { TypographyDocs } from './TypographyDocs';
import { IconsDocs } from './IconsDocs';
import { AspectRatioDocs } from './AspectRatioDocs';

const meta = {
  title: 'QA/Docs Nav e Landmark',
  tags: ['!dev'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// ─── Fixture ─────────────────────────────────────────────────────────────────
// Página mínima montada com os mesmos containers compartilhados das docs pages
// reais. Os rótulos são fixos, então a prova não depende do locale ativo.

const FIXTURE_TITLE = 'Página de prova de foco';

const FIXTURE_SECTIONS = [
  { id: 'foco-secao-um', label: 'Seção um' },
  { id: 'foco-secao-dois', label: 'Seção dois' },
  { id: 'foco-secao-tres', label: 'Seção três' },
];

function FocusFixture() {
  return (
    <DocsPageLayout
      navGroups={[{ label: 'Grupo de prova', sections: FIXTURE_SECTIONS }]}
      header={
        <DocsHeader
          title={FIXTURE_TITLE}
          description="Fixture de QA para o foco da navegação interna."
          category="QA"
          type="Fixture"
        />
      }
    >
      {FIXTURE_SECTIONS.map((section) => (
        <section key={section.id} id={section.id}>
          <h2 className="nds-section-title">{section.label}</h2>
          <p className="nds-text-body">Conteúdo de prova.</p>
          <button type="button">Ação de {section.label}</button>
        </section>
      ))}
    </DocsPageLayout>
  );
}

/** Existe exatamente um <main> e ele é rotulado pelo <h1> da página. */
function expectSingleNamedMain(canvasElement: HTMLElement) {
  const mains = canvasElement.querySelectorAll('main');
  expect(mains).toHaveLength(1);

  const pageTitle = canvasElement.querySelector('h1')?.textContent?.trim();
  expect(pageTitle).toBeTruthy();

  expect(within(canvasElement).getByRole('main', { name: pageTitle! })).toBe(mains[0]);
}

// ─── Provas ──────────────────────────────────────────────────────────────────

/**
 * Bug 2: acionar o item do menu move o foco para a seção alvo, e o Tab
 * seguinte cai no primeiro focável do conteúdo — não no próximo item do menu.
 */
export const FocoAoNavegar: Story = {
  render: () => <FocusFixture />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    for (const { id, label } of FIXTURE_SECTIONS) {
      const navButton = canvas.getByRole('button', { name: label });
      const section = canvasElement.querySelector(`#${id}`);
      expect(section).not.toBeNull();

      await userEvent.click(navButton);

      // O foco saiu do menu e está dentro da seção alvo.
      expect(document.activeElement).not.toBe(navButton);
      expect(section!.contains(document.activeElement)).toBe(true);

      // O Tab seguinte segue o conteúdo, não a lista do menu.
      await userEvent.tab();
      expect(document.activeElement).toBe(
        canvas.getByRole('button', { name: `Ação de ${label}` }),
      );
    }
  },
};

/**
 * Bug 1: existe exatamente um <main> e ele tem nome acessível igual ao título
 * da página (aria-labelledby → <h1> do DocsHeader).
 */
export const LandmarkNomeado: Story = {
  render: () => <ButtonDocs />,
  play: async ({ canvasElement }) => expectSingleNamedMain(canvasElement),
};

/**
 * Bug 1, Foundations: as 16 páginas de Foundations não passam pelo
 * DocsPageLayout (renderer próprio) e ficavam sem landmark de conteúdo. Agora o
 * FoundationPage também renderiza um <main> único e rotulado pelo <h1>.
 */
export const LandmarkNomeadoFoundations: Story = {
  render: () => <TypographyDocs />,
  play: async ({ canvasElement }) => expectSingleNamedMain(canvasElement),
};

/**
 * Bug 1, páginas com layout próprio: IconsDocs monta o layout na mão e o axe
 * está desligado nela na fumaça (o catálogo inteiro do lucide estoura o
 * timeout), então o landmark é provado aqui.
 */
export const LandmarkNomeadoIcones: Story = {
  render: () => <IconsDocs />,
  // Mesma política da fumaça: o axe fica desligado nesta página (o catálogo
  // inteiro do lucide estoura o timeout da varredura). A prova aqui é do
  // landmark, não do axe.
  parameters: { a11y: { disable: true } },
  play: async ({ canvasElement }) => expectSingleNamedMain(canvasElement),
};

/**
 * B2: página que NÃO passa `componentSlug` (o slug é opcional por contrato).
 * O DocsNav deriva o slug do `?id=` do iframe, então todo botão do nav emite
 * `data-track-id` de 3 partes com a seção de destino no 3º segmento — antes o
 * atributo simplesmente não existia nessas páginas.
 */
export const NavTrackIdSemSlugExplicito: Story = {
  render: () => <AspectRatioDocs />,
  play: async ({ canvasElement }) => {
    const navButtons = canvasElement.querySelectorAll<HTMLElement>('.nds-docs-nav-button');
    expect(navButtons.length).toBeGreaterThan(0);

    for (const button of navButtons) {
      const id = button.getAttribute('data-track-id');
      expect(id).toBeTruthy();

      const parts = id!.split(':');
      expect(parts).toHaveLength(3);
      expect(parts[0]).not.toBe('');
      expect(parts[1]).toBe('nav');

      // O 3º segmento é o destino: existe uma seção com esse id na página.
      expect(canvasElement.querySelector(`#${parts[2]}`)).not.toBeNull();
    }
  },
};

/**
 * Bug de analytics: o `docs_nav_click` reportava `section_id: 'nav'` para toda
 * a navegação (o segmento `section` do id é literalmente "nav"). O destino é o
 * 3º segmento — sem isso o evento não dizia para onde o usuário foi.
 */
export const NavTrackReportaSecaoDestino: Story = {
  render: () => <FocusFixture />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // `track()` encaminha para o gtag do manager (a janela pai quando em iframe).
    let managerWin: Window = window;
    try {
      if (window.self !== window.top && window.top) managerWin = window.top;
    } catch {
      /* cross-origin — fica na janela atual */
    }

    const previousGtag = managerWin.gtag;
    const calls: Array<[string, string, Record<string, unknown>]> = [];
    managerWin.gtag = (...args: unknown[]) => {
      calls.push(args as [string, string, Record<string, unknown>]);
    };

    try {
      for (const { id, label } of FIXTURE_SECTIONS) {
        calls.length = 0;
        await userEvent.click(canvas.getByRole('button', { name: label }));

        const navEvent = calls.find(([, name]) => name === 'docs_nav_click');
        expect(navEvent).toBeTruthy();
        expect(navEvent![2].section_id).toBe(id);
        expect(navEvent![2].label).toBe(label);
        expect(navEvent![2].component).toBeTruthy();
      }
    } finally {
      managerWin.gtag = previousGtag;
    }
  },
};

/**
 * Guarda de regressão: os demos da SidebarDocs usam o equivalente visual do
 * SidebarInset sem o landmark, para que o <main> do layout siga único
 * (axe landmark-no-duplicate-main).
 */
export const SidebarSemMainDuplicado: Story = {
  render: () => <SidebarDocs />,
  play: async ({ canvasElement }) => expectSingleNamedMain(canvasElement),
};
