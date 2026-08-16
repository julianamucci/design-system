import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { signal } from '@angular/core';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { NdsCodeBlock } from './code-block';
import { NdsButton } from './button';
import { COMPOSITION_CODE } from '@/components/docs/CodeBlockDocs';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Configurações que a docs page lista na tabela de Estados: numeração ligada e
// desligada, confirmação de cópia, scroll nos dois eixos, linguagem que a
// classificação não conhece e o bloco removido antes do fim do feedback.

const meta: Meta = {
  title: 'UI/CodeBlock/States',
  tags: ['display'],
  decorators: [moduleMetadata({ imports: [NdsCodeBlock, NdsButton] })],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          'Cada story fixa uma configuração do bloco e verifica o que ela muda no DOM.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** Raiz do bloco renderizado pela story. */
function root(canvasElement: HTMLElement): HTMLElement {
  return canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;
}

/**
 * Roda `run` com `navigator.clipboard.writeText` substituído.
 *
 * O clipboard real não funciona no browser de teste: a Clipboard API rejeita
 * por permissão e o fallback via `execCommand` exige user activation, que
 * evento sintético não tem. Sem o stub, `copyText` devolve `false` e o
 * componente — corretamente — não confirma nada. O que se verifica aqui é o
 * feedback visível e o anúncio, nunca o conteúdo da área de transferência.
 */
async function withClipboardStub(run: () => Promise<void>): Promise<void> {
  const original = navigator.clipboard;
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: () => Promise.resolve() },
    configurable: true,
  });
  try {
    await run();
  } finally {
    Object.defineProperty(navigator, 'clipboard', { value: original, configurable: true });
  }
}

/** Código comprido nos dois eixos: 60 linhas e uma delas bem larga. */
const LONG_CODE = Array.from({ length: 60 }, (_, i) =>
  i === 0
    ? `const rotulos = [${Array.from({ length: 24 }, (_, n) => `'coluna-${n}'`).join(', ')}];`
    : `console.log('linha ${i + 1}');`,
).join('\n');

// ─── Stories ──────────────────────────────────────────────────────────────────

export const WithNumbering: Story = {
  parameters: { covers: ['visual.item3'] },
  render: () => ({
    props: { code: COMPOSITION_CODE },
    template: `<nds-code-block [code]="code" language="ts" [showLineNumbers]="true" />`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A numeração aparece e fica registrada na raiz', async () => {
      const bloco = root(canvasElement);
      await expect(bloco).toHaveAttribute('data-numbered', 'true');
      const gutter = bloco.querySelector<HTMLElement>('.nds-code-block-gutter')!;
      await expect(gutter).toBeVisible();
      await expect(gutter).toHaveTextContent('1');
    });
  },
};

export const WithoutNumbering: Story = {
  parameters: { covers: ['functional.item6', 'visual.item3'] },
  render: () => ({
    props: { code: COMPOSITION_CODE },
    template: `<nds-code-block [code]="code" language="ts" [showLineNumbers]="false" />`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Sem numeração a coluna some da tela', async () => {
      const bloco = root(canvasElement);
      await expect(bloco).toHaveAttribute('data-numbered', 'false');
      // O gutter continua no DOM (é aria-hidden e não selecionável); quem o
      // remove é o CSS, via data-numbered.
      await expect(bloco.querySelector('.nds-code-block-gutter')).not.toBeVisible();
    });

    await step('O código recebe o recuo que a coluna ocupava', async () => {
      // Sem este respiro o trecho encosta na borda — é o resultado que a linha
      // "Sem numeração" da tabela de configurações promete.
      const texto = root(canvasElement).querySelector<HTMLElement>('.nds-code-block-text')!;
      await expect(parseFloat(getComputedStyle(texto).paddingInlineStart)).toBeGreaterThan(0);
    });
  },
};

export const Copied: Story = {
  render: () => ({
    props: { code: COMPOSITION_CODE },
    template: `<nds-code-block [code]="code" language="ts" />`,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const bloco = root(canvasElement);

    await step('Copiar troca o rótulo acessível e anuncia a confirmação', async () => {
      await withClipboardStub(async () => {
        await userEvent.click(bloco.querySelector<HTMLElement>('[data-slot="code-block-copy"]')!);
        await waitFor(() =>
          expect(canvas.getByRole('button', { name: /copiado/i })).toBeInTheDocument(),
        );
      });
      const live = bloco.querySelector('[role="status"]')!;
      await expect(live).toHaveAttribute('aria-live', 'polite');
      await expect(live).toHaveTextContent('Copiado!');
    });

    await step('Um ícone por vez no botão', async () => {
      // A primeira versão mantinha os dois SVGs no DOM alternando `hidden`, que
      // não esconde elemento de outro namespace — e os dois apareciam juntos.
      const botao = bloco.querySelector('[data-slot="code-block-copy"]')!;
      await expect(botao.querySelectorAll('svg')).toHaveLength(1);
    });
  },
};

export const DoubleScroll: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => ({
    props: { code: LONG_CODE },
    template: `<nds-code-block [code]="code" language="ts" />`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('A região rola nos dois eixos e aceita foco', async () => {
      const scroll = root(canvasElement).querySelector<HTMLElement>('.nds-code-block-scroll')!;
      await expect(scroll).toHaveAttribute('tabindex', '0');
      await expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
      await expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
    });

    await step('A numeração continua visível no scroll horizontal', async () => {
      // O gutter é sticky: sem isso, rolar para o lado esconde os números e a
      // linha em destaque ganha uma emenda visível.
      const gutter = root(canvasElement).querySelector<HTMLElement>('.nds-code-block-gutter')!;
      await expect(getComputedStyle(gutter).position).toBe('sticky');
    });
  },
};

export const UnknownLanguage: Story = {
  parameters: { covers: ['functional.item7'] },
  render: () => ({
    props: { code: COMPOSITION_CODE },
    template: `<nds-code-block [code]="code" language="cobol" />`,
  }),
  play: async ({ canvasElement, step }) => {
    await step('Linguagem desconhecida cai em texto simples sem quebrar o bloco', async () => {
      const bloco = root(canvasElement);
      await expect(bloco).toHaveAttribute('data-language', 'text');
      await expect(
        bloco.querySelectorAll('[data-token]:not([data-token="plain"])').length,
      ).toBe(0);
      // O conteúdo continua todo lá: uma linha por linha do código.
      await expect(bloco.querySelectorAll('.nds-code-block-line')).toHaveLength(
        COMPOSITION_CODE.split('\n').length,
      );
    });
  },
};

export const RemovedBeforeFeedback: Story = {
  parameters: { covers: ['functional.item8'] },
  render: () => ({
    // Signal e não campo comum: em modo zoneless é o signal que garante a nova
    // detecção de mudança quando o bloco sai da tela.
    props: { visivel: signal(true), code: COMPOSITION_CODE },
    // Alterna em vez de só remover: o painel Interactions reexecuta a play no
    // MESMO DOM, e um botão que só sabe remover deixa a segunda rodada sem
    // bloco nenhum para copiar. O rótulo acompanha o estado para que a play
    // consiga estabelecer a própria precondição.
    template: `
      <div class="nds-stack" data-spacing="md">
        @if (visivel()) {
          <nds-code-block [code]="code" language="ts" />
        }
        <button ndsButton variant="outline" (click)="visivel.set(!visivel())">
          {{ visivel() ? 'Remover o bloco' : 'Restaurar o bloco' }}
        </button>
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Precondição própria: no replay a rodada anterior deixou o bloco removido.
    await step('O bloco está na tela antes de qualquer coisa', async () => {
      if (!canvasElement.querySelector('[data-slot="code-block"]')) {
        await userEvent.click(canvas.getByRole('button', { name: /restaurar o bloco/i }));
      }
      await waitFor(() =>
        expect(canvasElement.querySelector('[data-slot="code-block"]')).not.toBeNull(),
      );
    });

    // Espiões sobre os temporizadores globais: o componente chama `setTimeout`
    // e `clearTimeout` sem alias, então o que ele usa é o global do momento da
    // chamada. Passa-tudo — só registram.
    const setOriginal = window.setTimeout;
    const clearOriginal = window.clearTimeout;
    let idDaConfirmacao: number | undefined;
    const limpos: number[] = [];

    window.setTimeout = ((handler: TimerHandler, ms?: number, ...rest: unknown[]) => {
      const id = setOriginal(handler, ms, ...rest);
      // 2000ms é o intervalo do feedback de "copiado" (COPIED_RESET_MS).
      if (ms === 2000) idDaConfirmacao = id;
      return id;
    }) as typeof window.setTimeout;
    window.clearTimeout = ((id?: number) => {
      if (typeof id === 'number') limpos.push(id);
      return clearOriginal(id);
    }) as typeof window.clearTimeout;

    try {
      await step('Copiar agenda a volta do rótulo em 2 segundos', async () => {
        await withClipboardStub(async () => {
          await userEvent.click(
            canvasElement.querySelector<HTMLElement>('[data-slot="code-block-copy"]')!,
          );
          await waitFor(() =>
            expect(canvas.getByRole('button', { name: /copiado/i })).toBeInTheDocument(),
          );
        });
        await expect(idDaConfirmacao).toBeDefined();
      });

      await step('Remover o bloco cancela o temporizador pendente', async () => {
        // Sem o clearTimeout do ngOnDestroy, o callback dispararia sobre um
        // componente já destruído — escrita em signal de view morta.
        await userEvent.click(canvas.getByRole('button', { name: /remover o bloco/i }));
        await waitFor(() =>
          expect(canvasElement.querySelector('[data-slot="code-block"]')).toBeNull(),
        );
        await expect(limpos).toContain(idDaConfirmacao);
      });
    } finally {
      window.setTimeout = setOriginal;
      window.clearTimeout = clearOriginal;
    }
  },
};
