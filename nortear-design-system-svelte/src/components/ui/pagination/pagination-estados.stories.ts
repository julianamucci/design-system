import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, expect, fn, userEvent } from 'storybook/test';
import { alvosAbaixoDoMinimo, contrastesDaFaixa } from '@shared/testing/pagination-probe';
import PaginationStory from './PaginationStory.svelte';
import { paginationSource } from './pagination.source';

const ROTULO_ANTERIOR = 'Ir para a página anterior';
const ROTULO_PROXIMA = 'Ir para a próxima página';

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
const faixa = (rotulo: string, page: number) => ({
  count: 50,
  perPage: 10,
  page,
  siblingCount: 2,
  demonstration: 'simples',
  rotulo,
  onPageChange,
});

export const Default: Story = {
  args: faixa('Paginação em repouso', 3),
  parameters: {
    docs: { description: { story: 'Estado padrão — sem fundo, texto em foreground e cursor de clique.' } },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const alvo = canvas.getByRole('button', { name: 'Ir para página 4' });
    await expect(alvo).toBeVisible();
    await expect(alvo).not.toHaveAttribute('aria-current');
    await expect(getComputedStyle(alvo).pointerEvents).toBe('auto');
  },
};

export const Hover: Story = {
  args: faixa('Paginação sob o ponteiro', 3),
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
    const alvo = canvas.getByRole('button', { name: 'Ir para página 4' });
    await userEvent.hover(alvo);
    // Não se assere a cor do hover: `:hover` computado é frágil no harness. O
    // que prova a afordância é o cursor, e o que prova que o clique CHEGA é o
    // elemento devolvido no centro da caixa.
    await expect(getComputedStyle(alvo).cursor).toBe('pointer');
    const caixa = alvo.getBoundingClientRect();
    const noCentro = document.elementFromPoint(
      caixa.left + caixa.width / 2,
      caixa.top + caixa.height / 2,
    );
    await expect(alvo.contains(noCentro)).toBe(true);
  },
};

export const Active: Story = {
  args: faixa('Paginação com página atual', 3),
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
  args: faixa('Paginação na primeira página', 1),
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
    const anterior = canvas.getByRole('button', { name: ROTULO_ANTERIOR });

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
      const proxima = canvas.getByRole('button', { name: ROTULO_PROXIMA });
      await expect(proxima).not.toBeDisabled();
      onPageChange.mockClear();
      await userEvent.click(proxima);
      await expect(onPageChange).toHaveBeenLastCalledWith(2);
    });
  },
};

export const Focus: Story = {
  args: faixa('Paginação com foco', 3),
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
      const alvo = canvas.getByRole('button', { name: 'Ir para página 2' });
      alvo.blur();
      alvo.focus();
      await expect(alvo).toHaveFocus();
      await expect(getComputedStyle(alvo).boxShadow).not.toBe('none');
    });

    await step('A página atual também é focável', async () => {
      const ativo = canvas.getByRole('button', { name: 'Ir para página 3' });
      ativo.blur();
      ativo.focus();
      await expect(ativo).toHaveFocus();
      await expect(getComputedStyle(ativo).boxShadow).not.toBe('none');
    });
  },
};

export const Contrast: Story = {
  args: faixa('Paginação medida por contraste', 3),
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
      const medidas = contrastesDaFaixa(canvasElement);
      await expect(medidas.length).toBe(7);
      await expect(JSON.stringify(medidas.filter((m) => m.razao < 4.5))).toBe('[]');
    });

    await step('Todo controle alcança o alvo de toque mínimo', async () => {
      // accessibility.item6
      await expect(JSON.stringify(alvosAbaixoDoMinimo(canvasElement))).toBe('[]');
    });
  },
};
