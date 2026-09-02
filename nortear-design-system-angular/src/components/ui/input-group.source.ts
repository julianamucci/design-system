import type { InputGroupAlign } from './input-group';
import {
  HIDE_LABEL,
  NOTE_GROUP_LABEL,
  NOTE_PLACEHOLDER,
  PASSWORD_GROUP_LABEL,
  PASTE_LABEL,
  REVEAL_LABEL,
  SEARCH_GROUP_LABEL,
  SEARCH_PLACEHOLDER,
  SEARCH_SHORTCUT,
  SEND_LABEL,
  SITE_GROUP_LABEL,
  SITE_PLACEHOLDER,
  SITE_PREFIX,
  SITE_SUFFIX,
} from './input-group.fixtures';

/**
 * Snippets do painel Code do InputGroup.
 *
 * O painel imprime o `template` da story como está escrito — com os bindings
 * ligados aos args e com o andaime que só existe para a story ocupar a tela.
 * Isso não é o que alguém escreve para usar o componente. Estas funções
 * devolvem o uso real, com os valores atuais dos controls já resolvidos.
 *
 * Vive num arquivo próprio, e não solto na story, porque QUATRO arquivos de
 * story mostram o mesmo componente: repetir o construtor em cada um é como as
 * cópias divergem sem ninguém notar. É também o que o põe ao alcance do teste
 * de unidade, que nenhuma play alcançaria — a saída do painel não vai ao DOM.
 *
 * TODO TEXTO QUE O TEMPLATE LÊ É CAMPO DA CLASSE, e não literal dentro da
 * expressão. Não é estilo: expressão de template do Angular só enxerga membro
 * de classe, e o guarda transversal (`source-snippets.test.ts`) confere isso
 * justamente porque snippet com binding solto entrega ao leitor um código que
 * não resolve na mão dele.
 */

/** Um addon, como a story o descreve antes de virar marcação. */
export type InputGroupSnippetAddon = {
  align: InputGroupAlign;
  /** Texto de apoio — prefixo, sufixo, atalho. */
  text?: string;
  /** Ícone decorativo, mostrado como marcação abreviada. */
  icon?: 'search' | 'reveal';
  /** Texto visível do botão, quando o addon carrega um. */
  buttonLabel?: string;
  /** Botão só de ícone, com o PAR de nomes que se alterna com o estado. */
  buttonToggle?: boolean;
  /** Medida do botão. Nesta stack ela é do `ndsButton`, no mesmo elemento. */
  buttonSize?: 'xs' | 'icon-xs';
  /** Nome do método que o clique chama. Vira membro da classe do exemplo. */
  buttonHandler?: string;
};

/** O que as stories usam da API e que o snippet precisa mostrar. */
export type InputGroupSnippetOptions = {
  /** Nome acessível do grupo. Ausente, o grupo não recebe nome — e é o comum. */
  ariaLabel?: string;
  /**
   * Nome acessível do CAMPO.
   *
   * O nome do grupo não serve de nome para o campo: o leitor anuncia o grupo ao
   * ENTRAR nele, mas o campo em si continua sem nome, e é isso que WCAG 4.1.2
   * cobra e o axe reprova (`label`). Só faz falta quando não há `placeholder`
   * nem rótulo visível — o campo de senha é exatamente esse caso.
   *
   * Nome de verdade, e não um `placeholder` de fachada: `placeholder` satisfaz
   * a regra do axe e some assim que a pessoa digita, o que deixa quem usa
   * ampliação sem referência no meio do preenchimento.
   */
  fieldAriaLabel?: string;
  /** Texto de exemplo. Vazio, o atributo não é escrito — campo de senha não o tem. */
  placeholder?: string;
  /** Tipo do campo de uma linha, quando ele não é o texto padrão. */
  type?: 'password';
  /** Área de texto no lugar do campo de uma linha. A folha empilha sozinha. */
  multiline?: boolean;
  disabled?: boolean;
  /** Marca o CAMPO como inválido e o liga ao texto que descreve o problema. */
  invalid?: boolean;
  addons?: InputGroupSnippetAddon[];
};

const DEFAULT_ADDONS: InputGroupSnippetAddon[] = [
  { align: 'inline-start', text: SITE_PREFIX },
  { align: 'inline-end', buttonLabel: PASTE_LABEL, buttonHandler: 'paste' },
];

/** Marcação abreviada do ícone: o desenho inteiro afogaria o uso que se ensina. */
const ICON_MARKUP: Record<'search' | 'reveal', string> = {
  search: '<svg aria-hidden="true"><!-- lucide: search --></svg>',
  reveal: '<svg aria-hidden="true"><!-- lucide: eye / eye-off --></svg>',
};

/** Recuo de uma linha de marcação dentro do `template`. */
function indent(level: number): string {
  return '  '.repeat(level);
}

/** O bloco de um addon, com o que ele carrega dentro. */
function addonMarkup(
  addon: InputGroupSnippetAddon,
  level: number,
  grupoDesabilitado = false,
): string[] {
  const lines = [indent(level) + '<div ndsInputGroupAddon align="' + addon.align + '">'];

  const buttonIcon = addon.icon && (addon.buttonLabel || addon.buttonToggle);
  // Ícone SEM botão é decoração do compartimento; ícone COM botão é o desenho
  // do próprio controle, e por isso vai dentro dele.
  if (addon.icon && !buttonIcon) lines.push(indent(level + 1) + ICON_MARKUP[addon.icon]);
  if (addon.text) {
    lines.push(indent(level + 1) + '<span ndsInputGroupText>' + addon.text + '</span>');
  }

  if (addon.buttonLabel || addon.buttonToggle) {
    // A medida sai do `ndsButton`, e não desta diretiva: as duas dividem o
    // elemento, e `size` é entrada de lá. Divergência desta stack, e o snippet
    // a ensina como ela é, em vez de mostrar uma prop que aqui não existe.
    const size = addon.buttonSize ?? 'xs';
    const attrs = ['ndsButton', 'variant="ghost"', 'size="' + size + '"', 'ndsInputGroupButton'];
    if (addon.buttonToggle) {
      attrs.push('[attr.aria-label]="revealed() ? hideLabel : revealLabel"');
    }
    if (addon.buttonHandler) attrs.push('(click)="' + addon.buttonHandler + '()"');
    // Grupo desabilitado desabilita o botão do addon TAMBÉM. Sem isto o grupo
    // fica apagado e o botão continua focável e clicável dentro dele — a pior
    // das duas leituras, porque a aparência promete inativo e o teclado entrega
    // ativo.
    if (grupoDesabilitado) attrs.push('disabled');

    lines.push(indent(level + 1) + '<button');
    for (const attr of attrs) lines.push(indent(level + 2) + attr);
    lines.push(indent(level + 1) + '>');
    if (buttonIcon && addon.icon) lines.push(indent(level + 2) + ICON_MARKUP[addon.icon]);
    if (addon.buttonLabel) lines.push(indent(level + 2) + addon.buttonLabel);
    lines.push(indent(level + 1) + '</button>');
  }

  lines.push(indent(level) + '</div>');
  return lines;
}

/**
 * O campo, de uma linha ou de várias, com o estado que a story exercita.
 *
 * `revealable` é o que liga o tipo ao sinal: com o botão de alternância no
 * addon, o tipo do campo é o que MUDA, e um `type` estático deixaria o snippet
 * ensinando um botão que não faz nada visível.
 */
function controlMarkup(
  options: InputGroupSnippetOptions,
  level: number,
  revealable: boolean,
): string[] {
  const placeholder = options.placeholder ?? SITE_PLACEHOLDER;
  const attrs: string[] = [
    options.multiline ? 'ndsInputGroupTextarea' : 'ndsInputGroupInput',
  ];
  if (options.type === 'password' && !options.multiline) {
    attrs.push(
      revealable ? `[type]="revealed() ? 'text' : 'password'"` : 'type="password"',
    );
  }
  if (options.fieldAriaLabel) attrs.push('aria-label="' + options.fieldAriaLabel + '"');
  if (placeholder) attrs.push('placeholder="' + placeholder + '"');
  if (options.multiline) attrs.push('rows="3"');
  if (options.disabled) attrs.push('disabled');
  if (options.invalid) {
    // Estado é palavra, nunca só cor: os dois atributos vão no CAMPO, e a
    // moldura vermelha é o eco disso — nunca a origem.
    attrs.push('[attr.aria-invalid]="hasError() || null"');
    attrs.push('[attr.aria-describedby]="hasError() ? errorId : null"');
  }

  const tag = options.multiline ? 'textarea' : 'input';
  const lines = [indent(level) + '<' + tag];
  for (const attr of attrs) lines.push(indent(level + 1) + attr);
  lines.push(options.multiline ? indent(level) + '></textarea>' : indent(level) + '/>');
  return lines;
}

/** Os membros que o template deste snippet liga. */
function classMembers(
  options: InputGroupSnippetOptions,
  addons: InputGroupSnippetAddon[],
): string[] {
  const members: string[] = [];

  if (options.invalid) {
    members.push("  readonly errorId = 'siteError';");
    members.push('  readonly hasError = signal(true);');
  }
  if (addons.some((addon) => addon.buttonToggle)) {
    members.push("  readonly revealLabel = '" + REVEAL_LABEL + "';");
    members.push("  readonly hideLabel = '" + HIDE_LABEL + "';");
    members.push('  readonly revealed = signal(false);');
  }
  for (const addon of addons) {
    if (!addon.buttonHandler) continue;
    if (members.length) members.push('');
    members.push('  ' + addon.buttonHandler + '() {');
    members.push(
      addon.buttonToggle
        ? '    this.revealed.update((showing) => !showing);'
        : '    // A aplicação decide o que a ação faz; o grupo só emoldura.',
    );
    members.push('  }');
  }

  return members;
}

/**
 * A marcação real da família `ndsInputGroup*` com as opções da story.
 *
 * O snippet mostra a MOLDURA, os addons e o campo — e nada além. O estado
 * inválido aparece como o que ele é: dois atributos no CAMPO, e não uma opção
 * de aparência da moldura.
 */
export function inputGroupSnippet(options: InputGroupSnippetOptions = {}): string {
  const addons = options.addons ?? DEFAULT_ADDONS;
  const hasButton = addons.some((addon) => addon.buttonLabel || addon.buttonToggle);
  const needsSignal = Boolean(options.invalid) || addons.some((addon) => addon.buttonToggle);

  const head = [
    'import { Component' + (needsSignal ? ', signal' : '') + " } from '@angular/core';",
    "import { NDS_INPUT_GROUP } from '@/components/ui/input-group';",
  ];
  if (hasButton) head.push("import { NdsButton } from '@/components/ui/button';");

  // A ORDEM DO DOM põe o campo entre os addons: a ordem VISUAL continua sendo
  // da folha, por `order` em `[data-align]`, e escrever assim é o que faz a
  // leitura sequencial bater com o desenho quando nada reordena.
  const leading = addons.filter((addon) => addon.align.endsWith('start'));
  const trailing = addons.filter((addon) => addon.align.endsWith('end'));

  const body: string[] = [];
  body.push(
    indent(2) +
      (options.ariaLabel
        ? '<div ndsInputGroup aria-label="' + options.ariaLabel + '">'
        : '<div ndsInputGroup>'),
  );
  for (const addon of leading) body.push(...addonMarkup(addon, 3, Boolean(options.disabled)));
  body.push(...controlMarkup(options, 3, addons.some((addon) => addon.buttonToggle)));
  for (const addon of trailing) body.push(...addonMarkup(addon, 3, Boolean(options.disabled)));
  body.push(indent(2) + '</div>');

  if (options.invalid) {
    // O texto do erro mora FORA da moldura: dentro dela herdaria o
    // `cursor: text` do addon e disputaria a largura com o que se digita.
    body.push('');
    body.push(indent(2) + '<p id="siteError" class="nds-text-caption nds-text-destructive">');
    body.push(indent(3) + 'Endereço inválido');
    body.push(indent(2) + '</p>');
  }

  const members = classMembers(options, addons);
  const classBody = members.length
    ? ['export class Example {', ...members, '}']
    : ['export class Example {}'];

  return [
    ...head,
    '',
    '@Component({',
    '  imports: [' + (hasButton ? 'NDS_INPUT_GROUP, NdsButton' : 'NDS_INPUT_GROUP') + '],',
    '  template: `',
    ...body,
    '  `,',
    '})',
    ...classBody,
  ].join('\n');
}

// ─── Transforms ──────────────────────────────────────────────────────────────
//
// Uma função nomeada por story, e nenhuma fábrica que devolva função: o guarda
// transversal chama cada export SEM argumento e cobra uma string de volta —
// fábrica curried devolveria função, e as checagens que leem o snippet nunca
// chegariam ao snippet.

/** Os controls do Playground, na forma em que o `transform` os recebe. */
export type InputGroupPlaygroundArgs = {
  ariaLabel?: string;
  placeholder?: string;
  multiline?: boolean;
  disabled?: boolean;
  invalid?: boolean;
};

/**
 * Transform do META do arquivo do Playground — os valores atuais dos controls.
 *
 * Sem args, cai na moldura canônica: prefixo de formato, campo e botão no fim.
 */
export function inputGroupSource(
  _generated?: string,
  ctx?: { args?: InputGroupPlaygroundArgs },
): string {
  const args = ctx?.args ?? {};
  return inputGroupSnippet({
    ariaLabel: args.ariaLabel,
    placeholder: args.placeholder,
    multiline: args.multiline,
    disabled: args.disabled,
    invalid: args.invalid,
  });
}

/** As quatro posições, mostradas na que abre a linha. */
export function inputGroupAlignmentsSource(): string {
  return inputGroupSnippet({
    placeholder: SITE_PLACEHOLDER,
    addons: [{ align: 'inline-start', text: SITE_PREFIX }],
  });
}

export function inputGroupRestSource(): string {
  return inputGroupSnippet({ placeholder: SITE_PLACEHOLDER });
}

export function inputGroupInvalidSource(): string {
  return inputGroupSnippet({
    fieldAriaLabel: SITE_GROUP_LABEL,
    placeholder: SITE_PLACEHOLDER,
    invalid: true,
  });
}

export function inputGroupDisabledSource(): string {
  return inputGroupSnippet({ placeholder: SITE_PLACEHOLDER, disabled: true });
}

export function inputGroupSearchSource(): string {
  return inputGroupSnippet({
    ariaLabel: SEARCH_GROUP_LABEL,
    placeholder: SEARCH_PLACEHOLDER,
    addons: [
      { align: 'inline-start', icon: 'search' },
      { align: 'inline-end', text: SEARCH_SHORTCUT },
    ],
  });
}

export function inputGroupPasswordSource(): string {
  return inputGroupSnippet({
    ariaLabel: PASSWORD_GROUP_LABEL,
    fieldAriaLabel: PASSWORD_GROUP_LABEL,
    placeholder: '',
    type: 'password',
    addons: [
      {
        align: 'inline-end',
        icon: 'reveal',
        buttonToggle: true,
        buttonSize: 'icon-xs',
        buttonHandler: 'toggleReveal',
      },
    ],
  });
}

export function inputGroupAffixSource(): string {
  return inputGroupSnippet({
    placeholder: SITE_PLACEHOLDER,
    addons: [
      { align: 'inline-start', text: SITE_PREFIX },
      { align: 'inline-end', text: SITE_SUFFIX },
    ],
  });
}

export function inputGroupTextareaToolbarSource(): string {
  return inputGroupSnippet({
    ariaLabel: NOTE_GROUP_LABEL,
    placeholder: NOTE_PLACEHOLDER,
    multiline: true,
    addons: [{ align: 'block-end', buttonLabel: SEND_LABEL, buttonHandler: 'send' }],
  });
}
