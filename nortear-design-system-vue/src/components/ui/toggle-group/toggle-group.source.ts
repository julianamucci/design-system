/**
 * Transforms do painel Code do ToggleGroup.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 */
import {
  attr,
  attrBool,
  attrNum,
  attrs,
  attrsMultilinha,
  asCode,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type ToggleGroupArgs = {
  type: 'single' | 'multiple';
  disabled: boolean;
  orientation: 'horizontal' | 'vertical';
  variant: 'default' | 'outline';
  size: 'default' | 'sm' | 'lg';
  spacing: number;
};

const IMPORT = `import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'`;

/**
 * Um item do grupo: o valor que entra na seleção, o nome acessível e o ícone.
 *
 * O rótulo é obrigatório porque todo item aqui é icon-only — sem `aria-label` o
 * botão fica anônimo, e o ícone entra `aria-hidden` justamente para não competir
 * com esse nome.
 */
type Item = {
  value: string;
  label: string;
  icone: string;
  disabled?: boolean;
  variant?: string;
};

const ALIGNMENT: Item[] = [
  { value: 'left', label: 'Alinhar à esquerda', icone: 'AlignLeft' },
  { value: 'center', label: 'Centralizar', icone: 'AlignCenter' },
  { value: 'right', label: 'Alinhar à direita', icone: 'AlignRight' },
];

const ALIGNMENT_WITH_JUSTIFICAR: Item[] = [
  ...ALIGNMENT,
  { value: 'justify', label: 'Justificar', icone: 'AlignJustify' },
];

const FORMATTING: Item[] = [
  { value: 'bold', label: 'Negrito', icone: 'Bold' },
  { value: 'italic', label: 'Itálico', icone: 'Italic' },
  { value: 'underline', label: 'Sublinhado', icone: 'Underline' },
];

const VISUALIZACAO: Item[] = [
  { value: 'grid', label: 'Grade', icone: 'LayoutGrid' },
  { value: 'list', label: 'Lista', icone: 'List' },
];

/** Os mesmos três alinhamentos, com o nome do tamanho no rótulo de cada um. */
function sizeAlignment(sufixo: string): Item[] {
  return [
    { value: 'left', label: `Esquerda ${sufixo}`, icone: 'AlignLeft' },
    { value: 'center', label: `Centro ${sufixo}`, icone: 'AlignCenter' },
    { value: 'right', label: `Direita ${sufixo}`, icone: 'AlignRight' },
  ];
}

/** Importa da biblioteca de ícones só o que a composição usa, sem repetir. */
function importIcons(...listas: Item[][]): string {
  const names = [...new Set(listas.flat().map((item) => item.icone))];
  return `import { ${names.join(', ')} } from 'lucide-vue-next'`;
}

/** Bloco `<script setup>` completo: o componente e os ícones da composição. */
function script(...listas: Item[][]): string {
  return `${IMPORT}\n${importIcons(...listas)}`;
}

/**
 * O grupo com seus itens, já indentado por `recuo` — as composições que
 * empilham mais de um grupo entregam o corpo aninhado num contêiner.
 *
 * A fila de atributos da raiz quebra em uma linha por atributo quando fica
 * longa: atributo em linha comprida some na barra de rolagem do painel.
 */
function group(options: {
  root: Array<string | false | null | undefined>;
  items: Item[];
  recuo?: number;
}): string {
  const p = ' '.repeat(options.recuo ?? 0);
  const abertura = attrsMultilinha(options.root, `${p}  `);
  const fecha = abertura.endsWith('\n') ? `${p}>` : '>';
  const body = options.items
    .map((item) => {
      const attrList = attrs(
        item.variant && `variant="${item.variant}"`,
        `value="${item.value}"`,
        item.disabled && 'disabled',
        `aria-label="${item.label}"`,
      );
      return `${p}  <ToggleGroupItem${attrList}>
${p}    <${item.icone} aria-hidden="true" />
${p}  </ToggleGroupItem>`;
    })
    .join('\n');
  return `${p}<ToggleGroup${abertura}${fecha}
${body}
${p}</ToggleGroup>`;
}

/**
 * Forma canônica: o grupo nomeado e um item icon-only por opção.
 *
 * O modo de seleção nunca é omitido — ele é a decisão que muda o formato do
 * valor (um texto em `single`, uma lista em `multiple`), e sai do control por
 * `asCode` porque o Storybook entrega arg de ação como função.
 */
export const toggleGroupSource: SourceTransform<ToggleGroupArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const mode = asCode(args.type) === 'multiple' ? 'multiple' : 'single';
  return vueSnippet(
    script(ALIGNMENT),
    group({
      root: [
        `type="${mode}"`,
        attr('orientation', args.orientation, 'horizontal'),
        attr('variant', args.variant, 'default'),
        attr('size', args.size, 'default'),
        attrNum('spacing', args.spacing, 0),
        attrBool('disabled', args.disabled, false),
        'aria-label="Alinhamento do texto"',
      ],
      items: ALIGNMENT,
    }),
  );
};

/** Escolha exclusiva: um valor só, e o item inicial vem de `default-value`. */
export function toggleGroupSingleSource(): string {
  return vueSnippet(
    script(ALIGNMENT),
    group({
      root: ['type="single"', 'default-value="center"', 'aria-label="Alinhamento do texto"'],
      items: ALIGNMENT,
    }),
  );
}

/**
 * Escolha combinada: o valor vira LISTA, e por isso `default-value` precisa da
 * ligação `:` — um atributo cru entregaria a string em vez do array.
 */
export function toggleGroupMultipleSource(): string {
  return vueSnippet(
    script(FORMATTING),
    group({
      root: [
        'type="multiple"',
        `:default-value="['bold', 'italic']"`,
        'aria-label="Formatação"',
      ],
      items: FORMATTING,
    }),
  );
}

/**
 * Eixo vertical: os itens empilham e o par de setas do teclado troca de eixo
 * junto. O contorno vai no GRUPO, que emenda os itens num contêiner só.
 */
export function toggleGroupVerticalSource(): string {
  return vueSnippet(
    script(VISUALIZACAO),
    group({
      root: [
        'type="single"',
        'orientation="vertical"',
        'variant="outline"',
        'default-value="grid"',
        'aria-label="Modo de visualização"',
      ],
      items: VISUALIZACAO,
    }),
  );
}

/** Estado de partida: nenhum item selecionado, nenhum valor inicial. */
export function toggleGroupDefaultSource(): string {
  return vueSnippet(
    script(ALIGNMENT),
    group({
      root: ['type="single"', 'aria-label="Alinhamento do texto"'],
      items: ALIGNMENT,
    }),
  );
}

/**
 * Item selecionado: quem liga o estado inicial é `default-value`, não um
 * atributo no item — o grupo é o dono da seleção.
 */
export function toggleGroupSelectedSource(): string {
  return toggleGroupSingleSource();
}

/** Grupo inteiro desabilitado: a prop mora na raiz e desce para todos. */
export function toggleGroupDisabledSource(): string {
  return vueSnippet(
    script(ALIGNMENT),
    group({
      root: ['type="single"', 'disabled', 'aria-label="Alinhamento do texto"'],
      items: ALIGNMENT,
    }),
  );
}

/** Um item só fora de alcance: aqui a prop mora no ITEM, e o grupo segue vivo. */
export function toggleGroupItemDisabledSource(): string {
  return vueSnippet(
    script(ALIGNMENT),
    group({
      root: ['type="single"', 'aria-label="Alinhamento do texto"'],
      items: ALIGNMENT.map((item) =>
        item.value === 'center' ? { ...item, disabled: true } : item,
      ),
    }),
  );
}

/** Barra de alinhamento: quatro opções emendadas pelo contorno do grupo. */
export function toggleGroupBarAlignmentSource(): string {
  return vueSnippet(
    script(ALIGNMENT_WITH_JUSTIFICAR),
    group({
      root: [
        'type="single"',
        'variant="outline"',
        'default-value="left"',
        'aria-label="Alinhamento do texto"',
      ],
      items: ALIGNMENT_WITH_JUSTIFICAR,
    }),
  );
}

/** Barra de formatação: negrito, itálico e sublinhado convivem ligados. */
export function toggleGroupBarFormattingSource(): string {
  return vueSnippet(
    script(FORMATTING),
    group({
      root: ['type="multiple"', `:default-value="['bold']"`, 'aria-label="Formatação"'],
      items: FORMATTING,
    }),
  );
}

/**
 * Itens separados: com `spacing` o grupo deixa de emendar os botões, e por isso
 * o contorno passa para o ITEM — `variant="outline"` na raiz zeraria a borda de
 * cada um para desenhar um contêiner só, o oposto do que a composição mostra.
 */
export function toggleGroupWithSpacingSource(): string {
  return vueSnippet(
    script(FORMATTING),
    group({
      root: ['type="multiple"', ':spacing="1"', 'aria-label="Formatação"'],
      items: FORMATTING.map((item) => ({ ...item, variant: 'outline' })),
    }),
  );
}

/**
 * Os três tamanhos lado a lado. O grupo do meio sai SEM `size`: é o padrão, e
 * escrevê-lo ensinaria que o tamanho precisa ser declarado sempre.
 */
export function toggleGroupSizesSource(): string {
  const escalas: Array<{ size?: string; sufixo: string; label: string }> = [
    { size: 'sm', sufixo: 'sm', label: 'Alinhamento pequeno' },
    { sufixo: 'default', label: 'Alinhamento padrão' },
    { size: 'lg', sufixo: 'lg', label: 'Alinhamento grande' },
  ];
  const groups = escalas
    .map((escala) =>
      group({
        root: [
          'type="single"',
          escala.size ? `size="${escala.size}"` : '',
          'default-value="left"',
          `aria-label="${escala.label}"`,
        ],
        items: sizeAlignment(escala.sufixo),
        recuo: 2,
      }),
    )
    .join('\n');
  return vueSnippet(
    script(ALIGNMENT),
    `<div class="nds-stack" data-spacing="sm">
${groups}
</div>`,
  );
}
