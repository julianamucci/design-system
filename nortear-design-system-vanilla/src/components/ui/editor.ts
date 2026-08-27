// ─── Editor — protótipo Vanilla ──────────────────────────────────────────────
//
// Editor de texto rico sobre `@tiptap/core`. NÃO é um componente entregue: é a
// medição que decide se o Tiptap entra no design system, e o que ele custa.
//
// Por que Vanilla firstFocusable: `EditorOptions.element` do Tiptap aceita um
// `Element` qualquer, então o núcleo monta nas cinco stacks sem binding de
// framework — `@tiptap/react`, `@tiptap/vue-3` e afins são conveniência de
// ciclo de vida, não requisito. Provar isso na stack que não tem framework
// nenhum é o que sustenta a afirmação para as outras quatro.
//
// A BARRA É NOSSA. Nenhum dos pacotes `@tiptap/*` instalados traz botão, ícone
// ou barra — a lib é o motor do documento. O que ela presetea é CAPACIDADE: o
// `StarterKit` liga por padrão (opt-out) título, listas, citação, código, bloco
// de código, linha divisória, link, sublinhado e desfazer/refazer. Os conjuntos
// abaixo escolhem o que dessa capacidade já paga vira botão.
//
// A folha do KaTeX é importada AQUI, e não na `globals.css`, de propósito: são
// dezenas de kB de CSS mais os arquivos de fonte, e quem não usa o editor não
// deve pagar por eles. Importada no módulo, ela viaja no mesmo pedaço que o
// editor e some do pacote das páginas que não o carregam.

import { Editor } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import { Mathematics } from '@tiptap/extension-mathematics';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { TableKit } from '@tiptap/extension-table';
import { Image } from '@tiptap/extension-image';
import { Highlight } from '@tiptap/extension-highlight';
import { TextAlign } from '@tiptap/extension-text-align';
import DOMPurify from 'dompurify';
import {
  AlignCenter,
  ArrowDownRightFromSquare,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Captions,
  Expand,
  Code,
  Columns3,
  Highlighter,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  ListTodo,
  Minus,
  PanelTop,
  Quote,
  Redo2,
  RotateCcw,
  Rows3,
  Shrink,
  Sigma,
  SquareCode,
  Strikethrough,
  Table as TableIcon,
  Trash2,
  Underline,
  Undo2,
  Unlink,
} from 'lucide';
import 'katex/dist/katex.min.css';

import { cn } from '@/lib/utils';
import { createToggleGroup, type ToggleGroupElement } from './toggle-group';
import { createInput } from './input';
import { createButton } from './button';
import { tornarDestruivel, type DestroyableElement } from '@/lib/destroy';

type LucideIconNode = [string, Record<string, string>];

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
  // Só existe com uma imagem selecionada.
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
export type EditorGroup = 'marks' | 'headings' | 'align' | 'lists' | 'blocks' | 'actions' | 'table';

/**
 * Conjuntos de botões.
 *
 * `basic` cobre texto de formulário, comentário e descrição. `advanced`
 * acrescenta o que um editor de conteúdo longo pede — título, citação, código e
 * divisória. Os dois usam a MESMA lista de extensões: trocar de conjunto muda o
 * que aparece na barra, não o que o documento aceita, então texto colado com
 * título continua com título mesmo no conjunto básico.
 */
export type EditorPreset = 'basic' | 'advanced';

export type EditorLabels = {
  /** Nome acessível da barra inteira. */
  toolbar: string;
  /**
   * Nome acessível da ÁREA EDITÁVEL.
   *
   * A lib põe `role="textbox"` no elemento editável, e campo com papel de campo
   * e sem nome é violação de `aria-input-field-name` — o axe reprovou na
   * primeira rodada desta story. Não há rótulo visível a que apontar: a moldura
   * inteira é o campo.
   */
  editorField: string;
  /** Nome de cada bloco. Grupo sem nome é anunciado como "grupo" e mais nada. */
  groups: Record<EditorGroup, string>;
  /** Nome de cada botão. Todos são só de ícone — o rótulo é o nome acessível. */
  actions: Record<EditorAction, string>;
  /** As duas linhas que pedem texto antes de agir. */
  fields: {
    formula: string;
    formulaConfirm: string;
    link: string;
    linkConfirm: string;
    /**
     * Botão que TIRA o link do trecho.
     *
     * Aparece só quando há link sob o cursor. Apagar o campo e confirmar
     * continua tirando — mas esse caminho depende de a pessoa deduzir, e
     * quem não deduz não descobre que dá para remover.
     */
    linkRemove: string;
    /** Rótulo do campo de texto alternativo da imagem. */
    alt: string;
    altConfirm: string;
  };
};

export type EditorOptions = {
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
  /**
   * De onde sai o `src` da imagem — a decisão de ARMAZENAMENTO, que é de quem
   * consome o design system, não dele.
   *
   * Recebe o arquivo escolhido e devolve a URL a gravar no documento: envio a
   * um bucket, a um CDN, a uma rota da própria aplicação. Devolver `null`
   * cancela a inserção (envio recusado, arquivo grande demais, formato fora da
   * política).
   *
   * O padrão é `data:` em base64, que não depende de servidor nenhum e é o que
   * faz o Playground funcionar sozinho. NÃO é o padrão para produção: base64
   * infla o documento em cerca de um terço do tamanho do arquivo, e o conteúdo
   * inteiro passa a trafegar e a ser guardado junto do texto a cada gravação.
   */
  resolveImage?: (file: File) => Promise<string | null>;
  /**
   * Escreve o texto alternativo a partir da imagem — o lugar de ligar um modelo
   * de visão, uma API de descrição, um serviço próprio.
   *
   * Recebe o `src` já gravado no documento e o arquivo, QUANDO existe: imagem
   * colada de outra página chega só como endereço, sem bytes nenhum. Serviço
   * que precisa dos bytes devolve `null` nesse caso; serviço que aceita URL
   * descreve os dois casos com o mesmo código.
   *
   * Devolve a descrição, ou `null` para dizer "não consegui" — e aí o `alt`
   * continua como está.
   *
   * É chamado DEPOIS de inserir, nunca antes: descrever leva segundos e às
   * vezes falha, e prender a imagem esperando por isso trocaria uma lacuna de
   * acessibilidade por uma de responsividade. A imagem entra, a descrição
   * chega quando chegar.
   *
   * NÃO dispensa revisão. Descrição automática erra de formas que quem enxerga
   * a imagem percebe na hora, e por isso o botão de texto alternativo aparece
   * com a imagem selecionada — a IA propõe, a pessoa confere.
   */
  describeImage?: (file: File | null, src: string) => Promise<string | null>;
  /**
   * Disparado a cada mudança do DOCUMENTO, com o HTML atual.
   *
   * `update` e não `transaction`: mover o cursor gera transação e não muda o
   * conteúdo, e um formulário que gravasse a cada movimento de cursor
   * escreveria dezenas de versões idênticas.
   *
   * O HTML sai como a lib o serializa. Quem grava decide se sanitiza de novo do
   * seu lado — o esquema do ProseMirror já descarta o que não conhece, mas
   * confiar no formato de terceiro é decisão de quem persiste.
   */
  onChange?: (html: string) => void;
  labels: EditorLabels;
  class?: string;
};

/**
 * O resolvedor padrão: o próprio arquivo, embutido no documento.
 *
 * Serve para demonstrar e para prototipar. Ver a ressalva em `resolveImage`.
 */
export function imageAsDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const leitor = new FileReader();
    leitor.addEventListener('load', () => resolve(leitor.result as string));
    leitor.addEventListener('error', () => resolve(null));
    leitor.readAsDataURL(file);
  });
}

/**
 * A raiz devolvida carrega a instância da lib.
 *
 * Sem isso, story e teste só alcançariam o editor pelo DOM — e o estado que
 * importa (marca ativa, documento, transação) vive na instância, não no DOM.
 */
export type EditorRoot = DestroyableElement<HTMLDivElement> & {
  editor: Editor;
  /**
   * Insere um arquivo de imagem passando pelo `resolveImage` configurado.
   *
   * É o mesmo caminho do botão, exposto: colar e arrastar um arquivo para
   * dentro do editor vão querer exatamente isto, e é o que permite verificar a
   * costura de armazenamento sem abrir o seletor de arquivo do sistema.
   *
   * Devolve `false` quando o resolvedor recusa.
   */
  insertImage: (file: File) => Promise<boolean>;
  /**
   * Liga e desliga a edição depois de montado.
   *
   * `editable` é opção de montagem nas outras stacks porque lá o framework
   * reage à prop. Aqui não há prop: sem este método, trocar de estado exigia
   * refazer a fábrica — e refazer leva junto o documento.
   */
  setEditable: (value: boolean) => void;
  /**
   * Troca o conjunto de botões depois de montado.
   *
   * Refaz a BARRA, e só ela: o documento, o histórico e a instância da lib
   * seguem os mesmos.
   */
  setPreset: (preset: EditorPreset) => void;
};

// ─── Tabela de ações ─────────────────────────────────────────────────────────
//
// Uma linha por botão, e três perguntas que a barra faz ao editor: como se
// desenha, se está ligada, se ainda pode. Espalhar isso por `if` de montagem foi
// o que deixou `data-mark` e `data-value` divergirem na versão anterior.

type Action = {
  icon: LucideIconNode[];
  /** Ligada agora? Ausente = ação sem estado (divisória, desfazer). */
  isOn?: (e: Editor) => boolean;
  /** O que fazer no clique. Ausente = a ação abre uma linha de entrada. */
  run?: (e: Editor) => void;
  /** Ainda é possível? Ausente = sempre. */
  can?: (e: Editor) => boolean;
};

const asIcon = (n: unknown): LucideIconNode[] => n as LucideIconNode[];

/**
 * Largura da imagem selecionada, em pixels.
 *
 * O atributo quando existe; a medida na TELA quando não. A segunda leitura é o
 * que dá um ponto de partida ao firstFocusable clique — imagem recém-inserida não tem
 * `width` gravado, e um passo sobre `null` teria de inventar um número.
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

const ACTIONS: Record<EditorAction, Action> = {
  bold: {
    icon: asIcon(Bold),
    isOn: (e) => e.isActive('bold'),
    run: (e) => void e.chain().focus().toggleBold().run(),
  },
  italic: {
    icon: asIcon(Italic),
    isOn: (e) => e.isActive('italic'),
    run: (e) => void e.chain().focus().toggleItalic().run(),
  },
  underline: {
    icon: asIcon(Underline),
    isOn: (e) => e.isActive('underline'),
    run: (e) => void e.chain().focus().toggleUnderline().run(),
  },
  strike: {
    icon: asIcon(Strikethrough),
    isOn: (e) => e.isActive('strike'),
    run: (e) => void e.chain().focus().toggleStrike().run(),
  },
  code: {
    icon: asIcon(Code),
    isOn: (e) => e.isActive('code'),
    run: (e) => void e.chain().focus().toggleCode().run(),
  },
  highlight: {
    icon: asIcon(Highlighter),
    isOn: (e) => e.isActive('highlight'),
    run: (e) => void e.chain().focus().toggleHighlight().run(),
  },
  // Alinhamento é ATRIBUTO do bloco, não marca: por isso `isActive` recebe
  // `{ textAlign }` e não um nome de nó. O grupo é `single` — um parágrafo tem
  // um alinhamento só.
  alignLeft: {
    icon: asIcon(AlignLeft),
    isOn: (e) => e.isActive({ textAlign: 'left' }),
    run: (e) => void e.chain().focus().setTextAlign('left').run(),
  },
  alignCenter: {
    icon: asIcon(AlignCenter),
    isOn: (e) => e.isActive({ textAlign: 'center' }),
    run: (e) => void e.chain().focus().setTextAlign('center').run(),
  },
  alignRight: {
    icon: asIcon(AlignRight),
    isOn: (e) => e.isActive({ textAlign: 'right' }),
    run: (e) => void e.chain().focus().setTextAlign('right').run(),
  },
  alignJustify: {
    icon: asIcon(AlignJustify),
    isOn: (e) => e.isActive({ textAlign: 'justify' }),
    run: (e) => void e.chain().focus().setTextAlign('justify').run(),
  },
  h1: {
    icon: asIcon(Heading1),
    isOn: (e) => e.isActive('heading', { level: 1 }),
    run: (e) => void e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  h2: {
    icon: asIcon(Heading2),
    isOn: (e) => e.isActive('heading', { level: 2 }),
    run: (e) => void e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  h3: {
    icon: asIcon(Heading3),
    isOn: (e) => e.isActive('heading', { level: 3 }),
    run: (e) => void e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  bulletList: {
    icon: asIcon(List),
    isOn: (e) => e.isActive('bulletList'),
    run: (e) => void e.chain().focus().toggleBulletList().run(),
  },
  orderedList: {
    icon: asIcon(ListOrdered),
    isOn: (e) => e.isActive('orderedList'),
    run: (e) => void e.chain().focus().toggleOrderedList().run(),
  },
  taskList: {
    icon: asIcon(ListTodo),
    isOn: (e) => e.isActive('taskList'),
    run: (e) => void e.chain().focus().toggleTaskList().run(),
  },
  blockquote: {
    icon: asIcon(Quote),
    isOn: (e) => e.isActive('blockquote'),
    run: (e) => void e.chain().focus().toggleBlockquote().run(),
  },
  codeBlock: {
    icon: asIcon(SquareCode),
    isOn: (e) => e.isActive('codeBlock'),
    run: (e) => void e.chain().focus().toggleCodeBlock().run(),
  },
  horizontalRule: {
    icon: asIcon(Minus),
    run: (e) => void e.chain().focus().setHorizontalRule().run(),
  },
  undo: {
    icon: asIcon(Undo2),
    run: (e) => void e.chain().focus().undo().run(),
    can: (e) => e.can().undo(),
  },
  redo: {
    icon: asIcon(Redo2),
    run: (e) => void e.chain().focus().redo().run(),
    can: (e) => e.can().redo(),
  },
  table: {
    icon: asIcon(TableIcon),
    // 3×3 com cabeçalho: uma tabela de exemplo grande o bastante para mostrar
    // o que ela é, e pequena o bastante para caber no que já está escrito.
    run: (e) =>
      void e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },

  // ─── Só com o cursor dentro de uma tabela ───────────────────────────────────
  rowAfter: {
    icon: asIcon(Rows3),
    run: (e) => void e.chain().focus().addRowAfter().run(),
  },
  columnAfter: {
    icon: asIcon(Columns3),
    run: (e) => void e.chain().focus().addColumnAfter().run(),
  },
  deleteRow: {
    icon: asIcon(Minus),
    run: (e) => void e.chain().focus().deleteRow().run(),
  },
  deleteColumn: {
    icon: asIcon(Minus),
    run: (e) => void e.chain().focus().deleteColumn().run(),
  },
  headerRow: {
    icon: asIcon(PanelTop),
    run: (e) => void e.chain().focus().toggleHeaderRow().run(),
  },
  deleteTable: {
    icon: asIcon(Trash2),
    run: (e) => void e.chain().focus().deleteTable().run(),
  },

  // As três que não agem sozinhas: abrem uma linha, um seletor de arquivo, e
  // esperam. `executar` fica de fora porque a ação depende da fábrica — do
  // resolvedor de imagem que quem consome escolheu, ou do texto da linha.
  link: { icon: asIcon(LinkIcon), isOn: (e) => e.isActive('link') },
  image: { icon: asIcon(ImageIcon) },
  imageAlt: { icon: asIcon(Captions) },

  // ─── Tamanho da imagem, pelo teclado ────────────────────────────────────────
  //
  // A alça de arrastar sozinha reprovaria em WCAG 2.5.7 (Movimentos de
  // arrasto): toda ação de arrastar precisa de um caminho por ponteiro único.
  // Estes três botões SÃO esse caminho, e de quebra são o único jeito de
  // redimensionar sem mouse.
  //
  // O passo parte da largura RENDERIZADA quando ainda não há `width` gravado:
  // sem isso, a primeira diminuição saltaria de "o tamanho natural, que pode
  // ser 900px" para um valor arbitrário.
  imageSmaller: {
    icon: asIcon(Shrink),
    run: (e) => adjustWidth(e, -WIDTH_STEP),
    can: (e) => currentWidth(e) > MIN_WIDTH,
  },
  imageLarger: {
    icon: asIcon(Expand),
    run: (e) => adjustWidth(e, WIDTH_STEP),
  },
  imageNatural: {
    icon: asIcon(RotateCcw),
    // Volta ao tamanho natural apagando o atributo, e não gravando a medida
    // original: gravada, ela congelaria a imagem no tamanho de HOJE, e a folha
    // deixaria de poder encolhê-la numa moldura estreita.
    run: (e) => void e.chain().focus().updateAttributes('image', { width: null }).run(),
    can: (e) => e.getAttributes('image').width != null,
  },
  formula: { icon: asIcon(Sigma) },
};

// ─── Composição da barra ─────────────────────────────────────────────────────

type Block =
  | { group: EditorGroup; type: 'single' | 'multiple'; actions: EditorAction[] }
  | {
      buttons: EditorAction[];
      /**
       * Botões que só aparecem com um nó sob o cursor, DENTRO deste mesmo
       * bloco.
       *
       * Ficam no mesmo bloco de propósito: inserir imagem e editar imagem são o
       * mesmo assunto, e separá-los deixava "excluir linha" e "desfazer" no
       * meio do caminho. Como a caixa contextual não traz separador próprio, o
       * bloco continua sendo UM bloco — com ou sem os botões extras.
       */
      contextual?: { node: string; buttons: EditorAction[] };
    };

/**
 * O que cada conjunto mostra.
 *
 * `single` onde as opções se excluem — um parágrafo é H1 OU H2, e está numa
 * lista com marcador OU numerada. `multiple` onde acumulam: negrito E itálico
 * no mesmo trecho, citação contendo bloco de código.
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
    // Os seis da tabela só existem dentro de uma: barra com seis botões inertes
    // é ruído permanente para uma capacidade que a maioria dos documentos nunca
    // usa.
    {
      buttons: ['table'],
      contextual: {
        node: 'table',
        buttons: ['rowAfter', 'columnAfter', 'deleteRow', 'deleteColumn', 'headerRow', 'deleteTable'],
      },
    },
  ],
};

/**
 * Esquemas de URL aceitos no link.
 *
 * A lib aceita DEZ por padrão — medido em `isAllowedUri`: http, https, ftp,
 * ftps, mailto, tel, callto, sms, cid e xmpp. `javascript:` já fica de fora, que
 * é o que importa para injeção, mas metade da lista é superfície sem uso num
 * design system. Aqui a lista é a mínima que serve.
 */
const LINK_SCHEMES = ['http', 'https', 'mailto'];

/**
 * Menor largura de imagem, em pixels.
 *
 * Abaixo disto a alça de arrastar cobre a própria imagem, e o que sobra não
 * mostra mais nada — mas continua ocupando uma linha do documento. Um piso é o
 * que impede o clique acidental que reduz a imagem a um ponto irrecuperável.
 */
const MIN_WIDTH = 48;

/** Passo do redimensionamento por teclado, em pixels. */
const WIDTH_STEP = 40;

/**
 * Imagem com largura ajustável.
 *
 * A largura vai no ATRIBUTO `width` do `<img>`, e não em `style` inline. É HTML
 * válido, sobrevive a qualquer sanitização razoável do lado de quem grava, e
 * continua submetido ao `max-width: 100%` da folha — imagem larga demais encolhe
 * na moldura estreita em vez de vazar.
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
        renderHTML: (attrs) => (attrs.width ? { width: String(attrs.width) } : {}),
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
      // da barra, que é o caminho exigido pelo critério de arrasto (WCAG 2.5.7)
      // e o único que existe para quem não usa mouse.
      //
      // Por ser decoração, o `aria-hidden` vale para a alça INTEIRA — o ícone
      // dentro dela não precisa do seu, e um segundo `aria-hidden` aninhado só
      // repetiria o que o pai já diz.
      handle.setAttribute('aria-hidden', 'true');
      handle.appendChild(iconSvg(asIcon(ArrowDownRightFromSquare)));
      dom.append(img, handle);

      const paint = (n: typeof node): void => {
        img.src = n.attrs.src as string;
        img.alt = (n.attrs.alt as string | null) ?? '';
        if (n.attrs.width) img.setAttribute('width', String(n.attrs.width));
        else img.removeAttribute('width');
      };
      paint(node);

      handle.addEventListener('pointerdown', (event) => {
        // `preventDefault` mata o arrasto NATIVO do nó: `draggable: true` está no
        // próprio nó de imagem, e sem isto puxar a alça arrastaria a imagem para
        // outro ponto do documento em vez de redimensioná-la.
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
        // O `width` que o arrasto escreve no `<img>` é mutação de DOM que a lib
        // não provocou. Sem isto ela conclui que o nodeView saiu de sincronia e
        // o remonta no meio do arrasto.
        ignoreMutation: () => true,
      };
    };
  },
});

/** Só os arquivos de imagem de uma área de transferência ou de um arrasto. */
function imageFilesOf(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  return Array.from(dt.files).filter((f) => f.type.startsWith("image/"));
}

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

// ─── Peças de DOM ────────────────────────────────────────────────────────────

/** Monta um SVG a partir dos nós do lucide — mesma forma do alert e do breadcrumb. */
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
  for (const [tag, attrs] of nodes) {
    const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v);
    svg.appendChild(node);
  }
  return svg;
}

type FieldRow = {
  row: HTMLElement;
  field: HTMLInputElement;
  isOpen: () => boolean;
  open: (isOpen: boolean) => void;
};

/**
 * Linha que pede um texto antes de agir — fórmula e link usam a mesma.
 *
 * Fica na moldura, e não num diálogo, porque escrever fórmula ou endereço é
 * edição de texto: um modal tiraria o texto de vista justamente enquanto se
 * decide o que a fórmula diz ou para onde o link vai.
 */
function createFieldRow(
  slot: string,
  label: string,
  placeholder: string,
  confirmLabel: string,
  onConfirm: () => void,
  onClose: () => void,
  /**
   * O que o campo mostra ao abrir.
   *
   * É o que torna a linha EDITÁVEL e não só um formulário de inserção: com o
   * cursor dentro de um link, abrir mostra o endereço atual — dá para corrigir,
   * e dá para apagar o texto e confirmar, que é como se tira o link. Abrindo em
   * branco, o botão só sabia criar, e nada na tela dizia o que já existia.
   */
  valueOnOpen: () => string,
): FieldRow {
  const row = document.createElement('div');
  row.dataset.slot = slot;
  row.className = 'nds-editor-field-row';
  row.hidden = true;
  row.id = `nds-${slot}-${Math.random().toString(36).slice(2, 9)}`;

  const field = createInput({ placeholder });
  field.setAttribute('aria-label', label);
  const confirmButton = createButton({ label: confirmLabel, size: 'sm' });
  row.append(field, confirmButton);

  // `hidden` é `boolean | string` no DOM moderno (`until-found`), então a
  // pergunta é pelo valor de verdade, não pelo booleano.
  const isOpen = (): boolean => !row.hidden;

  const open = (next: boolean): void => {
    row.hidden = !next;
    if (!next) return;
    // O campo é remontado a cada abertura, e não guardado entre uma e outra:
    // texto abandonado por Escape reapareceria na abertura seguinte, aplicado a
    // outro trecho do documento.
    field.value = valueOnOpen();
    field.removeAttribute('aria-invalid');
    field.focus();
    field.select();
  };

  confirmButton.addEventListener('click', onConfirm);
  field.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onConfirm();
    } else if (e.key === 'Escape') {
      open(false);
      onClose();
    }
  });

  return { row, field, isOpen, open };
}

// ─── Fábrica ─────────────────────────────────────────────────────────────────

export function createEditor(options: EditorOptions): EditorRoot {
  const { labels, editable = true, preset = 'advanced' } = options;
  const resolveImageFile = options.resolveImage ?? imageAsDataUrl;
  const describeImageFile = options.describeImage;

  const root = document.createElement('div');
  root.dataset.slot = 'editor';
  root.className = cn('nds-editor', options.class);

  const toolbar = document.createElement('div');
  toolbar.dataset.slot = 'editor-toolbar';
  toolbar.className = 'nds-editor-toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', labels.toolbar);

  const clipboard = document.createElement('div');
  clipboard.dataset.slot = 'editor-content';
  clipboard.className = 'nds-editor-content';

  const editor = new Editor({
    element: clipboard,
    editable,
    extensions: [
      StarterKit.configure({
        link: {
          isAllowedUri: (url) => isAllowedLink(url),
          openOnClick: false,
        },
      }),
      Mathematics,
      TaskList,
      // Lista de tarefas dentro de lista de tarefas: é como se escreve subitem,
      // e sem isto o Enter no meio de um item cria irmão em vez de filho.
      TaskItem.configure({ nested: true }),
      TableKit.configure({ table: { resizable: true } }),
      // `allowBase64` é FALSE por padrão, e sem ele a imagem embutida some na
      // releitura do documento: o esquema descarta o `src` que não reconhece.
      // Como o resolvedor padrão devolve `data:`, ligar aqui é o que faz o
      // caminho de demonstração sobreviver a um `setContent`.
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
      attributes: { 'aria-label': labels.editorField },

      // Colar e ARRASTAR arquivo de imagem passam pelo mesmo caminho do botão —
      // mesmo `resolveImage`, mesma descrição, mesmo `alt`. Sem isto, medido:
      // colar arquivo não fazia nada e arrastar também não. Quem usa não sabe
      // que existe um botão para uma coisa que o resto da web resolve
      // arrastando.
      handlePaste: (_view, event) => {
        const files = imageFilesOf(event.clipboardData);
        if (files.length === 0) return false;
        for (const file of files) void insertImageFile(file);
        return true;
      },

      handleDrop: (view, event, _slice, moved) => {
        // `movido` é arrasto INTERNO — alguém remanejando o que já está no
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
    content: options.content ? DOMPurify.sanitize(options.content) : undefined,
  });

  // ─── Montagem da barra ─────────────────────────────────────────────────────
  //
  // Um bloco por grupo, separador entre blocos. O separador é decorativo: quem
  // ouve recebe a divisão pelo nome de cada grupo, não por uma barrinha.

  // Mutáveis porque a barra se REFAZ ao trocar de conjunto: o documento e a
  // instância da lib sobrevivem, os botões não. Ver `setPreset`.
  let currentPreset: EditorPreset = preset;
  let groups: Array<{ group: ToggleGroupElement; actions: EditorAction[] }> = [];
  let plain: Array<{ button: HTMLButtonElement; action: EditorAction }> = [];
  let contextBoxes: Array<{ box: HTMLElement; node: string }> = [];

  function divider(): HTMLElement {
    const s = document.createElement('span');
    s.className = 'nds-editor-toolbar-separator';
    s.setAttribute('aria-hidden', 'true');
    return s;
  }

  /** Botão que não alterna: divisória, desfazer, refazer, e os dois que abrem linha. */
  function plainButton(action: EditorAction): HTMLButtonElement {
    const btn = createButton({
      variant: 'ghost',
      size: 'icon-sm',
      'aria-label': labels.actions[action],
      children: iconSvg(ACTIONS[action].icon),
    });
    btn.dataset.action = action;
    return btn;
  }

  let formulaButton!: HTMLButtonElement;
  let linkButton!: HTMLButtonElement;
  let altButton: HTMLButtonElement | undefined;
  let hasLinkButton = false;

  /**
   * Monta a barra inteira do conjunto pedido, e liga os cliques.
   *
   * É chamada uma vez na criação e de novo a cada `setPreset`. Tudo que ela
   * escreve é DESCARTÁVEL — os botões, os grupos, as caixas contextuais —, e
   * nada do que o documento guarda passa por aqui: a instância da lib, o
   * conteúdo, o histórico e as três linhas de entrada vivem fora dela.
   */
  function buildToolbar(): void {
    toolbar.replaceChildren();
    groups = [];
    plain = [];
    contextBoxes = [];

    const blocks = [...PRESETS[currentPreset], { buttons: ['formula'] as EditorAction[] }];

    blocks.forEach((block, i) => {
    if (i > 0) toolbar.appendChild(divider());
    const target: HTMLElement = toolbar;

    if ('group' in block) {
      // `role: 'group'` porque o grupo está ANINHADO nesta barra, ao lado de
      // botões que não alternam: `toolbar` dentro de `toolbar` seriam duas
      // navegações por seta disputando o mesmo Tab, e quem navega ficaria preso
      // no firstFocusable grupo sem alcançar o resto.
      const group = createToggleGroup({
        type: block.type,
        role: 'group',
        'aria-label': labels.groups[block.group],
        items: block.actions.map((a) => ({
          value: a,
          'aria-label': labels.actions[a],
          children: iconSvg(ACTIONS[a].icon),
        })),
      });
      groups.push({ group, actions: block.actions });
      target.appendChild(group);
      return;
    }

    for (const action of block.buttons) {
      const btn = plainButton(action);
      plain.push({ button: btn, action });
      target.appendChild(btn);
    }

    if (!block.contextual) return;

    // A caixa contextual entra no MESMO bloco, sem separador próprio: os botões
    // extras pertencem ao assunto que o bloco já trata. Ela existe como caixa,
    // e não como botões soltos com `hidden` cada um, para que aparecer e sumir
    // seja um atributo só — e para que a barra não fique com buracos quando
    // parte do bloco some.
    const box = document.createElement('span');
    box.dataset.slot = 'editor-toolbar-context';
    box.dataset.node = block.contextual.node;
    box.className = 'nds-editor-toolbar-context';
    box.hidden = true;
    for (const action of block.contextual.buttons) {
      const btn = plainButton(action);
      plain.push({ button: btn, action });
      box.appendChild(btn);
    }
    toolbar.appendChild(box);
    contextBoxes.push({ box, node: block.contextual.node });
    });

    formulaButton = plain.find((s) => s.action === 'formula')!.button;
    const linkTarget = plain.find((s) => s.action === 'link');
    hasLinkButton = linkTarget !== undefined;
    linkButton = linkTarget ? linkTarget.button : formulaButton;
    altButton = plain.find((s) => s.action === 'imageAlt')?.button;

    wireToolbar();
  }

  // ─── Linhas de entrada ─────────────────────────────────────────────────────

  const formula = createFieldRow(
    'editor-formula',
    labels.fields.formula,
    '\\frac{a}{b}',
    labels.fields.formulaConfirm,
    () => insertFormula(),
    () => formulaButton.focus(),
    // Com o cursor numa fórmula, abrir mostra o LaTeX dela — é o único caminho
    // para corrigir uma: o que se vê na tela é o resultado renderizado.
    () => (editor.isActive('inlineMath') ? (editor.getAttributes('inlineMath').latex ?? '') : ''),
  );

  const link = createFieldRow(
    'editor-link',
    labels.fields.link,
    'https://exemplo.com',
    labels.fields.linkConfirm,
    () => applyLink(),
    () => linkButton.focus(),
    () => (editor.getAttributes('link').href as string | undefined) ?? '',
  );

  /**
   * A linha do texto alternativo — onde a proposta da IA é conferida.
   *
   * Abre com o que a imagem tem hoje: o nome do arquivo enquanto a descrição
   * não chegou, a descrição depois. Ver o texto é o que permite julgá-lo.
   */
  const alt = createFieldRow(
    'editor-alt',
    labels.fields.alt,
    labels.fields.alt,
    labels.fields.altConfirm,
    () => applyAlt(),
    () => altButton?.focus(),
    () => (editor.getAttributes('image').alt as string | undefined) ?? '',
  );

  const unlinkButton = createButton({
    variant: 'ghost',
    size: 'icon-sm',
    'aria-label': labels.fields.linkRemove,
    children: iconSvg(asIcon(Unlink)),
  });
  unlinkButton.dataset.action = 'unlink';
  unlinkButton.hidden = true;
  unlinkButton.addEventListener('click', () => {
    // `extendMarkRange` firstFocusable: o cursor costuma estar NO MEIO do link, e sem
    // estender o trecho a marca sairia só do pedaço sob o cursor — partindo o
    // link em dois em vez de removê-lo.
    editor.chain().extendMarkRange('link').unsetLink().run();
    openRow(null);
    linkButton.focus();
  });
  link.row.appendChild(unlinkButton);

  /** Só uma linha aberta por vez — as três ocupam o mesmo lugar na moldura. */
  function openRow(qual: FieldRow | null): void {
    for (const l of [formula, link, alt]) l.open(l === qual);
    sync();
  }

  function applyAlt(): void {
    // Aqui `updateAttributes` é o certo, ao contrário do caminho da IA: a
    // imagem está selecionada AGORA, é ela que se edita, e o texto é de quem
    // está olhando para ela.
    editor.chain().focus().updateAttributes('image', { alt: alt.field.value.trim() }).run();
    openRow(null);
    altButton?.focus();
  }

  function insertFormula(): void {
    const latex = formula.field.value.trim();
    if (!latex) return;
    // `insertInlineMath` guarda o LaTeX num atributo do nó e deixa o KaTeX
    // renderizar. O texto nunca vira HTML: não há caminho de injeção por aqui,
    // e fórmula inválida cai no ramo de erro da própria lib.
    //
    // SEM `.focus()` na corrente, ao contrário dos botões de marca. O comando de
    // foco da lib chega depois do fim desta função — medido: o `focus()` do
    // botão rodava firstFocusable e a lib o tomava de volta em seguida, deixando o
    // foco no texto quando a linha acabara de fechar. A inserção não precisa do
    // foco: a seleção guardada no documento é o ponto de entrada.
    // Fórmula sob o cursor se ATUALIZA; fora dela, insere. Sem esta distinção,
    // corrigir uma fórmula criava uma segunda ao lado da errada.
    if (editor.isActive('inlineMath')) {
      editor.chain().updateInlineMath({ latex }).run();
    } else {
      editor.chain().insertInlineMath({ latex }).run();
    }
    openRow(null);
    formulaButton.focus();
  }

  function applyLink(): void {
    const raw = link.field.value.trim();
    // Campo vazio TIRA o link do trecho — é o caminho de desfazer, e não há
    // botão separado para ele.
    if (!raw) {
      editor.chain().extendMarkRange('link').unsetLink().run();
    } else {
      // Endereço sem esquema é o que a pessoa digita: `exemplo.com`. Completar
      // com `https://` antes de validar evita reprovar o caso comum.
      const url = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
      if (!isAllowedLink(url)) {
        link.field.setAttribute('aria-invalid', 'true');
        return;
      }
      link.field.removeAttribute('aria-invalid');
      editor.chain().extendMarkRange('link').setLink({ href: url }).run();
    }
    openRow(null);
    linkButton.focus();
  }

  /**
   * Com a edição desligada, a barra DEIXA DE AGIR.
   *
   * A guarda é aqui, e não na lib: `editor.commands` continua funcionando num
   * editor em leitura — `editable` vale para o que o teclado e o ponteiro fazem
   * no campo, não para comando disparado por código. Medido: clicar em Negrito
   * numa demonstração somente-leitura marcava o documento, o botão acendia, e o
   * estado contradizia o que a própria página promete em `states.readOnly`.
   */
  function acts(): boolean {
    return editor.isEditable;
  }

  /**
   * Liga os cliques dos botões que a montagem acabou de criar.
   *
   * Roda junto de cada `buildToolbar`: os ouvintes morrem com os elementos que
   * a montagem descarta, e não há o que desligar à mão.
   */
  function wireToolbar(): void {
    for (const { group, actions } of groups) {
      for (const btn of group.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]')) {
        btn.addEventListener('click', () => {
          const action = btn.dataset.value as EditorAction;
          if (!actions.includes(action)) return;
          // O grupo pinta o próprio estado no clique, ANTES deste ouvinte. Com
          // a edição desligada o comando não roda, o documento não muda, e sem
          // este `sync` o botão ficaria aceso mentindo sobre ele.
          if (!acts()) return sync();
          ACTIONS[action].run?.(editor);
        });
      }
    }

    for (const { button, action } of plain) {
      const run = ACTIONS[action].run;
      if (run) button.addEventListener('click', () => { if (acts()) run(editor); });
    }

    for (const [button, row] of [
      [formulaButton, formula],
      ...(hasLinkButton ? [[linkButton, link] as const] : []),
      ...(altButton ? [[altButton, alt] as const] : []),
    ] as Array<[HTMLButtonElement, FieldRow]>) {
      button.setAttribute('aria-expanded', 'false');
      button.setAttribute('aria-controls', row.row.id);
      button.addEventListener('click', () => {
        if (!acts()) return;
        openRow(row.isOpen() ? null : row);
      });
    }

    const imageTarget = plain.find((s) => s.action === 'image');
    imageTarget?.button.addEventListener('click', () => {
      if (!acts()) return;
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
    });

    sync();
    const firstFocusable = focusables()[0];
    if (firstFocusable) setRoving(firstFocusable);
  }

  root.append(toolbar, formula.row, link.row, alt.row, clipboard);

  // ─── Estado ────────────────────────────────────────────────────────────────
  //
  // `transaction` cobre o que `update` não cobre: mover o cursor não muda o
  // documento, mas muda a marca ativa. Ligar só em `update` deixava o botão
  // aceso depois de sair de um trecho em negrito.
  function sync(): void {
    for (const { group, actions } of groups) {
      group.setValue(actions.filter((a) => ACTIONS[a].isOn?.(editor)));
    }
    for (const { button, action } of plain) {
      const { isOn, can } = ACTIONS[action];
      if (can) button.disabled = !can(editor);
      if (isOn) button.dataset.state = isOn(editor) ? 'on' : 'off';
    }
    // Tirar o link só existe quando há link: botão que não faz nada é ruído, e
    // desabilitado seria pior — anuncia uma ação e nega logo em seguida.
    unlinkButton.hidden = !editor.isActive('link');
    for (const { box, node } of contextBoxes) box.hidden = !editor.isActive(node);
    formulaButton.setAttribute('aria-expanded', String(formula.isOpen()));
    if (hasLinkButton) linkButton.setAttribute('aria-expanded', String(link.isOpen()));
    altButton?.setAttribute('aria-expanded', String(alt.isOpen()));
  }
  editor.on('transaction', sync);
  // Imagem colada entra por fora da fábrica, então a varredura é o que a
  // alcança. `update` e não `transaction`: só mudança de DOCUMENTO traz imagem
  // nova, e `transaction` dispara também a cada movimento de cursor.
  editor.on('update', describePending);
  if (options.onChange) {
    const emitChange = options.onChange;
    editor.on('update', () => emitChange(editor.getHTML()));
  }

  // ─── Imagem ────────────────────────────────────────────────────────────────
  /**
   * Escreve o `alt` da imagem de um `src` conhecido, onde quer que ela esteja.
   *
   * Não usa `updateAttributes`, que age sobre a SELEÇÃO: quando a descrição
   * chega, segundos depois, o cursor já andou — e o atributo iria parar em
   * outra imagem, ou em lugar nenhum. Aqui a imagem é reencontrada pelo `src`.
   * Some do documento nesse meio-tempo? A função não faz nada, que é o certo.
   */
  function setAltBySrc(src: string, alt: string): void {
    const { state } = editor;
    let position = -1;
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.src === src) position = pos;
    });
    if (position < 0) return;
    editor.view.dispatch(state.tr.setNodeAttribute(position, 'alt', alt));
  }

  async function insertImageFile(file: File): Promise<boolean> {
    const src = await resolveImageFile(file);
    // `null` é recusa de quem consome — envio negado, arquivo grande demais,
    // formato fora da política. Não é erro, e não vira alerta.
    if (!src) return false;

    // O `alt` provisório é o nome do arquivo: descreve o arquivo, não a imagem.
    // É o que segura a vaga até a descrição chegar — e o que fica se ela não
    // vier. Imagem sem `alt` nenhum reprovaria no axe e sumiria do leitor de
    // tela sem deixar rastro.
    editor.chain().focus().setImage({ src, alt: file.name }).run();

    describe(file, src);
    return true;
  }

  /**
   * Imagens já COM `src` e sem descrição — as que chegaram por colagem.
   *
   * Colar uma imagem de outra página insere `<img src>` sem `alt` nenhum, por
   * um caminho que não passa pela fábrica: quem monta o nó é o próprio
   * ProseMirror, a partir do HTML da área de transferência. Medido — era o
   * caminho mais provável de quem usa, e o único que ficava de fora.
   *
   * O cache é por `src` e guarda a PROMESSA, não o fato de ter tentado. A
   * diferença aparece na mesma imagem inserida duas vezes: com um conjunto de
   * "já tentadas", a segunda ficava para sempre com o `alt` provisório, porque
   * o pedido fora feito e o resultado tinha ido para a primeira. Guardando a
   * promessa, a segunda cópia recebe a MESMA descrição sem um segundo pedido —
   * mesma imagem, mesma descrição, uma chamada só ao serviço.
   */
  const descriptions = new Map<string, Promise<string | null>>();

  function describe(file: File | null, src: string): void {
    if (!describeImageFile) return;
    let request = descriptions.get(src);
    if (!request) {
      // A descrição é assíncrona e NÃO segura a inserção. Modelo de visão leva
      // segundos e às vezes falha; prender a imagem esperando trocaria uma
      // lacuna de acessibilidade por uma de responsividade.
      //
      // A falha vira `null` aqui, e não uma promessa rejeitada: quem descreve
      // não derruba a edição, e a imagem segue com o `alt` provisório e o botão
      // de texto alternativo à mão.
      request = describeImageFile(file, src).catch(() => null);
      descriptions.set(src, request);
    }
    void request.then((description) => {
      if (description) setAltBySrc(src, description);
    });
  }

  function describePending(): void {
    if (!describeImageFile) return;
    const pending: string[] = [];
    editor.state.doc.descendants((node) => {
      const { src, alt } = node.attrs as { src?: string; alt?: string };
      // `descricoes.has` corta a reentrada: escrever o `alt` dispara outra
      // atualização, e uma recusa não pode virar pedido a cada tecla digitada.
      if (node.type.name === 'image' && src && !alt && !descriptions.has(src)) pending.push(src);
    });
    // Sem arquivo: a imagem colada de outra página tem endereço e nada mais.
    for (const src of pending) describe(null, src);
  }

  // ─── Arrastar para QUALQUER lugar da moldura ───────────────────────────────
  //
  // O `dragover` que a lib previne cobre só o elemento editável, e ele tem a
  // altura do TEXTO — o respiro abaixo da última linha, a barra e a borda são
  // moldura, não campo. Soltar ali escapava do editor e o navegador abria o
  // arquivo numa aba nova, que foi o relato.
  //
  // Durante o arrasto o navegador esconde os arquivos por segurança:
  // `dataTransfer.files` vem VAZIO no `dragover`, e só em `drop` é que aparece.
  // Por isso a pergunta aqui é por `types`, e não pela lista.
  const isFileDrag = (dt: DataTransfer | null): boolean =>
    !!dt && Array.from(dt.types).includes('Files');

  for (const event of ['dragenter', 'dragover'] as const) {
    root.addEventListener(event, (e) => {
      // Em leitura o arrasto NÃO é aceito: cancelar o padrão aqui prometeria
      // que a moldura recebe o arquivo, e receber é escrever no documento.
      if (acts() && isFileDrag((e as DragEvent).dataTransfer)) e.preventDefault();
    });
  }

  root.addEventListener('drop', (e) => {
    if (!acts()) return;
    // Solto DENTRO do editável, quem já tratou foi a lib, pelo `handleDrop`
    // acima — ela previne o padrão, e é essa marca que evita inserir duas vezes.
    if (e.defaultPrevented) return;
    const files = imageFilesOf((e as DragEvent).dataTransfer);
    if (files.length === 0) return;
    e.preventDefault();
    // Solto fora do texto, a imagem vai para o fim do documento — é o lugar
    // mais próximo do que se apontou, e o único definido.
    editor.commands.focus('end');
    for (const file of files) void insertImageFile(file);
  });

  // ─── Navegação por seta na barra ──────────────────────────────────────────
  //
  // `role="toolbar"` promete uma parada de tabulação só, com as setas andando
  // dentro — inclusive atravessando os grupos, que abriram mão do teclado
  // justamente para isto. Sem a navegação, a barra promete um contrato que não
  // cumpre, e o leitor de tela anuncia o papel de qualquer jeito.
  const focusables = (): HTMLButtonElement[] =>
    Array.from(toolbar.querySelectorAll<HTMLButtonElement>('button')).filter(
      // `offsetParent` nulo cobre o botão escondido E o bloco contextual
      // fechado em volta dele — perguntar só pelo `hidden` do próprio botão
      // deixaria as setas pousarem nos seis botões de tabela fora da tabela.
      (b) => !b.disabled && b.offsetParent !== null,
    );

  function setRoving(dropTarget: HTMLButtonElement): void {
    for (const b of toolbar.querySelectorAll<HTMLButtonElement>('button')) {
      b.tabIndex = b === dropTarget ? 0 : -1;
    }
  }

  toolbar.addEventListener('keydown', (e) => {
    const listEl = focusables();
    const current = listEl.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;
    let next: number;
    if (e.key === 'ArrowRight') next = (current + 1) % listEl.length;
    else if (e.key === 'ArrowLeft') next = (current - 1 + listEl.length) % listEl.length;
    else if (e.key === 'Home') next = 0;
    else if (e.key === 'End') next = listEl.length - 1;
    else return;
    e.preventDefault();
    setRoving(listEl[next]);
    listEl[next].focus();
  });

  // Clicar passa a ordem de tabulação para quem foi usado — senão o Tab
  // devolveria o foco a um botão diferente do último tocado.
  toolbar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button');
    if (btn && !btn.disabled) setRoving(btn);
  });

  // A barra só existe a partir daqui: `buildToolbar` fecha sobre as linhas de
  // entrada e sobre `insertImageFile`, e chamá-la antes deles pegaria as
  // constantes na zona morta.
  buildToolbar();

  /**
   * Liga e desliga a edição sem refazer nada.
   *
   * `setEditable` não emite transação, então a barra precisa ser avisada à mão
   * — e a linha de entrada aberta tem de fechar: ela pede um texto para uma
   * ação que a barra acabou de deixar de aplicar.
   */
  function setEditable(value: boolean): void {
    if (editor.isEditable === value) return;
    editor.setEditable(value);
    if (!value) openRow(null);
    else sync();
  }

  /**
   * Troca o conjunto de botões sem remontar o editor.
   *
   * O que muda é a BARRA; o documento, o histórico e o foco seguem intactos. A
   * fábrica inteira era a única saída antes disso, e ela leva junto o texto que
   * a pessoa acabou de escrever — na demonstração da docs page, cada clique num
   * controle apagava o que estava na tela.
   */
  function setPreset(next: EditorPreset): void {
    if (next === currentPreset) return;
    currentPreset = next;
    // A linha aberta pode pertencer a um botão que o conjunto novo não tem.
    openRow(null);
    buildToolbar();
  }

  const root2 = tornarDestruivel(root, root, () => {
    editor.destroy();
  }) as EditorRoot;
  root2.editor = editor;
  root2.insertImage = insertImageFile;
  root2.setEditable = setEditable;
  root2.setPreset = setPreset;
  return root2;
}
