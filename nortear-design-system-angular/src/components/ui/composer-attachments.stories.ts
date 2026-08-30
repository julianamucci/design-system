import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, fn, within } from 'storybook/test';
import { NdsComposer } from './composer';
import { composerLabels } from './composer.fixtures';
import { attachmentLabels, queue, SIZE_BYTES } from './composer-attachments.fixtures';
import { composerAttachmentsSource } from './composer-attachments.source';
import { NdsComposerAttachmentsDocs } from '@/components/docs/ComposerAttachmentsDocs';
import { withAutoDocsTab } from '@/lib/withAutoDocsTab';

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O eixo desta peça é ESTADO, e não variante: não há arquivo de variantes, e a
// docs page não traz a seção. A fila com os quatro estados juntos é o
// Playground.

/** Espião de escopo de módulo: dentro do render, a play não o alcança. */
const onRemoveAttachment = fn();

const meta: Meta = {
  title: 'UI/ComposerAttachments',
  tags: ['autodocs', 'conversational'],
  decorators: [moduleMetadata({ imports: [NdsComposer] })],
  // Sem argTypes nem callbacks: sem isto os painéis Controls e Actions abrem vazios.
  parameters: {
    layout: 'padded',
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      page: withAutoDocsTab(NdsComposerAttachmentsDocs),
      // O renderer Angular imprime o `template` da story com os bindings
      // apontando para `props` que só existem aqui. A transform devolve o uso
      // real: um componente que guarda a fila e trata o pedido de remoção.
      source: { transform: composerAttachmentsSource },
    },
  },
};

export default meta;
type Story = StoryObj;

export const Playground: Story = {
  parameters: {
    covers: [
      'functional.item1', 'functional.item2', 'functional.item4',
      'accessibility.item1', 'accessibility.item4',
      'visual.item1',
    ],
  },
  // Os rótulos vêm do andaime compartilhado, e não de literais: eles têm três
  // idiomas, e uma palavra escrita à mão aqui congelaria um deles.
  render: () => ({
    props: {
      labels: composerLabels(),
      attachmentLabels: attachmentLabels(),
      files: queue(),
      onRemoveAttachment,
    },
    template: `
      <nds-composer
        class="nds-max-w-lg"
        [labels]="labels"
        [attachmentLabels]="attachmentLabels"
        [attachments]="files"
        (removeAttachment)="onRemoveAttachment($event)"
      />
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector<HTMLElement>('[data-slot="composer"]')!;
    const list = root.querySelector<HTMLElement>('[data-slot="composer-attachments"]')!;
    const labels = attachmentLabels();

    await step('A fila é uma LISTA, com um item por anexo', async () => {
      // É o que faz o leitor de tela anunciar quantos anexos há antes de
      // percorrê-los. Uma pilha de `div` não anuncia nada.
      await expect(list.tagName).toBe('UL');
      await expect(list).toHaveAccessibleName(labels.list);
      await expect(list.children).toHaveLength(4);
    });

    await step('O tamanho aparece convertido, com a unidade em palavra', async () => {
      // A conta vem do primitivo compartilhado; a palavra, dos rótulos. O
      // arquivo de 2.516.582 bytes se lê em megabytes com uma casa.
      //
      // O separador decimal é do IDIOMA do navegador, e não do componente: a
      // asserção aceita os dois para não medir a configuração da máquina no
      // lugar da conversão.
      const first = list.children[0]!;
      await expect(first.textContent).toMatch(new RegExp(`2[.,]4\\s${labels.unit.mb}`));
    });

    await step('E o que é pequeno fica em bytes — o limiar não é frouxo', async () => {
      const uploading = list.children[1]!;
      await expect(uploading).toHaveTextContent(`${SIZE_BYTES} ${labels.unit.byte}`);
    });

    await step('Cada item diz o ESTADO por escrito', async () => {
      // É a palavra que decide o que fazer: uma pede paciência, a outra pede
      // ação. A barra não fala.
      const words = [...list.children].map((li) => li.textContent ?? '');
      await expect(words[0]).toContain(labels.state.pending);
      await expect(words[1]).toContain(labels.state.uploading);
      await expect(words[2]).toContain(labels.state.ready);
      await expect(words[3]).toContain(labels.state.failed);
    });

    await step('E cada botão de remover diz QUAL arquivo remove', async () => {
      // Uma fila de três botões chamados "Remover" é o mesmo botão para quem
      // ouve a tela.
      const canvas = within(canvasElement);
      for (const fileName of ['planta.pdf', 'medidas.csv', 'fachada.png', 'corte.dwg']) {
        await expect(
          canvas.getByRole('button', { name: labels.remove.replace('{name}', fileName) }),
        ).toBeInTheDocument();
      }
    });
  },
};
