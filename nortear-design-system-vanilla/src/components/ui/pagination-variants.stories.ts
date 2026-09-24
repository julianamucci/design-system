import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect } from 'storybook/test';
import { minimumTargetsBelow } from '@shared/testing/pagination-probe';
import { createPagination } from './pagination';
import { wrap } from './pagination.fixtures';
import { paginationSource, paginationSourceWith } from './pagination.source';

const LABEL_PREVIOUS = 'Ir para a página anterior';
const LABEL_NEXT = 'Ir para a próxima página';

const meta: Meta = {
  tags: ['navigation'],
  title: 'Components/Navigation/Pagination/Variants',
  parameters: {
    actions: { disable: true },
    layout: 'padded',
    controls: { disable: true },
    docs: {
      source: { transform: paginationSource },
      description: {
        component:
          'Variantes do link de paginação: Default (inativo), Active (página atual, com aria-current=page) e Directional (anterior/próxima com ícone). A marcação da página atual é aplicada quando `page === current`. Os três eixos configuráveis vêm em seguida: Appearance (aparência dos controles não ativos), First/last (salto para as pontas) e Without the numbered range (só os direcionais).',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const Default: Story = {
  parameters: {
    // Override de story: a supressão dos direcionais é o assunto aqui, e
    // `showPrevNext` não passa por control nenhum neste arquivo.
    docs: {
      source: {
        transform: paginationSourceWith({
          total: 5,
          current: 2,
          showPrevNext: false,
          'aria-label': 'Paginação com link inativo',
        }),
      },
    },
  },
  render: () =>
    wrap(
      createPagination({
        total: 5,
        current: 2,
        showPrevNext: false,
        'aria-label': 'Paginação com link inativo',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Cinco números visíveis, sem controles direcionais', async () => {
      const links = canvas.getAllByRole('button');
      await expect(links.length).toBe(5);
      await expect(canvasElement.querySelector('[data-slot="pagination-previous"]')).toBeNull();
    });

    await step('O link inativo não se anuncia como página atual', async () => {
      const inactive = canvas.getByRole('button', { name: 'Ir para página 3' });
      await expect(inactive).not.toHaveAttribute('aria-current');
      // `data-active` só existe quando é verdade — atributo presente com valor
      // "false" faria `[data-active]` casar o item errado.
      await expect(inactive.hasAttribute('data-active')).toBe(false);
    });
  },
};

export const Active: Story = {
  name: 'Active (current page)',
  parameters: {
    docs: {
      source: {
        transform: paginationSourceWith({
          total: 7,
          current: 4,
          showPrevNext: false,
          'aria-label': 'Paginação com página atual',
        }),
      },
    },
  },
  render: () =>
    wrap(
      createPagination({
        total: 7,
        current: 4,
        showPrevNext: false,
        'aria-label': 'Paginação com página atual',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Exatamente um link é a página atual', async () => {
      const marcados = canvasElement.querySelectorAll('[aria-current="page"]');
      await expect(marcados.length).toBe(1);
      await expect(marcados[0].textContent?.trim()).toBe('4');
    });

    await step('A página atual continua rotulada e destacada', async () => {
      const active = canvas.getByRole('button', { name: 'Ir para página 4' });
      await expect(active).toHaveAttribute('aria-current', 'page');
      await expect(active).toHaveAttribute('data-active', 'true');
      // O realce da página atual é a VARIANTE do botão, não uma segunda folha
      // de link: `outline` na atual, `ghost` nas demais.
      await expect(active).toHaveClass('nds-button-outline');
      await expect(canvas.getByRole('button', { name: 'Ir para página 3' })).toHaveClass(
        'nds-button-ghost',
      );
    });
  },
};

export const Directional: Story = {
  name: 'Directional (previous/next)',
  parameters: { covers: ['accessibility.item5', 'accessibility.item6'] },
  render: () =>
    wrap(
      createPagination({
        total: 8,
        current: 4,
        showPrevNext: true,
        'aria-label': 'Paginação direcional',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Os controles de direção têm rótulo em português', async () => {
      // accessibility.item5 — abaixo de 40rem o rótulo por extenso é escondido
      // e sobra o chevron: sem o `aria-label` o controle fica mudo justamente
      // na tela estreita. Antes daqui ele saía como "Go to previous page".
      const previous = canvas.getByRole('button', { name: LABEL_PREVIOUS });
      const next = canvas.getByRole('button', { name: LABEL_NEXT });
      await expect(previous.querySelector('svg')).not.toBeNull();
      await expect(next.querySelector('svg')).not.toBeNull();
    });

    await step('O controle é o BOTÃO, na mesma variante e tamanho das outras stacks', async () => {
      // O direcional é `.nds-button` ghost em tamanho default MAIS a classe de
      // recuo assimétrico — que sozinha é (0,1,0) e perderia para
      // `.nds-button:has(> svg)`. Asserir as duas juntas é o que dá dentes à
      // decisão: emitir só `.nds-pagination-prev` volta a ser invisível na tela.
      const previous = canvas.getByRole('button', { name: LABEL_PREVIOUS });
      const next = canvas.getByRole('button', { name: LABEL_NEXT });
      await expect(previous).toHaveClass('nds-button');
      await expect(previous).toHaveClass('nds-button-ghost');
      await expect(previous).toHaveClass('nds-pagination-prev');
      await expect(next).toHaveClass('nds-button');
      await expect(next).toHaveClass('nds-button-ghost');
      await expect(next).toHaveClass('nds-pagination-next');

      // O número é o mesmo botão em tamanho `icon`.
      //
      // Página 3, e não 2: com `total: 8` e `current: 4` a régua colapsa 2, 6 e 7
      // atrás das reticências, então a 2 não chega a ser renderizada. A asserção
      // nasceu apontando para ela e reprovou na primeira suíte — é fato de DOM
      // renderizado, que nenhuma conferência estática alcança.
      const numbered = canvas.getByRole('button', { name: 'Ir para página 3' });
      await expect(numbered).toHaveClass('nds-button');
      await expect(numbered).toHaveClass('nds-button-icon');
      await expect(numbered).toHaveClass('nds-button-ghost');
    });

    await step('O rótulo por extenso acompanha o chevron', async () => {
      // "Anterior"/"Próxima" por extenso é o que o próprio Do & Don't pede.
      // `.nds-pagination-label` é quem o esconde abaixo de 40rem — a classe
      // existe na folha compartilhada e nenhuma stack a emitia aqui.
      const labels = canvasElement.querySelectorAll('.nds-pagination-label');
      await expect(labels.length).toBe(2);
      await expect([...labels].map((r) => r.textContent)).toEqual(['Anterior', 'Próxima']);
    });

    await step('O ícone é decoração, não conteúdo', async () => {
      for (const icon of canvasElement.querySelectorAll('svg')) {
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
      }
    });

    await step('Todo controle alcança o alvo de toque mínimo', async () => {
      // accessibility.item6 — WCAG 2.5.8 pede 24×24 CSS px.
      await expect(JSON.stringify(minimumTargetsBelow(canvasElement))).toBe('[]');
    });
  },
};

// ─── Os três eixos que o rodapé de tabela precisava ───────────────────────────
//
// `appearance`, `showFirstLast` e `showPages` nasceram em 2026-09-23, quando o
// rodapé do DataTable passou a compor esta fábrica em vez de desenhar quatro
// botões soltos. Cada um tem story própria: eixo sem story é API que ninguém
// prova, e as outras quatro stacks vão ler daqui qual é a forma.

export const Appearance: Story = {
  name: 'Appearance (outline)',
  parameters: {
    docs: {
      source: {
        transform: paginationSourceWith({
          total: 5,
          current: 2,
          appearance: 'outline',
          'aria-label': 'Paginação em outline',
        }),
      },
    },
  },
  render: () =>
    wrap(
      createPagination({
        total: 5,
        current: 2,
        appearance: 'outline',
        'aria-label': 'Paginação em outline',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Nenhum controle continua em ghost', async () => {
      // A asserção é de AUSÊNCIA porque o eixo é justamente a troca: `ghost` é
      // o padrão, e as stories Default e Directional deste arquivo o afirmam.
      // Contar zero aqui é o que prova que a opção chegou ao `btnClass` — uma
      // asserção só de presença passaria mesmo se o `outline` viesse do realce
      // da página atual.
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
  parameters: {
    docs: {
      source: {
        transform: paginationSourceWith({
          total: 8,
          current: 4,
          showFirstLast: true,
          'aria-label': 'Paginação com salto para as pontas',
        }),
      },
    },
  },
  render: () => {
    const pedidas: number[] = [];
    const nav = createPagination({
      total: 8,
      current: 4,
      showFirstLast: true,
      'aria-label': 'Paginação com salto para as pontas',
      onPageChange: (page) => {
        pedidas.push(page);
        nav.dataset.pedidas = pedidas.join(',');
      },
    });
    return wrap(nav);
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const nav = canvasElement.querySelector('[data-slot="pagination"]') as HTMLElement;

    await step('Os dois controles novos existem, nomeados', async () => {
      const first = canvas.getByRole('button', { name: 'Ir para a primeira página' });
      const last = canvas.getByRole('button', { name: 'Ir para a última página' });
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
        // WCAG 2.5.8 (24×24 CSS px) medido AQUI, e a medição local FICA.
        //
        // Ela nasceu porque `minimumTargetsBelow` colhia por
        // `pagination-link|previous|next` e excluía os dois slots novos em
        // silêncio. A sonda foi corrigida no mesmo dia e hoje colhe os seis —
        // mas a asserção aqui é sobre ESTA story, e uma medida que não depende
        // da lista de slots da sonda é o que impede o defeito de voltar por
        // aquele caminho.
        const box = control.getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(24);
        await expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });

    await step('Cada um salta para a sua ponta', async () => {
      await userEvent.click(canvas.getByRole('button', { name: 'Ir para a primeira página' }));
      await expect(nav.dataset.pedidas).toBe('1');
      await userEvent.click(canvas.getByRole('button', { name: 'Ir para a última página' }));
      await expect(nav.dataset.pedidas).toBe('1,8');
    });
  },
};

export const WithoutPages: Story = {
  name: 'Without the numbered range',
  parameters: {
    docs: {
      source: {
        transform: paginationSourceWith({
          total: 10,
          current: 5,
          showPages: false,
          'aria-label': 'Paginação sem números',
        }),
      },
    },
  },
  render: () =>
    wrap(
      createPagination({
        total: 10,
        current: 5,
        showPages: false,
        'aria-label': 'Paginação sem números',
        onPageChange: () => {},
      }),
    ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('A régua não renderiza número nem reticência', async () => {
      // Com 10 páginas e a atual no meio, a régua padrão traria sete itens e
      // duas reticências: contar zero dos dois é o que separa "a opção
      // funcionou" de "a story escolheu um total pequeno demais para mostrar".
      await expect(canvasElement.querySelectorAll('[data-slot="pagination-link"]').length).toBe(0);
      await expect(
        canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]').length,
      ).toBe(0);
      await expect(canvasElement.querySelectorAll('[data-slot="pagination-item"]').length).toBe(2);
    });

    await step('Sobram os direcionais, e eles continuam funcionando', async () => {
      const controls = canvas.getAllByRole('button');
      await expect(controls.length).toBe(2);
      await expect(controls.map((c) => c.getAttribute('aria-label'))).toEqual([
        LABEL_PREVIOUS,
        LABEL_NEXT,
      ]);
      // No meio da faixa nenhum dos dois é extremo.
      await expect(controls[0]).not.toBeDisabled();
      await expect(controls[1]).not.toBeDisabled();
    });

    await step('Sem número, nada se anuncia como página atual', async () => {
      await expect(canvasElement.querySelectorAll('[aria-current]').length).toBe(0);
    });

    await step('Texto visível vazio não deixa um bloco oco dentro do botão', async () => {
      // É a forma que o rodapé do DataTable usa: nome acessível sim, palavra na
      // tela não. `.nds-pagination-label` é `display: block` acima de 40rem, e
      // um `<span>` vazio ali ocuparia uma linha inteira dentro do botão — o
      // quadrado deixaria de ser quadrado. A faixa nasce fora do documento
      // porque o assunto é a marcação, não a medida.
      const muda = createPagination({
        total: 4,
        current: 2,
        showPages: false,
        labels: { previousText: '', nextText: '' },
      });
      await expect(muda.querySelectorAll('.nds-pagination-label').length).toBe(0);
      const previous = muda.querySelector('[data-slot="pagination-previous"]') as HTMLElement;
      await expect(previous).toHaveClass('nds-button-icon');
      await expect(previous).not.toHaveClass('nds-pagination-prev');
      await expect(previous).toHaveAttribute('aria-label', LABEL_PREVIOUS);
    });
  },
};
