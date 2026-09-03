/**
 * Snippet do painel Code do seletor de modelo — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções rodarem
 * no projeto `unit` do vitest, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento. Fábrica
 * curried devolveria função em vez de string, e as checagens que leem o snippet
 * nunca chegariam ao snippet.
 *
 * A LISTA DE MODELOS ENTRA DECLARADA, com o nome do ramo, e é o nome que diz
 * QUAL lista está na tela. Ela é curta o bastante para caber inteira — dois ou
 * três modelos —, e cada ramo declara a sua porque `disponiveis` e
 * `comEtiqueta` não são a mesma coisa: uma tem descrição e nada mais, a outra
 * carrega a etiqueta curta que é todo o assunto daquela story.
 *
 * Nada de nome citado sem declaração: a versão anterior passava `labels` e a
 * lista sem declará-los, e quem copiava recebia um símbolo indefinido na
 * primeira renderização.
 */
import {
  attrsMultilinha,
  indentar,
  jsxSnippet,
  text,
  type SourceTransform,
} from "@/lib/story-source"

const IMPORT_PICKER =
  'import { ComposerModelPicker } from "@/components/ui/composer-model-picker";'
const IMPORT_COMPOSER = 'import { Composer } from "@/components/ui/composer";'

/** Os rótulos do seletor, por inteiro. `{label}` vira o nome escolhido. */
const PICKER_LABELS_BLOCK = [
  "const pickerLabels = {",
  '  trigger: "Modelo: {label}",',
  '  list: "Modelos",',
  "};",
].join("\n")

/** Os rótulos do campo, por inteiro — só o ramo do trilho os usa. */
const LABELS_BLOCK = [
  "const labels = {",
  '  input: "Mensagem",',
  '  placeholder: "Escreva sua mensagem…",',
  '  submit: "Enviar",',
  '  stop: "Parar",',
  '  hint: "{key} envia",',
  '  limit: "Até {max} caracteres",',
  "};",
].join("\n")

/**
 * A lista de cada ramo, pelo nome com que o ramo a cita.
 *
 * `unavailableReason` acompanha todo modelo indisponível, e não é enfeite: é
 * texto, é o que se anuncia, e sem ele a opção apagada não diz por que não pode
 * responder.
 */
const MODEL_LISTS: Record<string, string[]> = {
  modelos: [
    "const modelos = [",
    '  { id: "fast", label: "Rápido", description: "Responde em segundos." },',
    '  { id: "balanced", label: "Equilibrado", description: "O meio-termo entre esperar e acertar.", badge: "Novo" },',
    "  {",
    '    id: "deep",',
    '    label: "Profundo",',
    '    description: "Lê a obra inteira antes de responder, e leva minutos.",',
    "    unavailable: true,",
    '    unavailableReason: "Fora do seu plano.",',
    "  },",
    "];",
  ],
  disponiveis: [
    "const disponiveis = [",
    '  { id: "fast", label: "Rápido", description: "Responde em segundos." },',
    '  { id: "balanced", label: "Equilibrado", description: "O meio-termo entre esperar e acertar." },',
    "];",
  ],
  comEtiqueta: [
    "const comEtiqueta = [",
    '  { id: "fast", label: "Rápido", description: "Responde em segundos." },',
    '  { id: "balanced", label: "Equilibrado", description: "O meio-termo entre esperar e acertar.", badge: "Novo" },',
    "];",
  ],
}

/**
 * O que se faz com o modelo confirmado.
 *
 * Uma linha, e o corpo é de quem consome: o seletor confirma a escolha, e
 * APLICAR a troca é de quem monta a conversa.
 */
const CHOOSE_BLOCK = "const escolher = (id) => { /* … */ };"

export type ModelPickerSnippetOptions = {
  /** Nome da constante da lista que o snippet declara. */
  models?: string
  /** O endereço do modelo escolhido. */
  value?: string
  /** A lista começa aberta? */
  open?: boolean
  /** O snippet monta o seletor dentro do trilho do campo? */
  rail?: boolean
}

/** O seletor sozinho, do jeito que ele vive no trilho. */
function picker(opts: ModelPickerSnippetOptions): string {
  const value = text(opts.value)
  return `<ComposerModelPicker${attrsMultilinha([
    "labels={pickerLabels}",
    `models={${text(opts.models) ?? "modelos"}}`,
    // Documentação não ensina a repetir o padrão do componente: só o que
    // difere entra no snippet.
    value === undefined ? undefined : `value="${value}"`,
    opts.open === true ? "open" : undefined,
    "onValueChange={(model) => escolher(model.id)}",
  ])} />`
}

/** O import, a lista do ramo, os rótulos e o manipulador. */
function preamble(opts: ModelPickerSnippetOptions): string {
  const imports = opts.rail ? `${IMPORT_PICKER}\n${IMPORT_COMPOSER}` : IMPORT_PICKER
  const list = MODEL_LISTS[text(opts.models) ?? "modelos"] ?? MODEL_LISTS.modelos

  const parts = [imports, "", list.join("\n"), "", PICKER_LABELS_BLOCK]
  if (opts.rail) parts.push("", LABELS_BLOCK)
  parts.push("", CHOOSE_BLOCK)
  return parts.join("\n")
}

function build(opts: ModelPickerSnippetOptions): string {
  if (!opts.rail) return jsxSnippet(preamble(opts), picker(opts))

  // O seletor é AUTÔNOMO: ele não é uma prop do campo, é um controle que quem
  // consome põe no início do trilho — pelo mesmo espaço de qualquer outro.
  return jsxSnippet(
    preamble(opts),
    `<Composer\n  labels={labels}\n  railStart={\n${indentar(picker(opts), "    ")}\n  }\n/>`,
  )
}

/** Transform do `meta` — o Playground, cujos controles mexem no escolhido. */
export const composerModelPickerSource: SourceTransform<ModelPickerSnippetOptions> = (
  _generated,
  ctx,
) => build(ctx?.args ?? {})

/** A lista aberta, em que a descrição é o único assunto. */
export function modelPickerDescriptionsSource(): string {
  return build({ models: "disponiveis", open: true })
}

/** A lista com a etiqueta curta ao lado de um dos nomes. */
export function modelPickerBadgeSource(): string {
  return build({ models: "comEtiqueta", open: true })
}

/** Em repouso: o gatilho com o nome escolhido, e nenhuma lista no documento. */
export function modelPickerClosedSource(): string {
  return build({ value: "balanced" })
}

/** Com um modelo que não pode responder agora. */
export function modelPickerUnavailableSource(): string {
  return build({ open: true })
}

/** O seletor no início do trilho do campo. */
export function modelPickerInRailSource(): string {
  return build({ rail: true })
}
