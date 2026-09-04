import type { Meta, StoryObj } from '@storybook/html-vite';
import { fireEvent, fn, userEvent, within, expect } from 'storybook/test';
import { minimumTargetsBelow, rangeContrastes } from '@shared/testing/pagination-probe';
import { createPagination } from './pagination';
import { wrap } from './pagination.fixtures';
import { paginationSource, paginationSourceWith } from './pagination.source';

const LABEL_PREVIOUS = 'Ir para a página anterior';
const LABEL_NEXT = 'Ir para a próxima página';

/** Espião de escopo de módulo: dentro do `render`, a play não o alcançaria. */
const onPageChange = fn();

const meta: Meta = {
  tags: ['navigation'],
  title: 'Components/Navigation/Pagination/States',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: paginationSource },
      description: {
        component:
          'Estados do Pagination: Default (inativo), Hover, Active (aria-current="page"), Disabled nos dois extremos, Focus e Contrast.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Faixa de 5 páginas com a página atual parametrizada. */
const range = (label: string, current: number) => () =>
  wrap(
    createPagination({
      total: 5,
      current,
      showPrevNext: true,
      'aria-label': label,
      onPageChange,
    }),
  );

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  render: range('Paginação em repouso', 3),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('O link inativo está visível e não é a página atual', async () => {
      const inactive = canvas.getByRole('link', { name: 'Ir para página 4' });
      await expect(inactive).toBeVisible();
      await expect(inactive).not.toHaveAttribute('aria-current');
      await expect(getComputedStyle(inactive).pointerEvents).toBe('auto');
    });
  },
};

export const Hover: Story = {
  render: range('Paginação sob o ponteiro', 3),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('O link é alcançável pelo ponteiro e se anuncia clicável', async () => {
      const target = canvas.getByRole('link', { name: 'Ir para página 4' });
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
    });
  },
};

export const Active: Story = {
  name: 'Active (current page)',
  parameters: { covers: ['visual.item3'] },
  render: range('Paginação com página atual', 3),
  play: async ({ canvasElement, step }) => {
    await step('Exatamente um link é a página atual', async () => {
      // visual.item3
      const marcados = canvasElement.querySelectorAll('[aria-current="page"]');
      await expect(marcados.length).toBe(1);
      await expect(marcados[0].textContent?.trim()).toBe('3');
    });

    await step('A página atual não navega para si mesma', async () => {
      const active = canvasElement.querySelector<HTMLAnchorElement>('[aria-current="page"]')!;
      onPageChange.mockClear();
      await fireEvent.click(active);
      await expect(onPageChange).not.toHaveBeenCalled();
    });
  },
};

export const DisabledFirst: Story = {
  name: 'Disabled (previous on first page)',
  parameters: { covers: ['functional.item2', 'visual.item4'] },
  render: range('Paginação na primeira página', 1),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const previous = canvas.getByRole('link', { name: LABEL_PREVIOUS });

    await step('Anterior está marcado como desabilitado', async () => {
      // visual.item4 — em `<a>` não existe `disabled`; o par correto é
      // aria-disabled + a supressão do clique e da tabulação.
      await expect(previous).toHaveAttribute('aria-disabled', 'true');
      await expect(previous).toHaveAttribute('tabindex', '-1');
      await expect(getComputedStyle(previous).pointerEvents).toBe('none');
      await expect(Number(getComputedStyle(previous).opacity)).toBeLessThan(1);
    });

    await step('Clicar em Anterior não navega', async () => {
      // functional.item2 — `fireEvent` e não `userEvent`: o CSS já barra o
      // ponteiro, e o que falta provar é o outro caminho, o evento que chega
      // por script ou por teclado.
      onPageChange.mockClear();
      await fireEvent.click(previous);
      await expect(onPageChange).not.toHaveBeenCalled();
    });

    await step('Próxima continua ativo', async () => {
      const next = canvas.getByRole('link', { name: LABEL_NEXT });
      await expect(next).not.toHaveAttribute('aria-disabled');
      onPageChange.mockClear();
      await userEvent.click(next);
      await expect(onPageChange).toHaveBeenLastCalledWith(2);
    });
  },
};

export const DisabledLast: Story = {
  name: 'Disabled (next on last page)',
  parameters: {
    covers: ['functional.item3'],
    // Override de story: estar na ÚLTIMA página é o assunto, e o snippet do
    // meta parte da primeira.
    docs: { source: { transform: paginationSourceWith({ total: 5, current: 5 }) } },
  },
  render: range('Paginação na última página', 5),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const next = canvas.getByRole('link', { name: LABEL_NEXT });

    await step('Próxima está marcado como desabilitado', async () => {
      await expect(next).toHaveAttribute('aria-disabled', 'true');
      await expect(next).toHaveAttribute('tabindex', '-1');
      await expect(getComputedStyle(next).pointerEvents).toBe('none');
    });

    await step('Clicar em Próxima não navega', async () => {
      // functional.item3
      onPageChange.mockClear();
      await fireEvent.click(next);
      await expect(onPageChange).not.toHaveBeenCalled();
    });

    await step('Anterior continua ativo', async () => {
      await expect(canvas.getByRole('link', { name: LABEL_PREVIOUS })).not.toHaveAttribute(
        'aria-disabled',
      );
    });
  },
};

export const Focus: Story = {
  name: 'Focus (Tab)',
  parameters: { covers: ['accessibility.item3', 'functional.item4'] },
  render: range('Paginação com foco', 3),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Tab percorre os controles na ordem visual', async () => {
      // functional.item4 — a ordem de foco é a do DOM: anterior, 1..5, próxima.
      const esperados = [
        canvas.getByRole('link', { name: LABEL_PREVIOUS }),
        canvas.getByRole('link', { name: 'Ir para página 1' }),
        canvas.getByRole('link', { name: 'Ir para página 2' }),
      ].filter((el) => el.getAttribute('tabindex') !== '-1');

      (document.activeElement as HTMLElement | null)?.blur();
      for (const target of esperados) {
        await userEvent.tab();
        await expect(target).toHaveFocus();
      }
    });

    await step('O anel de foco aparece no link focado', async () => {
      // accessibility.item3 — medir a sombra computada é o que prova que a
      // regra do CSS compartilhado chegou ao elemento. `ring-2 ring-ring`, que
      // a documentação citava, não existe.
      const target = canvas.getByRole('link', { name: 'Ir para página 2' });
      target.blur();
      target.focus();
      await expect(target).toHaveFocus();
      await expect(getComputedStyle(target).boxShadow).not.toBe('none');
    });
  },
};

export const Contrast: Story = {
  parameters: { covers: ['accessibility.item2', 'accessibility.item6'] },
  render: range('Paginação medida por contraste', 3),
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
