import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { NdsComposer, type ComposerLabels, type ComposerSubmitOn } from './composer';
import { composerLabels } from './composer.fixtures';
import { composerSource } from './composer.source';
import { NdsComposerDocs } from '@/components/docs/ComposerDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────

type ComposerArgs = {
  labels: ComposerLabels;
  value: string;
  rows: number;
  maxLength: number;
  submitOn: ComposerSubmitOn;
  disabled: boolean;
};

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSubmit = fn();

const meta: Meta<ComposerArgs> = {
  title: 'Primitives/Conversational/Composer',
  tags: ['autodocs', 'conversational'],
  decorators: [moduleMetadata({ imports: [NdsComposer] })],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(NdsComposerDocs),
      // O renderer Angular imprime o `template` da story com os bindings
      // apontando para `props` que só existem aqui. A transform devolve o uso
      // real: um componente que declara os rótulos e escuta o envio.
      source: { transform: composerSource },
    },
  },
  // Sem compodoc nesta stack: a aba API Reference sai só destes argTypes.
  argTypes: {
    labels: {
      control: false,
      description:
        'O texto da interface: nome do campo, marca-lugar, os dois nomes do botão, a dica e o limite.',
      table: { type: { summary: 'ComposerLabels' } },
    },
    value: {
      control: 'text',
      description: 'Texto inicial. Rascunho é de quem consome — o componente não guarda nada.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "''" } },
    },
    rows: {
      control: { type: 'number', min: 1, max: 8 },
      description: 'Linhas visíveis em repouso. É contagem de linha, então acompanha a fonte.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '2' } },
    },
    maxLength: {
      control: { type: 'number', min: 20, max: 4000, step: 20 },
      description: 'Limite de caracteres. Sem ele não há contador.',
      table: { type: { summary: 'number' } },
    },
    submitOn: {
      control: 'inline-radio',
      options: ['enter', 'modifier'],
      description: 'Qual combinação envia. A dica embaixo do campo muda junto.',
      table: { type: { summary: "'enter' | 'modifier'" }, defaultValue: { summary: "'enter'" } },
    },
    disabled: {
      control: 'boolean',
      description: 'Indisponibiliza o conjunto inteiro.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: {
    labels: {} as ComposerLabels,
    value: '',
    rows: 2,
    maxLength: 500,
    submitOn: 'enter',
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<ComposerArgs>;

// ─── Playground ───────────────────────────────────────────────────────────────

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item6', 'functional.item9',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item6',
      'visual.item1',
    ],
  },
  // Os rótulos vêm do andaime compartilhado, e não dos args: eles têm três
  // idiomas, e um control de texto congelaria um deles.
  render: (args) => ({
    props: { ...args, labels: composerLabels(), onSubmit },
    template: `
      <nds-composer
        class="nds-max-w-lg"
        [labels]="labels"
        [value]="value"
        [rows]="rows"
        [maxLength]="maxLength"
        [submitOn]="submitOn"
        [disabled]="disabled"
        (submitted)="onSubmit($event)"
      />
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const input = canvas.getByRole('textbox');
    const labels = composerLabels();
    const submitButton = () => canvas.getByRole('button', { name: labels.submit });

    await step('O campo tem nome próprio, e não depende do marca-lugar', async () => {
      // O marca-lugar some na primeira letra digitada. Um campo cujo nome era
      // o marca-lugar fica sem nome exatamente quando passa a ter conteúdo.
      await expect(input).toHaveAccessibleName(labels.input);
    });

    await step('A dica e o limite descrevem o campo', async () => {
      // Saber que uma tecla envia DEPOIS de tê-la apertado não serve para nada.
      await expect(input).toHaveAccessibleDescription(/enter/i);
      await expect(input).toHaveAccessibleDescription(/500/);
    });

    await step('Com o campo vazio, o envio está desabilitado', async () => {
      // O passo estabelece a própria precondição: a play reexecuta no mesmo DOM.
      await userEvent.clear(input);
      await waitFor(() => expect(submitButton()).toBeDisabled());
    });

    await step('Digitar habilita o envio', async () => {
      await userEvent.type(input, 'bom dia');
      await waitFor(() => expect(submitButton()).toBeEnabled());
    });

    await step('O foco acende o anel no CONJUNTO, e não só em volta do texto', async () => {
      // O trilho está dentro da mesma superfície: um anel só no texto o
      // deixaria de fora do que está em foco.
      const field = root.querySelector<HTMLElement>('.nds-composer-field')!;
      input.focus();
      await expect(field.matches(':focus-within')).toBe(true);
    });

    await step('Clicar no botão de envio emite o texto uma vez', async () => {
      onSubmit.mockClear();
      await userEvent.click(submitButton());
      await expect(onSubmit).toHaveBeenCalledTimes(1);
      await expect(onSubmit).toHaveBeenCalledWith('bom dia');
    });

    await step('E o campo continua com o texto — limpar é de quem recebe', async () => {
      // É a decisão que separa o componente do produto: limpar cedo perde a
      // mensagem quando o envio falha, e só quem recebe sabe se ela saiu.
      await expect(input).toHaveValue('bom dia');
    });
  },
};
