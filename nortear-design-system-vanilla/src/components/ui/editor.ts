// ─── Editor — protótipo Vanilla ──────────────────────────────────────────────
//
// Editor de texto rico sobre `@tiptap/core`. NÃO é um componente entregue: é a
// medição que decide se o Tiptap entra no design system, e o que ele custa.
//
// Por que Vanilla primeiro: `EditorOptions.element` do Tiptap aceita um
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
};

// ─── Tabela de ações ─────────────────────────────────────────────────────────
//
// Uma linha por botão, e três perguntas que a barra faz ao editor: como se
// desenha, se está ligada, se ainda pode. Espalhar isso por `if` de montagem foi
// o que deixou `data-mark` e `data-value` divergirem na versão anterior.

type Acao = {
  icon: LucideIconNode[];
  /** Ligada agora? Ausente = ação sem estado (divisória, desfazer). */
  ativa?: (e: Editor) => boolean;
  /** O que fazer no clique. Ausente = a ação abre uma linha de entrada. */
  executar?: (e: Editor) => void;
  /** Ainda é possível? Ausente = sempre. */
  pode?: (e: Editor) => boolean;
};

const ico = (n: unknown): LucideIconNode[] => n as LucideIconNode[];

/**
 * Largura da imagem selecionada, em pixels.
 *
 * O atributo quando existe; a medida na TELA quando não. A segunda leitura é o
 * que dá um ponto de partida ao primeiro clique — imagem recém-inserida não tem
 * `width` gravado, e um passo sobre `null` teria de inventar um número.
 */
function larguraAtual(e: Editor): number {
  const gravada = e.getAttributes('image').width as number | null | undefined;
  if (typeof gravada === 'number') return gravada;
  const img = e.view.dom.querySelector('.ProseMirror-selectednode img');
  return img ? Math.round(img.getBoundingClientRect().width) : 0;
}

function ajustarLargura(e: Editor, passo: number): void {
  const nova = Math.max(LARGURA_MINIMA, larguraAtual(e) + passo);
  e.chain().focus().updateAttributes('image', { width: nova }).run();
}

const ACOES: Record<EditorAction, Acao> = {
  bold: {
    icon: ico(Bold),
    ativa: (e) => e.isActive('bold'),
    executar: (e) => void e.chain().focus().toggleBold().run(),
  },
  italic: {
    icon: ico(Italic),
    ativa: (e) => e.isActive('italic'),
    executar: (e) => void e.chain().focus().toggleItalic().run(),
  },
  underline: {
    icon: ico(Underline),
    ativa: (e) => e.isActive('underline'),
    executar: (e) => void e.chain().focus().toggleUnderline().run(),
  },
  strike: {
    icon: ico(Strikethrough),
    ativa: (e) => e.isActive('strike'),
    executar: (e) => void e.chain().focus().toggleStrike().run(),
  },
  code: {
    icon: ico(Code),
    ativa: (e) => e.isActive('code'),
    executar: (e) => void e.chain().focus().toggleCode().run(),
  },
  highlight: {
    icon: ico(Highlighter),
    ativa: (e) => e.isActive('highlight'),
    executar: (e) => void e.chain().focus().toggleHighlight().run(),
  },
  // Alinhamento é ATRIBUTO do bloco, não marca: por isso `isActive` recebe
  // `{ textAlign }` e não um nome de nó. O grupo é `single` — um parágrafo tem
  // um alinhamento só.
  alignLeft: {
    icon: ico(AlignLeft),
    ativa: (e) => e.isActive({ textAlign: 'left' }),
    executar: (e) => void e.chain().focus().setTextAlign('left').run(),
  },
  alignCenter: {
    icon: ico(AlignCenter),
    ativa: (e) => e.isActive({ textAlign: 'center' }),
    executar: (e) => void e.chain().focus().setTextAlign('center').run(),
  },
  alignRight: {
    icon: ico(AlignRight),
    ativa: (e) => e.isActive({ textAlign: 'right' }),
    executar: (e) => void e.chain().focus().setTextAlign('right').run(),
  },
  alignJustify: {
    icon: ico(AlignJustify),
    ativa: (e) => e.isActive({ textAlign: 'justify' }),
    executar: (e) => void e.chain().focus().setTextAlign('justify').run(),
  },
  h1: {
    icon: ico(Heading1),
    ativa: (e) => e.isActive('heading', { level: 1 }),
    executar: (e) => void e.chain().focus().toggleHeading({ level: 1 }).run(),
  },
  h2: {
    icon: ico(Heading2),
    ativa: (e) => e.isActive('heading', { level: 2 }),
    executar: (e) => void e.chain().focus().toggleHeading({ level: 2 }).run(),
  },
  h3: {
    icon: ico(Heading3),
    ativa: (e) => e.isActive('heading', { level: 3 }),
    executar: (e) => void e.chain().focus().toggleHeading({ level: 3 }).run(),
  },
  bulletList: {
    icon: ico(List),
    ativa: (e) => e.isActive('bulletList'),
    executar: (e) => void e.chain().focus().toggleBulletList().run(),
  },
  orderedList: {
    icon: ico(ListOrdered),
    ativa: (e) => e.isActive('orderedList'),
    executar: (e) => void e.chain().focus().toggleOrderedList().run(),
  },
  taskList: {
    icon: ico(ListTodo),
    ativa: (e) => e.isActive('taskList'),
    executar: (e) => void e.chain().focus().toggleTaskList().run(),
  },
  blockquote: {
    icon: ico(Quote),
    ativa: (e) => e.isActive('blockquote'),
    executar: (e) => void e.chain().focus().toggleBlockquote().run(),
  },
  codeBlock: {
    icon: ico(SquareCode),
    ativa: (e) => e.isActive('codeBlock'),
    executar: (e) => void e.chain().focus().toggleCodeBlock().run(),
  },
  horizontalRule: {
    icon: ico(Minus),
    executar: (e) => void e.chain().focus().setHorizontalRule().run(),
  },
  undo: {
    icon: ico(Undo2),
    executar: (e) => void e.chain().focus().undo().run(),
    pode: (e) => e.can().undo(),
  },
  redo: {
    icon: ico(Redo2),
    executar: (e) => void e.chain().focus().redo().run(),
    pode: (e) => e.can().redo(),
  },
  table: {
    icon: ico(TableIcon),
    // 3×3 com cabeçalho: uma tabela de exemplo grande o bastante para mostrar
    // o que ela é, e pequena o bastante para caber no que já está escrito.
    executar: (e) =>
      void e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },

  // ─── Só com o cursor dentro de uma tabela ───────────────────────────────────
  rowAfter: {
    icon: ico(Rows3),
    executar: (e) => void e.chain().focus().addRowAfter().run(),
  },
  columnAfter: {
    icon: ico(Columns3),
    executar: (e) => void e.chain().focus().addColumnAfter().run(),
  },
  deleteRow: {
    icon: ico(Minus),
    executar: (e) => void e.chain().focus().deleteRow().run(),
  },
  deleteColumn: {
    icon: ico(Minus),
    executar: (e) => void e.chain().focus().deleteColumn().run(),
  },
  headerRow: {
    icon: ico(PanelTop),
    executar: (e) => void e.chain().focus().toggleHeaderRow().run(),
  },
  deleteTable: {
    icon: ico(Trash2),
    executar: (e) => void e.chain().focus().deleteTable().run(),
  },

  // As três que não agem sozinhas: abrem uma linha, um seletor de arquivo, e
  // esperam. `executar` fica de fora porque a ação depende da fábrica — do
  // resolvedor de imagem que quem consome escolheu, ou do texto da linha.
  link: { icon: ico(LinkIcon), ativa: (e) => e.isActive('link') },
  image: { icon: ico(ImageIcon) },
  imageAlt: { icon: ico(Captions) },

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
    icon: ico(Shrink),
    executar: (e) => ajustarLargura(e, -PASSO_DE_LARGURA),
    pode: (e) => larguraAtual(e) > LARGURA_MINIMA,
  },
  imageLarger: {
    icon: ico(Expand),
    executar: (e) => ajustarLargura(e, PASSO_DE_LARGURA),
  },
  imageNatural: {
    icon: ico(RotateCcw),
    // Volta ao tamanho natural apagando o atributo, e não gravando a medida
    // original: gravada, ela congelaria a imagem no tamanho de HOJE, e a folha
    // deixaria de poder encolhê-la numa moldura estreita.
    executar: (e) => void e.chain().focus().updateAttributes('image', { width: null }).run(),
    pode: (e) => e.getAttributes('image').width != null,
  },
  formula: { icon: ico(Sigma) },
};

// ─── Composição da barra ─────────────────────────────────────────────────────

type Bloco =
  | { grupo: EditorGroup; type: 'single' | 'multiple'; acoes: EditorAction[] }
  | {
      botoes: EditorAction[];
      /**
       * Nó que precisa estar sob o cursor para o bloco aparecer. Ausente = o
       * bloco está sempre lá.
       */
      contextual?: string;
    };

/**
 * O que cada conjunto mostra.
 *
 * `single` onde as opções se excluem — um parágrafo é H1 OU H2, e está numa
 * lista com marcador OU numerada. `multiple` onde acumulam: negrito E itálico
 * no mesmo trecho, citação contendo bloco de código.
 */
const PRESETS: Record<EditorPreset, Bloco[]> = {
  basic: [
    { grupo: 'marks', type: 'multiple', acoes: ['bold', 'italic', 'strike'] },
    { grupo: 'lists', type: 'single', acoes: ['bulletList', 'orderedList'] },
    { botoes: ['link', 'undo', 'redo'] },
  ],
  advanced: [
    {
      grupo: 'marks',
      type: 'multiple',
      acoes: ['bold', 'italic', 'underline', 'strike', 'code', 'highlight'],
    },
    { grupo: 'headings', type: 'single', acoes: ['h1', 'h2', 'h3'] },
    {
      grupo: 'align',
      type: 'single',
      acoes: ['alignLeft', 'alignCenter', 'alignRight', 'alignJustify'],
    },
    { grupo: 'lists', type: 'single', acoes: ['bulletList', 'orderedList', 'taskList'] },
    { grupo: 'blocks', type: 'multiple', acoes: ['blockquote', 'codeBlock'] },
    { botoes: ['link', 'image', 'table', 'horizontalRule', 'undo', 'redo'] },
    // Bloco CONTEXTUAL: seis botões que só existem dentro de uma tabela. Fora
    // dela some inteiro — barra com seis botões inertes é ruído permanente
    // para uma capacidade que a maioria dos documentos nunca usa.
    {
      contextual: 'image',
      botoes: ['imageAlt', 'imageSmaller', 'imageLarger', 'imageNatural'],
    },
    {
      contextual: 'table',
      botoes: ['rowAfter', 'columnAfter', 'deleteRow', 'deleteColumn', 'headerRow', 'deleteTable'],
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
const ESQUEMAS_DE_LINK = ['http', 'https', 'mailto'];

/**
 * Menor largura de imagem, em pixels.
 *
 * Abaixo disto a alça de arrastar cobre a própria imagem, e o que sobra não
 * mostra mais nada — mas continua ocupando uma linha do documento. Um piso é o
 * que impede o clique acidental que reduz a imagem a um ponto irrecuperável.
 */
const LARGURA_MINIMA = 48;

/** Passo do redimensionamento por teclado, em pixels. */
const PASSO_DE_LARGURA = 40;

/**
 * Imagem com largura ajustável.
 *
 * A largura vai no ATRIBUTO `width` do `<img>`, e não em `style` inline. É HTML
 * válido, sobrevive a qualquer sanitização razoável do lado de quem grava, e
 * continua submetido ao `max-width: 100%` da folha — imagem larga demais encolhe
 * na moldura estreita em vez de vazar.
 */
const ImagemAjustavel = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const bruto = (el as HTMLElement).getAttribute('width');
          const n = bruto ? Number.parseInt(bruto, 10) : Number.NaN;
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
      const alca = document.createElement('span');
      alca.className = 'nds-editor-image-handle';
      // A alça é decoração de ponteiro: quem navega por teclado usa os botões
      // da barra, que é o caminho exigido pelo critério de arrasto (WCAG 2.5.7)
      // e o único que existe para quem não usa mouse.
      //
      // Por ser decoração, o `aria-hidden` vale para a alça INTEIRA — o ícone
      // dentro dela não precisa do seu, e um segundo `aria-hidden` aninhado só
      // repetiria o que o pai já diz.
      alca.setAttribute('aria-hidden', 'true');
      alca.appendChild(icone(ico(ArrowDownRightFromSquare)));
      dom.append(img, alca);

      const pintar = (n: typeof node): void => {
        img.src = n.attrs.src as string;
        img.alt = (n.attrs.alt as string | null) ?? '';
        if (n.attrs.width) img.setAttribute('width', String(n.attrs.width));
        else img.removeAttribute('width');
      };
      pintar(node);

      alca.addEventListener('pointerdown', (evento) => {
        // `preventDefault` mata o arrasto NATIVO do nó: `draggable: true` está no
        // próprio nó de imagem, e sem isto puxar a alça arrastaria a imagem para
        // outro ponto do documento em vez de redimensioná-la.
        evento.preventDefault();
        const partiuDe = evento.clientX;
        const larguraInicial = img.getBoundingClientRect().width;
        alca.setPointerCapture(evento.pointerId);

        const arrastar = (e: PointerEvent): void => {
          const nova = Math.max(LARGURA_MINIMA, Math.round(larguraInicial + (e.clientX - partiuDe)));
          // Durante o arrasto só o DOM muda. Gravar no documento a cada quadro
          // encheria o histórico de passos intermediários, e desfazer teria de
          // ser apertado dezenas de vezes para voltar ao tamanho anterior.
          img.setAttribute('width', String(nova));
        };

        const soltar = (): void => {
          alca.removeEventListener('pointermove', arrastar);
          alca.removeEventListener('pointerup', soltar);
          alca.removeEventListener('pointercancel', soltar);
          const posicao = typeof getPos === 'function' ? getPos() : undefined;
          const largura = Number.parseInt(img.getAttribute('width') ?? '', 10);
          if (posicao === undefined || !Number.isFinite(largura)) return;
          editor.view.dispatch(editor.state.tr.setNodeAttribute(posicao, 'width', largura));
        };

        alca.addEventListener('pointermove', arrastar);
        alca.addEventListener('pointerup', soltar);
        alca.addEventListener('pointercancel', soltar);
      });

      return {
        dom,
        update: (novo) => {
          if (novo.type.name !== 'image') return false;
          pintar(novo);
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
function imagensDe(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  return Array.from(dt.files).filter((f) => f.type.startsWith("image/"));
}

function linkPermitido(url: string): boolean {
  try {
    // Sem base: endereço sem esquema estoura aqui, e é o que se quer — quem
    // chama completa com `https://` ANTES de perguntar. Aceitar relativo neste
    // ponto abriria a porta que a lista de esquemas existe para fechar.
    return ESQUEMAS_DE_LINK.includes(new URL(url).protocol.replace(':', ''));
  } catch {
    return false;
  }
}

// ─── Peças de DOM ────────────────────────────────────────────────────────────

/** Monta um SVG a partir dos nós do lucide — mesma forma do alert e do breadcrumb. */
function icone(nodes: LucideIconNode[]): SVGSVGElement {
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

type LinhaDeEntrada = {
  linha: HTMLElement;
  campo: HTMLInputElement;
  aberta: () => boolean;
  abrir: (aberta: boolean) => void;
};

/**
 * Linha que pede um texto antes de agir — fórmula e link usam a mesma.
 *
 * Fica na moldura, e não num diálogo, porque escrever fórmula ou endereço é
 * edição de texto: um modal tiraria o texto de vista justamente enquanto se
 * decide o que a fórmula diz ou para onde o link vai.
 */
function criarLinhaDeEntrada(
  slot: string,
  label: string,
  placeholder: string,
  confirmLabel: string,
  aoConfirmar: () => void,
  aoFechar: () => void,
  /**
   * O que o campo mostra ao abrir.
   *
   * É o que torna a linha EDITÁVEL e não só um formulário de inserção: com o
   * cursor dentro de um link, abrir mostra o endereço atual — dá para corrigir,
   * e dá para apagar o texto e confirmar, que é como se tira o link. Abrindo em
   * branco, o botão só sabia criar, e nada na tela dizia o que já existia.
   */
  valorAoAbrir: () => string,
): LinhaDeEntrada {
  const linha = document.createElement('div');
  linha.dataset.slot = slot;
  linha.className = 'nds-editor-field-row';
  linha.hidden = true;
  linha.id = `nds-${slot}-${Math.random().toString(36).slice(2, 9)}`;

  const campo = createInput({ placeholder });
  campo.setAttribute('aria-label', label);
  const confirmar = createButton({ label: confirmLabel, size: 'sm' });
  linha.append(campo, confirmar);

  // `hidden` é `boolean | string` no DOM moderno (`until-found`), então a
  // pergunta é pelo valor de verdade, não pelo booleano.
  const aberta = (): boolean => !linha.hidden;

  const abrir = (proxima: boolean): void => {
    linha.hidden = !proxima;
    if (!proxima) return;
    // O campo é remontado a cada abertura, e não guardado entre uma e outra:
    // texto abandonado por Escape reapareceria na abertura seguinte, aplicado a
    // outro trecho do documento.
    campo.value = valorAoAbrir();
    campo.removeAttribute('aria-invalid');
    campo.focus();
    campo.select();
  };

  confirmar.addEventListener('click', aoConfirmar);
  campo.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      aoConfirmar();
    } else if (e.key === 'Escape') {
      abrir(false);
      aoFechar();
    }
  });

  return { linha, campo, aberta, abrir };
}

// ─── Fábrica ─────────────────────────────────────────────────────────────────

export function createEditor(options: EditorOptions): EditorRoot {
  const { labels, editable = true, preset = 'advanced' } = options;
  const resolverImagem = options.resolveImage ?? imageAsDataUrl;
  const descreverImagem = options.describeImage;

  const root = document.createElement('div');
  root.dataset.slot = 'editor';
  root.className = cn('nds-editor', options.class);

  const toolbar = document.createElement('div');
  toolbar.dataset.slot = 'editor-toolbar';
  toolbar.className = 'nds-editor-toolbar';
  toolbar.setAttribute('role', 'toolbar');
  toolbar.setAttribute('aria-label', labels.toolbar);

  const area = document.createElement('div');
  area.dataset.slot = 'editor-content';
  area.className = 'nds-editor-content';

  const editor = new Editor({
    element: area,
    editable,
    extensions: [
      StarterKit.configure({
        link: {
          isAllowedUri: (url) => linkPermitido(url),
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
      ImagemAjustavel.configure({ allowBase64: true }),
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
      handlePaste: (_view, evento) => {
        const arquivos = imagensDe(evento.clipboardData);
        if (arquivos.length === 0) return false;
        for (const arquivo of arquivos) void inserirImagem(arquivo);
        return true;
      },

      handleDrop: (view, evento, _slice, movido) => {
        // `movido` é arrasto INTERNO — alguém remanejando o que já está no
        // documento. Interceptar isso apagaria o recurso de reordenar.
        if (movido) return false;
        const arquivos = imagensDe((evento as DragEvent).dataTransfer);
        if (arquivos.length === 0) return false;
        // A imagem entra ONDE se soltou, não onde o cursor estava.
        const alvo = view.posAtCoords({
          left: (evento as DragEvent).clientX,
          top: (evento as DragEvent).clientY,
        });
        if (alvo) editor.commands.setTextSelection(alvo.pos);
        for (const arquivo of arquivos) void inserirImagem(arquivo);
        return true;
      },
    },
    content: options.content ? DOMPurify.sanitize(options.content) : undefined,
  });

  // ─── Montagem da barra ─────────────────────────────────────────────────────
  //
  // Um bloco por grupo, separador entre blocos. O separador é decorativo: quem
  // ouve recebe a divisão pelo nome de cada grupo, não por uma barrinha.

  const grupos: Array<{ grupo: ToggleGroupElement; acoes: EditorAction[] }> = [];
  const simples: Array<{ botao: HTMLButtonElement; acao: EditorAction }> = [];
  const contextuais: Array<{ caixa: HTMLElement; node: string }> = [];

  function separador(): HTMLElement {
    const s = document.createElement('span');
    s.className = 'nds-editor-toolbar-separator';
    s.setAttribute('aria-hidden', 'true');
    return s;
  }

  /** Botão que não alterna: divisória, desfazer, refazer, e os dois que abrem linha. */
  function botaoSimples(acao: EditorAction): HTMLButtonElement {
    const btn = createButton({
      variant: 'ghost',
      size: 'icon-sm',
      'aria-label': labels.actions[acao],
      children: icone(ACOES[acao].icon),
    });
    btn.dataset.action = acao;
    return btn;
  }

  const blocos = [...PRESETS[preset], { botoes: ['formula'] as EditorAction[] }];

  blocos.forEach((bloco, i) => {
    // Bloco contextual mora numa caixa própria, com o separador DENTRO dela: se
    // o separador ficasse na barra, sumir o bloco deixaria uma barrinha órfã
    // pendurada no fim.
    const contextual = 'botoes' in bloco ? bloco.contextual : undefined;
    let destino: HTMLElement = toolbar;
    if (contextual) {
      const caixa = document.createElement('span');
      caixa.dataset.slot = 'editor-toolbar-context';
      caixa.dataset.node = contextual;
      caixa.className = 'nds-editor-toolbar-context';
      caixa.hidden = true;
      caixa.appendChild(separador());
      toolbar.appendChild(caixa);
      contextuais.push({ caixa, node: contextual });
      destino = caixa;
    } else if (i > 0) {
      toolbar.appendChild(separador());
    }

    if ('grupo' in bloco) {
      // `role: 'group'` porque o grupo está ANINHADO nesta barra, ao lado de
      // botões que não alternam: `toolbar` dentro de `toolbar` seriam duas
      // navegações por seta disputando o mesmo Tab, e quem navega ficaria preso
      // no primeiro grupo sem alcançar o resto.
      const grupo = createToggleGroup({
        type: bloco.type,
        role: 'group',
        'aria-label': labels.groups[bloco.grupo],
        items: bloco.acoes.map((a) => ({
          value: a,
          'aria-label': labels.actions[a],
          children: icone(ACOES[a].icon),
        })),
      });
      grupos.push({ grupo, acoes: bloco.acoes });
      destino.appendChild(grupo);
      return;
    }

    for (const acao of bloco.botoes) {
      const btn = botaoSimples(acao);
      simples.push({ botao: btn, acao });
      destino.appendChild(btn);
    }
  });

  const botaoFormula = simples.find((s) => s.acao === 'formula')!.botao;
  const alvoLink = simples.find((s) => s.acao === 'link');
  const botaoLink = alvoLink ? alvoLink.botao : botaoFormula;
  const botaoAlt = simples.find((s) => s.acao === 'imageAlt')?.botao;

  // ─── Linhas de entrada ─────────────────────────────────────────────────────

  const formula = criarLinhaDeEntrada(
    'editor-formula',
    labels.fields.formula,
    '\\frac{a}{b}',
    labels.fields.formulaConfirm,
    () => inserirFormula(),
    () => botaoFormula.focus(),
    // Com o cursor numa fórmula, abrir mostra o LaTeX dela — é o único caminho
    // para corrigir uma: o que se vê na tela é o resultado renderizado.
    () => (editor.isActive('inlineMath') ? (editor.getAttributes('inlineMath').latex ?? '') : ''),
  );

  const link = criarLinhaDeEntrada(
    'editor-link',
    labels.fields.link,
    'https://exemplo.com',
    labels.fields.linkConfirm,
    () => aplicarLink(),
    () => botaoLink.focus(),
    () => (editor.getAttributes('link').href as string | undefined) ?? '',
  );

  /**
   * A linha do texto alternativo — onde a proposta da IA é conferida.
   *
   * Abre com o que a imagem tem hoje: o nome do arquivo enquanto a descrição
   * não chegou, a descrição depois. Ver o texto é o que permite julgá-lo.
   */
  const alt = criarLinhaDeEntrada(
    'editor-alt',
    labels.fields.alt,
    labels.fields.alt,
    labels.fields.altConfirm,
    () => aplicarAlt(),
    () => botaoAlt?.focus(),
    () => (editor.getAttributes('image').alt as string | undefined) ?? '',
  );

  const botaoTirarLink = createButton({
    variant: 'ghost',
    size: 'icon-sm',
    'aria-label': labels.fields.linkRemove,
    children: icone(ico(Unlink)),
  });
  botaoTirarLink.dataset.action = 'unlink';
  botaoTirarLink.hidden = true;
  botaoTirarLink.addEventListener('click', () => {
    // `extendMarkRange` primeiro: o cursor costuma estar NO MEIO do link, e sem
    // estender o trecho a marca sairia só do pedaço sob o cursor — partindo o
    // link em dois em vez de removê-lo.
    editor.chain().extendMarkRange('link').unsetLink().run();
    abrirLinha(null);
    botaoLink.focus();
  });
  link.linha.appendChild(botaoTirarLink);

  /** Só uma linha aberta por vez — as três ocupam o mesmo lugar na moldura. */
  function abrirLinha(qual: LinhaDeEntrada | null): void {
    for (const l of [formula, link, alt]) l.abrir(l === qual);
    sincronizar();
  }

  function aplicarAlt(): void {
    // Aqui `updateAttributes` é o certo, ao contrário do caminho da IA: a
    // imagem está selecionada AGORA, é ela que se edita, e o texto é de quem
    // está olhando para ela.
    editor.chain().focus().updateAttributes('image', { alt: alt.campo.value.trim() }).run();
    abrirLinha(null);
    botaoAlt?.focus();
  }

  function inserirFormula(): void {
    const latex = formula.campo.value.trim();
    if (!latex) return;
    // `insertInlineMath` guarda o LaTeX num atributo do nó e deixa o KaTeX
    // renderizar. O texto nunca vira HTML: não há caminho de injeção por aqui,
    // e fórmula inválida cai no ramo de erro da própria lib.
    //
    // SEM `.focus()` na corrente, ao contrário dos botões de marca. O comando de
    // foco da lib chega depois do fim desta função — medido: o `focus()` do
    // botão rodava primeiro e a lib o tomava de volta em seguida, deixando o
    // foco no texto quando a linha acabara de fechar. A inserção não precisa do
    // foco: a seleção guardada no documento é o ponto de entrada.
    // Fórmula sob o cursor se ATUALIZA; fora dela, insere. Sem esta distinção,
    // corrigir uma fórmula criava uma segunda ao lado da errada.
    if (editor.isActive('inlineMath')) {
      editor.chain().updateInlineMath({ latex }).run();
    } else {
      editor.chain().insertInlineMath({ latex }).run();
    }
    abrirLinha(null);
    botaoFormula.focus();
  }

  function aplicarLink(): void {
    const bruto = link.campo.value.trim();
    // Campo vazio TIRA o link do trecho — é o caminho de desfazer, e não há
    // botão separado para ele.
    if (!bruto) {
      editor.chain().extendMarkRange('link').unsetLink().run();
    } else {
      // Endereço sem esquema é o que a pessoa digita: `exemplo.com`. Completar
      // com `https://` antes de validar evita reprovar o caso comum.
      const url = /^[a-z][a-z0-9+.-]*:/i.test(bruto) ? bruto : `https://${bruto}`;
      if (!linkPermitido(url)) {
        link.campo.setAttribute('aria-invalid', 'true');
        return;
      }
      link.campo.removeAttribute('aria-invalid');
      editor.chain().extendMarkRange('link').setLink({ href: url }).run();
    }
    abrirLinha(null);
    botaoLink.focus();
  }

  for (const [botao, linha] of [
    [botaoFormula, formula],
    ...(alvoLink ? [[botaoLink, link] as const] : []),
    ...(botaoAlt ? [[botaoAlt, alt] as const] : []),
  ] as Array<[HTMLButtonElement, LinhaDeEntrada]>) {
    botao.setAttribute('aria-expanded', 'false');
    botao.setAttribute('aria-controls', linha.linha.id);
    botao.addEventListener('click', () => abrirLinha(linha.aberta() ? null : linha));
  }

  root.append(toolbar, formula.linha, link.linha, alt.linha, area);

  // ─── Estado ────────────────────────────────────────────────────────────────
  //
  // `transaction` cobre o que `update` não cobre: mover o cursor não muda o
  // documento, mas muda a marca ativa. Ligar só em `update` deixava o botão
  // aceso depois de sair de um trecho em negrito.
  function sincronizar(): void {
    for (const { grupo, acoes } of grupos) {
      grupo.setValue(acoes.filter((a) => ACOES[a].ativa?.(editor)));
    }
    for (const { botao, acao } of simples) {
      const { ativa, pode } = ACOES[acao];
      if (pode) botao.disabled = !pode(editor);
      if (ativa) botao.dataset.state = ativa(editor) ? 'on' : 'off';
    }
    // Tirar o link só existe quando há link: botão que não faz nada é ruído, e
    // desabilitado seria pior — anuncia uma ação e nega logo em seguida.
    botaoTirarLink.hidden = !editor.isActive('link');
    for (const { caixa, node } of contextuais) caixa.hidden = !editor.isActive(node);
    botaoFormula.setAttribute('aria-expanded', String(formula.aberta()));
    if (alvoLink) botaoLink.setAttribute('aria-expanded', String(link.aberta()));
    botaoAlt?.setAttribute('aria-expanded', String(alt.aberta()));
  }
  editor.on('transaction', sincronizar);
  // Imagem colada entra por fora da fábrica, então a varredura é o que a
  // alcança. `update` e não `transaction`: só mudança de DOCUMENTO traz imagem
  // nova, e `transaction` dispara também a cada movimento de cursor.
  editor.on('update', descreverPendentes);

  for (const { grupo, acoes } of grupos) {
    for (const btn of grupo.querySelectorAll<HTMLButtonElement>('[data-slot="toggle"]')) {
      btn.addEventListener('click', () => {
        const acao = btn.dataset.value as EditorAction;
        if (acoes.includes(acao)) ACOES[acao].executar?.(editor);
      });
    }
  }
  for (const { botao, acao } of simples) {
    const executar = ACOES[acao].executar;
    if (executar) botao.addEventListener('click', () => executar(editor));
  }

  // ─── Imagem ────────────────────────────────────────────────────────────────
  //
  // O seletor de arquivo é criado a cada clique e descartado depois: um input
  // guardado entre usos mantém o arquivo anterior, e escolher o MESMO arquivo
  // duas vezes seguidas não dispara `change`.
  /**
   * Escreve o `alt` da imagem de um `src` conhecido, onde quer que ela esteja.
   *
   * Não usa `updateAttributes`, que age sobre a SELEÇÃO: quando a descrição
   * chega, segundos depois, o cursor já andou — e o atributo iria parar em
   * outra imagem, ou em lugar nenhum. Aqui a imagem é reencontrada pelo `src`.
   * Some do documento nesse meio-tempo? A função não faz nada, que é o certo.
   */
  function definirAltPorSrc(src: string, alt: string): void {
    const { state } = editor;
    let posicao = -1;
    state.doc.descendants((node, pos) => {
      if (node.type.name === 'image' && node.attrs.src === src) posicao = pos;
    });
    if (posicao < 0) return;
    editor.view.dispatch(state.tr.setNodeAttribute(posicao, 'alt', alt));
  }

  async function inserirImagem(arquivo: File): Promise<boolean> {
    const src = await resolverImagem(arquivo);
    // `null` é recusa de quem consome — envio negado, arquivo grande demais,
    // formato fora da política. Não é erro, e não vira alerta.
    if (!src) return false;

    // O `alt` provisório é o nome do arquivo: descreve o arquivo, não a imagem.
    // É o que segura a vaga até a descrição chegar — e o que fica se ela não
    // vier. Imagem sem `alt` nenhum reprovaria no axe e sumiria do leitor de
    // tela sem deixar rastro.
    editor.chain().focus().setImage({ src, alt: arquivo.name }).run();

    descrever(arquivo, src);
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
  const descricoes = new Map<string, Promise<string | null>>();

  function descrever(arquivo: File | null, src: string): void {
    if (!descreverImagem) return;
    let pedido = descricoes.get(src);
    if (!pedido) {
      // A descrição é assíncrona e NÃO segura a inserção. Modelo de visão leva
      // segundos e às vezes falha; prender a imagem esperando trocaria uma
      // lacuna de acessibilidade por uma de responsividade.
      //
      // A falha vira `null` aqui, e não uma promessa rejeitada: quem descreve
      // não derruba a edição, e a imagem segue com o `alt` provisório e o botão
      // de texto alternativo à mão.
      pedido = descreverImagem(arquivo, src).catch(() => null);
      descricoes.set(src, pedido);
    }
    void pedido.then((descricao) => {
      if (descricao) definirAltPorSrc(src, descricao);
    });
  }

  function descreverPendentes(): void {
    if (!descreverImagem) return;
    const pendentes: string[] = [];
    editor.state.doc.descendants((node) => {
      const { src, alt } = node.attrs as { src?: string; alt?: string };
      // `descricoes.has` corta a reentrada: escrever o `alt` dispara outra
      // atualização, e uma recusa não pode virar pedido a cada tecla digitada.
      if (node.type.name === 'image' && src && !alt && !descricoes.has(src)) pendentes.push(src);
    });
    // Sem arquivo: a imagem colada de outra página tem endereço e nada mais.
    for (const src of pendentes) descrever(null, src);
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
  const arrastaArquivo = (dt: DataTransfer | null): boolean =>
    !!dt && Array.from(dt.types).includes('Files');

  for (const evento of ['dragenter', 'dragover'] as const) {
    root.addEventListener(evento, (e) => {
      if (arrastaArquivo((e as DragEvent).dataTransfer)) e.preventDefault();
    });
  }

  root.addEventListener('drop', (e) => {
    // Solto DENTRO do editável, quem já tratou foi a lib, pelo `handleDrop`
    // acima — ela previne o padrão, e é essa marca que evita inserir duas vezes.
    if (e.defaultPrevented) return;
    const arquivos = imagensDe((e as DragEvent).dataTransfer);
    if (arquivos.length === 0) return;
    e.preventDefault();
    // Solto fora do texto, a imagem vai para o fim do documento — é o lugar
    // mais próximo do que se apontou, e o único definido.
    editor.commands.focus('end');
    for (const arquivo of arquivos) void inserirImagem(arquivo);
  });

  const alvoImagem = simples.find((s) => s.acao === 'image');
  if (alvoImagem) {
    alvoImagem.botao.addEventListener('click', () => {
      // O seletor é criado a cada clique e descartado depois: um input guardado
      // entre usos mantém o arquivo anterior, e escolher o MESMO arquivo duas
      // vezes seguidas não dispara `change`.
      const escolha = document.createElement('input');
      escolha.type = 'file';
      escolha.accept = 'image/*';
      escolha.addEventListener('change', () => {
        const arquivo = escolha.files?.[0];
        if (arquivo) void inserirImagem(arquivo);
      });
      escolha.click();
    });
  }

  // ─── Navegação por seta na barra ──────────────────────────────────────────
  //
  // `role="toolbar"` promete uma parada de tabulação só, com as setas andando
  // dentro — inclusive atravessando os grupos, que abriram mão do teclado
  // justamente para isto. Sem a navegação, a barra promete um contrato que não
  // cumpre, e o leitor de tela anuncia o papel de qualquer jeito.
  const foco = (): HTMLButtonElement[] =>
    Array.from(toolbar.querySelectorAll<HTMLButtonElement>('button')).filter(
      // `offsetParent` nulo cobre o botão escondido E o bloco contextual
      // fechado em volta dele — perguntar só pelo `hidden` do próprio botão
      // deixaria as setas pousarem nos seis botões de tabela fora da tabela.
      (b) => !b.disabled && b.offsetParent !== null,
    );

  function rover(alvo: HTMLButtonElement): void {
    for (const b of toolbar.querySelectorAll<HTMLButtonElement>('button')) {
      b.tabIndex = b === alvo ? 0 : -1;
    }
  }

  toolbar.addEventListener('keydown', (e) => {
    const lista = foco();
    const atual = lista.indexOf(document.activeElement as HTMLButtonElement);
    if (atual < 0) return;
    let proximo: number;
    if (e.key === 'ArrowRight') proximo = (atual + 1) % lista.length;
    else if (e.key === 'ArrowLeft') proximo = (atual - 1 + lista.length) % lista.length;
    else if (e.key === 'Home') proximo = 0;
    else if (e.key === 'End') proximo = lista.length - 1;
    else return;
    e.preventDefault();
    rover(lista[proximo]);
    lista[proximo].focus();
  });

  // Clicar passa a ordem de tabulação para quem foi usado — senão o Tab
  // devolveria o foco a um botão diferente do último tocado.
  toolbar.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button');
    if (btn && !btn.disabled) rover(btn);
  });

  sincronizar();
  const primeiro = foco()[0];
  if (primeiro) rover(primeiro);

  const raiz = tornarDestruivel(root, root, () => {
    editor.destroy();
  }) as EditorRoot;
  raiz.editor = editor;
  raiz.insertImage = inserirImagem;
  return raiz;
}
