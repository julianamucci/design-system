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
import { breadcrumbPlaygroundSource, type BreadcrumbArgs } from './breadcrumb.source';
import { NdsBreadcrumbDocs } from '@/components/docs/BreadcrumbDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import {
  breadcrumbDescribeFailures,
  measureBreadcrumb,
  reprovasDeBreadcrumb,
} from '@shared/testing/breadcrumb-probe';

// ─── Meta ─────────────────────────────────────────────────────────────────────

const meta: Meta<BreadcrumbArgs> = {
  title: 'Primitives/Navigation/Breadcrumb',
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
    currentPage: {
      control: 'text',
      description: 'Rótulo do último item — espelha o <h1> da página.',
    },
    separator: {
      control: { type: 'inline-radio' },
      options: ['chevron', 'slash'],
      description: 'Desenho do separador. O chevron é o padrão do componente.',
    },
  },
  args: { currentPage: 'Breadcrumb', separator: 'chevron' },
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
    docs: { source: { transform: breadcrumbPlaygroundSource } },
  },
  render: (args) => ({
    props: { ...args, ehChevron: args.separator === 'chevron' },
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
          <li ndsBreadcrumbItem><span ndsBreadcrumbPage>{{ currentPage }}</span></li>
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
      await expect(page).toHaveTextContent(args.currentPage);
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

    await step('A anatomia compartilhada bate com o DOM', async () => {
      // Contagem de asserção não pega o que NENHUMA stack verifica. Esta sonda
      // confere de uma vez o contrato inteiro: a classe .nds-breadcrumb na raiz
      // (que faltava em duas stacks — uma com string vazia, outra com um nome de
      // classe digitado errado), <nav> nomeado, <ol> com a classe da folha,
      // aria-current="page" no ÚLTIMO item e sem href, separadores decorativos, e
      // a ordem de leitura sem nenhuma peça decorativa vazada.
      const failures = reprovasDeBreadcrumb(measureBreadcrumb(canvasElement));
      await expect(
        failures,
        failures.length ? `\n${breadcrumbDescribeFailures(failures)}\n` : '',
      ).toEqual([]);
    });
  },
};
