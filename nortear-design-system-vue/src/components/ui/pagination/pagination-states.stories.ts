import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { within, expect, fn, userEvent } from 'storybook/test';
import { minimumTargetsBelow, rangeContrastes } from '@shared/testing/pagination-probe';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from './index';
import { paginationRangeSource, paginationFirstPageSource } from './pagination.source';

const meta = {
  title: 'UI/Pagination/States',
  component: Pagination,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Hover, Focus e Contrast não têm markup próprio: o que as separa é o
      // gesto e a medição da play, e a faixa é a mesma do meta.
      source: { transform: paginationRangeSource },
      description: {
        component:
          'Estados canônicos do Pagination: Default, Hover, Active, Disabled (Previous na primeira página), Focus e Contrast.',
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

const sharedComponents = {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
};

const LABEL_PREVIOUS = 'Ir para a página anterior';
const LABEL_NEXT = 'Ir para a próxima página';

/** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
const onPageChange = fn();

/**
 * Faixa de 5 páginas com a página atual parametrizada. Um só molde para as
 * stories de estado evita que uma delas envelheça sozinha.
 */
function faixa(rotulo: string, atual: number) {
  return () => ({
    components: sharedComponents,
    setup: () => ({
      rotulo,
      atual,
      pages: [1, 2, 3, 4, 5],
      onPageChange,
    }),
    template: `
      <Pagination :total="50" :items-per-page="10" :page="atual" :aria-label="rotulo">
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious @click="onPageChange(atual - 1)" />
          </PaginationItem>
          <PaginationItem v-for="n in pages" :key="n">
            <PaginationLink
              href="#"
              :is-active="n === atual"
              :aria-label="\`Ir para página \${n}\`"
              @click.prevent="onPageChange(n)"
            >
              {{ n }}
            </PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationNext @click="onPageChange(atual + 1)" />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    `,
  });
}

export const Default: Story = {
  parameters: {
    docs: { description: { story: 'Estado padrão — sem fundo, texto em foreground e cursor de clique.' } },
  },
  render: faixa('Paginação em repouso', 3),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: 'Ir para página 4' });
    await expect(link).toBeVisible();
    await expect(link).not.toHaveAttribute('aria-current');
    await expect(getComputedStyle(link).pointerEvents).toBe('auto');
  },
};

export const Hover: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Sob o ponteiro o link recebe fundo accent. A afordância é o cursor de clique, e o alvo tem que estar realmente alcançável.',
      },
    },
  },
  render: faixa('Paginação sob o ponteiro', 3),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const link = canvas.getByRole('link', { name: 'Ir para página 4' });
    await userEvent.hover(link);
    // Não se assere a cor do hover: `:hover` computado é frágil no harness. O
    // que prova a afordância é o cursor, e o que prova que o clique CHEGA é o
    // elemento devolvido no centro da caixa.
    await expect(getComputedStyle(link).cursor).toBe('pointer');
    const caixa = link.getBoundingClientRect();
    const alvo = document.elementFromPoint(
      caixa.left + caixa.width / 2,
      caixa.top + caixa.height / 2,
    );
    await expect(link.contains(alvo)).toBe(true);
  },
};

export const Active: Story = {
  parameters: {
    covers: ['visual.item3'],
    docs: { description: { story: 'Página atual destacada no meio da faixa — o caso que o Chromatic fotografa.' } },
  },
  render: faixa('Paginação com página atual', 3),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Exatamente um link é a página atual', async () => {
      // visual.item3
      const marcados = canvasElement.querySelectorAll('[aria-current="page"]');
      await expect(marcados.length).toBe(1);
      await expect(marcados[0]).toHaveTextContent('3');
    });

    await step('O destaque é visual e não depende da posição', async () => {
      await expect(canvas.getByRole('link', { name: 'Ir para página 3' })).toHaveClass(
        'nds-button-outline',
      );
      await expect(canvas.getByRole('link', { name: 'Ir para página 2' })).toHaveClass(
        'nds-button-ghost',
      );
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item4'],
    docs: {
      // O bloqueio não é prop: é a faixa parada no extremo. Só o `:page` do
      // snippet muda, e é justamente ele que produz o estado.
      source: { transform: paginationFirstPageSource },
      description: {
        story:
          'Na primeira página o controle Anterior fica desabilitado: opacidade reduzida, fora da tabulação e sem navegar.',
      },
    },
  },
  render: faixa('Paginação na primeira página', 1),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const anterior = canvas.getByRole('button', { name: LABEL_PREVIOUS });

    await step('Anterior está marcado como desabilitado', async () => {
      // visual.item4 — aqui o controle é um `<button>`, então o `disabled`
      // nativo já tira da tabulação; a opacidade e o bloqueio do ponteiro vêm
      // de `.nds-button:disabled`, no CSS compartilhado.
      await expect(anterior).toBeDisabled();
      await expect(getComputedStyle(anterior).pointerEvents).toBe('none');
      await expect(Number(getComputedStyle(anterior).opacity)).toBeLessThan(1);
    });

    await step('Clicar em Anterior não navega', async () => {
      // functional.item2 — o clique sintético do elemento, e não `fireEvent`:
      // aqui o controle é um <button> com `disabled` nativo, e o navegador barra
      // tanto o clique real quanto o `click()` de um script. `fireEvent`
      // despacharia o evento à força e mediria uma rota que não existe fora do
      // teste.
      onPageChange.mockClear();
      anterior.click();
      await expect(onPageChange).not.toHaveBeenCalled();
    });

    await step('Próxima continua ativo', async () => {
      const next = canvas.getByRole('button', { name: LABEL_NEXT });
      await expect(next).not.toBeDisabled();
      onPageChange.mockClear();
      await userEvent.click(next);
      await expect(onPageChange).toHaveBeenLastCalledWith(2);
    });
  },
};

export const Focus: Story = {
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story:
          'Foco por teclado desenha um anel visível em qualquer link da faixa — inclusive no da página atual.',
      },
    },
  },
  render: faixa('Paginação com foco', 3),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O anel de foco aparece no link numerado', async () => {
      // accessibility.item3 — medir a sombra computada é o que prova que a
      // regra do CSS compartilhado chegou ao elemento, e não só que o foco
      // chegou. `ring-2 ring-ring`, que a documentação citava, não existe.
      const link = canvas.getByRole('link', { name: 'Ir para página 2' });
      link.blur();
      link.focus();
      await expect(link).toHaveFocus();
      await expect(getComputedStyle(link).boxShadow).not.toBe('none');
    });

    await step('A página atual também é focável', async () => {
      const ativo = canvas.getByRole('link', { name: 'Ir para página 3' });
      ativo.blur();
      ativo.focus();
      await expect(ativo).toHaveFocus();
      await expect(getComputedStyle(ativo).boxShadow).not.toBe('none');
    });
  },
};

export const Contrast: Story = {
  parameters: {
    covers: ['accessibility.item2', 'accessibility.item6'],
    docs: {
      description: {
        story:
          'O texto de todo link da faixa — ativo, inativo e direcional — fica acima de 4.5:1 sobre o fundo em que aparece.',
      },
    },
  },
  render: faixa('Paginação medida por contraste', 3),
  play: async ({ canvasElement, step }) => {
    await step('Todo link passa dos 4.5:1 exigidos para texto', async () => {
      // accessibility.item2 — o texto da faixa tem 14px, tamanho normal pela
      // WCAG (grande é >=24px, ou >=18.66px em negrito), então o limite é 4.5.
      const measurements = rangeContrastes(canvasElement);
      await expect(measurements.length).toBe(7);
      await expect(JSON.stringify(measurements.filter((m) => m.ratio < 4.5))).toBe('[]');
    });

    await step('Todo controle alcança o alvo de toque mínimo', async () => {
      // accessibility.item6
      await expect(JSON.stringify(minimumTargetsBelow(canvasElement))).toBe('[]');
    });
  },
};
