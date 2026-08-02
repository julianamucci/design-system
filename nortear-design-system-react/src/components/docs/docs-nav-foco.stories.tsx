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
// A fumaça (docs-smoke) roda axe nas 63 páginas; aqui provamos o comportamento
// e guardamos a SidebarDocs, cujo demo já rendeu landmark-no-duplicate-main.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, userEvent, within } from 'storybook/test';

import { DocsHeader } from './shared/sections/DocsHeader';
import { DocsPageLayout } from './shared/sections/DocsPageLayout';
import { ButtonDocs } from './ButtonDocs';
import { SidebarDocs } from './SidebarDocs';

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
  play: async ({ canvasElement }) => {
    const mains = canvasElement.querySelectorAll('main');
    expect(mains).toHaveLength(1);

    const pageTitle = canvasElement.querySelector('h1')?.textContent?.trim();
    expect(pageTitle).toBeTruthy();

    expect(within(canvasElement).getByRole('main', { name: pageTitle! })).toBe(mains[0]);
  },
};

/**
 * Guarda de regressão: os demos da SidebarDocs usam o equivalente visual do
 * SidebarInset sem o landmark, para que o <main> do layout siga único
 * (axe landmark-no-duplicate-main).
 */
export const SidebarSemMainDuplicado: Story = {
  render: () => <SidebarDocs />,
  play: async ({ canvasElement }) => {
    const mains = canvasElement.querySelectorAll('main');
    expect(mains).toHaveLength(1);

    const pageTitle = canvasElement.querySelector('h1')?.textContent?.trim();
    expect(within(canvasElement).getByRole('main', { name: pageTitle! })).toBe(mains[0]);
  },
};
