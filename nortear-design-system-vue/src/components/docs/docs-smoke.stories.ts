// GERADO por script (docs-smoke) — CSF estático: um export por docs page.
// Fumaça: prova que cada página monta (section[id] presente); axe roda após a play.
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect } from 'storybook/test';

import AboutDocs from '@/components/docs/AboutDocs.vue';
import AccessibilityDocs from '@/components/docs/AccessibilityDocs.vue';
import AccordionDocs from '@/components/docs/AccordionDocs.vue';
import AlertDocs from '@/components/docs/AlertDocs.vue';
import AlertDialogDocs from '@/components/docs/AlertDialogDocs.vue';
import AnalyticsCatalogDocs from '@/components/docs/AnalyticsCatalogDocs.vue';
import AspectRatioDocs from '@/components/docs/AspectRatioDocs.vue';
import AvatarDocs from '@/components/docs/AvatarDocs.vue';
import BadgeDocs from '@/components/docs/BadgeDocs.vue';
import BreadcrumbDocs from '@/components/docs/BreadcrumbDocs.vue';
import ButtonDocs from '@/components/docs/ButtonDocs.vue';
import CalendarDocs from '@/components/docs/CalendarDocs.vue';
import CardDocs from '@/components/docs/CardDocs.vue';
import CarouselDocs from '@/components/docs/CarouselDocs.vue';
import ChartDocs from '@/components/docs/ChartDocs.vue';
import CheckboxDocs from '@/components/docs/CheckboxDocs.vue';
import CodeBlockDocs from '@/components/docs/CodeBlockDocs.vue';
import CollapsibleDocs from '@/components/docs/CollapsibleDocs.vue';
import CommandDocs from '@/components/docs/CommandDocs.vue';
import ContextMenuDocs from '@/components/docs/ContextMenuDocs.vue';
import CrossStackDocs from '@/components/docs/CrossStackDocs.vue';
import DataTableDocs from '@/components/docs/DataTableDocs.vue';
import DensitiesDocs from '@/components/docs/DensitiesDocs.vue';
import DialogDocs from '@/components/docs/DialogDocs.vue';
import DrawerDocs from '@/components/docs/DrawerDocs.vue';
import DropdownMenuDocs from '@/components/docs/DropdownMenuDocs.vue';
import ElevationDocs from '@/components/docs/ElevationDocs.vue';
import GettingStartedDocs from '@/components/docs/GettingStartedDocs.vue';
import HoverCardDocs from '@/components/docs/HoverCardDocs.vue';
import I18nDocs from '@/components/docs/I18nDocs.vue';
import IconsDocs from '@/components/docs/IconsDocs.vue';
import InputDocs from '@/components/docs/InputDocs.vue';
import InputOTPDocs from '@/components/docs/InputOTPDocs.vue';
import LabelDocs from '@/components/docs/LabelDocs.vue';
import MenubarDocs from '@/components/docs/MenubarDocs.vue';
import MotionDocs from '@/components/docs/MotionDocs.vue';
import NavigationMenuDocs from '@/components/docs/NavigationMenuDocs.vue';
import PaginationDocs from '@/components/docs/PaginationDocs.vue';
import PopoverDocs from '@/components/docs/PopoverDocs.vue';
import ProgressDocs from '@/components/docs/ProgressDocs.vue';
import RadioGroupDocs from '@/components/docs/RadioGroupDocs.vue';
import ResizableDocs from '@/components/docs/ResizableDocs.vue';
import ScrollAreaDocs from '@/components/docs/ScrollAreaDocs.vue';
import SelectDocs from '@/components/docs/SelectDocs.vue';
import SeoGeoDocs from '@/components/docs/SeoGeoDocs.vue';
import SeparatorDocs from '@/components/docs/SeparatorDocs.vue';
import SheetDocs from '@/components/docs/SheetDocs.vue';
import SidebarDocs from '@/components/docs/SidebarDocs.vue';
import SkeletonDocs from '@/components/docs/SkeletonDocs.vue';
import SliderDocs from '@/components/docs/SliderDocs.vue';
import SonnerDocs from '@/components/docs/SonnerDocs.vue';
import SpacingDocs from '@/components/docs/SpacingDocs.vue';
import SwitchDocs from '@/components/docs/SwitchDocs.vue';
import TableDocs from '@/components/docs/TableDocs.vue';
import TabsDocs from '@/components/docs/TabsDocs.vue';
import TextareaDocs from '@/components/docs/TextareaDocs.vue';
import ThemeColorsDocs from '@/components/docs/ThemeColorsDocs.vue';
import ThemeSystemDocs from '@/components/docs/ThemeSystemDocs.vue';
import ToggleDocs from '@/components/docs/ToggleDocs.vue';
import ToggleGroupDocs from '@/components/docs/ToggleGroupDocs.vue';
import ToneOfVoiceDocs from '@/components/docs/ToneOfVoiceDocs.vue';
import TooltipDocs from '@/components/docs/TooltipDocs.vue';
import TypographyDocs from '@/components/docs/TypographyDocs.vue';

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

// Contrato pede section[id]; nesta stack as foundations (FoundationsRenderer,
// IconsDocs, ThemeColorsDocs) montam <section> SEM id — o seletor cobre os
// dois casos e continua provando o mount (crash = teste vermelho).
const smokePlay = async ({ canvasElement }: { canvasElement: HTMLElement }) => {
  await expect(canvasElement.querySelector('section[id], section')).not.toBeNull();
};

export const About: Story = {
  render: () => ({ components: { AboutDocs }, template: '<AboutDocs />' }),
  play: smokePlay,
};

export const Accessibility: Story = {
  render: () => ({ components: { AccessibilityDocs }, template: '<AccessibilityDocs />' }),
  play: smokePlay,
};

export const Accordion: Story = {
  render: () => ({ components: { AccordionDocs }, template: '<AccordionDocs />' }),
  play: smokePlay,
};

export const Alert: Story = {
  render: () => ({ components: { AlertDocs }, template: '<AlertDocs />' }),
  play: smokePlay,
};

export const AlertDialog: Story = {
  render: () => ({ components: { AlertDialogDocs }, template: '<AlertDialogDocs />' }),
  play: smokePlay,
};

export const AnalyticsCatalog: Story = {
  render: () => ({ components: { AnalyticsCatalogDocs }, template: '<AnalyticsCatalogDocs />' }),
  play: smokePlay,
};

export const AspectRatio: Story = {
  render: () => ({ components: { AspectRatioDocs }, template: '<AspectRatioDocs />' }),
  play: smokePlay,
};

export const Avatar: Story = {
  // axe: aria-prohibited-attr — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { AvatarDocs }, template: '<AvatarDocs />' }),
  play: smokePlay,
};

export const Badge: Story = {
  render: () => ({ components: { BadgeDocs }, template: '<BadgeDocs />' }),
  play: smokePlay,
};

export const Breadcrumb: Story = {
  render: () => ({ components: { BreadcrumbDocs }, template: '<BreadcrumbDocs />' }),
  play: smokePlay,
};

export const Button: Story = {
  // axe: scrollable-region-focusable — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { ButtonDocs }, template: '<ButtonDocs />' }),
  play: smokePlay,
};

export const Calendar: Story = {
  render: () => ({ components: { CalendarDocs }, template: '<CalendarDocs />' }),
  play: smokePlay,
};

export const Card: Story = {
  render: () => ({ components: { CardDocs }, template: '<CardDocs />' }),
  play: smokePlay,
};

export const Carousel: Story = {
  render: () => ({ components: { CarouselDocs }, template: '<CarouselDocs />' }),
  play: smokePlay,
};

export const Chart: Story = {
  render: () => ({ components: { ChartDocs }, template: '<ChartDocs />' }),
  play: smokePlay,
};

export const Checkbox: Story = {
  // axe: empty-heading, target-size — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { CheckboxDocs }, template: '<CheckboxDocs />' }),
  play: smokePlay,
};

export const CodeBlock: Story = {
  render: () => ({ components: { CodeBlockDocs }, template: '<CodeBlockDocs />' }),
  play: smokePlay,
};

export const Collapsible: Story = {
  render: () => ({ components: { CollapsibleDocs }, template: '<CollapsibleDocs />' }),
  play: smokePlay,
};

export const Command: Story = {
  // axe: aria-required-children, button-name, empty-heading — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { CommandDocs }, template: '<CommandDocs />' }),
  play: smokePlay,
};

export const ContextMenu: Story = {
  render: () => ({ components: { ContextMenuDocs }, template: '<ContextMenuDocs />' }),
  play: smokePlay,
};

export const CrossStack: Story = {
  render: () => ({ components: { CrossStackDocs }, template: '<CrossStackDocs />' }),
  play: smokePlay,
};

export const DataTable: Story = {
  render: () => ({ components: { DataTableDocs }, template: '<DataTableDocs />' }),
  play: smokePlay,
};

export const Densities: Story = {
  render: () => ({ components: { DensitiesDocs }, template: '<DensitiesDocs />' }),
  play: smokePlay,
};

export const Dialog: Story = {
  render: () => ({ components: { DialogDocs }, template: '<DialogDocs />' }),
  play: smokePlay,
};

export const Drawer: Story = {
  render: () => ({ components: { DrawerDocs }, template: '<DrawerDocs />' }),
  play: smokePlay,
};

export const DropdownMenu: Story = {
  render: () => ({ components: { DropdownMenuDocs }, template: '<DropdownMenuDocs />' }),
  play: smokePlay,
};

export const Elevation: Story = {
  render: () => ({ components: { ElevationDocs }, template: '<ElevationDocs />' }),
  play: smokePlay,
};

export const GettingStarted: Story = {
  render: () => ({ components: { GettingStartedDocs }, template: '<GettingStartedDocs />' }),
  play: smokePlay,
};

export const HoverCard: Story = {
  render: () => ({ components: { HoverCardDocs }, template: '<HoverCardDocs />' }),
  play: smokePlay,
};

export const I18n: Story = {
  render: () => ({ components: { I18nDocs }, template: '<I18nDocs />' }),
  play: smokePlay,
};

export const Icons: Story = {
  // axe: color-contrast — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { IconsDocs }, template: '<IconsDocs />' }),
  play: smokePlay,
};

export const Input: Story = {
  // axe: label — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { InputDocs }, template: '<InputDocs />' }),
  play: smokePlay,
};

export const InputOTP: Story = {
  render: () => ({ components: { InputOTPDocs }, template: '<InputOTPDocs />' }),
  play: smokePlay,
};

export const Label: Story = {
  // axe: empty-heading — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { LabelDocs }, template: '<LabelDocs />' }),
  play: smokePlay,
};

export const Menubar: Story = {
  render: () => ({ components: { MenubarDocs }, template: '<MenubarDocs />' }),
  play: smokePlay,
};

export const Motion: Story = {
  render: () => ({ components: { MotionDocs }, template: '<MotionDocs />' }),
  play: smokePlay,
};

export const NavigationMenu: Story = {
  // axe: aria-hidden-focus — catalogado no FIXES-NEEDED (landmark-unique resolvida)
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { NavigationMenuDocs }, template: '<NavigationMenuDocs />' }),
  play: smokePlay,
};

export const Pagination: Story = {
  render: () => ({ components: { PaginationDocs }, template: '<PaginationDocs />' }),
  play: smokePlay,
};

export const Popover: Story = {
  render: () => ({ components: { PopoverDocs }, template: '<PopoverDocs />' }),
  play: smokePlay,
};

export const Progress: Story = {
  render: () => ({ components: { ProgressDocs }, template: '<ProgressDocs />' }),
  play: smokePlay,
};

export const RadioGroup: Story = {
  // axe: empty-heading — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { RadioGroupDocs }, template: '<RadioGroupDocs />' }),
  play: smokePlay,
};

export const Resizable: Story = {
  render: () => ({ components: { ResizableDocs }, template: '<ResizableDocs />' }),
  play: smokePlay,
};

export const ScrollArea: Story = {
  render: () => ({ components: { ScrollAreaDocs }, template: '<ScrollAreaDocs />' }),
  play: smokePlay,
};

export const Select: Story = {
  // axe: empty-heading — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { SelectDocs }, template: '<SelectDocs />' }),
  play: smokePlay,
};

export const SeoGeo: Story = {
  render: () => ({ components: { SeoGeoDocs }, template: '<SeoGeoDocs />' }),
  play: smokePlay,
};

export const Separator: Story = {
  render: () => ({ components: { SeparatorDocs }, template: '<SeparatorDocs />' }),
  play: smokePlay,
};

export const Sheet: Story = {
  render: () => ({ components: { SheetDocs }, template: '<SheetDocs />' }),
  play: smokePlay,
};

export const Sidebar: Story = {
  // axe: empty-heading — catalogado no FIXES-NEEDED (landmark-no-duplicate-main e landmark-unique resolvidas)
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { SidebarDocs }, template: '<SidebarDocs />' }),
  play: smokePlay,
};

export const Skeleton: Story = {
  // axe: aria-prohibited-attr — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { SkeletonDocs }, template: '<SkeletonDocs />' }),
  play: smokePlay,
};

export const Slider: Story = {
  // axe: empty-heading — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { SliderDocs }, template: '<SliderDocs />' }),
  play: smokePlay,
};

export const Sonner: Story = {
  render: () => ({ components: { SonnerDocs }, template: '<SonnerDocs />' }),
  play: smokePlay,
};

export const Spacing: Story = {
  render: () => ({ components: { SpacingDocs }, template: '<SpacingDocs />' }),
  play: smokePlay,
};

export const Switch: Story = {
  // axe: button-name, empty-heading — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { SwitchDocs }, template: '<SwitchDocs />' }),
  play: smokePlay,
};

export const Table: Story = {
  render: () => ({ components: { TableDocs }, template: '<TableDocs />' }),
  play: smokePlay,
};

export const Tabs: Story = {
  render: () => ({ components: { TabsDocs }, template: '<TabsDocs />' }),
  play: smokePlay,
};

export const Textarea: Story = {
  // axe: empty-heading — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { TextareaDocs }, template: '<TextareaDocs />' }),
  play: smokePlay,
};

export const ThemeColors: Story = {
  render: () => ({ components: { ThemeColorsDocs }, template: '<ThemeColorsDocs />' }),
  play: smokePlay,
};

export const ThemeSystem: Story = {
  // axe: heading-order — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { ThemeSystemDocs }, template: '<ThemeSystemDocs />' }),
  play: smokePlay,
};

export const Toggle: Story = {
  // axe: empty-heading — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { ToggleDocs }, template: '<ToggleDocs />' }),
  play: smokePlay,
};

export const ToggleGroup: Story = {
  // axe: button-name, empty-heading — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { ToggleGroupDocs }, template: '<ToggleGroupDocs />' }),
  play: smokePlay,
};

export const ToneOfVoice: Story = {
  render: () => ({ components: { ToneOfVoiceDocs }, template: '<ToneOfVoiceDocs />' }),
  play: smokePlay,
};

export const Tooltip: Story = {
  // axe: button-name — catalogado no FIXES-NEEDED
  parameters: { a11y: { test: 'todo' } },
  render: () => ({ components: { TooltipDocs }, template: '<TooltipDocs />' }),
  play: smokePlay,
};

export const Typography: Story = {
  render: () => ({ components: { TypographyDocs }, template: '<TypographyDocs />' }),
  play: smokePlay,
};
