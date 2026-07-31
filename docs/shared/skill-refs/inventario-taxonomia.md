# Inventário — reclassificação das 159 composições

Leitura entrada a entrada, com citação do texto. Regra em `regra-taxonomia.md`.

| Veredito | Entradas | % |
|---|---|---|
| **COMPOSIÇÃO** (permanece) | 70 | 44% |
| **VARIANTE** (migra) | 47 | 30% |
| **DUPLICADA** (apagar) | 35 | 22% |
| **ESTADO** (migra) | 7 | 4% |

## ESTADO — 7

`chart.withEmptyState` · `chart.multiSeriesWithLegend` · `command.withDisabled` ·
`command.longList` · `pagination.lastPage` · `sheet.longScrollBody` ·
`toggle-group.disabledItem`

## DUPLICADA — 35

**Duplicam a seção Variantes do próprio componente** (texto quase verbatim):
`alert.multipleTypes` · `alert-dialog.destructive` · `alert-dialog.neutral` ·
`avatar.withImage` · `avatar.withInitials` · `avatar.withIcon` · `avatar.group` ·
`avatar.withStatus` · `breadcrumb.default` · `breadcrumb.withEllipsis` ·
`breadcrumb.customSeparator` · `breadcrumb.responsive` · `button.iconOnly` ·
`calendar.rangeTwoMonths` · `card.withFooter` · `card.withAction` · `card.withImage` ·
`carousel.multiResponsive` · `checkbox.withLabel` · `checkbox.withDescription` ·
`dialog.profileEdit` · `drawer.rightPanel` · `radio-group.vertical` ·
`radio-group.horizontal` · `radio-group.withDescription` · `select.states` ·
`select.regionGroups` · `sheet.mobileActions` · `slider.priceRange` ·
`switch.withDescription` · `tabs.vertical` · `tabs.lineSubNav` ·
`textarea.withCounter` · `toggle.filterWithLabel` · `toggle-group.formattingBar`

## VARIANTE — 47

`alert.compact` · `button.asLink` · `calendar.inlineBordered` · `calendar.disabledPast` ·
`carousel.autoplay` · `chart.smallInline` · `code-block.withTitle` ·
`code-block.withoutNumbers` · `code-block.highlighted` · `code-block.withFooter` ·
`collapsible.customButton` · `command.withGroups` · `context-menu.withCheckbox` ·
`context-menu.withRadio` · `context-menu.withSubmenu` · `context-menu.withShortcuts` ·
`data-table.editableSheet` · `data-table.virtualizedLog` · `data-table.pinnedKey` ·
`dialog.confirmEmail` · `drawer.withScroll` · `dropdown-menu.withLabel` ·
`dropdown-menu.withCheckboxItems` · `dropdown-menu.withRadioGroup` ·
`dropdown-menu.withShortcuts` · `form.labelOnly` · `form.withDescription` ·
`form.withError` · `hover-card.userProfile` · `hover-card.linkPreview` ·
`hover-card.definitionTooltip` · `hover-card.metricExplainer` · `menubar.withShortcuts` ·
`menubar.withCheckbox` · `menubar.withRadio` · `menubar.editorComplete` ·
`navigation-menu.linkSimples` · `navigation-menu.comDropdown` ·
`navigation-menu.megaMenuGrid` · `navigation-menu.comCardDestacado` ·
`pagination.simple` · `pagination.withEllipsis` · `pagination.interactive` ·
`sidebar.withSubMenu` · `sidebar.withBadges` · `slider.brightness` ·
`tooltip.positioningSides` · `toggle.sizes`*

*`toggle.sizes` — eu havia marcado DUPLICADA; a leitura provou que a seção
Variantes do Toggle **não tem** eixo de tamanho (`items` = default/outline/withLabel).
É VARIANTE, e o eixo `size` precisa entrar em Variantes.

## COMPOSIÇÃO — 70 (permanecem)

Concentradas em: `input-otp` (4/4), `popover` (4/4), `table` (4/4), `tooltip` (3/4),
`toggle-group` (3/5), `textarea` (4/5), `input` (4/4), `switch` (3/4),
`badge` (4/4), `button` (4/6), `accordion` (4/4), `checkbox` (3/5),
`collapsible` (3/4), `drawer` (2/4), `sheet` (2/4), `slider` (2/4),
`sidebar` (2/4), `tabs` (2/4), `alert` (2/4), `carousel` (2/4),
`chart` (1/4), `dialog` (1/3), `data-table` (1/4), `form` (1/4),
`radio-group` (1/4), `select` (1/3), `toggle` (2/4).

## Problema inverso encontrado

Composições morando **dentro** da seção Variantes — a migração precisa olhar nos
dois sentidos:
- `table.variants.withInlineActions` — descreve `Button variant="ghost"` ou `DropdownMenu`
- `popover.variants.styles.form` — "Inputs e botões dentro do PopoverContent"
- `input.variants.inputGroup` — "composição com addons, prefixos, sufixos, ícones"

## Achado lateral

`collapsible.richContent` (pt-BR) tem "acepta" — espanhol vazado no português.
