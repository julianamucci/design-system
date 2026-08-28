// GERADO por script (docs-smoke) — CSF estático: um export por docs page.
// Fumaça: prova que cada página monta (section[id] presente); axe roda após a play.
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import { expect, waitFor } from 'storybook/test';
import { docsAuditarPage, describeProblemas } from '@shared/testing/docs-page-contract';

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
import ComboboxDocs from '@/components/docs/ComboboxDocs.vue';
import CommandDocs from '@/components/docs/CommandDocs.vue';
import ContextMenuDocs from '@/components/docs/ContextMenuDocs.vue';
import CrossStackDocs from '@/components/docs/CrossStackDocs.vue';
import DataTableDocs from '@/components/docs/DataTableDocs.vue';
import DensitiesDocs from '@/components/docs/DensitiesDocs.vue';
import DialogDocs from '@/components/docs/DialogDocs.vue';
import DrawerDocs from '@/components/docs/DrawerDocs.vue';
import DropdownMenuDocs from '@/components/docs/DropdownMenuDocs.vue';
import EditorDocs from '@/components/docs/EditorDocs.vue';
import ElevationDocs from '@/components/docs/ElevationDocs.vue';
import GettingStartedDocs from '@/components/docs/GettingStartedDocs.vue';
import HoverCardDocs from '@/components/docs/HoverCardDocs.vue';
import I18nDocs from '@/components/docs/I18nDocs.vue';
import IconsDocs from '@/components/docs/IconsDocs.vue';
import InputDocs from '@/components/docs/InputDocs.vue';
import InputOTPDocs from '@/components/docs/InputOTPDocs.vue';
import LabelDocs from '@/components/docs/LabelDocs.vue';
import MediaPlayerDocs from '@/components/docs/MediaPlayerDocs.vue';
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
const smokePlay = async ({
  canvasElement,
  parameters,
}: {
  canvasElement: HTMLElement;
  parameters: { contratoDocs?: { ignorar?: Record<string, string> } };
}) => {
  await expect(canvasElement.querySelector('section[id], section')).not.toBeNull();


  // Contrato de conteúdo, compartilhado pelas quatro stacks. Montar sem crashar
  // e passar no axe não alcança o que se vê na tela: preview encostado à
  // esquerda, bloco de código vazio, chave de tradução renderizada como texto.
  // Foi assim que a revisão do Calendar gastou dezesseis commits achando um
  // defeito por rodada, a olho, com a suíte verde.
  const problemas = docsAuditarPage(canvasElement, { ignorar: parameters.contratoDocs?.ignorar });
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
// corrida com a animação. Mesmo tratamento já aplicado no React.
const settledPlay = async (ctx: {
  canvasElement: HTMLElement;
  parameters: { contratoDocs?: { ignorar?: Record<string, string> } };
}) => {
  const { canvasElement } = ctx;
  await smokePlay(ctx);
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
  // aria-prohibited-attr RESOLVIDA (2026-08-01): fallback com ícone ganhou
  // role="img" e o dot de status role="status". Axe é portão.
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
  // scrollable-region-focusable RESOLVIDA (2026-08-01): o wrapper de tabela
  // (.nds-table-wrapper, overflow-x:auto) ganhou tabindex="0" — mesma decisão
  // do CodeBlock (WCAG 2.1.1). Axe é portão.
  render: () => ({ components: { ButtonDocs }, template: '<ButtonDocs />' }),
  play: smokePlay,
  parameters: {
    contratoDocs: {
      ignorar: {
      preview_vazio:
        'o exemplo é um overlay que monta em portal — o contêiner fica vazio no DOM da página. Falta decidir se a docs page mostra o gatilho. FIXES-NEEDED.',
      },
    },
  },
};

export const Calendar: Story = {
  render: () => ({ components: { CalendarDocs }, template: '<CalendarDocs />' }),
  play: smokePlay,
  parameters: {
    contratoDocs: {
      ignorar: {
      valor_indefinido_visivel:
        'a coluna Padrão da tabela de props imprime a palavra "undefined" em vez de "—". FIXES-NEEDED.',
      },
    },
  },
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
  // axe: target-size — catalogado no FIXES-NEEDED (empty-heading resolvida)
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

export const Combobox: Story = {
  render: () => ({ components: { ComboboxDocs }, template: '<ComboboxDocs />' }),
  play: smokePlay,
};

export const Command: Story = {
  // axe: aria-required-children (CommandSeparator role=separator dentro do
  // listbox, 2 nodes) — catalogado no FIXES-NEEDED. button-name RESOLVIDA
  // (2026-08-01): triggers role="combobox" ganharam aria-label — combobox não
  // aceita name-from-content. empty-heading já estava resolvida.
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
  parameters: {
    contratoDocs: {
      ignorar: {
      preview_vazio:
        'o exemplo é um overlay que monta em portal — o contêiner fica vazio no DOM da página. Falta decidir se a docs page mostra o gatilho. FIXES-NEEDED.',
      },
    },
  },
};

export const Densities: Story = {
  render: () => ({ components: { DensitiesDocs }, template: '<DensitiesDocs />' }),
  play: smokePlay,
};

export const Dialog: Story = {
  render: () => ({ components: { DialogDocs }, template: '<DialogDocs />' }),
  play: smokePlay,
  parameters: {
    contratoDocs: {
      ignorar: {
      preview_vazio:
        'o exemplo é um overlay que monta em portal — o contêiner fica vazio no DOM da página. Falta decidir se a docs page mostra o gatilho. FIXES-NEEDED.',
      },
    },
  },
};

export const Drawer: Story = {
  render: () => ({ components: { DrawerDocs }, template: '<DrawerDocs />' }),
  play: smokePlay,
};

export const DropdownMenu: Story = {
  render: () => ({ components: { DropdownMenuDocs }, template: '<DropdownMenuDocs />' }),
  play: smokePlay,
};

export const Editor: Story = {
  render: () => ({ components: { EditorDocs }, template: '<EditorDocs />' }),
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

// color-contrast RESOLVIDA (2026-08-11): a contagem de ícones do header somava
// `opacity: 0.7` a --muted-foreground (3.03:1), o mesmo defeito que Vanilla e
// Angular já tinham corrigido. Axe é portão.
export const Icons: Story = {
  render: () => ({ components: { IconsDocs }, template: '<IconsDocs />' }),
  play: smokePlay,
};

export const Input: Story = {
  // label RESOLVIDA (2026-08-01): o input type="file" da seção de tipos não
  // tem placeholder (única fonte de nome nos demais previews) e ganhou
  // aria-label com chave t() existente. Axe é portão.
  render: () => ({ components: { InputDocs }, template: '<InputDocs />' }),
  play: smokePlay,
};

export const InputOTP: Story = {
  render: () => ({ components: { InputOTPDocs }, template: '<InputOTPDocs />' }),
  play: smokePlay,
};

export const Label: Story = {
  render: () => ({ components: { LabelDocs }, template: '<LabelDocs />' }),
  play: smokePlay,
};

export const MediaPlayer: Story = {
  render: () => ({ components: { MediaPlayerDocs }, template: '<MediaPlayerDocs />' }),
  play: smokePlay,
};

export const Menubar: Story = {
  render: () => ({ components: { MenubarDocs }, template: '<MenubarDocs />' }),
  play: smokePlay,
};

export const Motion: Story = {
  render: () => ({ components: { MotionDocs }, template: '<MotionDocs />' }),
  play: settledPlay,
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
  parameters: {
    contratoDocs: {
      ignorar: {
      preview_vazio:
        'o exemplo é um overlay que monta em portal — o contêiner fica vazio no DOM da página. Falta decidir se a docs page mostra o gatilho. FIXES-NEEDED.',
      },
    },
  },
};

export const Sidebar: Story = {
  render: () => ({ components: { SidebarDocs }, template: '<SidebarDocs />' }),
  play: smokePlay,
  parameters: {
    contratoDocs: {
      ignorar: {
      valor_indefinido_visivel:
        'a coluna Padrão da tabela de props imprime a palavra "undefined" em vez de "—". FIXES-NEEDED.',
      },
    },
  },
};

export const Skeleton: Story = {
  // aria-prohibited-attr RESOLVIDA (2026-08-01): containers de loading com
  // aria-busy + aria-label ganharam role="status" (mesma decisão do vanilla).
  // Axe é portão.
  render: () => ({ components: { SkeletonDocs }, template: '<SkeletonDocs />' }),
  play: smokePlay,
};

export const Slider: Story = {
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
  // button-name RESOLVIDA (2026-08-01): o Switch do don't "texto solto" ganhou
  // aria-label (string traduzida existente). Axe é portão.
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
  render: () => ({ components: { TextareaDocs }, template: '<TextareaDocs />' }),
  play: smokePlay,
};

export const ThemeColors: Story = {
  render: () => ({ components: { ThemeColorsDocs }, template: '<ThemeColorsDocs />' }),
  play: smokePlay,
};

export const ThemeSystem: Story = {
  // heading-order RESOLVIDA (2026-08-01): cards de sub-grupo sem h3 acima
  // (tokens.groups) saltavam de h2 para h4 no FoundationsRenderer; agora o
  // nível é h3 quando não há título de sub-grupo. Axe é portão.
  render: () => ({ components: { ThemeSystemDocs }, template: '<ThemeSystemDocs />' }),
  play: smokePlay,
};

export const Toggle: Story = {
  render: () => ({ components: { ToggleDocs }, template: '<ToggleDocs />' }),
  play: smokePlay,
};

export const ToggleGroup: Story = {
  // button-name RESOLVIDA (2026-08-01): items icon-only do don't ganharam
  // aria-label (chaves t() existentes) — o anti-pattern segue no rótulo
  // genérico do grupo. Axe é portão.
  render: () => ({ components: { ToggleGroupDocs }, template: '<ToggleGroupDocs />' }),
  play: smokePlay,
};

export const ToneOfVoice: Story = {
  render: () => ({ components: { ToneOfVoiceDocs }, template: '<ToneOfVoiceDocs />' }),
  play: smokePlay,
};

export const Tooltip: Story = {
  // button-name RESOLVIDA (2026-08-01): o botão icon-only do don't ganhou
  // aria-label (string traduzida existente). Axe é portão.
  render: () => ({ components: { TooltipDocs }, template: '<TooltipDocs />' }),
  play: smokePlay,
};

export const Typography: Story = {
  render: () => ({ components: { TypographyDocs }, template: '<TypographyDocs />' }),
  play: smokePlay,
};
