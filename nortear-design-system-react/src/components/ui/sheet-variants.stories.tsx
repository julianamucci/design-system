import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
import { borderWaitForEncostar } from "@shared/testing/sheet-geometry";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";
import {
  sheetSideEsquerdoSource,
  sheetSideInferiorSource,
  sheetSideSuperiorSource,
  sheetSource,
} from "./sheet.source";
import { Button } from "./button";
import { useTranslation } from "@/lib/i18n";
import sheetTranslations from "@shared/content/sheet/translations.json";

// As quatro direções são a única variação visual do Sheet, e todas moram no
// conteúdo (`side`), não na raiz. Cada uma nasce ABERTA: é o estado que a
// regressão visual precisa capturar e é nele que o axe tem o que examinar —
// fechado, o painel nem está no DOM.

const meta = {
  title: "Components/Overlay/Sheet/Variants",
  tags: ["overlay"],
  component: Sheet,
  parameters: {
    layout: "centered",
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: sheetSource },
      description: {
        component:
          "Direção do painel pela prop side do conteúdo. Right é o padrão de desktop; " +
          "left serve à navegação secundária; top e bottom ocupam altura automática.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="nds-min-h-80" style={{ contain: "layout" }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

type Side = "top" | "right" | "bottom" | "left";

/** Mesmo painel nas quatro direções — o que muda é `side` e o rótulo do título. */
function Panel({ side, tituloKey }: { side: Side; tituloKey: string }) {
  const { t } = useTranslation(sheetTranslations);
  return (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button variant="outline" />}>
        {t("demonstration.labels.trigger")}
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>{t(`demonstration.labels.${tituloKey}`)}</SheetTitle>
          <SheetDescription>
            {t("demonstration.labels.description")}
          </SheetDescription>
        </SheetHeader>
        <SheetFooter>
          <SheetClose render={<Button variant="outline" />}>
            {t("demonstration.labels.cancel")}
          </SheetClose>
          <Button>{t("demonstration.labels.apply")}</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

// A asserção está escrita story a story, e não extraída para um helper: o lado
// é o ÚNICO contrato que cada uma destas quatro verifica, e ver a asserção
// dentro da story é o que torna um lado errado visível na leitura.

export const Right: Story = {
  parameters: {
    covers: ["accessibility.item1", "accessibility.item2", "visual.item1"],
    docs: {
      description: {
        story:
          "Padrão para desktop — desliza da direita e ocupa 75% da largura, com teto de 24rem. " +
          "Caso canônico para filtros e configurações secundárias.",
      },
    },
  },
  render: () => <Panel side="right" tituloKey="rightLabel" />,
  play: async () => {
    const panel = await waitForPortal("dialog");
    await expect(panel).toHaveAttribute("data-side", "right");
    await expect(panel).toHaveClass(/nds-sheet-content/);
    await expect(panel).toHaveAccessibleName();
    // O atributo prova que a prop chegou; a caixa prova que o CSS a obedeceu.
    await borderWaitForEncostar(panel, "right");
  },
};

export const Left: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      // A direção é afirmada no `render` e não há control neste arquivo.
      source: { transform: sheetSideEsquerdoSource },
      description: {
        story:
          "Desliza da esquerda. Mesma medida do right, do outro lado — é a direção da " +
          "navegação secundária, que a pessoa espera encontrar onde o menu costuma ficar.",
      },
    },
  },
  render: () => <Panel side="left" tituloKey="leftLabel" />,
  play: async () => {
    const panel = await waitForPortal("dialog");
    await expect(panel).toHaveAttribute("data-side", "left");
    await expect(panel).toHaveClass(/nds-sheet-content/);
    await expect(panel).toHaveAccessibleName();
    await borderWaitForEncostar(panel, "left");
  },
};

export const Top: Story = {
  parameters: {
    docs: {
      // A direção é afirmada no `render` e não há control neste arquivo.
      source: { transform: sheetSideSuperiorSource },
      description: {
        story:
          "Desliza do topo e ocupa a largura inteira, com altura definida pelo conteúdo. " +
          "Útil para filtros horizontais e avisos ricos que não cabem num Alert.",
      },
    },
  },
  render: () => <Panel side="top" tituloKey="topLabel" />,
  play: async () => {
    const panel = await waitForPortal("dialog");
    await expect(panel).toHaveAttribute("data-side", "top");
    await expect(panel).toHaveClass(/nds-sheet-content/);
    await expect(panel).toHaveAccessibleName();
    await borderWaitForEncostar(panel, "top");
  },
};

export const Bottom: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      // A direção é afirmada no `render` e não há control neste arquivo.
      source: { transform: sheetSideInferiorSource },
      description: {
        story:
          "Desliza de baixo — o mesmo desenho do Drawer, sem o gesto de arrastar. " +
          "Quando o gesto importa, o componente é o Drawer.",
      },
    },
  },
  render: () => <Panel side="bottom" tituloKey="bottomLabel" />,
  play: async () => {
    const panel = await waitForPortal("dialog");
    await expect(panel).toHaveAttribute("data-side", "bottom");
    await expect(panel).toHaveClass(/nds-sheet-content/);
    await expect(panel).toHaveAccessibleName();
    await borderWaitForEncostar(panel, "bottom");
  },
};
