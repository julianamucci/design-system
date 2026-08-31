import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, fn, within } from 'storybook/test';
import AgentStatusStory from './AgentStatusStory.svelte';
import { agentStatusLabels } from './agent-status.fixtures';
import { agentStatusSource } from './agent-status.source';
import { RUN_STATUSES, type RunStatus } from '@shared/primitives/chat-protocol';
import AgentStatusDocs from '@/components/docs/AgentStatusDocs.svelte';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onAction = fn();

/**
 * Os dois eixos da linha, numa linha só.
 *
 * O estado decide a palavra, a cor do ponto e o que a ação pede; o relógio é o
 * único pedaço que se vê e não se ouve. A grade dos cinco estados mora em
 * `States`; aqui o assunto é o que muda quando se mexe em cada eixo.
 */
type PlaygroundArgs = {
  status: RunStatus;
  elapsed: string;
};

// O docgen do Svelte está desligado no .storybook/main.ts: a aba
// "API Reference" sai só destes argTypes.
const meta: Meta<PlaygroundArgs> = {
  title: 'Primitives/Conversational/AgentStatus',
  component: AgentStatusStory,
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(AgentStatusDocs),
      // Sem docgen, o gerador de source monta a tag a partir do nome interno da
      // função compilada. A transform devolve o uso real.
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
  render: (args) => ({
    Component: AgentStatusStory,
    props: { ...args, onAction },
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
