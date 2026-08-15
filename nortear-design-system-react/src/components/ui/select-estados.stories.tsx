import type { Meta, StoryObj } from "@storybook/react-vite";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
import { medirAnelDeFoco, ESTADOS_POR_VALOR } from "@shared/testing/select-probe";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

const meta = {
  title: "UI/Select/States",
  tags: ["form"],
  component: Select,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    docs: {
      description: {
        component:
          "Estados do Select: Default (placeholder), Open (dropdown aberto), Selected (com valor), Disabled, Invalid (aria-invalid) e Size SM.",
      },
    },
  },
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  parameters: {
    covers: ["visual.item1"],
    docs: {
      description: {
        story:
          "Estado inicial — trigger com placeholder \"Selecione...\" e ChevronDown. aria-expanded=\"false\".",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
      <Select>
        <SelectTrigger aria-label="Selecionar estado">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sp">São Paulo</SelectItem>
          <SelectItem value="rj">Rio de Janeiro</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("Campo fechado, sem seleção", async () => {
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(trigger).toHaveTextContent(/Selecione/);
      // `data-placeholder` é o que faz a folha pintar o texto em cor
      // secundária; sem ele o placeholder teria o peso de um valor escolhido.
      await expect(trigger).toHaveAttribute("data-placeholder");
    });
    await step("A lista não existe enquanto está fechada", async () => {
      // Fechado não é "escondido": o portal desmonta. Uma lista só escondida
      // continuaria no percurso do leitor de tela.
      await expect(within(document.body).queryAllByRole("listbox")).toHaveLength(0);
      await expect(within(document.body).queryAllByRole("option")).toHaveLength(0);
    });
  },
};

export const Selected: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      description: {
        story:
          "Estado com valor pré-escolhido. O rótulo da opção substitui o placeholder — e o rótulo vem do mapa `items`, porque a lista ainda não foi aberta nenhuma vez. (Pré-selecionar serve para ver o estado; em formulário real, evite.)",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
      <Select defaultValue="rj" items={ESTADOS_POR_VALOR}>
        <SelectTrigger aria-label="Selecionar estado">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sp">São Paulo</SelectItem>
          <SelectItem value="rj">Rio de Janeiro</SelectItem>
          <SelectItem value="mg">Minas Gerais</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("O campo exibe o rótulo do valor escolhido", async () => {
      // Sem `items` o campo mostraria "rj": o valor cru, não o rótulo.
      await expect(trigger).toHaveTextContent(/Rio de Janeiro/);
      await expect(trigger).not.toHaveTextContent(/Selecione/);
    });
    await step("O placeholder deixa de valer como estado do campo", async () => {
      await expect(trigger).not.toHaveAttribute("data-placeholder");
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ["visual.item3"],
    docs: {
      description: {
        story:
          "Dropdown aberto após interação. data-state=\"open\" no trigger, role=\"listbox\" no portal. Foco vai ao primeiro item.",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", minHeight: 220, position: "relative" }}>
      <Select>
        <SelectTrigger aria-label="Selecionar estado">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sp">São Paulo</SelectItem>
          <SelectItem value="rj">Rio de Janeiro</SelectItem>
          <SelectItem value="mg">Minas Gerais</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");

    await step("Abrir mostra a lista em portal, e o campo concorda", async () => {
      // Idempotente: o clique só acontece com a lista fechada, então o replay do
      // painel Interactions parte do mesmo estado da primeira rodada — e a story
      // termina ABERTA, que é o estado que ela documenta e o Chromatic fotografa.
      // Idempotente: o clique só acontece com a lista fechada.
      if (trigger.getAttribute("aria-expanded") !== "true") await userEvent.click(trigger);
      const listbox = await waitForPortal("listbox");
      await expect(listbox).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
    });

    await step("A seta para baixo anda um item por vez, e a de cima volta", async () => {
      // O índice de partida vem MEDIDO, não suposto: umas libs já nascem com o
      // primeiro item destacado, outras só destacam quando o teclado entra. O
      // que o item do contrato promete é o passo de um, e é ele que se afirma.
      const listbox = await waitForPortal("listbox");
      const destacada = () =>
        within(listbox)
          .getAllByRole("option")
          .findIndex((o) => o.hasAttribute("data-highlighted"));
      const ultimo = within(listbox).getAllByRole("option").length - 1;

      const partida = destacada();
      await userEvent.keyboard("{ArrowDown}");
      const primeiro = Math.min(partida + 1, ultimo);
      await waitFor(async () => {
        await expect(destacada()).toBe(primeiro);
      });

      await userEvent.keyboard("{ArrowDown}");
      const segundo = Math.min(primeiro + 1, ultimo);
      await waitFor(async () => {
        await expect(destacada()).toBe(segundo);
      });

      await userEvent.keyboard("{ArrowUp}");
      await waitFor(async () => {
        await expect(destacada()).toBe(segundo - 1);
      });
    });
  },
};

export const Disabled: Story = {
  parameters: {
    covers: ["visual.item4"],
    docs: {
      description: {
        story:
          "Trigger desabilitado via prop disabled. opacity-50, cursor-not-allowed; cliques são ignorados e dropdown não abre.",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
      <Select disabled>
        <SelectTrigger aria-label="Selecionar estado" disabled>
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sp">São Paulo</SelectItem>
          <SelectItem value="rj">Rio de Janeiro</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("O campo se anuncia bloqueado", async () => {
      // `disabled` nativo, e não só `aria-disabled`: é o atributo que tira o
      // botão do percurso do Tab e cancela o clique no próprio navegador.
      await expect(trigger).toBeDisabled();
    });
    await step("Clicar não abre a lista", async () => {
      await userEvent.click(trigger, { pointerEventsCheck: 0 });
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(within(document.body).queryAllByRole("listbox")).toHaveLength(0);
    });
  },
};

export const Invalid: Story = {
  parameters: {
    covers: ["visual.item5"],
    docs: {
      description: {
        story:
          "Estado de erro via aria-invalid=\"true\" no trigger. Borda --destructive e anel --destructive/20. Use junto com mensagem auxiliar.",
      },
    },
  },
  render: () => (
    <div
      className="nds-stack" data-spacing="sm"
      style={{ contain: "layout", minHeight: 80, position: "relative" }}
    >
      <Select>
        <SelectTrigger aria-label="Selecionar estado" aria-invalid="true">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sp">São Paulo</SelectItem>
          <SelectItem value="rj">Rio de Janeiro</SelectItem>
        </SelectContent>
      </Select>
      <p className="nds-text-body nds-text-destructive">Selecione um estado para continuar.</p>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("O campo inválido se anuncia como tal", async () => {
      await expect(trigger).toHaveAttribute("aria-invalid", "true");
    });
    await step("Mensagem de erro está visível", async () => {
      await expect(canvas.getByText(/Selecione um estado/)).toBeVisible();
    });
    await step("O anel de erro vem da folha compartilhada", async () => {
      // A story NÃO pinta nada: se a regra `[aria-invalid="true"]` sumir do CSS
      // compartilhado, isto reprova.
      await expect(getComputedStyle(trigger).boxShadow).not.toBe("none");
    });
    await step("Focar o campo inválido continua mostrando o foco", async () => {
      // O anel destrutivo é PERMANENTE e era declarado depois do
      // `:focus-visible` com a mesma especificidade: sem a regra de
      // aninhamento, focar um campo inválido não mudava nada na tela.
      // `boxShadow !== 'none'` passaria mesmo assim — só a MUDANÇA reprova.
      await expect(medirAnelDeFoco(trigger).mudou).toBe(true);
    });
  },
};

export const SizeSm: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Densidade compacta via size=\"sm\" no SelectTrigger. A altura menor vem do padding-block, não de um valor cravado — útil em toolbars, filtros densos ou linhas de tabela.",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", minHeight: 60, position: "relative" }}>
      <Select>
        <SelectTrigger size="sm" aria-label="Selecionar estado">
          <SelectValue placeholder="Selecione..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="sp">São Paulo</SelectItem>
          <SelectItem value="rj">Rio de Janeiro</SelectItem>
          <SelectItem value="mg">Minas Gerais</SelectItem>
        </SelectContent>
      </Select>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("combobox");
    await step("Trigger tem data-size=sm", async () => {
      await expect(trigger).toHaveAttribute("data-size", "sm");
    });
  },
};
