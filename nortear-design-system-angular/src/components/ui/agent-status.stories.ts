import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, within } from 'storybook/test';
import { RUN_STATUSES, type RunStatus } from '@shared/primitives/chat-protocol';
import { NdsAgentStatus } from './agent-status';
import { agentStatusLabels } from './agent-status.fixtures';
import { agentStatusSource } from './agent-status.source';
import { NdsAgentStatusDocs } from '@/components/docs/AgentStatusDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os dois eixos da linha, numa linha só.
//
// O estado decide a palavra, a cor do ponto e o que a ação pede; o relógio é o
// único pedaço que se vê e não se ouve. A grade dos cinco estados mora em
// `States`; aqui o assunto é o que muda quando se mexe em cada eixo.

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onAction = fn();

type PlaygroundArgs = {
  status: RunStatus;
  elapsed: string;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Conversational/AgentStatus',
  tags: ['autodocs', 'conversational'],
  decorators: [moduleMetadata({ imports: [NdsAgentStatus] })],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(NdsAgentStatusDocs),
      // O renderer desta stack imprime o `template` da story com os bindings
      // apontando para `props` que só existem aqui. A transform devolve o uso
      // real: um componente que declara os rótulos e trata o pedido de ação.
      source: { transform: agentStatusSource },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: [...RUN_STATUSES],
      description:
        'Em que pé está a execução. Decide a palavra, a cor do ponto e o que a ação pede.',
      table: {
        type: { summary: RUN_STATUSES.map((s) => `'${s}'`).join(' | ') },
        defaultValue: { summary: "'idle'" },
      },
    },
    elapsed: {
      control: 'text',
      description:
        'Há quanto tempo a execução corre, já escrito. Fica fora do que é anunciado.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    status: 'running',
    elapsed: '1:04',
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item2', 'functional.item3',
      'accessibility.item1', 'accessibility.item2',
      'accessibility.item3', 'accessibility.item4',
      'visual.item1',
    ],
  },
  // Os rótulos vêm do andaime compartilhado, e não de literais: eles têm três
  // idiomas, e uma palavra escrita à mão aqui congelaria um deles.
  render: (args) => ({
    props: {
      status: args.status,
      // Campo de texto vazio é ausência de relógio, e não um relógio em branco:
      // uma string vazia desenharia um vão sem número.
      elapsed: args.elapsed || undefined,
      labels: agentStatusLabels(),
      onAction,
    },
    template: `
      <p
        ndsAgentStatus
        [status]="status"
        [elapsed]="elapsed"
        [labels]="labels"
        (action)="onAction($event)"
      ></p>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="agent-status"]')!;
    const labels = agentStatusLabels();

    await step('A linha NÃO é região viva', async () => {
      // Quem lê está ouvindo a resposta ser gerada logo abaixo, e um anúncio a
      // cada troca de estado corta a leitura no meio (decisão 1 da folha). Quem
      // quiser anunciar põe a região por fora, sabendo o que está fazendo.
      await expect(root.hasAttribute('aria-live')).toBe(false);
      await expect(root.hasAttribute('role')).toBe(false);
      await expect(root.querySelector('[aria-live]')).toBeNull();
      await expect(root.querySelector('[role="status"], [role="alert"], [role="log"]')).toBeNull();
    });

    await step('A palavra do estado escolhido está na linha', async () => {
      // A cor do ponto é a única diferença visual entre três dos cinco, e cor
      // sozinha não descreve estado (WCAG 1.4.1).
      await expect(root.dataset.status).toBe(args.status);
      const label = root.querySelector<HTMLElement>('[data-slot="agent-status-label"]')!;
      await expect(label.textContent).toBe(labels.status[args.status]);
    });

    await step('E o ponto fica FORA do que é lido em voz', async () => {
      const dot = root.querySelector<HTMLElement>('[data-slot="agent-status-dot"]')!;
      await expect(dot.getAttribute('aria-hidden')).toBe('true');
      await expect(dot.textContent).toBe('');
    });

    await step('O relógio aparece, e sai do que é anunciado', async () => {
      // Um número que se reescreve a cada segundo torna a tela impossível de
      // ouvir (regra 9 da guideline 17). Ele é visível, e só isso.
      const clock = root.querySelector<HTMLElement>('[data-slot="agent-status-elapsed"]')!;
      await expect(clock.textContent).toBe(args.elapsed);
      await expect(clock.getAttribute('aria-hidden')).toBe('true');
      await expect(within(canvasElement).queryByText(args.elapsed)).toBeInTheDocument();
    });
  },
};
