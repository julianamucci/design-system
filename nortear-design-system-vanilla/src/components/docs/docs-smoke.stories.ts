// GERADO POR SCRIPT — suíte de fumaça das docs pages (contrato docs-smoke).
// Um export por página de src/components/docs/*Docs.ts (componentes e foundations).
// Política: crash no mount → export fica FORA (listado abaixo); axe falhando →
// parameters.a11y.test:'todo' com as rules no comentário; página limpa → axe é portão.
//
// Nenhuma página fora da fumaça: 98 registradas, uma por *Docs.ts do diretório.
// As 67 originais montam; as 31 registradas em 2026-09-01 ainda não rodaram.

import type { Meta, StoryObj } from '@storybook/html-vite';
import { expect, waitFor } from 'storybook/test';
import { docsAuditarPage, describeProblemas } from '@shared/testing/docs-page-contract';
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
import { createComboboxDocs } from './ComboboxDocs';
import { createCommandDocs } from './CommandDocs';
import { createContextMenuDocs } from './ContextMenuDocs';
import { createCrossStackDocs } from './CrossStackDocs';
import { createDataTableDocs } from './DataTableDocs';
import { createDensitiesDocs } from './DensitiesDocs';
import { createDialogDocs } from './DialogDocs';
import { createDrawerDocs } from './DrawerDocs';
import { createDropdownMenuDocs } from './DropdownMenuDocs';
import { createEditorDocs } from './EditorDocs';
import { createElevationDocs } from './ElevationDocs';
import { createFormDocs } from './FormDocs';
import { createGettingStartedDocs } from './GettingStartedDocs';
import { createHoverCardDocs } from './HoverCardDocs';
import { createI18nDocs } from './I18nDocs';
import { createIconsDocs } from './IconsDocs';
import { createInputDocs } from './InputDocs';
import { createInputOTPDocs } from './InputOTPDocs';
import { createLabelDocs } from './LabelDocs';
import { createMediaPlayerDocs } from './MediaPlayerDocs';
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

import { createActivityGraphDocs } from './ActivityGraphDocs';
import { createAgentPlanDocs } from './AgentPlanDocs';
import { createAgentStatusDocs } from './AgentStatusDocs';
import { createApprovalCardDocs } from './ApprovalCardDocs';
import { createChatThreadDocs } from './ChatThreadDocs';
import { createComposerAttachmentsDocs } from './ComposerAttachmentsDocs';
import { createComposerContextDocs } from './ComposerContextDocs';
import { createComposerDocs } from './ComposerDocs';
import { createComposerModelPickerDocs } from './ComposerModelPickerDocs';
import { createComposerQuoteDocs } from './ComposerQuoteDocs';
import { createComposerTriggerPopoverDocs } from './ComposerTriggerPopoverDocs';
import { createComposerVoiceDocs } from './ComposerVoiceDocs';
import { createComputerUseDocs } from './ComputerUseDocs';
import { createConnectionStateDocs } from './ConnectionStateDocs';
import { createContextBreakdownDocs } from './ContextBreakdownDocs';
import { createContextDisplayDocs } from './ContextDisplayDocs';
import { createCostMeterDocs } from './CostMeterDocs';
import { createDraftRestoreDocs } from './DraftRestoreDocs';
import { createFlowGraphDocs } from './FlowGraphDocs';
import { createInlineCitationDocs } from './InlineCitationDocs';
import { createInputGroupDocs } from './InputGroupDocs';
import { createJobProgressDocs } from './JobProgressDocs';
import { createMarkdownDocs } from './MarkdownDocs';
import { createMessageQueueDocs } from './MessageQueueDocs';
import { createMessageTimingDocs } from './MessageTimingDocs';
import { createQuotaBannerDocs } from './QuotaBannerDocs';
import { createStepperDocs } from './StepperDocs';
import { createTerminalBlockDocs } from './TerminalBlockDocs';
import { createThinkingIndicatorDocs } from './ThinkingIndicatorDocs';
import { createToolGroupDocs } from './ToolGroupDocs';
import { createTraceWaterfallDocs } from './TraceWaterfallDocs';

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
const play: Story['play'] = async ({ canvasElement, parameters }) => {
  await expect(
    canvasElement.querySelector('section[id], section.nds-docs-section-divider'),
  ).not.toBeNull();


  // Contrato de conteúdo, compartilhado pelas quatro stacks. Montar sem crashar
  // e passar no axe não alcança o que se vê na tela: preview encostado à
  // esquerda, bloco de código vazio, chave de tradução renderizada como texto.
  // Foi assim que a revisão do Calendar gastou dezesseis commits achando um
  // defeito por rodada, a olho, com a suíte verde.
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
  // useSeoEffect voltar a escrever o lang só no documento pai, a prosa em
  // português volta a ser anunciada em inglês e ninguém percebe. WCAG 3.1.1.
  // 'pt-BR' e não a lista de locales: 'en' é justamente o valor que o template
  // do Storybook deixa no iframe, e uma asserção que o aceita passa com o bug.
  await waitFor(() => expect(document.documentElement.lang).toBe('pt-BR'));
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
// color-contrast RESOLVIDA (2026-08-01): o calendário do don't recebia
// `style.opacity = 0.8` na docs page, o que derrubava os <th> de dia da semana
// (--muted-foreground) para 3.69:1. Nenhum token compartilhado mudou. Axe é portão.
export const Calendar: Story = {
  render: () => createCalendarDocs(),
  play,
};
export const Card: Story = { render: () => createCardDocs(), play };
export const Carousel: Story = {
  render: () => createCarouselDocs(),
  play,
  parameters: {
    contratoDocs: {
      ignorar: {
        chave_i18n_visivel:
          'a seção renderiza o caminho da chave: falta a entrada no translations.json. FIXES-NEEDED.',
      },
    },
  },
};
// aria-prohibited-attr RESOLVIDA (2026-08-01): containers de chart rotulados
// ganharam role="img" — aria-label deixou de cair em <div> genérico. Axe é portão.
export const Chart: Story = {
  render: () => createChartDocs(),
  play,
  parameters: {
    contratoDocs: {
      ignorar: {
        chave_i18n_visivel:
          'a seção renderiza o caminho da chave: falta a entrada no translations.json. FIXES-NEEDED.',
      },
    },
  },
};
// aria-toggle-field-name RESOLVIDA (2026-08-01): o checkbox do Nortear é um
// <div role="checkbox"> — <label htmlFor> não nomeia elemento não-rotulável.
// Todos os call sites da docs page passam aria-label (mesmo texto do label
// visível) via option do factory. Axe é portão.
export const Checkbox: Story = {
  render: () => createCheckboxDocs(),
  play,
};
export const CodeBlock: Story = { render: () => createCodeBlockDocs(), play,
  parameters: {
    contratoDocs: {
      ignorar: {
      chave_i18n_visivel:
        'a seção renderiza o caminho da chave: falta a entrada no translations.json. FIXES-NEEDED.',
      },
    },
  },
};
export const Collapsible: Story = { render: () => createCollapsibleDocs(), play };
export const Combobox: Story = { render: () => createComboboxDocs(), play };
export const Command: Story = { render: () => createCommandDocs(), play };
// axe: aria-required-parent (lote de estrutura de menus) — catalogado no
// FIXES-NEEDED. color-contrast RESOLVIDA (2026-08-01): os dois nós vinham de
// `style.opacity` (0.6 / 0.3) aplicado sobre texto --muted-foreground nos
// previews de don't; o dim foi removido.
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
export const Editor: Story = { render: () => createEditorDocs(), play };
export const Elevation: Story = { render: () => createElevationDocs(), play };
export const Form: Story = { render: () => createFormDocs(), play };
export const GettingStarted: Story = { render: () => createGettingStartedDocs(), play };
export const HoverCard: Story = { render: () => createHoverCardDocs(), play };
export const I18n: Story = { render: () => createI18nDocs(), play };
// color-contrast RESOLVIDA (2026-08-01): a contagem de ícones do header somava
// `style.opacity = 0.7` a --muted-foreground (3.03:1). Axe é portão.
export const Icons: Story = {
  render: () => createIconsDocs(),
  play,
};
// label RESOLVIDA (2026-08-01): os <label> das demos não tinham htmlFor e os
// inputs não tinham id; os previews de tipo (sem label visível) ganharam
// aria-label. Axe é portão.
export const Input: Story = {
  render: () => createInputDocs(),
  play,
};
export const InputOTP: Story = { render: () => createInputOTPDocs(), play };
export const Label: Story = { render: () => createLabelDocs(), play };
// axe: aria-required-parent — catalogado no FIXES-NEEDED
export const MediaPlayer: Story = { render: () => createMediaPlayerDocs(), play };
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
// listitem + color-contrast RESOLVIDAS (2026-08-01): createSidebarMenuItem()
// devolve <li> e os previews o penduravam direto num <div> — agora vão dentro de
// <ul data-sidebar="menu">; e o card de don't tinha `style.opacity = 0.6` sobre
// texto destructive (3.1:1). Axe é portão.
export const Sidebar: Story = {
  render: () => createSidebarDocs(),
  play,
};
export const Skeleton: Story = { render: () => createSkeletonDocs(), play };
// label RESOLVIDA (2026-08-01): a prosa (variante vertical + divergências)
// trazia `<input type="range">` literal, que virava campo real sem nome ao ser
// renderizada como HTML — escapada com &lt;/&gt;; e o slider do don't "sem valor
// visível" ganhou aria-label no input interno. Axe é portão.
export const Slider: Story = {
  render: () => createSliderDocs(),
  play,
};
export const Sonner: Story = { render: () => createSonnerDocs(), play,
  parameters: {
    contratoDocs: {
      ignorar: {
      chave_i18n_visivel:
        'a seção renderiza o caminho da chave: falta a entrada no translations.json. FIXES-NEEDED.',
      },
    },
  },
};
export const Spacing: Story = { render: () => createSpacingDocs(), play };
// button-name RESOLVIDA (2026-08-01): o Switch do don't "texto solto" ganhou
// aria-label via option do factory (string traduzida existente). Axe é portão.
export const Switch: Story = {
  render: () => createSwitchDocs(),
  play,
};
export const Table: Story = { render: () => createTableDocs(), play };
export const Tabs: Story = { render: () => createTabsDocs(), play };
// label RESOLVIDA (2026-08-01): a prosa das divergências trazia `<textarea>`
// literal e virava campo real (sem nome) ao ser renderizada como HTML — mesmo
// padrão já visto no Select; escapada com &lt;/&gt;. Axe é portão.
export const Textarea: Story = {
  render: () => createTextareaDocs(),
  play,
};
export const ThemeColors: Story = { render: () => createThemeColorsDocs(), play };
export const ThemeSystem: Story = { render: () => createThemeSystemDocs(), play };
export const Toggle: Story = { render: () => createToggleDocs(), play };
// button-name RESOLVIDA (2026-08-01): items icon-only do don't ganharam
// aria-label (applyItemAriaLabels) — o anti-pattern segue no grupo sem
// aria-label. Axe é portão.
export const ToggleGroup: Story = {
  render: () => createToggleGroupDocs(),
  play,
};
export const ToneOfVoice: Story = { render: () => createToneOfVoiceDocs(), play };
export const Tooltip: Story = { render: () => createTooltipDocs(), play };
export const Typography: Story = { render: () => createTypographyDocs(), play };

// ── Registradas em 2026-09-01 — 31 páginas que existiam FORA da fumaça ──
// A família conversacional da guideline 17, o input-group tinham docs page
// publicada e nenhuma verificação: nem de mount, nem de axe. Esta suíte é a
// única que monta a página inteira e a submete ao axe — fora dela, a página
// não tem portão nenhum.
// ATENÇÃO: estas ainda NÃO FORAM EXECUTADAS. O registro está pronto; a
// primeira rodada é que vai dizer quais montam limpas.

export const ActivityGraph: Story = { render: () => createActivityGraphDocs(), play };

export const AgentPlan: Story = { render: () => createAgentPlanDocs(), play };

export const AgentStatus: Story = { render: () => createAgentStatusDocs(), play };

export const ApprovalCard: Story = { render: () => createApprovalCardDocs(), play };

export const ChatThread: Story = { render: () => createChatThreadDocs(), play };

export const ComposerAttachments: Story = { render: () => createComposerAttachmentsDocs(), play };

export const ComposerContext: Story = { render: () => createComposerContextDocs(), play };

export const Composer: Story = { render: () => createComposerDocs(), play };

export const ComposerModelPicker: Story = { render: () => createComposerModelPickerDocs(), play };

export const ComposerQuote: Story = { render: () => createComposerQuoteDocs(), play };

export const ComposerTriggerPopover: Story = { render: () => createComposerTriggerPopoverDocs(), play };

export const ComposerVoice: Story = { render: () => createComposerVoiceDocs(), play };

export const ComputerUse: Story = { render: () => createComputerUseDocs(), play };

export const ConnectionState: Story = { render: () => createConnectionStateDocs(), play };

export const ContextBreakdown: Story = { render: () => createContextBreakdownDocs(), play };

export const ContextDisplay: Story = { render: () => createContextDisplayDocs(), play };

export const CostMeter: Story = { render: () => createCostMeterDocs(), play };

export const DraftRestore: Story = { render: () => createDraftRestoreDocs(), play };

export const FlowGraph: Story = { render: () => createFlowGraphDocs(), play };

export const InlineCitation: Story = { render: () => createInlineCitationDocs(), play };

export const InputGroup: Story = { render: () => createInputGroupDocs(), play };

export const JobProgress: Story = { render: () => createJobProgressDocs(), play };

export const Markdown: Story = { render: () => createMarkdownDocs(), play };

export const MessageQueue: Story = { render: () => createMessageQueueDocs(), play };

export const MessageTiming: Story = { render: () => createMessageTimingDocs(), play };

export const QuotaBanner: Story = { render: () => createQuotaBannerDocs(), play };

export const Stepper: Story = { render: () => createStepperDocs(), play };

export const TerminalBlock: Story = { render: () => createTerminalBlockDocs(), play };

export const ThinkingIndicator: Story = { render: () => createThinkingIndicatorDocs(), play };

export const ToolGroup: Story = { render: () => createToolGroupDocs(), play };

export const TraceWaterfall: Story = { render: () => createTraceWaterfallDocs(), play };
