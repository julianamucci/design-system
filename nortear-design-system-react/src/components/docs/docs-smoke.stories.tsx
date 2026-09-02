// Suíte de fumaça das docs pages — gerada por script (contrato docs-smoke).
// Um export por página de src/components/docs/*Docs.tsx. A play prova que a
// página montou (crash = teste vermelho); o axe do addon-a11y roda em seguida.
// Política: página que falha no axe recebe parameters.a11y.test='todo' com as
// rules em comentário; página que crasha fica FORA do arquivo, listada aqui.
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor } from 'storybook/test';
import { docsAuditarPage, describeProblemas } from '@shared/testing/docs-page-contract';

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
import { ComboboxDocs } from './ComboboxDocs';
import { CommandDocs } from './CommandDocs';
import { ContextMenuDocs } from './ContextMenuDocs';
import { CrossStackDocs } from './CrossStackDocs';
import { DataTableDocs } from './DataTableDocs';
import { DensitiesDocs } from './DensitiesDocs';
import { DialogDocs } from './DialogDocs';
import { DrawerDocs } from './DrawerDocs';
import { DropdownMenuDocs } from './DropdownMenuDocs';
import { EditorDocs } from './EditorDocs';
import { ElevationDocs } from './ElevationDocs';
import { GettingStartedDocs } from './GettingStartedDocs';
import { HoverCardDocs } from './HoverCardDocs';
import { I18nDocs } from './I18nDocs';
import { IconsDocs } from './IconsDocs';
import { InputDocs } from './InputDocs';
import { InputOTPDocs } from './InputOTPDocs';
import { LabelDocs } from './LabelDocs';
import { MediaPlayerDocs } from './MediaPlayerDocs';
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

import { ActivityGraphDocs } from './ActivityGraphDocs';
import { AgentPlanDocs } from './AgentPlanDocs';
import { AgentStatusDocs } from './AgentStatusDocs';
import { ApprovalCardDocs } from './ApprovalCardDocs';
import { ChatThreadDocs } from './ChatThreadDocs';
import { ComposerAttachmentsDocs } from './ComposerAttachmentsDocs';
import { ComposerContextDocs } from './ComposerContextDocs';
import { ComposerDocs } from './ComposerDocs';
import { ComposerModelPickerDocs } from './ComposerModelPickerDocs';
import { ComposerQuoteDocs } from './ComposerQuoteDocs';
import { ComposerTriggerPopoverDocs } from './ComposerTriggerPopoverDocs';
import { ComposerVoiceDocs } from './ComposerVoiceDocs';
import { ComputerUseDocs } from './ComputerUseDocs';
import { ConnectionStateDocs } from './ConnectionStateDocs';
import { ContextBreakdownDocs } from './ContextBreakdownDocs';
import { ContextDisplayDocs } from './ContextDisplayDocs';
import { CostMeterDocs } from './CostMeterDocs';
import { DraftRestoreDocs } from './DraftRestoreDocs';
import { FlowGraphDocs } from './FlowGraphDocs';
import { FormDocs } from './FormDocs';
import { InlineCitationDocs } from './InlineCitationDocs';
import { InputGroupDocs } from './InputGroupDocs';
import { JobProgressDocs } from './JobProgressDocs';
import { MarkdownDocs } from './MarkdownDocs';
import { MessageQueueDocs } from './MessageQueueDocs';
import { MessageTimingDocs } from './MessageTimingDocs';
import { QuotaBannerDocs } from './QuotaBannerDocs';
import { StepperDocs } from './StepperDocs';
import { TerminalBlockDocs } from './TerminalBlockDocs';
import { ThinkingIndicatorDocs } from './ThinkingIndicatorDocs';
import { ToolGroupDocs } from './ToolGroupDocs';
import { TraceWaterfallDocs } from './TraceWaterfallDocs';

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
const mounted: Story['play'] = async ({ canvasElement, parameters }) => {
  await expect(canvasElement.querySelector('section')).not.toBeNull();

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

// Página que anima a entrada (opacity 0 → 1 via style inline, rAF) precisa
// assentar ANTES do axe, que roda no postVisit — logo depois da play. Sem isto
// ele mede no quadro em que o texto ainda está invisível e reprova por
// color-contrast: o "1.01 (#fdfdfd sobre #ffffff)" não é contraste ruim, é
// corrida com a animação. A play só termina quando nada está a meio caminho.
const settled: Story['play'] = async (ctx) => {
  const { canvasElement } = ctx;
  await mounted!(ctx);
  await waitFor(
    () => {
      const midFlight = Array.from(
        canvasElement.querySelectorAll<HTMLElement>('[style*="opacity"]'),
      ).filter((el) => Number(el.style.opacity || '1') < 1);
      expect(midFlight).toHaveLength(0);
    },
    { timeout: 5000 },
  );
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

export const AlertDialog: Story = {
  render: () => <AlertDialogDocs />,
  play: mounted,
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

// aria-prohibited-attr RESOLVIDA (2026-08-01): fallback com ícone ganhou
// role="img" e o dot de status role="status" — aria-label deixou de cair em
// <span> genérico. Axe é portão.
export const Avatar: Story = {
  render: () => <AvatarDocs />,
  play: mounted,
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

// scope-attr-valid RESOLVIDA (2026-08-01): o override de WeekNumber em
// calendar.tsx renderiza <td> mas repassava o scope="row" que o
// react-day-picker manda para o <th> dele — scope só vale em <th>, e o
// role="rowheader" que vem junto já cobre a semântica. Axe é portão.
export const Calendar: Story = {
  render: () => <CalendarDocs />,
  play: mounted,
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

export const Collapsible: Story = {
  render: () => <CollapsibleDocs />,
  play: mounted,
};

export const Combobox: Story = {
  render: () => <ComboboxDocs />,
  play: mounted,
};

// axe: color-contrast (Ctrl+K riscado do don't, 1.78:1) — catalogado no
// FIXES-NEEDED. button-name RESOLVIDA (2026-08-01): trigger role="combobox"
// ganhou aria-label — combobox não aceita name-from-content.
// aria-required-children não reproduziu no diagnóstico de 2026-08-01.
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

export const Editor: Story = {
  render: () => <EditorDocs />,
  play: mounted,
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

// color-contrast RESOLVIDA (2026-08-11): a contagem de ícones do header somava
// `opacity: 0.7` a --muted-foreground (3.03:1), o mesmo defeito que Vanilla e
// Angular já tinham corrigido. Axe é portão — o catálogo inteiro sob o axe cabe
// nesta stack (medido: a página fecha dentro do timeout), ao contrário do que a
// nota antiga supunha.
export const Icons: Story = {
  render: () => <IconsDocs />,
  play: mounted,
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

export const MediaPlayer: Story = {
  render: () => <MediaPlayerDocs />,
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
  play: settled,
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

// aria-toggle-field-name RESOLVIDA (2026-08-01): o radio do "don't" usa texto
// solto em <span> (é justamente o erro demonstrado) — ganhou aria-label, que
// role="radio" em <span> exige quando não há Label associado. Axe é portão.
export const RadioGroup: Story = {
  render: () => <RadioGroupDocs />,
  play: mounted,
};

// scrollable-region-focusable RESOLVIDA (2026-08-01): o wrapper interno de
// cada painel (overflow:auto do react-resizable-panels, sem passagem de props)
// passou a ter conteúdo focável — tabIndex={0} no conteúdo do painel do demo.
export const Resizable: Story = {
  render: () => <ResizableDocs />,
  play: mounted,
};

export const ScrollArea: Story = {
  render: () => <ScrollAreaDocs />,
  play: mounted,
};

// color-contrast + select-name RESOLVIDAS (2026-08-01): o botão "Continuar" da
// composição usava color: var(--primary-foreground) sem hsl() (declaração
// inválida → herdava --foreground sobre --primary) — trocado pela classe
// nds-text-primary-foreground (mesmo padrão do Vue); e o snippet de
// extensibilidade era passado como extensibilityNotes (innerHTML → <select>
// real sem nome) em vez de extensibilityCode. Axe é portão.
export const Select: Story = {
  render: () => <SelectDocs />,
  play: mounted,
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

// aria-prohibited-attr RESOLVIDA (2026-08-01): containers de loading com
// aria-busy + aria-label ganharam role="status" (mesma decisão do vanilla).
// Axe é portão.
export const Skeleton: Story = {
  render: () => <SkeletonDocs />,
  play: mounted,
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

// aria-toggle-field-name RESOLVIDA (2026-08-01): o switch do "don't" usa texto
// solto em <span> (é justamente o erro demonstrado) — ganhou aria-label, que
// role="switch" em <span> exige quando não há Label associado. Axe é portão.
export const Switch: Story = {
  render: () => <SwitchDocs />,
  play: mounted,
};

export const Table: Story = {
  render: () => <TableDocs />,
  play: mounted,
};

export const Tabs: Story = {
  render: () => <TabsDocs />,
  play: mounted,
};

// label RESOLVIDA (2026-08-01): o snippet de extensibilidade era passado como
// extensibilityNotes (innerHTML → o parser vira `<Textarea>` em <textarea>
// real, sem rótulo) em vez de extensibilityCode — mesmo caso do Select.
export const Textarea: Story = {
  render: () => <TextareaDocs />,
  play: mounted,
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

// ── Registradas em 2026-09-01 — 32 páginas que existiam FORA da fumaça ──
// A família conversacional da guideline 17, o input-group e o form tinham docs page
// publicada e nenhuma verificação: nem de mount, nem de axe. Esta suíte é a
// única que monta a página inteira e a submete ao axe — fora dela, a página
// não tem portão nenhum.
// ATENÇÃO: estas ainda NÃO FORAM EXECUTADAS. O registro está pronto; a
// primeira rodada é que vai dizer quais montam limpas.

export const ActivityGraph: Story = {
  render: () => <ActivityGraphDocs />,
  play: mounted,
};

export const AgentPlan: Story = {
  render: () => <AgentPlanDocs />,
  play: mounted,
};

export const AgentStatus: Story = {
  render: () => <AgentStatusDocs />,
  play: mounted,
};

export const ApprovalCard: Story = {
  render: () => <ApprovalCardDocs />,
  play: mounted,
};

export const ChatThread: Story = {
  render: () => <ChatThreadDocs />,
  play: mounted,
};

export const ComposerAttachments: Story = {
  render: () => <ComposerAttachmentsDocs />,
  play: mounted,
};

export const ComposerContext: Story = {
  render: () => <ComposerContextDocs />,
  play: mounted,
};

export const Composer: Story = {
  render: () => <ComposerDocs />,
  play: mounted,
};

export const ComposerModelPicker: Story = {
  render: () => <ComposerModelPickerDocs />,
  play: mounted,
};

export const ComposerQuote: Story = {
  render: () => <ComposerQuoteDocs />,
  play: mounted,
};

export const ComposerTriggerPopover: Story = {
  render: () => <ComposerTriggerPopoverDocs />,
  play: mounted,
};

export const ComposerVoice: Story = {
  render: () => <ComposerVoiceDocs />,
  play: mounted,
};

export const ComputerUse: Story = {
  render: () => <ComputerUseDocs />,
  play: mounted,
};

export const ConnectionState: Story = {
  render: () => <ConnectionStateDocs />,
  play: mounted,
};

export const ContextBreakdown: Story = {
  render: () => <ContextBreakdownDocs />,
  play: mounted,
};

export const ContextDisplay: Story = {
  render: () => <ContextDisplayDocs />,
  play: mounted,
};

export const CostMeter: Story = {
  render: () => <CostMeterDocs />,
  play: mounted,
};

export const DraftRestore: Story = {
  render: () => <DraftRestoreDocs />,
  play: mounted,
};

export const FlowGraph: Story = {
  render: () => <FlowGraphDocs />,
  play: mounted,
};

export const Form: Story = {
  render: () => <FormDocs />,
  play: mounted,
};

export const InlineCitation: Story = {
  render: () => <InlineCitationDocs />,
  play: mounted,
};

export const InputGroup: Story = {
  render: () => <InputGroupDocs />,
  play: mounted,
};

export const JobProgress: Story = {
  render: () => <JobProgressDocs />,
  play: mounted,
};

export const Markdown: Story = {
  render: () => <MarkdownDocs />,
  play: mounted,
};

export const MessageQueue: Story = {
  render: () => <MessageQueueDocs />,
  play: mounted,
};

export const MessageTiming: Story = {
  render: () => <MessageTimingDocs />,
  play: mounted,
};

export const QuotaBanner: Story = {
  render: () => <QuotaBannerDocs />,
  play: mounted,
};

export const Stepper: Story = {
  render: () => <StepperDocs />,
  play: mounted,
};

export const TerminalBlock: Story = {
  render: () => <TerminalBlockDocs />,
  play: mounted,
};

export const ThinkingIndicator: Story = {
  render: () => <ThinkingIndicatorDocs />,
  play: mounted,
};

export const ToolGroup: Story = {
  render: () => <ToolGroupDocs />,
  play: mounted,
};

export const TraceWaterfall: Story = {
  render: () => <TraceWaterfallDocs />,
  play: mounted,
};
