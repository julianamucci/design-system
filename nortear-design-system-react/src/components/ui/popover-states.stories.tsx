import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, waitFor, screen } from "storybook/test";
import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";
import { popoverCloseReason } from "./popover-close-reason";
import { Button } from "./button";
import { Checkbox } from "./checkbox";
import {
  popoverCloseSource,
  popoverOpenSource,
  popoverControlledSource,
  popoverModalSource,
  popoverSource,
} from "./popover.source";

import { figmaDesign } from "@shared/figma/design-links";
const meta = {
  title: "Components/Overlay/Popover/States",
  tags: ["overlay"],
  component: Popover,
  parameters: {
    design: figmaDesign("popover"),
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
            <PopoverTitle>Configurações de exibição</PopoverTitle>
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

export const CloseButton: Story = {
  parameters: {
    docs: {
      source: { transform: popoverCloseSource },
      description: {
        story:
          "Controle de fechar dentro do painel. Ele fecha por um caminho PRÓPRIO: o motivo que chega ao callback de mudança é o do botão de fechar, e não o de fechamento por código — é essa diferença que separa, no relatório, quem desistiu de quem concluiu.",
      },
    },
  },
  render: () => {
    const CloseDemo = () => {
      // O motivo TRADUZIDO, escrito na tela: é o que deixa a asserção medir o
      // que o produto consumiria, e não o jargão cru da lib. Sem o parágrafo, o
      // ramo `close-press` só existiria na tabela do teste de unidade — nenhuma
      // story desta stack conseguia produzi-lo antes de 2026-09-12.
      const [reason, setReason] = useState("—");
      // CONTROLADO por causa do Salvar: confirmar fecha por CÓDIGO, e código só
      // tem como fechar se o estado for de quem compõe.
      const [open, setOpen] = useState(true);
      return (
        <div className={`nds-stack ${wrapperClass}`} data-spacing="sm" style={wrapperStyle}>
          <Popover
            open={open}
            onOpenChange={(next, details) => {
              setOpen(next);
              if (!next) setReason(popoverCloseReason(details?.reason));
            }}
          >
            <PopoverTrigger asChild>
              <Button variant="outline">Abrir popover</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Configurações de exibição</PopoverTitle>
                <PopoverDescription>
                  Ajuste a aparência do conteúdo da página.
                </PopoverDescription>
              </PopoverHeader>
              {/* Os DOIS ramos, lado a lado — é isto que esta story existe para
                  mostrar. O Cancelar é a peça de fechar e produz `close-button`;
                  o Salvar fecha por código, como um formulário faz depois de
                  salvar, e produz `api`. Até 2026-09-13 os dois eram
                  `PopoverClose`, e a story que promete separar desistiu de
                  concluiu media a mesma coisa duas vezes. */}
              <div className="nds-cluster" data-justify="end" data-spacing="sm">
                <PopoverClose asChild>
                  <Button variant="ghost" size="sm">Cancelar</Button>
                </PopoverClose>
                <Button
                  size="sm"
                  onClick={() => { setOpen(false); setReason(popoverCloseReason(undefined)); }}
                >Salvar</Button>
              </div>
            </PopoverContent>
          </Popover>
          <p className="nds-text-caption nds-text-muted-foreground" data-testid="motivo">
            {reason}
          </p>
        </div>
      );
    };
    return <CloseDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = () => canvas.getByRole("button", { name: /Abrir popover/i });
    const reasonText = () => canvas.getByTestId("motivo").textContent;

    const openPanel = async () => {
      if (trigger().getAttribute("aria-expanded") !== "true") {
        await userEvent.click(trigger());
      }
      return waitFor(() => screen.getByRole("dialog"));
    };

    await step("Clicar no controle de fechar fecha o painel", async () => {
      const dialog = await openPanel();
      await userEvent.click(within(dialog).getByRole("button", { name: /Cancelar/i }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await expect(trigger()).toHaveAttribute("aria-expanded", "false");
    });

    await step("E o motivo que chega ao callback é o do botão de fechar", async () => {
      // A asserção que não existia. Antes de a peça existir, o ramo `close-press`
      // do `popoverCloseReason` era inalcançável desta stack: nenhuma story tinha
      // como produzi-lo, e o teste de unidade só provava a TABELA, nunca a fiação.
      await expect(reasonText()).toBe("close-button");
    });

    await step("E o Salvar fecha pelo OUTRO caminho, com motivo `api`", async () => {
      // O par que dá sentido ao passo anterior. Sem ele, "close-button" seria
      // apenas o que o painel sempre responde, e a distinção que justifica o
      // campo — desistiu × concluiu — não estaria medida em lugar nenhum.
      const dialog = await openPanel();
      await userEvent.click(within(dialog).getByRole("button", { name: /Salvar/i }));
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await expect(reasonText()).toBe("api");
    });

    await step("Controle negativo: Escape fecha pelo outro caminho", async () => {
      // Sem este passo, um `close-button` cravado no lugar da tradução passaria.
      await openPanel();
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await expect(reasonText()).toBe("escape");
    });

    // Termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step("Estado final: painel aberto", async () => {
      await expect(await openPanel()).toBeVisible();
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
          {/* A lista de opções NÃO usa `PopoverClose`, e a ausência é o
              assunto: o gerenciador de foco do Base UI só trapeia com
              `modal !== false && hasClosePart`, e `hasClosePart` conta os
              controles de fechar registrados dentro do painel. Com um deles
              aqui, quem prenderia o foco seria a lib, e esta story mediria a
              lib — não o laço de tabulação do `PopoverContent`, que é o que
              sustenta o contrato de `modal` quando a composição não tem botão
              de fechar.

              CAIXAS DE MARCAÇÃO, e não um par Cancelar/OK: até 2026-09-13 esta
              story publicava um rodapé com dois botões que não faziam nada —
              eles não podiam fechar (seria a lib trapeando o foco) e assim
              prometiam na tela uma ação que nenhum dos dois entregava. A caixa
              é o controle que se basta: marcar JÁ é o efeito.

              DOIS focáveis de propósito: com um só, "o Tab do último volta ao
              primeiro" seria verdade sem laço nenhum, porque primeiro e último
              seriam o mesmo elemento. */}
          <div className="nds-stack nds-pt-1" data-spacing="sm">
            <div className="nds-cluster" data-spacing="sm">
              <Checkbox id="popover-modal-remember" />
              <label htmlFor="popover-modal-remember" className="nds-label">
                Lembrar minha escolha
              </label>
            </div>
            <div className="nds-cluster" data-spacing="sm">
              <Checkbox id="popover-modal-email-notice" />
              <label htmlFor="popover-modal-email-notice" className="nds-label">
                Receber aviso por e-mail
              </label>
            </div>
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
      const remember = within(dialog).getByRole("checkbox", {
        name: /Lembrar minha escolha/i,
      });
      const emailNotice = within(dialog).getByRole("checkbox", {
        name: /Receber aviso por e-mail/i,
      });

      emailNotice.focus();
      await expect(emailNotice).toHaveFocus();

      await userEvent.tab();

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(remember).toHaveFocus();
    });

    await step("E Shift+Tab a partir do primeiro volta ao último", async () => {
      const dialog = screen.getByRole("dialog");
      const remember = within(dialog).getByRole("checkbox", {
        name: /Lembrar minha escolha/i,
      });
      const emailNotice = within(dialog).getByRole("checkbox", {
        name: /Receber aviso por e-mail/i,
      });

      remember.focus();
      await userEvent.tab({ shift: true });

      await expect(dialog.contains(document.activeElement)).toBe(true);
      await expect(emailNotice).toHaveFocus();
    });
  },
};
