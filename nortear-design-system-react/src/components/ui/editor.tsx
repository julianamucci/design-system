// ─── Editor — texto rico sobre @tiptap/core ──────────────────────────────────
//
// `EditorOptions.element` do Tiptap aceita um `Element` qualquer, então o núcleo
// monta nas cinco stacks sem binding de framework: `@tiptap/react` é
// conveniência de ciclo de vida, não requisito. Aqui o ciclo de vida é o
// `useEffect` — a instância nasce com o nó montado e morre na limpeza.
//
// A BARRA É NOSSA. Nenhum dos pacotes `@tiptap/*` traz botão, ícone ou barra: a
// lib é o motor do documento. O que ela presetea é CAPACIDADE — o `StarterKit`
// liga por padrão título, listas, citação, código, bloco de código, linha
// divisória, link, sublinhado e desfazer/refazer. Os conjuntos abaixo escolhem
// o que dessa capacidade vira botão.
//
// A folha do KaTeX é importada AQUI, e não na `globals.css`, de propósito: são
// dezenas de kB de CSS mais os arquivos de fonte, e quem não usa o editor não
// deve pagar por eles. Importada no módulo, ela viaja no mesmo pedaço que o
// editor e some do pacote das páginas que não o carregam.

import type * as React from 'react';
import {
  Fragment,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { Editor as TiptapEditor } from '@tiptap/core';
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
  type LucideIcon,
} from 'lucide-react';
import 'katex/dist/katex.min.css';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toggle } from '@/components/ui/toggle';

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
   * e sem nome é violação de `aria-input-field-name`. Não há rótulo visível a
   * que apontar: a moldura inteira é o campo.
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
 * O que a story e o teste alcançam por `ref`.
 *
 * Sem isto só o DOM ficaria acessível — e o estado que importa (marca ativa,
 * documento, transação) vive na instância da lib, não no DOM.
 */
export type EditorHandle = {
  /** A moldura. É por ela que o teste encontra a instância certa na página. */
  root: HTMLDivElement | null;
  editor: TiptapEditor | null;
  /**
   * Insere um arquivo de imagem passando pelo `resolveImage` configurado.
   *
   * É o mesmo caminho do botão, exposto: colar e arrastar usam exatamente isto
   * por dentro, e é o que permite verificar a costura de armazenamento sem
   * abrir o seletor de arquivo do sistema.
   *
   * Devolve `false` quando o resolvedor recusa.
   */
  insertImage: (file: File) => Promise<boolean>;
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
   * É chamado DEPOIS de inserir, nunca antes: descrever leva segundos e às
   * vezes falha, e prender a imagem esperando por isso trocaria uma lacuna de
   * acessibilidade por uma de responsividade. A imagem entra, a descrição chega
   * quando chegar — e NÃO dispensa revisão, que é o motivo de o botão de texto
   * alternativo aparecer com a imagem selecionada.
   */
  describeImage?: (file: File | null, src: string) => Promise<string | null>;
  /**
   * Disparado a cada mudança do DOCUMENTO, com o HTML atual.
   *
   * `update` e não `transaction`: mover o cursor gera transação e não muda o
   * conteúdo, e um formulário que gravasse a cada movimento de cursor
   * escreveria dezenas de versões idênticas.
   */
  onChange?: (html: string) => void;
  labels: EditorLabels;
  className?: string;
  ref?: React.Ref<EditorHandle>;
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

// ─── Tabela de ações ─────────────────────────────────────────────────────────
//
// Uma linha por botão, e três perguntas que a barra faz ao editor: como se
// desenha, se está ligada, se ainda pode. Espalhar isso por `if` de montagem é
// o que deixa o ícone e o valor divergirem.

type Action = {
  icon: LucideIcon;
  /** Ligada agora? Ausente = ação sem estado (divisória, desfazer). */
  isOn?: (e: TiptapEditor) => boolean;
  /** O que fazer no clique. Ausente = a ação abre uma linha de entrada. */
  run?: (e: TiptapEditor) => void;
  /** Ainda é possível? Ausente = sempre. */
  can?: (e: TiptapEditor) => boolean;
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
function currentWidth(e: TiptapEditor): number {
  const stored = e.getAttributes('image').width as number | null | undefined;
  if (typeof stored === 'number') return stored;
  const img = e.view.dom.querySelector('.ProseMirror-selectednode img');
  return img ? Math.round(img.getBoundingClientRect().width) : 0;
}

function adjustWidth(e: TiptapEditor, step: number): void {
  const nextWidth = Math.max(MIN_WIDTH, currentWidth(e) + step);
  e.chain().focus().updateAttributes('image', { width: nextWidth }).run();
}

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
  // `{ textAlign }` e não um nome de nó. O bloco é de escolha única — um
  // parágrafo tem um alinhamento só.
  alignLeft: {
    icon: AlignLeft,
    isOn: (e) => e.isActive({ textAlign: 'left' }),
    run: (e) => void e.chain().focus().setTextAlign('left').run(),
  },
  alignCenter: {
    icon: AlignCenter,
    isOn: (e) => e.isActive({ textAlign: 'center' }),
    run: (e) => void e.chain().focus().setTextAlign('center').run(),
  },
  alignRight: {
    icon: AlignRight,
    isOn: (e) => e.isActive({ textAlign: 'right' }),
    run: (e) => void e.chain().focus().setTextAlign('right').run(),
  },
  alignJustify: {
    icon: AlignJustify,
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
    // 3×3 com cabeçalho: uma tabela de exemplo grande o bastante para mostrar o
    // que ela é, e pequena o bastante para caber no que já está escrito.
    run: (e) =>
      void e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },

  // ─── Só com o cursor dentro de uma tabela ──────────────────────────────────
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

  // As três que não agem sozinhas: abrem uma linha, um seletor de arquivo, e
  // esperam. `run` fica de fora porque a ação depende do componente — do
  // resolvedor de imagem que quem consome escolheu, ou do texto da linha.
  link: { icon: LinkIcon, isOn: (e) => e.isActive('link') },
  image: { icon: ImageIcon },
  imageAlt: { icon: Captions },

  // ─── Tamanho da imagem, pelo teclado ───────────────────────────────────────
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
    // Volta ao tamanho natural apagando o atributo, e não gravando a medida
    // original: gravada, ela congelaria a imagem no tamanho de HOJE, e a folha
    // deixaria de poder encolhê-la numa moldura estreita.
    run: (e) => void e.chain().focus().updateAttributes('image', { width: null }).run(),
    can: (e) => e.getAttributes('image').width != null,
  },
  formula: { icon: Sigma },
};

// ─── Composição da barra ─────────────────────────────────────────────────────

type Block =
  | {
      group: EditorGroup;
      /**
       * Exclusividade do bloco, para leitura: `single` onde as opções se
       * excluem, `multiple` onde acumulam.
       *
       * Aqui ela não é implementada, e isso é intencional — quem responde por
       * "qual está ligado" é a instância da lib, consultada a cada render. Um
       * estado próprio no grupo divergiria dela no primeiro movimento de cursor.
       */
      type: 'single' | 'multiple';
      actions: EditorAction[];
    }
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

/**
 * Esquemas de URL aceitos no link.
 *
 * A lib aceita DEZ por padrão: http, https, ftp, ftps, mailto, tel, callto,
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
      dom.append(img, handle);

      // O ícone é um componente do design system, então quem o desenha é o
      // React — uma raiz própria dentro da alça. Copiar o traço do lucide para
      // dentro deste arquivo faria o editor ser o único lugar do produto com um
      // ícone que não acompanha a biblioteca.
      const iconRoot: Root = createRoot(handle);
      iconRoot.render(<ArrowDownRightFromSquare />);

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
        destroy: () => {
          // Desmontar fora do ciclo de render: a lib destrói o nodeView de
          // dentro de um efeito do React, e desmontar uma raiz ali é erro em
          // tempo de execução.
          queueMicrotask(() => iconRoot.unmount());
        },
      };
    };
  },
});

/** Qual das três linhas de entrada está aberta. */
type FieldRow = 'formula' | 'link' | 'alt';

// ─── Componente ──────────────────────────────────────────────────────────────

export function Editor({
  content,
  editable = true,
  preset = 'advanced',
  resolveImage,
  describeImage,
  onChange,
  labels,
  className,
  ref,
}: EditorProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const fieldRef = useRef<HTMLInputElement | null>(null);
  const rowId = useId();

  const [editor, setEditor] = useState<TiptapEditor | null>(null);
  // A barra espelha a instância, então cada transação pede um novo desenho.
  // `transaction` e não `update`: mover o cursor não muda o documento, mas muda
  // a marca ativa — ligar só em `update` deixava o botão aceso depois de sair
  // de um trecho em negrito.
  const [, setRevision] = useState(0);

  const [openRow, setOpenRowState] = useState<FieldRow | null>(null);
  const [fieldValue, setFieldValue] = useState('');
  const [fieldInvalid, setFieldInvalid] = useState(false);

  // As opções que a instância consulta durante o uso vivem em refs: a instância
  // nasce uma vez só, e uma cópia congelada da primeira renderização usaria o
  // resolvedor de ontem.
  const resolveImageRef = useRef(resolveImage);
  const describeImageRef = useRef(describeImage);
  const onChangeRef = useRef(onChange);

  // Sem lista de dependências: a sincronização vale para TODA renderização, e
  // acontece depois do commit — escrever em ref durante o render é proibido.
  // Este efeito é declarado antes do que cria a instância, então os valores já
  // estão no lugar quando a lib começa a chamar de volta.
  useEffect(() => {
    resolveImageRef.current = resolveImage;
    describeImageRef.current = describeImage;
    onChangeRef.current = onChange;
  });

  /**
   * Descrições pedidas, por `src`, guardando a PROMESSA e não "já tentei".
   *
   * A diferença aparece na mesma imagem inserida duas vezes: com um conjunto de
   * "já tentadas", a segunda ficava para sempre com o `alt` provisório, porque
   * o pedido fora feito e o resultado tinha ido para a primeira. Guardando a
   * promessa, a segunda cópia recebe a MESMA descrição sem um segundo pedido.
   */
  const descriptions = useRef(new Map<string, Promise<string | null>>());
  const editorRef = useRef<TiptapEditor | null>(null);

  /**
   * Escreve o `alt` da imagem de um `src` conhecido, onde quer que ela esteja.
   *
   * Não usa `updateAttributes`, que age sobre a SELEÇÃO: quando a descrição
   * chega, segundos depois, o cursor já andou — e o atributo iria parar em
   * outra imagem, ou em lugar nenhum. Aqui a imagem é reencontrada pelo `src`.
   * Some do documento nesse meio-tempo? A função não faz nada, que é o certo.
   */
  const setAltBySrc = useCallback((src: string, alt: string): void => {
    const instance = editorRef.current;
    if (!instance) return;
    const { state } = instance;
    let position = -1;
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.src === src) position = pos;
    });
    if (position < 0) return;
    instance.view.dispatch(state.tr.setNodeAttribute(position, 'alt', alt));
  }, []);

  const describe = useCallback(
    (file: File | null, src: string): void => {
      const describeFile = describeImageRef.current;
      if (!describeFile) return;
      let request = descriptions.current.get(src);
      if (!request) {
        // A falha vira `null` aqui, e não uma promessa rejeitada: quem descreve
        // não derruba a edição, e a imagem segue com o `alt` provisório e o
        // botão de texto alternativo à mão.
        request = describeFile(file, src).catch(() => null);
        descriptions.current.set(src, request);
      }
      void request.then((description) => {
        if (description) setAltBySrc(src, description);
      });
    },
    [setAltBySrc],
  );

  const insertImageFile = useCallback(
    async (file: File): Promise<boolean> => {
      const instance = editorRef.current;
      if (!instance) return false;
      const src = await (resolveImageRef.current ?? imageAsDataUrl)(file);
      // `null` é recusa de quem consome — envio negado, arquivo grande demais,
      // formato fora da política. Não é erro, e não vira alerta.
      if (!src) return false;

      // O `alt` provisório é o nome do arquivo: descreve o arquivo, não a
      // imagem. É o que segura a vaga até a descrição chegar — e o que fica se
      // ela não vier. Imagem sem `alt` nenhum reprovaria no axe e sumiria do
      // leitor de tela sem deixar rastro.
      instance.chain().focus().setImage({ src, alt: file.name }).run();

      describe(file, src);
      return true;
    },
    [describe],
  );

  /**
   * Imagens já COM `src` e sem descrição — as que chegaram por colagem.
   *
   * Colar uma imagem de outra página insere `<img src>` sem `alt` nenhum, por
   * um caminho que não passa pelo componente: quem monta o nó é o próprio
   * ProseMirror, a partir do HTML da área de transferência.
   */
  const describePending = useCallback((): void => {
    const instance = editorRef.current;
    if (!instance || !describeImageRef.current) return;
    const pending: string[] = [];
    instance.state.doc.descendants((node) => {
      const { src, alt } = node.attrs as { src?: string; alt?: string };
      // O cache corta a reentrada: escrever o `alt` dispara outra atualização, e
      // uma recusa não pode virar pedido a cada tecla digitada.
      if (node.type.name === 'image' && src && !alt && !descriptions.current.has(src)) {
        pending.push(src);
      }
    });
    // Sem arquivo: a imagem colada de outra página tem endereço e nada mais.
    for (const src of pending) describe(null, src);
  }, [describe]);

  // ─── Instância ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const host = contentRef.current;
    if (!host) return;

    const instance = new TiptapEditor({
      element: host,
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
        // Lista de tarefas dentro de lista de tarefas: é como se escreve
        // subitem, e sem isto o Enter no meio de um item cria irmão em vez de
        // filho.
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
        //
        // O `role` vai JUNTO, e não fica por conta da lib: ela o injeta uma vez,
        // na criação, e qualquer `setProps` posterior SUBSTITUI o objeto de
        // atributos inteiro — `setEditable` faz exatamente isso. Sem o papel
        // declarado aqui, desligar a edição apagava o `textbox` do campo.
        attributes: { role: 'textbox', 'aria-label': labels.editorField },

        // Colar e ARRASTAR arquivo de imagem passam pelo mesmo caminho do botão
        // — mesmo `resolveImage`, mesma descrição, mesmo `alt`. Sem isto,
        // medido: colar arquivo não fazia nada e arrastar também não. Quem usa
        // não sabe que existe um botão para uma coisa que o resto da web
        // resolve arrastando.
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
          if (dropTarget) instance.commands.setTextSelection(dropTarget.pos);
          for (const file of files) void insertImageFile(file);
          return true;
        },
      },
      content: content ? DOMPurify.sanitize(content) : undefined,
    });

    const onTransaction = (): void => setRevision((n) => n + 1);
    const onUpdate = (): void => {
      describePending();
      onChangeRef.current?.(instance.getHTML());
    };
    instance.on('transaction', onTransaction);
    instance.on('update', onUpdate);

    editorRef.current = instance;
    setEditor(instance);

    return () => {
      instance.off('transaction', onTransaction);
      instance.off('update', onUpdate);
      instance.destroy();
      editorRef.current = null;
      setEditor(null);
    };
    // A instância nasce UMA vez. O que muda depois entra pelos efeitos abaixo —
    // recriá-la a cada troca de prop apagaria o documento e o histórico.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    editor?.setEditable(editable);
  }, [editor, editable]);

  // O nome acessível da área editável muda com o idioma da página. Reescrever
  // `editorProps` inteiro é o caminho suportado: `setAttribute` de fora seria
  // desfeito na primeira vez que a lib recriasse o nó.
  useEffect(() => {
    if (!editor) return;
    editor.setOptions({
      editorProps: {
        ...editor.options.editorProps,
        attributes: { role: 'textbox', 'aria-label': labels.editorField },
      },
    });
  }, [editor, labels.editorField]);

  // Conteúdo trocado por fora (o control da story, o exemplo da docs page)
  // reescreve o documento. Só quando o valor de fato muda: a cada tecla o
  // documento já é a verdade, e reescrevê-lo devolveria o cursor ao início.
  const appliedContent = useRef(content);
  useEffect(() => {
    if (!editor || content === appliedContent.current) return;
    appliedContent.current = content;
    editor.commands.setContent(content ? DOMPurify.sanitize(content) : '');
  }, [editor, content]);

  useImperativeHandle(
    ref,
    () => ({
      root: rootRef.current,
      editor,
      insertImage: insertImageFile,
    }),
    [editor, insertImageFile],
  );

  // ─── Arrastar para QUALQUER lugar da moldura ───────────────────────────────
  //
  // O `dragover` que a lib previne cobre só o elemento editável, e ele tem a
  // altura do TEXTO — o respiro abaixo da última linha, a barra e a borda são
  // moldura, não campo. Soltar ali escapava do editor e o navegador abria o
  // arquivo numa aba nova, que foi o relato.
  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    // Durante o arrasto o navegador esconde os arquivos por segurança:
    // `dataTransfer.files` vem VAZIO no `dragover`, e só em `drop` é que
    // aparece. Por isso a pergunta aqui é por `types`, e não pela lista.
    const isFileDrag = (dt: DataTransfer | null): boolean =>
      !!dt && Array.from(dt.types).includes('Files');

    const allowDrag = (e: Event): void => {
      if (isFileDrag((e as DragEvent).dataTransfer)) e.preventDefault();
    };

    const onDrop = (e: Event): void => {
      // Solto DENTRO do editável, quem já tratou foi a lib, pelo `handleDrop` —
      // ela previne o padrão, e é essa marca que evita inserir duas vezes.
      if (e.defaultPrevented) return;
      const files = imageFilesOf((e as DragEvent).dataTransfer);
      if (files.length === 0) return;
      e.preventDefault();
      // Solto fora do texto, a imagem vai para o fim do documento — é o lugar
      // mais próximo do que se apontou, e o único definido.
      editorRef.current?.commands.focus('end');
      for (const file of files) void insertImageFile(file);
    };

    node.addEventListener('dragenter', allowDrag);
    node.addEventListener('dragover', allowDrag);
    node.addEventListener('drop', onDrop);
    return () => {
      node.removeEventListener('dragenter', allowDrag);
      node.removeEventListener('dragover', allowDrag);
      node.removeEventListener('drop', onDrop);
    };
  }, [insertImageFile]);

  // ─── Linhas de entrada ─────────────────────────────────────────────────────

  /** O que o campo mostra ao abrir — é o que torna a linha EDITÁVEL. */
  const valueOnOpen = useCallback(
    (row: FieldRow): string => {
      if (!editor) return '';
      // Com o cursor numa fórmula, abrir mostra o LaTeX dela: é o único caminho
      // para corrigir uma, porque o que se vê na tela é o resultado renderizado.
      if (row === 'formula') {
        return editor.isActive('inlineMath')
          ? ((editor.getAttributes('inlineMath').latex as string | undefined) ?? '')
          : '';
      }
      if (row === 'link') return (editor.getAttributes('link').href as string | undefined) ?? '';
      return (editor.getAttributes('image').alt as string | undefined) ?? '';
    },
    [editor],
  );

  /** Só uma linha aberta por vez — as três ocupam o mesmo lugar na moldura. */
  const setOpenRow = useCallback(
    (row: FieldRow | null): void => {
      setOpenRowState(row);
      setFieldInvalid(false);
      // O campo é remontado a cada abertura, e não guardado entre uma e outra:
      // texto abandonado por Escape reapareceria na abertura seguinte, aplicado
      // a outro trecho do documento.
      setFieldValue(row ? valueOnOpen(row) : '');
    },
    [valueOnOpen],
  );

  const focusAction = useCallback((action: EditorAction): void => {
    toolbarRef.current
      ?.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)
      ?.focus();
  }, []);

  // Abrir a linha põe o foco no campo e seleciona o que já está lá — ver o
  // texto é o que permite julgá-lo antes de sobrescrevê-lo.
  useEffect(() => {
    if (!openRow) return;
    const field = fieldRef.current;
    field?.focus();
    field?.select();
  }, [openRow]);

  const insertFormula = useCallback((): void => {
    if (!editor) return;
    const latex = fieldValue.trim();
    if (!latex) return;
    // `insertInlineMath` guarda o LaTeX num atributo do nó e deixa o KaTeX
    // renderizar. O texto nunca vira HTML: não há caminho de injeção por aqui,
    // e fórmula inválida cai no ramo de erro da própria lib.
    //
    // SEM `.focus()` na corrente, ao contrário dos botões de marca. O comando de
    // foco da lib chega depois do fim desta função — medido: o `focus()` do
    // botão rodava primeiro e a lib o tomava de volta em seguida, deixando o
    // foco no texto quando a linha acabara de fechar.
    //
    // Fórmula sob o cursor se ATUALIZA; fora dela, insere. Sem esta distinção,
    // corrigir uma fórmula criava uma segunda ao lado da errada.
    if (editor.isActive('inlineMath')) editor.chain().updateInlineMath({ latex }).run();
    else editor.chain().insertInlineMath({ latex }).run();
    setOpenRow(null);
    focusAction('formula');
  }, [editor, fieldValue, focusAction, setOpenRow]);

  const applyLink = useCallback((): void => {
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
        setFieldInvalid(true);
        return;
      }
      setFieldInvalid(false);
      editor.chain().extendMarkRange('link').setLink({ href: url }).run();
    }
    setOpenRow(null);
    focusAction('link');
  }, [editor, fieldValue, focusAction, setOpenRow]);

  const applyAlt = useCallback((): void => {
    if (!editor) return;
    // Aqui `updateAttributes` é o certo, ao contrário do caminho da IA: a
    // imagem está selecionada AGORA, é ela que se edita, e o texto é de quem
    // está olhando para ela.
    editor.chain().focus().updateAttributes('image', { alt: fieldValue.trim() }).run();
    setOpenRow(null);
    focusAction('imageAlt');
  }, [editor, fieldValue, focusAction, setOpenRow]);

  const confirmRow = useCallback(
    (row: FieldRow): void => {
      if (row === 'formula') insertFormula();
      else if (row === 'link') applyLink();
      else applyAlt();
    },
    [applyAlt, applyLink, insertFormula],
  );

  const removeLink = useCallback((): void => {
    if (!editor) return;
    // `extendMarkRange` primeiro: o cursor costuma estar NO MEIO do link, e sem
    // estender o trecho a marca sairia só do pedaço sob o cursor — partindo o
    // link em dois em vez de removê-lo.
    editor.chain().extendMarkRange('link').unsetLink().run();
    setOpenRow(null);
    focusAction('link');
  }, [editor, focusAction, setOpenRow]);

  // ─── Seletor de arquivo ────────────────────────────────────────────────────

  const pickImage = useCallback((): void => {
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
  }, [insertImageFile]);

  // ─── Navegação por seta na barra ──────────────────────────────────────────
  //
  // `role="toolbar"` promete uma parada de tabulação só, com as setas andando
  // dentro — inclusive atravessando os grupos, que por isso são `role="group"`
  // e não barras aninhadas: duas navegações por seta disputariam o mesmo Tab, e
  // quem navega ficaria preso no primeiro grupo sem alcançar o resto.

  const allButtons = useCallback(
    (): HTMLButtonElement[] =>
      Array.from(toolbarRef.current?.querySelectorAll<HTMLButtonElement>('button') ?? []),
    [],
  );

  const focusables = useCallback(
    (): HTMLButtonElement[] =>
      allButtons().filter(
        // `offsetParent` nulo cobre o botão escondido E o bloco contextual
        // fechado em volta dele — perguntar só pelo `hidden` do próprio botão
        // deixaria as setas pousarem nos seis botões de tabela fora da tabela.
        (b) => !b.disabled && b.offsetParent !== null,
      ),
    [allButtons],
  );

  /**
   * Quem está na ordem de tabulação agora.
   *
   * Guardado aqui, e não deduzido do DOM: o primitivo de botão declara
   * `tabIndex={0}` como prop, então todo botão RECÉM-MONTADO nasce com 0 —
   * inclusive os contextuais que acabaram de aparecer. Perguntar ao DOM "quem
   * tem 0?" devolveria o primeiro deles, e o foco saltaria de bloco.
   */
  const rovingRef = useRef<HTMLButtonElement | null>(null);

  const setRoving = useCallback(
    (target: HTMLButtonElement): void => {
      rovingRef.current = target;
      for (const b of allButtons()) b.tabIndex = b === target ? 0 : -1;
    },
    [allButtons],
  );

  // Depois de cada desenho: exatamente um botão na ordem de tabulação. Sem
  // isto, o botão contextual que acabou de nascer entraria com `tabIndex` 0 e a
  // barra passaria a ter duas paradas.
  useLayoutEffect(() => {
    const list = focusables();
    if (list.length === 0) return;
    const current = rovingRef.current;
    setRoving(current && list.includes(current) ? current : list[0]);
  });

  const onToolbarKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>): void => {
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
    },
    [focusables, setRoving],
  );

  // Clicar passa a ordem de tabulação para quem foi usado — senão o Tab
  // devolveria o foco a um botão diferente do último tocado.
  const onToolbarClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>): void => {
      const btn = (event.target as HTMLElement).closest('button');
      if (btn && !btn.disabled) setRoving(btn);
    },
    [setRoving],
  );

  // ─── Desenho ───────────────────────────────────────────────────────────────

  const blocks = useMemo<Block[]>(
    () => [...PRESETS[preset], { buttons: ['formula'] as EditorAction[] }],
    [preset],
  );

  /** A linha que este botão abre, quando ele abre alguma. */
  const rowOf: Partial<Record<EditorAction, FieldRow>> = {
    formula: 'formula',
    link: 'link',
    imageAlt: 'alt',
  };

  /**
   * Com a edição desligada, a barra DEIXA DE AGIR.
   *
   * A guarda é aqui, e não na lib: `editor.commands` continua funcionando num
   * editor em leitura — `editable` vale para o que o teclado e o ponteiro fazem
   * no CAMPO, não para comando disparado por código. Medido: clicar em negrito
   * numa demonstração somente-leitura ligava a marca guardada e acendia o botão
   * sem mudar uma vírgula do HTML, contradizendo o que `states.readOnly`
   * promete — e o defeito ficava invisível para quem só olha o texto.
   *
   * Um ponto só porque a barra tem um despachante só: alternadores e botões
   * simples passam ambos por aqui, e as três linhas de entrada só abrem daqui.
   */
  const runAction = (action: EditorAction): void => {
    if (!editor || !editable) return;
    const row = rowOf[action];
    if (row) {
      setOpenRow(openRow === row ? null : row);
      return;
    }
    if (action === 'image') {
      pickImage();
      return;
    }
    ACTIONS[action].run?.(editor);
  };

  /** Botão que não alterna: divisória, desfazer, refazer, e os que abrem linha. */
  const plainButton = (action: EditorAction) => {
    const { icon: Icon, isOn, can } = ACTIONS[action];
    const row = rowOf[action];
    return (
      <Button
        key={action}
        type="button"
        variant="ghost"
        size="icon-sm"
        data-action={action}
        aria-label={labels.actions[action]}
        disabled={can && editor ? !can(editor) : undefined}
        data-state={isOn && editor ? (isOn(editor) ? 'on' : 'off') : undefined}
        aria-expanded={row ? openRow === row : undefined}
        aria-controls={row ? `${rowId}-${row}` : undefined}
        onClick={() => runAction(action)}
      >
        <Icon aria-hidden="true" />
      </Button>
    );
  };

  const fieldRows: Array<{
    row: FieldRow;
    slot: string;
    label: string;
    placeholder: string;
    confirmLabel: string;
  }> = [
    {
      row: 'formula',
      slot: 'editor-formula',
      label: labels.fields.formula,
      placeholder: '\\frac{a}{b}',
      confirmLabel: labels.fields.formulaConfirm,
    },
    {
      row: 'link',
      slot: 'editor-link',
      label: labels.fields.link,
      placeholder: 'https://exemplo.com',
      confirmLabel: labels.fields.linkConfirm,
    },
    {
      row: 'alt',
      slot: 'editor-alt',
      label: labels.fields.alt,
      placeholder: labels.fields.alt,
      confirmLabel: labels.fields.altConfirm,
    },
  ];

  return (
    <div ref={rootRef} data-slot="editor" className={cn('nds-editor', className)}>
      <div
        ref={toolbarRef}
        data-slot="editor-toolbar"
        className="nds-editor-toolbar"
        role="toolbar"
        aria-label={labels.toolbar}
        onKeyDown={onToolbarKeyDown}
        onClick={onToolbarClick}
      >
        {blocks.map((block, index) => (
          <Fragment key={'group' in block ? block.group : block.buttons.join('-')}>
            {/* O separador é decorativo: quem ouve recebe a divisão pelo nome de
                cada grupo, não por uma barrinha. */}
            {index > 0 && (
              <span className="nds-editor-toolbar-separator" aria-hidden="true" />
            )}
            {'group' in block ? (
              <div
                data-slot="toggle-group"
                className="nds-toggle-group"
                role="group"
                aria-label={labels.groups[block.group]}
                data-orientation="horizontal"
              >
                {block.actions.map((action) => {
                  const { icon: Icon, isOn } = ACTIONS[action];
                  return (
                    <Toggle
                      key={action}
                      data-value={action}
                      aria-label={labels.actions[action]}
                      pressed={Boolean(editor && isOn?.(editor))}
                      onClick={() => runAction(action)}
                    >
                      <Icon aria-hidden="true" />
                    </Toggle>
                  );
                })}
              </div>
            ) : (
              <>
                {block.buttons.map((action) => plainButton(action))}
                {block.contextual && (
                  // A caixa contextual entra no MESMO bloco, sem separador
                  // próprio: os botões extras pertencem ao assunto que o bloco
                  // já trata. Ela existe como caixa, e não como botões soltos
                  // com `hidden` cada um, para que aparecer e sumir seja um
                  // atributo só.
                  <span
                    data-slot="editor-toolbar-context"
                    data-node={block.contextual.node}
                    className="nds-editor-toolbar-context"
                    hidden={!editor?.isActive(block.contextual.node)}
                  >
                    {block.contextual.buttons.map((action) => plainButton(action))}
                  </span>
                )}
              </>
            )}
          </Fragment>
        ))}
      </div>

      {/* As três linhas que pedem um texto antes de agir.
          Ficam na moldura, e não num diálogo, porque escrever fórmula ou
          endereço é edição de texto: um modal tiraria o texto de vista
          justamente enquanto se decide o que a fórmula diz ou para onde o link
          vai. */}
      {fieldRows.map(({ row, slot, label, placeholder, confirmLabel }) => (
        <div
          key={row}
          id={`${rowId}-${row}`}
          data-slot={slot}
          className="nds-editor-field-row"
          hidden={openRow !== row}
        >
          <Input
            ref={openRow === row ? fieldRef : undefined}
            aria-label={label}
            placeholder={placeholder}
            value={openRow === row ? fieldValue : ''}
            aria-invalid={row === 'link' && fieldInvalid ? 'true' : undefined}
            onChange={(event) => setFieldValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                confirmRow(row);
              } else if (event.key === 'Escape') {
                setOpenRow(null);
                focusAction(row === 'alt' ? 'imageAlt' : row);
              }
            }}
          />
          <Button type="button" size="sm" onClick={() => confirmRow(row)}>
            {confirmLabel}
          </Button>
          {/* Tirar o link só existe quando há link: botão que não faz nada é
              ruído, e desabilitado seria pior — anuncia uma ação e nega logo em
              seguida. */}
          {row === 'link' && (
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              data-action="unlink"
              aria-label={labels.fields.linkRemove}
              hidden={!editor?.isActive('link')}
              onClick={removeLink}
            >
              <Unlink aria-hidden="true" />
            </Button>
          )}
        </div>
      ))}

      <div ref={contentRef} data-slot="editor-content" className="nds-editor-content" />
    </div>
  );
}
