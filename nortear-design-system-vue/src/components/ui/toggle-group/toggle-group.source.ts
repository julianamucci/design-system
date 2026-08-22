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
  valor: string;
  rotulo: string;
  icone: string;
  desabilitado?: boolean;
  variante?: string;
};

const ALIGNMENT: Item[] = [
  { valor: 'left', rotulo: 'Alinhar à esquerda', icone: 'AlignLeft' },
  { valor: 'center', rotulo: 'Centralizar', icone: 'AlignCenter' },
  { valor: 'right', rotulo: 'Alinhar à direita', icone: 'AlignRight' },
];

const ALIGNMENT_WITH_JUSTIFICAR: Item[] = [
  ...ALIGNMENT,
  { valor: 'justify', rotulo: 'Justificar', icone: 'AlignJustify' },
];

const FORMATTING: Item[] = [
  { valor: 'bold', rotulo: 'Negrito', icone: 'Bold' },
  { valor: 'italic', rotulo: 'Itálico', icone: 'Italic' },
  { valor: 'underline', rotulo: 'Sublinhado', icone: 'Underline' },
];

const VISUALIZACAO: Item[] = [
  { valor: 'grid', rotulo: 'Grade', icone: 'LayoutGrid' },
  { valor: 'list', rotulo: 'Lista', icone: 'List' },
];

/** Os mesmos três alinhamentos, com o nome do tamanho no rótulo de cada um. */
function sizeAlignment(sufixo: string): Item[] {
  return [
    { valor: 'left', rotulo: `Esquerda ${sufixo}`, icone: 'AlignLeft' },
    { valor: 'center', rotulo: `Centro ${sufixo}`, icone: 'AlignCenter' },
    { valor: 'right', rotulo: `Direita ${sufixo}`, icone: 'AlignRight' },
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
function grupo(opcoes: {
  raiz: Array<string | false | null | undefined>;
  itens: Item[];
  recuo?: number;
}): string {
  const p = ' '.repeat(opcoes.recuo ?? 0);
  const abertura = attrsMultilinha(opcoes.raiz, `${p}  `);
  const fecha = abertura.endsWith('\n') ? `${p}>` : '>';
  const corpo = opcoes.itens
    .map((item) => {
      const atributos = attrs(
        item.variante && `variant="${item.variante}"`,
        `value="${item.valor}"`,
        item.desabilitado && 'disabled',
        `aria-label="${item.rotulo}"`,
      );
      return `${p}  <ToggleGroupItem${atributos}>
${p}    <${item.icone} aria-hidden="true" />
${p}  </ToggleGroupItem>`;
    })
    .join('\n');
  return `${p}<ToggleGroup${abertura}${fecha}
${corpo}
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
  const modo = asCode(args.type) === 'multiple' ? 'multiple' : 'single';
  return vueSnippet(
    script(ALIGNMENT),
    grupo({
      raiz: [
        `type="${modo}"`,
        attr('orientation', args.orientation, 'horizontal'),
        attr('variant', args.variant, 'default'),
        attr('size', args.size, 'default'),
        attrNum('spacing', args.spacing, 0),
        attrBool('disabled', args.disabled, false),
        'aria-label="Alinhamento do texto"',
      ],
      itens: ALIGNMENT,
    }),
  );
};

/** Escolha exclusiva: um valor só, e o item inicial vem de `default-value`. */
export function toggleGroupSingleSource(): string {
  return vueSnippet(
    script(ALIGNMENT),
    grupo({
      raiz: ['type="single"', 'default-value="center"', 'aria-label="Alinhamento do texto"'],
      itens: ALIGNMENT,
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
    grupo({
      raiz: [
        'type="multiple"',
        `:default-value="['bold', 'italic']"`,
        'aria-label="Formatação"',
      ],
      itens: FORMATTING,
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
    grupo({
      raiz: [
        'type="single"',
        'orientation="vertical"',
        'variant="outline"',
        'default-value="grid"',
        'aria-label="Modo de visualização"',
      ],
      itens: VISUALIZACAO,
    }),
  );
}

/** Estado de partida: nenhum item selecionado, nenhum valor inicial. */
export function toggleGroupDefaultSource(): string {
  return vueSnippet(
    script(ALIGNMENT),
    grupo({
      raiz: ['type="single"', 'aria-label="Alinhamento do texto"'],
      itens: ALIGNMENT,
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
    grupo({
      raiz: ['type="single"', 'disabled', 'aria-label="Alinhamento do texto"'],
      itens: ALIGNMENT,
    }),
  );
}

/** Um item só fora de alcance: aqui a prop mora no ITEM, e o grupo segue vivo. */
export function toggleGroupItemDisabledSource(): string {
  return vueSnippet(
    script(ALIGNMENT),
    grupo({
      raiz: ['type="single"', 'aria-label="Alinhamento do texto"'],
      itens: ALIGNMENT.map((item) =>
        item.valor === 'center' ? { ...item, desabilitado: true } : item,
      ),
    }),
  );
}

/** Barra de alinhamento: quatro opções emendadas pelo contorno do grupo. */
export function toggleGroupBarAlignmentSource(): string {
  return vueSnippet(
    script(ALIGNMENT_WITH_JUSTIFICAR),
    grupo({
      raiz: [
        'type="single"',
        'variant="outline"',
        'default-value="left"',
        'aria-label="Alinhamento do texto"',
      ],
      itens: ALIGNMENT_WITH_JUSTIFICAR,
    }),
  );
}

/** Barra de formatação: negrito, itálico e sublinhado convivem ligados. */
export function toggleGroupBarFormattingSource(): string {
  return vueSnippet(
    script(FORMATTING),
    grupo({
      raiz: ['type="multiple"', `:default-value="['bold']"`, 'aria-label="Formatação"'],
      itens: FORMATTING,
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
    grupo({
      raiz: ['type="multiple"', ':spacing="1"', 'aria-label="Formatação"'],
      itens: FORMATTING.map((item) => ({ ...item, variante: 'outline' })),
    }),
  );
}

/**
 * Os três tamanhos lado a lado. O grupo do meio sai SEM `size`: é o padrão, e
 * escrevê-lo ensinaria que o tamanho precisa ser declarado sempre.
 */
export function toggleGroupSizesSource(): string {
  const escalas: Array<{ size?: string; sufixo: string; rotulo: string }> = [
    { size: 'sm', sufixo: 'sm', rotulo: 'Alinhamento pequeno' },
    { sufixo: 'default', rotulo: 'Alinhamento padrão' },
    { size: 'lg', sufixo: 'lg', rotulo: 'Alinhamento grande' },
  ];
  const grupos = escalas
    .map((escala) =>
      grupo({
        raiz: [
          'type="single"',
          escala.size ? `size="${escala.size}"` : '',
          'default-value="left"',
          `aria-label="${escala.rotulo}"`,
        ],
        itens: sizeAlignment(escala.sufixo),
        recuo: 2,
      }),
    )
    .join('\n');
  return vueSnippet(
    script(ALIGNMENT),
    `<div class="nds-stack" data-spacing="sm">
${grupos}
</div>`,
  );
}
