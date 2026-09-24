import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import {
  NdsPagination,
  NdsPaginationContent,
  NdsPaginationEllipsis,
  NdsPaginationFirst,
  NdsPaginationItem,
  NdsPaginationLast,
  NdsPaginationLink,
  NdsPaginationNext,
  NdsPaginationPrevious,
} from './pagination';
import {
  paginationAppearanceSource,
  paginationDirectionalSource,
  paginationFirstLastSource,
  paginationWithoutPagesSource,
  LABEL_FIRST,
  LABEL_LAST,
  LABEL_NEXT,
  LABEL_PAGE,
  LABEL_PREVIOUS,
} from './pagination.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// `controls.disable`: nenhuma story daqui tem argTypes, e sem isso o painel
// Controls aparece vazio.
//
// `Simple`, `WithEllipsis` e `Interactive` saíram deste arquivo para
// `pagination-compositions.stories.ts`: nas outras quatro stacks as três são
// composições, e o grupo da barra lateral sai do ARQUIVO.

const meta: Meta = {
  title: 'Components/Navigation/Pagination/Variants',
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
        NdsPaginationFirst,
        NdsPaginationLast,
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
          'Configurações da paginação: a faixa reduzida aos controles de direção, a aparência dos controles não ativos, o salto para as pontas e a faixa sem régua numerada.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

// ─── Direcional ───────────────────────────────────────────────────────────────

export const Directional: Story = {
  parameters: {
    covers: ['accessibility.item5'],
    docs: {
      source: { transform: paginationDirectionalSource },
      description: {
        story:
          'Só os controles de direção. O rótulo textual some abaixo de 40rem e o ícone permanece — o nome acessível não muda.',
      },
    },
  },
  render: () => ({
    props: {
      labelPrevious: LABEL_PREVIOUS,
      labelNext: LABEL_NEXT,
    },
    template: `
      <nav ndsPagination label="Paginação direcional">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <button ndsPaginationPrevious type="button" text="Anterior" [label]="labelPrevious"></button>
          </li>
          <li ndsPaginationItem>
            <button ndsPaginationNext type="button" text="Próxima" [label]="labelNext"></button>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('O nome acessível não depende do rótulo visível', async () => {
      // accessibility.item5 — "Anterior" some no breakpoint estreito; se o nome
      // acessível viesse do texto visível, o controle ficaria mudo justamente em
      // tela pequena.
      const previous = canvas.getByRole('button', { name: LABEL_PREVIOUS });
      const next = canvas.getByRole('button', { name: LABEL_NEXT });
      await expect(previous.querySelector('.nds-pagination-label')).toHaveTextContent('Anterior');
      await expect(next.querySelector('.nds-pagination-label')).toHaveTextContent('Próxima');
      await expect(previous).toHaveClass('nds-pagination-prev');
      await expect(next).toHaveClass('nds-pagination-next');
    });

    await step('O ícone é decoração, não conteúdo', async () => {
      const icons = canvasElement.querySelectorAll('svg');
      await expect(icons.length).toBe(2);
      for (const icon of icons) {
        await expect(icon).toHaveAttribute('aria-hidden', 'true');
      }
    });
  },
};

// ─── Os três eixos que o rodapé de tabela precisava ───────────────────────────
//
// `appearance` e os saltos para as pontas nasceram em 2026-09-23, quando o
// rodapé do DataTable passou a compor esta faixa em vez de desenhar quatro
// botões soltos. Cada um tem story própria: eixo sem story é API que ninguém
// prova.
//
// O TERCEIRO eixo — a régua numerada — não tem forma própria nesta stack. Aqui
// a régua é do CONSUMIDOR (V11 do PRD): quem monta a faixa escreve cada `<li>`
// com o seu `ndsPaginationLink`, e a faixa sem números é simplesmente a que não
// os escreve. Um `showPages` não teria o que esconder — seria opção inerte, que
// é pior que opção ausente porque parece contrato. `WithoutPages` prova a
// FORMA, que é o que existe para provar.

/** Espiões de escopo de módulo: dentro do `render`, a play não os alcançaria. */
const onJump = fn();
const onStep = fn();

export const Appearance: Story = {
  name: 'Appearance (outline)',
  parameters: {
    docs: {
      source: { transform: paginationAppearanceSource },
      description: {
        story:
          'A aparência dos controles não ativos. O padrão é discreto; aqui a faixa inteira ganha borda — é a forma que o rodapé de tabela usa, para a paginação não sumir dentro dele.',
      },
    },
  },
  render: () => ({
    props: {
      pages: [1, 2, 3, 4, 5],
      current: 2,
      pageLabel: LABEL_PAGE,
      labelPrevious: LABEL_PREVIOUS,
      labelNext: LABEL_NEXT,
    },
    template: `
      <nav ndsPagination label="Paginação em outline">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <button
              ndsPaginationPrevious
              type="button"
              text="Anterior"
              appearance="outline"
              [label]="labelPrevious"
            ></button>
          </li>
          @for (n of pages; track n) {
            <li ndsPaginationItem>
              <button
                ndsPaginationLink
                type="button"
                appearance="outline"
                [isActive]="n === current"
                [attr.aria-label]="pageLabel + ' ' + n"
              >{{ n }}</button>
            </li>
          }
          <li ndsPaginationItem>
            <button
              ndsPaginationNext
              type="button"
              text="Próxima"
              appearance="outline"
              [label]="labelNext"
            ></button>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Nenhum controle continua na aparência discreta', async () => {
      // A asserção é de AUSÊNCIA porque o eixo é justamente a troca: `ghost` é o
      // padrão, e a story `Directional` deste arquivo é quem o afirma. Contar
      // zero aqui é o que prova que a opção chegou ao `btnClass` — uma asserção
      // só de presença passaria mesmo se o `outline` viesse do realce da página
      // atual.
      await expect(canvasElement.querySelectorAll('.nds-button-ghost').length).toBe(0);
      await expect(canvasElement.querySelectorAll('.nds-button-outline').length).toBe(7);
    });

    await step('O inativo e os direcionais seguem o eixo', async () => {
      const inactive = canvas.getByRole('button', { name: `${LABEL_PAGE} 3` });
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
      const active = canvas.getByRole('button', { name: `${LABEL_PAGE} 2` });
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
      source: { transform: paginationFirstLastSource },
      description: {
        story:
          'Dois controles a mais, nas pontas da faixa: eles saltam para o começo e para o fim em vez de andar um passo. O chevron duplo é o que separa o salto do passo.',
      },
    },
  },
  render: () => ({
    props: {
      pages: [1, 2, 3, 4, 5, 6, 7, 8],
      total: 8,
      current: 4,
      pageLabel: LABEL_PAGE,
      labelFirst: LABEL_FIRST,
      labelLast: LABEL_LAST,
      labelPrevious: LABEL_PREVIOUS,
      labelNext: LABEL_NEXT,
      onJump,
    },
    template: `
      <nav ndsPagination label="Paginação com salto para as pontas">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <button
              ndsPaginationFirst
              type="button"
              [label]="labelFirst"
              (click)="onJump(1)"
            ></button>
          </li>
          <li ndsPaginationItem>
            <button
              ndsPaginationPrevious
              type="button"
              text="Anterior"
              [label]="labelPrevious"
            ></button>
          </li>
          @for (n of pages; track n) {
            <li ndsPaginationItem>
              <button
                ndsPaginationLink
                type="button"
                [isActive]="n === current"
                [attr.aria-label]="pageLabel + ' ' + n"
              >{{ n }}</button>
            </li>
          }
          <li ndsPaginationItem>
            <button
              ndsPaginationNext
              type="button"
              text="Próxima"
              [label]="labelNext"
            ></button>
          </li>
          <li ndsPaginationItem>
            <button
              ndsPaginationLast
              type="button"
              [label]="labelLast"
              (click)="onJump(total)"
            ></button>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    onJump.mockClear();

    await step('Os dois controles novos existem, nomeados', async () => {
      const first = canvas.getByRole('button', { name: LABEL_FIRST });
      const last = canvas.getByRole('button', { name: LABEL_LAST });
      // O `data-slot` chega por host binding da diretiva. Nesta stack o binding
      // APAGA o atributo estático e vence o `[attr.x]` do template, e foi assim
      // que 19 peças se perderam em 2026-09-01 — então o valor é conferido no
      // DOM, que é onde a disputa se resolve.
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
        // WCAG 2.5.8 (24 por 24 CSS px) medido AQUI, no mesmo passo que afirma
        // o quadrado: o que está em jogo nesta story é a forma do controle sem
        // texto, e é ela que pode encolher. A sonda compartilhada já conhece os
        // dois slots novos e continua medindo a faixa inteira nas outras
        // stories — isto não a substitui.
        const box = control.getBoundingClientRect();
        await expect(box.width).toBeGreaterThanOrEqual(24);
        await expect(box.height).toBeGreaterThanOrEqual(24);
      }
    });

    await step('Cada um salta para a sua ponta', async () => {
      await userEvent.click(canvas.getByRole('button', { name: LABEL_FIRST }));
      await expect(onJump).toHaveBeenLastCalledWith(1);
      await userEvent.click(canvas.getByRole('button', { name: LABEL_LAST }));
      await expect(onJump).toHaveBeenLastCalledWith(8);
    });
  },
};

export const WithoutPages: Story = {
  name: 'Without the numbered range',
  parameters: {
    docs: {
      source: { transform: paginationWithoutPagesSource },
      description: {
        story:
          'A faixa reduzida a saltos e passos, sem número nenhum — a forma que o rodapé da tabela avançada usa. Quem diz em que página se está é o texto ao lado, não um número realçado dentro da faixa.',
      },
    },
  },
  render: () => ({
    props: {
      onStep,
      labelFirst: 'Primeira página',
      labelPrevious: 'Página anterior',
      labelNext: 'Próxima página',
      labelLast: 'Última página',
    },
    template: `
      <nav ndsPagination data-align="end" label="Paginação sem números">
        <ul ndsPaginationContent>
          <li ndsPaginationItem>
            <button
              ndsPaginationFirst
              type="button"
              appearance="outline"
              [label]="labelFirst"
              (click)="onStep(1)"
            ></button>
          </li>
          <li ndsPaginationItem>
            <button
              ndsPaginationPrevious
              type="button"
              text=""
              appearance="outline"
              [label]="labelPrevious"
              (click)="onStep(4)"
            ></button>
          </li>
          <li ndsPaginationItem>
            <button
              ndsPaginationNext
              type="button"
              text=""
              appearance="outline"
              [label]="labelNext"
              (click)="onStep(6)"
            ></button>
          </li>
          <li ndsPaginationItem>
            <button
              ndsPaginationLast
              type="button"
              appearance="outline"
              [label]="labelLast"
              (click)="onStep(10)"
            ></button>
          </li>
        </ul>
      </nav>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    onStep.mockClear();

    await step('A faixa não traz número nem reticência', async () => {
      await expect(canvasElement.querySelectorAll('[data-slot="pagination-link"]').length).toBe(0);
      await expect(
        canvasElement.querySelectorAll('[data-slot="pagination-ellipsis"]').length,
      ).toBe(0);
      await expect(canvasElement.querySelectorAll('[data-slot="pagination-item"]').length).toBe(4);
    });

    await step('Sem número, nada se anuncia como página atual', async () => {
      await expect(canvasElement.querySelectorAll('[aria-current]').length).toBe(0);
    });

    await step('Texto visível vazio não deixa um bloco oco dentro do botão', async () => {
      // `.nds-pagination-label` é `display: block` acima de 40rem, e um `<span>`
      // vazio ali ocuparia uma linha inteira dentro do botão — o quadrado
      // deixaria de ser quadrado. O recuo assimétrico de `.nds-pagination-prev`
      // existe para a palavra ao lado, então ele sai junto.
      await expect(canvasElement.querySelectorAll('.nds-pagination-label').length).toBe(0);

      const previous = canvas.getByRole('button', { name: 'Página anterior' });
      await expect(previous).toHaveClass('nds-button-icon');
      await expect(previous).not.toHaveClass('nds-pagination-prev');

      const next = canvas.getByRole('button', { name: 'Próxima página' });
      await expect(next).toHaveClass('nds-button-icon');
      await expect(next).not.toHaveClass('nds-pagination-next');
    });

    await step('Os quatro continuam nomeados e clicáveis', async () => {
      const controls = canvas.getAllByRole('button');
      await expect(controls.length).toBe(4);
      await expect(controls.map((c) => c.getAttribute('aria-label'))).toEqual([
        'Primeira página',
        'Página anterior',
        'Próxima página',
        'Última página',
      ]);

      await userEvent.click(canvas.getByRole('button', { name: 'Última página' }));
      await expect(onStep).toHaveBeenLastCalledWith(10);
    });
  },
};
