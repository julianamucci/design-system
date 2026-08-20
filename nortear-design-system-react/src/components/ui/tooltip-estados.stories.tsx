import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, waitFor, screen } from "storybook/test";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./tooltip";
import { balaoDe } from "./tooltip.fixtures";
import { Button } from "./button";
import { Save } from "lucide-react";
import {
  tooltipAbertoSource,
  tooltipComAtrasoSource,
  tooltipControladoSource,
  tooltipPersistenteSource,
  tooltipSource,
} from "./tooltip.source";

// Os estados que o conteúdo compartilhado descreve: fechado (o inicial), aberto,
// aberto por hover (depois do delay do provider) e aberto por foco (na hora). A
// diferença entre os dois últimos é o que a WCAG 1.4.13 cobra: o tooltip não
// pode depender do mouse.

/** Espera em ms que o hover do provider precisa vencer nas stories de delay. */
const DELAY_LONGO = 600;

/** Pausa explícita — usada só onde a asserção é "continua assim depois de X". */
function espera(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

const meta = {
  title: "UI/Tooltip/States",
  tags: ["overlay"],
  component: Tooltip,
  decorators: [
    (Story) => (
      <TooltipProvider delay={0}>
        <Story />
      </TooltipProvider>
    ),
  ],
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: tooltipSource },
      description: {
        component:
          "Fechado é o padrão e o balão nem existe no DOM. Aberto pode vir do estado externo, do hover (depois do delay) ou do foco (imediato). Levar o mouse do gatilho até o balão não fecha nada — é a persistência que a WCAG 1.4.13 exige.",
      },
    },
  },
} satisfies Meta<typeof Tooltip>;

export default meta;
type Story = StoryObj<typeof meta>;

const wrapperStyle: React.CSSProperties = {
  contain: "layout",
  minHeight: 150,
  position: "relative",
};

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado padrão — apenas o trigger renderizado; portal vazio (nenhum role=tooltip no DOM).",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent>Salvar</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole("button", { name: /Salvar/i });

    await step("O balão não está no DOM, nem no canvas nem no portal", async () => {
      await expect(gatilho).toBeVisible();
      await expect(document.querySelector('[data-slot="tooltip-content"]')).toBeNull();
      await expect(screen.queryByRole("tooltip")).toBeNull();
    });

    await step("Sem balão, não há describedby apontando para o vazio", async () => {
      // Um `aria-describedby` para um id ausente é violação de
      // `aria-valid-attr-value` — o mesmo axe que roda no addon-a11y da story.
      await expect(gatilho.getAttribute("aria-describedby")).toBeNull();
    });
  },
};

export const Open: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Tooltip aberto via defaultOpen — Content visível com role=tooltip e aria-describedby ligando trigger ao conteúdo.",
      },
      // O estado inicial aberto é o assunto, e não cabe nos args deste arquivo.
      source: { transform: tooltipAbertoSource },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Tooltip defaultOpen>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
              <Save aria-hidden="true" />
            </Button>
          )}
        />
        <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole("button", { name: /Salvar/i });

    await step("O estado inicial abre o balão sem interação nenhuma", async () => {
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      const balao = balaoDe(gatilho)!;
      await expect(balao).toHaveAttribute("role", "tooltip");
      await expect(balao).toHaveAttribute("data-slot", "tooltip-content");
      await waitFor(async () => {
        await expect(balao).toBeVisible();
      });
    });

    await step("E o gatilho passa a apontar para ele", async () => {
      await expect(
        document.getElementById(gatilho.getAttribute("aria-describedby")!),
      ).toBe(balaoDe(gatilho));
    });
  },
};

export const Hover: Story = {
  parameters: {
    covers: ["functional.item1"],
    docs: {
      description: {
        story:
          "Hover no trigger com delay longo — o balão só abre depois da espera do Provider. É o delay que separa passar o mouse de parar sobre o elemento.",
      },
      // O atraso é a lição, e ele mora no provider — fora da raiz do Tooltip.
      source: { transform: tooltipComAtrasoSource },
    },
  },
  render: () => (
    // Provider próprio: o delay do decorator é 0, e sem espera não há o que medir.
    <TooltipProvider delay={DELAY_LONGO}>
      <div style={wrapperStyle}>
        <Tooltip>
          <TooltipTrigger
            delay={DELAY_LONGO}
            render={(props) => (
              <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
                <Save aria-hidden="true" />
              </Button>
            )}
          />
          <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole("button", { name: /Salvar/i });

    await step("O mouse passando não abre — o delay separa passar de parar", async () => {
      await userEvent.hover(gatilho);
      await expect(balaoDe(gatilho)).toBeNull();
    });

    await step("Parado sobre o gatilho, o balão abre depois do delay", async () => {
      await waitFor(
        async () => {
          await expect(balaoDe(gatilho)).not.toBeNull();
        },
        { timeout: DELAY_LONGO * 5 },
      );
      await expect(balaoDe(gatilho)).toHaveAttribute("role", "tooltip");
    });
  },
};

export const Focused: Story = {
  parameters: {
    covers: ["functional.item2"],
    docs: {
      description: {
        story:
          "Foco via teclado — WCAG 1.4.13. O foco abre o tooltip sem hover e sem esperar o delay; sair do trigger fecha.",
      },
      // Mesma montagem do atraso: o que a story afirma é que o foco a ignora.
      source: { transform: tooltipComAtrasoSource },
    },
  },
  render: () => (
    // Delay longo de propósito: quem chega por teclado não tem como "parar em
    // cima", então esperar aqui esconderia a informação de quem não usa mouse.
    <TooltipProvider delay={DELAY_LONGO}>
      <div style={wrapperStyle}>
        <Tooltip>
          <TooltipTrigger
            delay={DELAY_LONGO}
            render={(props) => (
              <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
                <Save aria-hidden="true" />
              </Button>
            )}
          />
          <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole("button", { name: /Salvar/i });

    await step("O foco abre na hora, mesmo com o provider pedindo espera", async () => {
      gatilho.blur();
      gatilho.focus();
      await expect(gatilho).toHaveFocus();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(balaoDe(gatilho)).toHaveAttribute("role", "tooltip");
    });

    await step("Sair do gatilho fecha o balão", async () => {
      gatilho.blur();
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).toBeNull();
      });
    });
  },
};

export const PersistenceInBubble: Story = {
  parameters: {
    covers: ["functional.item4"],
    docs: {
      description: {
        story:
          "Levar o ponteiro do trigger até o balão não fecha nada — a área de tolerância entre os dois é o que a WCAG 1.4.13 (Hoverable) exige.",
      },
      // Gatilho com texto, e não só-ícone: aqui o balão acrescenta, não nomeia.
      source: { transform: tooltipPersistenteSource },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Tooltip>
        <TooltipTrigger
          render={(props) => (
            <Button {...props} variant="outline">
              Compartilhar
            </Button>
          )}
        />
        <TooltipContent side="bottom">
          Cria um link público de leitura
        </TooltipContent>
      </Tooltip>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const gatilho = canvas.getByRole("button", { name: /Compartilhar/i });

    await step("O hover abre o balão", async () => {
      await userEvent.hover(gatilho);
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
    });

    await step("Levar o ponteiro até o balão não fecha nada", async () => {
      const balao = balaoDe(gatilho)!;
      // `pointerEventsCheck: 0` porque a folha compartilhada deixa o balão
      // `pointer-events: none` — quem segura a abertura é a área de tolerância
      // entre gatilho e balão, calculada por coordenada, não por hover no nó.
      await userEvent.hover(balao, { pointerEventsCheck: 0 });
      await espera(200);
      await expect(balaoDe(gatilho)).not.toBeNull();
    });
  },
};

export const Controlled: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado controlado via open + onOpenChange. Botões externos abrem e fecham programaticamente.",
      },
      // O painel imprimia `<ControlledDemo />`, que não existe fora da story.
      source: { transform: tooltipControladoSource },
    },
  },
  render: () => {
    const ControlledDemo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="nds-stack" data-spacing="sm" style={wrapperStyle}>
          <div className="nds-cluster" data-spacing="sm">
            <Button onClick={() => setOpen(true)}>Abrir externamente</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar externamente
            </Button>
          </div>
          <Tooltip open={open} onOpenChange={setOpen}>
            <TooltipTrigger
              render={(props) => (
                <Button {...props} variant="ghost" size="icon" aria-label="Salvar">
                  <Save aria-hidden="true" />
                </Button>
              )}
            />
            <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
          </Tooltip>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    // Dois botões, e não um só que alterna: o `pointerdown` do clique fora
    // dispensa o balão ANTES do `click`, então um toggle leria o estado já
    // invertido pela lib e reabriria o que acabou de fechar.
    await step("Botão externo abre o Tooltip", async () => {
      const abrir = canvas.getByRole("button", { name: /Abrir externamente/i });
      await userEvent.click(abrir);
      const gatilho = canvas.getByRole("button", { name: /Salvar/i });
      await waitFor(async () => {
        await expect(balaoDe(gatilho)).not.toBeNull();
      });
      await expect(balaoDe(gatilho)).toHaveAttribute("role", "tooltip");
    });

    await step("Botão externo fecha o Tooltip", async () => {
      const fechar = canvas.getByRole("button", { name: /Fechar externamente/i });
      await userEvent.click(fechar);
      await waitFor(async () => {
        await expect(screen.queryByRole("tooltip")).toBeNull();
      });
    });
  },
};
