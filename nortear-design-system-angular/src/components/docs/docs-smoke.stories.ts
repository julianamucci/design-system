// Suíte de fumaça das docs pages (contrato docs-smoke).
// Um export por página de src/components/docs/*Docs.ts.
// Política: crash no mount → export fica FORA (listado no comentário); axe
// falhando → parameters.a11y.test:'todo' com as rules no comentário; página
// limpa → axe é portão.
//
// Um export por docs page implementada. O stack está em construção: a lista
// cresce a cada componente do roteiro em .pipeline-context/_ordem.md.

import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { auditarPaginaDeDocs, descreverProblemas } from '@shared/testing/docs-page-contract';
import { NdsButtonDocs } from './ButtonDocs';
import { NdsSeparatorDocs } from './SeparatorDocs';
import { NdsLabelDocs } from './LabelDocs';
import { NdsCardDocs } from './CardDocs';
import { NdsBadgeDocs } from './BadgeDocs';
import { NdsSkeletonDocs } from './SkeletonDocs';
import { NdsAspectRatioDocs } from './AspectRatioDocs';
import { NdsInputDocs } from './InputDocs';
import { NdsCheckboxDocs } from './CheckboxDocs';
import { NdsSwitchDocs } from './SwitchDocs';
import { NdsToggleDocs } from './ToggleDocs';
import { NdsRadioGroupDocs } from './RadioGroupDocs';
import { NdsSliderDocs } from './SliderDocs';
import { NdsProgressDocs } from './ProgressDocs';
import { NdsAvatarDocs } from './AvatarDocs';
import { NdsCodeBlockDocs } from './CodeBlockDocs';
import { NdsAlertDocs } from './AlertDocs';
import { NdsBreadcrumbDocs } from './BreadcrumbDocs';
import { NdsAccordionDocs } from './AccordionDocs';
import { NdsCollapsibleDocs } from './CollapsibleDocs';
import { NdsTabsDocs } from './TabsDocs';
import { NdsToggleGroupDocs } from './ToggleGroupDocs';
import { NdsSidebarDocs } from './SidebarDocs';
import { NdsTableDocs } from './TableDocs';
import { NdsScrollAreaDocs } from './ScrollAreaDocs';
import { NdsPaginationDocs } from './PaginationDocs';
import { NdsTooltipDocs } from './TooltipDocs';
import { NdsSheetDocs } from './SheetDocs';
import { NdsDialogDocs } from './DialogDocs';
import { NdsPopoverDocs } from './PopoverDocs';
import { NdsHoverCardDocs } from './HoverCardDocs';
import { NdsDropdownMenuDocs } from './DropdownMenuDocs';
import { NdsAlertDialogDocs } from './AlertDialogDocs';
import { NdsContextMenuDocs } from './ContextMenuDocs';
import { NdsMenubarDocs } from './MenubarDocs';
import { NdsSelectDocs } from './SelectDocs';
import { NdsDrawerDocs } from './DrawerDocs';
import { NdsNavigationMenuDocs } from './NavigationMenuDocs';
import { NdsCommandDocs } from './CommandDocs';

const meta: Meta = {
  title: 'QA/Docs Smoke',
  tags: ['!dev'],
  decorators: [moduleMetadata({ imports: [NdsButtonDocs, NdsSeparatorDocs, NdsLabelDocs, NdsCardDocs, NdsBadgeDocs, NdsSkeletonDocs, NdsAspectRatioDocs, NdsInputDocs, NdsCheckboxDocs, NdsSwitchDocs, NdsToggleDocs, NdsRadioGroupDocs, NdsSliderDocs, NdsProgressDocs, NdsAvatarDocs, NdsCodeBlockDocs, NdsAlertDocs, NdsBreadcrumbDocs, NdsAccordionDocs, NdsCollapsibleDocs, NdsTabsDocs, NdsToggleGroupDocs, NdsSidebarDocs, NdsTableDocs, NdsScrollAreaDocs, NdsPaginationDocs, NdsTooltipDocs, NdsSheetDocs, NdsDialogDocs, NdsPopoverDocs, NdsHoverCardDocs, NdsDropdownMenuDocs, NdsAlertDialogDocs, NdsContextMenuDocs, NdsMenubarDocs, NdsSelectDocs, NdsDrawerDocs, NdsNavigationMenuDocs, NdsCommandDocs] })],
  parameters: {
    controls: { disable: true },
    actions: { disable: true },
  },
};

export default meta;
type Story = StoryObj;

const play: Story['play'] = async ({ canvasElement, parameters }) => {
  // Prova que a página montou de verdade (crash = teste vermelho).
  // O axe do addon-a11y roda sozinho depois da play (preview: a11y.test = 'error').
  await expect(
    canvasElement.querySelector('section[id], section.nds-docs-section-divider'),
  ).not.toBeNull();

  // Contrato de conteúdo, compartilhado pelas stacks. Montar sem crashar e
  // passar no axe não alcança o que se vê na tela: preview encostado à
  // esquerda, bloco de código vazio, chave de tradução renderizada como texto.
  const problemas = auditarPaginaDeDocs(canvasElement, {
    ignorar: (parameters as { contratoDocs?: { ignorar?: Record<string, string> } }).contratoDocs
      ?.ignorar,
  });
  await expect(
    problemas,
    problemas.length ? `\n${descreverProblemas(problemas)}\n` : '',
  ).toEqual([]);

  // Idioma do documento QUE O LEITOR LÊ. Esta suíte roda dentro do iframe do
  // preview, servido como <html lang="en"> pelo template do Storybook: se o
  // applySeo voltar a escrever o lang só no documento pai, a prosa em português
  // volta a ser anunciada em inglês e ninguém percebe. WCAG 3.1.1.
  await waitFor(() => expect(document.documentElement.lang).toBe('pt-BR'));
};

export const Button: Story = {
  render: () => ({ template: '<nds-button-docs />' }),
  play,
};

export const Separator: Story = {
  render: () => ({ template: '<nds-separator-docs />' }),
  play,
};

export const Label: Story = {
  render: () => ({ template: '<nds-label-docs />' }),
  play,
};

export const Card: Story = {
  render: () => ({ template: '<nds-card-docs />' }),
  play,
};

export const Badge: Story = {
  render: () => ({ template: '<nds-badge-docs />' }),
  play,
};

export const Skeleton: Story = {
  render: () => ({ template: '<nds-skeleton-docs />' }),
  play,
};

export const AspectRatio: Story = {
  render: () => ({ template: '<nds-aspect-ratio-docs />' }),
  play,
};

export const Input: Story = {
  render: () => ({ template: '<nds-input-docs />' }),
  play,
};

export const Checkbox: Story = {
  render: () => ({ template: '<nds-checkbox-docs />' }),
  play,
};

export const Switch: Story = {
  render: () => ({ template: '<nds-switch-docs />' }),
  play,
};

export const Toggle: Story = {
  render: () => ({ template: '<nds-toggle-docs />' }),
  play,
};

export const RadioGroup: Story = {
  render: () => ({ template: '<nds-radio-group-docs />' }),
  play,
};

export const Slider: Story = {
  render: () => ({ template: '<nds-slider-docs />' }),
  play,
};

export const Progress: Story = {
  render: () => ({ template: '<nds-progress-docs />' }),
  play,
};

export const Avatar: Story = {
  render: () => ({ template: '<nds-avatar-docs />' }),
  play,
};

export const CodeBlock: Story = {
  render: () => ({ template: '<nds-code-block-docs />' }),
  play,
};

export const Alert: Story = {
  render: () => ({ template: '<nds-alert-docs />' }),
  play,
};

export const Breadcrumb: Story = {
  render: () => ({ template: '<nds-breadcrumb-docs />' }),
  play,
};

export const Accordion: Story = {
  render: () => ({ template: '<nds-accordion-docs />' }),
  play,
};

export const Collapsible: Story = {
  render: () => ({ template: '<nds-collapsible-docs />' }),
  play,
};

export const Tabs: Story = {
  render: () => ({ template: '<nds-tabs-docs />' }),
  play,
};

export const ToggleGroup: Story = {
  render: () => ({ template: '<nds-toggle-group-docs />' }),
  play,
};

export const Sidebar: Story = {
  render: () => ({ template: '<nds-sidebar-docs />' }),
  play,
};

export const Table: Story = {
  render: () => ({ template: '<nds-table-docs />' }),
  play,
};

export const ScrollArea: Story = {
  render: () => ({ template: '<nds-scroll-area-docs />' }),
  play,
};

export const Pagination: Story = {
  render: () => ({ template: '<nds-pagination-docs />' }),
  play,
};

export const Tooltip: Story = {
  render: () => ({ template: '<nds-tooltip-docs />' }),
  play,
};

export const Sheet: Story = {
  render: () => ({ template: '<nds-sheet-docs />' }),
  play,
};

export const Dialog: Story = {
  render: () => ({ template: '<nds-dialog-docs />' }),
  play,
};

export const Popover: Story = {
  render: () => ({ template: '<nds-popover-docs />' }),
  play,
};

export const HoverCard: Story = {
  render: () => ({ template: '<nds-hover-card-docs />' }),
  play,
};

export const DropdownMenu: Story = {
  render: () => ({ template: '<nds-dropdown-menu-docs />' }),
  play,
};

export const AlertDialog: Story = {
  render: () => ({ template: '<nds-alert-dialog-docs />' }),
  play,
};

export const ContextMenu: Story = {
  render: () => ({ template: '<nds-context-menu-docs />' }),
  play,
};

export const Menubar: Story = {
  render: () => ({ template: '<nds-menubar-docs />' }),
  play,
};

export const Select: Story = {
  render: () => ({ template: '<nds-select-docs />' }),
  play,
};

export const Drawer: Story = {
  render: () => ({ template: '<nds-drawer-docs />' }),
  play,
};

export const NavigationMenu: Story = {
  render: () => ({ template: '<nds-navigation-menu-docs />' }),
  play,
};

export const Command: Story = {
  render: () => ({ template: '<nds-command-docs />' }),
  play,
};
