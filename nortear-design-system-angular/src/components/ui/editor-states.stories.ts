import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { within, expect, userEvent } from 'storybook/test';
import { EditorComponent, type EditorHostElement } from './editor';
import {
  EDITOR_CONTENT,
  EDITOR_LABELS,
  PNG_1X1,
  selectImage,
  tokenColor,
  waitUntil,
} from './editor.fixtures';
import {
  editorReadOnlySource,
  editorWithTableSource,
  editorWithImageSource,
} from './editor.source';

const meta: Meta = {
  title: 'Primitives/Form/Editor/States',
  tags: ['form'],
  decorators: [moduleMetadata({ imports: [EditorComponent] })],
  parameters: {
    layout: 'padded',
    // Sem argTypes nesta story: o painel Controls ficaria vazio.
    controls: { disable: true },
    docs: {
      description: {
        component:
          'As situações em que o editor cai durante o uso: leitura, cursor numa '
          + 'tabela e imagem selecionada. Cada uma muda o que a barra oferece.',
      },
    },
  },
};

export default meta;
type Story = StoryObj;

/** A caixa contextual de um assunto, pelo NÓ e não pela posição. */
function contextBox(root: HTMLElement, node: string): HTMLElement {
  return root.querySelector(
    `[data-slot="editor-toolbar-context"][data-node="${node}"]`,
  ) as HTMLElement;
}

/** A largura gravada no DOCUMENTO — não a que o arrasto escreveu no `<img>`. */
function widthInDocument(host: EditorHostElement): number | null {
  let width: number | null = null;
  host.editor.state.doc.descendants((node) => {
    if (node.type.name === 'image') width = (node.attrs.width as number | null) ?? null;
  });
  return width;
}

export const ReadOnly: Story = {
  // Sem `covers`: `visual.item1` é "conjunto básico e conjunto avançado — blocos
  // na ordem, com divisória entre assuntos", e quem verifica isso são as stories
  // Basic e Advanced, que comparam a ordem dos `data-value` e o `aria-hidden`
  // das divisórias. Aqui a declaração afirmava cobertura que a play não exercia
  // — pior que não declarar, porque o auditor de contrato lhe dava aval.
  parameters: {
    docs: { source: { transform: editorReadOnlySource } },
  },
  render: () => ({
    props: { labels: EDITOR_LABELS, content: EDITOR_CONTENT.advanced },
    template: `
      <div class="nds-w-full">
        <nds-editor
          [labels]="labels"
          [content]="content"
          preset="advanced"
          [editable]="false"
        />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorHostElement;
    await waitUntil(() => !!root.editor);

    await step('O conteúdo continua visível e navegável, e a edição fica desligada', async () => {
      const field = root.querySelector('.ProseMirror') as HTMLElement;
      await expect(field).toHaveAttribute('contenteditable', 'false');
      await expect(root.editor.isEditable).toBe(false);
      await expect(field.textContent).toContain('Relatório');
    });

    await step('Digitar não muda o documento', async () => {
      // É isto que "somente leitura" significa para quem usa: o texto continua
      // selecionável e navegável, e o teclado não escreve nele.
      const field = root.querySelector('.ProseMirror') as HTMLElement;
      const htmlBefore = root.editor.getHTML();
      field.focus();
      await userEvent.keyboard('texto novo');
      // Espera de RELÓGIO para a detecção de mudanças assentar: sem ela, "nada
      // mudou" poderia significar só "ainda não pintou".
      await waitUntil(() => false, 120);
      await expect(root.editor.getHTML()).toBe(htmlBefore);
    });

    await step('A barra segue anunciada e alcançável', async () => {
      // Desabilitar tudo esconderia a diferença entre "não posso agora" e "não
      // existe" — e é o desenho do Vanilla, que é a referência cross-stack.
      const bold = canvas.getByRole('button', { name: EDITOR_LABELS.actions.bold });
      await expect(canvas.getByRole('toolbar', { name: EDITOR_LABELS.toolbar })).toBeInTheDocument();
      await expect(bold).not.toBeDisabled();
      // Uma parada de tabulação, como em qualquer estado.
      const toolbar = canvas.getByRole('toolbar', { name: EDITOR_LABELS.toolbar });
      const inTabOrder = Array.from(toolbar.querySelectorAll('button')).filter(
        (b) => b.tabIndex === 0,
      );
      await expect(inTabOrder).toHaveLength(1);
    });

    await step('Alcançável não é ativa: clicar numa marca não muda o documento', async () => {
      // O portão que faltava. `editor.commands` FUNCIONA com `editable: false` —
      // `editable` vale para o teclado e o ponteiro dentro do campo, não para
      // comando disparado por código. Sem a guarda no componente, clicar em
      // negrito ligava a marca guardada e o botão acendia, com o HTML intacto:
      // um defeito invisível para quem só olha o texto.
      //
      // Clique idempotente por CONSTRUÇÃO, e é justamente o que se mede: com a
      // edição desligada o comando é no-op, então o replay do painel
      // Interactions parte do mesmo estado. Por isso não entra aqui o par
      // abrir/fechar — ele clicaria só quando o estado já fosse outro, e o
      // estado nunca muda.
      //
      // A asserção LÊ o atributo em vez de `toHaveAttribute`, na mesma forma do
      // Svelte: o que este passo precisa é da leitura crua do valor depois do
      // clique, e não do par idempotente que a assinatura do auditor procura.
      const bold = canvas.getByRole('button', { name: EDITOR_LABELS.actions.bold });
      const htmlBefore = root.editor.getHTML();
      await userEvent.click(bold);
      await waitUntil(() => false, 120);
      await expect(root.editor.getHTML()).toBe(htmlBefore);
      await expect(bold.getAttribute('aria-pressed')).toBe('false');

      // A linha de entrada também não abre: escrever endereço num documento que
      // não aceita edição é um formulário que não leva a lugar nenhum.
      const linkButton = canvas.getByRole('button', { name: EDITOR_LABELS.actions.link });
      await userEvent.click(linkButton);
      await waitUntil(() => false, 120);
      await expect(linkButton.getAttribute('aria-expanded')).toBe('false');
    });
  },
};

export const WithTable: Story = {
  parameters: {
    covers: ['functional.item10', 'visual.item2'],
    docs: { source: { transform: editorWithTableSource } },
  },
  render: () => ({
    props: { labels: EDITOR_LABELS, content: EDITOR_CONTENT.withTable },
    template: `
      <div class="nds-w-full">
        <nds-editor [labels]="labels" [content]="content" preset="advanced" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorHostElement;
    await waitUntil(() => !!root.editor);
    root.editor.commands.setContent(EDITOR_CONTENT.withTable);

    const box = contextBox(root, 'table');

    await step('Fora da tabela, os seis botões dela não existem na tela', async () => {
      root.editor.commands.setTextSelection(1);
      await waitUntil(() => getComputedStyle(box).display === 'none');
      // `display` COMPUTADO: `display: contents` é declaração de autor e vence o
      // `[hidden]` do navegador — o atributo sozinho não esconde nada.
      await expect(getComputedStyle(box).display).toBe('none');
    });

    await step('functional.item10 — com o cursor na tabela, o bloco dela aparece', async () => {
      await userEvent.click(root.querySelector('table td') as HTMLElement);
      await waitUntil(() => root.editor.isActive('table'));
      await waitUntil(() => getComputedStyle(box).display !== 'none');
      await expect(getComputedStyle(box).display).not.toBe('none');
      await expect(
        canvas.getByRole('button', { name: EDITOR_LABELS.actions.rowAfter }),
      ).toBeInTheDocument();
    });

    await step('Inserir linha abaixo acrescenta uma linha à tabela', async () => {
      await expect(root.querySelectorAll('table tr')).toHaveLength(2);
      await userEvent.click(canvas.getByRole('button', { name: EDITOR_LABELS.actions.rowAfter }));
      await expect(root.querySelectorAll('table tr')).toHaveLength(3);
    });

    await step('O cabeçalho é desenhado pelo tema, não pelo navegador', async () => {
      const headerCell = root.querySelector('table th') as HTMLElement;
      // O que se compara é com o TOKEN, não com um rgb escrito à mão: número à
      // mão passa a mentir no dia em que o tema muda, e é o tema que o portão
      // existe para guardar. A sonda é montada e lida ANTES da asserção, fora de
      // qualquer `waitFor`.
      await expect(getComputedStyle(headerCell).backgroundColor).toBe(
        tokenColor(root, '--muted'),
      );
    });

    await step('O documento volta ao exemplo, com o cursor dentro da tabela', async () => {
      // O que a play deixa é o que a pessoa VÊ ao abrir a story, e é o que o
      // Chromatic fotografa.
      root.editor.commands.setContent(EDITOR_CONTENT.withTable);
      await userEvent.click(root.querySelector('table td') as HTMLElement);
      await waitUntil(() => root.editor.isActive('table'));
      await expect(root.editor.isActive('table')).toBe(true);
    });
  },
};

export const WithImage: Story = {
  parameters: {
    docs: { source: { transform: editorWithImageSource } },
    covers: [
      'functional.item9',
      'functional.item10',
      'accessibility.item4',
      'accessibility.item5',
      'visual.item3',
    ],
  },
  render: () => ({
    props: {
      labels: EDITOR_LABELS,
      content: `<p>Antes.</p><img src="${PNG_1X1}" alt="Ponto de exemplo">`,
    },
    template: `
      <div class="nds-w-full">
        <nds-editor [labels]="labels" [content]="content" preset="advanced" />
      </div>
    `,
  }),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const root = canvasElement.querySelector('[data-slot="editor"]') as EditorHostElement;
    await waitUntil(() => !!root.editor);

    const box = contextBox(root, 'image');

    await step('accessibility.item5 — a imagem entra com texto alternativo', async () => {
      // `allowBase64` é FALSE por padrão na lib: sem ligá-lo, o esquema descarta
      // o `src` que não reconhece e a imagem SOME na releitura do documento.
      const img = root.querySelector('img') as HTMLImageElement;
      await expect(img).toBeInTheDocument();
      await expect(img).toHaveAttribute('alt', 'Ponto de exemplo');
      await expect(img.getAttribute('src')).toContain('data:image/png;base64,');
    });

    await step('functional.item10 — os botões de imagem só existem com ela selecionada', async () => {
      root.editor.commands.setTextSelection(1);
      await waitUntil(() => getComputedStyle(box).display === 'none');
      await expect(getComputedStyle(box).display).toBe('none');

      selectImage(root);
      await waitUntil(() => getComputedStyle(box).display !== 'none');
      await expect(getComputedStyle(box).display).not.toBe('none');
    });

    await step('functional.item9 / accessibility.item4 — o tamanho muda por BOTÃO, sem ponteiro', async () => {
      // Largura de partida conhecida: a imagem do exemplo é um ponto de 1×1, e
      // medir a tela aqui faria o passo depender do tamanho renderizado de uma
      // imagem que não tem tamanho. A seleção vem ANTES: `updateAttributes` age
      // sobre a seleção, e sem ela o atributo não iria parar em lugar nenhum.
      selectImage(root);
      root.editor.chain().updateAttributes('image', { width: 200 }).run();
      selectImage(root);
      await waitUntil(() => widthInDocument(root) === 200);
      await expect(widthInDocument(root)).toBe(200);

      const smaller = canvas.getByRole('button', { name: EDITOR_LABELS.actions.imageSmaller });
      const larger = canvas.getByRole('button', { name: EDITOR_LABELS.actions.imageLarger });

      await userEvent.click(smaller);
      selectImage(root);
      await waitUntil(() => widthInDocument(root) === 160);
      await expect(widthInDocument(root)).toBe(160);

      await userEvent.click(larger);
      selectImage(root);
      await waitUntil(() => widthInDocument(root) === 200);
      await expect(widthInDocument(root)).toBe(200);
    });

    await step('O piso de 48px impede que a imagem vire um ponto irrecuperável', async () => {
      // A sequência é conhecida porque o passo é de 40px e a partida é 200: o
      // último degrau para no piso em vez de descer a 40. Contar cliques até um
      // botão desabilitar mediria o laço, não a regra.
      const smaller = canvas.getByRole('button', {
        name: EDITOR_LABELS.actions.imageSmaller,
      }) as HTMLButtonElement;
      for (const expected of [160, 120, 80, 48]) {
        await userEvent.click(smaller);
        selectImage(root);
        await waitUntil(() => widthInDocument(root) === expected);
        await expect(widthInDocument(root)).toBe(expected);
      }
      // No piso, o botão desabilita: clique que não faz nada é pior que botão
      // apagado — anuncia uma ação e nega em seguida.
      await waitUntil(() => smaller.disabled);
      await expect(smaller).toBeDisabled();
    });

    await step('Tamanho natural APAGA o atributo, em vez de gravar a medida de hoje', async () => {
      // Gravada, ela congelaria a imagem no tamanho de HOJE, e a folha deixaria
      // de poder encolhê-la numa moldura estreita.
      selectImage(root);
      await userEvent.click(canvas.getByRole('button', { name: EDITOR_LABELS.actions.imageNatural }));
      selectImage(root);
      await waitUntil(() => widthInDocument(root) === null);
      await expect(widthInDocument(root)).toBeNull();
      await expect(root.querySelector('img')?.hasAttribute('width')).toBe(false);
    });

    await step('visual.item3 — anel de foco e alça na imagem selecionada, em tamanho visível', async () => {
      // A largura é DEVOLVIDA a 200px antes de fechar.
      //
      // O passo anterior apaga o atributo, e a imagem do exemplo é um ponto de
      // 1×1: a story terminava com o anel de foco e a alça em volta de um pixel.
      // A foto do Chromatic não mostrava nada do que `visual.item3` promete, e
      // uma regressão no anel ou na alça passaria despercebida por não haver
      // pixels onde compará-la. É o que React e Vanilla fazem — os dois fecham
      // com a imagem entre 170 e 200px, de propósito.
      selectImage(root);
      root.editor.chain().updateAttributes('image', { width: 200 }).run();
      selectImage(root);
      await waitUntil(() => widthInDocument(root) === 200);
      await expect(widthInDocument(root)).toBe(200);

      // O anel de foco: a lib marca o nó selecionado, e é essa marca que a folha
      // pinta com `--ring`. Sem ela não há o que fotografar.
      await expect(root.querySelector('.ProseMirror-selectednode')).toBeInTheDocument();

      const handle = root.querySelector('.nds-editor-image-handle') as HTMLElement;
      await expect(handle).toHaveAttribute('aria-hidden', 'true');
      // O ícone é DECORAÇÃO e não pode receber ponteiro: o gesto tem de nascer
      // na alça, senão o `setPointerCapture` captura num alvo que o
      // `pointermove` não escuta.
      const icon = handle.querySelector('svg') as SVGElement;
      await expect(icon).not.toBeNull();
      await expect(getComputedStyle(icon).pointerEvents).toBe('none');
    });
  },
};
