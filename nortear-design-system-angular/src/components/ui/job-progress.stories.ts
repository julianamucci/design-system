import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, within } from 'storybook/test';
import {
  jobProgressValue,
  RUN_STATUSES,
  type JobCount,
  type RunStatus,
} from '@shared/primitives/chat-protocol';
import { NdsJobProgress } from './job-progress';
import { jobLabel, jobProgressLabels } from './job-progress.fixtures';
import { jobProgressSource } from './job-progress.source';
import { NdsJobProgressDocs } from '@/components/docs/JobProgressDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// Os três eixos da peça, numa peça só.
//
// O estado decide a palavra, a cor da barra, se a peça se declara ocupada e o
// que a ação oferece; a conta decide a fração; e a ausência do total decide se
// há fração alguma. A grade dos cinco estados mora em `States`; aqui o assunto
// é o que muda quando se mexe em cada eixo.

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onAction = fn();

type PlaygroundArgs = {
  status: RunStatus;
  done: number;
  total: number;
};

/**
 * A conta que os controls descrevem.
 *
 * Campo numérico vazio é ausência de conta, e não uma conta em branco: sem o
 * número já feito não há o que escrever, e a peça deixa de desenhar a linha em
 * vez de desenhar um vão. Total zero é ausência pelo mesmo motivo, e quem
 * responde por ele é o vocabulário compartilhado — aqui ele nem chega, porque
 * ensinar `total: 0` seria ensinar um denominador que ninguém pode dividir.
 */
const countOf = (args: PlaygroundArgs): JobCount | undefined =>
  Number.isFinite(args.done)
    ? { done: args.done, total: args.total ? args.total : undefined }
    : undefined;

const meta: Meta<PlaygroundArgs> = {
  title: 'Components/Conversational/JobProgress',
  tags: ['autodocs', 'conversational'],
  decorators: [moduleMetadata({ imports: [NdsJobProgress] })],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(NdsJobProgressDocs),
      // O renderer desta stack imprime o `template` da story com os bindings
      // apontando para `props` que só existem aqui. A transform devolve o uso
      // real: um componente que declara os rótulos e trata o pedido.
      source: { transform: jobProgressSource },
    },
  },
  argTypes: {
    status: {
      control: 'select',
      options: [...RUN_STATUSES],
      description:
        'Em que pé está o trabalho. Decide a palavra, a cor da barra, se a peça se declara ocupada e o que a ação oferece.',
      table: {
        type: { summary: RUN_STATUSES.map((s) => `'${s}'`).join(' | ') },
        defaultValue: { summary: "'idle'" },
      },
    },
    done: {
      control: { type: 'number', min: 0 },
      description: 'Quantas unidades já foram feitas.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '—' } },
    },
    total: {
      control: { type: 'number', min: 0 },
      description:
        'De quantas. Zero é ausência, e não um denominador: sem total conhecido a barra deixa de mostrar um número em vez de mostrar zero.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    status: 'running',
    done: 1240,
    total: 5000,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item2', 'functional.item5',
      'accessibility.item1', 'accessibility.item2', 'accessibility.item4',
      'visual.item1',
    ],
  },
  // Os rótulos vêm do andaime compartilhado, e não de literais: eles têm três
  // idiomas, e uma palavra escrita à mão aqui congelaria um deles.
  render: (args) => ({
    props: {
      label: jobLabel(),
      status: args.status,
      count: countOf(args),
      labels: jobProgressLabels(),
      onAction,
    },
    template: `
      <div
        ndsJobProgress
        [label]="label"
        [status]="status"
        [count]="count"
        [labels]="labels"
        (action)="onAction($event)"
      ></div>
    `,
  }),
  play: async ({ canvasElement, step, args }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="job-progress"]')!;
    const labels = jobProgressLabels();
    const count = countOf(args);

    await step('A palavra do estado escolhido está na peça', async () => {
      // A barra é a leitura rápida para quem vê, e barra sozinha não descreve
      // estado (WCAG 1.4.1) — em espera e interrompido desenham igual.
      await expect(root.dataset.status).toBe(args.status);
      const word = root.querySelector<HTMLElement>('[data-slot="job-progress-status"]')!;
      await expect(word.textContent).toBe(labels.status[args.status]);
    });

    await step('A conta aparece escrita, e fica FORA do que é lido em voz', async () => {
      // Ela se reescreve a cada unidade processada, e a barra já carrega o
      // mesmo número — a cópia que sai é a que rerroda.
      const tally = root.querySelector<HTMLElement>('[data-slot="job-progress-count"]');
      if (!count) {
        // Sem número já feito não há o que escrever, e a peça não desenha um vão.
        await expect(tally).toBeNull();
        return;
      }
      await expect(tally!.getAttribute('aria-hidden')).toBe('true');
      await expect(tally!.textContent).toContain(count.done.toLocaleString());
      await expect(within(canvasElement).queryByText(tally!.textContent!)).toBeInTheDocument();
    });

    await step('A barra mostra o que o vocabulário decide', async () => {
      const bar = root.querySelector<HTMLElement>('[data-slot="progress"]')!;
      await expect(bar.classList.contains('nds-job-progress-bar')).toBe(true);
      const expected = jobProgressValue(args.status, count);
      if (expected === null) {
        // Sem total conhecido e andando: nada de número, porque zero mentiria.
        await expect(bar.hasAttribute('aria-valuenow')).toBe(false);
        await expect(bar.hasAttribute('data-indeterminate')).toBe(true);
      } else {
        await expect(bar.getAttribute('aria-valuenow')).toBe(String(expected));
      }
    });

    await step('Nada na peça é região viva', async () => {
      // Um trabalho longo é o que anda SOZINHO enquanto quem pediu faz outra
      // coisa: nada está bloqueado e ninguém deve resposta (decisão 1 da
      // folha). O que existe no lugar é a peça se declarar ocupada.
      await expect(root.hasAttribute('role')).toBe(false);
      const alive = root.querySelectorAll(
        '[role="status"], [role="alert"], [role="log"], [aria-live]',
      );
      await expect([...alive]).toEqual([]);
    });
  },
};
