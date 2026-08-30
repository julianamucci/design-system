import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { NdsComposer } from './composer';
import {
  commandSource,
  composerLabels,
  mentionSource,
  triggerLabels,
} from './composer-trigger-popover.fixtures';
import { triggerPopoverSource } from './composer-trigger-popover.source';
import { NdsComposerTriggerPopoverDocs } from '@/components/docs/ComposerTriggerPopoverDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onSubmit = fn();

type Args = { mention: boolean; command: boolean };

const meta: Meta<Args> = {
  title: 'UI/ComposerTriggerPopover',
  tags: ['autodocs', 'conversational'],
  decorators: [moduleMetadata({ imports: [NdsComposer] })],
  parameters: {
    layout: 'padded',
    docs: {
      page: withAutoDocsTab(NdsComposerTriggerPopoverDocs),
      // O renderer Angular imprime o `template` da story com os bindings
      // apontando para `props` que só existem aqui. A transform devolve o uso
      // real: um componente que declara rótulos, gatilhos e escuta o envio.
      source: { transform: triggerPopoverSource },
    },
  },
  // Sem compodoc nesta stack: a aba API Reference sai só destes argTypes.
  argTypes: {
    mention: {
      control: 'boolean',
      description: 'O gatilho de menção, que vale em começo de qualquer palavra.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    command: {
      control: 'boolean',
      description: 'O gatilho de comando, que vale só na primeira posição do campo.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
  },
  args: { mention: true, command: true },
};

export default meta;
type Story = StoryObj<Args>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item3',
      'visual.item1',
    ],
  },
  // Os rótulos vêm do andaime compartilhado, e não dos args: eles têm três
  // idiomas, e um control de texto congelaria um deles.
  render: (args) => ({
    props: {
      labels: composerLabels(),
      popoverLabels: triggerLabels(),
      triggers: [
        ...(args.mention ? [mentionSource()] : []),
        ...(args.command ? [commandSource()] : []),
      ],
      onSubmit,
    },
    template: `
      <nds-composer
        class="nds-max-w-lg"
        [labels]="labels"
        [triggerLabels]="popoverLabels"
        [triggers]="triggers"
        (submitted)="onSubmit($event)"
      />
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const input = canvas.getByRole('textbox');
    const panel = () =>
      root.querySelector<HTMLElement>('[data-slot="composer-trigger-popover"]')!;

    await step('Fechado, o campo é um campo de texto comum', async () => {
      // O passo estabelece a própria precondição: a play reexecuta no mesmo DOM.
      await userEvent.clear(input);
      await waitFor(() => expect(panel().hidden).toBe(true));
      // Fechado, o campo não aponta lista nenhuma: um `aria-controls` para
      // um painel escondido promete uma lista que não há.
      await expect(input).not.toHaveAttribute('aria-controls');
      await expect(input).not.toHaveAttribute('aria-activedescendant');
    });

    await step('Digitar o gatilho abre a lista INTEIRA', async () => {
      // Abrir filtrado seria pedir que a pessoa adivinhasse o que existe.
      input.focus();
      await userEvent.type(input, '@');
      await waitFor(() => expect(panel().hidden).toBe(false));
      await waitFor(() =>
        expect(within(panel()).getAllByRole('option')).toHaveLength(4),
      );
    });

    await step('E o campo passa a APONTAR a lista', async () => {
      // Sem virar caixa de combinação: a especificação de ARIA em HTML não
      // admite esse papel num campo de várias linhas, e o axe reprova. O que a
      // caixa de texto admite — e resolve o problema — é apontar.
      await expect(input).toHaveAttribute('aria-controls', panel().id);
      await expect(input).not.toHaveAttribute('role');
    });

    await step('O foco continua no CAMPO, e a opção ativa é apontada', async () => {
      // É o que separa este padrão de um menu: mover o foco para a lista faria
      // a próxima letra digitada não chegar ao texto.
      await expect(input).toHaveFocus();
      const active = panel().querySelector<HTMLElement>('[aria-selected="true"]')!;
      await expect(input).toHaveAttribute('aria-activedescendant', active.id);
    });
  },
};
