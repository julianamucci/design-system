/**
 * Transforms do painel Code do Combobox.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * O que as stories embrulham em volta do campo — largura do canvas, altura
 * reservada para a caixa aberta — é enquadramento de story e fica de fora do
 * snippet. Quem consome escreve o campo, não a moldura.
 */
import {
  attr,
  attrBool,
  attrs,
  indentar,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type ComboboxArgs = {
  multiple?: boolean;
  disabled?: boolean;
  name?: string;
  placeholder?: string;
};

/** Os nomes que a composição usa, um por linha, do design system. */
function importing(...names: string[]): string {
  return `import {
${names.map((name) => `  ${name},`).join('\n')}
} from '@/components/ui/combobox'`;
}

const IMPORT_SINGLE = importing(
  'Combobox',
  'ComboboxClear',
  'ComboboxEmpty',
  'ComboboxIcon',
  'ComboboxInput',
  'ComboboxInputWrapper',
  'ComboboxItem',
  'ComboboxItemIndicator',
  'ComboboxLabel',
  'ComboboxList',
  'ComboboxPopup',
  'ComboboxPositioner',
  'ComboboxTrigger',
);

const IMPORT_MULTIPLE = importing(
  'Combobox',
  'ComboboxChip',
  'ComboboxChipRemove',
  'ComboboxChips',
  'ComboboxEmpty',
  'ComboboxIcon',
  'ComboboxInput',
  'ComboboxInputWrapper',
  'ComboboxItem',
  'ComboboxItemIndicator',
  'ComboboxLabel',
  'ComboboxList',
  'ComboboxPopup',
  'ComboboxPositioner',
  'ComboboxTrigger',
);

const IMPORT_GROUPED = importing(
  'Combobox',
  'ComboboxEmpty',
  'ComboboxGroup',
  'ComboboxGroupLabel',
  'ComboboxIcon',
  'ComboboxInput',
  'ComboboxInputWrapper',
  'ComboboxItem',
  'ComboboxItemIndicator',
  'ComboboxLabel',
  'ComboboxList',
  'ComboboxPopup',
  'ComboboxPositioner',
  'ComboboxSeparator',
  'ComboboxTrigger',
);

const COUNTRIES = `const countries = [
  { value: 'brasil', label: 'Brasil' },
  { value: 'argentina', label: 'Argentina' },
  { value: 'chile', label: 'Chile' },
]`;

const TECHNOLOGIES = `const technologies = [
  { value: 'react', label: 'React' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'angular', label: 'Angular' },
]`;

const LOOP_ITEMS = `<ComboboxItem
  v-for="country in countries"
  :key="country.value"
  :value="country.value"
>
  {{ country.label }}
  <ComboboxItemIndicator />
</ComboboxItem>`;

/**
 * A caixa da lista, sempre igual: posicionador, caixa e lista, com a mensagem
 * de lista vazia IRMÃ da lista — região viva não é filha permitida de
 * `role="listbox"`.
 */
function popup(items: string): string {
  return `<ComboboxPositioner>
  <ComboboxPopup>
    <ComboboxList>
${indentar(items, 6)}
    </ComboboxList>
    <ComboboxEmpty>Nenhum resultado</ComboboxEmpty>
  </ComboboxPopup>
</ComboboxPositioner>`;
}

/**
 * A forma do campo: raiz dona do valor, rótulo amarrado ao texto, a caixa que
 * guarda chips e texto, e a lista logo abaixo. O papel de combobox, o filtro e
 * o teclado vêm do componente.
 */
function field(options: {
  root?: Array<string | false | null | undefined>;
  label: string;
  chips?: string;
  input?: Array<string | false | null | undefined>;
  clear?: boolean;
  items: string;
}): string {
  const { root = [], label, chips, input = [], clear = false, items } = options;
  const chipsBlock = chips ? `${indentar(chips, 4)}\n` : '';
  const clearBlock = clear ? '    <ComboboxClear aria-label="Limpar" />\n' : '';
  return `<Combobox${attrs(...root)}>
  <ComboboxLabel>${label}</ComboboxLabel>
  <ComboboxInputWrapper>
${chipsBlock}    <ComboboxInput${attrs(...input)} />
${clearBlock}    <ComboboxTrigger aria-label="Abrir lista">
      <ComboboxIcon />
    </ComboboxTrigger>
  </ComboboxInputWrapper>
${indentar(popup(items), 2)}
</Combobox>`;
}

/** Forma canônica: escolha única, com busca dentro do próprio campo. */
export const comboboxSource: SourceTransform<ComboboxArgs> = (_generated, ctx) => {
  const args = ctx?.args ?? {};
  return vueSnippet(
    `import { ref } from 'vue'
${IMPORT_SINGLE}

${COUNTRIES}

const country = ref('')`,
    field({
      root: [
        'v-model="country"',
        attrBool('multiple', args.multiple, false),
        attrBool('disabled', args.disabled, false),
        attr('name', args.name),
      ],
      label: 'País',
      input: [attr('placeholder', args.placeholder ?? 'Buscar país')],
      clear: true,
      items: LOOP_ITEMS,
    }),
  );
};

/**
 * Modo múltiplo: cada escolhido vira um chip dentro do campo. Os chips saem do
 * MESMO valor que a raiz guarda — não há segunda lista a manter em dia.
 */
export function comboboxMultipleSource(): string {
  const chips = [
    '<ComboboxChips>',
    '  <ComboboxChip',
    '    v-for="item in chips"',
    '    :key="item.value"',
    '    :value="item.value"',
    '  >',
    '    {{ item.label }}',
    `    <ComboboxChipRemove :aria-label="'Remover ' + item.label" />`,
    '  </ComboboxChip>',
    '</ComboboxChips>',
  ].join('\n');

  return vueSnippet(
    `import { computed, ref } from 'vue'
${IMPORT_MULTIPLE}

${TECHNOLOGIES}

const chosen = ref(['react', 'vue'])
const chips = computed(() =>
  chosen.value.flatMap((value) => technologies.filter((item) => item.value === value)),
)`,
    field({
      root: ['v-model="chosen"', 'multiple'],
      label: 'Tecnologias',
      chips,
      input: ['placeholder="Adicionar tecnologia"'],
      items: `<ComboboxItem
  v-for="item in technologies"
  :key="item.value"
  :value="item.value"
>
  {{ item.label }}
  <ComboboxItemIndicator />
</ComboboxItem>`,
    }),
  );
}

/** Lista agrupada: cabeçalho por categoria e divisor entre os blocos. */
export function comboboxGroupedSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
${IMPORT_GROUPED}

const ingredient = ref('')`,
    field({
      root: ['v-model="ingredient"'],
      label: 'Ingrediente',
      input: ['placeholder="Buscar ingrediente"'],
      items: `<ComboboxGroup>
  <ComboboxGroupLabel>Frutas</ComboboxGroupLabel>
  <ComboboxItem value="maca">
    Maçã
    <ComboboxItemIndicator />
  </ComboboxItem>
  <ComboboxItem value="banana">
    Banana
    <ComboboxItemIndicator />
  </ComboboxItem>
</ComboboxGroup>
<ComboboxSeparator />
<ComboboxGroup>
  <ComboboxGroupLabel>Legumes</ComboboxGroupLabel>
  <ComboboxItem value="cenoura">
    Cenoura
    <ComboboxItemIndicator />
  </ComboboxItem>
  <ComboboxItem value="batata">
    Batata
    <ComboboxItemIndicator />
  </ComboboxItem>
</ComboboxGroup>`,
    }),
  );
}

/**
 * Campo bloqueado: a raiz impede a abertura, e é ela que apaga o botão de
 * remover de cada chip — o bloqueio não pode depender de quem monta a marcação.
 */
export function comboboxDisabledSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
${IMPORT_SINGLE}

${COUNTRIES}

const country = ref('brasil')`,
    field({
      root: ['v-model="country"', 'disabled'],
      label: 'País',
      input: ['placeholder="Buscar país"'],
      items: LOOP_ITEMS,
    }),
  );
}

/**
 * Campo reprovado: `aria-invalid` no texto, e a mensagem escrita ao lado. A
 * borda de perigo vem da folha — a cor é reforço do aviso, nunca o aviso.
 */
export function comboboxInvalidSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
${IMPORT_SINGLE}

${COUNTRIES}

const country = ref('')`,
    `<div class="nds-stack" data-spacing="sm">
${indentar(
  field({
    root: ['v-model="country"'],
    label: 'País',
    input: ['placeholder="Buscar país"', 'aria-invalid="true"'],
    items: LOOP_ITEMS,
  }),
)}
  <p class="nds-text-body nds-text-destructive">Escolha um país para continuar.</p>
</div>`,
  );
}

/**
 * Dentro de um formulário: `name` na raiz é o que faz o valor viajar no envio —
 * o componente mantém um campo escondido com esse nome, e é ele que a
 * serialização nativa enxerga.
 */
export function comboboxInFormSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
import { Button } from '@/components/ui/button'
${IMPORT_SINGLE}

${COUNTRIES}

const country = ref('')`,
    `<form class="nds-stack nds-w-xs" data-spacing="md" @submit.prevent>
${indentar(
  field({
    root: ['v-model="country"', 'name="country"'],
    label: 'País',
    input: ['placeholder="Buscar país"'],
    items: LOOP_ITEMS,
  }),
)}
  <Button type="submit">Enviar</Button>
</form>`,
  );
}
