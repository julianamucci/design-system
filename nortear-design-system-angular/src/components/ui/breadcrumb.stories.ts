import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect } from 'storybook/test';
import {
  NdsBreadcrumb,
  NdsBreadcrumbEllipsis,
  NdsBreadcrumbIcon,
  NdsBreadcrumbItem,
  NdsBreadcrumbLink,
  NdsBreadcrumbList,
  NdsBreadcrumbPage,
  NdsBreadcrumbSeparator,
} from './breadcrumb';
import { NdsBreadcrumbDocs } from '@/components/docs/BreadcrumbDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type BreadcrumbArgs = {
  paginaAtual: string;
  separador: 'chevron' | 'slash';
};

/**
 * O painel Code mostra o `template` da story como está escrito — inclusive o
 * `@if` que alterna os dois desenhos de separador. Isso é o andaime da story,
 * não o que alguém escreve para usar um Breadcrumb. O `transform` devolve o uso
 * real, com o valor atual dos controls já resolvido. Ver a nota em
 * `separator.stories.ts`.
 */
function playgroundSource(_gerado: string, ctx: { args?: Partial<BreadcrumbArgs> }): string {
  const { paginaAtual = 'Breadcrumb', separador = 'chevron' } = ctx.args ?? {};
  // O chevron é o desenho padrão: no snippet o `<li>` fica vazio, porque é isso
  // que a pessoa escreve. Só o separador customizado carrega conteúdo.
  const sep =
    separador === 'chevron'
      ? '<li ndsBreadcrumbSeparator></li>'
      : '<li ndsBreadcrumbSeparator><svg ndsBreadcrumbIcon kind="slash"></svg></li>';

  return `import {
  NdsBreadcrumb, NdsBreadcrumbList, NdsBreadcrumbItem,
  NdsBreadcrumbLink, NdsBreadcrumbPage, NdsBreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

@Component({
  imports: [
    NdsBreadcrumb, NdsBreadcrumbList, NdsBreadcrumbItem,
    NdsBreadcrumbLink, NdsBreadcrumbPage, NdsBreadcrumbSeparator,
  ],
  template: \`
    <nav ndsBreadcrumb>
      <ol ndsBreadcrumbList>
        <li ndsBreadcrumbItem>
          <a ndsBreadcrumbLink href="/">Início</a>
        </li>
        ${sep}
        <li ndsBreadcrumbItem>
          <a ndsBreadcrumbLink href="/componentes">Componentes</a>
        </li>
        ${sep}
        <li ndsBreadcrumbItem>
          <span ndsBreadcrumbPage>${paginaAtual}</span>
        </li>
      </ol>
    </nav>
  \`,
})
export class Exemplo {}`;
}

const meta: Meta<BreadcrumbArgs> = {
  title: 'UI/Breadcrumb',
  tags: ['autodocs', 'navigation'],
  decorators: [
    moduleMetadata({
      imports: [
        NdsBreadcrumb,
        NdsBreadcrumbList,
        NdsBreadcrumbItem,
        NdsBreadcrumbLink,
        NdsBreadcrumbPage,
        NdsBreadcrumbSeparator,
        NdsBreadcrumbEllipsis,
        NdsBreadcrumbIcon,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    docs: { page: withAutoDocsTab(NdsBreadcrumbDocs) },
  },
  argTypes: {
    paginaAtual: {
      control: 'text',
      description: 'Rótulo do último item — espelha o <h1> da página.',
    },
    separador: {
      control: { type: 'inline-radio' },
      options: ['chevron', 'slash'],
      description: 'Desenho do separador. O chevron é o padrão do componente.',
    },
  },
  args: { paginaAtual: 'Breadcrumb', separador: 'chevron' },
};

export default meta;
type Story = StoryObj<BreadcrumbArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

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
    docs: { source: { transform: playgroundSource } },
  },
  render: (args) => ({
    props: { ...args, ehChevron: args.separador === 'chevron' },
    template: `
      <nav ndsBreadcrumb>
        <ol ndsBreadcrumbList>
          <li ndsBreadcrumbItem><a ndsBreadcrumbLink href="#">Início</a></li>
          @if (ehChevron) {
            <li ndsBreadcrumbSeparator></li>
          } @else {
            <li ndsBreadcrumbSeparator><svg ndsBreadcrumbIcon kind="slash"></svg></li>
          }
          <li ndsBreadcrumbItem><a ndsBreadcrumbLink href="#">Componentes</a></li>
          @if (ehChevron) {
            <li ndsBreadcrumbSeparator></li>
          } @else {
            <li ndsBreadcrumbSeparator><svg ndsBreadcrumbIcon kind="slash"></svg></li>
          }
          <li ndsBreadcrumbItem><span ndsBreadcrumbPage>{{ paginaAtual }}</span></li>
        </ol>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);

    await step('A trilha é um landmark de navegação nomeado', async () => {
      // accessibility.item1 — sem o nome, o leitor de tela anuncia só
      // "navegação" e a pessoa não sabe qual das navegações da página é esta.
      const nav = canvas.getByRole('navigation', { name: 'breadcrumb' });
      await expect(nav).toHaveAttribute('data-slot', 'breadcrumb');
      await expect(nav.tagName).toBe('NAV');
      // functional.item1 — a hierarquia é uma lista ordenada, não um punhado de
      // links soltos: é a ordem que dá o sentido do caminho.
      const list = nav.querySelector('[data-slot="breadcrumb-list"]');
      await expect(list?.tagName).toBe('OL');
      await expect(list).toHaveClass('nds-breadcrumb-list');
      await expect(list!.children.length).toBe(5);
    });

    await step('Só os níveis anteriores são links', async () => {
      // functional.item2 — é a asserção que pega o defeito antigo: a página
      // atual tinha role="link" e entrava nesta conta, então o leitor de tela
      // anunciava três links num caminho que só tem dois navegáveis.
      const links = canvas.getAllByRole('link');
      await expect(links.length).toBe(2);
      await expect(links.map((l) => l.textContent)).toEqual(['Início', 'Componentes']);
      for (const link of links) {
        await expect(link).toHaveAttribute('href', '#');
        await expect(link).toHaveClass('nds-breadcrumb-link');
      }
    });

    await step('A página atual é marcada, e não é navegável', async () => {
      // accessibility.item2
      const page = canvasElement.querySelector<HTMLElement>('[data-slot="breadcrumb-page"]')!;
      await expect(page).toHaveAttribute('aria-current', 'page');
      // Prova que o input chegou ao template: sem AOT o binding cai em silêncio
      // e o texto ficaria preso no valor que o template escreveu (armadilha 1).
      await expect(page).toHaveTextContent(args.paginaAtual);
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
        // O desenho existe em ambos os modos do control — o `@if` só troca qual.
        await expect(sep.querySelector('svg')).not.toBeNull();
      }
    });
  },
};
