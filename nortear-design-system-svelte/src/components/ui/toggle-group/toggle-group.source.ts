/**
 * Transforms do painel Code do ToggleGroup.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções
 * rodarem no projeto `unit` do vitest. A saída do painel não chega ao DOM
 * durante a `play`, então este é o único lugar em que elas têm guarda.
 */
import { attrs, attrsMultilinha, svelteSnippet } from '@/lib/story-source';

/** Nome do componente e caminho do módulo de cada ícone usado nas stories. */
const ICONES = {
  alignLeft: ['AlignLeft', 'text-align-start'],
  alignCenter: ['AlignCenter', 'text-align-center'],
  alignRight: ['AlignRight', 'text-align-end'],
  alignJustify: ['AlignJustify', 'text-align-justify'],
  bold: ['Bold', 'bold'],
  italic: ['Italic', 'italic'],
  underline: ['Underline', 'underline'],
  grid: ['LayoutGrid', 'layout-grid'],
  list: ['List', 'list'],
} as const;

type IconKey = keyof typeof ICONES;

export type ToggleGroupArgs = {
  type: 'single' | 'multiple';
  value: string | string[];
  disabled: boolean;
  orientation: 'horizontal' | 'vertical';
  variant: 'default' | 'outline';
  size: 'default' | 'sm' | 'lg';
  spacing: number;
};

type Item = {
  value: string;
  rotulo: string;
  icone: IconKey;
  disabled?: boolean;
};

const ALINHAMENTO: readonly Item[] = [
  { value: 'left', rotulo: 'Alinhar à esquerda', icone: 'alignLeft' },
  { value: 'center', rotulo: 'Centralizar', icone: 'alignCenter' },
  { value: 'right', rotulo: 'Alinhar à direita', icone: 'alignRight' },
];

const FORMATACAO: readonly Item[] = [
  { value: 'bold', rotulo: 'Negrito', icone: 'bold' },
  { value: 'italic', rotulo: 'Itálico', icone: 'italic' },
  { value: 'underline', rotulo: 'Sublinhado', icone: 'underline' },
];

const VISUALIZACAO: readonly Item[] = [
  { value: 'grid', rotulo: 'Grade', icone: 'grid' },
  { value: 'list', rotulo: 'Lista', icone: 'list' },
];

const IMPORT = `import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";`;

/** Bloco de imports: o componente do design system mais os ícones do exemplo. */
function importar(itens: readonly Item[]): string {
  return [
    IMPORT,
    ...itens.map((item) => {
      const [nome, caminho] = ICONES[item.icone];
      return `import ${nome} from "@lucide/svelte/icons/${caminho}";`;
    }),
  ].join('\n');
}

/** Os itens do grupo, um bloco por opção. */
function marcarItems(itens: readonly Item[]): string {
  return itens
    .map((item) => {
      const props = attrs(
        `value="${item.value}"`,
        item.disabled ? 'disabled' : '',
        // Item só de ícone: sem isto ele fica anônimo para quem lê a tela.
        `aria-label="${item.rotulo}"`,
      );
      return `  <ToggleGroupItem${props}>\n    <${ICONES[item.icone][0]} aria-hidden="true" />\n  </ToggleGroupItem>`;
    })
    .join('\n');
}

/** Monta o grupo inteiro: script com estado e a lista de itens. */
function mountGroup(opcoes: {
  itens: readonly Item[];
  rotulo: string;
  estado: string;
  declaracao: string;
  props: string[];
}): string {
  const { itens, rotulo, estado, declaracao, props } = opcoes;
  const abertura = attrsMultilinha([
    ...props,
    `bind:value={${estado}}`,
    // O nome do grupo é a categoria da escolha, não a opção escolhida.
    `aria-label="${rotulo}"`,
  ]);

  return svelteSnippet(
    `${importar(itens)}\n\n${declaracao}`,
    `<ToggleGroup${abertura}>\n${marcarItems(itens)}\n</ToggleGroup>`,
  );
}

/** Playground: a barra de alinhamento, com os valores atuais dos controls. */
export function toggleGroupSource(
  _gerado?: string,
  ctx?: { args?: Partial<ToggleGroupArgs> },
): string {
  const {
    type = 'single',
    value,
    disabled = false,
    orientation = 'horizontal',
    variant = 'default',
    size = 'default',
    spacing = 0,
  } = ctx?.args ?? {};

  const combinado = type === 'multiple';
  const lista = Array.isArray(value) ? value : [];
  const declaracao = combinado
    ? lista.length
      ? `let alinhamento = $state([${lista.map((v) => `"${v}"`).join(', ')}]);`
      : 'let alinhamento: string[] = $state([]);'
    : `let alinhamento = $state("${typeof value === 'string' ? value : ''}");`;

  return mountGroup({
    itens: ALINHAMENTO,
    rotulo: 'Alinhamento do texto',
    estado: 'alinhamento',
    declaracao,
    props: [
      // `type` é o assunto do componente: fica explícito mesmo no valor padrão.
      `type="${type}"`,
      variant === 'default' ? '' : `variant="${variant}"`,
      size === 'default' ? '' : `size="${size}"`,
      orientation === 'horizontal' ? '' : `orientation="${orientation}"`,
      spacing ? `spacing={${spacing}}` : '',
      disabled ? 'disabled' : '',
    ].filter(Boolean),
  });
}

/**
 * Serve a Multiple (Variants) e a FormattingToolbar (Compositions): no modo
 * combinado o valor é uma lista e as opções somam em vez de se excluírem.
 */
export function toggleGroupFormattingSource(): string {
  return mountGroup({
    itens: FORMATACAO,
    rotulo: 'Formatação',
    estado: 'formatacao',
    declaracao: 'let formatacao: string[] = $state([]);',
    props: ['type="multiple"'],
  });
}

/** MultipleSelected (States): duas opções já combinadas na montagem. */
export function toggleGroupSelectionMultiplaSource(): string {
  return mountGroup({
    itens: FORMATACAO,
    rotulo: 'Formatação',
    estado: 'formatacao',
    declaracao: 'let formatacao = $state(["bold", "italic"]);',
    props: ['type="multiple"'],
  });
}

/** Vertical (Variants): itens empilhados, navegados por ArrowUp/ArrowDown. */
export function toggleGroupVerticalSource(): string {
  return mountGroup({
    itens: VISUALIZACAO,
    rotulo: 'Modo de visualização',
    estado: 'visualizacao',
    declaracao: 'let visualizacao = $state("");',
    props: ['type="single"', 'orientation="vertical"'],
  });
}

/** VerticalViewMode (Compositions): o mesmo empilhado, com a borda única. */
export function toggleGroupVisualizacaoVerticalSource(): string {
  return mountGroup({
    itens: VISUALIZACAO,
    rotulo: 'Modo de visualização',
    estado: 'visualizacao',
    declaracao: 'let visualizacao = $state("");',
    props: ['type="single"', 'variant="outline"', 'orientation="vertical"'],
  });
}

/** AlignmentBar (Compositions): a barra clássica, com a quarta opção. */
export function alignmentSourceToggleGroupBar(): string {
  return mountGroup({
    itens: [...ALINHAMENTO, { value: 'justify', rotulo: 'Justificar', icone: 'alignJustify' }],
    rotulo: 'Alinhamento do texto',
    estado: 'alinhamento',
    declaracao: 'let alinhamento = $state("");',
    props: ['type="single"'],
  });
}

/** DisabledItem (States): uma opção fora de uso sem derrubar o grupo inteiro. */
export function toggleGroupItemDesabilitadoSource(): string {
  return mountGroup({
    itens: [ALINHAMENTO[0], { ...ALINHAMENTO[1], disabled: true }, ALINHAMENTO[2]],
    rotulo: 'Alinhamento do texto',
    estado: 'alinhamento',
    declaracao: 'let alinhamento = $state("");',
    props: ['type="single"'],
  });
}
