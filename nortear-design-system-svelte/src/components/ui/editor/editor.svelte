<script lang="ts" module>
  // ─── Editor — texto rico sobre @tiptap/core ────────────────────────────────
  //
  // O núcleo do Tiptap monta em qualquer `Element`: `EditorOptions.element`
  // aceita um nó solto, então nenhum binding de framework é requisito. Aqui ele
  // entra por `$effect` sobre o nó referenciado, e sai por `destroy()` na
  // limpeza — que é o ciclo de vida inteiro que a lib pede.
  //
  // A BARRA É NOSSA. Nenhum pacote `@tiptap/*` traz botão, ícone ou barra: a
  // lib é o motor do documento. O que ela presetea é CAPACIDADE, e os conjuntos
  // abaixo escolhem o que dessa capacidade vira botão.
  //
  // A folha do KaTeX é importada AQUI, e não na folha global: são dezenas de kB
  // de CSS mais os arquivos de fonte, e quem não usa o editor não deve pagar por
  // eles. Importada no módulo, ela viaja no mesmo pedaço que o editor.
  import type { Editor } from '@tiptap/core';
  import { Image } from '@tiptap/extension-image';
  import { ArrowDownRightFromSquare } from 'lucide';

  import Bold from '@lucide/svelte/icons/bold';
  import Captions from '@lucide/svelte/icons/captions';
  import Code from '@lucide/svelte/icons/code';
  import Columns3 from '@lucide/svelte/icons/columns-3';
  import Expand from '@lucide/svelte/icons/expand';
  import Heading1 from '@lucide/svelte/icons/heading-1';
  import Heading2 from '@lucide/svelte/icons/heading-2';
  import Heading3 from '@lucide/svelte/icons/heading-3';
  import Highlighter from '@lucide/svelte/icons/highlighter';
  import ImageIcon from '@lucide/svelte/icons/image';
  import Italic from '@lucide/svelte/icons/italic';
  import LinkIcon from '@lucide/svelte/icons/link';
  import List from '@lucide/svelte/icons/list';
  import ListOrdered from '@lucide/svelte/icons/list-ordered';
  import ListTodo from '@lucide/svelte/icons/list-todo';
  import Minus from '@lucide/svelte/icons/minus';
  import PanelTop from '@lucide/svelte/icons/panel-top';
  import Quote from '@lucide/svelte/icons/quote';
  import Redo2 from '@lucide/svelte/icons/redo-2';
  import RotateCcw from '@lucide/svelte/icons/rotate-ccw';
  import Rows3 from '@lucide/svelte/icons/rows-3';
  import Shrink from '@lucide/svelte/icons/shrink';
  import Sigma from '@lucide/svelte/icons/sigma';
  import SquareCode from '@lucide/svelte/icons/square-code';
  import Strikethrough from '@lucide/svelte/icons/strikethrough';
  import TableIcon from '@lucide/svelte/icons/table';
  import TextAlignCenter from '@lucide/svelte/icons/text-align-center';
  import TextAlignEnd from '@lucide/svelte/icons/text-align-end';
  import TextAlignJustify from '@lucide/svelte/icons/text-align-justify';
  import TextAlignStart from '@lucide/svelte/icons/text-align-start';
  import Trash2 from '@lucide/svelte/icons/trash-2';
  import Underline from '@lucide/svelte/icons/underline';
  import Undo2 from '@lucide/svelte/icons/undo-2';
  import Unlink from '@lucide/svelte/icons/unlink';

  import 'katex/dist/katex.min.css';

  /** Tudo que a barra sabe fazer. Nem todo conjunto expõe tudo. */
  export type EditorAction =
    | 'bold'
    | 'italic'
    | 'underline'
    | 'strike'
    | 'code'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'highlight'
    | 'alignLeft'
    | 'alignCenter'
    | 'alignRight'
    | 'alignJustify'
    | 'bulletList'
    | 'orderedList'
    | 'taskList'
    | 'blockquote'
    | 'codeBlock'
    | 'link'
    | 'image'
    | 'table'
    | 'horizontalRule'
    | 'undo'
    | 'redo'
    | 'formula'
    // Só existem com uma imagem selecionada.
    | 'imageAlt'
    | 'imageSmaller'
    | 'imageLarger'
    | 'imageNatural'
    // Só existem com o cursor DENTRO de uma tabela.
    | 'rowAfter'
    | 'columnAfter'
    | 'deleteRow'
    | 'deleteColumn'
    | 'headerRow'
    | 'deleteTable';

  /** Blocos visuais da barra. Cada um vira um grupo com nome próprio. */
  export type EditorGroup =
    | 'marks'
    | 'headings'
    | 'align'
    | 'lists'
    | 'blocks'
    | 'actions'
    | 'table';

  /**
   * Conjuntos de botões.
   *
   * `basic` cobre texto de formulário, comentário e descrição. `advanced`
   * acrescenta o que um editor de conteúdo longo pede. Os dois usam a MESMA
   * lista de extensões: trocar de conjunto muda o que aparece na barra, não o
   * que o documento aceita, então texto colado com título continua com título
   * no conjunto básico.
   */
  export type EditorPreset = 'basic' | 'advanced';

  export type EditorLabels = {
    /** Nome acessível da barra inteira. */
    toolbar: string;
    /**
     * Nome acessível da ÁREA EDITÁVEL.
     *
     * A lib põe `role="textbox"` no elemento editável, e campo com papel de
     * campo e sem nome é violação de `aria-input-field-name`. Não há rótulo
     * visível a que apontar: a moldura inteira é o campo.
     */
    editorField: string;
    /** Nome de cada bloco. Grupo sem nome é anunciado como "grupo" e mais nada. */
    groups: Record<EditorGroup, string>;
    /** Nome de cada botão. Todos são só de ícone — o rótulo é o nome acessível. */
    actions: Record<EditorAction, string>;
    /** As três linhas que pedem texto antes de agir. */
    fields: {
      formula: string;
      formulaConfirm: string;
      link: string;
      linkConfirm: string;
      /**
       * Botão que TIRA o link do trecho.
       *
       * Aparece só quando há link sob o cursor. Apagar o campo e confirmar
       * continua tirando — mas esse caminho depende de a pessoa deduzir.
       */
      linkRemove: string;
      /** Rótulo do campo de texto alternativo da imagem. */
      alt: string;
      altConfirm: string;
    };
  };

  export type EditorProps = {
    /**
     * Conteúdo inicial, em HTML. Passa por `DOMPurify` antes de chegar à lib: o
     * Tiptap monta o documento a partir de um nó criado por `innerHTML`, e
     * `<img onerror>` dispara mesmo em nó solto do documento. O esquema do
     * ProseMirror descartaria o nó depois — tarde demais.
     */
    content?: string;
    editable?: boolean;
    /** Conjunto de botões. Padrão `advanced`. */
    preset?: EditorPreset;
    labels: EditorLabels;
    /**
     * De onde sai o `src` da imagem — a decisão de ARMAZENAMENTO, que é de quem
     * consome o design system, não dele.
     *
     * Devolver `null` cancela a inserção (envio recusado, arquivo grande demais,
     * formato fora da política). O padrão é `data:` em base64, que não depende
     * de servidor nenhum e NÃO é o que se leva para produção: base64 infla o
     * documento em cerca de um terço do tamanho do arquivo.
     */
    resolveImage?: (file: File) => Promise<string | null>;
    /**
     * Escreve o texto alternativo a partir da imagem — o lugar de ligar um
     * modelo de visão.
     *
     * Recebe o arquivo QUANDO existe: imagem colada de outra página chega só
     * como endereço. É chamado DEPOIS de inserir, nunca antes: descrever leva
     * segundos e às vezes falha, e prender a imagem esperando por isso trocaria
     * uma lacuna de acessibilidade por uma de responsividade.
     */
    describeImage?: (file: File | null, src: string) => Promise<string | null>;
    /**
     * Disparado a cada mudança do DOCUMENTO, com o HTML atual. Mover o cursor
     * gera transação e não muda o conteúdo — por isso `update`, não
     * `transaction`.
     */
    onchange?: (html: string) => void;
    class?: string;
  };

  /**
   * A raiz no DOM carrega a instância da lib e o caminho de inserção.
   *
   * Sem isso, story e teste só alcançariam o editor pelo DOM — e o estado que
   * importa (marca ativa, documento, transação) vive na instância. É a mesma
   * superfície que as outras stacks expõem, o que mantém as plays alinhadas.
   */
  export type EditorRootElement = HTMLDivElement & {
    editor: Editor;
    /**
     * Insere um arquivo de imagem pelo mesmo caminho do botão, com o
     * armazenamento e a descrição configurados. Devolve `false` quando o
     * resolvedor recusa.
     */
    insertImage: (file: File) => Promise<boolean>;
  };

  /**
   * O resolvedor padrão: o próprio arquivo, embutido no documento.
   *
   * Serve para demonstrar e para prototipar. Ver a ressalva em `resolveImage`.
   */
  export function imageAsDataUrl(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result as string));
      reader.addEventListener('error', () => resolve(null));
      reader.readAsDataURL(file);
    });
  }

  /**
   * Esquemas de URL aceitos no link.
   *
   * A lib aceita DEZ por padrão: http, https, ftp, ftps, mailto, tel, callto,
   * sms, cid e xmpp. `javascript:` já fica de fora, que é o que importa para
   * injeção, mas metade da lista é superfície sem uso num design system.
   */
  const LINK_SCHEMES = ['http', 'https', 'mailto'];

  /**
   * Menor largura de imagem, em pixels.
   *
   * Abaixo disto a alça de arrastar cobre a própria imagem. Um piso é o que
   * impede o clique acidental que reduz a imagem a um ponto irrecuperável.
   */
  const MIN_WIDTH = 48;

  /** Passo do redimensionamento por teclado, em pixels. */
  const WIDTH_STEP = 40;

  function isAllowedLink(url: string): boolean {
    try {
      // Sem base: endereço sem esquema estoura aqui, e é o que se quer — quem
      // chama completa com `https://` ANTES de perguntar. Aceitar relativo neste
      // ponto abriria a porta que a lista de esquemas existe para fechar.
      return LINK_SCHEMES.includes(new URL(url).protocol.replace(':', ''));
    } catch {
      return false;
    }
  }

  /** Só os arquivos de imagem de uma área de transferência ou de um arrasto. */
  function imageFilesOf(dt: DataTransfer | null): File[] {
    if (!dt) return [];
    return Array.from(dt.files).filter((f) => f.type.startsWith('image/'));
  }

  type LucideIconNode = [string, Record<string, string>];

  /**
   * Monta um SVG a partir dos nós do lucide.
   *
   * Existe por causa da alça de redimensionar, que vive dentro de um nodeView do
   * ProseMirror — DOM imperativo, fora do alcance do compilador. O glifo é o
   * mesmo das outras stacks e não existe no pacote de componentes, só no de nós.
   */
  function iconSvg(nodes: LucideIconNode[]): SVGSVGElement {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '2');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    for (const [tag, attributes] of nodes) {
      const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
      for (const [k, v] of Object.entries(attributes)) node.setAttribute(k, v);
      svg.appendChild(node);
    }
    return svg;
  }

  /**
   * Largura da imagem selecionada, em pixels.
   *
   * O atributo quando existe; a medida na TELA quando não. A segunda leitura é o
   * que dá um ponto de partida ao primeiro clique — imagem recém-inserida não
   * tem `width` gravado, e um passo sobre `null` teria de inventar um número.
   */
  function currentWidth(e: Editor): number {
    const stored = e.getAttributes('image').width as number | null | undefined;
    if (typeof stored === 'number') return stored;
    const img = e.view.dom.querySelector('.ProseMirror-selectednode img');
    return img ? Math.round(img.getBoundingClientRect().width) : 0;
  }

  function adjustWidth(e: Editor, step: number): void {
    const nextWidth = Math.max(MIN_WIDTH, currentWidth(e) + step);
    e.chain().focus().updateAttributes('image', { width: nextWidth }).run();
  }

  // ─── Tabela de ações ───────────────────────────────────────────────────────
  //
  // Uma linha por botão, e três perguntas que a barra faz ao editor: como se
  // desenha, se está ligada, se ainda pode. Espalhar isso por `if` de montagem
  // foi o que deixou o ícone e o valor divergirem na versão anterior.

  type IconComponent = typeof Bold;

  type Action = {
    icon: IconComponent;
    /** Ligada agora? Ausente = ação sem estado (divisória, desfazer). */
    isOn?: (e: Editor) => boolean;
    /** O que fazer no clique. Ausente = a ação abre uma linha de entrada. */
    run?: (e: Editor) => void;
    /** Ainda é possível? Ausente = sempre. */
    can?: (e: Editor) => boolean;
  };

  const ACTIONS: Record<EditorAction, Action> = {
    bold: {
      icon: Bold,
      isOn: (e) => e.isActive('bold'),
      run: (e) => void e.chain().focus().toggleBold().run(),
    },
    italic: {
      icon: Italic,
      isOn: (e) => e.isActive('italic'),
      run: (e) => void e.chain().focus().toggleItalic().run(),
    },
    underline: {
      icon: Underline,
      isOn: (e) => e.isActive('underline'),
      run: (e) => void e.chain().focus().toggleUnderline().run(),
    },
    strike: {
      icon: Strikethrough,
      isOn: (e) => e.isActive('strike'),
      run: (e) => void e.chain().focus().toggleStrike().run(),
    },
    code: {
      icon: Code,
      isOn: (e) => e.isActive('code'),
      run: (e) => void e.chain().focus().toggleCode().run(),
    },
    highlight: {
      icon: Highlighter,
      isOn: (e) => e.isActive('highlight'),
      run: (e) => void e.chain().focus().toggleHighlight().run(),
    },
    // Alinhamento é ATRIBUTO do bloco, não marca: por isso `isActive` recebe
    // `{ textAlign }` e não um nome de nó. O grupo é único — um parágrafo tem um
    // alinhamento só.
    alignLeft: {
      icon: TextAlignStart,
      isOn: (e) => e.isActive({ textAlign: 'left' }),
      run: (e) => void e.chain().focus().setTextAlign('left').run(),
    },
    alignCenter: {
      icon: TextAlignCenter,
      isOn: (e) => e.isActive({ textAlign: 'center' }),
      run: (e) => void e.chain().focus().setTextAlign('center').run(),
    },
    alignRight: {
      icon: TextAlignEnd,
      isOn: (e) => e.isActive({ textAlign: 'right' }),
      run: (e) => void e.chain().focus().setTextAlign('right').run(),
    },
    alignJustify: {
      icon: TextAlignJustify,
      isOn: (e) => e.isActive({ textAlign: 'justify' }),
      run: (e) => void e.chain().focus().setTextAlign('justify').run(),
    },
    h1: {
      icon: Heading1,
      isOn: (e) => e.isActive('heading', { level: 1 }),
      run: (e) => void e.chain().focus().toggleHeading({ level: 1 }).run(),
    },
    h2: {
      icon: Heading2,
      isOn: (e) => e.isActive('heading', { level: 2 }),
      run: (e) => void e.chain().focus().toggleHeading({ level: 2 }).run(),
    },
    h3: {
      icon: Heading3,
      isOn: (e) => e.isActive('heading', { level: 3 }),
      run: (e) => void e.chain().focus().toggleHeading({ level: 3 }).run(),
    },
    bulletList: {
      icon: List,
      isOn: (e) => e.isActive('bulletList'),
      run: (e) => void e.chain().focus().toggleBulletList().run(),
    },
    orderedList: {
      icon: ListOrdered,
      isOn: (e) => e.isActive('orderedList'),
      run: (e) => void e.chain().focus().toggleOrderedList().run(),
    },
    taskList: {
      icon: ListTodo,
      isOn: (e) => e.isActive('taskList'),
      run: (e) => void e.chain().focus().toggleTaskList().run(),
    },
    blockquote: {
      icon: Quote,
      isOn: (e) => e.isActive('blockquote'),
      run: (e) => void e.chain().focus().toggleBlockquote().run(),
    },
    codeBlock: {
      icon: SquareCode,
      isOn: (e) => e.isActive('codeBlock'),
      run: (e) => void e.chain().focus().toggleCodeBlock().run(),
    },
    horizontalRule: {
      icon: Minus,
      run: (e) => void e.chain().focus().setHorizontalRule().run(),
    },
    undo: {
      icon: Undo2,
      run: (e) => void e.chain().focus().undo().run(),
      can: (e) => e.can().undo(),
    },
    redo: {
      icon: Redo2,
      run: (e) => void e.chain().focus().redo().run(),
      can: (e) => e.can().redo(),
    },
    table: {
      icon: TableIcon,
      // 3×3 com cabeçalho: grande o bastante para mostrar o que ela é, e pequena
      // o bastante para caber no que já está escrito.
      run: (e) =>
        void e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
    },

    // ─── Só com o cursor dentro de uma tabela ────────────────────────────────
    rowAfter: {
      icon: Rows3,
      run: (e) => void e.chain().focus().addRowAfter().run(),
    },
    columnAfter: {
      icon: Columns3,
      run: (e) => void e.chain().focus().addColumnAfter().run(),
    },
    deleteRow: {
      icon: Minus,
      run: (e) => void e.chain().focus().deleteRow().run(),
    },
    deleteColumn: {
      icon: Minus,
      run: (e) => void e.chain().focus().deleteColumn().run(),
    },
    headerRow: {
      icon: PanelTop,
      run: (e) => void e.chain().focus().toggleHeaderRow().run(),
    },
    deleteTable: {
      icon: Trash2,
      run: (e) => void e.chain().focus().deleteTable().run(),
    },

    // As três que não agem sozinhas: abrem uma linha, ou um seletor de arquivo,
    // e esperam. `run` fica de fora porque a ação depende do resolvedor de
    // imagem que quem consome escolheu, ou do texto da linha.
    link: { icon: LinkIcon, isOn: (e) => e.isActive('link') },
    image: { icon: ImageIcon },
    imageAlt: { icon: Captions },

    // ─── Tamanho da imagem, pelo teclado ─────────────────────────────────────
    //
    // A alça de arrastar sozinha reprovaria em WCAG 2.5.7 (Movimentos de
    // arrasto): toda ação de arrastar precisa de um caminho por ponteiro único.
    // Estes três botões SÃO esse caminho, e de quebra são o único jeito de
    // redimensionar sem mouse.
    imageSmaller: {
      icon: Shrink,
      run: (e) => adjustWidth(e, -WIDTH_STEP),
      can: (e) => currentWidth(e) > MIN_WIDTH,
    },
    imageLarger: {
      icon: Expand,
      run: (e) => adjustWidth(e, WIDTH_STEP),
    },
    imageNatural: {
      icon: RotateCcw,
      // Volta ao tamanho natural APAGANDO o atributo, e não gravando a medida
      // original: gravada, ela congelaria a imagem no tamanho de HOJE, e a folha
      // deixaria de poder encolhê-la numa moldura estreita.
      run: (e) => void e.chain().focus().updateAttributes('image', { width: null }).run(),
      can: (e) => e.getAttributes('image').width != null,
    },
    formula: { icon: Sigma },
  };

  /** As ações que vivem dentro de um grupo — as únicas com estado alternado. */
  const TOGGLE_ACTIONS = Object.keys(ACTIONS).filter(
    (a) => ACTIONS[a as EditorAction].isOn !== undefined,
  ) as EditorAction[];

  // ─── Composição da barra ───────────────────────────────────────────────────

  type ContextNode = 'image' | 'table';

  type Block =
    | { group: EditorGroup; type: 'single' | 'multiple'; actions: EditorAction[] }
    | {
        buttons: EditorAction[];
        /**
         * Botões que só aparecem com um nó sob o cursor, DENTRO deste mesmo
         * bloco.
         *
         * Ficam no mesmo bloco de propósito: inserir imagem e editar imagem são
         * o mesmo assunto, e separá-los deixava "excluir linha" e "desfazer" no
         * meio do caminho. Como a caixa contextual não traz separador próprio, o
         * bloco continua sendo UM bloco — com ou sem os botões extras.
         */
        contextual?: { node: ContextNode; buttons: EditorAction[] };
      };

  /**
   * O que cada conjunto mostra.
   *
   * `single` onde as opções se excluem — um parágrafo é H1 OU H2, e está numa
   * lista com marcador OU numerada. `multiple` onde acumulam: negrito E itálico
   * no mesmo trecho, citação contendo bloco de código. Quem impõe a exclusão é o
   * documento: a barra só reflete o que ele responde.
   */
  const PRESETS: Record<EditorPreset, Block[]> = {
    basic: [
      { group: 'marks', type: 'multiple', actions: ['bold', 'italic', 'strike'] },
      { group: 'lists', type: 'single', actions: ['bulletList', 'orderedList'] },
      { buttons: ['link', 'undo', 'redo'] },
    ],
    advanced: [
      {
        group: 'marks',
        type: 'multiple',
        actions: ['bold', 'italic', 'underline', 'strike', 'code', 'highlight'],
      },
      { group: 'headings', type: 'single', actions: ['h1', 'h2', 'h3'] },
      {
        group: 'align',
        type: 'single',
        actions: ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify'],
      },
      { group: 'lists', type: 'single', actions: ['bulletList', 'orderedList', 'taskList'] },
      { group: 'blocks', type: 'multiple', actions: ['blockquote', 'codeBlock'] },
      // Um bloco por ASSUNTO. Inserir e editar imagem andam juntos, e o mesmo
      // vale para a tabela: antes, "linha divisória", "desfazer" e o próprio
      // botão de tabela caíam ENTRE o de inserir imagem e os de editá-la.
      { buttons: ['link', 'horizontalRule', 'undo', 'redo'] },
      {
        buttons: ['image'],
        contextual: {
          node: 'image',
          buttons: ['imageAlt', 'imageSmaller', 'imageLarger', 'imageNatural'],
        },
      },
      // Os seis da tabela só existem dentro de uma: barra com seis botões
      // inertes é ruído permanente para uma capacidade que a maioria dos
      // documentos nunca usa.
      {
        buttons: ['table'],
        contextual: {
          node: 'table',
          buttons: [
            'rowAfter',
            'columnAfter',
            'deleteRow',
            'deleteColumn',
            'headerRow',
            'deleteTable',
          ],
        },
      },
    ],
  };

  /** Linhas de entrada, e o botão que abre cada uma. */
  type RowName = 'formula' | 'link' | 'alt';

  const ROW_OF: Partial<Record<EditorAction, RowName>> = {
    formula: 'formula',
    link: 'link',
    imageAlt: 'alt',
  };

  /**
   * Imagem com largura ajustável.
   *
   * A largura vai no ATRIBUTO `width` do `<img>`, e não em `style`. É HTML
   * válido, sobrevive a qualquer sanitização razoável do lado de quem grava, e
   * continua submetido ao `max-width: 100%` da folha — imagem larga demais
   * encolhe na moldura estreita em vez de vazar.
   */
  const ResizableImage = Image.extend({
    addAttributes() {
      return {
        ...this.parent?.(),
        width: {
          default: null,
          parseHTML: (el) => {
            const raw = (el as HTMLElement).getAttribute('width');
            const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
            return Number.isFinite(n) ? n : null;
          },
          renderHTML: (attributes) =>
            attributes.width ? { width: String(attributes.width) } : {},
        },
      };
    },

    addNodeView() {
      return ({ node, editor, getPos }) => {
        const dom = document.createElement('div');
        dom.className = 'nds-editor-image';

        const img = document.createElement('img');
        const handle = document.createElement('span');
        handle.className = 'nds-editor-image-handle';
        // A alça é decoração de ponteiro: quem navega por teclado usa os botões
        // da barra, que é o caminho exigido pelo critério de arrasto (WCAG
        // 2.5.7). Por ser decoração, o `aria-hidden` vale para a alça INTEIRA —
        // o ícone dentro dela não precisa do seu.
        handle.setAttribute('aria-hidden', 'true');
        handle.appendChild(iconSvg(ArrowDownRightFromSquare as unknown as LucideIconNode[]));
        dom.append(img, handle);

        const paint = (n: typeof node): void => {
          img.src = n.attrs.src as string;
          img.alt = (n.attrs.alt as string | null) ?? '';
          if (n.attrs.width) img.setAttribute('width', String(n.attrs.width));
          else img.removeAttribute('width');
        };
        paint(node);

        handle.addEventListener('pointerdown', (event) => {
          // `preventDefault` mata o arrasto NATIVO do nó: `draggable: true` está
          // no próprio nó de imagem, e sem isto puxar a alça arrastaria a imagem
          // para outro ponto do documento em vez de redimensioná-la.
          event.preventDefault();
          const startX = event.clientX;
          const startWidth = img.getBoundingClientRect().width;
          handle.setPointerCapture(event.pointerId);

          const onDrag = (e: PointerEvent): void => {
            const nextWidth = Math.max(MIN_WIDTH, Math.round(startWidth + (e.clientX - startX)));
            // Durante o arrasto só o DOM muda. Gravar no documento a cada quadro
            // encheria o histórico de passos intermediários, e desfazer teria de
            // ser apertado dezenas de vezes para voltar ao tamanho anterior.
            img.setAttribute('width', String(nextWidth));
          };

          const onDrop = (): void => {
            handle.removeEventListener('pointermove', onDrag);
            handle.removeEventListener('pointerup', onDrop);
            handle.removeEventListener('pointercancel', onDrop);
            const position = typeof getPos === 'function' ? getPos() : undefined;
            const width = Number.parseInt(img.getAttribute('width') ?? '', 10);
            if (position === undefined || !Number.isFinite(width)) return;
            editor.view.dispatch(editor.state.tr.setNodeAttribute(position, 'width', width));
          };

          handle.addEventListener('pointermove', onDrag);
          handle.addEventListener('pointerup', onDrop);
          handle.addEventListener('pointercancel', onDrop);
        });

        return {
          dom,
          update: (nextNode) => {
            if (nextNode.type.name !== 'image') return false;
            paint(nextNode);
            return true;
          },
          // O `width` que o arrasto escreve no `<img>` é mutação de DOM que a
          // lib não provocou. Sem isto ela conclui que o nodeView saiu de
          // sincronia e o remonta no meio do arrasto.
          ignoreMutation: () => true,
        };
      };
    },
  });
</script>

<script lang="ts">
  import { tick, untrack } from 'svelte';
  import { Editor as TiptapEditor } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { Mathematics } from '@tiptap/extension-mathematics';
  import { TaskList } from '@tiptap/extension-task-list';
  import { TaskItem } from '@tiptap/extension-task-item';
  import { TableKit } from '@tiptap/extension-table';
  import { Highlight } from '@tiptap/extension-highlight';
  import { TextAlign } from '@tiptap/extension-text-align';
  import DOMPurify from 'dompurify';

  import { Button } from '@/components/ui/button';
  import { Input } from '@/components/ui/input';
  import { Toggle } from '@/components/ui/toggle';
  import { cn } from '@/lib/utils';

  const uid = $props.id();

  let {
    content,
    editable = true,
    preset = 'advanced',
    labels,
    resolveImage,
    describeImage,
    onchange,
    class: className,
  }: EditorProps = $props();

  let rootEl = $state<HTMLDivElement | null>(null);
  let toolbarEl = $state<HTMLDivElement | null>(null);
  let contentEl = $state<HTMLDivElement | null>(null);

  /**
   * Identidade nova a cada transação — é o que faz os derivados recalcularem.
   *
   * A instância da lib não é reativa: `isActive` responde a partir do estado
   * interno dela, e nada avisa o compilador. O objeto trocado a cada transação é
   * o aviso, e por isso os derivados leem `live?.editor` e não a variável solta.
   */
  let live = $state<{ editor: Editor } | null>(null);

  /**
   * Estado alternado de cada botão de grupo.
   *
   * `$state` e não `$derived` de propósito: o alternador da lib vira o PRÓPRIO
   * estado no clique, e um derivado só voltaria a empurrar o valor quando ele
   * mudasse — com o editor em leitura, o comando é no-op, o valor não muda e o
   * botão ficaria aceso mentindo sobre o documento. Escrevendo num `$state`
   * ligado por `bind:`, a correção sempre chega.
   */
  // Todas as chaves nascem em `false`: `bind:` recusa valor indefinido num prop
  // com padrão, e a primeira renderização acontece antes de o editor existir.
  let pressed = $state<Record<EditorAction, boolean>>(
    Object.fromEntries(TOGGLE_ACTIONS.map((a) => [a, false])) as Record<EditorAction, boolean>,
  );

  /** Qual linha de entrada está aberta. As três ocupam o mesmo lugar. */
  let openRowName = $state<RowName | null>(null);
  let fieldValue = $state('');
  let linkInvalid = $state(false);

  let formulaInput = $state<HTMLInputElement | null>(null);
  let linkInput = $state<HTMLInputElement | null>(null);
  let altInput = $state<HTMLInputElement | null>(null);

  const rowIds: Record<RowName, string> = {
    formula: `nds-editor-formula-${uid}`,
    link: `nds-editor-link-${uid}`,
    alt: `nds-editor-alt-${uid}`,
  };

  /** Instância corrente, para os caminhos imperativos (cliques, arrasto, API). */
  let instance: Editor | null = null;

  const blocks = $derived<Block[]>([
    ...PRESETS[preset],
    { buttons: ['formula'] as EditorAction[] },
  ]);

  // Objeto simples, e não `Set`: quem reage é o derivado, e a coleção é só o
  // resultado dele. Um conjunto reativo aqui seria um segundo mecanismo de
  // reatividade sobre o mesmo valor.
  const disabledActions = $derived.by(() => {
    const e = live?.editor;
    const off: Partial<Record<EditorAction, boolean>> = {};
    if (!e) return off;
    for (const key of Object.keys(ACTIONS) as EditorAction[]) {
      const can = ACTIONS[key].can;
      if (can && !can(e)) off[key] = true;
    }
    return off;
  });

  const contextOpen = $derived.by(() => {
    const e = live?.editor;
    return { image: !!e?.isActive('image'), table: !!e?.isActive('table') };
  });

  const linkActive = $derived(!!live?.editor.isActive('link'));

  // ─── Ciclo de vida da lib ──────────────────────────────────────────────────
  //
  // Depende do nó de montagem e do conteúdo INICIAL, e de mais nada: trocar o
  // conjunto de botões remonta a barra, não o documento, e trocar rótulo não
  // remonta coisa nenhuma. `content` é prop de montagem — mudá-la refaz a
  // instância, que é o que o control do Storybook precisa para valer.
  $effect(() => {
    const host = contentEl;
    const initial = content;
    if (!host) return;

    const editor = untrack(() =>
      buildEditor(host, initial, editable, labels.editorField),
    );
    instance = editor;
    live = { editor };
    syncToggles(editor);

    const root = untrack(() => rootEl) as EditorRootElement | null;
    if (root) {
      root.editor = editor;
      root.insertImage = insertImageFile;
    }

    return () => {
      editor.destroy();
      instance = null;
      live = null;
    };
  });

  // `setEditable` não emite transação, então a barra precisa ser avisada à mão.
  $effect(() => {
    const wanted = editable;
    const editor = live?.editor;
    if (!editor || editor.isEditable === wanted) return;
    editor.setEditable(wanted);
    live = { editor };
    syncToggles(editor);
  });

  // Roving inicial: uma parada de tabulação só, na primeira ação disponível. Lê
  // `blocks` para refazer a conta quando o conjunto de botões muda.
  $effect(() => {
    if (!toolbarEl || blocks.length === 0) return;
    const first = focusables()[0];
    if (first) setRoving(first);
  });

  function buildEditor(
    host: HTMLElement,
    initial: string | undefined,
    startEditable: boolean,
    fieldName: string,
  ): Editor {
    const editor = new TiptapEditor({
      element: host,
      editable: startEditable,
      extensions: [
        StarterKit.configure({
          link: {
            isAllowedUri: (url) => isAllowedLink(url),
            openOnClick: false,
          },
        }),
        Mathematics,
        TaskList,
        // Lista de tarefas dentro de lista de tarefas: é como se escreve
        // subitem, e sem isto o Enter no meio de um item cria irmão, não filho.
        TaskItem.configure({ nested: true }),
        TableKit.configure({ table: { resizable: true } }),
        // `allowBase64` é FALSE por padrão, e sem ele a imagem embutida some na
        // releitura do documento: o esquema descarta o `src` que não reconhece.
        ResizableImage.configure({ allowBase64: true }),
        Highlight,
        // `types` diz em QUE nós o atributo pode pousar. Sem parágrafo e título
        // na lista, os botões de alinhamento não fazem nada — e nada na tela
        // explica por quê.
        TextAlign.configure({ types: ['heading', 'paragraph'] }),
      ],
      editorProps: {
        // O caminho suportado para escrever atributo no elemento editável: a lib
        // recria esse nó, e `setAttribute` de fora seria desfeito.
        attributes: { 'aria-label': fieldName },

        // Colar e ARRASTAR arquivo de imagem passam pelo mesmo caminho do botão
        // — mesmo `resolveImage`, mesma descrição, mesmo `alt`. Sem isto, colar
        // arquivo não faz nada e arrastar também não, e quem usa não sabe que
        // existe um botão para o que o resto da web resolve arrastando.
        handlePaste: (_view, event) => {
          const files = imageFilesOf(event.clipboardData);
          if (files.length === 0) return false;
          for (const file of files) void insertImageFile(file);
          return true;
        },

        handleDrop: (view, event, _slice, moved) => {
          // `moved` é arrasto INTERNO — alguém remanejando o que já está no
          // documento. Interceptar isso apagaria o recurso de reordenar.
          if (moved) return false;
          const files = imageFilesOf((event as DragEvent).dataTransfer);
          if (files.length === 0) return false;
          // A imagem entra ONDE se soltou, não onde o cursor estava.
          const dropTarget = view.posAtCoords({
            left: (event as DragEvent).clientX,
            top: (event as DragEvent).clientY,
          });
          if (dropTarget) editor.commands.setTextSelection(dropTarget.pos);
          for (const file of files) void insertImageFile(file);
          return true;
        },
      },
      content: initial ? DOMPurify.sanitize(initial) : undefined,
    });

    // `transaction` cobre o que `update` não cobre: mover o cursor não muda o
    // documento, mas muda a marca ativa. Ligar só em `update` deixava o botão
    // aceso depois de sair de um trecho em negrito.
    editor.on('transaction', () => {
      live = { editor };
      syncToggles(editor);
    });
    // Imagem colada entra por fora da fábrica, então a varredura é o que a
    // alcança. `update` e não `transaction`: só mudança de DOCUMENTO traz imagem
    // nova.
    editor.on('update', () => {
      describePending(editor);
      onchange?.(editor.getHTML());
    });

    return editor;
  }

  function syncToggles(editor: Editor): void {
    for (const action of TOGGLE_ACTIONS) {
      pressed[action] = !!ACTIONS[action].isOn?.(editor);
    }
  }

  // ─── Cliques da barra ──────────────────────────────────────────────────────

  /**
   * Com a edição desligada, a barra DEIXA DE AGIR.
   *
   * A guarda é aqui, e não na lib: `editor.commands` continua funcionando num
   * editor em leitura — `editable` vale para o que o teclado e o ponteiro fazem
   * no campo, não para comando disparado por código. Medido: clicar em negrito
   * numa demonstração somente-leitura ligava a marca guardada, o botão acendia,
   * e o HTML nem mudava — o defeito ficava invisível para quem só olha o texto.
   */
  const acts = $derived(editable);

  function runToggle(action: EditorAction): void {
    const editor = instance;
    if (!editor || !acts) return;
    ACTIONS[action].run?.(editor);
  }

  /**
   * O alternador vira o PRÓPRIO estado no clique, e quem manda aqui é o
   * documento: esta é a correção, e ela chega logo depois da escrita da lib.
   *
   * Não é `queueMicrotask`: o navegador esvazia a fila de microtarefas ENTRE dois
   * ouvintes do mesmo evento, então a correção chegaria antes da escrita e o
   * botão ficaria aceso. Medido — com o editor em leitura o comando é no-op, o
   * documento não muda, e o botão passava a mentir sobre ele.
   */
  function onTogglePressed(): void {
    if (instance) syncToggles(instance);
  }

  function runPlain(action: EditorAction): void {
    const editor = instance;
    if (!editor || !acts) return;
    const row = ROW_OF[action];
    if (row) {
      void openRow(openRowName === row ? null : row);
      return;
    }
    if (action === 'image') {
      pickImage();
      return;
    }
    ACTIONS[action].run?.(editor);
  }

  function pickImage(): void {
    // O seletor é criado a cada clique e descartado depois: um input guardado
    // entre usos mantém o arquivo anterior, e escolher o MESMO arquivo duas
    // vezes seguidas não dispara `change`.
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.addEventListener('change', () => {
      const file = picker.files?.[0];
      if (file) void insertImageFile(file);
    });
    picker.click();
  }

  // ─── Linhas de entrada ─────────────────────────────────────────────────────

  function inputOf(row: RowName): HTMLInputElement | null {
    if (row === 'formula') return formulaInput;
    if (row === 'link') return linkInput;
    return altInput;
  }

  /**
   * O que o campo mostra ao abrir.
   *
   * É o que torna a linha EDITÁVEL e não só um formulário de inserção: com o
   * cursor dentro de um link, abrir mostra o endereço atual — dá para corrigir,
   * e dá para apagar o texto e confirmar, que é como se tira o link.
   */
  function valueOnOpen(row: RowName): string {
    const editor = instance;
    if (!editor) return '';
    if (row === 'formula') {
      return editor.isActive('inlineMath')
        ? ((editor.getAttributes('inlineMath').latex as string | undefined) ?? '')
        : '';
    }
    if (row === 'link') return (editor.getAttributes('link').href as string | undefined) ?? '';
    return (editor.getAttributes('image').alt as string | undefined) ?? '';
  }

  async function openRow(row: RowName | null): Promise<void> {
    openRowName = row;
    linkInvalid = false;
    if (!row) return;
    // O campo é remontado a cada abertura, e não guardado entre uma e outra:
    // texto abandonado por Escape reapareceria na abertura seguinte, aplicado a
    // outro trecho do documento.
    fieldValue = valueOnOpen(row);
    await tick();
    const field = inputOf(row);
    field?.focus();
    field?.select();
  }

  function focusAction(action: EditorAction): void {
    toolbarEl?.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)?.focus();
  }

  function confirmRow(): void {
    if (openRowName === 'formula') insertFormula();
    else if (openRowName === 'link') applyLink();
    else if (openRowName === 'alt') applyAlt();
  }

  function insertFormula(): void {
    const editor = instance;
    if (!editor) return;
    const latex = fieldValue.trim();
    if (!latex) return;
    // `insertInlineMath` guarda o LaTeX num atributo do nó e deixa o KaTeX
    // renderizar. O texto nunca vira HTML: não há caminho de injeção por aqui, e
    // fórmula inválida cai no ramo de erro da própria lib.
    //
    // SEM `.focus()` na corrente, ao contrário dos botões de marca: o comando de
    // foco da lib chega depois do fim desta função e tomaria de volta o foco que
    // acabamos de devolver ao botão.
    //
    // Fórmula sob o cursor se ATUALIZA; fora dela, insere. Sem esta distinção,
    // corrigir uma fórmula criava uma segunda ao lado da errada.
    if (editor.isActive('inlineMath')) {
      editor.chain().updateInlineMath({ latex }).run();
    } else {
      editor.chain().insertInlineMath({ latex }).run();
    }
    void openRow(null);
    focusAction('formula');
  }

  function applyLink(): void {
    const editor = instance;
    if (!editor) return;
    const raw = fieldValue.trim();
    // Campo vazio TIRA o link do trecho — é o caminho de desfazer, e não há
    // botão separado para ele.
    if (!raw) {
      editor.chain().extendMarkRange('link').unsetLink().run();
    } else {
      // Endereço sem esquema é o que a pessoa digita: `exemplo.com`. Completar
      // com `https://` antes de validar evita reprovar o caso comum.
      const url = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
      if (!isAllowedLink(url)) {
        linkInvalid = true;
        return;
      }
      linkInvalid = false;
      editor.chain().extendMarkRange('link').setLink({ href: url }).run();
    }
    void openRow(null);
    focusAction('link');
  }

  function applyAlt(): void {
    const editor = instance;
    if (!editor) return;
    // Aqui `updateAttributes` é o certo, ao contrário do caminho da descrição
    // automática: a imagem está selecionada AGORA, é ela que se edita, e o texto
    // é de quem está olhando para ela.
    editor.chain().focus().updateAttributes('image', { alt: fieldValue.trim() }).run();
    void openRow(null);
    focusAction('imageAlt');
  }

  function removeLink(): void {
    const editor = instance;
    if (!editor) return;
    // `extendMarkRange` primeiro: o cursor costuma estar NO MEIO do link, e sem
    // estender o trecho a marca sairia só do pedaço sob o cursor — partindo o
    // link em dois em vez de removê-lo.
    editor.chain().extendMarkRange('link').unsetLink().run();
    void openRow(null);
    focusAction('link');
  }

  function onFieldKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      confirmRow();
    } else if (event.key === 'Escape') {
      const opened = openRowName;
      void openRow(null);
      if (opened === 'formula') focusAction('formula');
      else if (opened === 'link') focusAction('link');
      else if (opened === 'alt') focusAction('imageAlt');
    }
  }

  // ─── Imagem ────────────────────────────────────────────────────────────────

  /**
   * Escreve o `alt` da imagem de um `src` conhecido, onde quer que ela esteja.
   *
   * Não usa `updateAttributes`, que age sobre a SELEÇÃO: quando a descrição
   * chega, segundos depois, o cursor já andou — e o atributo iria parar em outra
   * imagem, ou em lugar nenhum. Aqui a imagem é reencontrada pelo `src`.
   */
  function setAltBySrc(editor: Editor, src: string, alt: string): void {
    const { state } = editor;
    let position = -1;
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.src === src) position = pos;
    });
    if (position < 0) return;
    editor.view.dispatch(state.tr.setNodeAttribute(position, 'alt', alt));
  }

  /**
   * Cache de descrição por `src`, guardando a PROMESSA e não "já tentei".
   *
   * A diferença aparece na mesma imagem inserida duas vezes: com um conjunto de
   * "já tentadas", a segunda ficava para sempre com o `alt` provisório, porque o
   * pedido fora feito e o resultado tinha ido para a primeira. Guardando a
   * promessa, a segunda cópia recebe a MESMA descrição sem um segundo pedido.
   */
  //
  // Objeto simples, e não `Map` reativo: este cache existe para NÃO provocar
  // renderização. Quem avisa a barra é a transação que escreve o `alt`.
  const descriptions: Record<string, Promise<string | null>> = Object.create(null);

  function describe(editor: Editor, file: File | null, src: string): void {
    const service = describeImage;
    if (!service) return;
    let request = descriptions[src];
    if (!request) {
      // A falha vira `null` aqui, e não uma promessa rejeitada: quem descreve
      // não derruba a edição, e a imagem segue com o `alt` provisório e o botão
      // de texto alternativo à mão.
      request = service(file, src).catch(() => null);
      descriptions[src] = request;
    }
    void request.then((description) => {
      if (description && instance === editor) setAltBySrc(editor, src, description);
    });
  }

  /**
   * Imagens já COM `src` e sem descrição — as que chegaram por colagem.
   *
   * Colar uma imagem de outra página insere `<img src>` sem `alt` nenhum, por um
   * caminho que não passa pela inserção daqui: quem monta o nó é o próprio
   * ProseMirror, a partir do HTML da área de transferência.
   */
  function describePending(editor: Editor): void {
    if (!describeImage) return;
    const pending: string[] = [];
    editor.state.doc.descendants((node) => {
      const { src, alt } = node.attrs as { src?: string; alt?: string };
      // A consulta ao cache corta a reentrada: escrever o `alt` dispara outra
      // atualização, e uma recusa não pode virar pedido a cada tecla digitada.
      if (node.type.name === 'image' && src && !alt && descriptions[src] === undefined) pending.push(src);
    });
    // Sem arquivo: a imagem colada de outra página tem endereço e nada mais.
    for (const src of pending) describe(editor, null, src);
  }

  export async function insertImage(file: File): Promise<boolean> {
    return insertImageFile(file);
  }

  async function insertImageFile(file: File): Promise<boolean> {
    const editor = instance;
    if (!editor) return false;
    const src = await (resolveImage ?? imageAsDataUrl)(file);
    // `null` é recusa de quem consome — envio negado, arquivo grande demais,
    // formato fora da política. Não é erro, e não vira alerta.
    if (!src) return false;

    // O `alt` provisório é o nome do arquivo: descreve o arquivo, não a imagem.
    // É o que segura a vaga até a descrição chegar — e o que fica se ela não
    // vier. Imagem sem `alt` nenhum reprovaria no axe.
    editor.chain().focus().setImage({ src, alt: file.name }).run();
    describe(editor, file, src);
    return true;
  }

  // ─── Arrastar para QUALQUER lugar da moldura ───────────────────────────────
  //
  // O `dragover` que a lib previne cobre só o elemento editável, e ele tem a
  // altura do TEXTO — o respiro abaixo da última linha, a barra e a borda são
  // moldura, não campo. Soltar ali escapava do editor e o navegador abria o
  // arquivo numa aba nova.
  //
  // Durante o arrasto o navegador esconde os arquivos por segurança:
  // `dataTransfer.files` vem VAZIO no `dragover`, e só em `drop` é que aparece.
  // Por isso a pergunta aqui é por `types`, e não pela lista.
  function isFileDrag(dt: DataTransfer | null): boolean {
    return !!dt && Array.from(dt.types).includes('Files');
  }

  function onFrameDragOver(event: DragEvent): void {
    if (isFileDrag(event.dataTransfer)) event.preventDefault();
  }

  function onFrameDrop(event: DragEvent): void {
    // Solto DENTRO do editável, quem já tratou foi a lib, pelo `handleDrop` —
    // ela previne o padrão, e é essa marca que evita inserir duas vezes.
    if (event.defaultPrevented) return;
    const files = imageFilesOf(event.dataTransfer);
    if (files.length === 0) return;
    event.preventDefault();
    // Solto fora do texto, a imagem vai para o fim do documento — é o lugar mais
    // próximo do que se apontou, e o único definido.
    instance?.commands.focus('end');
    for (const file of files) void insertImageFile(file);
  }

  // ─── Navegação por seta na barra ───────────────────────────────────────────
  //
  // `role="toolbar"` promete uma parada de tabulação só, com as setas andando
  // dentro — inclusive atravessando os grupos, que abriram mão do teclado
  // justamente para isto. Sem a navegação, a barra promete um contrato que não
  // cumpre, e o leitor de tela anuncia o papel de qualquer jeito.
  function focusables(): HTMLButtonElement[] {
    if (!toolbarEl) return [];
    return Array.from(toolbarEl.querySelectorAll<HTMLButtonElement>('button')).filter(
      // `offsetParent` nulo cobre o botão escondido E o bloco contextual fechado
      // em volta dele — perguntar só pelo `hidden` do próprio botão deixaria as
      // setas pousarem nos seis botões de tabela fora da tabela.
      (b) => !b.disabled && b.offsetParent !== null,
    );
  }

  function setRoving(target: HTMLButtonElement): void {
    if (!toolbarEl) return;
    for (const b of toolbarEl.querySelectorAll<HTMLButtonElement>('button')) {
      b.tabIndex = b === target ? 0 : -1;
    }
  }

  function onToolbarKeydown(event: KeyboardEvent): void {
    const list = focusables();
    const current = list.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;
    let next: number;
    if (event.key === 'ArrowRight') next = (current + 1) % list.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + list.length) % list.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = list.length - 1;
    else return;
    event.preventDefault();
    setRoving(list[next]);
    list[next].focus();
  }

  // Clicar passa a ordem de tabulação para quem foi usado — senão o Tab
  // devolveria o foco a um botão diferente do último tocado.
  function onToolbarClick(event: MouseEvent): void {
    const btn = (event.target as HTMLElement).closest('button');
    if (btn && !(btn as HTMLButtonElement).disabled) setRoving(btn as HTMLButtonElement);
  }

  function isExpanded(action: EditorAction): 'true' | 'false' | undefined {
    const row = ROW_OF[action];
    if (!row) return undefined;
    return openRowName === row ? 'true' : 'false';
  }

  function controlledRow(action: EditorAction): string | undefined {
    const row = ROW_OF[action];
    return row ? rowIds[row] : undefined;
  }
</script>

<!--
  A moldura não é controle: quem recebe o arquivo é a área editável, e ela já
  tem papel de campo de texto. A moldura só cancela o padrão do navegador no
  respiro fora do texto — dar um papel a ela inventaria um segundo controle onde
  há um só.
-->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div
  bind:this={rootEl}
  data-slot="editor"
  class={cn('nds-editor', className)}
  ondragenter={onFrameDragOver}
  ondragover={onFrameDragOver}
  ondrop={onFrameDrop}
>
  <!--
    A barra não recebe foco: quem recebe são os botões, por roving tabindex, que
    é o que o padrão da barra de ferramentas pede. `tabindex` na barra criaria
    uma parada a mais, exatamente a que o papel promete não existir.
  -->
  <!-- svelte-ignore a11y_interactive_supports_focus -->
  <div
    bind:this={toolbarEl}
    data-slot="editor-toolbar"
    class="nds-editor-toolbar"
    role="toolbar"
    aria-label={labels.toolbar}
    onkeydown={onToolbarKeydown}
    onclick={onToolbarClick}
  >
    {#each blocks as block, i (i)}
      {#if i > 0}
        <!-- Decorativo: quem ouve recebe a divisão pelo nome de cada bloco. -->
        <span class="nds-editor-toolbar-separator" aria-hidden="true"></span>
      {/if}

      {#if 'group' in block}
        <!--
          `role="group"` porque o bloco está ANINHADO nesta barra, ao lado de
          botões que não alternam: `toolbar` dentro de `toolbar` seriam duas
          navegações por seta disputando o mesmo Tab, e quem navega ficaria preso
          no primeiro bloco sem alcançar o resto.
        -->
        <div
          class="nds-toggle-group"
          data-slot="toggle-group"
          data-orientation="horizontal"
          role="group"
          aria-label={labels.groups[block.group]}
        >
          {#each block.actions as action (action)}
            {@const Icon = ACTIONS[action].icon}
            <Toggle
              bind:pressed={pressed[action]}
              onPressedChange={onTogglePressed}
              data-value={action}
              aria-label={labels.actions[action]}
              onclick={() => runToggle(action)}
            >
              <Icon aria-hidden="true" />
            </Toggle>
          {/each}
        </div>
      {:else}
        {#each block.buttons as action (action)}
          {@const Icon = ACTIONS[action].icon}
          <Button
            variant="ghost"
            size="icon-sm"
            data-action={action}
            data-state={ACTIONS[action].isOn
              ? pressed[action]
                ? 'on'
                : 'off'
              : undefined}
            aria-label={labels.actions[action]}
            aria-expanded={isExpanded(action)}
            aria-controls={controlledRow(action)}
            disabled={disabledActions[action] === true}
            onclick={() => runPlain(action)}
          >
            <Icon aria-hidden="true" />
          </Button>
        {/each}

        {#if block.contextual}
          <!--
            A caixa contextual entra no MESMO bloco, sem separador próprio: os
            botões extras pertencem ao assunto que o bloco já trata. Ela existe
            como caixa, e não como botões soltos com `hidden` cada um, para que
            aparecer e sumir seja um atributo só.
          -->
          <span
            data-slot="editor-toolbar-context"
            data-node={block.contextual.node}
            class="nds-editor-toolbar-context"
            hidden={!contextOpen[block.contextual.node]}
          >
            {#each block.contextual.buttons as action (action)}
              {@const Icon = ACTIONS[action].icon}
              <Button
                variant="ghost"
                size="icon-sm"
                data-action={action}
                aria-label={labels.actions[action]}
                aria-expanded={isExpanded(action)}
                aria-controls={controlledRow(action)}
                disabled={disabledActions[action] === true}
                onclick={() => runPlain(action)}
              >
                <Icon aria-hidden="true" />
              </Button>
            {/each}
          </span>
        {/if}
      {/if}
    {/each}
  </div>

  <!--
    A linha que pede um texto antes de agir. Fica na moldura, e não num diálogo,
    porque escrever fórmula ou endereço é edição de texto: um modal tiraria o
    texto de vista justamente enquanto se decide o que a fórmula diz.
  -->
  <div
    id={rowIds.formula}
    data-slot="editor-formula"
    class="nds-editor-field-row"
    hidden={openRowName !== 'formula'}
  >
    <Input
      bind:ref={formulaInput}
      bind:value={fieldValue}
      placeholder="\frac&#123;a&#125;&#123;b&#125;"
      aria-label={labels.fields.formula}
      onkeydown={onFieldKeydown}
    />
    <Button size="sm" onclick={confirmRow}>{labels.fields.formulaConfirm}</Button>
  </div>

  <div
    id={rowIds.link}
    data-slot="editor-link"
    class="nds-editor-field-row"
    hidden={openRowName !== 'link'}
  >
    <Input
      bind:ref={linkInput}
      bind:value={fieldValue}
      placeholder="https://exemplo.com"
      aria-label={labels.fields.link}
      aria-invalid={linkInvalid ? 'true' : undefined}
      onkeydown={onFieldKeydown}
    />
    <Button size="sm" onclick={confirmRow}>{labels.fields.linkConfirm}</Button>
    <!--
      Tirar o link só existe quando há link: botão que não faz nada é ruído, e
      desabilitado seria pior — anuncia uma ação e nega logo em seguida.
    -->
    <Button
      variant="ghost"
      size="icon-sm"
      data-action="unlink"
      aria-label={labels.fields.linkRemove}
      hidden={!linkActive}
      onclick={removeLink}
    >
      <Unlink aria-hidden="true" />
    </Button>
  </div>

  <!--
    A linha do texto alternativo — onde a proposta automática é conferida. Abre
    com o que a imagem tem hoje: o nome do arquivo enquanto a descrição não
    chegou, a descrição depois. Ver o texto é o que permite julgá-lo.
  -->
  <div
    id={rowIds.alt}
    data-slot="editor-alt"
    class="nds-editor-field-row"
    hidden={openRowName !== 'alt'}
  >
    <Input
      bind:ref={altInput}
      bind:value={fieldValue}
      placeholder={labels.fields.alt}
      aria-label={labels.fields.alt}
      onkeydown={onFieldKeydown}
    />
    <Button size="sm" onclick={confirmRow}>{labels.fields.altConfirm}</Button>
  </div>

  <div bind:this={contentEl} data-slot="editor-content" class="nds-editor-content"></div>
</div>
