import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fireEvent, fn, userEvent, within } from 'storybook/test';
import {
  NdsPagination,
  NdsPaginationContent,
  NdsPaginationEllipsis,
  NdsPaginationItem,
  NdsPaginationLink,
  NdsPaginationNext,
  NdsPaginationPrevious,
} from './pagination';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// `controls.disable`: nenhuma story daqui tem argTypes, e sem isso o painel
// Controls aparece vazio.

const meta: Meta = {
  title: 'UI/Pagination/States',
  tags: ['navigation'],
  decorators: [
    moduleMetadata({
      imports: [
        NdsPagination,
        NdsPaginationContent,
        NdsPaginationItem,
        NdsPaginationLink,
        NdsPaginationPrevious,
        NdsPaginationNext,
        NdsPaginationEllipsis,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Estados dos controles: extremos desabilitados, foco visível por teclado e contraste do texto sobre o fundo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const ROTULO_PAGINA = 'Ir para página';
const ROTULO_ANTERIOR = 'Ir para a página anterior';
const ROTULO_PROXIMA = 'Ir para a próxima página';

/** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
const onPageChange = fn();

function aoNavegar(evento: Event, pagina: number): void {
  evento.preventDefault();
  onPageChange(pagina);
}

/**
 * Faixa de 5 páginas com os dois extremos parametrizados. Um só molde para as
 * stories de extremo evita que uma delas envelheça sozinha.
 */
function faixa(rotulo: string, atual: number): Record<string, unknown> {
  return {
    props: {
      atual,
      total: 5,
      // Derivado do total: uma lista literal deixaria de acompanhar a faixa.
      paginas: Array.from({ length: 5 }, (_, i) => i + 1),
      rotulo,
      rotuloPagina: ROTULO_PAGINA,
      rotuloAnterior: ROTULO_ANTERIOR,
      rotuloProxima: ROTULO_PROXIMA,
      aoNavegar,
    },
    template: `
      <nav ndsPagination [label]="rotulo">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <a
              ndsPaginationPrevious
              href="#"
              text="Anterior"
              [label]="rotuloAnterior"
              [disabled]="atual === 1"
              (click)="aoNavegar($event, atual - 1)"
            ></a>
          </li>
          @for (n of paginas; track n) {
            <li ndsPaginationItem>
              <a
                ndsPaginationLink
                href="#"
                [isActive]="n === atual"
                [attr.aria-label]="rotuloPagina + ' ' + n"
                (click)="aoNavegar($event, n)"
              >{{ n }}</a>
            </li>
          }
          <li ndsPaginationItem>
            <a
              ndsPaginationNext
              href="#"
              text="Próxima"
              [label]="rotuloProxima"
              [disabled]="atual === total"
              (click)="aoNavegar($event, atual + 1)"
            ></a>
          </li>
        </ul>
      </nav>
    `,
  };
}

// ─── Primeira página ──────────────────────────────────────────────────────────

export const FirstPage: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item4'],
    docs: {
      description: {
        story:
          'Na primeira página o controle Anterior fica desabilitado: opacidade reduzida, fora da tabulação e sem navegar.',
      },
    },
  },
  render: () => faixa('Paginação na primeira página', 1),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const anterior = canvas.getByRole('link', { name: ROTULO_ANTERIOR });

    await step('Anterior está marcado como desabilitado', async () => {
      // visual.item4 — em `<a>` não existe `disabled`; o par correto é
      // aria-disabled + a supressão do clique e da tabulação.
      await expect(anterior).toHaveAttribute('aria-disabled', 'true');
      await expect(anterior).toHaveAttribute('tabindex', '-1');
      const estilo = getComputedStyle(anterior);
      await expect(estilo.pointerEvents).toBe('none');
      await expect(Number(estilo.opacity)).toBeLessThan(1);
    });

    await step('Clicar em Anterior não navega', async () => {
      // functional.item2 — `fireEvent` e não `userEvent`: o CSS já barra o
      // ponteiro, e o que esta asserção precisa provar é o outro caminho — o
      // evento que chega por script ou por teclado também não passa.
      onPageChange.mockClear();
      await fireEvent.click(anterior);
      await expect(onPageChange).not.toHaveBeenCalled();
    });

    await step('Próxima continua ativo', async () => {
      const proxima = canvas.getByRole('link', { name: ROTULO_PROXIMA });
      await expect(proxima.hasAttribute('aria-disabled')).toBe(false);
      onPageChange.mockClear();
      await userEvent.click(proxima);
      await expect(onPageChange).toHaveBeenLastCalledWith(2);
    });
  },
};

// ─── Última página ────────────────────────────────────────────────────────────

export const LastPage: Story = {
  parameters: {
    covers: ['functional.item3'],
    docs: {
      description: {
        story:
          'Na última página o controle Próxima fica desabilitado, pelo mesmo par de atributos usado em Anterior.',
      },
    },
  },
  render: () => faixa('Paginação na última página', 5),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const proxima = canvas.getByRole('link', { name: ROTULO_PROXIMA });

    await step('Próxima está marcado como desabilitado', async () => {
      await expect(proxima).toHaveAttribute('aria-disabled', 'true');
      await expect(proxima).toHaveAttribute('tabindex', '-1');
      await expect(getComputedStyle(proxima).pointerEvents).toBe('none');
    });

    await step('Clicar em Próxima não navega', async () => {
      // functional.item3
      onPageChange.mockClear();
      await fireEvent.click(proxima);
      await expect(onPageChange).not.toHaveBeenCalled();
    });

    await step('A página atual é a última da faixa', async () => {
      const ativo = canvas.getByRole('link', { name: `${ROTULO_PAGINA} 5` });
      await expect(ativo).toHaveAttribute('aria-current', 'page');
      await expect(ativo).toHaveClass('nds-button-outline');
    });
  },
};

// ─── Foco ─────────────────────────────────────────────────────────────────────

export const FocusVisible: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story:
          'Foco por teclado desenha um anel visível em qualquer link da faixa — inclusive no da página atual.',
      },
    },
  },
  render: () => faixa('Paginação com foco', 3),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O anel de foco aparece no link numerado', async () => {
      // accessibility.item3 — `:focus-visible` é o que separa o anel do clique
      // de mouse; medir a sombra computada é o que prova que a regra do CSS
      // compartilhado chegou ao elemento, e não só que o foco chegou.
      const link = canvas.getByRole('link', { name: `${ROTULO_PAGINA} 2` });
      link.blur();
      link.focus();
      await expect(link).toHaveFocus();
      await expect(link.matches(':focus-visible')).toBe(true);
      await expect(getComputedStyle(link).boxShadow).not.toBe('none');
    });

    await step('A página atual também é focável', async () => {
      // Ela não navega para lugar nenhum, mas continua alcançável pelo teclado:
      // tirar do fluxo de foco quebraria a leitura sequencial da faixa.
      const ativo = canvas.getByRole('link', { name: `${ROTULO_PAGINA} 3` });
      ativo.blur();
      ativo.focus();
      await expect(ativo).toHaveFocus();
      await expect(getComputedStyle(ativo).boxShadow).not.toBe('none');
    });
  },
};

// ─── Contraste ────────────────────────────────────────────────────────────────

/** `rgb(...)`/`rgba(...)` → canal; devolve null quando o valor é transparente. */
function canais(valor: string): [number, number, number] | null {
  const bruto = valor.match(/rgba?\(([^)]+)\)/);
  if (!bruto) return null;
  const partes = bruto[1].split(/[,/]/).map((p) => parseFloat(p));
  if (partes.length >= 4 && partes[3] === 0) return null;
  return [partes[0], partes[1], partes[2]];
}

/** Luminância relativa da WCAG 2.2 (fórmula de 1.4.3). */
function luminancia([r, g, b]: [number, number, number]): number {
  const linear = [r, g, b].map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
}

function razaoDeContraste(
  a: [number, number, number],
  b: [number, number, number],
): number {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

/** Primeiro fundo opaco subindo a árvore — o link ghost não pinta o próprio. */
function fundoEfetivo(elemento: HTMLElement): [number, number, number] {
  let no: HTMLElement | null = elemento;
  while (no) {
    const cor = canais(getComputedStyle(no).backgroundColor);
    if (cor) return cor;
    no = no.parentElement;
  }
  return [255, 255, 255];
}

export const Contrast: Story = {
  parameters: {
    covers: ['accessibility.item2'],
    docs: {
      description: {
        story:
          'O texto de todo link da faixa — ativo, inativo e direcional — fica acima de 4.5:1 sobre o fundo em que aparece.',
      },
    },
  },
  render: () => faixa('Paginação medida por contraste', 3),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Todo link passa dos 4.5:1 exigidos para texto', async () => {
      // accessibility.item2 — o axe também mede isso, mas só no estado que a
      // story renderiza; aqui a conta é explícita e nomeia quem falhou.
      const links = canvas.getAllByRole('link') as HTMLElement[];
      await expect(links.length).toBe(7);
      for (const link of links) {
        const cor = canais(getComputedStyle(link).color);
        await expect(cor).not.toBeNull();
        const razao = razaoDeContraste(cor!, fundoEfetivo(link));
        await expect(razao).toBeGreaterThanOrEqual(4.5);
      }
    });

    await step('O contraste não depende de qual página está ativa', async () => {
      // A página atual troca de variante (ghost → outline). Se o par de cores
      // da variante ativa fosse mais fraco, o defeito só apareceria na página
      // que por acaso estivesse selecionada.
      const ativo = canvas.getByRole('link', { name: `${ROTULO_PAGINA} 3` });
      const inativo = canvas.getByRole('link', { name: `${ROTULO_PAGINA} 4` });
      for (const link of [ativo, inativo]) {
        const razao = razaoDeContraste(canais(getComputedStyle(link).color)!, fundoEfetivo(link));
        await expect(razao).toBeGreaterThanOrEqual(4.5);
      }
    });
  },
};
