// Suíte de fumaça das docs pages — gerada por script (contrato docs-smoke).
// Um export por página de src/components/docs/*Docs.svelte. A play prova que a
// página montou (crash = teste vermelho); o axe do addon-a11y roda em seguida.
// Política: página que falha no axe recebe parameters.a11y.test='todo' com as
// rules em comentário; página que crasha fica FORA do arquivo, listada aqui.
// FORA: Icons — catálogo lucide completo estoura o axe/timeout do runner (>4min); excluída por decisão da dona em 2026-07-31
import type { Meta, StoryObj } from '@storybook/svelte-vite';
import { expect, waitFor } from 'storybook/test';
import { docsAuditarPage, describeProblemas } from '@shared/testing/docs-page-contract';

import AboutDocs from './AboutDocs.svelte';
import AccessibilityDocs from './AccessibilityDocs.svelte';
import AccordionDocs from './AccordionDocs.svelte';
import AlertDialogDocs from './AlertDialogDocs.svelte';
import AlertDocs from './AlertDocs.svelte';
import AnalyticsCatalogDocs from './AnalyticsCatalogDocs.svelte';
import AspectRatioDocs from './AspectRatioDocs.svelte';
import AvatarDocs from './AvatarDocs.svelte';
import BadgeDocs from './BadgeDocs.svelte';
import BreadcrumbDocs from './BreadcrumbDocs.svelte';
import ButtonDocs from './ButtonDocs.svelte';
import CalendarDocs from './CalendarDocs.svelte';
import CardDocs from './CardDocs.svelte';
import CarouselDocs from './CarouselDocs.svelte';
import ChartDocs from './ChartDocs.svelte';
import CheckboxDocs from './CheckboxDocs.svelte';
import CodeBlockDocs from './CodeBlockDocs.svelte';
import CollapsibleDocs from './CollapsibleDocs.svelte';
import ComboboxDocs from './ComboboxDocs.svelte';
import CommandDocs from './CommandDocs.svelte';
import ContextMenuDocs from './ContextMenuDocs.svelte';
import CrossStackDocs from './CrossStackDocs.svelte';
import DataTableDocs from './DataTableDocs.svelte';
import DensitiesDocs from './DensitiesDocs.svelte';
import DialogDocs from './DialogDocs.svelte';
import DrawerDocs from './DrawerDocs.svelte';
import DropdownMenuDocs from './DropdownMenuDocs.svelte';
import EditorDocs from './EditorDocs.svelte';
import ElevationDocs from './ElevationDocs.svelte';
import GettingStartedDocs from './GettingStartedDocs.svelte';
import HoverCardDocs from './HoverCardDocs.svelte';
import I18nDocs from './I18nDocs.svelte';
import InputDocs from './InputDocs.svelte';
import InputOTPDocs from './InputOTPDocs.svelte';
import LabelDocs from './LabelDocs.svelte';
import MediaPlayerDocs from './MediaPlayerDocs.svelte';
import MenubarDocs from './MenubarDocs.svelte';
import MotionDocs from './MotionDocs.svelte';
import NavigationMenuDocs from './NavigationMenuDocs.svelte';
import PaginationDocs from './PaginationDocs.svelte';
import PopoverDocs from './PopoverDocs.svelte';
import ProgressDocs from './ProgressDocs.svelte';
import RadioGroupDocs from './RadioGroupDocs.svelte';
import ResizableDocs from './ResizableDocs.svelte';
import ScrollAreaDocs from './ScrollAreaDocs.svelte';
import SelectDocs from './SelectDocs.svelte';
import SeoGeoDocs from './SeoGeoDocs.svelte';
import SeparatorDocs from './SeparatorDocs.svelte';
import SheetDocs from './SheetDocs.svelte';
import SidebarDocs from './SidebarDocs.svelte';
import SkeletonDocs from './SkeletonDocs.svelte';
import SliderDocs from './SliderDocs.svelte';
import SonnerDocs from './SonnerDocs.svelte';
import SpacingDocs from './SpacingDocs.svelte';
import SwitchDocs from './SwitchDocs.svelte';
import TableDocs from './TableDocs.svelte';
import TabsDocs from './TabsDocs.svelte';
import TextareaDocs from './TextareaDocs.svelte';
import ThemeColorsDocs from './ThemeColorsDocs.svelte';
import ThemeSystemDocs from './ThemeSystemDocs.svelte';
import ToggleDocs from './ToggleDocs.svelte';
import ToggleGroupDocs from './ToggleGroupDocs.svelte';
import ToneOfVoiceDocs from './ToneOfVoiceDocs.svelte';
import TooltipDocs from './TooltipDocs.svelte';
import TypographyDocs from './TypographyDocs.svelte';

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

// As *Docs.svelte não recebem props. O cast único evita o atrito de variância
// do svelte-check entre Component<Record<string, never>> (e os legados
// IsomorphicComponent) e o Args genérico do CSF — sem efeito em runtime.
const page = (Page: unknown) => () => ({ Component: Page as never });

// Prova mínima de mount: docs pages de componente renderizam <section id>;
// páginas foundation (FoundationPage) renderizam <section> com o divider —
// nesta stack elas não têm id, então o seletor cobre as duas anatomias.
const mounted: Story['play'] = async ({ canvasElement, parameters }) => {
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

export const About: Story = { render: page(AboutDocs), play: mounted };

export const Accessibility: Story = { render: page(AccessibilityDocs), play: mounted };

export const Accordion: Story = { render: page(AccordionDocs), play: mounted };

export const AlertDialog: Story = { render: page(AlertDialogDocs), play: mounted };

export const Alert: Story = { render: page(AlertDocs), play: mounted };

export const AnalyticsCatalog: Story = { render: page(AnalyticsCatalogDocs), play: mounted };

export const AspectRatio: Story = { render: page(AspectRatioDocs), play: mounted };

// aria-prohibited-attr RESOLVIDA (2026-08-01): fallback com ícone ganhou
// role="img" e o dot de status role="status". Axe é portão.
export const Avatar: Story = { render: page(AvatarDocs), play: mounted };

export const Badge: Story = { render: page(BadgeDocs), play: mounted };

export const Breadcrumb: Story = { render: page(BreadcrumbDocs), play: mounted };

export const Button: Story = { render: page(ButtonDocs), play: mounted };

export const Calendar: Story = { render: page(CalendarDocs), play: mounted,
  parameters: {
    contratoDocs: {
      ignorar: {
      valor_indefinido_visivel:
        'a coluna Padrão da tabela de props imprime a palavra "undefined" em vez de "—". FIXES-NEEDED.',
      },
    },
  },
};

export const Card: Story = { render: page(CardDocs), play: mounted };

export const Carousel: Story = { render: page(CarouselDocs), play: mounted };

export const Chart: Story = { render: page(ChartDocs), play: mounted };

// axe: target-size — catalogado no FIXES-NEEDED. button-name RESOLVIDA
// (2026-08-01): variante default (checkbox sem Label visível) ganhou
// aria-label; empty-heading RESOLVIDA: DocsAccessibility.svelte só renderiza
// o <h3> do teclado quando keyboardTitle existe (mesmo fix do Vue).
export const Checkbox: Story = { render: page(CheckboxDocs), play: mounted, parameters: { a11y: { test: 'todo' } } };

export const CodeBlock: Story = { render: page(CodeBlockDocs), play: mounted };

export const Collapsible: Story = { render: page(CollapsibleDocs), play: mounted };

export const Combobox: Story = { render: page(ComboboxDocs), play: mounted };

// axe: aria-required-attr, aria-required-children, button-name, nested-interactive, target-size — catalogado no FIXES-NEEDED
// axe: aria-required-attr (Command.Input do bits-ui sem aria-controls),
// aria-required-children (Command.Loading role=progressbar dentro do listbox)
// — catalogado no FIXES-NEEDED. button-name, nested-interactive e target-size
// RESOLVIDAS (2026-08-01): o asChild inexistente no bits-ui virava <button>
// wrapper sem nome — trocado pelo snippet child; trigger role="combobox"
// ganhou aria-label (combobox não aceita name-from-content).
export const Command: Story = { render: page(CommandDocs), play: mounted, parameters: { a11y: { test: 'todo' } } };

export const ContextMenu: Story = { render: page(ContextMenuDocs), play: mounted };

export const CrossStack: Story = { render: page(CrossStackDocs), play: mounted };

export const DataTable: Story = { render: page(DataTableDocs), play: mounted };

export const Densities: Story = { render: page(DensitiesDocs), play: mounted };

// axe: scrollable-region-focusable — catalogado no FIXES-NEEDED
export const Dialog: Story = { render: page(DialogDocs), play: mounted, parameters: {
    a11y: { test: 'todo' },
    contratoDocs: {
      ignorar: {
        preview_vazio:
          'o exemplo é um overlay que monta em portal — o contêiner fica vazio no DOM da página. Falta decidir se a docs page mostra o gatilho. FIXES-NEEDED.',
      },
    },
  },
};

export const Drawer: Story = { render: page(DrawerDocs), play: mounted };

export const DropdownMenu: Story = { render: page(DropdownMenuDocs), play: mounted };

export const Editor: Story = { render: page(EditorDocs), play: mounted };

export const Elevation: Story = { render: page(ElevationDocs), play: mounted };

export const GettingStarted: Story = { render: page(GettingStartedDocs), play: mounted };

export const HoverCard: Story = { render: page(HoverCardDocs), play: mounted };

export const I18n: Story = { render: page(I18nDocs), play: mounted };

export const Input: Story = { render: page(InputDocs), play: mounted };

export const InputOTP: Story = { render: page(InputOTPDocs), play: mounted };

// label RESOLVIDA (2026-08-01): o Input do don't "sem associação" ficava sem
// nome acessível — ganhou aria-label repetindo o texto visível (o anti-padrão
// exibido, Label sem for/id, continua intacto). Axe é portão.
export const Label: Story = { render: page(LabelDocs), play: mounted,
  parameters: {
    contratoDocs: {
      ignorar: {
      chave_i18n_visivel:
        'a seção renderiza o caminho da chave: falta a entrada no translations.json. FIXES-NEEDED.',
      },
    },
  },
};

export const MediaPlayer: Story = { render: page(MediaPlayerDocs), play: mounted };

export const Menubar: Story = { render: page(MenubarDocs), play: mounted };

export const Motion: Story = { render: page(MotionDocs), play: mounted };

export const NavigationMenu: Story = { render: page(NavigationMenuDocs), play: mounted };

export const Pagination: Story = { render: page(PaginationDocs), play: mounted };

// label RESOLVIDA (2026-08-01): o input do variantForm era o único fora de um
// <label> envolvente — ganhou aria-label com a chave t() do bloco. Axe é portão.
export const Popover: Story = { render: page(PopoverDocs), play: mounted,
  parameters: {
    contratoDocs: {
      ignorar: {
      preview_vazio:
        'o exemplo é um overlay que monta em portal — o contêiner fica vazio no DOM da página. Falta decidir se a docs page mostra o gatilho. FIXES-NEEDED.',
      },
    },
  },
};

export const Progress: Story = { render: page(ProgressDocs), play: mounted };

// button-name RESOLVIDA (2026-08-01): os radios do don't "texto solto"
// ganharam aria-label (chaves t() existentes). Axe é portão.
export const RadioGroup: Story = { render: page(RadioGroupDocs), play: mounted };

export const Resizable: Story = { render: page(ResizableDocs), play: mounted };

export const ScrollArea: Story = { render: page(ScrollAreaDocs), play: mounted };

// color-contrast RESOLVIDA (2026-08-01): o botão "Continuar" da composição
// usava color: var(--primary-foreground) sem hsl() (declaração inválida →
// herdava --foreground sobre --primary) — trocado pela classe
// nds-text-primary-foreground (mesmo padrão do Vue). Axe é portão.
export const Select: Story = { render: page(SelectDocs), play: mounted };

export const SeoGeo: Story = { render: page(SeoGeoDocs), play: mounted };

export const Separator: Story = { render: page(SeparatorDocs), play: mounted };

export const Sheet: Story = { render: page(SheetDocs), play: mounted };

export const Sidebar: Story = { render: page(SidebarDocs), play: mounted };

// aria-prohibited-attr RESOLVIDA (2026-08-01): containers de loading com
// aria-busy + aria-label ganharam role="status" (mesma decisão do vanilla).
// Axe é portão.
export const Skeleton: Story = { render: page(SkeletonDocs), play: mounted };

export const Slider: Story = { render: page(SliderDocs), play: mounted };

export const Sonner: Story = { render: page(SonnerDocs), play: mounted,
  parameters: {
    contratoDocs: {
      ignorar: {
      chave_i18n_visivel:
        'a seção renderiza o caminho da chave: falta a entrada no translations.json. FIXES-NEEDED.',
      },
    },
  },
};

export const Spacing: Story = { render: page(SpacingDocs), play: mounted };

// heading-order RESOLVIDA (2026-08-01): a composição "lista de configurações"
// abria com <h4> logo após o <h2> da seção (pulo de nível) — virou <h3>; o
// estilo vem das classes, então o pixel não muda. button-name RESOLVIDA
// (2026-08-01): o Switch do don't "texto solto" ganhou aria-label.
export const Switch: Story = { render: page(SwitchDocs), play: mounted };

export const Table: Story = { render: page(TableDocs), play: mounted };

export const Tabs: Story = { render: page(TabsDocs), play: mounted };

export const Textarea: Story = { render: page(TextareaDocs), play: mounted };

export const ThemeColors: Story = { render: page(ThemeColorsDocs), play: mounted };

export const ThemeSystem: Story = { render: page(ThemeSystemDocs), play: mounted };

export const Toggle: Story = { render: page(ToggleDocs), play: mounted };

// aria-allowed-attr RESOLVIDA (2026-08-01): o wrapper punha role="toolbar" +
// aria-orientation na raiz, mas o bits-ui vence no mergeProps e emite
// role="group" — sobrava aria-orientation num role que não a aceita. As duas
// linhas saíram (o role já era inerte); orientation segue indo pro primitivo,
// que expõe data-orientation. Axe é portão.
export const ToggleGroup: Story = { render: page(ToggleGroupDocs), play: mounted };

export const ToneOfVoice: Story = { render: page(ToneOfVoiceDocs), play: mounted };

// button-name RESOLVIDA (2026-08-01): o botão icon-only do don't ganhou
// aria-label (string traduzida existente). Axe é portão.
export const Tooltip: Story = { render: page(TooltipDocs), play: mounted };

export const Typography: Story = { render: page(TypographyDocs), play: mounted };
