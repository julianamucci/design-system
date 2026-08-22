import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type DropdownOption,
  type Locale,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

/**
 * Anos oferecidos para cada lado do ano corrente.
 *
 * A lista é COMPLETA, e não uma janela que anda: o painel de um <select> é
 * desenhado pelo navegador e não entrega evento de rolagem ao JS, então não há
 * onde pendurar um "carregar mais ao chegar na ponta". Uma janela obrigava a
 * escolher o último ano da lista e reabrir para andar mais — e é justamente a
 * rolagem presa que se quer evitar. Quem limita o que aparece é a altura do
 * painel (onze itens, no CSS): abre com o ano corrente no meio e rola livre
 * para os dois lados.
 */
const ANOS_PARA_CADA_LADO = 100

// Um desenho só para os dois seletores da legenda. A lib envolve o <select> num
// <span> e desenha ao lado um rótulo `aria-hidden` com chevron, deixando o
// select invisível por cima. O truque existia porque não dava para estilizar o
// nativo — hoje dá, e o contrato das quatro stacks é o <select> ser o próprio
// controle.
function CaptionSelect({
  options,
  className,
  ...selectProps
}: React.ComponentProps<"select"> & { options?: DropdownOption[] }) {
  return (
    <select className={cn("nds-calendar-select", className)} {...selectProps}>
      {options?.map(({ value, label, disabled }) => (
        <option key={value} value={value} disabled={disabled}>
          {label}
        </option>
      ))}
    </select>
  )
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  startMonth,
  endMonth,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  // Com a legenda em seletores, a lib fecha a navegação no FIM DO ANO CORRENTE
  // e abre 100 anos para trás. Numa reserva isso é o avesso do necessário: não
  // dava para escolher nada do ano que vem, e dava para escolher 1926. As
  // outras três stacks navegam para os dois lados; o limite aqui é simétrico e
  // largo o bastante para não aparecer, e existe só porque a lib precisa de um.
  const yearHasSelector = captionLayout === "dropdown" || captionLayout === "dropdown-years"
  const hoje = new Date()
  const startDefault =
    startMonth ?? (yearHasSelector ? new Date(hoje.getFullYear() - ANOS_PARA_CADA_LADO, 0, 1) : undefined)
  const endDefault =
    endMonth ?? (yearHasSelector ? new Date(hoje.getFullYear() + ANOS_PARA_CADA_LADO, 11, 31) : undefined)

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("nds-calendar-root", className)}
      captionLayout={captionLayout}
      startMonth={startDefault}
      endMonth={endDefault}
      locale={locale}
      formatters={{
        // Mês por EXTENSO no seletor, como no Vanilla, que é a referência: a
        // forma curta em pt-BR sai com ponto ("jan."), e o ponto numa opção de
        // uma palavra só é ruído — o mesmo motivo pelo qual ele já era removido
        // do cabeçalho da semana. Medido, o seletor com o nome inteiro tem 61px
        // contra 58px: cabe.
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "long" }),
        // Pelo Intl, e não pelos dados de locale da lib: ela devolve "sab" sem
        // acento, e as outras três stacks mostram "sáb". Mesma fonte nas
        // quatro, e sem o ponto que o pt-BR acrescenta em "dom.".
        formatWeekdayName: (date) =>
          date
            .toLocaleDateString(locale?.code, { weekday: "short" })
            .replace(/\.$/, ""),
        ...formatters,
      }}
      classNames={{
        root: cn(defaultClassNames.root),
        months: cn("nds-calendar-months", defaultClassNames.months),
        month: cn("nds-calendar-month", defaultClassNames.month),
        nav: cn("nds-calendar-nav-overlay", defaultClassNames.nav),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "nds-calendar-nav-btn",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "nds-calendar-nav-btn",
          defaultClassNames.button_next
        ),
        month_caption: cn("nds-calendar-caption", defaultClassNames.month_caption),
        dropdowns: cn(
          "nds-calendar-caption-dropdown",
          defaultClassNames.dropdowns
        ),
        caption_label: cn(
          "nds-calendar-caption-label",
          defaultClassNames.caption_label
        ),
        month_grid: cn("nds-calendar-table", defaultClassNames.month_grid),
        weekdays: cn("nds-calendar-weekdays", defaultClassNames.weekdays),
        weekday: cn("nds-calendar-weekday", defaultClassNames.weekday),
        week: cn("nds-calendar-week", defaultClassNames.week),
        week_number_header: cn(
          "nds-calendar-week-number-header",
          defaultClassNames.week_number_header
        ),
        week_number: cn(
          "nds-calendar-week-number",
          defaultClassNames.week_number
        ),
        day: cn(
          "nds-calendar-day-cell",
          props.showWeekNumber && "nds-calendar-day-cell-wn",
          defaultClassNames.day
        ),
        range_start: cn(
          "nds-calendar-range-start",
          defaultClassNames.range_start
        ),
        range_middle: cn(
          "nds-calendar-range-middle",
          defaultClassNames.range_middle
        ),
        range_end: cn("nds-calendar-range-end", defaultClassNames.range_end),
        today: cn("nds-calendar-today", defaultClassNames.today),
        outside: cn("nds-calendar-outside", defaultClassNames.outside),
        disabled: cn("nds-calendar-disabled", defaultClassNames.disabled),
        hidden: cn("nds-calendar-hidden", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        // A lib envolve o <select> num <span> e desenha ao lado um rótulo
        // `aria-hidden` com chevron, deixando o select invisível por cima. O
        // truque existia porque não dava para estilizar o nativo — hoje dá, e o
        // contrato das quatro stacks é o <select> ser o próprio controle.
        Dropdown: CaptionSelect,
        Root: ({ className, rootRef, ...props }) => {
          return (
            <div
              data-slot="calendar"
              ref={rootRef}
              className={cn(className)}
              {...props}
            />
          )
        },
        // Só os dois sentidos que o calendário usa: os botões de mês anterior e
        // próximo. O chevron para baixo servia ao rótulo desenhado sobre o
        // <select>, que deixou de existir quando a legenda passou a ser o
        // próprio select — o nativo traz a seta dele.
        Chevron: ({ className, orientation, ...props }) =>
          orientation === "left" ? (
            <ChevronLeftIcon className={cn("nds-calendar-chevron", className)} {...props} />
          ) : (
            <ChevronRightIcon className={cn("nds-calendar-chevron", className)} {...props} />
          ),
        DayButton: ({ ...props }) => (
          <CalendarDayButton locale={locale} {...props} />
        ),
        // O react-day-picker manda scope="row" (o default dele é <th>). Aqui a
        // célula é <td>, e scope só é válido em <th> — axe scope-attr-valid.
        // role="rowheader" (que vem junto) já garante a semântica de cabeçalho.
        WeekNumber: ({ children, scope: _scope, ...props }) => {
          return (
            <td {...props}>
              <div className="nds-calendar-week-number-inner">
                {children}
              </div>
            </td>
          )
        },
        ...components,
      }}
      {...props}
    />
  )
}

function CalendarDayButton({
  className,
  day,
  modifiers,
  locale,
  ...props
}: React.ComponentProps<typeof DayButton> & { locale?: Partial<Locale> }) {
  const defaultClassNames = getDefaultClassNames()

  const ref = React.useRef<HTMLButtonElement>(null)
  React.useEffect(() => {
    if (modifiers.focused) ref.current?.focus()
  }, [modifiers.focused])

  return (
    <Button
      variant="ghost"
      size="icon"
      data-day={day.date.toLocaleDateString(locale?.code)}
      data-selected-single={
        modifiers.selected &&
        !modifiers.range_start &&
        !modifiers.range_end &&
        !modifiers.range_middle
      }
      data-range-start={modifiers.range_start}
      data-range-end={modifiers.range_end}
      data-range-middle={modifiers.range_middle}
      className={cn("nds-calendar-day-btn", defaultClassNames.day, className)}
      {...props}
      // Sem isto o `ref` acima nunca aponta para nada e o efeito de foco vira
      // no-op: a lib marca o próximo dia como focado e espera que o componente
      // mova o foco do DOM: é assim que ArrowRight anda no grid. Ficou anos
      // passando porque nenhuma play cobrava para onde o foco tinha ido.
      ref={ref}
    />
  )
}

export { Calendar, CalendarDayButton }
