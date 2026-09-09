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
  sheetSideBottomSource,
  sheetSideLeftSource,
  sheetSideRightSource,
  sheetSideTopSource,
  sheetHeadingH3Source,
  sheetSource,
} from "./sheet.source";
import { Button } from "./button";
import { useTranslation } from "@/lib/i18n";
import sheetTranslations from "@shared/content/sheet/translations.json";

import { figmaDesign } from "@shared/figma/design-links";
// As quatro direções são a única variação visual do Sheet, e todas moram no
// conteúdo (`side`), não na raiz. Cada uma nasce ABERTA: é o estado que a
// regressão visual precisa capturar e é nele que o axe tem o que examinar —
// fechado, o painel nem está no DOM.

const meta = {
  title: "Components/Overlay/Sheet/Variants",
  tags: ["overlay"],
  component: Sheet,
  parameters: {
    design: figmaDesign("sheet"),
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

/**
 * Mesmo painel nas quatro direções — o que muda é `side` e o rótulo do título.
 *
 * `titleRender` é opcional e existe para a story de nível de cabeçalho: o
 * elemento do título é escolha de quem compõe, e omitir a prop deixa o
 * componente com o padrão dele. Um segundo `render` duplicado aqui separaria em
 * dois caminhos o que é um painel só.
 */
function Panel({
  side,
  tituloKey,
  titleRender,
}: {
  side: Side;
  tituloKey: string;
  titleRender?: React.ReactElement;
}) {
  const { t } = useTranslation(sheetTranslations);
  return (
    <Sheet defaultOpen>
      <SheetTrigger render={<Button variant="outline" />}>
        {t("demonstration.labels.trigger")}
      </SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle render={titleRender}>
            {t(`demonstration.labels.${tituloKey}`)}
          </SheetTitle>
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
      // Sem transform próprio esta story caía no do `meta`, que lê os controls
      // do Playground: o painel Code publicava "Filtros avançados" enquanto o
      // preview ao lado mostrava "Painel direito".
      source: { transform: sheetSideRightSource },
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
      source: { transform: sheetSideLeftSource },
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
      source: { transform: sheetSideTopSource },
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
      source: { transform: sheetSideBottomSource },
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

// O nível do cabeçalho é decisão de QUEM COMPÕE, não do componente: um painel
// que abre a partir de uma seção já em `h2` precisa de `h3` no título para não
// pôr dois irmãos onde há um pai e um filho. A capacidade existe desde
// 2026-09-08 e nenhuma story a exercitava.
export const HeadingH3: Story = {
  parameters: {
    covers: ["accessibility.item4"],
    docs: {
      // O nível do título é a ÚNICA diferença para o snippet canônico — e é
      // justamente ela que o painel Code precisa ensinar.
      source: { transform: sheetHeadingH3Source },
      description: {
        story:
          "O painel abre de dentro de uma página cuja seção já está em `h2`, então o título entra como `h3`. Trocar a tag não pode romper o `aria-labelledby`: o nome acessível continua saindo do mesmo elemento.",
      },
    },
  },
  render: () => <Panel side="right" tituloKey="title" titleRender={<h3 />} />,
  play: async ({ step }) => {
    const p = await waitForPortal("dialog");

    await step("O título vira h3 sem soltar o vínculo que nomeia o painel", async () => {
      // O id é o elo: `render` empresta as props ao elemento de quem compõe, e
      // se ele fosse descartado o `aria-labelledby` apontaria para um id que
      // não existe — nome acessível vazio, e `aria-valid-attr-value` no axe.
      const id = p.getAttribute("aria-labelledby");
      await expect(id).toBeTruthy();
      const heading = document.getElementById(id!);
      await expect(heading).not.toBeNull();
      await expect(heading!.tagName).toBe("H3");
      // A classe do componente sobrevive à troca da tag: o estilo do título não
      // depende de qual cabeçalho a página escolheu.
      await expect(heading!.classList.contains("nds-sheet-title")).toBe(true);
      await expect(p).toHaveAccessibleName(heading!.textContent!.trim());
    });
  },
};
