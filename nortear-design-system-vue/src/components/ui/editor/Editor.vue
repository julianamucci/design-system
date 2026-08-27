<script setup lang="ts">
// ─── Editor — texto rico sobre @tiptap/core ─────────────────────────────────
//
// A BARRA É NOSSA. Nenhum dos pacotes `@tiptap/*` traz botão, ícone ou barra —
// a biblioteca é o motor do documento. O que ela presetea é CAPACIDADE: o
// `StarterKit` liga por padrão título, listas, citação, código, bloco de
// código, linha divisória, link, sublinhado e desfazer/refazer. Os conjuntos
// abaixo escolhem o que dessa capacidade já paga vira botão.
//
// O núcleo monta em qualquer `Element`, então aqui basta `onMounted` com um
// `ref` — o pacote de conveniência de ciclo de vida não é requisito.
//
// A folha do KaTeX é importada AQUI, e não na `globals.css`, de propósito: são
// dezenas de kB de CSS mais os arquivos de fonte, e quem não usa o editor não
// deve pagar por eles. Importada no módulo, ela viaja no mesmo pedaço que o
// editor e some do pacote das páginas que não o carregam.
import type { Component, HTMLAttributes } from 'vue';
import { computed, h, nextTick, onBeforeUnmount, onMounted, ref, render, shallowRef, useId, watch } from 'vue';
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
} from 'lucide-vue-next';
import 'katex/dist/katex.min.css';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { imageAsDataUrl, type EditorAction, type EditorGroup, type EditorLabels, type EditorPreset } from './index';

// ─── Constantes de medida ───────────────────────────────────────────────────

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
 * Esquemas de URL aceitos no link.
 *
 * A biblioteca aceita dez por padrão. `javascript:` já fica de fora, que é o que
 * importa para injeção, mas metade da lista é superfície sem uso num design
 * system. Aqui a lista é a mínima que serve.
 */
const LINK_SCHEMES = ['http', 'https', 'mailto'];

// ─── Tabela de ações ────────────────────────────────────────────────────────
//
// Uma linha por botão, e três perguntas que a barra faz ao editor: como se
// desenha, se está ligada, se ainda pode.

type Action = {
  icon: Component;
  /** Ligada agora? Ausente = ação sem estado (divisória, desfazer). */
  isOn?: (e: TiptapEditor) => boolean;
  /** O que fazer no clique. Ausente = a ação abre uma linha de entrada. */
  run?: (e: TiptapEditor) => void;
  /** Ainda é possível? Ausente = sempre. */
  can?: (e: TiptapEditor) => boolean;
};

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
  // `{ textAlign }` e não um nome de nó. O grupo é `single` — um parágrafo tem
  // um alinhamento só.
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
    run: (e) => void e.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(),
  },

  // ─── Só com o cursor dentro de uma tabela ─────────────────────────────────
  rowAfter: { icon: Rows3, run: (e) => void e.chain().focus().addRowAfter().run() },
  columnAfter: { icon: Columns3, run: (e) => void e.chain().focus().addColumnAfter().run() },
  deleteRow: { icon: Minus, run: (e) => void e.chain().focus().deleteRow().run() },
  deleteColumn: { icon: Minus, run: (e) => void e.chain().focus().deleteColumn().run() },
  headerRow: { icon: PanelTop, run: (e) => void e.chain().focus().toggleHeaderRow().run() },
  deleteTable: { icon: Trash2, run: (e) => void e.chain().focus().deleteTable().run() },

  // As três que não agem sozinhas: abrem uma linha, um seletor de arquivo, e
  // esperam. `run` fica de fora porque a ação depende do resolvedor de imagem
  // que quem consome escolheu, ou do texto da linha.
  link: { icon: LinkIcon, isOn: (e) => e.isActive('link') },
  image: { icon: ImageIcon },
  imageAlt: { icon: Captions },

  // ─── Tamanho da imagem, pelo teclado ──────────────────────────────────────
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

// ─── Composição da barra ────────────────────────────────────────────────────

type Block =
  | { group: EditorGroup; type: 'single' | 'multiple'; actions: EditorAction[] }
  | {
      buttons: EditorAction[];
      /**
       * Botões que só aparecem com um nó sob o cursor, DENTRO deste mesmo
       * bloco. Ficam juntos de propósito: inserir imagem e editar imagem são o
       * mesmo assunto, e separá-los deixava "excluir linha" e "desfazer" no
       * meio do caminho.
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

// ─── Imagem com largura ajustável ───────────────────────────────────────────
//
// A largura vai no ATRIBUTO `width` do `<img>`, e não em `style` inline. É HTML
// válido, sobrevive a qualquer sanitização razoável do lado de quem grava, e
// continua submetido ao `max-width: 100%` da folha — imagem larga demais encolhe
// na moldura estreita em vez de vazar.
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
    return ({ node, editor: instance, getPos }) => {
      const dom = document.createElement('div');
      dom.className = 'nds-editor-image';

      const img = document.createElement('img');
      const handle = document.createElement('span');
      handle.className = 'nds-editor-image-handle';
      // A alça é decoração de ponteiro: quem navega por teclado usa os botões
      // da barra, que é o caminho exigido pelo critério de arrasto (WCAG 2.5.7)
      // e o único que existe para quem não usa mouse. Por ser decoração, o
      // `aria-hidden` vale para a alça INTEIRA — o ícone dentro dela não precisa
      // do seu.
      handle.setAttribute('aria-hidden', 'true');
      render(h(ArrowDownRightFromSquare), handle);
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

        const onDrag = (moveEvent: PointerEvent): void => {
          const nextWidth = Math.max(
            MIN_WIDTH,
            Math.round(startWidth + (moveEvent.clientX - startX)),
          );
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
          instance.view.dispatch(instance.state.tr.setNodeAttribute(position, 'width', width));
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
        // biblioteca não provocou. Sem isto ela conclui que o nodeView saiu de
        // sincronia e o remonta no meio do arrasto.
        ignoreMutation: () => true,
        destroy: () => render(null, handle),
      };
    };
  },
});

// ─── Auxiliares ─────────────────────────────────────────────────────────────

/** Só os arquivos de imagem de uma área de transferência ou de um arrasto. */
function imageFilesOf(dt: DataTransfer | null): File[] {
  if (!dt) return [];
  return Array.from(dt.files).filter((f) => f.type.startsWith('image/'));
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

/** Durante o arrasto o navegador esconde os arquivos: `files` vem vazio no
 *  `dragover` e só aparece no `drop`. Por isso a pergunta é por `types`. */
function isFileDrag(dt: DataTransfer | null): boolean {
  return !!dt && Array.from(dt.types).includes('Files');
}

// ─── Contrato do componente ─────────────────────────────────────────────────

const props = withDefaults(
  defineProps<{
    /**
     * Conteúdo inicial, em HTML. Passa por `DOMPurify` antes de chegar à
     * biblioteca: o documento é montado a partir de um nó criado por
     * `innerHTML`, e `<img onerror>` dispara mesmo em nó solto. O esquema do
     * ProseMirror descartaria o nó depois — tarde demais.
     */
    content?: string;
    editable?: boolean;
    /** Conjunto de botões. Padrão `advanced`. */
    preset?: EditorPreset;
    /**
     * De onde sai o `src` da imagem — a decisão de ARMAZENAMENTO, que é de quem
     * consome o design system, não dele. Devolver `null` cancela a inserção,
     * sem erro. O padrão embute o arquivo em base64.
     */
    resolveImage?: (file: File) => Promise<string | null>;
    /**
     * Escreve o texto alternativo a partir da imagem — o lugar de ligar um
     * modelo de visão. É chamado DEPOIS de inserir, nunca antes: descrever leva
     * segundos e às vezes falha, e prender a imagem esperando por isso trocaria
     * uma lacuna de acessibilidade por uma de responsividade.
     */
    describeImage?: (file: File | null, src: string) => Promise<string | null>;
    labels: EditorLabels;
    class?: HTMLAttributes['class'];
  }>(),
  { editable: true, preset: 'advanced' },
);

const emit = defineEmits<{
  /**
   * Disparado a cada mudança do DOCUMENTO, com o HTML atual.
   *
   * `update` e não `transaction`: mover o cursor gera transação e não muda o
   * conteúdo, e um formulário que gravasse a cada movimento de cursor
   * escreveria dezenas de versões idênticas.
   */
  (e: 'change', html: string): void;
}>();

// ─── Estado ─────────────────────────────────────────────────────────────────

const rootRef = ref<HTMLDivElement | null>(null);
const toolbarRef = ref<HTMLDivElement | null>(null);
const contentRef = ref<HTMLDivElement | null>(null);
const editor = shallowRef<TiptapEditor | null>(null);

const activeActions = ref<Set<EditorAction>>(new Set());
const disabledActions = ref<Set<EditorAction>>(new Set());
const activeNodes = ref<Set<string>>(new Set());
const linkActive = ref(false);

type RowName = 'formula' | 'link' | 'alt';

const openRowName = ref<RowName | null>(null);
const rowValues = ref<Record<RowName, string>>({ formula: '', link: '', alt: '' });
const linkInvalid = ref(false);
const rowIds: Record<RowName, string> = { formula: useId(), link: useId(), alt: useId() };

/**
 * Qual botão da barra carrega a parada de tabulação.
 *
 * `role="toolbar"` promete uma parada só, com as setas andando dentro. A chave
 * é o nome da ação — que é `data-action` nos botões soltos e `data-value` nos
 * alternadores, e o mesmo texto nos dois.
 */
const rovingKey = ref('');

// ─── Composição da barra, já achatada para o template ───────────────────────

type ToolbarPart = {
  kind: 'separator' | 'group' | 'buttons' | 'context';
  actions: EditorAction[];
  /** Nome acessível do grupo. Vazio nas demais partes. */
  label: string;
  type: 'single' | 'multiple';
  /** Nó que revela a caixa contextual. Vazio nas demais partes. */
  node: string;
};

const parts = computed<ToolbarPart[]>(() => {
  const blocks: Block[] = [...PRESETS[props.preset], { buttons: ['formula'] as EditorAction[] }];
  const list: ToolbarPart[] = [];
  blocks.forEach((block, index) => {
    if (index > 0) {
      list.push({ kind: 'separator', actions: [], label: '', type: 'multiple', node: '' });
    }
    if ('group' in block) {
      list.push({
        kind: 'group',
        actions: block.actions,
        label: props.labels.groups[block.group],
        type: block.type,
        node: '',
      });
      return;
    }
    list.push({ kind: 'buttons', actions: block.buttons, label: '', type: 'multiple', node: '' });
    // A caixa contextual entra no MESMO bloco, sem separador próprio: os botões
    // extras pertencem ao assunto que o bloco já trata.
    if (block.contextual) {
      list.push({
        kind: 'context',
        actions: block.contextual.buttons,
        label: '',
        type: 'multiple',
        node: block.contextual.node,
      });
    }
  });
  return list;
});

const rows = computed(() => [
  {
    name: 'formula' as RowName,
    slot: 'editor-formula',
    label: props.labels.fields.formula,
    placeholder: '\\frac{a}{b}',
    confirm: props.labels.fields.formulaConfirm,
  },
  {
    name: 'link' as RowName,
    slot: 'editor-link',
    label: props.labels.fields.link,
    placeholder: 'https://exemplo.com',
    confirm: props.labels.fields.linkConfirm,
  },
  {
    name: 'alt' as RowName,
    slot: 'editor-alt',
    label: props.labels.fields.alt,
    placeholder: props.labels.fields.alt,
    confirm: props.labels.fields.altConfirm,
  },
]);

/** A ação abre uma linha de entrada? Devolve qual. */
function rowOf(action: EditorAction): RowName | null {
  if (action === 'formula') return 'formula';
  if (action === 'link') return 'link';
  if (action === 'imageAlt') return 'alt';
  return null;
}

/**
 * Estado dos alternadores de um bloco.
 *
 * O grupo é CONTROLADO pelo editor: a marca ativa é a verdade, e o clique só
 * roda o comando. É o que faz o botão acender quando o cursor entra num trecho
 * em negrito, sem clique nenhum.
 */
function groupValue(part: ToolbarPart): string | string[] {
  const active = part.actions.filter((action) => activeActions.value.has(action));
  return part.type === 'single' ? (active[0] ?? '') : active;
}

/** Os atributos de um botão solto da barra, num lugar só. */
function buttonAttrs(action: EditorAction): Record<string, unknown> {
  const row = rowOf(action);
  return {
    'variant': 'ghost',
    'size': 'icon-sm',
    'data-action': action,
    'aria-label': props.labels.actions[action],
    'disabled': disabledActions.value.has(action),
    'data-state': ACTIONS[action].isOn
      ? activeActions.value.has(action)
        ? 'on'
        : 'off'
      : undefined,
    'aria-expanded': row ? String(openRowName.value === row) : undefined,
    'aria-controls': row ? rowIds[row] : undefined,
    'tabindex': rovingKey.value === action ? 0 : -1,
  };
}

// ─── Sincronização com o editor ─────────────────────────────────────────────
//
// `transaction` cobre o que `update` não cobre: mover o cursor não muda o
// documento, mas muda a marca ativa. Ligar só em `update` deixava o botão aceso
// depois de sair de um trecho em negrito.
function sync(): void {
  const instance = editor.value;
  if (!instance) return;
  const on = new Set<EditorAction>();
  const off = new Set<EditorAction>();
  for (const name of Object.keys(ACTIONS) as EditorAction[]) {
    const { isOn, can } = ACTIONS[name];
    if (isOn?.(instance)) on.add(name);
    if (can && !can(instance)) off.add(name);
  }
  activeActions.value = on;
  disabledActions.value = off;
  const nodes = new Set<string>();
  for (const node of ['image', 'table']) if (instance.isActive(node)) nodes.add(node);
  activeNodes.value = nodes;
  // Tirar o link só existe quando há link: botão que não faz nada é ruído, e
  // desabilitado seria pior — anuncia uma ação e nega logo em seguida.
  linkActive.value = instance.isActive('link');
}

// ─── Descrição de imagem ────────────────────────────────────────────────────

/**
 * O cache é por `src` e guarda a PROMESSA, não o fato de ter tentado.
 *
 * A diferença aparece na mesma imagem inserida duas vezes: com um conjunto de
 * "já tentadas", a segunda ficava para sempre com o `alt` provisório, porque o
 * pedido fora feito e o resultado tinha ido para a primeira.
 */
const descriptions = new Map<string, Promise<string | null>>();

/**
 * Escreve o `alt` da imagem de um `src` conhecido, onde quer que ela esteja.
 *
 * Não usa `updateAttributes`, que age sobre a SELEÇÃO: quando a descrição
 * chega, segundos depois, o cursor já andou — e o atributo iria parar em outra
 * imagem, ou em lugar nenhum.
 */
function setAltBySrc(src: string, alt: string): void {
  const instance = editor.value;
  if (!instance) return;
  const { state } = instance;
  let position = -1;
  state.doc.descendants((node, pos) => {
    if (node.type.name === 'image' && node.attrs.src === src) position = pos;
  });
  if (position < 0) return;
  instance.view.dispatch(state.tr.setNodeAttribute(position, 'alt', alt));
}

function describe(file: File | null, src: string): void {
  const describeImageFile = props.describeImage;
  if (!describeImageFile) return;
  let request = descriptions.get(src);
  if (!request) {
    // A falha vira `null` aqui, e não uma promessa rejeitada: quem descreve não
    // derruba a edição, e a imagem segue com o `alt` provisório e o botão de
    // texto alternativo à mão.
    request = describeImageFile(file, src).catch(() => null);
    descriptions.set(src, request);
  }
  void request.then((description) => {
    if (description) setAltBySrc(src, description);
  });
}

/**
 * Imagens já COM `src` e sem descrição — as que chegaram por colagem.
 *
 * Colar uma imagem de outra página insere `<img src>` sem `alt` nenhum, por um
 * caminho que não passa por `insertImageFile`: quem monta o nó é o próprio
 * ProseMirror, a partir do HTML da área de transferência.
 */
function describePending(): void {
  const instance = editor.value;
  if (!instance || !props.describeImage) return;
  const pending: string[] = [];
  instance.state.doc.descendants((node) => {
    const { src, alt } = node.attrs as { src?: string; alt?: string };
    // `descriptions.has` corta a reentrada: escrever o `alt` dispara outra
    // atualização, e uma recusa não pode virar pedido a cada tecla digitada.
    if (node.type.name === 'image' && src && !alt && !descriptions.has(src)) pending.push(src);
  });
  // Sem arquivo: a imagem colada de outra página tem endereço e nada mais.
  for (const src of pending) describe(null, src);
}

async function insertImageFile(file: File): Promise<boolean> {
  const instance = editor.value;
  if (!instance) return false;
  const src = await (props.resolveImage ?? imageAsDataUrl)(file);
  // `null` é recusa de quem consome — envio negado, arquivo grande demais,
  // formato fora da política. Não é erro, e não vira alerta.
  if (!src) return false;

  // O `alt` provisório é o nome do arquivo: descreve o arquivo, não a imagem. É
  // o que segura a vaga até a descrição chegar — e o que fica se ela não vier.
  instance.chain().focus().setImage({ src, alt: file.name }).run();
  describe(file, src);
  return true;
}

// ─── Linhas de entrada ──────────────────────────────────────────────────────

/**
 * O que o campo mostra ao abrir.
 *
 * É o que torna a linha EDITÁVEL e não só um formulário de inserção: com o
 * cursor dentro de um link, abrir mostra o endereço atual — dá para corrigir, e
 * dá para apagar o texto e confirmar, que é como se tira o link.
 */
function valueOnOpen(name: RowName): string {
  const instance = editor.value;
  if (!instance) return '';
  if (name === 'formula') {
    return instance.isActive('inlineMath')
      ? ((instance.getAttributes('inlineMath').latex as string | undefined) ?? '')
      : '';
  }
  if (name === 'link') return (instance.getAttributes('link').href as string | undefined) ?? '';
  return (instance.getAttributes('image').alt as string | undefined) ?? '';
}

/** Só uma linha aberta por vez — as três ocupam o mesmo lugar na moldura. */
async function openRow(name: RowName | null): Promise<void> {
  openRowName.value = name;
  linkInvalid.value = false;
  if (!name) return;
  // O campo é reescrito a cada abertura, e não guardado entre uma e outra:
  // texto abandonado por Escape reapareceria na abertura seguinte, aplicado a
  // outro trecho do documento.
  rowValues.value[name] = valueOnOpen(name);
  await nextTick();
  const field = rootRef.value?.querySelector<HTMLInputElement>(
    `[data-slot="editor-${name}"] input`,
  );
  field?.focus();
  field?.select();
}

function focusAction(action: EditorAction): void {
  rootRef.value?.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)?.focus();
}

function insertFormula(): void {
  const instance = editor.value;
  if (!instance) return;
  const latex = rowValues.value.formula.trim();
  if (!latex) return;
  // SEM `.focus()` na corrente, ao contrário dos botões de marca: o comando de
  // foco da biblioteca chega depois do fim desta função e tomaria o foco de
  // volta, deixando-o no texto quando a linha acabara de fechar.
  //
  // Fórmula sob o cursor se ATUALIZA; fora dela, insere. Sem esta distinção,
  // corrigir uma fórmula criava uma segunda ao lado da errada.
  if (instance.isActive('inlineMath')) {
    instance.chain().updateInlineMath({ latex }).run();
  } else {
    instance.chain().insertInlineMath({ latex }).run();
  }
  void openRow(null);
  focusAction('formula');
}

function applyLink(): void {
  const instance = editor.value;
  if (!instance) return;
  const raw = rowValues.value.link.trim();
  // Campo vazio TIRA o link do trecho — é o caminho de desfazer, e não há botão
  // separado para ele.
  if (!raw) {
    instance.chain().extendMarkRange('link').unsetLink().run();
  } else {
    // Endereço sem esquema é o que a pessoa digita: `exemplo.com`. Completar com
    // `https://` antes de validar evita reprovar o caso comum.
    const url = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
    if (!isAllowedLink(url)) {
      linkInvalid.value = true;
      return;
    }
    linkInvalid.value = false;
    instance.chain().extendMarkRange('link').setLink({ href: url }).run();
  }
  void openRow(null);
  focusAction('link');
}

function applyAlt(): void {
  const instance = editor.value;
  if (!instance) return;
  // Aqui `updateAttributes` é o certo, ao contrário do caminho da descrição
  // automática: a imagem está selecionada AGORA, é ela que se edita, e o texto é
  // de quem está olhando para ela.
  instance.chain().focus().updateAttributes('image', { alt: rowValues.value.alt.trim() }).run();
  void openRow(null);
  focusAction('imageAlt');
}

function confirmRow(name: RowName): void {
  if (name === 'formula') insertFormula();
  else if (name === 'link') applyLink();
  else applyAlt();
}

function removeLink(): void {
  const instance = editor.value;
  if (!instance) return;
  // `extendMarkRange` primeiro: o cursor costuma estar NO MEIO do link, e sem
  // estender o trecho a marca sairia só do pedaço sob o cursor — partindo o link
  // em dois em vez de removê-lo.
  instance.chain().extendMarkRange('link').unsetLink().run();
  void openRow(null);
  focusAction('link');
}

function onFieldKeydown(event: KeyboardEvent, name: RowName): void {
  if (event.key === 'Enter') {
    event.preventDefault();
    confirmRow(name);
  } else if (event.key === 'Escape') {
    void openRow(null);
    if (name === 'formula') focusAction('formula');
    else if (name === 'link') focusAction('link');
    else focusAction('imageAlt');
  }
}

// ─── Cliques da barra ───────────────────────────────────────────────────────

/**
 * Com a edição desligada, a barra DEIXA DE AGIR.
 *
 * A guarda é aqui, e não na lib: `editor.commands` continua funcionando num
 * editor em leitura — `editable` vale para o que o teclado e o ponteiro fazem
 * no CAMPO, não para comando disparado por código. Medido: clicar em Negrito
 * numa demonstração somente-leitura ligava a marca guardada, e o documento não
 * mudava uma vírgula — a barra afirmando uma edição que o texto não tem, e
 * contradizendo o que `states.readOnly` promete na própria página.
 *
 * O alternador não precisa de correção de estado depois do clique: o
 * `ToggleGroup` desta stack recebe `model-value` do editor e nenhum ouvinte de
 * `update`, então é CONTROLADO — o botão só acende se o documento mudar.
 */
function acts(): boolean {
  return props.editable !== false;
}

function runAction(action: EditorAction): void {
  const instance = editor.value;
  if (!instance || !acts()) return;
  ACTIONS[action].run?.(instance);
}

function openFilePicker(): void {
  // O seletor é criado a cada clique e descartado depois: um input guardado
  // entre usos mantém o arquivo anterior, e escolher o MESMO arquivo duas vezes
  // seguidas não dispara `change`.
  const picker = document.createElement('input');
  picker.type = 'file';
  picker.accept = 'image/*';
  picker.addEventListener('change', () => {
    const file = picker.files?.[0];
    if (file) void insertImageFile(file);
  });
  picker.click();
}

function onPlainClick(action: EditorAction): void {
  if (!acts()) return;
  const row = rowOf(action);
  if (row) {
    void openRow(openRowName.value === row ? null : row);
    return;
  }
  if (action === 'image') {
    openFilePicker();
    return;
  }
  runAction(action);
}

// ─── Navegação por seta na barra ────────────────────────────────────────────
//
// `role="toolbar"` promete uma parada de tabulação só, com as setas andando
// dentro — inclusive atravessando os grupos, que abriram mão do teclado
// justamente para isto (`rovingFocus` desligado no grupo).

function focusables(): HTMLButtonElement[] {
  const el = toolbarRef.value;
  if (!el) return [];
  return Array.from(el.querySelectorAll<HTMLButtonElement>('button')).filter(
    // `offsetParent` nulo cobre o botão escondido E o bloco contextual fechado
    // em volta dele — perguntar só pelo `hidden` do próprio botão deixaria as
    // setas pousarem nos seis botões de tabela fora da tabela.
    (b) => !b.disabled && b.offsetParent !== null,
  );
}

function keyOf(button: HTMLButtonElement): string {
  return button.dataset.action ?? button.dataset.value ?? '';
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
  rovingKey.value = keyOf(list[next]);
  list[next].focus();
}

// Clicar passa a ordem de tabulação para quem foi usado — senão o Tab devolveria
// o foco a um botão diferente do último tocado.
function onToolbarClick(event: MouseEvent): void {
  const button = (event.target as HTMLElement).closest('button');
  if (button && !(button as HTMLButtonElement).disabled) {
    rovingKey.value = keyOf(button as HTMLButtonElement);
  }
}

async function resetRoving(): Promise<void> {
  await nextTick();
  const first = focusables()[0];
  if (first) rovingKey.value = keyOf(first);
}

// ─── Arrastar para QUALQUER lugar da moldura ────────────────────────────────
//
// O `dragover` que a biblioteca previne cobre só o elemento editável, e ele tem
// a altura do TEXTO — o respiro abaixo da última linha, a barra e a borda são
// moldura, não campo. Soltar ali escapava do editor e o navegador abria o
// arquivo numa aba nova.

function onFrameDrag(event: DragEvent): void {
  // Em leitura o arrasto NÃO é aceito: cancelar o padrão aqui prometeria que a
  // moldura recebe o arquivo, e receber é escrever no documento.
  if (acts() && isFileDrag(event.dataTransfer)) event.preventDefault();
}

function onFrameDrop(event: DragEvent): void {
  if (!acts()) return;
  // Solto DENTRO do editável, quem já tratou foi a biblioteca, pelo `handleDrop`
  // — ela previne o padrão, e é essa marca que evita inserir duas vezes.
  if (event.defaultPrevented) return;
  const files = imageFilesOf(event.dataTransfer);
  if (files.length === 0) return;
  event.preventDefault();
  // Solto fora do texto, a imagem vai para o fim do documento — é o lugar mais
  // próximo do que se apontou, e o único definido.
  editor.value?.commands.focus('end');
  for (const file of files) void insertImageFile(file);
}

// ─── Ciclo de vida ──────────────────────────────────────────────────────────

onMounted(() => {
  const instance = new TiptapEditor({
    element: contentRef.value as HTMLElement,
    editable: props.editable,
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
      ResizableImage.configure({ allowBase64: true }),
      Highlight,
      // `types` diz em QUE nós o atributo pode pousar. Sem parágrafo e título na
      // lista, os botões de alinhamento não fazem nada — e nada na tela explica
      // por quê.
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    editorProps: {
      // O caminho suportado para escrever atributo no elemento editável: a
      // biblioteca recria esse nó, e `setAttribute` de fora seria desfeito.
      attributes: { 'aria-label': props.labels.editorField },

      // Colar e ARRASTAR arquivo de imagem passam pelo mesmo caminho do botão —
      // mesmo `resolveImage`, mesma descrição, mesmo `alt`.
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
    content: props.content ? DOMPurify.sanitize(props.content) : undefined,
  });

  instance.on('transaction', sync);
  // Imagem colada entra por fora de `insertImageFile`, então a varredura é o que
  // a alcança. `update` e não `transaction`: só mudança de DOCUMENTO traz imagem
  // nova.
  instance.on('update', describePending);
  instance.on('update', () => emit('change', instance.getHTML()));

  editor.value = instance;
  sync();
  void resetRoving();
});

onBeforeUnmount(() => {
  editor.value?.destroy();
  editor.value = null;
});

watch(
  () => props.editable,
  (editable) => editor.value?.setEditable(editable),
);

// Trocar de conjunto reescreve a barra inteira: a parada de tabulação precisa
// voltar para um botão que ainda existe.
watch(() => props.preset, resetRoving);

defineExpose({ editor, insertImage: insertImageFile });
</script>

<template>
  <div
    ref="rootRef"
    data-slot="editor"
    :class="cn('nds-editor', props.class)"
    @dragenter="onFrameDrag"
    @dragover="onFrameDrag"
    @drop="onFrameDrop"
  >
    <div
      ref="toolbarRef"
      data-slot="editor-toolbar"
      class="nds-editor-toolbar"
      role="toolbar"
      :aria-label="props.labels.toolbar"
      @keydown="onToolbarKeydown"
      @click="onToolbarClick"
    >
      <template
        v-for="(part, index) in parts"
        :key="`${part.kind}-${index}`"
      >
        <!-- O separador é decorativo: quem ouve recebe a divisão pelo nome de
             cada grupo, não por uma barrinha. -->
        <span
          v-if="part.kind === 'separator'"
          class="nds-editor-toolbar-separator"
          aria-hidden="true"
        />

        <!-- `role="group"` porque o grupo está ANINHADO nesta barra: `toolbar`
             dentro de `toolbar` seriam duas navegações por seta disputando o
             mesmo Tab. `roving-focus` desligado é o que entrega o teclado à
             barra. -->
        <ToggleGroup
          v-else-if="part.kind === 'group'"
          :type="part.type"
          :roving-focus="false"
          :model-value="groupValue(part)"
          :aria-label="part.label"
        >
          <!-- `data-value` explícito: o alternador desta stack encaminha `value`
               como atributo nativo do botão, e a barra identifica cada botão
               pelo par `data-action`/`data-value` — é ele que carrega a parada
               de tabulação de um botão para o outro.

               `data-slot="toggle"` porque a barra do Vanilla — a régua
               cross-stack — nomeia assim cada alternador do grupo, e é o mesmo
               nome que React, Svelte e Angular escrevem. Aqui o
               `ToggleGroupItem` da stack assina `toggle-group-item` no próprio
               template, e o atributo de repasse vence o do filho: o alternador
               da barra do editor fica com o nome que as cinco compartilham. -->
          <ToggleGroupItem
            v-for="action in part.actions"
            :key="action"
            :value="action"
            data-slot="toggle"
            :data-value="action"
            :aria-label="props.labels.actions[action]"
            :tabindex="rovingKey === action ? 0 : -1"
            @click="runAction(action)"
          >
            <component
              :is="ACTIONS[action].icon"
              aria-hidden="true"
            />
          </ToggleGroupItem>
        </ToggleGroup>

        <!-- A caixa contextual existe como CAIXA, e não como botões soltos com
             `hidden` cada um, para que aparecer e sumir seja um atributo só. -->
        <span
          v-else-if="part.kind === 'context'"
          data-slot="editor-toolbar-context"
          class="nds-editor-toolbar-context"
          :data-node="part.node"
          :hidden="!activeNodes.has(part.node)"
        >
          <Button
            v-for="action in part.actions"
            :key="action"
            v-bind="buttonAttrs(action)"
            @click="onPlainClick(action)"
          >
            <component
              :is="ACTIONS[action].icon"
              aria-hidden="true"
            />
          </Button>
        </span>

        <template v-else>
          <Button
            v-for="action in part.actions"
            :key="action"
            v-bind="buttonAttrs(action)"
            @click="onPlainClick(action)"
          >
            <component
              :is="ACTIONS[action].icon"
              aria-hidden="true"
            />
          </Button>
        </template>
      </template>
    </div>

    <!-- A linha que pede um texto antes de agir fica na moldura, e não num
         diálogo: escrever fórmula ou endereço é edição de texto, e um modal
         tiraria o texto de vista justamente enquanto se decide o que ele diz. -->
    <div
      v-for="row in rows"
      :id="rowIds[row.name]"
      :key="row.name"
      :data-slot="row.slot"
      class="nds-editor-field-row"
      :hidden="openRowName !== row.name"
    >
      <Input
        :model-value="rowValues[row.name]"
        :aria-label="row.label"
        :placeholder="row.placeholder"
        :aria-invalid="row.name === 'link' && linkInvalid ? 'true' : undefined"
        @update:model-value="(value) => (rowValues[row.name] = String(value))"
        @keydown="(event: KeyboardEvent) => onFieldKeydown(event, row.name)"
      />
      <Button
        size="sm"
        @click="confirmRow(row.name)"
      >
        {{ row.confirm }}
      </Button>
      <Button
        v-if="row.name === 'link'"
        variant="ghost"
        size="icon-sm"
        data-action="unlink"
        :aria-label="props.labels.fields.linkRemove"
        :hidden="!linkActive"
        @click="removeLink"
      >
        <Unlink aria-hidden="true" />
      </Button>
    </div>

    <div
      ref="contentRef"
      data-slot="editor-content"
      class="nds-editor-content"
    />
  </div>
</template>
