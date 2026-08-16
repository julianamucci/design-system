import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { ref } from 'vue';
import { userEvent, within, expect, waitFor, fn } from 'storybook/test';
import { CodeBlock } from './index';
import { Button } from '@/components/ui/button';

/** Mesmo trecho base da seção "Composições" da docs page. */
const BASE_CODE = `const items = await load();
const total = items.length;
render(items, total);`;

/** Query longa o bastante para o conteúdo estourar a largura do container. */
const LONG_QUERY =
  'formato=json&incluirDetalhes=true&ordenarPor=dataCriacao&limite=100&pagina=1&agruparPor=categoria&incluirTotais=true&idioma=pt-BR';

/** Longo nos dois eixos: força scroll vertical e horizontal ao mesmo tempo. */
const SCROLL_CODE = Array.from({ length: 40 }, (_, i) =>
  `const rota${i} = "/api/v1/relatorios/consolidado/por-periodo/${i}?${LONG_QUERY}&${LONG_QUERY}";`,
).join('\n');

const rootOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="code-block"]')!;

const meta = {
  title: 'UI/CodeBlock/States',
  component: CodeBlock,
  tags: ['display'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
  args: { code: BASE_CODE, language: 'ts' },
  render: (args) => ({
    components: { CodeBlock },
    setup() { return { args }; },
    template: '<CodeBlock v-bind="args" />',
  }),
} satisfies Meta<typeof CodeBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithNumbering: Story = {
  parameters: { covers: ['visual.item3'] },
  args: { showLineNumbers: true },
  play: async ({ canvasElement, step }) => {
    await step('A raiz registra a numeração e a coluna aparece', async () => {
      const root = rootOf(canvasElement);
      await expect(root).toHaveAttribute('data-numbered', 'true');
      const gutter = root.querySelector<HTMLElement>('.nds-code-block-gutter')!;
      await expect(gutter).toBeVisible();
      await expect(gutter).toHaveTextContent('1');
    });
  },
};

export const WithoutNumbering: Story = {
  parameters: { covers: ['functional.item6', 'visual.item3'] },
  args: { showLineNumbers: false },
  play: async ({ canvasElement, step }) => {
    await step('Sem numeração a coluna some da tela', async () => {
      const root = rootOf(canvasElement);
      await expect(root).toHaveAttribute('data-numbered', 'false');
      // O gutter continua no DOM (é aria-hidden e não selecionável); quem o
      // remove é o CSS, via data-numbered.
      await expect(root.querySelector('.nds-code-block-gutter')).not.toBeVisible();
    });

    await step('O código recebe o recuo que a coluna ocupava', async () => {
      // Sem este respiro o trecho encosta na borda — é o resultado que a linha
      // "Sem numeração" da tabela de configurações promete.
      const texto = rootOf(canvasElement).querySelector<HTMLElement>('.nds-code-block-text')!;
      await expect(parseFloat(getComputedStyle(texto).paddingInlineStart)).toBeGreaterThan(0);
    });
  },
};

export const Copied: Story = {
  args: { showLineNumbers: true, title: 'lista.ts' },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = rootOf(canvasElement);

    // Stub do writeText: no browser de teste o clipboard real rejeita por
    // permissão e o fallback via execCommand exige user activation. O que
    // interessa aqui é o feedback, não a API do browser.
    const writeText = fn((text: string) => Promise.resolve(text));
    const original = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    try {
      await step('Clicar em copiar confirma por uma região aria-live', async () => {
        await userEvent.click(root.querySelector<HTMLElement>('[data-slot="code-block-copy"]')!);
        const status = root.querySelector('[role="status"]');
        await waitFor(() => expect(status).toHaveTextContent('Copiado!'));
        await expect(status).toHaveAttribute('aria-live', 'polite');
      });

      await step('Um ícone por vez dentro do botão', async () => {
        const button = root.querySelector('[data-slot="code-block-copy"]')!;
        await expect(button.querySelectorAll('svg')).toHaveLength(1);
        await expect(canvas.getByRole('button', { name: /copiado/i })).toBeInTheDocument();
      });
    } finally {
      Object.defineProperty(navigator, 'clipboard', { value: original, configurable: true });
    }
  },
};

export const DoubleScroll: Story = {
  parameters: { covers: ['visual.item5'] },
  args: { code: SCROLL_CODE, language: 'ts', showLineNumbers: true },
  play: async ({ canvasElement, step }) => {
    await step('A região rola nos dois eixos e aceita foco', async () => {
      const scroll = rootOf(canvasElement).querySelector<HTMLElement>('.nds-code-block-scroll')!;
      await expect(scroll).toHaveAttribute('tabindex', '0');
      await expect(scroll.scrollWidth).toBeGreaterThan(scroll.clientWidth);
      await expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
    });

    await step('Um eixo, um dono: só a região de scroll rola', async () => {
      // Contêineres aninhados com overflow deixam o eixo sem dono claro e a
      // rolagem por teclado inalcançável (WCAG 2.1.1, axe
      // scrollable-region-focusable). Ver guidelines/01-acessibilidade.
      const root = rootOf(canvasElement);
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
      const gutter = rootOf(canvasElement).querySelector<HTMLElement>('.nds-code-block-gutter')!;
      await expect(getComputedStyle(gutter).position).toBe('sticky');
    });
  },
};

export const UnknownLanguage: Story = {
  parameters: { covers: ['functional.item7'] },
  args: { code: BASE_CODE, language: 'cobol', showLineNumbers: true },
  play: async ({ canvasElement, step }) => {
    await step('Linguagem desconhecida cai em texto simples sem quebrar o bloco', async () => {
      const root = rootOf(canvasElement);
      await expect(root).toHaveAttribute('data-language', 'text');
      await expect(root.querySelectorAll('[data-token]:not([data-token="plain"])')).toHaveLength(0);
      await expect(root.querySelectorAll('.nds-code-block-line'))
        .toHaveLength(BASE_CODE.split('\n').length);
    });
  },
};

export const RemovedBeforeFeedback: Story = {
  parameters: { covers: ['functional.item8'] },
  args: { code: BASE_CODE },
  // Alterna em vez de só remover: o painel Interactions reexecuta a play no
  // MESMO DOM, e um botão que só sabe remover deixa a segunda rodada sem bloco
  // nenhum para copiar.
  render: (args) => ({
    components: { CodeBlock, Button },
    setup() {
      const visivel = ref(true);
      return { args, visivel };
    },
    template: `
      <div class="nds-stack" data-spacing="md">
        <CodeBlock v-if="visivel" :code="args.code" language="ts" />
        <Button variant="outline" @click="visivel = !visivel">
          {{ visivel ? 'Remover o bloco' : 'Restaurar o bloco' }}
        </Button>
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

    // Espiões sobre os temporizadores globais: o componente chama `setTimeout` e
    // `clearTimeout` sem alias, então o que ele usa é o global do momento da
    // chamada. Passa-tudo — só registram.
    const setOriginal = window.setTimeout;
    const clearOriginal = window.clearTimeout;
    let idDaConfirmacao: number | undefined;
    const limpos: number[] = [];

    window.setTimeout = ((handler: TimerHandler, ms?: number, ...rest: unknown[]) => {
      const id = setOriginal(handler, ms, ...rest);
      // 2000ms é o intervalo do feedback de "copiado".
      if (ms === 2000) idDaConfirmacao = id;
      return id;
    }) as typeof window.setTimeout;
    window.clearTimeout = ((id?: number) => {
      if (typeof id === 'number') limpos.push(id);
      return clearOriginal(id);
    }) as typeof window.clearTimeout;

    const writeText = fn((text: string) => Promise.resolve(text));
    const originalClipboard = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    try {
      await step('Copiar agenda a volta do rótulo em 2 segundos', async () => {
        await userEvent.click(
          canvasElement.querySelector<HTMLElement>('[data-slot="code-block-copy"]')!,
        );
        await waitFor(() =>
          expect(canvas.getByRole('button', { name: /copiado/i })).toBeInTheDocument(),
        );
        await expect(idDaConfirmacao).toBeDefined();
      });

      await step('Remover o bloco cancela o temporizador pendente', async () => {
        // Sem o clearTimeout do onBeforeUnmount, o callback dispararia sobre um
        // componente já destruído — escrita em ref de instância morta.
        await userEvent.click(canvas.getByRole('button', { name: /remover o bloco/i }));
        await waitFor(() =>
          expect(canvasElement.querySelector('[data-slot="code-block"]')).toBeNull(),
        );
        await expect(limpos).toContain(idDaConfirmacao);
      });
    } finally {
      window.setTimeout = setOriginal;
      window.clearTimeout = clearOriginal;
      Object.defineProperty(navigator, 'clipboard', {
        value: originalClipboard,
        configurable: true,
      });
    }
  },
};
