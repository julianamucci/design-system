/**
 * Transforms do painel Code do InputGroup.
 *
 * Módulo de TS puro, sem import de `.svelte` em runtime — o único que existe é
 * `import type`, que o compilador apaga. É o que deixa as funções rodarem no
 * projeto `unit` do vitest: a saída do painel não chega ao DOM durante a `play`,
 * então nenhuma suíte de navegador a alcança.
 *
 * Sem estas transforms o painel mostra o nome interno do componente compilado —
 * `<InputGroupStory />` e coisas assim —, e o assunto deste componente é
 * justamente a composição: moldura, addon, texto de apoio, botão e campo
 * encaixados na ordem certa.
 *
 * O construtor é UM só e as stories o parametrizam. Snippet escrito à mão por
 * story diverge do que a story renderiza, e cada metade fica certa sozinha — é
 * o defeito que ninguém enxerga, porque o painel Code não entra no DOM da play.
 *
 * Os identificadores são ingleses; o texto DENTRO do snippet é português,
 * porque é ele que a pessoa lê e copia.
 */
import { svelteSnippet } from '@/lib/story-source';
import type { InputGroupAlign } from './index';
import {
  HIDE_LABEL,
  INVALID_MESSAGE,
  INVALID_MESSAGE_ID,
  NOTE_GROUP_LABEL,
  NOTE_PLACEHOLDER,
  PASSWORD_FIELD_ID,
  PASSWORD_GROUP_LABEL,
  PASTE_LABEL,
  REVEAL_LABEL,
  SEARCH_GROUP_LABEL,
  SEARCH_PLACEHOLDER,
  SEARCH_SHORTCUT,
  SEND_LABEL,
  SITE_FIELD_ID,
  SITE_GROUP_LABEL,
  SITE_PLACEHOLDER,
  SITE_PREFIX,
  SITE_SUFFIX,
} from './input-group.fixtures';

/** Um addon, como a story o descreve antes de virar marcação. */
export interface InputGroupSnippetAddon {
  align: InputGroupAlign;
  /** Texto de apoio — prefixo, sufixo, atalho. */
  label?: string;
  /** Nome do componente de ícone decorativo, quando a story mostra um. */
  icon?: string;
  /** Texto visível do botão, quando o addon carrega um. */
  buttonLabel?: string;
  /** Nome acessível do botão só de ícone. */
  buttonAccessibleName?: string;
  /** Ícone dentro do botão — o botão só de ícone não tem texto visível. */
  buttonIcon?: string;
}

/** O que as stories usam e o snippet precisa mostrar. */
export interface InputGroupSnippetOptions {
  /** Nome acessível do grupo. Ausente, o grupo não recebe nome. */
  'aria-label'?: string;
  placeholder?: string;
  /** Área de texto no lugar do campo de uma linha. */
  multiline?: boolean;
  rows?: number;
  disabled?: boolean;
  /** Marca o CAMPO como inválido e o liga ao texto que descreve o problema. */
  invalid?: boolean;
  /** Rótulo visível acima da moldura — quem nomeia o campo é ELE. */
  visibleLabel?: string;
  addons?: InputGroupSnippetAddon[];
}

/** Args da Playground que chegam à transform do `meta`. */
export interface InputGroupArgs {
  'aria-label'?: string;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
  invalid?: boolean;
}

const CANONICAL_ADDONS: InputGroupSnippetAddon[] = [
  { align: 'inline-start', label: SITE_PREFIX },
  { align: 'inline-end', buttonLabel: PASTE_LABEL },
];

/** Indenta cada linha não vazia com dois espaços. */
function indent(text: string): string {
  return text
    .split('\n')
    .map((line) => (line.trim() ? `  ${line}` : line))
    .join('\n');
}

/**
 * O `import` do InputGroup é quase sempre de muitos nomes, então ele nasce
 * quebrado em linhas — a linha única passaria de 150 colunas num painel
 * estreito. A lista ACOMPANHA o snippet: peça que a story não usa não entra,
 * porque import com nome que o corpo não menciona ensina a importar por hábito.
 */
function groupImport(names: string[]): string {
  return `import {\n${names.map((name) => `  ${name},`).join('\n')}\n} from "@/components/ui/input-group";`;
}

/**
 * O import de um ícone do lucide nesta stack é um módulo por desenho, e o
 * caminho é o nome em minúsculas com hífen — `EyeOff` mora em `eye-off`.
 * Derivar o caminho do nome é o que impede a dupla de sair desencontrada.
 */
function iconImport(name: string): string {
  const path = name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  return `import ${name} from "@lucide/svelte/icons/${path}";`;
}

/**
 * A marcação de um addon, com o que ele carrega dentro.
 *
 * `groupDisabled` desce do GRUPO: um grupo desabilitado não pode entregar um
 * botão vivo lá dentro, e o snippet que omitisse a linha ensinaria justamente o
 * defeito que a story passou a medir.
 */
function addonMarkup(addon: InputGroupSnippetAddon, groupDisabled = false): string {
  const children: string[] = [];

  if (addon.icon) {
    children.push(`<${addon.icon} aria-hidden="true" />`);
  }
  if (addon.label) {
    children.push(`<InputGroupText>${addon.label}</InputGroupText>`);
  }
  if (addon.buttonAccessibleName) {
    // Só de ícone: sem texto visível, o nome acessível é a única pista, e por
    // isso ele é obrigatório aqui em vez de opcional.
    children.push(
      '<InputGroupButton\n'
      + '  size="icon-xs"\n'
      + `  aria-label="${addon.buttonAccessibleName}"\n`
      + '  onclick={handleAddon}\n'
      + '>\n'
      + `  <${addon.buttonIcon ?? 'Eye'} aria-hidden="true" />\n`
      + '</InputGroupButton>',
    );
  } else if (addon.buttonLabel) {
    children.push(
      `<InputGroupButton${groupDisabled ? ' disabled' : ''} onclick={handleAddon}>`
      + `${addon.buttonLabel}</InputGroupButton>`,
    );
  }

  return (
    `<InputGroupAddon align="${addon.align}">\n`
    + `${indent(children.join('\n'))}\n`
    + '</InputGroupAddon>'
  );
}

/** O campo, com os atributos que a story de fato liga. */
function fieldMarkup(options: InputGroupSnippetOptions): string {
  const tag = options.multiline ? 'InputGroupTextarea' : 'InputGroupInput';
  const attributes = [
    options.visibleLabel ? `id="${SITE_FIELD_ID}"` : undefined,
    `placeholder="${options.placeholder ?? SITE_PLACEHOLDER}"`,
    options.multiline && options.rows ? `rows={${options.rows}}` : undefined,
    options.disabled ? 'disabled' : undefined,
    // Estado é palavra, nunca só cor: os dois atributos vão no CAMPO e apontam
    // para o texto que descreve o problema. A moldura vermelha é o eco disso.
    options.invalid ? 'aria-invalid="true"' : undefined,
    options.invalid ? `aria-describedby="${INVALID_MESSAGE_ID}"` : undefined,
  ].filter((part): part is string => Boolean(part));

  if (attributes.length <= 1) return `<${tag} ${attributes.join(' ')} />`;
  return `<${tag}\n${attributes.map((part) => `  ${part}`).join('\n')}\n/>`;
}

/**
 * A composição real da família `InputGroup*` com as opções da story.
 *
 * O snippet mostra a MOLDURA, os addons e o campo — e nada além. O estado
 * inválido aparece como o que ele é: dois atributos no CAMPO mais o texto que
 * os explica, e não uma opção de aparência da moldura.
 */
export function inputGroupSnippet(options: InputGroupSnippetOptions = {}): string {
  const addons = options.addons ?? CANONICAL_ADDONS;

  const names = ['InputGroup'];
  if (addons.length) names.push('InputGroupAddon');
  if (addons.some((addon) => addon.label)) names.push('InputGroupText');
  if (addons.some((addon) => addon.buttonLabel || addon.buttonAccessibleName)) {
    names.push('InputGroupButton');
  }
  names.push(options.multiline ? 'InputGroupTextarea' : 'InputGroupInput');

  const icons = [
    ...new Set(
      addons
        .flatMap((addon) => [
          addon.icon,
          addon.buttonAccessibleName ? (addon.buttonIcon ?? 'Eye') : undefined,
        ])
        .filter((name): name is string => Boolean(name)),
    ),
  ];

  const script = [...icons.map(iconImport), groupImport(names)].join('\n');

  // A ORDEM VISUAL é da folha, por `order` em `[data-align]`; a ordem da
  // marcação só precisa pôr o campo entre os addons para a leitura sequencial
  // bater com o desenho quando nada reordena.
  const body = [
    ...addons
      .filter((addon) => addon.align.endsWith('start'))
      .map((addon) => addonMarkup(addon, options.disabled)),
    fieldMarkup(options),
    ...addons
      .filter((addon) => addon.align.endsWith('end'))
      .map((addon) => addonMarkup(addon, options.disabled)),
  ].join('\n\n');

  const groupAttribute = options['aria-label'] ? ` aria-label="${options['aria-label']}"` : '';
  const group = `<InputGroup${groupAttribute}>\n${indent(body)}\n</InputGroup>`;

  if (!options.invalid && !options.visibleLabel) return svelteSnippet(script, group);

  // O rótulo visível e o texto do erro moram FORA da moldura: dentro dela eles
  // herdariam o `cursor: text` do addon e disputariam a largura com o que a
  // pessoa digita.
  const around = [
    options.visibleLabel
      ? `<label class="nds-label" for="${SITE_FIELD_ID}">\n  ${options.visibleLabel}\n</label>`
      : undefined,
    group,
    options.invalid
      ? `<p id="${INVALID_MESSAGE_ID}" class="nds-text-caption nds-text-destructive">\n  ${INVALID_MESSAGE}\n</p>`
      : undefined,
  ].filter((part): part is string => Boolean(part));

  return svelteSnippet(
    script,
    `<div class="nds-stack" data-spacing="sm">\n${indent(around.join('\n'))}\n</div>`,
  );
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Sem args, cai na
 * moldura canônica: prefixo de formato, campo e botão no fim.
 */
export function inputGroupSource(
  _generated?: string,
  ctx?: { args?: Partial<InputGroupArgs> },
): string {
  const args = ctx?.args ?? {};

  return inputGroupSnippet({
    'aria-label': args['aria-label'] ?? SITE_GROUP_LABEL,
    placeholder: args.placeholder ?? SITE_PLACEHOLDER,
    multiline: args.multiline === true,
    rows: args.multiline === true ? 2 : undefined,
    disabled: args.disabled === true,
    invalid: args.invalid === true,
  });
}

/** As quatro posições, uma moldura por posição. */
export function inputGroupAlignmentsSource(): string {
  return inputGroupSnippet({
    placeholder: SITE_PLACEHOLDER,
    addons: [{ align: 'inline-start', label: SITE_PREFIX }],
  });
}

/** Repouso: a moldura sem estado nenhum ligado. */
export function inputGroupRestSource(): string {
  return inputGroupSnippet({ placeholder: SITE_PLACEHOLDER });
}

/**
 * Inválido: os dois atributos no campo, mais o texto que os explica — e o
 * RÓTULO VISÍVEL, que é quem nomeia o campo.
 *
 * O rótulo entra no snippet junto com a story: descrever não é nomear, e um
 * snippet que ligasse `aria-describedby` sem nome ensinaria `label-title-only`
 * a quem copia.
 */
export function inputGroupInvalidSource(): string {
  return inputGroupSnippet({
    placeholder: SITE_PLACEHOLDER,
    invalid: true,
    visibleLabel: SITE_GROUP_LABEL,
  });
}

/** Desabilitado: o atributo é do campo, e a moldura só reage a ele. */
export function inputGroupDisabledSource(): string {
  return inputGroupSnippet({ placeholder: SITE_PLACEHOLDER, disabled: true });
}

/** Busca: ícone decorativo antes, atalho em texto depois. */
export function inputGroupSearchSource(): string {
  return inputGroupSnippet({
    'aria-label': SEARCH_GROUP_LABEL,
    placeholder: SEARCH_PLACEHOLDER,
    addons: [
      { align: 'inline-start', icon: 'Search' },
      { align: 'inline-end', label: SEARCH_SHORTCUT },
    ],
  });
}

/**
 * Senha: o que age é um BOTÃO, e o que ele fez é contado pela PALAVRA.
 *
 * O estado vive FORA do componente — por isso o snippet precisa do `$state`. O
 * nome acessível troca junto com o tipo do campo: o desenho do ícone sozinho
 * não conta nada a quem não o vê.
 */
export function inputGroupPasswordSource(): string {
  const script = `${iconImport('Eye')}
${iconImport('EyeOff')}
${groupImport(['InputGroup', 'InputGroupAddon', 'InputGroupButton', 'InputGroupInput'])}

let visible = $state(false);`;

  // O rótulo VISÍVEL acompanha a story: o nome do grupo pertence ao conjunto
  // campo + botão e o leitor de tela não o empresta ao campo, então sem ele o
  // campo fica anônimo — sem `<label>`, sem `aria-label` e sem `placeholder`,
  // que é o caso da regra `label` do axe. Snippet que diverge da story ensina o
  // defeito a quem copia.
  const markup = `<div class="nds-stack" data-spacing="sm">
  <label class="nds-label" for="${PASSWORD_FIELD_ID}">${PASSWORD_GROUP_LABEL}</label>

  <InputGroup aria-label="${PASSWORD_GROUP_LABEL}">
    <InputGroupInput id="${PASSWORD_FIELD_ID}" type={visible ? "text" : "password"} />

    <InputGroupAddon align="inline-end">
      <InputGroupButton
        size="icon-xs"
        aria-label={visible ? "${HIDE_LABEL}" : "${REVEAL_LABEL}"}
        onclick={() => (visible = !visible)}
      >
        {#if visible}
          <EyeOff aria-hidden="true" />
        {:else}
          <Eye aria-hidden="true" />
        {/if}
      </InputGroupButton>
    </InputGroupAddon>
  </InputGroup>
</div>`;

  return svelteSnippet(script, markup);
}

/** Formato: prefixo e sufixo fixos, com o rótulo visível fora da moldura. */
export function inputGroupAffixSource(): string {
  return inputGroupSnippet({
    placeholder: SITE_PLACEHOLDER,
    visibleLabel: SITE_GROUP_LABEL,
    addons: [
      { align: 'inline-start', label: SITE_PREFIX },
      { align: 'inline-end', label: SITE_SUFFIX },
    ],
  });
}

/** Área de texto com barra embaixo — a folha faz o grupo empilhar sozinha. */
export function inputGroupTextareaToolbarSource(): string {
  return inputGroupSnippet({
    'aria-label': NOTE_GROUP_LABEL,
    placeholder: NOTE_PLACEHOLDER,
    multiline: true,
    rows: 3,
    addons: [{ align: 'block-end', buttonLabel: SEND_LABEL }],
  });
}
