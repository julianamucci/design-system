/**
 * Transforms do painel Code do Toggle.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * A regra de nome acessível vale para todo snippet daqui e é a lição central do
 * componente: sem texto visível, o botão PRECISA de `aria-label`; com texto
 * visível, o `aria-label` seria ruído — e um que discorde do texto quebra a
 * WCAG 2.5.3. Os dois modos nunca aparecem juntos.
 */
import {
  attr,
  attrBool,
  attrs,
  asCode,
  indentar,
  texto,
  vueSnippet,
  type SourceTransform,
} from '@/lib/story-source';

export type ToggleArgs = {
  modelValue?: boolean;
  defaultValue: boolean;
  disabled: boolean;
  variant: 'default' | 'outline';
  size: 'default' | 'sm' | 'lg';
  label: string;
  iconOnly: boolean;
};

const IMPORT_TOGGLE = `import { Toggle } from '@/components/ui/toggle'`;

/**
 * A lista de ícones sai da MARCAÇÃO: escrita à mão, ela desencontra do exemplo
 * na primeira edição, e um ícone importado sem uso ensina import morto.
 */
function importIcons(markup: string): string {
  const names = [
    ...new Set([...markup.matchAll(/<([A-Z][A-Za-z0-9]*) aria-hidden/g)].map((m) => m[1])),
  ].sort();
  return names.length ? `import { ${names.join(', ')} } from 'lucide-vue-next'` : '';
}

function snippet(markup: string, state = '', extra = ''): string {
  const imports = [IMPORT_TOGGLE, extra, importIcons(markup)].filter(Boolean).join('\n');
  return vueSnippet(state ? `${imports}\n\n${state}` : imports, markup);
}

/**
 * Toggle sem texto: o ícone é decorativo (`aria-hidden`) e quem nomeia o
 * controle é o `aria-label`. Sem ele o botão não tem nome acessível nenhum.
 */
function iconOnly(icone: string, rotulo: string, atributos = '', umaLine = false): string {
  const abertura = `<Toggle${attrs(atributos, `aria-label="${rotulo}"`)}>`;
  const miolo = `<${icone} aria-hidden="true" />`;
  return umaLine ? `${abertura}${miolo}</Toggle>` : `${abertura}\n  ${miolo}\n</Toggle>`;
}

/**
 * Toggle com texto visível: o próprio texto é o nome acessível, e por isso não
 * há `aria-label` nenhum aqui.
 */
function comRotulo(icone: string, rotulo: string, atributos = ''): string {
  return `<Toggle${attrs(atributos)}>
  <${icone} aria-hidden="true" />
  ${rotulo}
</Toggle>`;
}

/** Fila horizontal — a forma em que os toggles quase sempre aparecem. */
function fila(...itens: string[]): string {
  return `<div class="nds-cluster" data-spacing="sm">
${itens.map((item) => indentar(item)).join('\n')}
</div>`;
}

/**
 * Forma canônica do painel: um toggle com os valores atuais dos controles.
 *
 * O `label` é lido por `asCode`/`texto`: o control é de texto, mas qualquer
 * leitura de `ctx.args` que possa cair num espião de ação precisa da guarda — e
 * as aspas do texto precisam escapar antes de entrar num atributo.
 */
export const toggleSource: SourceTransform<ToggleArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const rotulo = texto(asCode(args.label) ?? 'Alternar');
  const noText = args.iconOnly !== false;
  const atributos = attrs(
    attr('variant', args.variant, 'default'),
    attr('size', args.size, 'default'),
    // `modelValue` é a via controlada e não entra aqui: os dois estados no mesmo
    // exemplo brigariam entre si.
    attrBool('default-value', args.defaultValue, false),
    attrBool('disabled', args.disabled, false),
  ).trim();
  const markup = noText
    ? iconOnly('Bold', rotulo, atributos)
    : comRotulo('Eye', rotulo, atributos);
  return snippet(markup);
};

/**
 * A forma mínima: um toggle de ícone. A variante e o degrau padrão não são
 * escritos — no componente eles são a AUSÊNCIA do atributo, não o valor
 * "default".
 */
export function toggleIconSource(): string {
  return snippet(iconOnly('Bold', 'Negrito'));
}

/** Contorno ao lado do padrão: a borda é a diferença, e é ela que o par mostra. */
export function toggleContornoSource(): string {
  return snippet(fila(iconOnly('Bold', 'Negrito'), iconOnly('Italic', 'Itálico', 'variant="outline"')));
}

/**
 * Com texto visível: o rótulo entra no corpo do botão e o `aria-label` sai de
 * cena. O segundo já nasce ligado, por `default-value`.
 */
export function toggleWithLabelSource(): string {
  return snippet(
    fila(
      comRotulo('Eye', 'Mostrar ocultos', 'variant="outline"'),
      comRotulo('List', 'Visão compacta', 'variant="outline" default-value'),
    ),
  );
}

/**
 * A escada de degraus. O do meio não escreve `size`: o padrão é a ausência do
 * atributo, e escrevê-lo ensinaria ruído.
 */
export function toggleSizesSource(): string {
  return snippet(
    fila(
      iconOnly('Bold', 'Negrito pequeno', 'variant="outline" size="sm"'),
      iconOnly('Bold', 'Negrito padrão', 'variant="outline"'),
      iconOnly('Bold', 'Negrito grande', 'variant="outline" size="lg"'),
    ),
  );
}

/**
 * Ligado na montagem, ao lado do desligado. `default-value` é o estado de
 * PARTIDA do controle não-controlado; quem precisa dirigir o estado depois usa
 * `v-model`.
 */
export function toggleActiveSource(): string {
  return snippet(
    fila(
      iconOnly('Bold', 'Negrito inativo'),
      iconOnly('Bold', 'Negrito ativo', 'default-value'),
    ),
  );
}

/**
 * Foco por teclado nas duas variantes. Não há prop a escrever — o anel vem do
 * CSS do componente. O que o exemplo mostra é que o par precisa existir para se
 * comparar: na variante com borda, a sombra de elevação já está lá em repouso.
 */
export function toggleFocusSource(): string {
  return snippet(
    fila(iconOnly('Bold', 'Negrito'), iconOnly('Italic', 'Itálico', 'variant="outline"')),
  );
}

/**
 * Desabilitado nos dois estados. É o `disabled` NATIVO: além de anunciar, tira o
 * botão da ordem de tabulação — um `aria-disabled` sozinho deixaria o foco
 * entrar num controle que não responde.
 */
export function toggleDisabledSource(): string {
  return snippet(
    fila(
      iconOnly('Bold', 'Negrito', 'disabled'),
      iconOnly('Italic', 'Itálico ativo e desabilitado', 'disabled default-value'),
    ),
  );
}

/**
 * Erro: `aria-invalid` marca o controle e `aria-describedby` aponta para a
 * mensagem. O anel destrutivo vem do CSS do componente — o exemplo não pinta
 * nada.
 */
export function toggleInvalidoSource(): string {
  return snippet(
    `<div class="nds-stack" data-spacing="xs">
${indentar(iconOnly('Bold', 'Negrito', 'aria-invalid="true" aria-describedby="formatacao-erro"'))}
  <p id="formatacao-erro" class="nds-text-body nds-text-destructive">Selecione ao menos uma formatação.</p>
</div>`,
  );
}

/**
 * Barra de formatação: os toggles viram um conjunto, e o conjunto precisa de
 * nome próprio — `role="group"` com `aria-label`. Sem ele, quem usa leitor de
 * tela ouve quatro botões soltos sem saber a que pertencem.
 *
 * Cada toggle é independente: aqui não há escolha única, e por isso não é um
 * grupo de rádio.
 */
export function formattingToggleBarSource(): string {
  const buttons = [
    ['Bold', 'Negrito'],
    ['Italic', 'Itálico'],
    ['Underline', 'Sublinhado'],
    ['List', 'Lista'],
  ] as const;
  return snippet(
    `<div
  role="group"
  aria-label="Formatação de texto"
  class="nds-cluster nds-rounded-lg nds-border-default nds-p-1"
  data-align="center"
  data-spacing="xs"
>
${buttons.map(([icone, rotulo]) => indentar(iconOnly(icone, rotulo, '', true))).join('\n')}
</div>`,
  );
}

/**
 * Lista de filtros: cada toggle é uma escolha booleana isolada, e elas combinam
 * entre si. O título da seção não é o nome dos controles — cada um se nomeia
 * pelo próprio texto visível.
 */
export function filtersToggleListSource(): string {
  return snippet(
    `<div class="nds-stack" data-spacing="sm">
  <p class="nds-text-body nds-font-semibold">Filtros de exibição</p>
${indentar(
  fila(
    comRotulo('Eye', 'Mostrar ocultos', 'variant="outline"'),
    comRotulo('List', 'Visão compacta', 'variant="outline" default-value'),
  ),
)}
</div>`,
  );
}

/**
 * Controlado: o estado sai do componente e passa a viver na aplicação, por
 * `v-model`. É o caminho de quem precisa reagir à troca em outro lugar da tela.
 */
export function toggleControlledSource(): string {
  return snippet(
    `<div class="nds-stack" data-spacing="sm">
${indentar(iconOnly('Bold', 'Negrito', 'v-model="negrito"'))}
  <p class="nds-text-caption nds-text-muted-foreground">
    Estado atual: <code class="nds-font-mono">{{ negrito }}</code>
  </p>
</div>`,
    `const negrito = ref(false)`,
    `import { ref } from 'vue'`,
  );
}
