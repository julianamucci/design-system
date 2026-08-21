import type { Meta, StoryObj } from "@storybook/react-vite";
import { within, expect, userEvent } from "storybook/test";
import { toast, type ExternalToast } from "sonner";
import { Toaster, REGION_LABEL } from "./sonner";
import { Button } from "./button";
import { waitForToast, clearToasts, TEXTS, type ToastType } from "./sonner.fixtures";
import { sonnerSource } from "./sonner.source";
import { SonnerDocs } from "@/components/docs/SonnerDocs";
import { withAutoDocsTab } from "@/lib/withAutoDocsTab";

type SonnerArgs = {
  type: ToastType;
  title: string;
  description: string;
  actionLabel: string;
  position: "top-right" | "top-center" | "top-left" | "bottom-right" | "bottom-center" | "bottom-left";
  richColors: boolean;
  closeButton: boolean;
  duration: number;
};

const meta = {
  title: "UI/Sonner",
  tags: ["autodocs", "feedback"],
  parameters: {
    layout: "padded",
    docs: {
      page: withAutoDocsTab(SonnerDocs),
      source: { transform: sonnerSource },
    },
    // A paleta de `richColors` é da lib externa e não passa pelos tokens do
    // tema, então o contraste dela não é auditável aqui — ver
    // PATCHES.md#sonner-rich-colors-contrast. `aria-prohibited-attr`: a lib
    // escreve `<div data-title aria-label>` no markup dela.
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: false },
          { id: "aria-prohibited-attr", enabled: false },
        ],
      },
    },
  },
  argTypes: {
    type: {
      control: "select",
      options: ["default", "success", "error", "warning", "info", "loading"],
      description: "Tipo semântico da notificação. Define ícone e cor.",
    },
    title: { control: "text", description: "Título da notificação. Uma frase, no passado, sem exclamação." },
    description: { control: "text", description: "Complemento opcional ao título, quando o título sozinho não orienta." },
    actionLabel: {
      control: "text",
      description:
        "Rótulo do botão de ação. Vazio remove o botão. A ação oferecida aqui precisa existir em outro lugar também — a notificação some.",
    },
    position: {
      control: "select",
      options: ["top-right", "top-center", "top-left", "bottom-right", "bottom-center", "bottom-left"],
      description: "Canto da tela onde a pilha nasce.",
    },
    richColors: { control: "boolean", description: "Aplica a cor semântica do tema a cada tipo." },
    closeButton: { control: "boolean", description: "Mostra o botão de fechar em todas as notificações." },
    duration: {
      control: { type: "number", min: 500, step: 500 },
      description:
        "Milissegundos até o fechamento automático. O relógio congela enquanto o ponteiro estiver dentro da região.",
    },
  },
  args: {
    type: "success",
    title: TEXTS.sucesso,
    description: "",
    actionLabel: "",
    position: "top-right",
    richColors: true,
    closeButton: false,
    duration: 4000,
  },
} satisfies Meta<SonnerArgs>;

export default meta;
type Story = StoryObj<SonnerArgs>;

export const Playground: Story = {
  parameters: {
    covers: ["accessibility.item1", "accessibility.item3"],
  },
  render: (args) => {
    const fire = () => {
      const options: ExternalToast = {};
      if (args.description) options.description = args.description;
      if (args.actionLabel) {
        options.action = { label: args.actionLabel, onClick: () => undefined };
      }
      if (args.type === "default") toast(args.title, options);
      else toast[args.type](args.title, options);
    };

    return (
      <div className="nds-stack" data-spacing="md" style={{ contain: "layout", position: "relative", minHeight: 120 }}>
        <Button variant="outline" onClick={fire}>
          Disparar notificação
        </Button>

        {/* O prazo vem da região, e não de cada `toast()`: é o mesmo caminho que
            o teste usa para encurtar o tempo sem depender do relógio real. */}
        <Toaster
          position={args.position}
          richColors={args.richColors}
          closeButton={args.closeButton}
          duration={args.duration}
        />
      </div>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Cada play estabelece a própria precondição: o painel Interactions
    // reexecuta a função no mesmo DOM, sem remontar.
    await clearToasts();

    await step("O disparo desenha a notificação na região do Toaster", async () => {
      await userEvent.click(canvas.getByRole("button", { name: "Disparar notificação" }));
      const toastEl = await waitForToast({ type: "success", text: TEXTS.sucesso });
      const list = document.querySelector<HTMLElement>("[data-sonner-toaster]")!;
      await expect(list.contains(toastEl)).toBe(true);
      await expect(list).toHaveAttribute("data-y-position", "top");
      await expect(list).toHaveAttribute("data-x-position", "right");
    });

    await step("A notificação é anunciada sem interromper a leitura em curso", async () => {
      // accessibility.item1 — nesta stack a lib põe UMA região viva em volta da
      // pilha inteira (`<section aria-live="polite">`), em vez de marcar cada
      // notificação. `polite` é a escolha, não o default: `assertive` cortaria a
      // leitura para avisar que algo deu certo, o que é hostil justamente com
      // quem depende do leitor de tela.
      const toastEl = await waitForToast({ type: "success" });
      const liveRegion = toastEl.closest<HTMLElement>("[aria-live]")!;
      await expect(liveRegion).toHaveAttribute("aria-live", "polite");
      await expect(liveRegion.getAttribute("aria-live")).not.toBe("assertive");
    });

    await step("A região tem nome acessível e é alcançável a qualquer momento", async () => {
      // Um marco de página nomeado: o leitor de tela chega até as notificações
      // pela lista de regiões, e não só no instante em que elas são anunciadas.
      // A lib acrescenta o atalho ao nome, então a comparação é por prefixo.
      const toastEl = await waitForToast({ type: "success" });
      const liveRegion = toastEl.closest<HTMLElement>("[aria-live]")!;
      await expect(liveRegion.getAttribute("aria-label")).toContain(REGION_LABEL);
    });

    await step("O ícone é decorativo — o texto já descreve o estado", async () => {
      // accessibility.item3 — o tipo e o título dizem tudo; anunciar o ícone
      // faria o leitor ler "imagem" antes de cada notificação.
      const toastEl = await waitForToast({ type: "success" });
      const icon = toastEl.querySelector<SVGSVGElement>("[data-icon] svg")!;
      await expect(icon).toHaveAttribute("aria-hidden", "true");
      await expect(icon.childElementCount).toBeGreaterThan(0);
    });

    // Termina com a tela limpa: uma notificação com prazo correndo estaria no
    // meio do fade quando o axe medisse contraste, e ~1.0 num elemento em
    // transição parece paleta ruim sem ser.
    await clearToasts();
  },
};
