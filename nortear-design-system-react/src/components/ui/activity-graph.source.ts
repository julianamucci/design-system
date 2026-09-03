/**
 * Snippet do painel Code da grade de atividade — ver `@/lib/story-source`.
 *
 * Módulo de TS puro — nada de `.tsx` em valor. É o que deixa as funções
 * rodarem fora do navegador, a única guarda que elas têm: a saída do painel
 * não chega ao DOM durante a `play`.
 *
 * Cada configuração tem a SUA função exportada, chamável SEM argumento, e com
 * o sufixo `Source` no FIM do nome. Fábrica curried devolveria função em vez
 * de string, e as checagens que leem o snippet nunca chegariam ao snippet.
 *
 * A ATIVIDADE ENTRA COMO NOME DE VARIÁVEL, e nunca por extenso — noventa dias
 * com data e contagem ocupariam a tela inteira do painel. A JANELA E A
 * ESCALA, ao contrário, entram POR EXTENSO, e isso é decisão: elas são o que
 * esta peça tem de próprio, e um snippet que as escondesse atrás de um nome
 * ensinaria exatamente o que a peça não é.
 *
 * O nome, porém, é DECLARADO — ver `preamble`. Até 2026-09-03 o snippet citava
 * `atividade` e `rotulos` sem nunca os declarar, e quem copiasse recebia dois
 * símbolos indefinidos. Resumir a lista é decisão editorial; elidir a
 * declaração era defeito.
 */
import { indentar, jsxSnippet, text, type SourceTransform } from "@/lib/story-source"

const IMPORT = 'import { ActivityGraph } from "@/components/ui/activity-graph";'

/**
 * Os rótulos, por inteiro.
 *
 * Não cabe resumir: o componente os exige todos, e um objeto pela metade não
 * compila para quem copia. São eles o nome acessível da camada que rola, a
 * frase do total, o nome de cada mês e de cada dia da semana, e a palavra de
 * cada degrau da escala — o único caminho pelo qual a força da tinta chega a
 * quem não a vê.
 */
const LABELS_BLOCK = [
  "const rotulos = {",
  '  region: "Atividade do trimestre",',
  '  total: "{count} contribuições entre {start} e {end}",',
  '  dateFormat: "{day} de {month} de {year}",',
  '  monthsShort: ["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"],',
  "  monthsLong: [",
  '    "janeiro", "fevereiro", "março", "abril", "maio", "junho",',
  '    "julho", "agosto", "setembro", "outubro", "novembro", "dezembro",',
  "  ],",
  '  weekdaysShort: ["dom", "seg", "ter", "qua", "qui", "sex", "sáb"],',
  '  none: "Sem atividade em {date}.",',
  '  one: "{count} contribuição em {date}. Intensidade {level}.",',
  '  many: "{count} contribuições em {date}. Intensidade {level}.",',
  "  // Uma palavra a mais que os degraus: a do nível vazio.",
  '  levels: ["Nenhuma", "Baixa", "Média", "Alta", "Muito alta"],',
  '  legendLess: "Menos",',
  '  legendMore: "Mais",',
  "};",
].join("\n")

/**
 * O preâmbulo do snippet: o import, a atividade e os rótulos.
 *
 * A ATIVIDADE ENTRA RESUMIDA, e é a única elisão que sobra: a janela do
 * exemplo tem noventa dias, e despejá-los afogaria a chamada que o snippet
 * existe para ensinar. Resumida, porém, e não ELIDIDA — a versão anterior
 * citava `atividade` sem nunca declará-la, e quem copiasse recebia um símbolo
 * indefinido na primeira renderização.
 *
 * `daysRef` chega literal (`[]`) quando a story não tem atividade nenhuma;
 * nesse caso não há constante a declarar.
 */
function preamble(daysRef = "atividade"): string {
  const parts = [IMPORT, ""]
  if (/^[A-Za-z_$][\w$]*$/.test(daysRef)) {
    parts.push(
      "// Um item por dia da janela — aqui, os três primeiros.",
      `const ${daysRef} = [`,
      '  { date: "2026-01-01", count: 0 },',
      '  { date: "2026-01-02", count: 3 },',
      '  { date: "2026-01-03", count: 9 },',
      "];",
      "",
    )
  }
  parts.push(LABELS_BLOCK)
  return parts.join("\n")
}

export type ActivityGraphSnippetOptions = {
  /** Em que pé está a execução que escreve a grade. */
  status?: string
  /** O nome da constante com a atividade. */
  daysRef?: string
  /** O primeiro dia da janela. */
  start?: string
  /** O último dia da janela. */
  end?: string
  /** Os degraus da escala, já escritos. */
  thresholdsRef?: string
  /** Em que dia a semana começa, quando não é o padrão. */
  weekStart?: string
}

/** A tag, sempre com um atributo por linha. */
function tag(parts: Array<string | undefined>): string {
  const list = parts.filter((part): part is string => Boolean(part))
  return `<ActivityGraph\n${list.map((part) => indentar(part)).join("\n")}\n/>`
}

function build(opts: ActivityGraphSnippetOptions): string {
  return jsxSnippet(
    preamble(opts.daysRef ?? "atividade"),
    tag([
      `days={${opts.daysRef ?? "atividade"}}`,
      `start="${opts.start ?? "2026-01-01"}"`,
      `end="${opts.end ?? "2026-03-31"}"`,
      `thresholds={${opts.thresholdsRef ?? "[1, 4, 8, 13]"}}`,
      opts.weekStart ? `weekStart={${opts.weekStart}}` : undefined,
      `status="${opts.status ?? "complete"}"`,
      "labels={rotulos}",
    ]),
  )
}

/** Transform do `meta` — o Playground, que escreve os eixos por extenso. */
export const activityGraphSource: SourceTransform<{
  status: string
  withActivity: boolean
  weekStart: number
}> = (_generated, ctx) => {
  const args = ctx?.args ?? {}
  return build({
    status: text(args.status),
    // Sem atividade nenhuma a chamada continua existindo, e é o que a story
    // mostra: janela vazia é grade, e não ausência de resposta.
    daysRef: args.withActivity === false ? "[]" : "atividade",
    weekStart: args.weekStart ? String(args.weekStart) : undefined,
  })
}

/** A escala inteira, do vazio ao nível cheio. */
export function activityGraphScaleSource(): string {
  return jsxSnippet(
    preamble("atividadeDaEscala"),
    [
      "// Um dia por nível, na mesma janela: cada degrau da escala cresce em DUAS",
      "// coisas ao mesmo tempo — a força da tinta e o tamanho do quadrado dentro",
      "// da casa —, e a palavra de cada um chega a quem não vê nenhuma das duas.",
      tag([
        "days={atividadeDaEscala}",
        'start="2026-03-01"',
        'end="2026-03-07"',
        "thresholds={[1, 4, 8, 13]}",
        'status="complete"',
        "labels={rotulos}",
      ]),
    ].join("\n"),
  )
}

/** A janela sem atividade nenhuma, que continua sendo uma grade. */
export function activityGraphEmptySource(): string {
  return jsxSnippet(
    preamble("[]"),
    [
      "// GRADE VAZIA É GRADE, e é a diferença desta peça em relação às irmãs da",
      "// família: um período em que nada aconteceu É a resposta, e devolver nada",
      "// esconderia justamente essa informação.",
      tag([
        "days={[]}",
        'start="2026-01-01"',
        'end="2026-03-31"',
        "thresholds={[1, 4, 8, 13]}",
        'status="complete"',
        "labels={rotulos}",
      ]),
    ].join("\n"),
  )
}

/** Enquanto a grade se escreve, com a execução ocupada. */
export function activityGraphBusySource(): string {
  return build({ status: "running" })
}

/** Uma janela que não existe: o fim antes do começo. */
export function activityGraphNoWindowSource(): string {
  return jsxSnippet(
    preamble(),
    [
      "// FIM ANTES DO COMEÇO NÃO É JANELA, e sem janela não há posição — o",
      "// componente devolve nada, e nem moldura nem parada de teclado chegam à",
      "// tela.",
      tag([
        "days={atividade}",
        'start="2026-03-31"',
        'end="2026-01-01"',
        "thresholds={[1, 4, 8, 13]}",
        'status="complete"',
        "labels={rotulos}",
      ]),
    ].join("\n"),
  )
}

/** Um mês só, porque a janela é dado. */
export function activityGraphMonthSource(): string {
  return build({ start: "2026-03-01", end: "2026-03-31" })
}

/** Um ano inteiro: mais largo que a conversa, e a camada rola. */
export function activityGraphYearSource(): string {
  return build({ start: "2025-04-01", end: "2026-03-31" })
}

/** A semana começando na segunda. */
export function activityGraphWeekStartSource(): string {
  return build({ weekStart: "1" })
}

/**
 * O tamanho da casa, na folha de quem consome.
 *
 * É ele que decide quando a grade passa a ser mais larga que a conversa.
 * Entra como propriedade personalizada, e não como largura em `style`: é a
 * única maneira de mudá-lo sem tirar o valor do tema e da escala de tipo.
 */
export function activityGraphTightCellsSource(): string {
  return jsxSnippet(
    preamble(),
    [
      tag([
        "days={atividade}",
        'start="2026-01-01"',
        'end="2026-03-31"',
        "thresholds={[1, 4, 8, 13]}",
        'status="complete"',
        "labels={rotulos}",
      ]),
      "",
      "/* O tamanho da casa e o vão, na folha de quem consome. */",
      ".nds-activity-graph {",
      "  --activity-graph-cell: var(--spacing-2);",
      "  --activity-graph-gap: var(--spacing-px);",
      "}",
    ].join("\n"),
  )
}
