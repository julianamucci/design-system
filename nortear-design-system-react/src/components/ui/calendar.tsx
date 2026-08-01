import * as React from "react"
import {
  DayPicker,
  getDefaultClassNames,
  type DayButton,
  type Locale,
} from "react-day-picker"

import { cn } from "@/lib/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { ChevronLeftIcon, ChevronRightIcon, ChevronDownIcon } from "lucide-react"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  locale,
  formatters,
  components,
  ...props
}: React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: React.ComponentProps<typeof Button>["variant"]
}) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("nds-calendar-root", className)}
      captionLayout={captionLayout}
      locale={locale}
      formatters={{
        formatMonthDropdown: (date) =>
          date.toLocaleString(locale?.code, { month: "short" }),
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
        dropdowns: cn("nds-calendar-dropdowns", defaultClassNames.dropdowns),
        dropdown_root: cn(
          "nds-calendar-dropdown-root",
          defaultClassNames.dropdown_root
        ),
        dropdown: cn("nds-calendar-dropdown", defaultClassNames.dropdown),
        caption_label: cn(
          "nds-calendar-caption-label",
          captionLayout !== "label" && "nds-calendar-caption-label-button",
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
        Chevron: ({ className, orientation, ...props }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("nds-calendar-chevron", className)} {...props} />
            )
          }

          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("nds-calendar-chevron", className)} {...props} />
            )
          }

          return (
            <ChevronDownIcon className={cn("nds-calendar-chevron", className)} {...props} />
          )
        },
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
    />
  )
}

export { Calendar, CalendarDayButton }
