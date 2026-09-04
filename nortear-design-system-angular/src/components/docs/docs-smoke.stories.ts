// Suíte de fumaça das docs pages (contrato docs-smoke).
// Um export por página de src/components/docs/*Docs.ts.
// Política: crash no mount → export fica FORA (listado no comentário); axe
// falhando → parameters.a11y.test:'todo' com as rules no comentário; página
// limpa → axe é portão.
//
// 98 exports: uma por *Docs.ts do diretório, sem exceção. Eram 67 até
// 2026-09-01, quando entraram as 31 que existiam fora da fumaça (família
// conversacional da guideline 17 e input-group) — essas ainda não rodaram.

import type { Meta, StoryObj } from '@storybook/angular-vite';
import { moduleMetadata } from '@storybook/angular-vite';
import { expect, waitFor } from 'storybook/test';
import { docsAuditarPage, describeProblemas } from '@shared/testing/docs-page-contract';
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
import { NdsComboboxDocs } from './ComboboxDocs';
import { NdsSelectDocs } from './SelectDocs';
import { NdsDrawerDocs } from './DrawerDocs';
import { NdsNavigationMenuDocs } from './NavigationMenuDocs';
import { NdsCommandDocs } from './CommandDocs';
import { NdsFormDocs } from './FormDocs';
import { NdsCalendarDocs } from './CalendarDocs';
import { NdsCarouselDocs } from './CarouselDocs';
import { NdsChartDocs } from './ChartDocs';
import { NdsDataTableDocs } from './DataTableDocs';
import { NdsInputOTPDocs } from './InputOTPDocs';
import { NdsTextareaDocs } from './TextareaDocs';
import { NdsResizableDocs } from './ResizableDocs';
import { NdsSonnerDocs } from './SonnerDocs';
import { NdsEditorDocs } from './EditorDocs';
import { NdsMediaPlayerDocs } from './MediaPlayerDocs';

// ─── Foundations ──────────────────────────────────────────────────────────────
import { NdsAboutDocs } from './AboutDocs';
import { NdsAccessibilityDocs } from './AccessibilityDocs';
import { NdsAnalyticsCatalogDocs } from './AnalyticsCatalogDocs';
import { NdsSeoGeoDocs } from './SeoGeoDocs';
import { NdsToneOfVoiceDocs } from './ToneOfVoiceDocs';
import { NdsGettingStartedDocs } from './GettingStartedDocs';
import { NdsTypographyDocs } from './TypographyDocs';
import { NdsSpacingDocs } from './SpacingDocs';
import { NdsElevationDocs } from './ElevationDocs';
import { NdsMotionDocs } from './MotionDocs';
import { NdsIconsDocs } from './IconsDocs';
import { NdsThemeColorsDocs } from './ThemeColorsDocs';
import { NdsThemeSystemDocs } from './ThemeSystemDocs';
import { NdsDensitiesDocs } from './DensitiesDocs';
import { NdsI18nDocs } from './I18nDocs';
import { NdsCrossStackDocs } from './CrossStackDocs';

import { NdsActivityGraphDocs } from './ActivityGraphDocs';
import { NdsAgentPlanDocs } from './AgentPlanDocs';
import { NdsAgentStatusDocs } from './AgentStatusDocs';
import { NdsApprovalCardDocs } from './ApprovalCardDocs';
import { NdsChatThreadDocs } from './ChatThreadDocs';
import { NdsComposerAttachmentsDocs } from './ComposerAttachmentsDocs';
import { NdsComposerContextDocs } from './ComposerContextDocs';
import { NdsComposerDocs } from './ComposerDocs';
import { NdsComposerModelPickerDocs } from './ComposerModelPickerDocs';
import { NdsComposerQuoteDocs } from './ComposerQuoteDocs';
import { NdsComposerTriggerPopoverDocs } from './ComposerTriggerPopoverDocs';
import { NdsComposerVoiceDocs } from './ComposerVoiceDocs';
import { NdsComputerUseDocs } from './ComputerUseDocs';
import { NdsConnectionStateDocs } from './ConnectionStateDocs';
import { NdsContextBreakdownDocs } from './ContextBreakdownDocs';
import { NdsContextDisplayDocs } from './ContextDisplayDocs';
import { NdsCostMeterDocs } from './CostMeterDocs';
import { NdsDraftRestoreDocs } from './DraftRestoreDocs';
import { NdsFlowGraphDocs } from './FlowGraphDocs';
import { NdsInlineCitationDocs } from './InlineCitationDocs';
import { NdsInputGroupDocs } from './InputGroupDocs';
import { NdsJobProgressDocs } from './JobProgressDocs';
import { NdsMarkdownDocs } from './MarkdownDocs';
import { NdsMessageQueueDocs } from './MessageQueueDocs';
import { NdsMessageTimingDocs } from './MessageTimingDocs';
import { NdsQuotaBannerDocs } from './QuotaBannerDocs';
import { NdsStepperDocs } from './StepperDocs';
import { NdsTerminalBlockDocs } from './TerminalBlockDocs';
import { NdsThinkingIndicatorDocs } from './ThinkingIndicatorDocs';
import { NdsToolGroupDocs } from './ToolGroupDocs';
import { NdsTraceWaterfallDocs } from './TraceWaterfallDocs';

const meta: Meta = {
  title: 'QA/Docs Smoke',
  tags: ['!dev'],
  decorators: [moduleMetadata({ imports: [NdsButtonDocs, NdsSeparatorDocs, NdsLabelDocs, NdsCardDocs, NdsBadgeDocs, NdsSkeletonDocs, NdsAspectRatioDocs, NdsInputDocs, NdsCheckboxDocs, NdsSwitchDocs, NdsToggleDocs, NdsRadioGroupDocs, NdsSliderDocs, NdsProgressDocs, NdsAvatarDocs, NdsCodeBlockDocs, NdsAlertDocs, NdsBreadcrumbDocs, NdsAccordionDocs, NdsCollapsibleDocs, NdsTabsDocs, NdsToggleGroupDocs, NdsSidebarDocs, NdsTableDocs, NdsScrollAreaDocs, NdsPaginationDocs, NdsTooltipDocs, NdsSheetDocs, NdsDialogDocs, NdsPopoverDocs, NdsHoverCardDocs, NdsDropdownMenuDocs, NdsAlertDialogDocs, NdsContextMenuDocs, NdsMenubarDocs, NdsComboboxDocs, NdsSelectDocs, NdsDrawerDocs, NdsNavigationMenuDocs, NdsCommandDocs, NdsFormDocs, NdsCalendarDocs, NdsCarouselDocs, NdsChartDocs, NdsDataTableDocs, NdsInputOTPDocs, NdsTextareaDocs, NdsResizableDocs, NdsSonnerDocs, NdsEditorDocs, NdsMediaPlayerDocs, NdsAboutDocs, NdsAccessibilityDocs, NdsAnalyticsCatalogDocs, NdsSeoGeoDocs, NdsToneOfVoiceDocs, NdsGettingStartedDocs, NdsTypographyDocs, NdsSpacingDocs, NdsElevationDocs, NdsMotionDocs, NdsIconsDocs, NdsThemeColorsDocs, NdsThemeSystemDocs, NdsDensitiesDocs, NdsI18nDocs, NdsCrossStackDocs, NdsActivityGraphDocs, NdsAgentPlanDocs, NdsAgentStatusDocs, NdsApprovalCardDocs, NdsChatThreadDocs, NdsComposerAttachmentsDocs, NdsComposerContextDocs, NdsComposerDocs, NdsComposerModelPickerDocs, NdsComposerQuoteDocs, NdsComposerTriggerPopoverDocs, NdsComposerVoiceDocs, NdsComputerUseDocs, NdsConnectionStateDocs, NdsContextBreakdownDocs, NdsContextDisplayDocs, NdsCostMeterDocs, NdsDraftRestoreDocs, NdsFlowGraphDocs, NdsInlineCitationDocs, NdsInputGroupDocs, NdsJobProgressDocs, NdsMarkdownDocs, NdsMessageQueueDocs, NdsMessageTimingDocs, NdsQuotaBannerDocs, NdsStepperDocs, NdsTerminalBlockDocs, NdsThinkingIndicatorDocs, NdsToolGroupDocs, NdsTraceWaterfallDocs] })],
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
  const problemas = docsAuditarPage(canvasElement, {
    ignorar: (parameters as { contratoDocs?: { ignorar?: Record<string, string> } }).contratoDocs
      ?.ignorar,
  });
  await expect(
    problemas,
    problemas.length ? `\n${describeProblemas(problemas)}\n` : '',
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

export const Textarea: Story = {
  render: () => ({ template: '<nds-textarea-docs />' }),
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
  // Além da fumaça compartilhada: o JSON-LD de BreadcrumbList é ESCRITO no
  // documento hospedeiro (o pai, quando a página roda em iframe), então ler a
  // fonte do applySeo não prova que saiu — esta stack passou sem a entrada
  // `breadcrumb` e nenhum portão viu. Só leitura pura dentro do waitFor.
  play: async (ctx) => {
    await play!(ctx);
    const alvo = window.self !== window.top ? window.parent.document : document;
    await waitFor(() => {
      const el = alvo.head.querySelector('script[data-ds-breadcrumb-jsonld]');
      expect(el, 'BreadcrumbList JSON-LD ausente no documento hospedeiro').not.toBeNull();
      const ld = JSON.parse(el!.textContent ?? '{}') as {
        '@type'?: string;
        itemListElement?: { name?: string }[];
      };
      expect(ld['@type']).toBe('BreadcrumbList');
      expect((ld.itemListElement ?? []).map((i) => i.name)).toEqual([
        'Components',
        'Overlay',
        'Tooltip',
      ]);
    });
  },
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

export const Combobox: Story = {
  render: () => ({ template: '<nds-combobox-docs />' }),
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

// ─── Bloco 5 — ecossistema ────────────────────────────────────────────────────
// Com estes oito o stack fecha os 47 componentes.

export const Form: Story = {
  render: () => ({ template: '<nds-form-docs />' }),
  play,
};

export const Calendar: Story = {
  render: () => ({ template: '<nds-calendar-docs />' }),
  play,
};

export const Carousel: Story = {
  render: () => ({ template: '<nds-carousel-docs />' }),
  play,
};

export const Chart: Story = {
  render: () => ({ template: '<nds-chart-docs />' }),
  play,
};

export const DataTable: Story = {
  render: () => ({ template: '<nds-data-table-docs />' }),
  play,
};

export const InputOTP: Story = {
  render: () => ({ template: '<nds-input-otp-docs />' }),
  play,
};

export const Resizable: Story = {
  render: () => ({ template: '<nds-resizable-docs />' }),
  play,
};

export const Sonner: Story = {
  render: () => ({ template: '<nds-sonner-docs />' }),
  play,
};

// ─── Foundations ──────────────────────────────────────────────────────────────
// As 16 páginas de fundamento passam pelo MESMO contrato das docs pages de
// componente: montar sem crashar, nenhuma chave de i18n vazada como texto,
// nenhum bloco de código vazio, e axe como portão. Duas delas — Icons e
// ThemeColors — são galerias com layout próprio, e mesmo assim entram aqui:
// é o único lugar que prova que elas montam.

export const About: Story = {
  render: () => ({ template: '<nds-about-docs />' }),
  play,
};

export const Accessibility: Story = {
  render: () => ({ template: '<nds-accessibility-docs />' }),
  play,
};

export const AnalyticsCatalog: Story = {
  render: () => ({ template: '<nds-analytics-catalog-docs />' }),
  play,
};

export const SeoGeo: Story = {
  render: () => ({ template: '<nds-seo-geo-docs />' }),
  play,
};

export const ToneOfVoice: Story = {
  render: () => ({ template: '<nds-tone-of-voice-docs />' }),
  play,
};

export const GettingStarted: Story = {
  render: () => ({ template: '<nds-getting-started-docs />' }),
  play,
};

export const Typography: Story = {
  render: () => ({ template: '<nds-typography-docs />' }),
  play,
};

export const Spacing: Story = {
  render: () => ({ template: '<nds-spacing-docs />' }),
  play,
};

export const Elevation: Story = {
  render: () => ({ template: '<nds-elevation-docs />' }),
  play,
};

export const Motion: Story = {
  render: () => ({ template: '<nds-motion-docs />' }),
  play,
};

export const Icons: Story = {
  render: () => ({ template: '<nds-icons-docs />' }),
  play,
};

export const ThemeColors: Story = {
  render: () => ({ template: '<nds-theme-colors-docs />' }),
  play,
};

export const ThemeSystem: Story = {
  render: () => ({ template: '<nds-theme-system-docs />' }),
  play,
};

export const Densities: Story = {
  render: () => ({ template: '<nds-densities-docs />' }),
  play,
};

export const I18n: Story = {
  render: () => ({ template: '<nds-i18n-docs />' }),
  play,
};

export const CrossStack: Story = {
  render: () => ({ template: '<nds-cross-stack-docs />' }),
  play,
};

export const Editor: Story = {
  render: () => ({ template: '<nds-editor-docs />' }),
  play,
};

export const MediaPlayer: Story = {
  render: () => ({ template: '<nds-media-player-docs />' }),
  play,
};

// ── Registradas em 2026-09-01 — 31 páginas que existiam FORA da fumaça ──
// A família conversacional da guideline 17, o input-group tinham docs page
// publicada e nenhuma verificação: nem de mount, nem de axe. Esta suíte é a
// única que monta a página inteira e a submete ao axe — fora dela, a página
// não tem portão nenhum.
// ATENÇÃO: estas ainda NÃO FORAM EXECUTADAS. O registro está pronto; a
// primeira rodada é que vai dizer quais montam limpas.

export const ActivityGraph: Story = {
  render: () => ({ template: '<nds-activity-graph-docs />' }),
  play,
};

export const AgentPlan: Story = {
  render: () => ({ template: '<nds-agent-plan-docs />' }),
  play,
};

export const AgentStatus: Story = {
  render: () => ({ template: '<nds-agent-status-docs />' }),
  play,
};

export const ApprovalCard: Story = {
  render: () => ({ template: '<nds-approval-card-docs />' }),
  play,
};

export const ChatThread: Story = {
  render: () => ({ template: '<nds-chat-thread-docs />' }),
  play,
};

export const ComposerAttachments: Story = {
  render: () => ({ template: '<nds-composer-attachments-docs />' }),
  play,
};

export const ComposerContext: Story = {
  render: () => ({ template: '<nds-composer-context-docs />' }),
  play,
};

export const Composer: Story = {
  render: () => ({ template: '<nds-composer-docs />' }),
  play,
};

export const ComposerModelPicker: Story = {
  render: () => ({ template: '<nds-composer-model-picker-docs />' }),
  play,
};

export const ComposerQuote: Story = {
  render: () => ({ template: '<nds-composer-quote-docs />' }),
  play,
};

export const ComposerTriggerPopover: Story = {
  render: () => ({ template: '<nds-composer-trigger-popover-docs />' }),
  play,
};

export const ComposerVoice: Story = {
  render: () => ({ template: '<nds-composer-voice-docs />' }),
  play,
};

export const ComputerUse: Story = {
  render: () => ({ template: '<nds-computer-use-docs />' }),
  play,
};

export const ConnectionState: Story = {
  render: () => ({ template: '<nds-connection-state-docs />' }),
  play,
};

export const ContextBreakdown: Story = {
  render: () => ({ template: '<nds-context-breakdown-docs />' }),
  play,
};

export const ContextDisplay: Story = {
  render: () => ({ template: '<nds-context-display-docs />' }),
  play,
};

export const CostMeter: Story = {
  render: () => ({ template: '<nds-cost-meter-docs />' }),
  play,
};

export const DraftRestore: Story = {
  render: () => ({ template: '<nds-draft-restore-docs />' }),
  play,
};

export const FlowGraph: Story = {
  render: () => ({ template: '<nds-flow-graph-docs />' }),
  play,
};

export const InlineCitation: Story = {
  render: () => ({ template: '<nds-inline-citation-docs />' }),
  play,
};

export const InputGroup: Story = {
  render: () => ({ template: '<nds-input-group-docs />' }),
  play,
};

export const JobProgress: Story = {
  render: () => ({ template: '<nds-job-progress-docs />' }),
  play,
};

export const Markdown: Story = {
  render: () => ({ template: '<nds-markdown-docs />' }),
  play,
};

export const MessageQueue: Story = {
  render: () => ({ template: '<nds-message-queue-docs />' }),
  play,
};

export const MessageTiming: Story = {
  render: () => ({ template: '<nds-message-timing-docs />' }),
  play,
};

export const QuotaBanner: Story = {
  render: () => ({ template: '<nds-quota-banner-docs />' }),
  play,
};

export const Stepper: Story = {
  render: () => ({ template: '<nds-stepper-docs />' }),
  play,
};

export const TerminalBlock: Story = {
  render: () => ({ template: '<nds-terminal-block-docs />' }),
  play,
};

export const ThinkingIndicator: Story = {
  render: () => ({ template: '<nds-thinking-indicator-docs />' }),
  play,
};

export const ToolGroup: Story = {
  render: () => ({ template: '<nds-tool-group-docs />' }),
  play,
};

export const TraceWaterfall: Story = {
  render: () => ({ template: '<nds-trace-waterfall-docs />' }),
  play,
};
