import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, waitFor, screen } from "storybook/test";
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { Button } from "./button";
import {
  popoverOpenSource,
  popoverControlledSource,
  popoverModalSource,
  popoverSource,
} from "./popover.source";

const meta = {
  title: "Primitives/Overlay/Popover/States",
  tags: ["overlay"],
  component: Popover,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      source: { transform: popoverSource },
      description: {
        component:
          "Estados canônicos do Popover: Closed (apenas trigger), Open (defaultOpen), Controlado (open + onOpenChange) e Modal (foco trapeado).",
      },
    },
  },
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A altura mínima sai da escada de utilitárias, não de um valor cravado:
 *  inline vence a folha, e a medida sairia do tema e da densidade junto. */
const wrapperClass = "nds-min-h-70";
const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  position: "relative",
};

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado inicial — defaultOpen=false. Conteúdo desmontado; portal vazio (nenhum role=dialog no DOM).",
      },
    },
  },
  render: () => (
    <div className={wrapperClass} style={wrapperStyle}>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline">Abrir popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverTitle>Conteúdo oculto</PopoverTitle>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Apenas trigger visível, dialog ausente", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir popover/i });
      await expect(trigger).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      const dialog = screen.queryByRole("dialog");
      await expect(dialog).toBeNull();
    });
  },
};

export const Open: Story = {
  parameters: {
    // Story SEM interação de fechamento: termina aberta de propósito, porque é
    // este estado que o axe varre (ARIA e contraste do painel) e que o
    // Chromatic fotografa. Declarar os itens de axe numa story que fecha no
    // final seria declarar cobertura que não existe.
    covers: ["accessibility.item1", "accessibility.item2"],
    docs: {
      // `defaultOpen` é o estado que a story afirma no `render`; o meta imprime
      // o painel fechado, que é o padrão do componente.
      source: { transform: popoverOpenSource },
      description: {
        story:
          "Popover aberto via defaultOpen — Content visível com role=dialog. Foco move ao primeiro elemento focável.",
      },
    },
  },
  render: () => (
    <div className={wrapperClass} style={wrapperStyle}>
      <Popover defaultOpen>
        <PopoverTrigger asChild>
          <Button variant="outline">Abrir popover</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Configuracoes de exibição</PopoverTitle>
            <PopoverDescription>
              Ajuste a aparência do conteúdo da página.
            </PopoverDescription>
          </PopoverHeader>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Content aberto com role=dialog", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveClass(/nds-popover-content/);
    });

    await step("E o gatilho declara o estado aberto", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir popover/i });
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      // Aberto, `aria-controls` aponta para o painel que existe de fato —
      // apontar para id ausente reprova em aria-valid-attr-value.
      const id = trigger.getAttribute("aria-controls");
      await expect(id).toBeTruthy();
      await expect(document.getElementById(id!)).toBeInTheDocument();
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      // Abertura controlada por `useState` de fora, com dois botões externos —
      // sub-composição que o snippet do meta não tem como mostrar.
      source: { transform: popoverControlledSource },
      description: {
        story:
          "Estado controlado via open + onOpenChange. Botões externos abrem e fecham programaticamente.",
      },
    },
  },
  render: () => {
    const ControlledDemo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className={`nds-stack ${wrapperClass}`} data-spacing="sm" style={wrapperStyle}>
          <div className="nds-cluster" data-spacing="md">
            <Button onClick={() => setOpen(true)}>Abrir externamente</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar externamente
            </Button>
          </div>
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">Trigger</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Estado controlado</PopoverTitle>
                <PopoverDescription>
                  Aberto/fechado via prop open.
                </PopoverDescription>
              </PopoverHeader>
            </PopoverContent>
          </Popover>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    const trigger = () => canvas.getByRole("button", { name: /^Trigger$/i });

    await step("Botão externo abre o Popover", async () => {
      // Cada passo estabelece a própria precondição: no replay do painel
      // Interactions o DOM chega no estado que a rodada anterior deixou.
      const closeBtn = canvas.getByRole("button", { name: /Fechar externamente/i });
      await userEvent.click(closeBtn);
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

      const openBtn = canvas.getByRole("button", { name: /Abrir externamente/i });
      await userEvent.click(openBtn);
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
      await expect(trigger()).toHaveAttribute("aria-expanded", "true");
    });

    await step("Botão externo fecha o Popover", async () => {
      const closeBtn = canvas.getByRole("button", { name: /Fechar externamente/i });
      await userEvent.click(closeBtn);
      await waitFor(
        () => {
          const dialog = screen.queryByRole("dialog");
          if (dialog) throw new Error("ainda aberto");
        },
        { timeout: 1500 }
      );
      await expect(trigger()).toHaveAttribute("aria-expanded", "false");
    });

    // Termina ABERTA: é o estado que o Chromatic fotografa.
    await step("Estado final: aberto pelo estado externo", async () => {
      await userEvent.click(canvas.getByRole("button", { name: /Abrir externamente/i }));
      await expect(await waitFor(() => screen.getByRole("dialog"))).toBeVisible();
    });
  },
};

export const Modal: Story = {
  parameters: {
    docs: {
      // `modal` vem do `render`, sem control neste arquivo: é ele que prende o
      // foco e bloqueia a rolagem enquanto o painel está aberto.
      source: { transform: popoverModalSource },
      description: {
        story:
          "Modo modal — o foco fica preso no painel, a rolagem da página trava e o painel se anuncia como diálogo modal. As três coisas andam juntas: anunciar inércia sem prender o foco engana quem navega por leitor de tela.",
      },
    },
  },
  render: () => (
    <div className={wrapperClass} style={wrapperStyle}>
      <Popover defaultOpen modal>
        <PopoverTrigger asChild>
          <Button variant="outline">Abrir modal</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverHeader>
            <PopoverTitle>Popover modal</PopoverTitle>
            <PopoverDescription>
              O foco fica preso no painel enquanto ele está aberto.
            </PopoverDescription>
          </PopoverHeader>
          {/* DOIS focáveis de propósito: com um só, "o Tab do último volta ao
              primeiro" seria verdade sem laço nenhum, porque primeiro e último
              seriam o mesmo elemento. */}
          <div className="nds-cluster nds-pt-1" data-justify="end">
            <Button variant="ghost" size="sm">
              Cancelar
            </Button>
            <Button size="sm">OK</Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  ),
  play: async ({ step }) => {
    await step("Dialog aberto em modo modal", async () => {
      const dialog = await waitFor(() => screen.getByRole("dialog"));
      await expect(dialog).toBeVisible();
    });

    await step("O painel anuncia aria-modal", async () => {
      // Tem dentes nos DOIS sentidos: reprova se alguém anunciar `aria-modal`
      // sem prender o foco (era o defeito antigo desta família) e reprova se o
      // modo modal deixar de anunciar.
      await expect(screen.getByRole("dialog")).toHaveAttribute("aria-modal", "true");
    });

    await step("Tab a partir do último focável NÃO sai do painel", async () => {
      // ─── A asserção com CONTROLE NEGATIVO ───────────────────────────────
      //
      // A versão anterior deste passo provava a prisão com
      // `dialog.contains(document.activeElement)` SEM tabular. Aquilo é
      // verdadeiro no modo não-modal também — o foco entrar no painel é o
      // contrato `functional.item1`, cumprido pelas cinco stacks —, então a
      // asserção não podia reprovar: é a forma exata da asserção que guarda o
      // bug.
      //
      // O controle negativo de verdade é este: partir do ÚLTIMO focável e
      // apertar Tab. Não-modal, o foco SAI do painel e esta asserção reprova;
      // modal, ele volta ao primeiro. É a mesma tecla que separa os dois modos,
      // e por isso a asserção mede o modo e não o contrato comum.
      const dialog = screen.getByRole("dialog");
      const cancelar = within(dialog).getByRole("button", { name: /Cancelar/i });
      const ok = within(dialog).getByRole("button", { name: /^OK$/i });

      ok.focus();
      await expect(ok).toHaveFocus();

      await userEvent.tab();

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(cancelar).toHaveFocus();
    });

    await step("E Shift+Tab a partir do primeiro volta ao último", async () => {
      const dialog = screen.getByRole("dialog");
      const cancelar = within(dialog).getByRole("button", { name: /Cancelar/i });
      const ok = within(dialog).getByRole("button", { name: /^OK$/i });

      cancelar.focus();
      await userEvent.tab({ shift: true });

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(ok).toHaveFocus();
    });
  },
};
