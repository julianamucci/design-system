import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./navigation-menu";
import { esperarPainel, esperarPainelSumir, popupAberto } from "./navigation-menu.fixtures";
import { navigationMenuSource } from "./navigation-menu.source";
import { NavigationMenuDocs } from "@/components/docs/NavigationMenuDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

type PlaygroundArgs = {
  defaultValue?: string;
  delay?: number;
  closeDelay?: number;
  orientation?: "horizontal" | "vertical";
  onValueChange?: (value: string) => void;
};

const meta = {
  title: "UI/NavigationMenu",
  component: NavigationMenu,
  tags: ["autodocs", "navigation"],
  parameters: {
    layout: "centered",
    docs: {
      page: withAutoDocsTab(NavigationMenuDocs),
      // O painel imprimia a árvore do `render`, com as esperas de portal do
      // módulo de apoio das stories. A transform devolve o uso real.
      source: { transform: navigationMenuSource },
    },
  },
  argTypes: {
    defaultValue: {
      control: "text",
      description:
        "Item aberto ao montar; use o mesmo identificador declarado no item da barra.",
      table: { type: { summary: "string" }, defaultValue: { summary: "—" } },
    },
    delay: {
      control: { type: "number", min: 0, max: 1000, step: 50 },
      description: "Espera em ms antes de abrir o painel quando o ponteiro entra no gatilho.",
      table: { type: { summary: "number" }, defaultValue: { summary: "50" } },
    },
    closeDelay: {
      control: { type: "number", min: 0, max: 1000, step: 50 },
      description: "Espera em ms antes de fechar depois que o ponteiro sai da barra.",
      table: { type: { summary: "number" }, defaultValue: { summary: "50" } },
    },
    orientation: {
      control: "inline-radio",
      options: ["horizontal", "vertical"],
      description: "Direção da barra. Vertical serve a barras laterais e gavetas móveis.",
      table: { type: { summary: '"horizontal" | "vertical"' }, defaultValue: { summary: '"horizontal"' } },
    },
    onValueChange: {
      control: false,
      description: "Disparado quando o item aberto muda; recebe o identificador do item.",
      table: { type: { summary: "(value: string) => void" } },
    },
  },
  args: {
    defaultValue: "",
    delay: 100,
    closeDelay: 100,
    orientation: "horizontal",
    onValueChange: fn(),
  },
} satisfies Meta<PlaygroundArgs>;

export default meta;
type Story = StoryObj<PlaygroundArgs>;

export const Playground: Story = {
  parameters: {
    covers: [
      "functional.item1",
      "functional.item2",
      "functional.item3",
      "functional.item4",
      "functional.item7",
      "accessibility.item1",
      "accessibility.item2",
      "accessibility.item5",
    ],
  },
  render: (args) => {
    const { defaultValue, delay, closeDelay, orientation, onValueChange } = args;
    return (
      <div style={{ contain: "layout", minHeight: 320, position: "relative" }}>
        <NavigationMenu
          // `defaultValue` só é lido na montagem: sem a chave, mexer no control
          // não muda nada na tela e o control parece quebrado.
          key={`${defaultValue}-${orientation}`}
          aria-label="Navegação principal"
          defaultValue={defaultValue || undefined}
          delay={delay}
          closeDelay={closeDelay}
          orientation={orientation}
          // Só o valor: o segundo argumento da lib carrega o evento nativo, e a
          // aba Actions estoura em SecurityError ao serializar `event.view`.
          onValueChange={(value: string) => onValueChange?.(value)}
        >
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuLink href="#inicio">Início</NavigationMenuLink>
            </NavigationMenuItem>
            <NavigationMenuItem value="produtos">
              <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                  <li>
                    <NavigationMenuLink href="#inicial">Plano Inicial</NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="#profissional">Plano Profissional</NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem value="solucoes">
              <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                  <li>
                    <NavigationMenuLink href="#marketing">Para Marketing</NavigationMenuLink>
                  </li>
                  <li>
                    <NavigationMenuLink href="#vendas">Para Vendas</NavigationMenuLink>
                  </li>
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <NavigationMenuLink href="#sobre">Sobre</NavigationMenuLink>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    );
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const barra = canvas.getByRole("navigation", { name: "Navegação principal" });
    const produtos = canvas.getByRole("button", { name: /Produtos/ });
    const solucoes = canvas.getByRole("button", { name: /Soluções/ });

    await step("A barra é um landmark com nome próprio", async () => {
      // Sem nome, o leitor de tela anuncia só "navegação"; com dois landmarks
      // homônimos na mesma página o axe reprova em landmark-unique.
      await expect(barra.tagName).toBe("NAV");
      await expect(barra).toHaveAttribute("aria-label", "Navegação principal");
    });

    await step("Os destinos da barra são links de verdade", async () => {
      // É o que distingue navegação de menu de comandos: um `<a href>` abre em
      // nova aba, entra no histórico e mostra o destino na barra de status.
      const links = within(barra).getAllByRole("link");
      await expect(links).toHaveLength(2);
      for (const link of links) await expect(link.tagName).toBe("A");
    });

    await step("Fechado, o gatilho anuncia apenas que está recolhido", async () => {
      await expect(produtos).toHaveAttribute("aria-expanded", "false");
      await expect(popupAberto()).toBeNull();
    });

    await step("Setas movem o foco entre os itens da barra", async () => {
      produtos.focus();
      await userEvent.keyboard("{ArrowRight}");
      await waitFor(async () => {
        await expect(document.activeElement).toBe(solucoes);
      });
      await userEvent.keyboard("{ArrowLeft}");
      await waitFor(async () => {
        await expect(document.activeElement).toBe(produtos);
      });
    });

    await step("Enter abre o painel e alcança os destinos pelo teclado", async () => {
      await userEvent.keyboard("{Enter}");
      const painel = await esperarPainel();
      await expect(produtos).toHaveAttribute("aria-expanded", "true");
      await expect(args.onValueChange).toHaveBeenCalledWith("produtos");

      const primeiro = within(painel).getByRole("link", { name: "Plano Inicial" });
      // Alcançável por teclado: nenhum destino do painel sai da ordem de foco.
      await expect(primeiro).not.toHaveAttribute("tabindex", "-1");
      primeiro.focus();
      await expect(document.activeElement).toBe(primeiro);
    });

    await step("Escape fecha e devolve o foco ao gatilho", async () => {
      await userEvent.keyboard("{Escape}");
      await esperarPainelSumir();
      await expect(produtos).toHaveAttribute("aria-expanded", "false");
      // O foco não pode cair no corpo do documento: quem navega por teclado
      // teria de percorrer a página inteira de novo para voltar ao ponto.
      await waitFor(async () => {
        await expect(document.activeElement).toBe(produtos);
      });
    });

    await step("O ponteiro abre o painel sem clique", async () => {
      await userEvent.hover(produtos);
      const painel = await esperarPainel();
      await expect(painel.textContent).toContain("Plano Inicial");
    });

    await step("Passar de um gatilho ao outro troca o painel sem fechá-lo", async () => {
      //  porque a lib bloqueia o ponteiro em tudo que
      // não seja o gatilho ativo e o painel enquanto o cursor atravessa o vão
      // entre os dois (a "grace area"). É guarda transitória, não barreira: o
      // ponteiro de verdade a atravessa em movimento, o do teste chega de uma vez.
      await userEvent.hover(solucoes, { pointerEventsCheck: 0 });
      await waitFor(async () => {
        const painel = document.body.querySelector(".nds-navigation-menu-popup-content");
        await expect(painel?.textContent).toContain("Para Marketing");
      });
      // O popup é um só e nunca desmontou: a troca é instantânea, sem reabrir
      // a espera de hover.
      await expect(popupAberto()).not.toBeNull();
      await expect(solucoes).toHaveAttribute("aria-expanded", "true");
    });

    await step("A barra volta ao repouso ao final", async () => {
      // A story termina fechada de propósito: o axe roda depois da play, e um
      // painel flutuante aberto mediria contraste sobre a página inteira.
      await userEvent.keyboard("{Escape}");
      await esperarPainelSumir();
      await expect(solucoes).toHaveAttribute("aria-expanded", "false");
    });
  },
};
