// ─── Editor ──────────────────────────────────────────────────────────────────
//
// Editor de texto rico sobre `@tiptap/core`. A referência de markup, de
// comportamento e de decisão é `nortear-design-system-vanilla/src/components/ui/
// editor.ts`; o que muda aqui é só o ciclo de vida (Angular) e a origem dos
// botões (componentes do design system em vez de fábricas de DOM).
//
// `EditorOptions.element` do Tiptap aceita um `Element` qualquer, então o núcleo
// monta sem binding de framework: `@tiptap/angular` não existe e não faz falta.
// A instância nasce em `ngAfterViewInit` sobre o `viewChild` da área de
// conteúdo e morre em `ngOnDestroy`.
//
// A BARRA É NOSSA. Nenhum dos pacotes `@tiptap/*` traz botão, ícone ou barra —
// a lib é o motor do documento. O `StarterKit` liga por padrão (opt-out) título,
// listas, citação, código, bloco de código, linha divisória, link, sublinhado e
// desfazer/refazer; os conjuntos abaixo escolhem o que dessa capacidade vira
// botão.
//
// A folha do KaTeX é importada AQUI, e não na `globals.css`, de propósito: são
// dezenas de kB de CSS mais os arquivos de fonte, e quem não usa o editor não
// deve pagar por eles. Importada no módulo, ela viaja no mesmo pedaço que o
// editor e some do pacote das páginas que não o carregam.

import {
  AfterViewInit,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  Injector,
  OnDestroy,
  ViewEncapsulation,
  afterNextRender,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { DataOrientation } from '@radix-ng/primitives/core';
import {
  provideToggleGroupContext,
  type RdxToggleGroupContext,
} from '@radix-ng/primitives/toggle-group';
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
  AlignJustify,
  AlignLeft,
  AlignRight,
  ArrowDownRightFromSquare,
  Bold,
  Captions,
  Code,
  Columns3,
  Expand,
  Heading1,
  Heading2,
  Heading3,
  Highlighter,
  Image as ImageIcon,
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

import { NdsButton } from '@/components/ui/button';
import { NdsInput } from '@/components/ui/input';
import { NdsToggle } from '@/components/ui/toggle';

type LucideIconNode = [string, Record<string, string>];

// ─── Contrato público ────────────────────────────────────────────────────────

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
   * A lib põe papel de campo de texto no elemento editável, e campo com esse
   * papel e sem nome é violação de `aria-input-field-name`. Não há rótulo
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
     * continua tirando — mas esse caminho depende de a pessoa deduzir, e quem
     * não deduz não descobre que dá para remover.
     */
    linkRemove: string;
    /** Rótulo do campo de texto alternativo da imagem. */
    alt: string;
    altConfirm: string;
  };
};

/**
 * O elemento hospedeiro carrega a instância da lib e o caminho de inserção.
 *
 * Mesma superfície que a raiz devolvida pela fábrica do Vanilla: story e teste
 * só alcançariam o editor pelo DOM, e o estado que importa (marca ativa,
 * documento, transação) vive na instância, não no DOM.
 */
export type EditorHostElement = HTMLElement & {
  editor: Editor;
  /**
   * Insere um arquivo de imagem passando pelo `resolveImage` configurado.
   *
   * É o mesmo caminho do botão, exposto: colar e arrastar um arquivo para
   * dentro do editor usam exatamente isto. Devolve `false` quando o resolvedor
   * recusa.
   */
  insertImage: (file: File) => Promise<boolean>;
};

/**
 * O resolvedor padrão: o próprio arquivo, embutido no documento.
 *
 * Serve para demonstrar e para prototipar. Base64 infla o documento em cerca de
 * um terço do tamanho do arquivo, e o conteúdo inteiro passa a trafegar junto
 * do texto a cada gravação — não é o que se leva para produção.
 */
export function imageAsDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string));
    reader.addEventListener('error', () => resolve(null));
    reader.readAsDataURL(file);
  });
}

// ─── Ícones ──────────────────────────────────────────────────────────────────
//
// Mesmo mecanismo do `NdsToggleIcon`: o host é o próprio `<svg>` e os filhos
// nascem de `createElementNS`, porque cada ícone do lucide é uma lista
// `[tag, attrs]` com tag variável e template Angular exige tag estática.

const asIcon = (n: unknown): LucideIconNode[] => n as LucideIconNode[];

/** Ícone de cada ação, mais o de tirar o link, que não é ação da barra. */
const EDITOR_ICONS: Record<EditorAction | 'unlink', LucideIconNode[]> = {
  bold: asIcon(Bold),
  italic: asIcon(Italic),
  underline: asIcon(Underline),
  strike: asIcon(Strikethrough),
  code: asIcon(Code),
  highlight: asIcon(Highlighter),
  h1: asIcon(Heading1),
  h2: asIcon(Heading2),
  h3: asIcon(Heading3),
  alignLeft: asIcon(AlignLeft),
  alignCenter: asIcon(AlignCenter),
  alignRight: asIcon(AlignRight),
  alignJustify: asIcon(AlignJustify),
  bulletList: asIcon(List),
  orderedList: asIcon(ListOrdered),
  taskList: asIcon(ListTodo),
  blockquote: asIcon(Quote),
  codeBlock: asIcon(SquareCode),
  link: asIcon(LinkIcon),
  image: asIcon(ImageIcon),
  table: asIcon(TableIcon),
  horizontalRule: asIcon(Minus),
  undo: asIcon(Undo2),
  redo: asIcon(Redo2),
  formula: asIcon(Sigma),
  imageAlt: asIcon(Captions),
  imageSmaller: asIcon(Shrink),
  imageLarger: asIcon(Expand),
  imageNatural: asIcon(RotateCcw),
  rowAfter: asIcon(Rows3),
  columnAfter: asIcon(Columns3),
  deleteRow: asIcon(Minus),
  deleteColumn: asIcon(Minus),
  headerRow: asIcon(PanelTop),
  deleteTable: asIcon(Trash2),
  unlink: asIcon(Unlink),
};

export type EditorIconKind = keyof typeof EDITOR_ICONS;

/** Monta um SVG a partir dos nós do lucide — mesma forma do Vanilla. */
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

@Component({
  selector: 'svg[ndsEditorIcon]',
  standalone: true,
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    xmlns: 'http://www.w3.org/2000/svg',
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    'stroke-width': '2',
    'stroke-linecap': 'round',
    'stroke-linejoin': 'round',
    // O ícone reforça o rótulo, nunca o substitui: o nome acessível vive no
    // `aria-label` do botão, que é só de ícone.
    'aria-hidden': 'true',
  },
})
export class NdsEditorIcon {
  readonly kind = input.required<EditorIconKind>();

  private readonly hostRef = inject<ElementRef<SVGSVGElement>>(ElementRef);

  constructor() {
    effect(() => {
      const svg = this.hostRef.nativeElement;
      svg.replaceChildren();
      for (const [tag, attrs] of EDITOR_ICONS[this.kind()]) {
        const child = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [k, v] of Object.entries(attrs)) child.setAttribute(k, v);
        svg.appendChild(child);
      }
    });
  }
}

// ─── Tabela de ações ─────────────────────────────────────────────────────────
//
// Uma linha por botão, e três perguntas que a barra faz ao editor: se está
// ligada, o que fazer no clique, se ainda é possível. Espalhar isso por `if` de
// montagem foi o que deixou `data-value` e estado divergirem no protótipo.

type Action = {
  /** Ligada agora? Ausente = ação sem estado (divisória, desfazer). */
  isOn?: (e: Editor) => boolean;
  /** O que fazer no clique. Ausente = a ação abre uma linha de entrada. */
  run?: (e: Editor) => void;
  /** Ainda é possível? Ausente = sempre. */
  can?: (e: Editor) => boolean;
};

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
 * Largura da imagem selecionada, em pixels.
 *
 * O atributo quando existe; a medida na TELA quando não. A segunda leitura é o
 * que dá um ponto de partida ao primeiro clique — imagem recém-inserida não tem
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
    isOn: (e) => e.isActive('bold'),
    run: (e) => void e.chain().focus().toggleBold().run(),
  },
  italic: {
    isOn: (e) => e.isActive('italic'),
    run: (e) => void e.chain().focus().toggleItalic().run(),
  },
  underline: {
    isOn: (e) => e.isActive('underline'),
    run: (e) => void e.chain().focus().toggleUnderline().run(),
  },
  strike: {
    isOn: (e) => e.isActive('strike'),
    run: (e) => void e.chain().focus().toggleStrike().run(),
  },
  code: {
    isOn: (e) => e.isActive('code'),
    run: (e) => void e.chain().focus().toggleCode().run(),
  },
  highlight: {
    isOn: (e) => e.isActive('highlight'),
    run: (e) => void e.chain().focus().toggleHighlight().run(),
  },
  // Alinhamento é ATRIBUTO do bloco, não marca: por isso `isActive` recebe
  // `{ textAlign }` e não um nome de nó. O grupo é `single` — um parágrafo tem
  // um alinhamento só.
  alignLeft: {
    isOn: (e) => e.isActive({ textAlign: 'left' }),
    run: (e) => void e.chain().focus().setTextAlign('left').run(),
  },
  alignCenter: {
    isOn: (e) => e.isActive({ textAlign: 'center' }),
    run: (e) => void e.chain().focus().setTextAlign('center').run(),
  },
  alignRight: {
    isOn: (e) => e.isActive({ textAlign: 'right' }),
    run: (e) => void e.chain().focus().setTextAlign('right').run(),
  },
  alignJustify: {
    isOn: (e) => e.isActive({ textAlign: 'justify' }),
    run: (e) => void e.chain().focus().setTextAlign('justify').run(),
  },
  h1: {
    isOn: (e) => e.isActive('heading', { level: 1 }),
    run: (e) => void e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  h2: {
    isOn: (e) => e.isActive('heading', { level: 2 }),
    run: (e) => void e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  h3: {
    isOn: (e) => e.isActive('heading', { level: 3 }),
    run: (e) => void e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  bulletList: {
    isOn: (e) => e.isActive('bulletList'),
    run: (e) => void e.chain().focus().toggleBulletList().run(),
  },
  orderedList: {
    isOn: (e) => e.isActive('orderedList'),
    run: (e) => void e.chain().focus().toggleOrderedList().run(),
  },
  taskList: {
    isOn: (e) => e.isActive('taskList'),
    run: (e) => void e.chain().focus().toggleTaskList().run(),
  },
  blockquote: {
    isOn: (e) => e.isActive('blockquote'),
    run: (e) => void e.chain().focus().toggleBlockquote().run(),
  },
  codeBlock: {
    isOn: (e) => e.isActive('codeBlock'),
    run: (e) => void e.chain().focus().toggleCodeBlock().run(),
  },
  horizontalRule: {
    run: (e) => void e.chain().focus().setHorizontalRule().run(),
  },
  undo: {
    run: (e) => void e.chain().focus().undo().run(),
    can: (e) => e.can().undo(),
  },
  redo: {
    run: (e) => void e.chain().focus().redo().run(),
    can: (e) => e.can().redo(),
  },
  table: {
    // 3×3 com cabeçalho: uma tabela de exemplo grande o bastante para mostrar o
    // que ela é, e pequena o bastante para caber no que já está escrito.
    run: (e) =>
      void e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },

  // ─── Só com o cursor dentro de uma tabela ──────────────────────────────────
  rowAfter: { run: (e) => void e.chain().focus().addRowAfter().run() },
  columnAfter: { run: (e) => void e.chain().focus().addColumnAfter().run() },
  deleteRow: { run: (e) => void e.chain().focus().deleteRow().run() },
  deleteColumn: { run: (e) => void e.chain().focus().deleteColumn().run() },
  headerRow: { run: (e) => void e.chain().focus().toggleHeaderRow().run() },
  deleteTable: { run: (e) => void e.chain().focus().deleteTable().run() },

  // As três que não agem sozinhas: abrem uma linha, ou um seletor de arquivo, e
  // esperam. `run` fica de fora porque a ação depende do resolvedor de imagem
  // que quem consome escolheu, ou do texto da linha.
  link: { isOn: (e) => e.isActive('link') },
  image: {},
  imageAlt: {},

  // ─── Tamanho da imagem, pelo teclado ───────────────────────────────────────
  //
  // A alça de arrastar sozinha reprovaria em WCAG 2.5.7 (Movimentos de
  // arrasto): toda ação de arrastar precisa de um caminho por ponteiro único.
  // Estes três botões SÃO esse caminho, e de quebra são o único jeito de
  // redimensionar sem mouse.
  imageSmaller: {
    run: (e) => adjustWidth(e, -WIDTH_STEP),
    can: (e) => currentWidth(e) > MIN_WIDTH,
  },
  imageLarger: {
    run: (e) => adjustWidth(e, WIDTH_STEP),
  },
  imageNatural: {
    // Volta ao tamanho natural apagando o atributo, e não gravando a medida
    // original: gravada, ela congelaria a imagem no tamanho de HOJE, e a folha
    // deixaria de poder encolhê-la numa moldura estreita.
    run: (e) => void e.chain().focus().updateAttributes('image', { width: null }).run(),
    can: (e) => e.getAttributes('image').width != null,
  },
  formula: {},
};

// ─── Composição da barra ─────────────────────────────────────────────────────
//
// Uma forma só de bloco, com campos opcionais, e não uma união discriminada: o
// verificador de template do Angular estreita `@if (bloco.grupo; as g)` sem
// esforço, e uma união exigiria narrowing por chave dentro do `@for`.

type ToolbarBlock = {
  /** Presente quando o bloco é um grupo de alternadores. */
  group?: EditorGroup;
  /** Itens do grupo — vazio quando o bloco não é grupo. */
  toggles: EditorAction[];
  /** Botões que não alternam. */
  buttons: EditorAction[];
  /**
   * Botões que só aparecem com um nó sob o cursor, DENTRO deste mesmo bloco.
   *
   * Ficam no mesmo bloco de propósito: inserir imagem e editar imagem são o
   * mesmo assunto, e separá-los deixava "excluir linha" e "desfazer" no meio do
   * caminho. Como a caixa contextual não traz separador próprio, o bloco
   * continua sendo UM bloco — com ou sem os botões extras.
   */
  contextNode?: string;
  contextButtons: EditorAction[];
};

function group(group: EditorGroup, toggles: EditorAction[]): ToolbarBlock {
  return { group, toggles, buttons: [], contextButtons: [] };
}

function plain(
  buttons: EditorAction[],
  contextNode?: string,
  contextButtons: EditorAction[] = [],
): ToolbarBlock {
  return { toggles: [], buttons, contextNode, contextButtons };
}

/**
 * O que cada conjunto mostra.
 *
 * Os grupos de marca acumulam (negrito E itálico no mesmo trecho); os de
 * título, alinhamento e lista se excluem. A exclusão não precisa de flag aqui:
 * quem responde `isOn` é o editor, e um parágrafo é H1 OU H2 no documento.
 */
const PRESETS: Record<EditorPreset, ToolbarBlock[]> = {
  basic: [
    group('marks', ['bold', 'italic', 'strike']),
    group('lists', ['bulletList', 'orderedList']),
    plain(['link', 'undo', 'redo']),
  ],
  advanced: [
    group('marks', ['bold', 'italic', 'underline', 'strike', 'code', 'highlight']),
    group('headings', ['h1', 'h2', 'h3']),
    group('align', ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify']),
    group('lists', ['bulletList', 'orderedList', 'taskList']),
    group('blocks', ['blockquote', 'codeBlock']),
    // Um bloco por ASSUNTO. Inserir e editar imagem andam juntos, e o mesmo
    // vale para a tabela: antes, "linha divisória", "desfazer" e o próprio
    // botão de tabela caíam ENTRE o de inserir imagem e os de editá-la.
    plain(['link', 'horizontalRule', 'undo', 'redo']),
    plain(['image'], 'image', ['imageAlt', 'imageSmaller', 'imageLarger', 'imageNatural']),
    // Os seis da tabela só existem dentro de uma: barra com seis botões inertes
    // é ruído permanente para uma capacidade que a maioria dos documentos nunca
    // usa.
    plain(['table'], 'table', [
      'rowAfter',
      'columnAfter',
      'deleteRow',
      'deleteColumn',
      'headerRow',
      'deleteTable',
    ]),
  ],
};

/**
 * Esquemas de URL aceitos no link.
 *
 * A lib aceita DEZ por padrão — http, https, ftp, ftps, mailto, tel, callto,
 * sms, cid e xmpp. `javascript:` já fica de fora, que é o que importa para
 * injeção, mas metade da lista é superfície sem uso num design system. Aqui a
 * lista é a mínima que serve.
 */
const LINK_SCHEMES = ['http', 'https', 'mailto'];

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

/**
 * Durante o arrasto o navegador esconde os arquivos por segurança:
 * `dataTransfer.files` vem VAZIO no `dragover`, e só em `drop` é que aparece.
 * Por isso a pergunta aqui é por `types`, e não pela lista.
 */
function isFileDrag(dt: DataTransfer | null): boolean {
  return !!dt && Array.from(dt.types).includes('Files');
}

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
        // O `width` que o arrasto escreve no `<img>` é mutação de DOM que a lib
        // não provocou. Sem isto ela conclui que o nodeView saiu de sincronia e
        // o remonta no meio do arrasto.
        ignoreMutation: () => true,
      };
    };
  },
});

/** As três linhas de entrada, e o fechado. */
type FieldRow = 'formula' | 'link' | 'alt' | null;

let instanceCount = 0;

// ─── Componente ──────────────────────────────────────────────────────────────

@Component({
  selector: 'nds-editor',
  standalone: true,
  imports: [NdsButton, NdsInput, NdsToggle, NdsEditorIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  // ─── Por que o contexto de toggle-group vive AQUI ─────────────────────────
  //
  // O `NdsToggleGroup` não serve neste lugar: ele declara `role="toolbar"` e
  // compõe o `RdxCompositeRoot`, que instala roving tabindex e navegação por
  // seta PRÓPRIOS. Aqui quem é dona do teclado é a barra inteira — é o mesmo
  // motivo pelo qual a fábrica do Vanilla aceita `role: 'group'` e, nesse modo,
  // não instala teclado nenhum. Dois grupos com composite dentro de uma barra
  // seriam duas navegações disputando o mesmo Tab.
  //
  // O que se aproveita do primitivo é o que interessa: publicando o CONTEXTO de
  // grupo, cada `button[ndsToggle]` deriva `aria-pressed` e `data-state` do
  // valor do grupo — deste componente — em vez de guardar estado próprio, e o
  // clique passa a chamar `toggle()` daqui. É o desenho do Vanilla: uma origem
  // só de verdade, o editor, e botão nenhum com opinião.
  providers: [
    provideToggleGroupContext((): RdxToggleGroupContext => {
      const host = inject(EditorComponent);
      return {
        value: host.activeToggles,
        disabled: host.groupDisabled,
        orientation: host.groupOrientation,
        isValueInitialized: host.groupInitialized,
        toggle: (value: string) => host.runAction(value as EditorAction),
      };
    }),
  ],
  host: {
    class: 'nds-editor',
    '[attr.data-slot]': '"editor"',
    // ─── Arrastar para QUALQUER lugar da moldura ────────────────────────────
    //
    // O `dragover` que a lib previne cobre só o elemento editável, e ele tem a
    // altura do TEXTO — o respiro abaixo da última linha, a barra e a borda são
    // moldura, não campo. Soltar ali escapava do editor e o navegador abria o
    // arquivo numa aba nova, que foi o relato.
    '(dragenter)': 'onDragOver($event)',
    '(dragover)': 'onDragOver($event)',
    '(drop)': 'onHostDrop($event)',
  },
  template: `
    <div
      #toolbar
      class="nds-editor-toolbar"
      data-slot="editor-toolbar"
      role="toolbar"
      [attr.aria-label]="labels().toolbar"
      (keydown)="onToolbarKeydown($event)"
      (click)="onToolbarClick($event)"
    >
      @for (block of blocks(); track $index; let first = $first) {
        @if (!first) {
          <span class="nds-editor-toolbar-separator" aria-hidden="true"></span>
        }

        @if (block.group; as blockGroup) {
          <div
            class="nds-toggle-group"
            data-slot="toggle-group"
            data-orientation="horizontal"
            role="group"
            [attr.aria-label]="labels().groups[blockGroup]"
          >
            @for (action of block.toggles; track action) {
              <button
                ndsToggle
                [value]="action"
                [attr.data-value]="action"
                [attr.aria-label]="labels().actions[action]"
              >
                <svg ndsEditorIcon [kind]="action"></svg>
              </button>
            }
          </div>
        }

        @for (action of block.buttons; track action) {
          <button
            ndsButton
            variant="ghost"
            size="icon-sm"
            [attr.data-action]="action"
            [attr.data-state]="stateOf(action)"
            [disabled]="isBlocked(action)"
            [attr.aria-label]="labels().actions[action]"
            [attr.aria-expanded]="expandedOf(action)"
            [attr.aria-controls]="controlsOf(action)"
            (click)="onButtonClick(action)"
          >
            <svg ndsEditorIcon [kind]="action"></svg>
          </button>
        }

        @if (block.contextNode; as node) {
          <span
            class="nds-editor-toolbar-context"
            data-slot="editor-toolbar-context"
            [attr.data-node]="node"
            [hidden]="!isNodeActive(node)"
          >
            @for (action of block.contextButtons; track action) {
              <button
                ndsButton
                variant="ghost"
                size="icon-sm"
                [attr.data-action]="action"
                [attr.data-state]="stateOf(action)"
                [disabled]="isBlocked(action)"
                [attr.aria-label]="labels().actions[action]"
                [attr.aria-expanded]="expandedOf(action)"
                [attr.aria-controls]="controlsOf(action)"
                (click)="onButtonClick(action)"
              >
                <svg ndsEditorIcon [kind]="action"></svg>
              </button>
            }
          </span>
        }
      }
    </div>

    <!--
      As três linhas ocupam o mesmo lugar na moldura e nunca aparecem juntas.
      Ficam aqui, e não num diálogo, porque escrever fórmula, endereço ou
      descrição é edição de texto: um modal tiraria o texto de vista justamente
      enquanto se decide o que ele diz.
    -->
    <div
      class="nds-editor-field-row"
      data-slot="editor-formula"
      [id]="rowIds.formula"
      [hidden]="openRow() !== 'formula'"
    >
      <input
        #formulaField
        ndsInput
        [placeholder]="formulaPlaceholder"
        [attr.aria-label]="labels().fields.formula"
        (keydown)="onFieldKeydown($event, 'formula')"
      />
      <button ndsButton size="sm" type="button" (click)="confirmFormula()">
        {{ labels().fields.formulaConfirm }}
      </button>
    </div>

    <div
      class="nds-editor-field-row"
      data-slot="editor-link"
      [id]="rowIds.link"
      [hidden]="openRow() !== 'link'"
    >
      <input
        #linkField
        ndsInput
        [placeholder]="linkPlaceholder"
        [attr.aria-label]="labels().fields.link"
        [attr.aria-invalid]="linkInvalid() ? 'true' : null"
        (keydown)="onFieldKeydown($event, 'link')"
      />
      <button ndsButton size="sm" type="button" (click)="confirmLink()">
        {{ labels().fields.linkConfirm }}
      </button>
      <!--
        Tirar o link só existe quando há link: botão que não faz nada é ruído, e
        desabilitado seria pior — anuncia uma ação e nega logo em seguida.
      -->
      <button
        ndsButton
        variant="ghost"
        size="icon-sm"
        type="button"
        data-action="unlink"
        [hidden]="!linkActive()"
        [attr.aria-label]="labels().fields.linkRemove"
        (click)="removeLink()"
      >
        <svg ndsEditorIcon kind="unlink"></svg>
      </button>
    </div>

    <div
      class="nds-editor-field-row"
      data-slot="editor-alt"
      [id]="rowIds.alt"
      [hidden]="openRow() !== 'alt'"
    >
      <input
        #altField
        ndsInput
        [placeholder]="labels().fields.alt"
        [attr.aria-label]="labels().fields.alt"
        (keydown)="onFieldKeydown($event, 'alt')"
      />
      <button ndsButton size="sm" type="button" (click)="confirmAlt()">
        {{ labels().fields.altConfirm }}
      </button>
    </div>

    <div #content class="nds-editor-content" data-slot="editor-content"></div>
  `,
})
export class EditorComponent implements AfterViewInit, OnDestroy {
  /**
   * Conteúdo inicial, em HTML. Passa por `DOMPurify` antes de chegar à lib: o
   * Tiptap monta o documento a partir de um nó criado por `innerHTML`, e
   * `<img onerror>` dispara mesmo em nó solto do documento. O esquema do
   * ProseMirror descartaria o nó depois — tarde demais.
   */
  readonly content = input<string>('');

  /** Quando falso, o conteúdo vira leitura e a barra deixa de agir. */
  readonly editable = input(true, { transform: booleanAttribute });

  /** Conjunto de botões exposto na barra. */
  readonly preset = input<EditorPreset>('advanced');

  /**
   * Nome acessível da barra, da área editável, de cada bloco, de cada botão e
   * dos campos. Não há texto visível de onde deduzi-los.
   */
  readonly labels = input.required<EditorLabels>();

  /**
   * De onde sai o `src` da imagem — a decisão de ARMAZENAMENTO, que é de quem
   * consome o design system, não dele.
   *
   * Recebe o arquivo escolhido e devolve a URL a gravar no documento: envio a
   * um bucket, a um CDN, a uma rota da própria aplicação. Devolver `null`
   * cancela a inserção (envio recusado, arquivo grande demais, formato fora da
   * política).
   */
  readonly resolveImage = input<(file: File) => Promise<string | null>>(imageAsDataUrl);

  /**
   * Escreve o texto alternativo a partir da imagem — o lugar de ligar um modelo
   * de visão, uma API de descrição, um serviço próprio.
   *
   * Recebe o `src` já gravado e o arquivo QUANDO existe: imagem colada de outra
   * página chega só como endereço. É chamado DEPOIS de inserir, nunca antes —
   * descrever leva segundos e às vezes falha, e prender a imagem esperando
   * trocaria uma lacuna de acessibilidade por uma de responsividade.
   *
   * NÃO dispensa revisão: a IA propõe, a pessoa confere pelo botão de texto
   * alternativo.
   */
  readonly describeImage = input<
    ((file: File | null, src: string) => Promise<string | null>) | undefined
  >(undefined);

  /**
   * Disparado a cada mudança do DOCUMENTO, com o HTML atual.
   *
   * `update` e não `transaction`: mover o cursor gera transação e não muda o
   * conteúdo, e um formulário que gravasse a cada movimento de cursor
   * escreveria dezenas de versões idênticas.
   */
  readonly changed = output<string>();

  private readonly hostRef = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly injector = inject(Injector);

  private readonly toolbarRef = viewChild.required<ElementRef<HTMLElement>>('toolbar');
  private readonly contentRef = viewChild.required<ElementRef<HTMLElement>>('content');
  private readonly formulaFieldRef =
    viewChild.required<ElementRef<HTMLInputElement>>('formulaField');
  private readonly linkFieldRef = viewChild.required<ElementRef<HTMLInputElement>>('linkField');
  private readonly altFieldRef = viewChild.required<ElementRef<HTMLInputElement>>('altField');

  /**
   * Ids das linhas, únicos por instância.
   *
   * Duas instâncias na mesma página com o mesmo id fazem `aria-controls`
   * resolver para a primeira do documento.
   */
  protected readonly rowIds = ((n: number) => ({
    formula: `nds-editor-formula-${n}`,
    link: `nds-editor-link-${n}`,
    alt: `nds-editor-alt-${n}`,
  }))((instanceCount += 1));

  protected readonly formulaPlaceholder = '\\frac{a}{b}';
  protected readonly linkPlaceholder = 'https://exemplo.com';

  /**
   * Relógio do documento.
   *
   * `transaction` cobre o que `update` não cobre: mover o cursor não muda o
   * documento, mas muda a marca ativa. Ligar só em `update` deixava o botão
   * aceso depois de sair de um trecho em negrito. Tudo que a barra desenha
   * deriva deste contador, que sobe a cada transação.
   */
  private readonly revision = signal(0);
  private readonly instance = signal<Editor | null>(null);

  protected readonly openRow = signal<FieldRow>(null);
  protected readonly linkInvalid = signal(false);

  protected readonly blocks = computed<ToolbarBlock[]>(() => [
    ...PRESETS[this.preset()],
    // A fórmula fecha a barra nos dois conjuntos, em bloco próprio.
    plain(['formula']),
  ]);

  // ─── Contexto que os alternadores leem ─────────────────────────────────────

  /** Ações ligadas AGORA, do ponto de vista do editor. */
  readonly activeToggles = computed<string[]>(() => {
    this.revision();
    const editor = this.instance();
    if (!editor) return [];
    return (Object.keys(ACTIONS) as EditorAction[]).filter((a) => ACTIONS[a].isOn?.(editor));
  });

  /**
   * A barra segue habilitada em somente leitura, como no Vanilla: o comando
   * simplesmente não se aplica. Desabilitar tudo esconderia a diferença entre
   * "não posso agora" e "não existe".
   */
  readonly groupDisabled = computed(() => false);
  readonly groupOrientation = computed<DataOrientation>(() => 'horizontal');
  readonly groupInitialized = computed(() => true);

  // ─── Estado que o template lê ──────────────────────────────────────────────

  /** Há link sob o cursor? Decide o botão de tirar. */
  protected readonly linkActive = computed(() => {
    this.revision();
    return this.instance()?.isActive('link') ?? false;
  });

  protected isNodeActive(node: string): boolean {
    this.revision();
    return this.instance()?.isActive(node) ?? false;
  }

  protected isBlocked(action: EditorAction): boolean {
    this.revision();
    const editor = this.instance();
    const can = ACTIONS[action].can;
    if (!editor || !can) return false;
    return !can(editor);
  }

  /**
   * `data-state` só nos botões simples que têm estado — hoje, o de link.
   *
   * O alternador recebe o seu do `NdsToggle`, que o deriva do contexto de
   * grupo. Aqui a origem é a mesma: o editor.
   */
  protected stateOf(action: EditorAction): string | null {
    this.revision();
    const editor = this.instance();
    const isOn = ACTIONS[action].isOn;
    if (!editor || !isOn) return null;
    return isOn(editor) ? 'on' : 'off';
  }

  /** `aria-expanded` só nos três botões que abrem linha; nos demais, ausente. */
  protected expandedOf(action: EditorAction): string | null {
    const row = rowOf(action);
    if (!row) return null;
    return this.openRow() === row ? 'true' : 'false';
  }

  protected controlsOf(action: EditorAction): string | null {
    const row = rowOf(action);
    return row ? this.rowIds[row] : null;
  }

  // ─── Ciclo de vida ─────────────────────────────────────────────────────────

  /** O HTML que já foi aplicado ao documento, para não reaplicá-lo à toa. */
  private appliedContent = '';
  private editor: Editor | null = null;
  private readonly descriptions = new Map<string, Promise<string | null>>();

  constructor() {
    // `setEditable` e não recriação: trocar o modo mantém o documento, o
    // histórico e a seleção.
    effect(() => {
      const editable = this.editable();
      this.instance()?.setEditable(editable);
    });

    // Conteúdo novo vindo de fora substitui o documento. O primeiro valor já
    // entrou pelo construtor da lib, e por isso a comparação com o aplicado.
    effect(() => {
      const html = this.content();
      const editor = this.instance();
      if (!editor || html === this.appliedContent) return;
      this.appliedContent = html;
      editor.commands.setContent(DOMPurify.sanitize(html));
    });
  }

  ngAfterViewInit(): void {
    const labels = this.labels();
    this.appliedContent = this.content();

    const editor = new Editor({
      element: this.contentRef().nativeElement,
      editable: this.editable(),
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
        // subitem, e sem isto o Enter no meio de um item cria irmão em vez de
        // filho.
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
        // O caminho suportado para escrever atributo no elemento editável: a
        // lib recria esse nó, e `setAttribute` de fora seria desfeito.
        attributes: { 'aria-label': labels.editorField },

        // Colar e ARRASTAR arquivo de imagem passam pelo mesmo caminho do
        // botão — mesmo `resolveImage`, mesma descrição, mesmo `alt`. Sem isto,
        // medido: colar arquivo não fazia nada e arrastar também não.
        handlePaste: (_view, event) => {
          const files = imageFilesOf(event.clipboardData);
          if (files.length === 0) return false;
          for (const file of files) void this.insertImageFile(file);
          return true;
        },

        handleDrop: (view, event, _slice, moved) => {
          // `moved` é arrasto INTERNO — alguém remanejando o que já está no
          // documento. Interceptar isso apagaria o recurso de reordenar.
          if (moved) return false;
          const files = imageFilesOf((event as DragEvent).dataTransfer);
          if (files.length === 0) return false;
          // A imagem entra ONDE se soltou, não onde o cursor estava.
          const target = view.posAtCoords({
            left: (event as DragEvent).clientX,
            top: (event as DragEvent).clientY,
          });
          if (target) editor.commands.setTextSelection(target.pos);
          for (const file of files) void this.insertImageFile(file);
          return true;
        },
      },
      content: this.appliedContent ? DOMPurify.sanitize(this.appliedContent) : undefined,
    });

    editor.on('transaction', () => this.revision.update((n) => n + 1));
    // Imagem colada entra por fora deste componente, então a varredura é o que
    // a alcança. `update` e não `transaction`: só mudança de DOCUMENTO traz
    // imagem nova.
    editor.on('update', () => this.describePending());
    editor.on('update', () => this.changed.emit(editor.getHTML()));

    this.editor = editor;
    this.instance.set(editor);

    const host = this.hostRef.nativeElement as EditorHostElement;
    host.editor = editor;
    host.insertImage = (file: File) => this.insertImageFile(file);

    // A primeira parada de tabulação da barra, depois de o template existir.
    afterNextRender(() => this.resetRoving(), { injector: this.injector });
  }

  ngOnDestroy(): void {
    this.editor?.destroy();
    this.editor = null;
  }

  // ─── Ações da barra ────────────────────────────────────────────────────────

  /** Chamada pelos alternadores, pelo contexto de grupo. */
  runAction(action: EditorAction): void {
    const editor = this.editor;
    if (!editor) return;
    ACTIONS[action].run?.(editor);
    // A barra desenha o que o EDITOR diz, e o comando pode não se aplicar
    // (somente leitura, seleção sem bloco). Subir a revisão aqui garante que a
    // pintura seja recalculada mesmo quando nada mudou no documento.
    this.revision.update((n) => n + 1);
  }

  protected onButtonClick(action: EditorAction): void {
    const row = rowOf(action);
    if (row) {
      this.toggleRow(row);
      return;
    }
    if (action === 'image') {
      this.pickImage();
      return;
    }
    this.runAction(action);
  }

  /**
   * O seletor de arquivo é criado a cada clique e descartado depois: um input
   * guardado entre usos mantém o arquivo anterior, e escolher o MESMO arquivo
   * duas vezes seguidas não dispara `change`.
   */
  private pickImage(): void {
    const picker = document.createElement('input');
    picker.type = 'file';
    picker.accept = 'image/*';
    picker.addEventListener('change', () => {
      const file = picker.files?.[0];
      if (file) void this.insertImageFile(file);
    });
    picker.click();
  }

  // ─── Linhas de entrada ─────────────────────────────────────────────────────

  private fieldOf(row: Exclude<FieldRow, null>): HTMLInputElement {
    if (row === 'formula') return this.formulaFieldRef().nativeElement;
    if (row === 'link') return this.linkFieldRef().nativeElement;
    return this.altFieldRef().nativeElement;
  }

  /**
   * O que o campo mostra ao abrir.
   *
   * É o que torna a linha EDITÁVEL e não só um formulário de inserção: com o
   * cursor dentro de um link, abrir mostra o endereço atual; sobre uma fórmula,
   * o LaTeX dela — o único caminho para corrigir uma, já que o que se vê na
   * tela é o resultado renderizado.
   */
  private valueOnOpen(row: Exclude<FieldRow, null>): string {
    const editor = this.editor;
    if (!editor) return '';
    if (row === 'formula') {
      return editor.isActive('inlineMath')
        ? ((editor.getAttributes('inlineMath').latex as string | undefined) ?? '')
        : '';
    }
    if (row === 'link') return (editor.getAttributes('link').href as string | undefined) ?? '';
    return (editor.getAttributes('image').alt as string | undefined) ?? '';
  }

  private toggleRow(row: Exclude<FieldRow, null>): void {
    this.setRow(this.openRow() === row ? null : row);
  }

  /** Só uma linha aberta por vez — as três ocupam o mesmo lugar na moldura. */
  private setRow(row: FieldRow): void {
    this.openRow.set(row);
    this.linkInvalid.set(false);
    if (!row) return;
    // O campo é preenchido a cada abertura, e não guardado entre uma e outra:
    // texto abandonado por Escape reapareceria na abertura seguinte, aplicado a
    // outro trecho do documento.
    //
    // `afterNextRender` porque quem esconde a linha é um binding: focar antes
    // de a renderização acontecer é focar um elemento ainda escondido, e o foco
    // fica no `body`.
    const value = this.valueOnOpen(row);
    afterNextRender(
      () => {
        const field = this.fieldOf(row);
        field.value = value;
        field.focus();
        field.select();
      },
      { injector: this.injector },
    );
  }

  protected onFieldKeydown(event: KeyboardEvent, row: Exclude<FieldRow, null>): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      if (row === 'formula') this.confirmFormula();
      else if (row === 'link') this.confirmLink();
      else this.confirmAlt();
      return;
    }
    if (event.key !== 'Escape') return;
    this.setRow(null);
    this.focusAction(row === 'alt' ? 'imageAlt' : row);
  }

  protected confirmFormula(): void {
    const editor = this.editor;
    if (!editor) return;
    const latex = this.fieldOf('formula').value.trim();
    if (!latex) return;
    // `insertInlineMath` guarda o LaTeX num atributo do nó e deixa o KaTeX
    // renderizar. O texto nunca vira HTML: não há caminho de injeção por aqui,
    // e fórmula inválida cai no ramo de erro da própria lib.
    //
    // SEM `.focus()` na corrente, ao contrário dos botões de marca: o comando
    // de foco da lib chega depois do fim desta função e tomaria de volta o foco
    // que se devolve ao botão. A inserção não precisa dele — a seleção guardada
    // no documento é o ponto de entrada.
    //
    // Fórmula sob o cursor se ATUALIZA; fora dela, insere. Sem esta distinção,
    // corrigir uma fórmula criava uma segunda ao lado da errada.
    if (editor.isActive('inlineMath')) editor.chain().updateInlineMath({ latex }).run();
    else editor.chain().insertInlineMath({ latex }).run();
    this.setRow(null);
    this.focusAction('formula');
  }

  protected confirmLink(): void {
    const editor = this.editor;
    if (!editor) return;
    const raw = this.fieldOf('link').value.trim();
    // Campo vazio TIRA o link do trecho — é o caminho de desfazer, e não há
    // botão separado para ele.
    if (!raw) {
      editor.chain().extendMarkRange('link').unsetLink().run();
    } else {
      // Endereço sem esquema é o que a pessoa digita: `exemplo.com`. Completar
      // com `https://` antes de validar evita reprovar o caso comum.
      const url = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
      if (!isAllowedLink(url)) {
        this.linkInvalid.set(true);
        return;
      }
      this.linkInvalid.set(false);
      editor.chain().extendMarkRange('link').setLink({ href: url }).run();
    }
    this.setRow(null);
    this.focusAction('link');
  }

  protected removeLink(): void {
    // `extendMarkRange` primeiro: o cursor costuma estar NO MEIO do link, e sem
    // estender o trecho a marca sairia só do pedaço sob o cursor — partindo o
    // link em dois em vez de removê-lo.
    this.editor?.chain().extendMarkRange('link').unsetLink().run();
    this.setRow(null);
    this.focusAction('link');
  }

  protected confirmAlt(): void {
    // Aqui `updateAttributes` é o certo, ao contrário do caminho da IA: a
    // imagem está selecionada AGORA, é ela que se edita, e o texto é de quem
    // está olhando para ela.
    const alt = this.fieldOf('alt').value.trim();
    this.editor?.chain().focus().updateAttributes('image', { alt }).run();
    this.setRow(null);
    this.focusAction('imageAlt');
  }

  /** Devolve o foco ao botão que abriu a linha. */
  private focusAction(action: EditorAction): void {
    const button = this.toolbarRef().nativeElement.querySelector<HTMLButtonElement>(
      `[data-action="${action}"]`,
    );
    button?.focus();
  }

  // ─── Imagem ────────────────────────────────────────────────────────────────

  private async insertImageFile(file: File): Promise<boolean> {
    const editor = this.editor;
    if (!editor) return false;
    const src = await this.resolveImage()(file);
    // `null` é recusa de quem consome — envio negado, arquivo grande demais,
    // formato fora da política. Não é erro, e não vira alerta.
    if (!src) return false;

    // O `alt` provisório é o nome do arquivo: descreve o arquivo, não a imagem.
    // É o que segura a vaga até a descrição chegar — e o que fica se ela não
    // vier. Imagem sem `alt` nenhum reprovaria no axe e sumiria do leitor de
    // tela sem deixar rastro.
    editor.chain().focus().setImage({ src, alt: file.name }).run();

    this.describe(file, src);
    return true;
  }

  /**
   * Escreve o `alt` da imagem de um `src` conhecido, onde quer que ela esteja.
   *
   * Não usa `updateAttributes`, que age sobre a SELEÇÃO: quando a descrição
   * chega, segundos depois, o cursor já andou — e o atributo iria parar em
   * outra imagem, ou em lugar nenhum. Aqui a imagem é reencontrada pelo `src`.
   */
  private setAltBySrc(src: string, alt: string): void {
    const editor = this.editor;
    if (!editor) return;
    const { state } = editor;
    let position = -1;
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.src === src) position = pos;
    });
    if (position < 0) return;
    editor.view.dispatch(state.tr.setNodeAttribute(position, 'alt', alt));
  }

  /**
   * O cache é por `src` e guarda a PROMESSA, não o fato de ter tentado.
   *
   * A diferença aparece na mesma imagem inserida duas vezes: com um conjunto de
   * "já tentadas", a segunda ficava para sempre com o `alt` provisório, porque
   * o pedido fora feito e o resultado tinha ido para a primeira. Guardando a
   * promessa, a segunda cópia recebe a MESMA descrição sem um segundo pedido.
   */
  private describe(file: File | null, src: string): void {
    const describeImage = this.describeImage();
    if (!describeImage) return;
    let request = this.descriptions.get(src);
    if (!request) {
      // A falha vira `null` aqui, e não uma promessa rejeitada: quem descreve
      // não derruba a edição, e a imagem segue com o `alt` provisório e o botão
      // de texto alternativo à mão.
      request = describeImage(file, src).catch(() => null);
      this.descriptions.set(src, request);
    }
    void request.then((description) => {
      if (description) this.setAltBySrc(src, description);
    });
  }

  /**
   * Imagens já COM `src` e sem descrição — as que chegaram por colagem.
   *
   * Colar uma imagem de outra página insere `<img src>` sem `alt` nenhum, por
   * um caminho que não passa por `insertImageFile`: quem monta o nó é o próprio
   * ProseMirror, a partir do HTML da área de transferência.
   */
  private describePending(): void {
    const editor = this.editor;
    if (!editor || !this.describeImage()) return;
    const pending: string[] = [];
    editor.state.doc.descendants((node) => {
      const { src, alt } = node.attrs as { src?: string; alt?: string };
      // O cache corta a reentrada: escrever o `alt` dispara outra atualização, e
      // uma recusa não pode virar pedido a cada tecla digitada.
      if (node.type.name === 'image' && src && !alt && !this.descriptions.has(src)) {
        pending.push(src);
      }
    });
    // Sem arquivo: a imagem colada de outra página tem endereço e nada mais.
    for (const src of pending) this.describe(null, src);
  }

  // ─── Arrastar na moldura ───────────────────────────────────────────────────

  protected onDragOver(event: DragEvent): void {
    if (isFileDrag(event.dataTransfer)) event.preventDefault();
  }

  protected onHostDrop(event: DragEvent): void {
    // Solto DENTRO do editável, quem já tratou foi a lib, pelo `handleDrop` —
    // ela previne o padrão, e é essa marca que evita inserir duas vezes.
    if (event.defaultPrevented) return;
    const files = imageFilesOf(event.dataTransfer);
    if (files.length === 0) return;
    event.preventDefault();
    // Solto fora do texto, a imagem vai para o fim do documento — é o lugar
    // mais próximo do que se apontou, e o único definido.
    this.editor?.commands.focus('end');
    for (const file of files) void this.insertImageFile(file);
  }

  // ─── Navegação por seta na barra ───────────────────────────────────────────
  //
  // `role="toolbar"` promete uma parada de tabulação só, com as setas andando
  // dentro — inclusive atravessando os grupos, que abriram mão do teclado
  // justamente para isto. Sem a navegação, a barra promete um contrato que não
  // cumpre, e o leitor de tela anuncia o papel de qualquer jeito.

  private focusables(): HTMLButtonElement[] {
    return Array.from(
      this.toolbarRef().nativeElement.querySelectorAll<HTMLButtonElement>('button'),
    ).filter(
      // `offsetParent` nulo cobre o botão escondido E o bloco contextual
      // fechado em volta dele — perguntar só pelo `hidden` do próprio botão
      // deixaria as setas pousarem nos seis botões de tabela fora da tabela.
      (b) => !b.disabled && b.offsetParent !== null,
    );
  }

  private setRoving(target: HTMLButtonElement): void {
    for (const b of this.toolbarRef().nativeElement.querySelectorAll<HTMLButtonElement>('button')) {
      b.tabIndex = b === target ? 0 : -1;
    }
  }

  private resetRoving(): void {
    const first = this.focusables()[0];
    if (first) this.setRoving(first);
  }

  protected onToolbarKeydown(event: KeyboardEvent): void {
    const list = this.focusables();
    const current = list.indexOf(document.activeElement as HTMLButtonElement);
    if (current < 0) return;
    let next: number;
    if (event.key === 'ArrowRight') next = (current + 1) % list.length;
    else if (event.key === 'ArrowLeft') next = (current - 1 + list.length) % list.length;
    else if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = list.length - 1;
    else return;
    event.preventDefault();
    this.setRoving(list[next]);
    list[next].focus();
  }

  /**
   * Clicar passa a ordem de tabulação para quem foi usado — senão o Tab
   * devolveria o foco a um botão diferente do último tocado.
   */
  protected onToolbarClick(event: Event): void {
    const button = (event.target as HTMLElement).closest('button');
    if (button && !button.disabled) this.setRoving(button);
  }
}

/** Qual linha de entrada este botão abre, se abre alguma. */
function rowOf(action: EditorAction): Exclude<FieldRow, null> | null {
  if (action === 'formula') return 'formula';
  if (action === 'link') return 'link';
  if (action === 'imageAlt') return 'alt';
  return null;
}
