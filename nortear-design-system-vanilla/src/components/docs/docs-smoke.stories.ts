// GERADO POR SCRIPT — suíte de fumaça das docs pages (contrato docs-smoke).
// Um export por página de src/components/docs/*Docs.ts (componentes e foundations).
// Política: crash no mount → export fica FORA (listado abaixo); axe falhando →
// parameters.a11y.test:'todo' com as rules no comentário; página limpa → axe é portão.
//
// Nenhuma página fora da fumaça: as 64 montam.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect } from 'storybook/test';
import { createAboutDocs } from './AboutDocs';
import { createAccessibilityDocs } from './AccessibilityDocs';
import { createAccordionDocs } from './AccordionDocs';
import { createAlertDocs } from './AlertDocs';
import { createAlertDialogDocs } from './AlertDialogDocs';
import { createAnalyticsCatalogDocs } from './AnalyticsCatalogDocs';
import { createAspectRatioDocs } from './AspectRatioDocs';
import { createAvatarDocs } from './AvatarDocs';
import { createBadgeDocs } from './BadgeDocs';
import { createBreadcrumbDocs } from './BreadcrumbDocs';
import { createButtonDocs } from './ButtonDocs';
import { createCalendarDocs } from './CalendarDocs';
import { createCardDocs } from './CardDocs';
import { createCarouselDocs } from './CarouselDocs';
import { createChartDocs } from './ChartDocs';
import { createCheckboxDocs } from './CheckboxDocs';
import { createCodeBlockDocs } from './CodeBlockDocs';
import { createCollapsibleDocs } from './CollapsibleDocs';
import { createCommandDocs } from './CommandDocs';
import { createContextMenuDocs } from './ContextMenuDocs';
import { createCrossStackDocs } from './CrossStackDocs';
import { createDataTableDocs } from './DataTableDocs';
import { createDensitiesDocs } from './DensitiesDocs';
import { createDialogDocs } from './DialogDocs';
import { createDrawerDocs } from './DrawerDocs';
import { createDropdownMenuDocs } from './DropdownMenuDocs';
import { createElevationDocs } from './ElevationDocs';
import { createFormDocs } from './FormDocs';
import { createGettingStartedDocs } from './GettingStartedDocs';
import { createHoverCardDocs } from './HoverCardDocs';
import { createI18nDocs } from './I18nDocs';
import { createIconsDocs } from './IconsDocs';
import { createInputDocs } from './InputDocs';
import { createInputOTPDocs } from './InputOTPDocs';
import { createLabelDocs } from './LabelDocs';
import { createMenubarDocs } from './MenubarDocs';
import { createMotionDocs } from './MotionDocs';
import { createNavigationMenuDocs } from './NavigationMenuDocs';
import { createPaginationDocs } from './PaginationDocs';
import { createPopoverDocs } from './PopoverDocs';
import { createProgressDocs } from './ProgressDocs';
import { createRadioGroupDocs } from './RadioGroupDocs';
import { createResizableDocs } from './ResizableDocs';
import { createScrollAreaDocs } from './ScrollAreaDocs';
import { createSelectDocs } from './SelectDocs';
import { createSeoGeoDocs } from './SeoGeoDocs';
import { createSeparatorDocs } from './SeparatorDocs';
import { createSheetDocs } from './SheetDocs';
import { createSidebarDocs } from './SidebarDocs';
import { createSkeletonDocs } from './SkeletonDocs';
import { createSliderDocs } from './SliderDocs';
import { createSonnerDocs } from './SonnerDocs';
import { createSpacingDocs } from './SpacingDocs';
import { createSwitchDocs } from './SwitchDocs';
import { createTableDocs } from './TableDocs';
import { createTabsDocs } from './TabsDocs';
import { createTextareaDocs } from './TextareaDocs';
import { createThemeColorsDocs } from './ThemeColorsDocs';
import { createThemeSystemDocs } from './ThemeSystemDocs';
import { createToggleDocs } from './ToggleDocs';
import { createToggleGroupDocs } from './ToggleGroupDocs';
import { createToneOfVoiceDocs } from './ToneOfVoiceDocs';
import { createTooltipDocs } from './TooltipDocs';
import { createTypographyDocs } from './TypographyDocs';

const meta: Meta = {
  title: 'QA/Docs Smoke',
  tags: ['!dev'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

// Prova que a página montou de verdade (crash = teste vermelho).
// O axe do addon-a11y roda sozinho depois da play (preview: a11y.test = 'error').
// Desvio reportado do contrato: as 16 páginas de foundations (foundationsRenderer)
// rendem <section> SEM id em todas as stacks — só as docs de componente têm
// section[id]. O fallback .nds-docs-section-divider mantém a prova de mount real
// sem excluir foundations da fumaça.
const play: Story['play'] = async ({ canvasElement }) => {
  await expect(
    canvasElement.querySelector('section[id], section.nds-docs-section-divider'),
  ).not.toBeNull();
};

export const About: Story = { render: () => createAboutDocs(), play };
export const Accessibility: Story = { render: () => createAccessibilityDocs(), play };
// landmark-unique RESOLVIDA (2026-08-01): a causa real era id duplicado no
// factory (`accordion-trigger-${value}` sem escopo de instância) — o
// aria-labelledby resolvia para o 1º id do documento e igualava as accessible
// names. Ids agora têm escopo por instância; axe é portão.
export const Accordion: Story = {
  render: () => createAccordionDocs(),
  play,
};
export const Alert: Story = { render: () => createAlertDocs(), play };
export const AlertDialog: Story = { render: () => createAlertDialogDocs(), play };
export const AnalyticsCatalog: Story = { render: () => createAnalyticsCatalogDocs(), play };
export const AspectRatio: Story = { render: () => createAspectRatioDocs(), play };
// aria-prohibited-attr RESOLVIDA (2026-08-01): fallback com ícone ganhou
// role="img" e o dot de status role="status" — aria-label deixou de cair em
// <span> genérico. Axe é portão.
export const Avatar: Story = {
  render: () => createAvatarDocs(),
  play,
};
export const Badge: Story = { render: () => createBadgeDocs(), play };
export const Breadcrumb: Story = {
  render: () => createBreadcrumbDocs(),
  play,
};
export const Button: Story = { render: () => createButtonDocs(), play };
// axe: color-contrast — catalogado no FIXES-NEEDED
export const Calendar: Story = {
  render: () => createCalendarDocs(),
  play,
  parameters: { a11y: { test: 'todo' } },
};
export const Card: Story = { render: () => createCardDocs(), play };
export const Carousel: Story = {
  render: () => createCarouselDocs(),
  play,
};
// aria-prohibited-attr RESOLVIDA (2026-08-01): containers de chart rotulados
// ganharam role="img" — aria-label deixou de cair em <div> genérico. Axe é portão.
export const Chart: Story = {
  render: () => createChartDocs(),
  play,
};
// axe: aria-toggle-field-name — catalogado no FIXES-NEEDED
export const Checkbox: Story = {
  render: () => createCheckboxDocs(),
  play,
  parameters: { a11y: { test: 'todo' } },
};
export const CodeBlock: Story = { render: () => createCodeBlockDocs(), play };
export const Collapsible: Story = { render: () => createCollapsibleDocs(), play };
export const Command: Story = { render: () => createCommandDocs(), play };
// axe: aria-required-parent, color-contrast — catalogado no FIXES-NEEDED
export const ContextMenu: Story = {
  render: () => createContextMenuDocs(),
  play,
  parameters: { a11y: { test: 'todo' } },
};
export const CrossStack: Story = { render: () => createCrossStackDocs(), play };
export const DataTable: Story = { render: () => createDataTableDocs(), play };
export const Densities: Story = { render: () => createDensitiesDocs(), play };
export const Dialog: Story = { render: () => createDialogDocs(), play };
export const Drawer: Story = { render: () => createDrawerDocs(), play };
// axe: aria-required-parent — catalogado no FIXES-NEEDED
export const DropdownMenu: Story = {
  render: () => createDropdownMenuDocs(),
  play,
  parameters: { a11y: { test: 'todo' } },
};
export const Elevation: Story = { render: () => createElevationDocs(), play };
export const Form: Story = { render: () => createFormDocs(), play };
export const GettingStarted: Story = { render: () => createGettingStartedDocs(), play };
export const HoverCard: Story = { render: () => createHoverCardDocs(), play };
export const I18n: Story = { render: () => createI18nDocs(), play };
// axe: color-contrast — catalogado no FIXES-NEEDED
export const Icons: Story = {
  render: () => createIconsDocs(),
  play,
  parameters: { a11y: { test: 'todo' } },
};
// axe: label — catalogado no FIXES-NEEDED
export const Input: Story = {
  render: () => createInputDocs(),
  play,
  parameters: { a11y: { test: 'todo' } },
};
export const InputOTP: Story = { render: () => createInputOTPDocs(), play };
export const Label: Story = { render: () => createLabelDocs(), play };
// axe: aria-required-parent — catalogado no FIXES-NEEDED
export const Menubar: Story = {
  render: () => createMenubarDocs(),
  play,
  parameters: { a11y: { test: 'todo' } },
};
export const Motion: Story = { render: () => createMotionDocs(), play };
export const NavigationMenu: Story = {
  render: () => createNavigationMenuDocs(),
  play,
};
export const Pagination: Story = {
  render: () => createPaginationDocs(),
  play,
};
export const Popover: Story = { render: () => createPopoverDocs(), play };
export const Progress: Story = { render: () => createProgressDocs(), play };
export const RadioGroup: Story = { render: () => createRadioGroupDocs(), play };
export const Resizable: Story = { render: () => createResizableDocs(), play };
export const ScrollArea: Story = { render: () => createScrollAreaDocs(), play };
// color-contrast + select-name RESOLVIDAS (2026-08-01): o botão "Continuar" da
// composição usava color: var(--primary-foreground) sem hsl() (declaração
// inválida → herdava --foreground sobre --primary) — trocado pela classe
// nds-text-primary-foreground; e as prosas com `<select>`/`<option>` literais
// (NOTA do WithIcon e extensibilityNotes) viravam elementos reais via
// innerHTML — escapadas com &lt;/&gt;. Axe é portão.
export const Select: Story = {
  render: () => createSelectDocs(),
  play,
};
export const SeoGeo: Story = { render: () => createSeoGeoDocs(), play };
export const Separator: Story = { render: () => createSeparatorDocs(), play };
export const Sheet: Story = { render: () => createSheetDocs(), play };
// axe: color-contrast, listitem — catalogado no FIXES-NEEDED
export const Sidebar: Story = {
  render: () => createSidebarDocs(),
  play,
  parameters: { a11y: { test: 'todo' } },
};
export const Skeleton: Story = { render: () => createSkeletonDocs(), play };
// axe: label — catalogado no FIXES-NEEDED
export const Slider: Story = {
  render: () => createSliderDocs(),
  play,
  parameters: { a11y: { test: 'todo' } },
};
export const Sonner: Story = { render: () => createSonnerDocs(), play };
export const Spacing: Story = { render: () => createSpacingDocs(), play };
// axe: button-name — catalogado no FIXES-NEEDED
export const Switch: Story = {
  render: () => createSwitchDocs(),
  play,
  parameters: { a11y: { test: 'todo' } },
};
export const Table: Story = { render: () => createTableDocs(), play };
export const Tabs: Story = { render: () => createTabsDocs(), play };
// axe: label — catalogado no FIXES-NEEDED
export const Textarea: Story = {
  render: () => createTextareaDocs(),
  play,
  parameters: { a11y: { test: 'todo' } },
};
export const ThemeColors: Story = { render: () => createThemeColorsDocs(), play };
export const ThemeSystem: Story = { render: () => createThemeSystemDocs(), play };
export const Toggle: Story = { render: () => createToggleDocs(), play };
// axe: button-name — catalogado no FIXES-NEEDED
export const ToggleGroup: Story = {
  render: () => createToggleGroupDocs(),
  play,
  parameters: { a11y: { test: 'todo' } },
};
export const ToneOfVoice: Story = { render: () => createToneOfVoiceDocs(), play };
export const Tooltip: Story = { render: () => createTooltipDocs(), play };
export const Typography: Story = { render: () => createTypographyDocs(), play };
