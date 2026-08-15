import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
import { esperarEncostarNaBorda } from "@shared/testing/sheet-geometry";
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
import { Button } from "./button";
import { useTranslation } from "@/lib/i18n";
import sheetTranslations from "@shared/content/sheet/translations.json";

// As quatro direções são a única variação visual do Sheet, e todas moram no
// conteúdo (`side`), não na raiz. Cada uma nasce ABERTA: é o estado que a
// regressão visual precisa capturar e é nele que o axe tem o que examinar —
// fechado, o painel nem está no DOM.

const meta = {
  title: "UI/Sheet/Variants",
  tags: ["disclosure"],
  component: Sheet,
  parameters: {
    layout: "centered",
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      description: {
        component:
          "Direção do painel pela prop side do conteúdo. Right é o padrão de desktop; " +
          "left serve à navegação secundária; top e bottom ocupam altura automática.",
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ contain: "layout", minHeight: 320 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Sheet>;

export default meta;
type Story = StoryObj<typeof meta>;

type Side = "top" | "right" | "bottom" | "left";

/** Mesmo painel nas quatro direções — o que muda é `side` e o rótulo do título. */
function Painel({ side, tituloKey }: { side: Side; tituloKey: string }) {
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
  render: () => <Painel side="right" tituloKey="rightLabel" />,
  play: async () => {
    const painel = await waitForPortal("dialog");
    await expect(painel).toHaveAttribute("data-side", "right");
    await expect(painel).toHaveClass(/nds-sheet-content/);
    await expect(painel).toHaveAccessibleName();
    // O atributo prova que a prop chegou; a caixa prova que o CSS a obedeceu.
    await esperarEncostarNaBorda(painel, "right");
  },
};

export const Left: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      description: {
        story:
          "Desliza da esquerda. Mesma medida do right, do outro lado — é a direção da " +
          "navegação secundária, que a pessoa espera encontrar onde o menu costuma ficar.",
      },
    },
  },
  render: () => <Painel side="left" tituloKey="leftLabel" />,
  play: async () => {
    const painel = await waitForPortal("dialog");
    await expect(painel).toHaveAttribute("data-side", "left");
    await expect(painel).toHaveClass(/nds-sheet-content/);
    await expect(painel).toHaveAccessibleName();
    await esperarEncostarNaBorda(painel, "left");
  },
};

export const Top: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Desliza do topo e ocupa a largura inteira, com altura definida pelo conteúdo. " +
          "Útil para filtros horizontais e avisos ricos que não cabem num Alert.",
      },
    },
  },
  render: () => <Painel side="top" tituloKey="topLabel" />,
  play: async () => {
    const painel = await waitForPortal("dialog");
    await expect(painel).toHaveAttribute("data-side", "top");
    await expect(painel).toHaveClass(/nds-sheet-content/);
    await expect(painel).toHaveAccessibleName();
    await esperarEncostarNaBorda(painel, "top");
  },
};

export const Bottom: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      description: {
        story:
          "Desliza de baixo — o mesmo desenho do Drawer, sem o gesto de arrastar. " +
          "Quando o gesto importa, o componente é o Drawer.",
      },
    },
  },
  render: () => <Painel side="bottom" tituloKey="bottomLabel" />,
  play: async () => {
    const painel = await waitForPortal("dialog");
    await expect(painel).toHaveAttribute("data-side", "bottom");
    await expect(painel).toHaveClass(/nds-sheet-content/);
    await expect(painel).toHaveAccessibleName();
    await esperarEncostarNaBorda(painel, "bottom");
  },
};
