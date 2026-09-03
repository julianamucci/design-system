/**
 * Transforms do painel Code do InputGroup.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O construtor é UM só e as stories o parametrizam. Snippet escrito à mão por
 * story diverge do que a story renderiza, e cada metade fica certa sozinha — é
 * o defeito que ninguém enxerga, porque o painel Code não entra no DOM da play.
 *
 * Os textos vêm do mesmo módulo de andaime que as stories usam, pelo mesmo
 * motivo.
 */
import { jsxSnippet, text, type SourceTransform } from "@/lib/story-source"
import type { InputGroupAlign } from "./input-group"
import {
  HIDE_LABEL,
  INVALID_MESSAGE,
  INVALID_MESSAGE_ID,
  NOTE_GROUP_LABEL,
  NOTE_PLACEHOLDER,
  PASTE_LABEL,
  PASSWORD_FIELD_ID,
  PASSWORD_GROUP_LABEL,
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
} from "./input-group.fixtures"

/** Um addon, como a story o descreve antes de virar marcação. */
export interface InputGroupSnippetAddon {
  align: InputGroupAlign
  /** Texto de apoio — prefixo, sufixo, atalho. */
  label?: string
  /** Nome do componente de ícone decorativo, quando a story mostra um. */
  icon?: string
  /** Texto visível do botão, quando o addon carrega um. */
  buttonLabel?: string
  /** Nome acessível do botão só de ícone. */
  buttonAccessibleName?: string
  /** Ícone dentro do botão — o botão só de ícone não tem texto visível. */
  buttonIcon?: string
}

/** O que as stories usam e o snippet precisa mostrar. */
export interface InputGroupSnippetOptions {
  /** Nome acessível do grupo. Ausente, o grupo não recebe nome. */
  "aria-label"?: string
  placeholder?: string
  /** Área de texto no lugar do campo de uma linha. */
  multiline?: boolean
  rows?: number
  disabled?: boolean
  /** Marca o CAMPO como inválido e o liga ao texto que descreve o problema. */
  invalid?: boolean
  /** Rótulo visível acima da moldura — quem nomeia o campo é ELE. */
  visibleLabel?: string
  addons?: InputGroupSnippetAddon[]
}

const CANONICAL_ADDONS: InputGroupSnippetAddon[] = [
  { align: "inline-start", label: SITE_PREFIX },
  { align: "inline-end", buttonLabel: PASTE_LABEL },
]

/**
 * O `import` do InputGroup é quase sempre de muitos nomes, então ele nasce
 * quebrado em linhas — a linha única passaria de 150 colunas num painel
 * estreito. A lista ACOMPANHA o snippet: peça que a story não usa não entra,
 * porque import com nome que o corpo não menciona ensina a importar por hábito.
 */
function importOf(names: string[]): string {
  return `import {\n${names.map((name) => `  ${name},`).join("\n")}\n} from "@/components/ui/input-group";`
}

/**
 * O que o botão do addon dispara, declarado.
 *
 * Uma linha, e não uma elisão: colar da área de transferência, enviar a nota,
 * revelar a senha — o que o botão FAZ é de quem consome. Mas o nome precisa
 * EXISTIR no snippet, ou quem copia recebe um símbolo indefinido no primeiro
 * clique. É a mesma exigência que o compilador faz de expressão de template.
 */
const HANDLER_BLOCK = "const handleAddon = () => { /* … */ };"

/** Indenta cada linha não vazia. Blocos aninhados em JSX. */
function pad(block: string, prefix = "  "): string {
  return block
    .split("\n")
    .map((line) => (line.trim() ? prefix + line : line))
    .join("\n")
}

/** A marcação de um addon, com o que ele carrega dentro. */
function addonMarkup(addon: InputGroupSnippetAddon): string {
  const children: string[] = []

  if (addon.icon) {
    children.push(`<${addon.icon} aria-hidden="true" />`)
  }
  if (addon.label) {
    children.push(`<InputGroupText>${addon.label}</InputGroupText>`)
  }
  if (addon.buttonAccessibleName) {
    children.push(
      `<InputGroupButton\n` +
        `  size="icon-xs"\n` +
        `  aria-label="${addon.buttonAccessibleName}"\n` +
        `  onClick={handleAddon}\n` +
        `>\n` +
        `  <${addon.buttonIcon ?? "Eye"} aria-hidden="true" />\n` +
        `</InputGroupButton>`,
    )
  } else if (addon.buttonLabel) {
    children.push(
      `<InputGroupButton onClick={handleAddon}>${addon.buttonLabel}</InputGroupButton>`,
    )
  }

  return (
    `<InputGroupAddon align="${addon.align}">\n` +
    `${pad(children.join("\n"))}\n` +
    `</InputGroupAddon>`
  )
}

/** O campo, com os atributos que a story de fato liga. */
function fieldMarkup(o: InputGroupSnippetOptions): string {
  const tag = o.multiline ? "InputGroupTextarea" : "InputGroupInput"
  const attributes = [
    o.visibleLabel ? `id="${SITE_FIELD_ID}"` : undefined,
    `placeholder="${o.placeholder ?? SITE_PLACEHOLDER}"`,
    o.multiline && o.rows ? `rows={${o.rows}}` : undefined,
    o.disabled ? "disabled" : undefined,
    // Estado é palavra, nunca só cor: os dois atributos vão no CAMPO e apontam
    // para o texto que descreve o problema. A moldura vermelha é o eco disso.
    o.invalid ? "aria-invalid" : undefined,
    o.invalid ? `aria-describedby="${INVALID_MESSAGE_ID}"` : undefined,
  ].filter((part): part is string => Boolean(part))

  if (attributes.length <= 1) return `<${tag} ${attributes.join(" ")} />`
  return `<${tag}\n${attributes.map((part) => `  ${part}`).join("\n")}\n/>`
}

/**
 * A composição real da família `InputGroup*` com as opções da story.
 *
 * O snippet mostra a MOLDURA, os addons e o campo — e nada além. O estado
 * inválido aparece como o que ele é: dois atributos no CAMPO mais o texto que
 * os explica, e não uma opção de aparência da moldura.
 */
export function inputGroupSnippet(o: InputGroupSnippetOptions = {}): string {
  const addons = o.addons ?? CANONICAL_ADDONS

  const names = ["InputGroup"]
  if (addons.length) names.push("InputGroupAddon")
  if (addons.some((addon) => addon.label)) names.push("InputGroupText")
  const hasButton = addons.some(
    (addon) => addon.buttonLabel || addon.buttonAccessibleName,
  )
  if (hasButton) names.push("InputGroupButton")
  names.push(o.multiline ? "InputGroupTextarea" : "InputGroupInput")

  const icons = [
    ...new Set(
      addons
        .flatMap((addon) => [addon.icon, addon.buttonAccessibleName ? (addon.buttonIcon ?? "Eye") : undefined])
        .filter((name): name is string => Boolean(name)),
    ),
  ]

  const header = [
    [
      icons.length ? `import { ${icons.join(", ")} } from "lucide-react";` : undefined,
      importOf(names),
    ]
      .filter((part): part is string => Boolean(part))
      .join("\n"),
    // Só onde há botão: declarar o que o exemplo não usa ensina a escrever por
    // hábito, que é o outro lado do mesmo defeito.
    hasButton ? HANDLER_BLOCK : undefined,
  ]
    .filter((part): part is string => Boolean(part))
    .join("\n\n")

  // A ORDEM VISUAL é da folha, por `order` em `[data-align]`; a ordem da
  // marcação só precisa pôr o campo entre os addons para a leitura sequencial
  // bater com o desenho quando nada reordena.
  const body = [
    ...addons.filter((addon) => addon.align.endsWith("start")).map(addonMarkup),
    fieldMarkup(o),
    ...addons.filter((addon) => addon.align.endsWith("end")).map(addonMarkup),
  ].join("\n\n")

  const groupAttribute = o["aria-label"] ? ` aria-label="${o["aria-label"]}"` : ""
  const group = `<InputGroup${groupAttribute}>\n${pad(body)}\n</InputGroup>`

  if (!o.invalid && !o.visibleLabel) return jsxSnippet(header, group)

  // O rótulo visível e o texto do erro moram FORA da moldura: dentro dela eles
  // herdariam o `cursor: text` do addon e disputariam a largura com o que a
  // pessoa digita.
  const around = [
    o.visibleLabel
      ? `<label className="nds-label" htmlFor="${SITE_FIELD_ID}">\n  ${o.visibleLabel}\n</label>`
      : undefined,
    group,
    o.invalid
      ? `<p id="${INVALID_MESSAGE_ID}" className="nds-text-caption nds-text-destructive">\n  ${INVALID_MESSAGE}\n</p>`
      : undefined,
  ]
    .filter((part): part is string => Boolean(part))
    .join("\n")

  return jsxSnippet(
    header,
    `<div className="nds-stack" data-spacing="sm">\n${pad(around)}\n</div>`,
  )
}

/** Args da Playground que chegam à transform do `meta`. */
export interface InputGroupArgs {
  "aria-label"?: string
  placeholder?: string
  multiline?: boolean
  disabled?: boolean
  invalid?: boolean
}

/**
 * Transform do `meta` — vale para todas as stories do arquivo. Sem args, cai na
 * moldura canônica: prefixo de formato, campo e botão no fim.
 */
export const inputGroupSource: SourceTransform<InputGroupArgs> = (
  _generated,
  ctx,
) =>
  inputGroupSnippet({
    "aria-label": text(ctx?.args?.["aria-label"]) ?? SITE_GROUP_LABEL,
    placeholder: text(ctx?.args?.placeholder) ?? SITE_PLACEHOLDER,
    multiline: ctx?.args?.multiline === true,
    disabled: ctx?.args?.disabled === true,
    invalid: ctx?.args?.invalid === true,
  })

/** As quatro posições, uma moldura por posição. */
export function inputGroupAlignmentsSource(): string {
  return inputGroupSnippet({
    placeholder: SITE_PLACEHOLDER,
    addons: [{ align: "inline-start", label: SITE_PREFIX }],
  })
}

/** Repouso: a moldura sem estado nenhum ligado. */
export function inputGroupRestSource(): string {
  return inputGroupSnippet({ placeholder: SITE_PLACEHOLDER })
}

/** Inválido: os dois atributos no campo, mais o texto que os explica. */
export function inputGroupInvalidSource(): string {
  return inputGroupSnippet({ placeholder: SITE_PLACEHOLDER, invalid: true })
}

/** Desabilitado: o atributo é do campo, e a moldura só reage a ele. */
export function inputGroupDisabledSource(): string {
  return inputGroupSnippet({ placeholder: SITE_PLACEHOLDER, disabled: true })
}

/** Busca: ícone decorativo antes, atalho em texto depois. */
export function inputGroupSearchSource(): string {
  return inputGroupSnippet({
    "aria-label": SEARCH_GROUP_LABEL,
    placeholder: SEARCH_PLACEHOLDER,
    addons: [
      { align: "inline-start", icon: "Search" },
      { align: "inline-end", label: SEARCH_SHORTCUT },
    ],
  })
}

/**
 * Senha: o que age é um BOTÃO, e o que ele fez é contado pela PALAVRA.
 *
 * O estado vive FORA do componente — por isso o snippet precisa do `useState`.
 * O nome acessível troca junto com o tipo do campo: o desenho do ícone sozinho
 * não conta nada a quem não o vê.
 */
export function inputGroupPasswordSource(): string {
  const header = `import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
${importOf(["InputGroup", "InputGroupAddon", "InputGroupButton", "InputGroupInput"])}`

  const markup = `function PasswordField() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      {/* O rótulo é do CAMPO, e o nome do grupo não o substitui: o leitor de
          tela não empresta um ao outro. Sem ele o campo fica anônimo — sem
          \`<label>\`, sem \`aria-label\` e sem \`placeholder\` —, que é o caso
          que o axe reprova na regra \`label\`. */}
      <label className="nds-label" htmlFor="${PASSWORD_FIELD_ID}">
        ${PASSWORD_GROUP_LABEL}
      </label>
      <InputGroup aria-label="${PASSWORD_GROUP_LABEL}">
        <InputGroupInput id="${PASSWORD_FIELD_ID}" type={visible ? "text" : "password"} />
        <InputGroupAddon align="inline-end">
          <InputGroupButton
            size="icon-xs"
            aria-label={visible ? "${HIDE_LABEL}" : "${REVEAL_LABEL}"}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
    </>
  );
}`

  return jsxSnippet(header, markup)
}

/** Formato: prefixo e sufixo fixos, com o rótulo visível fora da moldura. */
export function inputGroupAffixSource(): string {
  return inputGroupSnippet({
    placeholder: SITE_PLACEHOLDER,
    visibleLabel: SITE_GROUP_LABEL,
    addons: [
      { align: "inline-start", label: SITE_PREFIX },
      { align: "inline-end", label: SITE_SUFFIX },
    ],
  })
}

/** Área de texto com barra embaixo — a folha faz o grupo empilhar sozinha. */
export function inputGroupTextareaToolbarSource(): string {
  return inputGroupSnippet({
    "aria-label": NOTE_GROUP_LABEL,
    placeholder: NOTE_PLACEHOLDER,
    multiline: true,
    rows: 3,
    addons: [{ align: "block-end", buttonLabel: SEND_LABEL }],
  })
}
