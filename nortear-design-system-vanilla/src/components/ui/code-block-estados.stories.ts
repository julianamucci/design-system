import type { Meta, StoryObj } from '@storybook/html-vite';
import { userEvent, within, expect, waitFor } from 'storybook/test';
import { createCodeBlock } from './code-block';
import {
  codeBlockComRemocaoSource,
  codeBlockSource,
  codeBlockSourceCom,
} from './code-block.source';
import { createButton } from './button';
import type { DestroyableElement } from '@/lib/destroy';
import { COMPOSITION_CODE } from '@/components/docs/CodeBlockDocs';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Configurações que a docs page lista na tabela de Estados: numeração ligada e
// desligada, confirmação de cópia, scroll nos dois eixos e linguagem que a
// classificação não conhece.

const meta: Meta = {
  tags: ['display'],
  title: 'UI/CodeBlock/States',
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: codeBlockSource },
      description: {
        component:
          'Cada story fixa uma configuração do bloco e verifica o que ela muda no DOM.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * Roda `run` com `navigator.clipboard.writeText` substituído.
 *
 * O clipboard real não funciona no browser de teste: a Clipboard API rejeita por
 * permissão e o fallback via `execCommand` exige user activation, que evento
 * sintético não tem. Sem o stub, `copyText` devolve `false` e o componente —
 * corretamente — não confirma nada.
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
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts', showLineNumbers: true }),
  play: async ({ canvasElement, step }) => {
    await step('A numeração aparece e fica registrada na raiz', async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;
      await expect(root).toHaveAttribute('data-numbered', 'true');
      const gutter = root.querySelector<HTMLElement>('.nds-code-block-gutter')!;
      await expect(gutter).toBeVisible();
      await expect(gutter).toHaveTextContent('1');
    });
  },
};

export const WithoutNumbering: Story = {
  parameters: {
    covers: ['functional.item6', 'visual.item3'],
    // A numeração desligada é o assunto: o snippet do meta a esconderia, porque
    // ligada é o padrão da fábrica.
    docs: { source: { transform: codeBlockSourceCom({ language: 'ts', showLineNumbers: false }) } },
  },
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts', showLineNumbers: false }),
  play: async ({ canvasElement, step }) => {
    await step('Sem numeração a coluna some da tela', async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;
      await expect(root).toHaveAttribute('data-numbered', 'false');
      // O gutter continua no DOM (é aria-hidden e não selecionável); quem o
      // remove é o CSS, via data-numbered.
      await expect(root.querySelector('.nds-code-block-gutter')).not.toBeVisible();
    });

    await step('O código recebe o recuo que a coluna ocupava', async () => {
      // Sem este respiro o trecho encosta na borda — é o resultado que a linha
      // "Sem numeração" da tabela de configurações promete.
      const texto = canvasElement.querySelector<HTMLElement>('.nds-code-block-text')!;
      await expect(parseFloat(getComputedStyle(texto).paddingInlineStart)).toBeGreaterThan(0);
    });
  },
};

export const Copied: Story = {
  render: () =>
    createCodeBlock({ code: COMPOSITION_CODE, language: 'ts' }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

    await step('Copiar confirma e a confirmação é anunciada', async () => {
      await withClipboardStub(async () => {
        await userEvent.click(canvasElement.querySelector('[data-slot="code-block-copy"]')!);
        await waitFor(() =>
          expect(canvas.getByRole('button', { name: /copiado/i })).toBeInTheDocument(),
        );
      });
      const live = root.querySelector('[role="status"]')!;
      await expect(live).toHaveAttribute('aria-live', 'polite');
      await expect(live).toHaveTextContent('Copiado!');
    });

    await step('Um ícone por vez no botão', async () => {
      // A primeira versão mantinha os dois SVGs no DOM alternando `hidden`, que
      // não esconde elemento de outro namespace — e os dois apareciam juntos.
      const button = root.querySelector('[data-slot="code-block-copy"]')!;
      await expect(button.querySelectorAll('svg')).toHaveLength(1);
    });
  },
};

export const DoubleScroll: Story = {
  parameters: { covers: ['visual.item5'] },
  render: () => createCodeBlock({ code: LONG_CODE, language: 'ts' }),
  play: async ({ canvasElement, step }) => {
    await step('A região rola nos dois eixos e aceita foco', async () => {
      const scroll = canvasElement.querySelector<HTMLElement>('.nds-code-block-scroll')!;
      await expect(scroll).toHaveAttribute('tabindex', '0');
      await expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
      await expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
    });

    await step('Um eixo, um dono: só a região de scroll rola', async () => {
      // Contêineres aninhados com overflow deixam o eixo sem dono claro e a
      // rolagem por teclado inalcançável (WCAG 2.1.1, axe
      // scrollable-region-focusable). Ver guidelines/01-acessibilidade.
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;
      const rolaveis = [...root.querySelectorAll<HTMLElement>('*')].filter((el) => {
        const cs = getComputedStyle(el);
        return (
          (/(auto|scroll)/.test(cs.overflowX) || /(auto|scroll)/.test(cs.overflowY)) &&
          (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)
        );
      });
      await expect(rolaveis.map((el) => el.className)).toEqual(['nds-code-block-scroll']);
    });

    await step('A numeração continua visível no scroll horizontal', async () => {
      // O gutter é sticky: sem isso, rolar para o lado esconde os números e a
      // linha em destaque ganha uma emenda visível.
      const gutter = canvasElement.querySelector<HTMLElement>('.nds-code-block-gutter')!;
      await expect(getComputedStyle(gutter).position).toBe('sticky');
    });
  },
};

export const UnknownLanguage: Story = {
  parameters: {
    covers: ['functional.item7'],
    // A linguagem que a classificação não conhece é o assunto: sem ela no
    // snippet, a story deixaria de mostrar o que documenta.
    docs: { source: { transform: codeBlockSourceCom({ language: 'cobol' }) } },
  },
  render: () => createCodeBlock({ code: COMPOSITION_CODE, language: 'cobol' }),
  play: async ({ canvasElement, step }) => {
    await step('Linguagem desconhecida cai em texto simples sem quebrar o bloco', async () => {
      const root = canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;
      await expect(root).toHaveAttribute('data-language', 'text');
      await expect(
        root.querySelectorAll('[data-token]:not([data-token="plain"])').length,
      ).toBe(0);
      // O conteúdo continua todo lá: uma linha por linha do código.
      await expect(root.querySelectorAll('.nds-code-block-line')).toHaveLength(
        COMPOSITION_CODE.split('\n').length,
      );
    });
  },
};

/**
 * O bloco sai da tela antes de a confirmação expirar.
 *
 * Alterna em vez de só remover: o painel Interactions reexecuta a play no MESMO
 * DOM, e um botão que só sabe remover deixa a segunda rodada sem bloco nenhum
 * para copiar.
 */
export const RemovedBeforeFeedback: Story = {
  parameters: {
    // Coberto de verdade, e não `coversNotApplicable`: a primeira leitura foi de
    // que sem framework não há desmontagem para escutar. Há — `lib/destroy.ts`
    // dá `destroy()` idempotente e o dispara sozinho quando a raiz sai do
    // documento, e o bloco passou a usar essa forma. O motivo tinha deixado de
    // valer, e declarar não-aplicável com motivo vencido é o mesmo defeito que
    // esta revisão persegue, ao contrário.
    covers: ['functional.item8'],
    // Forma própria de snippet: o assunto desta story é o que acontece na
    // SAÍDA do bloco, e a chamada sozinha não mostraria isso.
    docs: { source: { transform: codeBlockComRemocaoSource({ language: 'ts' }) } },
  },
  render: () => {
    const wrap = document.createElement('div');
    wrap.className = 'nds-stack';
    wrap.dataset.spacing = 'md';

    const slot = document.createElement('div');
    const alternar = createButton({ variant: 'outline' });

    let bloco: HTMLElement | null = null;
    const sincronizar = (visivel: boolean) => {
      if (visivel && !bloco) {
        bloco = createCodeBlock({ code: COMPOSITION_CODE, language: 'ts' });
        slot.append(bloco);
      } else if (!visivel && bloco) {
        bloco.remove();
        bloco = null;
      }
      alternar.textContent = visivel ? 'Remover o bloco' : 'Restaurar o bloco';
    };

    alternar.addEventListener('click', () => sincronizar(!bloco));
    sincronizar(true);

    wrap.append(slot, alternar);
    return wrap;
  },
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

    // Espiões sobre os temporizadores globais: a factory chama `setTimeout` e
    // `clearTimeout` sem alias, então o que ela usa é o global do momento da
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
        // Sem a limpeza de `lib/destroy.ts`, o callback dispararia sobre um nó
        // já fora da árvore. A prova é o id: o mesmo temporizador agendado pela
        // cópia precisa aparecer entre os cancelados.
        //
        // A referência é tomada ANTES de remover: depois da remoção o seletor
        // não acha mais nada, e é justamente nela que `destroy()` mora.
        const raiz = canvasElement.querySelector<HTMLElement>(
          '[data-slot="code-block"]',
        ) as DestroyableElement;
        await userEvent.click(canvas.getByRole('button', { name: /remover o bloco/i }));
        await waitFor(() =>
          expect(canvasElement.querySelector('[data-slot="code-block"]')).toBeNull(),
        );
        await waitFor(() => expect(limpos).toContain(idDaConfirmacao));

        // Idempotência é a outra metade do contrato da forma: a varredura
        // automática já rodou, e quem consome ainda pode chamar na mão.
        await expect(() => raiz.destroy()).not.toThrow();
      });
    } finally {
      window.setTimeout = setOriginal;
      window.clearTimeout = clearOriginal;
    }
  },
};
