import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, fn, within } from 'storybook/test';
import { createDraftRestore, type DraftRestoreOptions } from './draft-restore';
import {
  SAMPLE_DRAFT,
  SAMPLE_DRAFT_LONG,
  SAMPLE_TIMESTAMP,
  draftLabels,
} from './draft-restore.fixtures';
import {
  draftDatedSource,
  draftFoundSource,
  draftLongSource,
} from './draft-restore.source';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// ESTA PEÇA NÃO TEM ARQUIVO DE VARIANTES, e a ausência é decisão.
//
// Variante é FORMA — quem monta a escolhe, e ela não muda durante o uso. Aqui
// não existe eixo assim: a faixa tem um desenho só, e tudo o que muda nela é o
// que ela encontrou — se há carimbo, se o texto cabe nas duas linhas. Um
// arquivo de variantes com estados dentro diria que há uma escolha de forma
// onde não há, e a próxima pessoa procuraria a diferença que não existe.
//
// O quarto estado da tabela — SEM RASCUNHO — não tem story, e também é
// decisão: ele é a faixa que não existe. Quem consome não a monta, porque
// faixa vazia é pergunta sem assunto. Fotografar o nada provaria só que o
// Chromatic sabe fotografar o nada.

const meta: Meta = {
  title: 'Primitives/Conversational/DraftRestore/States',
  tags: ['conversational'],
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: draftFoundSource },
      description: {
        component:
          'O que a faixa mostra conforme o que foi encontrado: só o texto, o texto com a data, e o texto que não cabe nas duas linhas.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

const onAction = fn();

const mount = (options: Omit<DraftRestoreOptions, 'labels'>) =>
  createDraftRestore({ labels: draftLabels(), onAction, ...options });

const rootOf = (canvasElement: HTMLElement) =>
  canvasElement.querySelector<HTMLElement>('[data-slot="composer-draft"]')!;

const titleOf = (canvasElement: HTMLElement) =>
  rootOf(canvasElement).querySelector<HTMLElement>('[data-slot="composer-draft-title"]')!;

const previewOf = (canvasElement: HTMLElement) =>
  rootOf(canvasElement).querySelector<HTMLElement>('[data-slot="composer-draft-preview"]')!;

export const Found: Story = {
  parameters: {
    covers: ['functional.item2', 'visual.item2'],
  },
  render: () => mount({ draft: SAMPLE_DRAFT }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const labels = draftLabels();

    await step('A faixa traz o título, a prévia e os dois controles', async () => {
      await expect(titleOf(canvasElement).textContent).toContain(labels.title);
      await expect(previewOf(canvasElement).textContent).toBe(SAMPLE_DRAFT);
      await expect(canvas.getAllByRole('button')).toHaveLength(2);
    });

    await step('Sem carimbo, o título fica SOZINHO', async () => {
      // Nada de separador pendurado num tempo que não existe: ausência de
      // carimbo é ausência do trecho inteiro, e não um espaço em branco.
      await expect(
        titleOf(canvasElement).querySelector('[data-slot="composer-draft-timestamp"]'),
      ).toBeNull();
      await expect(titleOf(canvasElement).textContent).toBe(labels.title);
    });
  },
};

export const Dated: Story = {
  parameters: {
    covers: ['functional.item3', 'accessibility.item4', 'visual.item3'],
    docs: { source: { transform: draftDatedSource } },
  },
  render: () => mount({ draft: SAMPLE_DRAFT, timestamp: SAMPLE_TIMESTAMP }),
  play: async ({ canvasElement, step }) => {
    await step('O carimbo acompanha o título', async () => {
      const stamp = titleOf(canvasElement)
        .querySelector<HTMLElement>('[data-slot="composer-draft-timestamp"]')!;
      await expect(stamp.textContent).toContain(SAMPLE_TIMESTAMP);
    });

    await step('E ele é LIDO junto com o título, ao contrário de um cronômetro', async () => {
      // Cronômetro ao vivo se esconde (regra 9 da guideline 17) porque se
      // reescreve a cada segundo. Este chega pronto e não muda mais: esconder
      // não protegeria ninguém, só tiraria de quem ouve a informação de quando
      // o rascunho é.
      const stamp = titleOf(canvasElement)
        .querySelector<HTMLElement>('[data-slot="composer-draft-timestamp"]')!;
      await expect(stamp.getAttribute('aria-hidden')).toBeNull();
      await expect(titleOf(canvasElement).textContent).toContain(SAMPLE_TIMESTAMP);
    });
  },
};

export const LongDraft: Story = {
  parameters: {
    covers: ['functional.item4', 'accessibility.item2', 'visual.item4'],
    docs: { source: { transform: draftLongSource } },
  },
  render: () => mount({ draft: SAMPLE_DRAFT_LONG, timestamp: SAMPLE_TIMESTAMP }),
  play: async ({ canvasElement, step }) => {
    await step('O rascunho INTEIRO continua no documento', async () => {
      // O texto que entrou é o texto que está lá, letra por letra. É isso que
      // o mantém achável pela busca do navegador e audível do começo ao fim.
      await expect(previewOf(canvasElement).textContent).toBe(SAMPLE_DRAFT_LONG);
    });

    await step('Não há reticências postiças no texto', async () => {
      // Reticências feitas em código viram mentira para quem ouve: o leitor de
      // tela anunciaria um fim que não é o fim do rascunho.
      await expect(previewOf(canvasElement).textContent).not.toContain('…');
      await expect(previewOf(canvasElement).textContent).not.toContain('...');
    });

    await step('Quem corta é o DESENHO, e o corte é visual', async () => {
      // A prévia é mais alta por dentro do que por fora: é essa diferença que
      // prova que há texto além do que se vê, e que ele não foi removido.
      const preview = previewOf(canvasElement);
      await expect(preview.scrollHeight).toBeGreaterThan(preview.clientHeight);
    });
  },
};
