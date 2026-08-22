/**
 * Transforms do painel Code do Toggle.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções
 * rodarem no projeto `unit` do vitest. A saída do painel não chega ao DOM
 * durante a `play`, então este é o único lugar em que elas têm guarda.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

/** Nome do componente e caminho do módulo de cada ícone usado nas stories. */
const ICONS = {
  bold: ['Bold', 'bold'],
  italic: ['Italic', 'italic'],
  underline: ['Underline', 'underline'],
  list: ['List', 'list'],
  eye: ['Eye', 'eye'],
  layout: ['LayoutGrid', 'layout-grid'],
} as const;

type IconKey = keyof typeof ICONS;

export type ToggleArgs = {
  pressed: boolean;
  disabled: boolean;
  ariaInvalid: boolean;
  variant: 'default' | 'outline';
  size: 'default' | 'sm' | 'lg';
  icon: IconKey;
  label: string;
  ariaLabel: string;
  withLabel: boolean;
};

const IMPORT = `import { Toggle } from "@/components/ui/toggle";`;

/** Bloco de imports: o componente do design system mais os ícones do exemplo. */
function importing(...icones: IconKey[]): string {
  return [
    IMPORT,
    ...icones.map((chave) => {
      const [nome, caminho] = ICONS[chave];
      return `import ${nome} from "@lucide/svelte/icons/${caminho}";`;
    }),
  ].join('\n');
}

/** Um toggle só de ícone, numa linha — a forma que as comparações repetem. */
function toggleLine(icone: IconKey, ...props: string[]): string {
  return `<Toggle${attrs(...props)}><${ICONS[icone][0]} aria-hidden="true" /></Toggle>`;
}

/** Playground: um toggle só, com os valores atuais dos controls. */
export function toggleSource(_gerado?: string, ctx?: { args?: Partial<ToggleArgs> }): string {
  const {
    variant = 'default',
    size = 'default',
    pressed = false,
    disabled = false,
    ariaInvalid = false,
    icon = 'bold',
    label = 'Negrito',
    ariaLabel,
    withLabel = false,
  } = ctx?.args ?? {};

  const props = attrs(
    variant === 'default' ? '' : `variant="${variant}"`,
    size === 'default' ? '' : `size="${size}"`,
    pressed ? 'pressed' : '',
    disabled ? 'disabled' : '',
    ariaInvalid ? 'aria-invalid="true"' : '',
    // Sem texto visível, o botão não tem nome acessível nenhum sem isto.
    withLabel ? '' : `aria-label="${ariaLabel || label || 'Alternar'}"`,
  );

  const icone = ICONS[icon][0];
  const corpo = withLabel
    ? `  <${icone} aria-hidden="true" />\n  ${label}`
    : `  <${icone} aria-hidden="true" />`;

  return svelteSnippet(importing(icon), `<Toggle${props}>\n${corpo}\n</Toggle>`);
}

/**
 * Serve a Outline (Variants) e a FocusVisible (States): o mesmo par de
 * variantes lado a lado. O foco é estado de execução, não muda a marcação.
 */
export function variantsTogglePairSource(): string {
  return svelteSnippet(
    importing('bold', 'italic'),
    `<div class="nds-cluster" data-spacing="sm">
  ${toggleLine('bold', 'aria-label="Negrito"')}
  ${toggleLine('italic', 'variant="outline"', 'aria-label="Itálico"')}
</div>`,
  );
}

/** Sizes (Variants): a escada de densidade, com o degrau padrão sem atributo. */
export function toggleSizesSource(): string {
  return svelteSnippet(
    importing('bold'),
    `<div class="nds-cluster" data-spacing="sm">
  ${toggleLine('bold', 'variant="outline"', 'size="sm"', 'aria-label="Negrito pequeno"')}
  ${toggleLine('bold', 'variant="outline"', 'aria-label="Negrito padrão"')}
  ${toggleLine('bold', 'variant="outline"', 'size="lg"', 'aria-label="Negrito grande"')}
</div>`,
  );
}

/** WithLabel (Variants): com texto visível o aria-label vira ruído. */
export function toggleWithLabelSource(): string {
  return svelteSnippet(
    `${importing('eye', 'list')}

let compacta = $state(true);`,
    `<div class="nds-cluster" data-spacing="sm">
  <Toggle variant="outline">
    <Eye aria-hidden="true" />
    Mostrar ocultos
  </Toggle>
  <Toggle variant="outline" bind:pressed={compacta}>
    <List aria-hidden="true" />
    Visão compacta
  </Toggle>
</div>`,
  );
}

/** On (States): o inativo ao lado do ativo — é o contraste que se documenta. */
export function toggleActiveSource(): string {
  return svelteSnippet(
    `${importing('bold')}

let ativo = $state(true);`,
    `<div class="nds-cluster" data-spacing="sm">
  ${toggleLine('bold', 'aria-label="Negrito inativo"')}
  ${toggleLine('bold', 'bind:pressed={ativo}', 'aria-label="Negrito ativo"')}
</div>`,
  );
}

/** Disabled (States): o desabilitado nativo, ligado e desligado. */
export function toggleDisabledSource(): string {
  return svelteSnippet(
    `${importing('bold', 'italic')}

let ativo = $state(true);`,
    `<div class="nds-cluster" data-spacing="sm">
  ${toggleLine('bold', 'disabled', 'aria-label="Negrito"')}
  ${toggleLine('italic', 'disabled', 'bind:pressed={ativo}', 'aria-label="Itálico ativo e desabilitado"')}
</div>`,
  );
}

/** Invalid (States): o erro é o par aria-invalid + aria-describedby. */
export function toggleInvalidoSource(): string {
  return svelteSnippet(
    importing('bold'),
    `<div class="nds-stack" data-spacing="xs">
  <Toggle aria-invalid="true" aria-describedby="toggle-invalid-msg" aria-label="Negrito">
    <Bold aria-hidden="true" />
  </Toggle>
  <p id="toggle-invalid-msg" class="nds-text-body nds-text-destructive">
    Selecione ao menos uma formatação.
  </p>
</div>`,
  );
}

/** FormattingToolbar (Compositions): os toggles independentes num grupo nomeado. */
export function formattingToggleBarSource(): string {
  return svelteSnippet(
    importing('bold', 'italic', 'underline', 'list'),
    `<div
  role="group"
  aria-label="Formatação de texto"
  class="nds-cluster nds-rounded-lg nds-border-default nds-p-1"
  data-align="center"
  data-spacing="xs"
>
  ${toggleLine('bold', 'aria-label="Negrito"')}
  ${toggleLine('italic', 'aria-label="Itálico"')}
  ${toggleLine('underline', 'aria-label="Sublinhado"')}
  ${toggleLine('list', 'aria-label="Lista"')}
</div>`,
  );
}

/** FilterList (Compositions): cada filtro é uma escolha booleana isolada. */
export function toggleFiltersSource(): string {
  return svelteSnippet(
    `${importing('eye', 'list')}

let compacta = $state(true);`,
    `<div class="nds-stack" data-spacing="sm">
  <p class="nds-text-body nds-font-semibold">Filtros de exibição</p>
  <div class="nds-cluster" data-spacing="sm">
    <Toggle variant="outline">
      <Eye aria-hidden="true" />
      Mostrar ocultos
    </Toggle>
    <Toggle variant="outline" bind:pressed={compacta}>
      <List aria-hidden="true" />
      Visão compacta
    </Toggle>
  </div>
</div>`,
  );
}

/** Controlled (Compositions): o estado externo acompanha o toggle nos dois sentidos. */
export function toggleControlledSource(): string {
  return svelteSnippet(
    `${importing('bold')}

let ativo = $state(false);`,
    `<div class="nds-stack" data-spacing="sm">
  ${toggleLine('bold', 'bind:pressed={ativo}', 'aria-label="Negrito"')}
  <p class="nds-text-caption nds-text-muted-foreground">
    Estado atual: <code class="nds-font-mono">{String(ativo)}</code>
  </p>
</div>`,
  );
}
