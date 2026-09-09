import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
import {
  Drawer,
  DrawerBody,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import {
  drawerDireitaSource,
  drawerEsquerdaSource,
  drawerHeadingH3Source,
  drawerSource,
  drawerTopoSource,
  drawerWithScrollSource,
} from "./drawer.source";
import { Button } from "./button";
import { useTranslation } from "@/lib/i18n";
import drawerTranslations from "@shared/content/drawer/translations.json";

import { figmaDesign } from "@shared/figma/design-links";
const meta = {
  title: "Components/Overlay/Drawer/Variants",
  tags: ["overlay"],
  component: Drawer,
  parameters: {
    design: figmaDesign("drawer"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Bottom é o padrão do componente: sem `direction` escrito, esta transform
      // já é o snippet da story Bottom.
      source: { transform: drawerSource },
      description: {
        component:
          "Direção de entrada pela prop direction da raiz. Bottom é o padrão mobile-first e a única direção em que a alça aparece; left e right servem a painéis laterais. O corpo rolável também mora aqui: é variação do conteúdo do painel, e é assim que o conteúdo compartilhado o descreve.",
      },
    },
  },
} satisfies Meta<typeof Drawer>;

export default meta;
type Story = StoryObj<typeof meta>;

// Andaime do canvas: `contain` e `position` são mecânica, e provam que o painel
// portalizado escapa de um bloco de contenção. Altura NÃO entra — as outras
// quatro stacks não têm nenhuma aqui, e o painel é `position: fixed` de todo
// jeito, então a altura do andaime não muda o que a foto mostra.
const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  position: "relative",
};

/** Mesmo painel nas quatro direções — o que muda é `direction` e o título. */
function panel(
  direction: "bottom" | "top" | "left" | "right",
  title: string,
  descricao: string,
) {
  return () => (
    <div style={wrapperStyle}>
      <Drawer direction={direction} defaultOpen>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription>{descricao}</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="nds-text-body nds-text-muted-foreground">
            Conteúdo do painel.
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// A asserção de direção está escrita story a story, e não extraída para um
// helper: `play_without_assertion` conta `expect()` DENTRO do bloco, e um
// helper compartilhado esconderia da leitura o único contrato que cada uma
// destas quatro stories verifica.

export const Bottom: Story = {
  parameters: {
    covers: ["accessibility.item6", "visual.item1"],
    docs: {
      description: {
        story:
          "Padrão mobile-first: entra por baixo, com teto de 80% da altura da tela e cantos arredondados no topo. É a única direção em que a alça aparece.",
      },
    },
  },
  render: panel("bottom", "Detalhes do pedido", "Pedido #4287 confirmado em 15 de março."),
  play: async ({ step }) => {
    await step("O painel encosta na base e mostra a alça", async () => {
      const panelEl = await waitForPortal("dialog");
      await expect(panelEl).toHaveAttribute("data-direction", "bottom");
      await expect(panelEl).toHaveClass(/nds-drawer-content/);
      await expect(panelEl).toHaveAccessibleName("Detalhes do pedido");
      // A alça só é visível nesta direção — o CSS compartilhado a esconde nas
      // outras. Contraste e cor do painel são verificados pelo axe da story.
      const thumb = panelEl.querySelector<HTMLElement>(".nds-drawer-handle")!;
      await expect(window.getComputedStyle(thumb).display).toBe("block");
    });
  },
};

export const Top: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: {
      // `direction="top"` é o assunto, e o arquivo desliga os controls.
      source: { transform: drawerTopoSource },
      description: {
        story:
          "Entra por cima, com cantos arredondados embaixo. Serve a notificação rica e a seletor rápido — conteúdo curto e saída imediata.",
      },
    },
  },
  render: panel("top", "Nova versão disponível", "Atualize agora para acessar as novidades."),
  play: async ({ step }) => {
    await step("O painel encosta no topo e esconde a alça", async () => {
      const panelEl = await waitForPortal("dialog");
      await expect(panelEl).toHaveAttribute("data-direction", "top");
      await expect(panelEl).toHaveClass(/nds-drawer-content/);
      await expect(panelEl).toHaveAccessibleName("Nova versão disponível");
      const thumb = panelEl.querySelector<HTMLElement>(".nds-drawer-handle")!;
      await expect(window.getComputedStyle(thumb).display).toBe("none");
    });
  },
};

export const Left: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      // `direction="left"` é o assunto, e o arquivo desliga os controls.
      source: { transform: drawerEsquerdaSource },
      description: {
        story:
          "Painel lateral à esquerda — a direção do menu de navegação, que a pessoa espera encontrar onde o menu costuma ficar.",
      },
    },
  },
  render: panel("left", "Menu", "Navegue pelas seções do app."),
  play: async ({ step }) => {
    await step("O painel encosta na borda esquerda", async () => {
      const panelEl = await waitForPortal("dialog");
      await expect(panelEl).toHaveAttribute("data-direction", "left");
      await expect(panelEl).toHaveClass(/nds-drawer-content/);
      await expect(panelEl).toHaveAccessibleName("Menu");
      // Ocupa a altura inteira, encostada na borda — ao contrário de bottom/top.
      await expect(panelEl.getBoundingClientRect().left).toBeLessThan(1);
    });
  },
};

export const Right: Story = {
  parameters: {
    covers: ["functional.item5", "visual.item2"],
    docs: {
      // `direction="right"` é o assunto, e o arquivo desliga os controls.
      source: { transform: drawerDireitaSource },
      description: {
        story:
          "Painel lateral à direita — alternativa de desktop para edição e filtros, sem trocar de componente.",
      },
    },
  },
  render: panel("right", "Filtros", "Refine sua busca por categoria, preço e disponibilidade."),
  play: async ({ step }) => {
    await step("O painel encosta na borda direita", async () => {
      const panelEl = await waitForPortal("dialog");
      await expect(panelEl).toHaveAttribute("data-direction", "right");
      await expect(panelEl).toHaveClass(/nds-drawer-content/);
      await expect(panelEl).toHaveAccessibleName("Filtros");
      const box = panelEl.getBoundingClientRect();
      await expect(Math.abs(box.right - window.innerWidth)).toBeLessThan(2);
    });
  },
};

export const WithScroll: Story = {
  parameters: {
    covers: ["accessibility.item7"],
    docs: {
      // Só uma lista mais alta que o painel mostra que quem rola é o corpo e
      // que o rodapé continua na tela.
      source: { transform: drawerWithScrollSource },
      description: {
        story:
          "Corpo mais alto que o painel. O corpo rola sozinho dentro do teto de altura e o rodapé continua visível — é o que separa 'conteúdo longo' de 'ação fora de alcance'.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer defaultOpen>
        <DrawerTrigger asChild>
          <Button variant="outline">Ver lista</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Lista de itens</DrawerTitle>
            <DrawerDescription>30 itens — role o conteúdo para ver mais.</DrawerDescription>
          </DrawerHeader>
          <DrawerBody className="nds-text-body" aria-label="Lista de itens">
            <ul className="nds-stack" data-spacing="sm">
              {Array.from({ length: 30 }).map((_, i) => (
                <li
                  key={i}
                  className="nds-cluster nds-border-default nds-rounded-md nds-py-2 nds-px-4"
                  data-justify="between"
                >
                  <span>Item {i + 1}</span>
                  <span className="nds-text-muted-foreground">#{i + 1}</span>
                </li>
              ))}
            </ul>
          </DrawerBody>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ step }) => {
    const panel = await waitForPortal("dialog");
    const body = panel.querySelector<HTMLElement>("[data-slot='drawer-body']")!;
    const footer = panel.querySelector<HTMLElement>("[data-slot='drawer-footer']")!;

    await step("O corpo é quem rola, não o painel", async () => {
      await expect(body).not.toBeNull();
      await expect(panel.querySelectorAll("[data-slot='drawer-body'] li")).toHaveLength(30);
      await expect(body.scrollHeight).toBeGreaterThan(body.clientHeight);
      // O painel em si não rola: o mínimo automático zero de um item com
      // overflow é o que faz o corpo ceder altura em vez de esticar a caixa.
      // O painel NÃO é contêiner de rolagem, e é isso que prova o contrato.
      // Medir `scrollHeight <= clientHeight` nele não provava nada: sem
      // `overflow` declarado o computado é `visible`, e elemento visível não
      // rola por maior que seja o `scrollHeight`. Sonda no navegador com o
      // corpo já correto: painel client 719 / scroll 2157, corpo client 559 /
      // scroll 1524 — ou seja, o corpo cede altura e rola, e o número do painel
      // era só a caixa de conteúdo não recortada.
      await expect(['auto', 'scroll']).not.toContain(
        getComputedStyle(panel).overflowY,
      );
    });

    await step("A região rolável é alcançável por teclado, com papel e nome", async () => {
      // WCAG 2.1.1 — sem o tabindex, quem navega por teclado não consegue rolar
      // o corpo. É a regra scrollable-region-focusable do axe, que reprovava
      // esta story antes de o corpo virar componente.
      await expect(body).toHaveAttribute("tabindex", "0");
      // Parada de teclado precisa de papel, e o papel só aparece com nome: os
      // dois vêm juntos ou não vêm. Sem o par, o `aria-label` seria DESCARTADO
      // pelo leitor de tela (aria-prohibited-attr) e ninguém saberia.
      await expect(body).toHaveAttribute("role", "group");
      await expect(body).toHaveAccessibleName("Lista de itens");
    });

    await step("O rodapé continua visível com o corpo cheio", async () => {
      const boxFooter = footer.getBoundingClientRect();
      const boxPanel = panel.getBoundingClientRect();
      await expect(boxFooter.bottom).toBeLessThanOrEqual(boxPanel.bottom + 1);
      await expect(boxFooter.height).toBeGreaterThan(0);
    });
  },
};

// O nível do cabeçalho é decisão de QUEM COMPÕE, não do componente: um painel
// que abre a partir de uma seção já em `h2` precisa de `h3` no título para não
// pôr dois irmãos onde há um pai e um filho. A capacidade existe desde
// 2026-09-08 e nenhuma story a exercitava.
export const HeadingH3: Story = {
  parameters: {
    covers: ["accessibility.item3"],
    docs: {
      // O nível do título é a ÚNICA diferença para o snippet canônico — e é
      // justamente ela que o painel Code precisa ensinar.
      source: { transform: drawerHeadingH3Source },
      description: {
        story:
          "O painel abre de dentro de uma página cuja seção já está em `h2`, então o título entra como `h3`. Trocar a tag não pode romper o `aria-labelledby`: o nome acessível continua saindo do mesmo elemento.",
      },
    },
  },
  render: () => {
    const { t } = useTranslation(drawerTranslations);
    return (
      <div style={wrapperStyle}>
        <Drawer defaultOpen>
          <DrawerTrigger asChild>
            <Button variant="outline">{t("demonstration.labels.trigger")}</Button>
          </DrawerTrigger>
          <DrawerContent>
            <DrawerHeader>
              {/* `asChild` funde as props do componente no elemento de quem
                  compõe — id, classe e slot continuam vindo do Drawer. */}
              <DrawerTitle asChild>
                <h3>{t("demonstration.labels.title")}</h3>
              </DrawerTitle>
              <DrawerDescription>
                {t("demonstration.labels.description")}
              </DrawerDescription>
            </DrawerHeader>
            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline">
                  {t("demonstration.labels.cancel")}
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </div>
    );
  },
  play: async ({ step }) => {
    const p = await waitForPortal("dialog");

    await step("O título vira h3 sem soltar o vínculo que nomeia o painel", async () => {
      // O id é o elo: se a fusão do `asChild` descartasse as props do
      // componente, o `aria-labelledby` apontaria para um id que não existe —
      // nome acessível vazio, e `aria-valid-attr-value` no axe.
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
