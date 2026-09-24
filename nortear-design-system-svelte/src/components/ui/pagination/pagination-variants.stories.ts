import type { Meta, StoryObj } from '@storybook/svelte-vite';

import { within, userEvent, expect } from 'storybook/test';
import { minimumTargetsBelow } from '@shared/testing/pagination-probe';
import PaginationStory from './PaginationStory.svelte';
import {
  paginationAppearanceSource,
  paginationFirstLastSource,
  paginationSource,
  paginationWithoutPagesSource,
} from './pagination.source';

const LABEL_PREVIOUS = 'Ir para a página anterior';
const LABEL_NEXT = 'Ir para a próxima página';

const meta: Meta = {
  title: 'Components/Navigation/Pagination/Variants',
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
          'Variantes do PaginationLink: Default (link inativo), Active (página atual, com aria-current=page) e Directional (Previous/Next com ícone e rótulo). Os três eixos configuráveis vêm em seguida: Appearance (aparência dos controles não ativos), First/last (salto para as pontas) e Without the numbered range (só os direcionais).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  args: {
    count: 50,
    perPage: 10,
    page: 1,
    siblingCount: 2,
    demonstration: 'simples',
    label: 'Paginação com link inativo',
  },
  parameters: {
    docs: {
      description: {
        story: 'Link inativo — fundo transparente. Padrão para toda página que não é a atual.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const inactive = canvas.getByRole('button', { name: 'Ir para página 3' });
    await expect(inactive).not.toHaveAttribute('aria-current');
    // `data-active` só existe quando é verdade — atributo presente com valor
    // "false" faria `[data-active]` casar o item errado.
    await expect(inactive.hasAttribute('data-active')).toBe(false);
    await expect(inactive).toHaveClass('nds-button-ghost');
  },
};

export const Active: Story = {
  args: {
    count: 50,
    perPage: 10,
    page: 3,
    siblingCount: 2,
    demonstration: 'simples',
    label: 'Paginação com página atual',
  },
  parameters: {
    covers: ['accessibility.item4'],
    docs: {
      description: {
        story:
          'Página atual — destaque visual permanente e aria-current="page" para o leitor de tela.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Exatamente um controle se anuncia como página atual', async () => {
      // accessibility.item4 — o contrato é o atributo, não a classe: é ele que
      // o leitor de tela lê.
      const marcados = canvasElement.querySelectorAll('[aria-current="page"]');
      await expect(marcados.length).toBe(1);
      await expect(marcados[0]).toHaveTextContent('3');
    });

    await step('O destaque acompanha a marcação', async () => {
      const active = canvas.getByRole('button', { name: 'Ir para página 3' });
      await expect(active).toHaveAttribute('data-active', 'true');
      await expect(active).toHaveClass('nds-button-outline');
      await expect(canvas.getByRole('button', { name: 'Ir para página 2' })).toHaveClass(
        'nds-button-ghost',
      );
    });
  },
};

export const Directional: Story = {
  args: {
    count: 50,
    perPage: 10,
    page: 2,
    demonstration: 'directional',
    label: 'Paginação direcional',
  },
  parameters: {
    covers: ['accessibility.item5', 'accessibility.item6'],
    docs: {
      description: {
        story:
          'Só os controles de direção. O rótulo textual some abaixo de 40rem e o ícone permanece — o nome acessível não muda.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O nome acessível não depende do rótulo visível', async () => {
      // accessibility.item5 — "Anterior" some no breakpoint estreito; se o nome
      // acessível viesse do texto visível, o controle ficaria mudo em tela
      // pequena. Antes daqui o rótulo saía em inglês.
      const previous = canvas.getByRole('button', { name: LABEL_PREVIOUS });
      const next = canvas.getByRole('button', { name: LABEL_NEXT });
      await expect(previous.querySelector('.nds-pagination-label')).toHaveTextContent('Anterior');
      await expect(next.querySelector('.nds-pagination-label')).toHaveTextContent('Próxima');
      await expect(previous).toHaveClass('nds-pagination-prev');
      await expect(next).toHaveClass('nds-pagination-next');
    });

    await step('Todo controle alcança o alvo de toque mínimo', async () => {
      // accessibility.item6 — WCAG 2.5.8 pede 24×24 CSS px.
      await expect(JSON.stringify(minimumTargetsBelow(canvasElement))).toBe('[]');
    });
  },
};

// ─── Os três eixos que o rodapé de tabela precisava ───────────────────────────
//
// `appearance`, os saltos de ponta e a faixa sem números nasceram em
// 2026-09-23, quando o rodapé do DataTable passou a compor esta faixa em vez de
// desenhar quatro botões soltos. Cada um tem story própria: eixo sem story é
// API que ninguém prova.

const LABEL_FIRST = 'Ir para a primeira página';
const LABEL_LAST = 'Ir para a última página';

export const Appearance: Story = {
  name: 'Appearance (outline)',
  args: {
    count: 50,
    perPage: 10,
    page: 2,
    siblingCount: 2,
    demonstration: 'appearance',
    label: 'Paginação em outline',
  },
  parameters: {
    docs: {
      source: { transform: paginationAppearanceSource },
      description: {
        story:
          'Aparência dos controles não ativos. O padrão é fundo transparente; outline põe moldura em todos eles, e a página atual continua marcada.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Nenhum controle continua em ghost', async () => {
      // A asserção é de AUSÊNCIA porque o eixo é justamente a troca: `ghost` é
      // o padrão, e as stories Default e Directional deste arquivo o afirmam.
      // Contar zero aqui é o que prova que a opção chegou ao `buttonVariants` —
      // uma asserção só de presença passaria mesmo se o `outline` viesse do
      // realce da página atual.
      await expect(canvasElement.querySelectorAll('.nds-button-ghost').length).toBe(0);
      await expect(canvasElement.querySelectorAll('.nds-button-outline').length).toBe(7);
    });

    await step('O inativo e os direcionais seguem o eixo', async () => {
      const inactive = canvas.getByRole('button', { name: 'Ir para página 3' });
      await expect(inactive).toHaveClass('nds-button-outline');
      await expect(inactive).not.toHaveClass('nds-button-ghost');

      for (const name of [LABEL_PREVIOUS, LABEL_NEXT]) {
        const directional = canvas.getByRole('button', { name });
        await expect(directional).toHaveClass('nds-button-outline');
        await expect(directional).not.toHaveClass('nds-button-ghost');
      }
    });

    await step('A página atual continua marcada', async () => {
      // O realce da atual não pode sumir quando a faixa inteira vira `outline`:
      // quem responde "que página é esta?" em voz alta é o `aria-current`, e é
      // ele que segura a marcação quando a variante deixa de distinguir.
      const active = canvas.getByRole('button', { name: 'Ir para página 2' });
      await expect(active).toHaveAttribute('aria-current', 'page');
      await expect(active).toHaveAttribute('data-active', 'true');
      await expect(active).toHaveClass('nds-button-outline');
    });
  },
};

export const FirstLast: Story = {
  name: 'First/last (jump to the ends)',
  args: {
    count: 80,
    perPage: 10,
    page: 4,
    siblingCount: 2,
    demonstration: 'first-last',
    label: 'Paginação com salto para as pontas',
  },
  parameters: {
    docs: {
      source: { transform: paginationFirstLastSource },
      description: {
        story:
          'Saltos para as pontas, por fora dos direcionais. O duplo chevron é o que os separa do passo de uma página.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Os dois controles novos existem, nomeados', async () => {
      const first = canvas.getByRole('button', { name: LABEL_FIRST });
      const last = canvas.getByRole('button', { name: LABEL_LAST });
      await expect(first).toHaveAttribute('data-slot', 'pagination-first');
      await expect(last).toHaveAttribute('data-slot', 'pagination-last');
    });

    await step('Eles ficam nas PONTAS, por fora dos direcionais', async () => {
      // A ordem é o contrato: primeira antes do anterior, última depois do
      // próximo. Emitir os quatro na ordem errada passaria em qualquer asserção
      // de presença e entregaria uma faixa que ninguém consegue ler.
      const slots = [...canvasElement.querySelectorAll('[data-slot^="pagination"]')]
        .map((el) => el.getAttribute('data-slot'))
        .filter((slot) => slot !== 'pagination-item' && slot !== 'pagination-link');
      await expect(slots[0]).toBe('pagination');
      await expect(slots[1]).toBe('pagination-content');
      await expect(slots[2]).toBe('pagination-first');
      await expect(slots[3]).toBe('pagination-previous');
      await expect(slots[slots.length - 2]).toBe('pagination-next');
      await expect(slots[slots.length - 1]).toBe('pagination-last');
    });

    await step('O salto usa DUPLO chevron, o passo usa um só', async () => {
      const linhas = (slot: string) =>
        canvasElement.querySelectorAll(`[data-slot="${slot}"] svg path`).length;
      await expect(linhas('pagination-first')).toBe(2);
      await expect(linhas('pagination-last')).toBe(2);
      await expect(linhas('pagination-previous')).toBe(1);
      await expect(linhas('pagination-next')).toBe(1);
    });

    await step('Sem texto visível, o controle é o quadrado de ícone', async () => {
      for (const slot of ['pagination-first', 'pagination-last']) {
        const control = canvasElement.querySelector(`[data-slot="${slot}"]`) as HTMLElement;
        await expect(control).toHaveClass('nds-button-icon');
        await expect(control.querySelector('.nds-pagination-label')).toBeNull();
      }
      // WCAG 2.5.8 (24×24 CSS px) pela sonda compartilhada, que desde
      // 2026-09-23 colhe os SEIS slots. Medir aqui à mão excluiria os
      // numerados desta faixa em silêncio, que é o defeito que a sonda existe
      // para não ter.
      await expect(JSON.stringify(minimumTargetsBelow(canvasElement))).toBe('[]');
    });

    await step('Cada um salta para a sua ponta', async () => {
      await userEvent.click(canvas.getByRole('button', { name: LABEL_FIRST }));
      await expect(canvas.getByRole('button', { name: 'Ir para página 1' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await expect(canvas.getByRole('button', { name: LABEL_FIRST })).toBeDisabled();

      await userEvent.click(canvas.getByRole('button', { name: LABEL_LAST }));
      await expect(canvas.getByRole('button', { name: 'Ir para página 8' })).toHaveAttribute(
        'aria-current',
        'page',
      );
      await expect(canvas.getByRole('button', { name: LABEL_LAST })).toBeDisabled();
    });
  },
};

export const WithoutPages: Story = {
  name: 'Without the numbered range',
  args: {
    count: 100,
    perPage: 10,
    page: 1,
    siblingCount: 1,
    demonstration: 'without-pages',
    label: 'Paginação sem números',
  },
  parameters: {
    docs: {
      source: { transform: paginationWithoutPagesSource },
      description: {
        story:
          'A faixa sem a régua numerada — a forma do rodapé de tabela, onde quem diz em que página se está é o contador ao lado.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A régua não renderiza número nem reticência', async () => {
      // Nesta stack a régua é COMPOSTA por quem consome: suprimi-la é não
      // escrever o laço. Contar zero é o que prova que a faixa continua inteira
      // sem ela — sem número, sem reticência, e com os quatro controles de pé.
      await expect(canvasElement.querySelectorAll('[data-slot="pagination-link"]').length).toBe(0);
      await expect(
        canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]').length,
      ).toBe(0);
      await expect(canvasElement.querySelectorAll('[data-slot="pagination-item"]').length).toBe(4);
      await expect(canvasElement.querySelectorAll('[aria-current]').length).toBe(0);
    });

    await step('Sobram os quatro controles, na ordem', async () => {
      const controls = canvas.getAllByRole('button');
      await expect(controls.map((c) => c.getAttribute('aria-label'))).toEqual([
        LABEL_FIRST,
        LABEL_PREVIOUS,
        LABEL_NEXT,
        LABEL_LAST,
      ]);
    });

    await step('O extremo continua calculado sem a régua na tela', async () => {
      // É o risco desta stack, e é por isso que a story para na PRIMEIRA
      // página: quem desabilita os direcionais é o primitivo, lendo a página
      // contra o total — não os números. Uma story no meio da faixa passaria
      // com a conta quebrada. Os dois saltos são do consumidor, e a story diz
      // isso ao afirmar os quatro juntos.
      await expect(canvas.getByRole('button', { name: LABEL_FIRST })).toBeDisabled();
      await expect(canvas.getByRole('button', { name: LABEL_PREVIOUS })).toBeDisabled();
      await expect(canvas.getByRole('button', { name: LABEL_NEXT })).toBeEnabled();
      await expect(canvas.getByRole('button', { name: LABEL_LAST })).toBeEnabled();
    });

    await step('Texto visível vazio não deixa um bloco oco dentro do botão', async () => {
      // `.nds-pagination-label` é `display: block` acima de 40rem, e um `<span>`
      // vazio ali ocuparia uma linha inteira dentro do botão — o quadrado
      // deixaria de ser quadrado. Quem nomeia o controle é o `aria-label`.
      await expect(canvasElement.querySelectorAll('.nds-pagination-label').length).toBe(0);
      for (const name of [LABEL_PREVIOUS, LABEL_NEXT]) {
        const control = canvas.getByRole('button', { name });
        await expect(control).toHaveClass('nds-button-icon');
        await expect(control).not.toHaveClass('nds-pagination-prev');
        await expect(control).not.toHaveClass('nds-pagination-next');
      }
    });
  },
};
