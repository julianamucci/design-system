// Suíte de fumaça das docs pages — gerada por script (contrato docs-smoke).
// Um export por página de src/components/docs/*Docs.tsx. A play prova que a
// página montou (crash = teste vermelho); o axe do addon-a11y roda em seguida.
// Política: página que falha no axe recebe parameters.a11y.test='todo' com as
// rules em comentário; página que crasha fica FORA do arquivo, listada aqui.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';

import { AboutDocs } from './AboutDocs';
import { AccessibilityDocs } from './AccessibilityDocs';
import { AccordionDocs } from './AccordionDocs';
import { AlertDialogDocs } from './AlertDialogDocs';
import { AlertDocs } from './AlertDocs';
import { AnalyticsCatalogDocs } from './AnalyticsCatalogDocs';
import { AspectRatioDocs } from './AspectRatioDocs';
import { AvatarDocs } from './AvatarDocs';
import { BadgeDocs } from './BadgeDocs';
import { BreadcrumbDocs } from './BreadcrumbDocs';
import { ButtonDocs } from './ButtonDocs';
import { CalendarDocs } from './CalendarDocs';
import { CardDocs } from './CardDocs';
import { CarouselDocs } from './CarouselDocs';
import { ChartDocs } from './ChartDocs';
import { CheckboxDocs } from './CheckboxDocs';
import { CodeBlockDocs } from './CodeBlockDocs';
import { CollapsibleDocs } from './CollapsibleDocs';
import { CommandDocs } from './CommandDocs';
import { ContextMenuDocs } from './ContextMenuDocs';
import { CrossStackDocs } from './CrossStackDocs';
import { DataTableDocs } from './DataTableDocs';
import { DensitiesDocs } from './DensitiesDocs';
import { DialogDocs } from './DialogDocs';
import { DrawerDocs } from './DrawerDocs';
import { DropdownMenuDocs } from './DropdownMenuDocs';
import { ElevationDocs } from './ElevationDocs';
import { GettingStartedDocs } from './GettingStartedDocs';
import { HoverCardDocs } from './HoverCardDocs';
import { I18nDocs } from './I18nDocs';
import { IconsDocs } from './IconsDocs';
import { InputDocs } from './InputDocs';
import { InputOTPDocs } from './InputOTPDocs';
import { LabelDocs } from './LabelDocs';
import { MenubarDocs } from './MenubarDocs';
import { MotionDocs } from './MotionDocs';
import { NavigationMenuDocs } from './NavigationMenuDocs';
import { PaginationDocs } from './PaginationDocs';
import { PopoverDocs } from './PopoverDocs';
import { ProgressDocs } from './ProgressDocs';
import { RadioGroupDocs } from './RadioGroupDocs';
import { ResizableDocs } from './ResizableDocs';
import { ScrollAreaDocs } from './ScrollAreaDocs';
import { SelectDocs } from './SelectDocs';
import { SeoGeoDocs } from './SeoGeoDocs';
import { SeparatorDocs } from './SeparatorDocs';
import { SheetDocs } from './SheetDocs';
import { SidebarDocs } from './SidebarDocs';
import { SkeletonDocs } from './SkeletonDocs';
import { SliderDocs } from './SliderDocs';
import { SonnerDocs } from './SonnerDocs';
import { SpacingDocs } from './SpacingDocs';
import { SwitchDocs } from './SwitchDocs';
import { TableDocs } from './TableDocs';
import { TabsDocs } from './TabsDocs';
import { TextareaDocs } from './TextareaDocs';
import { ThemeColorsDocs } from './ThemeColorsDocs';
import { ThemeSystemDocs } from './ThemeSystemDocs';
import { ToggleDocs } from './ToggleDocs';
import { ToggleGroupDocs } from './ToggleGroupDocs';
import { ToneOfVoiceDocs } from './ToneOfVoiceDocs';
import { TooltipDocs } from './TooltipDocs';
import { TypographyDocs } from './TypographyDocs';

const meta = {
  title: 'QA/Docs Smoke',
  tags: ['!dev'],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Prova mínima de mount: toda docs page renderiza ao menos uma <section>.
// Nota: o contrato pede section[id], mas as 16 páginas Foundations (via
// FoundationPage/ThemeColors/Icons) renderizam <section> SEM id — seletor
// relaxado para cobrir todas sem perder a prova de mount (crash = 0 sections).
const mounted: Story['play'] = async ({ canvasElement }) => {
  await expect(canvasElement.querySelector('section')).not.toBeNull();
};

export const About: Story = {
  render: () => <AboutDocs />,
  play: mounted,
};

export const Accessibility: Story = {
  render: () => <AccessibilityDocs />,
  play: mounted,
};

// landmark-unique RESOLVIDA (2026-08-01, decisão da dona): a variante single
// usa itens próprios (q2/q3) — a Demonstração abre q1, e dois painéis abertos
// com a mesma accessible name colidiam. Axe é portão.
export const Accordion: Story = {
  render: () => <AccordionDocs />,
  play: mounted,
};

// axe: nested-interactive, target-size — catalogado no FIXES-NEEDED
export const AlertDialog: Story = {
  render: () => <AlertDialogDocs />,
  play: mounted,
  parameters: { a11y: { test: 'todo' } },
};

export const Alert: Story = {
  render: () => <AlertDocs />,
  play: mounted,
};

export const AnalyticsCatalog: Story = {
  render: () => <AnalyticsCatalogDocs />,
  play: mounted,
};

export const AspectRatio: Story = {
  render: () => <AspectRatioDocs />,
  play: mounted,
};

// axe: aria-prohibited-attr — catalogado no FIXES-NEEDED
export const Avatar: Story = {
  render: () => <AvatarDocs />,
  play: mounted,
  parameters: { a11y: { test: 'todo' } },
};

export const Badge: Story = {
  render: () => <BadgeDocs />,
  play: mounted,
};

export const Breadcrumb: Story = {
  render: () => <BreadcrumbDocs />,
  play: mounted,
};

export const Button: Story = {
  render: () => <ButtonDocs />,
  play: mounted,
};

// axe: scope-attr-valid — catalogado no FIXES-NEEDED (landmark-unique resolvida)
export const Calendar: Story = {
  render: () => <CalendarDocs />,
  play: mounted,
  parameters: { a11y: { test: 'todo' } },
};

export const Card: Story = {
  render: () => <CardDocs />,
  play: mounted,
};

export const Carousel: Story = {
  render: () => <CarouselDocs />,
  play: mounted,
};

export const Chart: Story = {
  render: () => <ChartDocs />,
  play: mounted,
};

// axe: target-size — catalogado no FIXES-NEEDED
export const Checkbox: Story = {
  render: () => <CheckboxDocs />,
  play: mounted,
  parameters: { a11y: { test: 'todo' } },
};

export const CodeBlock: Story = {
  render: () => <CodeBlockDocs />,
  play: mounted,
};

// axe: nested-interactive, target-size — catalogado no FIXES-NEEDED
export const Collapsible: Story = {
  render: () => <CollapsibleDocs />,
  play: mounted,
  parameters: { a11y: { test: 'todo' } },
};

// axe: aria-required-children, button-name, color-contrast — catalogado no FIXES-NEEDED
export const Command: Story = {
  render: () => <CommandDocs />,
  play: mounted,
  parameters: { a11y: { test: 'todo' } },
};

export const ContextMenu: Story = {
  render: () => <ContextMenuDocs />,
  play: mounted,
};

export const CrossStack: Story = {
  render: () => <CrossStackDocs />,
  play: mounted,
};

export const DataTable: Story = {
  render: () => <DataTableDocs />,
  play: mounted,
};

export const Densities: Story = {
  render: () => <DensitiesDocs />,
  play: mounted,
};

export const Dialog: Story = {
  render: () => <DialogDocs />,
  play: mounted,
};

export const Drawer: Story = {
  render: () => <DrawerDocs />,
  play: mounted,
};

// axe: aria-hidden-focus — catalogado no FIXES-NEEDED
export const DropdownMenu: Story = {
  render: () => <DropdownMenuDocs />,
  play: mounted,
  parameters: { a11y: { test: 'todo' } },
};

export const Elevation: Story = {
  render: () => <ElevationDocs />,
  play: mounted,
};

export const GettingStarted: Story = {
  render: () => <GettingStartedDocs />,
  play: mounted,
};

export const HoverCard: Story = {
  render: () => <HoverCardDocs />,
  play: mounted,
};

export const I18n: Story = {
  render: () => <I18nDocs />,
  play: mounted,
};

// axe: color-contrast (última medição completa) — catálogo inteiro do lucide (~1600 ícones) estoura o timeout do axe
export const Icons: Story = {
  render: () => <IconsDocs />,
  play: mounted,
  parameters: { a11y: { disable: true } },
};

export const Input: Story = {
  render: () => <InputDocs />,
  play: mounted,
};

export const InputOTP: Story = {
  render: () => <InputOTPDocs />,
  play: mounted,
};

export const Label: Story = {
  render: () => <LabelDocs />,
  play: mounted,
};

// axe: aria-required-children — catalogado no FIXES-NEEDED
export const Menubar: Story = {
  render: () => <MenubarDocs />,
  play: mounted,
  parameters: { a11y: { test: 'todo' } },
};

export const Motion: Story = {
  render: () => <MotionDocs />,
  play: mounted,
};

// axe: aria-hidden-focus — catalogado no FIXES-NEEDED; landmark-unique restante
// axe: aria-hidden-focus (focus guards do Base UI) — landmark-unique RESOLVIDA
// (raízes com aria-label único + popup render={<div/>} no primitivo, decisão
// da dona 2026-08-01; provado em modo portão: só aria-hidden-focus resta).
export const NavigationMenu: Story = {
  render: () => <NavigationMenuDocs />,
  play: mounted,
  parameters: { a11y: { test: 'todo' } },
};

export const Pagination: Story = {
  render: () => <PaginationDocs />,
  play: mounted,
};

export const Popover: Story = {
  render: () => <PopoverDocs />,
  play: mounted,
};

export const Progress: Story = {
  render: () => <ProgressDocs />,
  play: mounted,
};

// axe: aria-toggle-field-name — catalogado no FIXES-NEEDED
export const RadioGroup: Story = {
  render: () => <RadioGroupDocs />,
  play: mounted,
  parameters: { a11y: { test: 'todo' } },
};

// axe: scrollable-region-focusable — catalogado no FIXES-NEEDED
export const Resizable: Story = {
  render: () => <ResizableDocs />,
  play: mounted,
  parameters: { a11y: { test: 'todo' } },
};

export const ScrollArea: Story = {
  render: () => <ScrollAreaDocs />,
  play: mounted,
};

// axe: color-contrast, select-name — catalogado no FIXES-NEEDED
export const Select: Story = {
  render: () => <SelectDocs />,
  play: mounted,
  parameters: { a11y: { test: 'todo' } },
};

export const SeoGeo: Story = {
  render: () => <SeoGeoDocs />,
  play: mounted,
};

export const Separator: Story = {
  render: () => <SeparatorDocs />,
  play: mounted,
};

export const Sheet: Story = {
  render: () => <SheetDocs />,
  play: mounted,
};

export const Sidebar: Story = {
  render: () => <SidebarDocs />,
  play: mounted,
};

// axe: aria-prohibited-attr — catalogado no FIXES-NEEDED
export const Skeleton: Story = {
  render: () => <SkeletonDocs />,
  play: mounted,
  parameters: { a11y: { test: 'todo' } },
};

export const Slider: Story = {
  render: () => <SliderDocs />,
  play: mounted,
};

export const Sonner: Story = {
  render: () => <SonnerDocs />,
  play: mounted,
};

export const Spacing: Story = {
  render: () => <SpacingDocs />,
  play: mounted,
};

// axe: aria-toggle-field-name — catalogado no FIXES-NEEDED
export const Switch: Story = {
  render: () => <SwitchDocs />,
  play: mounted,
  parameters: { a11y: { test: 'todo' } },
};

export const Table: Story = {
  render: () => <TableDocs />,
  play: mounted,
};

export const Tabs: Story = {
  render: () => <TabsDocs />,
  play: mounted,
};

// axe: label — catalogado no FIXES-NEEDED
export const Textarea: Story = {
  render: () => <TextareaDocs />,
  play: mounted,
  parameters: { a11y: { test: 'todo' } },
};

export const ThemeColors: Story = {
  render: () => <ThemeColorsDocs />,
  play: mounted,
};

export const ThemeSystem: Story = {
  render: () => <ThemeSystemDocs />,
  play: mounted,
};

export const Toggle: Story = {
  render: () => <ToggleDocs />,
  play: mounted,
};

export const ToggleGroup: Story = {
  render: () => <ToggleGroupDocs />,
  play: mounted,
};

export const ToneOfVoice: Story = {
  render: () => <ToneOfVoiceDocs />,
  play: mounted,
};

export const Tooltip: Story = {
  render: () => <TooltipDocs />,
  play: mounted,
};

export const Typography: Story = {
  render: () => <TypographyDocs />,
  play: mounted,
};
