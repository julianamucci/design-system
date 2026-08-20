import { figmaDesign } from '@shared/figma/design-links';
import type { Meta, StoryObj } from '@storybook/html-vite';
import { within, expect } from 'storybook/test';
import {
  createBreadcrumb,
  createBreadcrumbList,
  createBreadcrumbItem,
  createBreadcrumbLink,
  createBreadcrumbPage,
  createBreadcrumbSeparator,
  createBreadcrumbEllipsis,
} from './breadcrumb';
import { breadcrumbSource } from './breadcrumb.source';
import { createBreadcrumbDocs } from '@/components/docs/BreadcrumbDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import {
  descreverFalhasDeBreadcrumb,
  medirBreadcrumb,
  reprovasDeBreadcrumb,
} from '@shared/testing/breadcrumb-probe';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta = {
  title: 'UI/Breadcrumb',
  tags: ['autodocs', 'navigation'],
  parameters: {
    design: figmaDesign('breadcrumb'),
    docs: {
      page: withAutoDocsTab(createBreadcrumbDocs),
      source: { transform: breadcrumbSource },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Playground ───────────────────────────────────────────────────────────────

function buildPlaygroundBreadcrumb(): HTMLElement {
  const nav = createBreadcrumb({ 'aria-label': 'breadcrumb' });
  const list = createBreadcrumbList();

  const home = createBreadcrumbItem();
  home.appendChild(createBreadcrumbLink({ href: '#', text: 'Início' }));

  const components = createBreadcrumbItem();
  components.appendChild(createBreadcrumbLink({ href: '#', text: 'Componentes' }));

  const page = createBreadcrumbItem();
  page.appendChild(createBreadcrumbPage({ text: 'Breadcrumb' }));

  list.append(
    home,
    createBreadcrumbSeparator(),
    components,
    createBreadcrumbSeparator(),
    page,
  );

  nav.appendChild(list);
  return nav;
}

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'functional.item2',
      'accessibility.item1',
      'accessibility.item2',
      'accessibility.item3',
      'accessibility.item4',
      'accessibility.item6',
      'visual.item1',
    ],
  },
  render: () => buildPlaygroundBreadcrumb(),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A trilha é um landmark de navegação nomeado', async () => {
      // accessibility.item1 — sem o nome, o leitor de tela anuncia só
      // "navegação" e a pessoa não sabe qual das navegações da página é esta.
      const nav = canvas.getByRole('navigation', { name: 'breadcrumb' });
      await expect(nav).toHaveAttribute('data-slot', 'breadcrumb');
      // functional.item1 — a hierarquia é uma lista ordenada, não um punhado
      // de links soltos: é a ordem que dá o sentido do caminho.
      const list = nav.querySelector('[data-slot="breadcrumb-list"]');
      await expect(list?.tagName).toBe('OL');
      await expect(list!.children.length).toBeGreaterThan(0);
    });

    await step('Só os níveis anteriores são links', async () => {
      // functional.item2 — é a asserção que pega o defeito antigo: a página
      // atual tinha role="link" e entrava nesta conta, então o leitor de tela
      // anunciava três links num caminho que só tem dois navegáveis.
      const links = canvas.getAllByRole('link');
      await expect(links.length).toBe(2);
      await expect(links.map((l) => l.textContent?.trim())).toEqual(['Início', 'Componentes']);
      for (const link of links) await expect(link).toHaveAttribute('href', '#');
    });

    await step('A página atual é marcada, e não é navegável', async () => {
      // accessibility.item2
      const page = canvasElement.querySelector('[data-slot="breadcrumb-page"]')!;
      await expect(page).toHaveAttribute('aria-current', 'page');
      await expect(page).toHaveTextContent('Breadcrumb');
      await expect(page.hasAttribute('href')).toBe(false);
      await expect(page.querySelector('a')).toBeNull();
    });

    await step('Separadores ficam fora da árvore de acessibilidade', async () => {
      // accessibility.item3 — o chevron é desenho; lido em voz alta viraria
      // ruído entre os níveis.
      const separadores = canvasElement.querySelectorAll('[data-slot="breadcrumb-separator"]');
      await expect(separadores.length).toBe(2);
      for (const sep of separadores) {
        await expect(sep).toHaveAttribute('aria-hidden', 'true');
        await expect(sep).toHaveAttribute('role', 'presentation');
      }
    });

    await step('A anatomia compartilhada bate com o DOM', async () => {
      // Contagem de asserção não pega o que NENHUMA stack verifica. Esta sonda
      // confere de uma vez o contrato inteiro: a classe .nds-breadcrumb na raiz
      // (que faltava em duas stacks — uma com string vazia, outra com um nome de
      // classe digitado errado), <nav> nomeado, <ol> com a classe da folha,
      // aria-current="page" no ÚLTIMO item e sem href, separadores decorativos, e
      // a ordem de leitura sem nenhuma peça decorativa vazada.
      const falhas = reprovasDeBreadcrumb(medirBreadcrumb(canvasElement));
      await expect(
        falhas,
        falhas.length ? `\n${descreverFalhasDeBreadcrumb(falhas)}\n` : '',
      ).toEqual([]);
    });

    await step('O apelido depreciado continua produzindo o atributo', async () => {
      // Aqui `label` nomeava DOIS alvos no mesmo arquivo — o landmark e as
      // reticências. Os dois ganharam o canônico e mantiveram o antigo como
      // apelido; sem esta asserção, a compatibilidade é promessa sem contrato.
      const navAntigo = createBreadcrumb({ label: 'Trilha do produto' });
      await expect(navAntigo).toHaveAttribute('aria-label', 'Trilha do produto');

      const reticenciasAntigo = createBreadcrumbEllipsis({ label: 'Mais páginas' });
      await expect(reticenciasAntigo).toHaveAttribute('aria-label', 'Mais páginas');
      await expect(reticenciasAntigo).toHaveAttribute('role', 'img');

      // E o canônico vence quando os dois vierem.
      const navAmbos = createBreadcrumb({ label: 'Antigo', 'aria-label': 'Canônico' });
      await expect(navAmbos).toHaveAttribute('aria-label', 'Canônico');

      const reticenciasAmbos = createBreadcrumbEllipsis({
        label: 'Antigo',
        'aria-label': 'Canônico',
      });
      await expect(reticenciasAmbos).toHaveAttribute('aria-label', 'Canônico');
    });
  },
};
