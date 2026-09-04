import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "storybook/test";
import { Separator } from "./separator";
import { separatorSource, separatorVerticalSource } from "./separator.source";

const meta = {
  title: "Components/Layout/Separator/Variants",
  tags: ["layout"],
  component: Separator,
  parameters: {
    layout: "padded",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: separatorSource },
      description: {
        component:
          "Orientações do Separator. A horizontal é uma linha de 1px de altura que ocupa a largura do contêiner; a vertical é uma linha de 1px de largura cuja altura vem do contêiner flex ou de grade, sem medida cravada.",
      },
    },
  },
} satisfies Meta<typeof Separator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  parameters: { covers: ["functional.item1", "visual.item1"] },
  render: () => (
    <div className="nds-stack nds-w-md" data-spacing="md">
      <div className="nds-text-body">
        <p className="nds-font-medium">Configurações da conta</p>
        <p className="nds-text-muted-foreground">Gerencie seu nome e e-mail.</p>
      </div>
      <Separator orientation="horizontal" />
      <div className="nds-text-body">
        <p className="nds-font-medium">Preferências</p>
        <p className="nds-text-muted-foreground">Tema, idioma e notificações.</p>
      </div>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const wrap = canvasElement.querySelector<HTMLElement>(".nds-stack")!;
    const sep = wrap.querySelector<HTMLElement>(".nds-separator");

    await step("A orientação horizontal chega ao DOM", async () => {
      await expect(sep).toBeInTheDocument();
      await expect(sep).toHaveAttribute("data-orientation", "horizontal");
    });

    await step("Linha fina na altura e cheia na largura", async () => {
      // O que o horizontal promete é linha cheia e fina. Medir os dois evita
      // que uma troca de folha passe com o atributo certo e o visual errado.
      const box = sep!.getBoundingClientRect();
      await expect(box.height).toBeCloseTo(1, 1);
      await expect(box.width).toBeCloseTo(wrap.getBoundingClientRect().width, 0);
    });
  },
};

export const Vertical: Story = {
  parameters: {
    covers: ["functional.item2", "visual.item2"],
    docs: {
      // A orientação vertical não vem de control neste arquivo, e só se sustenta
      // dentro de uma linha de flex — o meta imprime a composição empilhada.
      source: { transform: separatorVerticalSource },
    },
  },
  render: () => (
    <div className="nds-cluster nds-docs-demo-row nds-w-md" data-spacing="md">
      <span className="nds-text-body">Blog</span>
      <Separator orientation="vertical" />
      <span className="nds-text-body">Documentação</span>
      <Separator orientation="vertical" />
      <span className="nds-text-body">Contato</span>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const seps = canvasElement.querySelectorAll<HTMLElement>(".nds-separator");

    await step("As duas linhas verticais chegam ao DOM", async () => {
      await expect(seps).toHaveLength(2);
      await expect(seps[0]).toHaveAttribute("data-orientation", "vertical");
    });

    await step("Linha fina na largura e esticada na altura, sem medida cravada", async () => {
      // Este é o caso que a asserção antiga jamais pegaria: o separador vertical
      // colapsa para 0px quando o contêiner não é flex nem grade, e continua
      // presente no DOM com o atributo certo. Medir a altura é o que denuncia.
      const box = seps[0].getBoundingClientRect();
      await expect(box.width).toBeCloseTo(1, 1);
      await expect(box.height).toBeGreaterThan(8);
      await expect(seps[0].style.height).toBe("");
    });
  },
};
