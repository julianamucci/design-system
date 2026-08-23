import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, fn, userEvent } from 'storybook/test';
import { minimumTargetsBelow, rangeContrastes } from '@shared/testing/pagination-probe';
import PaginationStory from './PaginationStory.svelte';
import { paginationSource } from './pagination.source';

const LABEL_PREVIOUS = 'Ir para a página anterior';
const LABEL_NEXT = 'Ir para a próxima página';

/** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
const onPageChange = fn();

const meta: Meta = {
  title: 'UI/Pagination/States',
  component: PaginationStory,
  tags: ['navigation'],
  parameters: {
    layout: 'centered',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Cascateia para todas as stories do arquivo; a composição de cada uma
      // sai dos próprios `args`, que são os mesmos que a demonstração usa.
      source: { transform: paginationSource },
      description: {
        component:
          'Estados canônicos do Pagination: Default, Hover, Active, Disabled (Previous na primeira página), Focus e Contrast.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Faixa de 5 páginas com a página atual parametrizada. */
const range = (label: string, page: number) => ({
  count: 50,
  perPage: 10,
  page,
  siblingCount: 2,
  demonstration: 'simples',
  label,
  onPageChange,
});

export const Default: Story = {
  args: range('Paginação em repouso', 3),
  parameters: {
    docs: { description: { story: 'Estado padrão — sem fundo, texto em foreground e cursor de clique.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const target = canvas.getByRole('button', { name: 'Ir para página 4' });
    await expect(target).toBeVisible();
    await expect(target).not.toHaveAttribute('aria-current');
    await expect(getComputedStyle(target).pointerEvents).toBe('auto');
  },
};

export const Hover: Story = {
  args: range('Paginação sob o ponteiro', 3),
  parameters: {
    docs: {
      description: {
        story:
          'Sob o ponteiro o link recebe fundo accent. A afordância é o cursor de clique, e o alvo tem que estar realmente alcançável.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const target = canvas.getByRole('button', { name: 'Ir para página 4' });
    await userEvent.hover(target);
    // Não se assere a cor do hover: `:hover` computado é frágil no harness. O
    // que prova a afordância é o cursor, e o que prova que o clique CHEGA é o
    // elemento devolvido no centro da caixa.
    await expect(getComputedStyle(target).cursor).toBe('pointer');
    const box = target.getBoundingClientRect();
    const inCenter = document.elementFromPoint(
      box.left + box.width / 2,
      box.top + box.height / 2,
    );
    await expect(target.contains(inCenter)).toBe(true);
  },
};

export const Active: Story = {
  args: range('Paginação com página atual', 3),
  parameters: {
    covers: ['visual.item3'],
    docs: { description: { story: 'Página atual destacada no meio da faixa — o caso que o Chromatic fotografa.' } },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Exatamente um controle é a página atual', async () => {
      // visual.item3
      const marcados = canvasElement.querySelectorAll('[aria-current="page"]');
      await expect(marcados.length).toBe(1);
      await expect(marcados[0]).toHaveTextContent('3');
    });

    await step('O destaque é visual e não depende da posição', async () => {
      await expect(canvas.getByRole('button', { name: 'Ir para página 3' })).toHaveClass(
        'nds-button-outline',
      );
      await expect(canvas.getByRole('button', { name: 'Ir para página 2' })).toHaveClass(
        'nds-button-ghost',
      );
    });
  },
};

export const Disabled: Story = {
  args: range('Paginação na primeira página', 1),
  parameters: {
    covers: ['functional.item2', 'visual.item4'],
    docs: {
      description: {
        story:
          'Na primeira página o controle Anterior fica desabilitado: opacidade reduzida, fora da tabulação e sem navegar.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const previous = canvas.getByRole('button', { name: LABEL_PREVIOUS });

    await step('Anterior está marcado como desabilitado', async () => {
      // visual.item4 — aqui o controle é um `<button>`, então o `disabled`
      // nativo já tira da tabulação; a opacidade e o bloqueio do ponteiro vêm
      // de `.nds-button:disabled`, no CSS compartilhado.
      await expect(previous).toBeDisabled();
      await expect(getComputedStyle(previous).pointerEvents).toBe('none');
      await expect(Number(getComputedStyle(previous).opacity)).toBeLessThan(1);
    });

    await step('Clicar em Anterior não navega', async () => {
      // functional.item2 — o clique sintético do elemento, e não `fireEvent`:
      // aqui o controle é um <button> com `disabled` nativo, e o navegador barra
      // tanto o clique real quanto o `click()` de um script. `fireEvent`
      // despacharia o evento à força e mediria uma rota que não existe fora do
      // teste.
      onPageChange.mockClear();
      previous.click();
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
  args: range('Paginação com foco', 3),
  parameters: {
    covers: ['accessibility.item3'],
    docs: {
      description: {
        story:
          'Foco por teclado desenha um anel visível em qualquer controle da faixa — inclusive no da página atual.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O anel de foco aparece no controle numerado', async () => {
      // accessibility.item3 — medir a sombra computada é o que prova que a
      // regra do CSS compartilhado chegou ao elemento, e não só que o foco
      // chegou. `ring-2 ring-ring`, que a documentação citava, não existe.
      const target = canvas.getByRole('button', { name: 'Ir para página 2' });
      target.blur();
      target.focus();
      await expect(target).toHaveFocus();
      await expect(getComputedStyle(target).boxShadow).not.toBe('none');
    });

    await step('A página atual também é focável', async () => {
      const active = canvas.getByRole('button', { name: 'Ir para página 3' });
      active.blur();
      active.focus();
      await expect(active).toHaveFocus();
      await expect(getComputedStyle(active).boxShadow).not.toBe('none');
    });
  },
};

export const Contrast: Story = {
  args: range('Paginação medida por contraste', 3),
  parameters: {
    covers: ['accessibility.item2', 'accessibility.item6'],
    docs: {
      description: {
        story:
          'O texto de todo controle da faixa — ativo, inativo e direcional — fica acima de 4.5:1 sobre o fundo em que aparece.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Todo controle passa dos 4.5:1 exigidos para texto', async () => {
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
