import * as React from "react"

import { cn } from "@/lib/utils"

// ─── Form ─────────────────────────────────────────────────────────────────────
//
// Visual: classes .nds-form-* (docs/shared/styles/nds/form.css).
//
// O produto deste componente NÃO é o que se vê: é a costura de ACESSIBILIDADE
// em volta do campo, e ela só existe em atributo. Um campo pode estar perfeito
// na tela e mudo no leitor de tela, e nenhuma foto do Chromatic acusa.
//
//   · o <label> aponta para o controle (`for` ↔ `id`), com id gerado quando falta
//   · descrição e mensagem ganham id e entram no `aria-describedby` do controle
//   · a mensagem nasce com `aria-live="polite"`, então é anunciada ao aparecer
//   · o rótulo ganha `data-error`, que é o que o CSS usa para pintá-lo
//
// O ESTADO DE FORMULÁRIO NÃO MORA AQUI. Valor, `touched`, `dirty` e erros de
// validação são da lib que a aplicação escolher (react-hook-form e afins), e
// reimplementá-los daria dois donos para a mesma informação — a mesma decisão
// registrada no Form do Angular. O que sobra é justamente o que essas libs não
// fazem, e é o que quebra na mão de quem monta formulário.
//
// A fiação é feita PELO CAMPO, em uma direção só, varrendo o próprio DOM: o
// campo acha o controle projetado dentro dele e escreve nele e no rótulo. É a
// mesma estratégia do Angular, e é o que faz `<Input>`, `<Textarea>`, `<select>`
// e os controles compostos passarem pelo mesmo caminho sem cada um precisar
// saber que está dentro de um campo.
//
// Markup e classes seguem o Vanilla (`createFormField` / `createFieldset`):
// `div.nds-form-field` com `data-slot="field"`, `p.nds-form-description` com
// `data-slot="field-description"`, `p.nds-form-error` com
// `data-slot="field-error"`.

/**
 * Ordem de prioridade para achar o controle dentro do campo.
 *
 * `querySelector` devolve o primeiro elemento em ordem de DOM, não o primeiro
 * seletor que casa — por isso a busca é seletor a seletor. Os `data-slot`
 * compostos vêm antes dos elementos nativos de propósito: checkbox, switch e
 * select desta stack renderizam um `<input>` escondido para participar do
 * formulário, e ele casaria com `input` antes do controle de verdade.
 */
const SELETORES_CONTROLE = [
  '[data-slot="input-group-control"]',
  '[data-slot="checkbox"]',
  '[data-slot="switch"]',
  '[data-slot="select-trigger"]',
  '[data-slot="slider"]',
  'input:not([type="hidden"])',
  "textarea",
  "select",
]

function findControl(raiz: HTMLElement): HTMLElement | null {
  for (const seletor of SELETORES_CONTROLE) {
    const finding = raiz.querySelector<HTMLElement>(seletor)
    if (finding) return finding
  }
  return null
}

type FormFieldProps = Omit<React.ComponentProps<"div">, "children"> & {
  /** Texto do rótulo. O campo o associa ao controle. */
  label?: React.ReactNode
  /** Texto de apoio abaixo do controle — formato esperado, política, exemplo. */
  description?: React.ReactNode
  /** Mensagem de erro. Presente, é anunciada e pinta o rótulo. */
  error?: React.ReactNode
  children: React.ReactNode
}

/**
 * O campo: rótulo + controle + descrição + mensagem, com a costura acessível
 * feita a partir do que foi projetado dentro dele.
 */
function FormField({
  className,
  label,
  description,
  error,
  children,
  ...props
}: FormFieldProps) {
  const raiz = React.useRef<HTMLDivElement>(null)
  const base = React.useId()
  const idDescricao = `${base}-description`
  const idErro = `${base}-error`

  // Ids que quem compõe já tinha escrito no controle — preservados na junção.
  const describedbyEscrito = React.useRef<string[] | null>(null)

  React.useEffect(() => {
    const el = raiz.current
    if (!el) return

    const controle = findControl(el)
    const rotulo = el.querySelector<HTMLLabelElement>("label")

    if (rotulo && controle) {
      // `for` só quando falta. Label que ENVOLVE o controle já está associado
      // pela estrutura, e escrever `for` ali não acrescenta nada.
      if (!rotulo.getAttribute("for") && !rotulo.contains(controle)) {
        if (!controle.id) controle.id = `${base}-control`
        rotulo.setAttribute("for", controle.id)
      }
    }

    if (!controle) return

    // Junção, não substituição: quem compõe pode já ter apontado o controle
    // para um texto fora do campo, e sobrescrever descartaria essa instrução.
    describedbyEscrito.current ??= (controle.getAttribute("aria-describedby") ?? "")
      .split(/\s+/)
      .filter(Boolean)

    const ids = [
      ...describedbyEscrito.current,
      ...(description ? [idDescricao] : []),
      ...(error ? [idErro] : []),
    ]
    if (ids.length) controle.setAttribute("aria-describedby", ids.join(" "))
    else controle.removeAttribute("aria-describedby")
  }, [base, description, error, idDescricao, idErro, children])

  return (
    <div
      ref={raiz}
      data-slot="field"
      data-invalid={error ? "true" : undefined}
      className={cn("nds-form-field", className)}
      {...props}
    >
      {label ? (
        // `.nds-form-label[data-error="true"]` é a regra que pinta o rótulo de
        // destructive. Sem o atributo, o erro só existiria abaixo do campo.
        <label
          data-slot="label"
          data-error={error ? "true" : undefined}
          className="nds-form-label"
        >
          {label}
        </label>
      ) : null}

      {children}

      {description ? (
        <p id={idDescricao} data-slot="field-description" className="nds-form-description">
          {description}
        </p>
      ) : null}

      {error ? (
        // `aria-live="polite"` e não `role="alert"`: em validação a cada tecla,
        // interromper a digitação a cada caractere é pior que esperar a pausa.
        <p
          id={idErro}
          data-slot="field-error"
          aria-live="polite"
          className="nds-form-error"
        >
          {error}
        </p>
      ) : null}
    </div>
  )
}

type FieldsetProps = React.ComponentProps<"fieldset"> & {
  /** Texto da legenda. Leitores de tela a anunciam antes de cada campo. */
  legend?: React.ReactNode
}

/** Agrupamento semântico de campos relacionados. */
function Fieldset({ className, legend, children, ...props }: FieldsetProps) {
  return (
    <fieldset
      data-slot="fieldset"
      className={cn("nds-form-fieldset", className)}
      {...props}
    >
      {/* A legenda é o PRIMEIRO filho: fora da primeira posição ela deixa de
          rotular o <fieldset>, o texto continua na tela e o grupo fica anônimo. */}
      {legend ? (
        <legend data-slot="fieldset-legend" className="nds-form-legend">
          {legend}
        </legend>
      ) : null}
      {children}
    </fieldset>
  )
}

export { FormField, Fieldset }
