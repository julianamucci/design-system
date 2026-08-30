import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, within } from 'storybook/test';
import { createDraftRestore } from './draft-restore';
import {
  SAMPLE_DRAFT,
  SAMPLE_TIMESTAMP,
  draftLabels,
} from './draft-restore.fixtures';
import { draftRestoreSource } from './draft-restore.source';
import { createDraftRestoreDocs } from '@/components/docs/DraftRestoreDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onAction = fn();

/**
 * Os dois eixos da faixa, numa faixa só.
 *
 * O rascunho é o que ela mostra, e o carimbo é o que ela sabe sobre ele. Não há
 * um terceiro: o que a faixa faz com a resposta é de quem consome, e é por isso
 * que a peça inteira cabe em duas propriedades e um aviso.
 */
type PlaygroundArgs = {
  draft: string;
  timestamp: string;
};

const meta: Meta<PlaygroundArgs> = {
  title: 'Primitives/Conversational/DraftRestore',
  tags: ['autodocs', 'conversational'],
  parameters: {
    layout: 'padded',
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(createDraftRestoreDocs),
      source: { transform: draftRestoreSource },
    },
  },
  argTypes: {
    draft: {
      control: 'text',
      description:
        'O rascunho encontrado, inteiro. O corte de duas linhas é do desenho, e cortar antes tira do texto a busca do navegador e a leitura por completo.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    timestamp: {
      control: 'text',
      description:
        'Quando o rascunho foi escrito, já escrito por extenso. Formato de data é decisão de idioma, e não se decide aqui.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    draft: SAMPLE_DRAFT,
    timestamp: SAMPLE_TIMESTAMP,
  },
};

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1',
      'accessibility.item1',
      'accessibility.item3',
      'visual.item1',
    ],
  },
  render: (args) =>
    createDraftRestore({
      labels: draftLabels(),
      draft: args.draft,
      // Campo de texto vazio é ausência de carimbo, e não um carimbo em
      // branco: uma string vazia desenharia o separador sem nada depois dele.
      timestamp: args.timestamp || undefined,
      onAction,
    }),
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer-draft"]')!;
    const labels = draftLabels();

    await step('A faixa se anuncia como ESTADO, e não como alerta', async () => {
      // A faixa nasce junto com a tela e quem lê está começando a ler: um
      // alerta interromperia a leitura em curso por algo que não é urgente
      // (decisão 1 da folha). `status` espera a primeira pausa.
      await expect(root.getAttribute('role')).toBe('status');
      await expect(canvas.getByRole('status')).toBe(root);
    });

    await step('O título diz o que foi encontrado', async () => {
      const title = root.querySelector<HTMLElement>('[data-slot="composer-draft-title"]')!;
      await expect(title.textContent).toContain(labels.title);
    });

    await step('A prévia carrega o rascunho INTEIRO', async () => {
      // O corte é da folha, por `line-clamp`. Comparar o texto com o que
      // entrou é o que separa um corte visual de um corte no texto — e só o
      // visual mantém o rascunho achável pela busca do navegador.
      const preview = root.querySelector<HTMLElement>('[data-slot="composer-draft-preview"]')!;
      await expect(preview.textContent).toBe(args.draft);
    });

    await step('Cada controle NOMEIA o rascunho, e não traz só o verbo', async () => {
      // Dois verbos sozinhos são dois destinos sem assunto para quem chega
      // neles por tabulação vindo de outro lugar da tela (decisão 3).
      await expect(canvas.getAllByRole('button')).toHaveLength(2);
      await expect(canvas.getByRole('button', { name: labels.restore })).toBeInTheDocument();
      await expect(canvas.getByRole('button', { name: labels.discard })).toBeInTheDocument();
    });

    await step('E a faixa não rouba o foco ao aparecer', async () => {
      // Quem entrou para escrever continua onde estava; a faixa é alcançável
      // por estar ANTES na ordem de leitura, e não por puxar ninguém para si.
      await expect(root.contains(root.ownerDocument.activeElement)).toBe(false);
    });
  },
};
