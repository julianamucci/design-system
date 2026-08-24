/**
 * Fixtures do Combobox — as três composições e as duas medidas.
 *
 * O campo tem NOVE peças na marcação mínima (rótulo, caixa, chips, texto, duas
 * ações, popup, lista, mensagem de vazio). Repetir isso em quatro arquivos de
 * story e na página de documentação é como o slide do carousel acabou em seis
 * cópias divergentes: corrigir uma deixava as outras erradas.
 *
 * Fica fora dos `*.stories.tsx` porque no CSF TODO export nomeado é lido como
 * story: `export function SingleCountryCombobox` dentro de um arquivo de story
 * apareceria na sidebar como se fosse um exemplo.
 */
import * as React from "react"

import {
  Combobox,
  ComboboxChip,
  ComboboxChipRemove,
  ComboboxChipText,
  ComboboxChips,
  ComboboxClear,
  ComboboxContent,
  ComboboxGroup,
  ComboboxGroupLabel,
  ComboboxInput,
  ComboboxInputWrapper,
  ComboboxItem,
  ComboboxLabel,
  ComboboxTrigger,
  type ComboboxChipsLayout,
  type ComboboxOption,
  type ComboboxOptionGroup,
  type ComboboxValue,
} from "./combobox"

// ─── Dados fixos ──────────────────────────────────────────────────────────────
//
// Os mesmos rótulos que a spec de exemplos fechou, e que as outras quatro
// stacks repetem. Divergir aqui é o que faz a mesma story mostrar coisas
// diferentes em cada stack — e isso só aparece tarde, na comparação final.

/* eslint-disable react-refresh/only-export-components */

export const COUNTRIES: ComboboxOption[] = [
  { value: "brasil", label: "Brasil" },
  { value: "argentina", label: "Argentina" },
  { value: "chile", label: "Chile" },
  { value: "colombia", label: "Colômbia" },
  { value: "mexico", label: "México" },
  { value: "peru", label: "Peru" },
  { value: "portugal", label: "Portugal" },
  { value: "espanha", label: "Espanha" },
  { value: "uruguai", label: "Uruguai" },
]

export const TECHNOLOGIES: ComboboxOption[] = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "svelte", label: "Svelte" },
  { value: "angular", label: "Angular" },
]

export const INGREDIENTS: ComboboxOptionGroup[] = [
  {
    value: "Frutas",
    items: [
      { value: "maca", label: "Maçã" },
      { value: "banana", label: "Banana" },
      { value: "laranja", label: "Laranja" },
    ],
  },
  {
    value: "Legumes",
    items: [
      { value: "cenoura", label: "Cenoura" },
      { value: "batata", label: "Batata" },
      { value: "abobrinha", label: "Abobrinha" },
    ],
  },
]

/** Nomes acessíveis das ações do campo, iguais em toda story. */
export const CLEAR_LABEL = "Limpar"
export const OPEN_LABEL = "Abrir lista"
export const EMPTY_MESSAGE = "Nenhum resultado"
export const REMOVE_PREFIX = "Remover"

/**
 * Só os VALORES da escolha chegam ao espião da aba Actions.
 *
 * O componente entrega objetos `{ value, label }` — serializá-los inteiros
 * encheria o painel de rótulo traduzido, e um evento passaria a ter três formas
 * diferentes conforme o idioma da página.
 */
export function toOptionValues(value: ComboboxValue): string[] {
  if (!value) return []
  return (Array.isArray(value) ? value : [value]).map((option) => option.value)
}

// ─── Medidas ──────────────────────────────────────────────────────────────────

/** Luminância relativa de uma cor computada (`rgb(...)` ou `rgba(...)`). */
function luminance(color: string): number {
  const channels = (color.match(/[\d.]+/g) ?? ["0", "0", "0"])
    .slice(0, 3)
    .map(Number)
  const [r, g, b] = channels.map((channel) => {
    const scaled = channel / 255
    return scaled <= 0.03928
      ? scaled / 12.92
      : ((scaled + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Razão de contraste WCAG entre duas cores computadas. */
export function contrastRatio(a: string, b: string): number {
  const first = luminance(a)
  const second = luminance(b)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

/**
 * Fundo que de fato pinta atrás do elemento.
 *
 * O chip pinta SOBRE a superfície do campo, e não sobre a página. Um fundo
 * transparente no chip faria a leitura recair na caixa do campo — que é o que a
 * regra do contrato manda medir. Comparar contra a página superestima e deixa
 * passar um par que na tela não alcança.
 */
export function paintedBackground(element: Element | null): string {
  let current: Element | null = element
  while (current) {
    const background = getComputedStyle(current).backgroundColor
    const alpha = Number(background.match(/[\d.]+/g)?.[3] ?? "1")
    if (background && background !== "transparent" && alpha > 0) return background
    current = current.parentElement
  }
  return "rgb(255, 255, 255)"
}

/**
 * O anel de foco mudou o desenho do elemento?
 *
 * Medir a MUDANÇA, e não `boxShadow !== 'none'`, é o que distingue anel de foco
 * de anel de erro — o segundo já existe sem foco nenhum, e a comparação
 * absoluta passaria verde num campo inválido que não reage ao teclado.
 */
export function focusRingChanged(target: HTMLElement, ringOwner: Element): boolean {
  const doc = target.ownerDocument
  ;(doc.activeElement as HTMLElement | null)?.blur()
  const withoutFocus = getComputedStyle(ringOwner).boxShadow
  target.focus()
  const withFocus = getComputedStyle(ringOwner).boxShadow
  return withoutFocus !== withFocus && withFocus !== "none"
}

// ─── Composições ──────────────────────────────────────────────────────────────

/**
 * Quadro contra o qual a lista portalizada se posiciona.
 *
 * A lista vive no `<body>`, então sem uma caixa de altura própria o Storybook
 * mede a story pelo campo fechado e o popup aberto sai da moldura na foto do
 * Chromatic. `contain: layout` e `position` são mecânicos: não há valor de
 * design nenhum aqui.
 */
export function ComboboxFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="nds-min-h-80" style={{ contain: "layout", position: "relative" }}>
      {children}
    </div>
  )
}

export interface ComboboxFixtureProps {
  label?: string
  placeholder?: string
  name?: string
  disabled?: boolean
  invalid?: boolean
  /** Forma dos chips no campo. Só tem efeito onde há chips. */
  chipsLayout?: ComboboxChipsLayout
  onValueChange?: (value: ComboboxValue) => void
}

/** Escolha única — o exemplo canônico, com a lista de países da spec. */
export function SingleCountryCombobox({
  label = "País",
  placeholder = "Buscar país",
  name = "pais",
  disabled = false,
  invalid = false,
  onValueChange,
}: ComboboxFixtureProps) {
  return (
    <ComboboxFrame>
      <Combobox
        items={COUNTRIES}
        name={name}
        disabled={disabled}
        onValueChange={onValueChange}
      >
        <ComboboxLabel>{label}</ComboboxLabel>
        <ComboboxInputWrapper disabled={disabled}>
          <ComboboxInput
            placeholder={placeholder}
            aria-invalid={invalid ? "true" : undefined}
          />
          <ComboboxClear aria-label={CLEAR_LABEL} />
          <ComboboxTrigger aria-label={OPEN_LABEL} />
        </ComboboxInputWrapper>
        <ComboboxContent emptyMessage={EMPTY_MESSAGE}>
          {(country: ComboboxOption) => (
            <ComboboxItem key={country.value} value={country}>
              {country.label}
            </ComboboxItem>
          )}
        </ComboboxContent>
      </Combobox>
    </ComboboxFrame>
  )
}

/**
 * Múltiplo com chips.
 *
 * A escolha mora AQUI, e não dentro do campo: quem monta o formulário é dono do
 * valor, e é ele que decide quantos chips existem. Guardá-la fora também é o
 * que faz o Storybook manter os chips quando um control muda e o `render`
 * roda de novo.
 */
export function MultiTechCombobox({
  label = "Tecnologias",
  placeholder = "Adicionar tecnologia",
  name = "tecnologias",
  disabled = false,
  invalid = false,
  chipsLayout,
  onValueChange,
}: ComboboxFixtureProps) {
  const [selected, setSelected] = React.useState<ComboboxOption[]>([
    TECHNOLOGIES[0],
    TECHNOLOGIES[1],
  ])

  return (
    <ComboboxFrame>
      <Combobox
        multiple
        chipsLayout={chipsLayout}
        items={TECHNOLOGIES}
        name={name}
        disabled={disabled}
        value={selected}
        onValueChange={(value) => {
          setSelected(Array.isArray(value) ? value : [])
          onValueChange?.(value)
        }}
      >
        <ComboboxLabel>{label}</ComboboxLabel>
        <ComboboxInputWrapper disabled={disabled}>
          <ComboboxChips>
            {selected.map((technology) => (
              <ComboboxChip key={technology.value}>
                <ComboboxChipText>{technology.label}</ComboboxChipText>
                {/* Nome PRÓPRIO: quatro botões chamados "Remover" são
                    indistinguíveis para quem navega por lista de controles. */}
                <ComboboxChipRemove
                  aria-label={`${REMOVE_PREFIX} ${technology.label}`}
                />
              </ComboboxChip>
            ))}
            <ComboboxInput
              placeholder={placeholder}
              aria-invalid={invalid ? "true" : undefined}
            />
          </ComboboxChips>
          <ComboboxClear aria-label={CLEAR_LABEL} />
          <ComboboxTrigger aria-label={OPEN_LABEL} />
        </ComboboxInputWrapper>
        <ComboboxContent emptyMessage={EMPTY_MESSAGE}>
          {(technology: ComboboxOption) => (
            <ComboboxItem key={technology.value} value={technology}>
              {technology.label}
            </ComboboxItem>
          )}
        </ComboboxContent>
      </Combobox>
    </ComboboxFrame>
  )
}

/**
 * Opções sob cabeçalho. A lista chega agrupada e a função de filhos recebe um
 * GRUPO; o filtro continua o mesmo, e um grupo que ficou sem opções não aparece.
 */
export function GroupedIngredientCombobox({
  label = "Ingrediente",
  placeholder = "Buscar ingrediente",
  name = "ingrediente",
  onValueChange,
}: ComboboxFixtureProps) {
  return (
    <ComboboxFrame>
      <Combobox items={INGREDIENTS} name={name} onValueChange={onValueChange}>
        <ComboboxLabel>{label}</ComboboxLabel>
        <ComboboxInputWrapper>
          <ComboboxInput placeholder={placeholder} />
          <ComboboxClear aria-label={CLEAR_LABEL} />
          <ComboboxTrigger aria-label={OPEN_LABEL} />
        </ComboboxInputWrapper>
        <ComboboxContent emptyMessage={EMPTY_MESSAGE}>
          {(group: ComboboxOptionGroup) => (
            <ComboboxGroup key={group.value} items={group.items}>
              <ComboboxGroupLabel>{group.value}</ComboboxGroupLabel>
              {group.items.map((ingredient) => (
                <ComboboxItem key={ingredient.value} value={ingredient}>
                  {ingredient.label}
                </ComboboxItem>
              ))}
            </ComboboxGroup>
          )}
        </ComboboxContent>
      </Combobox>
    </ComboboxFrame>
  )
}
