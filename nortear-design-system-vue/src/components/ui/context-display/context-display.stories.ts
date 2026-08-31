import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { computed } from 'vue';
import { expect, within } from 'storybook/test';
import {
  ContextDisplay,
  CONTEXT_DISPLAY_FORMS,
  type ContextDisplayForm,
} from './index';
import { contextDisplayLabels, useContextDisplayLabels } from './context-display.fixtures';
import { contextDisplaySource } from './context-display.source';
import { budgetLevel, usedPercent, usedTokens } from '@shared/primitives/token-budget';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';
import ContextDisplayDocs from '@/components/docs/ContextDisplayDocs.vue';

/**
 * Os dois eixos da medição, num bloco só.
 *
 * O CONSUMO decide o número, a cor do medidor e a palavra do nível; a FORMA
 * decide só o desenho. A grade das três formas mora em `Variants` e a dos
 * níveis em `States`; aqui o assunto é o que muda quando se mexe em cada eixo.
 *
 * O teto entra como número, e zero significa "não se sabe" — é o que o
 * primitivo já responde, e é o único jeito de alcançar esse caso por control.
 */
type PlaygroundArgs = {
  input: number;
  output: number;
  limit: number;
  form: ContextDisplayForm;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'Primitives/Conversational/ContextDisplay',
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(ContextDisplayDocs),
      source: { transform: contextDisplaySource },
    },
  },
  argTypes: {
    input: {
      control: { type: 'number', min: 0, step: 1000 },
      description: 'Quanto a pergunta consumiu.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    output: {
      control: { type: 'number', min: 0, step: 1000 },
      description: 'Quanto a resposta consumiu.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    limit: {
      control: { type: 'number', min: 0, step: 1000 },
      description:
        'Teto da janela. Zero é a ausência de teto: sem ele não há fração, só contagem.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '—' } },
    },
    form: {
      control: 'select',
      options: [...CONTEXT_DISPLAY_FORMS],
      description: 'Como desenhar o mesmo número. A escolha é de espaço, e não de significado.',
      table: {
        type: { summary: CONTEXT_DISPLAY_FORMS.map((item) => `'${item}'`).join(' | ') },
        defaultValue: { summary: "'ring'" },
      },
    },
  },
  args: {
    input: 18_000,
    output: 7_000,
    limit: 32_000,
    form: 'ring',
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item7',
      'accessibility.item2', 'accessibility.item3',
      'accessibility.item4', 'accessibility.item5',
      'visual.item1',
    ],
  },
  render: (args) => ({
    components: { ContextDisplay },
    setup() {
      // Os rótulos saem de um composable, então o render passa por um `setup`.
      return {
        args,
        labels: useContextDisplayLabels(),
        // Teto zero é a ausência de teto, e não um teto de zero: é o que o
        // primitivo já decide, e é o único caminho para esse caso por control.
        usage: computed(() => ({
          input: args.input,
          output: args.output,
          limit: args.limit || undefined,
        })),
      };
    },
    template: `<ContextDisplay
      :usage="usage"
      :form="args.form"
      :labels="labels"
    />`,
  }),
  play: async ({ canvasElement, step, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="context-display"]')!;
    const labels = contextDisplayLabels();
    const usage = { input: args.input, output: args.output, limit: args.limit || undefined };
    const percent = usedPercent(usage);

    await step('O bloco NÃO é região viva, e nada nele se reanuncia', async () => {
      // O número muda a cada turno, e anunciá-lo a cada mudança corta a leitura
      // da resposta que está sendo gerada ao lado (decisão 1 da folha).
      await expect(root.hasAttribute('aria-live')).toBe(false);
      await expect(root.hasAttribute('role')).toBe(false);
      await expect(root.querySelector('[aria-live]')).toBeNull();
      await expect(root.querySelector('[role="status"], [role="alert"], [role="log"]')).toBeNull();
    });

    await step('O número tem NOME, e ele não aparece na tela', async () => {
      // "78%" sozinho não diz de quê (decisão 4 da folha).
      const title = root.querySelector<HTMLElement>('[data-slot="context-display-title"]')!;
      await expect(title.textContent).toBe(labels.title);
      await expect(title).toHaveClass('nds-sr-only');
    });

    await step('O número sai como fração, e é TEXTO', async () => {
      const value = root.querySelector<HTMLElement>('[data-slot="context-display-value"]')!;
      await expect(percent).not.toBeNull();
      await expect(value.textContent).toBe(`${percent}%`);
      await expect(within(canvasElement).queryByText(`${percent}%`)).toBeInTheDocument();
    });

    await step('E o detalhe traz o consumido e o teto', async () => {
      const detail = root.querySelector<HTMLElement>('[data-slot="context-display-detail"]')!;
      await expect(detail.textContent).toContain(usedTokens(usage).toLocaleString());
      await expect(detail.textContent).toContain(args.limit.toLocaleString());
      await expect(detail.textContent).toContain(labels.unit);
    });

    await step('O medidor desenha a MESMA fração que o texto diz', async () => {
      // Um medidor contínuo ao lado de um número travado seriam duas respostas
      // para uma pergunta só — por isso os dois leem o mesmo inteiro.
      const meter = root.querySelector<HTMLElement>('[data-slot="context-display-meter"]');
      if (args.form === 'text') {
        await expect(meter).toBeNull();
        return;
      }
      await expect(meter!.style.getPropertyValue('--nds-context-used')).toBe(String(percent));
    });

    await step('E ele fica FORA do que é lido, sem papel e sem valor', async () => {
      // Um segundo portador do mesmo número o faria ser lido duas vezes, uma
      // delas como controle (decisões 1 e 2 da folha).
      const meter = root.querySelector<HTMLElement>('[data-slot="context-display-meter"]');
      if (!meter) return;
      await expect(meter.getAttribute('aria-hidden')).toBe('true');
      await expect(meter.hasAttribute('role')).toBe(false);
      await expect(meter.hasAttribute('aria-valuenow')).toBe(false);
      await expect(meter.textContent).toBe('');
    });

    await step('E a palavra do nível está na linha, ao lado da cor', async () => {
      const level = budgetLevel(usage);
      const badge = root.querySelector<HTMLElement>('[data-slot="context-display-level"]')!;
      await expect(root.dataset.level).toBe(level);
      await expect(badge.textContent).toBe(labels.level[level!]);
    });
  },
};
