import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { EditorComponent, type EditorHostElement } from './editor';
import {
  EDITOR_CONTENT,
  EDITOR_LABELS,
  waitUntil,
  openRow,
  pngFile,
  selectImage,
  waitForAlt,
} from './editor.fixtures';
import {
  editorCustomImageStorageSource,
  editorAiImageDescriptionSource,
} from './editor.source';

const meta: Meta = {
  title: 'UI/Editor/Compositions',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [EditorComponent] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nesta story: o painel Controls ficaria vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'As duas decisões que o editor deixa abertas para quem consome: de onde '
          + 'vem o endereço da imagem, e quem escreve o texto alternativo.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/**
 * A costura de armazenamento: quem consome decide de onde sai o `src`.
 *
 * O padrão embute o arquivo em base64, que é o que faz o Playground funcionar
 * sem servidor nenhum. Aqui o resolvedor é outro — um envio fingido que devolve
 * a URL de um CDN, e que RECUSA arquivo acima de um limite. Os dois caminhos são
 * o que uma aplicação de verdade precisa.
 */
export const CustomImageStorage: Story = {
  parameters: {
    covers: ['functional.item7'],
    docs: { source: { transform: editorCustomImageStorageSource } },
  },
  render: () => ({
    props: {
      labels: EDITOR_LABELS,
      content: EDITOR_CONTENT.customStorage,
      resolver: async (file: File): Promise<string | null> => {
        // Recusa é `null`, e não exceção: arquivo grande demais, formato fora
        // da política, envio negado. A barra não insere nada e segue.
        if (file.size > 1024) return null;
        return `https://cdn.exemplo.com/${file.name}`;
      },
    },
    template: `
      <div class="nds-w-full">
        <nds-editor
          [labels]="labels"
          [content]="content"
          preset="advanced"
          [resolveImage]="resolver"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorHostElement;
    await waitUntil(() => !!root.editor);
    root.editor.commands.setContent(EDITOR_CONTENT.customStorage);

    await step('O `src` vem do resolvedor, não do arquivo', async () => {
      await expect(await root.insertImage(pngFile('logo.png', 10))).toBe(true);
      const img = root.querySelector('img') as HTMLImageElement;
      await expect(img.getAttribute('src')).toBe('https://cdn.exemplo.com/logo.png');
      // Nada de base64: o arquivo não entrou no documento.
      await expect(img.getAttribute('src')).not.toContain('data:');
    });

    await step('Recusar não insere nada — e não é erro', async () => {
      await expect(await root.insertImage(pngFile('foto.png', 2048))).toBe(false);
      await expect(root.querySelectorAll('img')).toHaveLength(1);
    });

    await step('functional.item7 — COLAR e ARRASTAR passam pelo MESMO resolvedor', async () => {
      // Este passo é o que a declaração de `functional.item7` promete: "colar ou
      // arrastar entra pelo mesmo caminho do botão, com armazenamento e
      // descrição". Antes a story declarava o item e só chamava `insertImage` —
      // nenhum `ClipboardEvent`, nenhum `DragEvent`. O auditor de contrato dava
      // aval a uma cobertura que não existia.
      //
      // A metade da DESCRIÇÃO é de `AiImageDescription`; aqui se mede a do
      // ARMAZENAMENTO: o `src` dos dois gestos tem de sair do resolvedor de quem
      // consome, e não do embutido em base64 que é o padrão.
      const pm = root.querySelector('.ProseMirror') as HTMLElement;

      root.editor.commands.setContent('<p>colar</p>');
      const pasteData = new DataTransfer();
      pasteData.items.add(pngFile('colada.png', 10));
      pm.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: pasteData, bubbles: true, cancelable: true }),
      );
      await waitUntil(
        () => root.querySelector('img')?.getAttribute('src')
          === 'https://cdn.exemplo.com/colada.png',
      );
      await expect(root.querySelector('img')?.getAttribute('src')).toBe(
        'https://cdn.exemplo.com/colada.png',
      );

      root.editor.commands.setContent('<p>arrastar</p>');
      const dragData = new DataTransfer();
      dragData.items.add(pngFile('solta.png', 10));
      // COM coordenadas dentro do editor: o `prosemirror-view` abandona o `drop`
      // antes de chamar o gancho quando `posAtCoords` não resolve, e um evento
      // sintético em (0, 0) cai fora da caixa.
      const box = pm.getBoundingClientRect();
      pm.dispatchEvent(
        new DragEvent('drop', {
          dataTransfer: dragData,
          bubbles: true,
          cancelable: true,
          clientX: box.left + box.width / 2,
          clientY: box.top + 10,
        }),
      );
      await waitUntil(
        () => root.querySelector('img')?.getAttribute('src')
          === 'https://cdn.exemplo.com/solta.png',
      );
      await expect(root.querySelector('img')?.getAttribute('src')).toBe(
        'https://cdn.exemplo.com/solta.png',
      );

      // E a RECUSA vale para os dois gestos: arquivo acima do limite não entra
      // por arrastar, do mesmo jeito que não entra pelo botão.
      root.editor.commands.setContent(EDITOR_CONTENT.customStorage);
      const bigData = new DataTransfer();
      bigData.items.add(pngFile('enorme.png', 2048));
      pm.dispatchEvent(
        new DragEvent('drop', {
          dataTransfer: bigData,
          bubbles: true,
          cancelable: true,
          clientX: box.left + box.width / 2,
          clientY: box.top + 10,
        }),
      );
      await waitUntil(() => false, 200);
      await expect(root.querySelectorAll('img')).toHaveLength(0);
    });

    await step('A story fecha no exemplo, com a imagem que o resolvedor aceitou', async () => {
      // O que a play deixa é o que a pessoa VÊ ao abrir a story, e é o que o
      // Chromatic fotografa — não o `<p>arrastar</p>` de um passo intermediário.
      root.editor.commands.setContent(EDITOR_CONTENT.customStorage);
      await expect(await root.insertImage(pngFile('logo.png', 10))).toBe(true);
      await expect(root.querySelector('img')?.getAttribute('src')).toBe(
        'https://cdn.exemplo.com/logo.png',
      );
    });
  },
};

/**
 * A costura de DESCRIÇÃO: quem consome liga um modelo de visão.
 *
 * Aqui o "modelo" é um dublê que demora e devolve uma frase fixa. O que a story
 * verifica não é a qualidade da descrição — é o contrato em volta dela: a imagem
 * entra na hora, a descrição chega depois, e a pessoa pode corrigir o que a IA
 * escreveu.
 */
export const AiImageDescription: Story = {
  parameters: {
    covers: ['functional.item7', 'functional.item8'],
    docs: { source: { transform: editorAiImageDescriptionSource } },
  },
  render: () => ({
    props: {
      labels: EDITOR_LABELS,
      content: EDITOR_CONTENT.aiDescription,
      describer: async (file: File | null, src: string): Promise<string | null> => {
        // O dublê recebe as duas coisas que um serviço real pede: os bytes,
        // QUANDO existem, e uma URL. Imagem colada de outra página chega sem
        // arquivo — e um serviço que trabalha por URL descreve os dois casos.
        await new Promise((r) => setTimeout(r, 50));
        if (file) return `Descrição automática de ${file.name}`;
        return `Descrição automática de ${src.slice(src.lastIndexOf('/') + 1)}`;
      },
    },
    template: `
      <div class="nds-w-full">
        <nds-editor
          [labels]="labels"
          [content]="content"
          preset="advanced"
          [describeImage]="describer"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorHostElement;
    await waitUntil(() => !!root.editor);
    root.editor.commands.setContent('<p>descrição automática</p>');

    const file = pngFile('grafico.png');

    await step('A imagem entra NA HORA, com o alt provisório', async () => {
      await expect(await root.insertImage(file)).toBe(true);
      // Sem esperar nada: o nome do arquivo segura a vaga. Prender a imagem até
      // a descrição chegar trocaria uma lacuna de acessibilidade por uma de
      // responsividade — e um serviço fora do ar travaria a edição.
      await expect(root.querySelector('img')?.getAttribute('alt')).toBe('grafico.png');
    });

    await step('functional.item8 — a descrição chega depois e substitui o provisório', async () => {
      // Espera de RELÓGIO, não `waitFor`: o laço com prazo distingue "demorou"
      // de "não veio", e o segundo REPROVA.
      await waitForAlt(root, 'Descrição automática de grafico.png');
    });

    await step('functional.item7 — COLAR e ARRASTAR arquivo passam pelo mesmo caminho', async () => {
      const pm = root.querySelector('.ProseMirror') as HTMLElement;

      root.editor.commands.setContent('<p>colar</p>');
      const pasteData = new DataTransfer();
      pasteData.items.add(pngFile('colada.png'));
      pm.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: pasteData, bubbles: true, cancelable: true }),
      );
      await waitForAlt(root, 'Descrição automática de colada.png');

      root.editor.commands.setContent('<p>arrastar</p>');
      const dragData = new DataTransfer();
      dragData.items.add(pngFile('solta.png'));
      // COM coordenadas dentro do editor: o ProseMirror abandona o `drop` antes
      // de chamar o gancho quando `posAtCoords` não resolve, e um evento
      // sintético em (0, 0) cai fora da caixa.
      const box = pm.getBoundingClientRect();
      pm.dispatchEvent(
        new DragEvent('drop', {
          dataTransfer: dragData,
          bubbles: true,
          cancelable: true,
          clientX: box.left + box.width / 2,
          clientY: box.top + 10,
        }),
      );
      await waitForAlt(root, 'Descrição automática de solta.png');
    });

    await step('Soltar na MOLDURA, fora do texto, também insere', async () => {
      // O relato: arrastar abria uma aba nova. O `dragover` que a lib previne
      // cobre só o elemento editável, que tem a altura do texto — o respiro
      // abaixo da última linha é moldura, e soltar ali escapava para o
      // navegador.
      root.editor.commands.setContent('<p>moldura</p>');
      const box = root.getBoundingClientRect();
      const dragData = new DataTransfer();
      dragData.items.add(pngFile('moldura.png'));

      // O `dragover` vem PRIMEIRO, e é ele que decide o caso: só se o padrão for
      // cancelado ali o navegador entrega o `drop` à página.
      //
      // Esta asserção existe porque a de baixo NÃO cobre isso: um `drop`
      // sintético é entregue de qualquer jeito, então plantar o defeito no
      // `dragover` deixava o teste verde com o bug de volta.
      const dragOverEvent = new DragEvent('dragover', {
        dataTransfer: dragData,
        bubbles: true,
        cancelable: true,
      });
      root.dispatchEvent(dragOverEvent);
      await expect(dragOverEvent.defaultPrevented).toBe(true);

      const dropEvent = new DragEvent('drop', {
        dataTransfer: dragData,
        bubbles: true,
        cancelable: true,
        clientX: box.left + box.width / 2,
        clientY: box.bottom - 4,
      });
      root.dispatchEvent(dropEvent);
      await expect(dropEvent.defaultPrevented).toBe(true);
      await waitForAlt(root, 'Descrição automática de moldura.png');
    });

    await step('Imagem COLADA de outra página também é descrita', async () => {
      // Colar de um site insere `<img src>` sem `alt` nenhum, montado pelo
      // ProseMirror a partir do HTML da área de transferência — sem passar pela
      // inserção da barra. A varredura por `update` é o que o alcança, e ali não
      // há arquivo: só o endereço.
      root.editor.commands.setContent('<p>colada de fora</p>');
      const pm = root.querySelector('.ProseMirror') as HTMLElement;
      const pasteData = new DataTransfer();
      pasteData.setData('text/html', '<img src="https://exemplo.com/diagrama.png">');
      pm.dispatchEvent(
        new ClipboardEvent('paste', { clipboardData: pasteData, bubbles: true, cancelable: true }),
      );
      await waitForAlt(root, 'Descrição automática de diagrama.png');
    });

    await step('A barra QUEBRA em linhas, e nada fica fora da vista', async () => {
      const toolbarEl = root.querySelector('[data-slot="editor-toolbar"]') as HTMLElement;
      await expect(getComputedStyle(toolbarEl).flexWrap).toBe('wrap');
      // Sem rolagem horizontal: com ela, o botão contextual que acabou de
      // aparecer nascia além da borda, e a única pista de que existia era
      // arrastar a barra para o lado.
      await expect(toolbarEl.scrollWidth).toBe(toolbarEl.clientWidth);
    });

    await step('E a pessoa corrige o que a IA escreveu', async () => {
      // A partida é o CONTEÚDO DO EXEMPLO, e não um `<p>correção</p>` de
      // rascunho: este é o último passo, então o que ele deixa é o que a pessoa
      // vê ao abrir a story e o que o Chromatic fotografa. A palavra solta de
      // teste era sobra do passo anterior, e contradizia a frase da story.
      root.editor.commands.setContent(EDITOR_CONTENT.aiDescription);
      await expect(await root.insertImage(file)).toBe(true);
      await waitForAlt(root, 'Descrição automática de grafico.png');

      // O botão só existe com a imagem selecionada — é o mesmo desenho dos
      // botões de tabela.
      //
      // A espera vem ANTES do `getByRole`, e não depois: o bloco de imagem nasce
      // com `[hidden]`, e elemento escondido está FORA da árvore de
      // acessibilidade — `getByRole` não o encontra, ele não fica invisível. A
      // seleção do nó dispara uma transação, a revisão sobe e a detecção de
      // mudanças repinta o `[hidden]` num tique posterior; procurar o botão no
      // mesmo tique da seleção reprovava com "Unable to find an accessible
      // element". A espera é de RELÓGIO, sobre o `display` computado da caixa,
      // que é o que a story de imagem já faz.
      selectImage(root);
      const box = root.querySelector(
        '[data-slot="editor-toolbar-context"][data-node="image"]',
      ) as HTMLElement;
      await waitUntil(() => getComputedStyle(box).display !== 'none');
      const openButton = canvas.getByRole('button', { name: EDITOR_LABELS.actions.imageAlt });
      await openRow(openButton);

      const field = canvas.getByRole('textbox', { name: EDITOR_LABELS.fields.alt }) as HTMLInputElement;
      // Abre com o que está lá: ver o texto é o que permite julgá-lo.
      await waitUntil(() => field.value === 'Descrição automática de grafico.png');
      await expect(field).toHaveValue('Descrição automática de grafico.png');

      await userEvent.clear(field);
      await userEvent.type(field, 'Gráfico de barras da receita por trimestre{Enter}');
      await waitForAlt(root, 'Gráfico de barras da receita por trimestre');
    });
  },
};
