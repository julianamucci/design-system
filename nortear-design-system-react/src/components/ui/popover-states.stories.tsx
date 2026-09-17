import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, waitFor, screen, fn } from "storybook/test";
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
import { open, panel } from "./popover.fixtures";
import {
  popoverCloseSource,
  popoverFocusedSource,
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

/**
 * O que a trava de rolagem escreve, e onde.
 *
 * A lib tranca o elemento que de fato rola a viewport — `<html>` quando ele é o
 * container, `<body>` caso contrário — e escreve INLINE. Ler o estilo inline, e
 * não o computado, é o que separa a trava do componente de um `overflow` que a
 * folha da página já tivesse: com o computado, uma página trancada por CSS
 * faria a asserção passar sem o componente ter feito nada.
 *
 * Mesma forma do `sheet-states.stories.tsx`, que é onde ela nasceu.
 */
function inlineOverflow(): string[] {
  return [document.documentElement.style.overflowY, document.body.style.overflowY];
}

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
      // Os DOIS contratos de estado, como nas outras quatro stacks: o de ARIA e
      // o de markup. Esta stack era a única sem `data-state` — a base-ui
      // publica `data-popup-open`, que a tabela de Estados do conteúdo
      // compartilhado não fala.
      await expect(trigger).toHaveAttribute("data-state", "closed");
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
      await expect(dialog).toHaveAttribute("data-state", "open");
    });

    await step("E o gatilho declara o estado aberto", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir popover/i });
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
      await expect(trigger).toHaveAttribute("data-state", "open");
      // Aberto, `aria-controls` aponta para o painel que existe de fato —
      // apontar para id ausente reprova em aria-valid-attr-value.
      const id = trigger.getAttribute("aria-controls");
      await expect(id).toBeTruthy();
      // `.toBe(panel())`, e não `toBeInTheDocument()`: se `getElementById`
      // resolveu, o elemento JÁ está no documento — a asserção antiga repetia a
      // premissa da anterior e não tinha como reprovar. O que precisa ser
      // verdade é que o id aponte para O PAINEL, e não para outro elemento
      // qualquer da página. É a forma que vanilla, vue e angular já usavam.
      await expect(document.getElementById(id!)).toBe(panel());
    });
  },
};

/** Espera de RELÓGIO para as asserções de "um anúncio só" — ver a `Focused`. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 150));

/**
 * Espião do `onOpenChange` da `Controlled`, no MÓDULO: a play conta os anúncios
 * por ele, e um espião no módulo não re-renderiza nada ao gravar.
 */
const controlledOpenChange = fn();

/** A política do consumidor da `Controlled`: com `refuse`, o fechamento não é aplicado. */
const controlledPolicy = { refuse: false };

function controlledCloseCount(): number {
  return controlledOpenChange.mock.calls.filter(([isOpen]) => isOpen === false).length;
}

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
          {/* O consumidor pode RECUSAR: com `controlledPolicy.refuse`, o
              fechamento é anunciado ao espião e NÃO é aplicado — e nada
              re-renderiza. O espião é do módulo, e não estado: gravar o motivo
              num `useState` re-renderizaria a raiz e esconderia justamente o
              caso que o passo mede. */}
          <Popover
            open={open}
            onOpenChange={(next, details) => {
              controlledOpenChange(next, next ? undefined : popoverCloseReason(details?.reason));
              if (!next && controlledPolicy.refuse) return;
              setOpen(next);
            }}
          >
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

    await step("No modo controlado, o foco levado para fora anuncia o fechamento uma vez, e o pedido seguinte também é anunciado", async () => {
      // O consumidor RECUSA: o fechamento é anunciado e não aplicado, e a raiz
      // não re-renderiza. É o caso em que o `closedRef` do `Popover` — que
      // cancela o segundo fechamento de um mesmo gesto — não pode ficar armado e
      // engolir o pedido SEGUINTE em silêncio. `focus()`, e não clique: o único
      // caminho aqui é o foco.
      await userEvent.click(canvas.getByRole("button", { name: /Abrir externamente/i }));
      const p = await waitFor(() => screen.getByRole("dialog"));
      const outside = canvas.getByRole("button", { name: /Abrir externamente/i });
      p.focus();
      await expect(p.contains(document.activeElement)).toBe(true);
      controlledPolicy.refuse = true;
      try {
        const closesBefore = controlledCloseCount();

        outside.focus();
        // Espera de RELÓGIO antes de contar: `waitFor` não prova que um segundo
        // anúncio NÃO chegou.
        await settle();
        await expect(controlledCloseCount()).toBe(closesBefore + 1);
        await expect(controlledOpenChange).toHaveBeenLastCalledWith(false, "overlay");
        // Recusado: o painel continua de pé.
        await expect(panel()).not.toBeNull();

        // Repete a perda de foco: o foco volta ao painel e sai de novo.
        panel()!.focus();
        await expect(panel()!.contains(document.activeElement)).toBe(true);
        outside.focus();
        await settle();
        await expect(controlledCloseCount()).toBe(closesBefore + 2);
        await expect(controlledOpenChange).toHaveBeenLastCalledWith(false, "overlay");
      } finally {
        controlledPolicy.refuse = false;
      }
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

export const Focused: Story = {
  parameters: {
    covers: ["functional.item4"],
    docs: {
      // Override de story: o assunto é o foco DENTRO do painel, e o snippet do
      // meta imprime o painel fechado — sem um par de controles dentro, não
      // haveria "primeiro focável" nem "último focável" para medir.
      source: { transform: popoverFocusedSource },
      description: {
        story:
          "Foco dentro do painel. Ao abrir, o foco vai ao primeiro elemento focável; o Tab caminha entre os controles internos; e, a partir do último (ou Shift+Tab a partir do primeiro), o painel fecha e o foco volta ao gatilho. É a mesma tecla da story Modal, no mesmo lugar, com o resultado oposto: é isso que faz cada uma medir o seu modo.",
      },
    },
  },
  render: () => {
    const FocusedDemo = () => {
      // CONTROLADO por causa do Confirmar: ele fecha por CÓDIGO, e código só
      // tem como fechar se o estado for de quem compõe.
      //
      // E nasce FECHADA: quem abre é a play, por clique. O foco entra no painel
      // em resposta ao gesto — abrir na renderização poria o foco num painel que
      // o Storybook ainda vai reposicionar, e a medição veria a corrida em vez
      // da política. Mesma forma do vanilla, que é o modelo desta story.
      const [open, setOpen] = useState(false);
      // Os motivos TRADUZIDOS de cada fechamento, em ordem, num atributo e não
      // na tela: a story é sobre foco, e um parágrafo a mais mudaria o que o
      // Chromatic fotografa. É o que prova que o Tab para fora chega como
      // `overlay`, e não como o `api` do `close()` imperativo que o fecha por
      // dentro. Uma LISTA, e não o último valor: o mesmo `overlay` duas vezes
      // seguidas não re-renderizaria, e o passo do Shift+Tab não teria como
      // distinguir o seu fechamento do que sobrou do passo anterior.
      const [reasons, setReasons] = useState<string[]>([]);
      return (
        <div
          className={wrapperClass}
          style={wrapperStyle}
          data-testid="focused-root"
          data-close-reasons={reasons.join(" ")}
        >
          {/* ─── Os vizinhos do gatilho: o que dá dentes à asserção de DESTINO ───
              Sem outro focável ao lado do gatilho, "o foco voltou ao gatilho"
              passava por acaso: tirando a interceptação, a sentinela da base-ui
              mandava o foco ao próximo focável depois do gatilho e, sem vizinho,
              dava a volta e caía no PRÓPRIO gatilho. Com "Antes" e "Depois", um
              destino errado tem para onde ir. São andaime da story: o snippet do
              painel Code não os mostra. Tamanho padrão — o `sm` reprova no
              `target-size` do axe. */}
          <div className="nds-cluster" data-spacing="md">
          <Button variant="ghost">Antes</Button>
          <Popover
            open={open}
            onOpenChange={(next, details) => {
              setOpen(next);
              if (!next) setReasons((prev) => [...prev, popoverCloseReason(details?.reason)]);
            }}
          >
            <PopoverTrigger asChild>
              <Button variant="outline">Abrir popover</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverHeader>
                <PopoverTitle>Confirmar alteração</PopoverTitle>
              </PopoverHeader>
              {/* O Cancelar é a PEÇA de fechar (`close-button`, desistiu); o
                  Confirmar fecha por CÓDIGO (`api`, concluiu). Dois focáveis de
                  propósito: com um só, "o Tab do último sai do painel" seria
                  verdade sem o Tab ter caminhado por nada. */}
              <div className="nds-cluster" data-justify="end" data-spacing="sm">
                <PopoverClose asChild>
                  <Button variant="ghost" size="sm">Cancelar</Button>
                </PopoverClose>
                <Button size="sm" onClick={() => setOpen(false)}>Confirmar</Button>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="ghost">Depois</Button>
          </div>
        </div>
      );
    };
    return <FocusedDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /Abrir popover/i });

    // Os motivos já registrados — lidos ANTES de cada tecla, porque o replay do
    // painel Interactions não remonta o DOM e a lista chega com o que as
    // rodadas anteriores fecharam.
    const closeReasons = () =>
      (canvas.getByTestId("focused-root").getAttribute("data-close-reasons") ?? "")
        .split(" ")
        .filter(Boolean);

    await step("O foco entra no painel, no primeiro elemento focável", async () => {
      const p = await open(trigger);
      await waitFor(() => expect(p.contains(document.activeElement)).toBe(true));
      // O alvo EXATO, e não "algum lugar dentro do painel": `contains` é
      // verdade no modo modal e no não-modal, então não mede política nenhuma.
      await expect(within(p).getByRole("button", { name: /Cancelar/i })).toHaveFocus();
    });

    await step("No modo não-modal, o resto da página não é escondido", async () => {
      // O par do passo da story Modal: o esconder do leitor de tela é do modo
      // modal, e só dele (decisão da dona de 2026-09-17).
      // `hidden: true`: com a página escondida, a consulta por papel já não
      // acharia "Antes", e o passo reprovaria na busca e não na asserção.
      const p = await open(trigger);
      const beforeButton = canvas.getByRole("button", { name: /^Antes$/i, hidden: true });
      await expect(p).toBeVisible();
      await expect(beforeButton.closest('[aria-hidden="true"]')).toBeNull();
    });

    await step("Tab caminha entre os controles internos", async () => {
      const p = panel()!;
      const cancelButton = within(p).getByRole("button", { name: /Cancelar/i });
      const confirmButton = within(p).getByRole("button", { name: /Confirmar/i });
      cancelButton.focus();
      await userEvent.tab();
      await expect(confirmButton).toHaveFocus();
    });

    await step("E o elemento focado por teclado mostra o anel de foco", async () => {
      // `:focus-visible` é a condição exata que o CSS compartilhado usa para
      // desenhar o anel — se o foco tivesse vindo do ponteiro, o navegador não
      // casaria a pseudo-classe e o anel não apareceria.
      //
      // O passo CHEGA ao botão por teclado, em vez de herdar o foco do passo
      // anterior: herdar faria a asserção depender da ordem dos passos.
      const p = await open(trigger);
      const cancelButton = within(p).getByRole("button", { name: /Cancelar/i });
      const confirmButton = within(p).getByRole("button", { name: /Confirmar/i });
      cancelButton.focus();
      await userEvent.tab();
      await expect(confirmButton).toHaveFocus();
      await expect(confirmButton.matches(":focus-visible")).toBe(true);
      // O anel de `.nds-button` é box-shadow, não outline — medir a propriedade
      // errada daria verde em qualquer elemento.
      await expect(getComputedStyle(confirmButton).boxShadow).not.toBe("none");
    });

    await step("Do ÚLTIMO focável, Tab fecha o painel e devolve o foco ao gatilho", async () => {
      // ─── O C3, e o destino é NOMEADO ────────────────────────────────────
      //
      // Este é o par da asserção da story Modal, e é o que dá dentes às duas: a
      // MESMA tecla, no MESMO lugar, com resultado oposto conforme o modo. Aqui,
      // sem `modal`, o painel FECHA e o foco vai ao GATILHO; lá, com `modal`, o
      // foco volta ao primeiro e o painel fica.
      //
      // Contrato da dona de 2026-09-17. Uma asserção que aceita qualquer lugar
      // fora do painel não mede destino nenhum: as sentinelas de foco da base-ui
      // mandam o foco ao VIZINHO do gatilho, que é justamente o destino recusado.
      const p = await open(trigger);
      const confirmButton = within(p).getByRole("button", { name: /Confirmar/i });
      confirmButton.focus();
      await expect(confirmButton).toHaveFocus();
      const before = closeReasons().length;

      await userEvent.tab();

      await waitFor(() => expect(panel()).toBeNull());
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(trigger).toHaveAttribute("data-state", "closed");
      await waitFor(() => expect(document.activeElement).toBe(trigger));
      // O motivo: `overlay`, e UM fechamento só por tecla — a devolução do foco
      // ao gatilho é uma perda de foco do painel, e não pode virar o segundo.
      await settle();
      await expect(closeReasons()).toHaveLength(before + 1);
      await expect(closeReasons().at(-1)).toBe("overlay");
    });

    await step("Do PRIMEIRO focável, Shift+Tab fecha o painel e devolve o foco ao gatilho", async () => {
      // O outro sentido é asserção SEPARADA: o ramo compara com o primeiro ou
      // com o último conforme `shiftKey`, e um sentido pode quebrar sozinho. Sem
      // a interceptação, aqui quem recebe a tecla é a sentinela de ANTES, que
      // manda o foco ao focável ANTERIOR ao gatilho — outro destino errado, que
      // só este passo veria.
      const p = await open(trigger);
      const cancelButton = within(p).getByRole("button", { name: /Cancelar/i });
      cancelButton.focus();
      await expect(cancelButton).toHaveFocus();
      const before = closeReasons().length;

      await userEvent.tab({ shift: true });

      await waitFor(() => expect(panel()).toBeNull());
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await waitFor(() => expect(document.activeElement).toBe(trigger));
      await settle();
      await expect(closeReasons()).toHaveLength(before + 1);
      await expect(closeReasons().at(-1)).toBe("overlay");
    });

    await step('Com o painel aberto, o foco levado por código para "Antes" fecha o painel e fica em "Antes"', async () => {
      // ─── C12 / D15 do PRD ───────────────────────────────────────────────
      //
      // Foco posto em outro elemento da página, que não é o painel nem o
      // gatilho: o painel FECHA, com `overlay`, UMA vez, e o foco FICA onde foi
      // posto — quem o moveu escolheu o destino. `focus()`, e não clique:
      // clicar em "Antes" é clique fora, que chega por outro caminho.
      //
      // A base-ui sozinha não fechava aqui: ela marca a perda de foco de painel
      // em portal como "dentro da árvore do React" e desiste do
      // `closeOnFocusOut` — ver `handleBlur` no `popover.tsx`.
      const p = await open(trigger);
      within(p).getByRole("button", { name: /Cancelar/i }).focus();
      await expect(p.contains(document.activeElement)).toBe(true);
      const beforeButton = canvas.getByRole("button", { name: /^Antes$/i });
      const before = closeReasons().length;

      beforeButton.focus();

      await waitFor(() => expect(panel()).toBeNull());
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await settle();
      await expect(closeReasons()).toHaveLength(before + 1);
      await expect(closeReasons().at(-1)).toBe("overlay");
      await expect(document.activeElement).toBe(beforeButton);
    });

    await step('Com o painel aberto, clicar em "Antes" fecha o painel uma vez só', async () => {
      // D15: clique em elemento FOCÁVEL fora do painel aciona os dois caminhos
      // de uma vez — o aperto move o foco (perda de foco) e o clique chega à
      // dispensa por clique fora da lib. O contrato é UM fechamento. Sem o
      // cancelamento do segundo fechamento na raiz (`closedRef`), este gesto
      // anunciava DOIS.
      const p = await open(trigger);
      within(p).getByRole("button", { name: /Cancelar/i }).focus();
      await expect(p.contains(document.activeElement)).toBe(true);
      const beforeButton = canvas.getByRole("button", { name: /^Antes$/i });
      const before = closeReasons().length;

      await userEvent.click(beforeButton);

      await waitFor(() => expect(panel()).toBeNull());
      // Relógio antes de contar: `waitFor` não prova que um segundo anúncio NÃO
      // chegou.
      await settle();
      await expect(panel()).toBeNull();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(document.activeElement).toBe(beforeButton);
      await expect(closeReasons()).toHaveLength(before + 1);
      await expect(closeReasons().at(-1)).toBe("overlay");
    });

    await step("Com o foco dentro do painel, clicar no gatilho fecha uma vez só", async () => {
      // O gatilho conta como parte do painel (D15): o clique leva o foco a ele
      // ANTES de o evento de clique chegar, e essa perda de foco não pode ser
      // um segundo fechamento — nem reabrir o painel que ela acabou de fechar.
      // O motivo é o `trigger-press`, que o `popoverCloseReason` traduz para
      // `overlay` (§9 do PRD).
      //
      // CLIQUE COM PAUSA, e não `userEvent.click`: o sintético despacha
      // `mousedown`, `mouseup` e `click` numa tirada só, e a microtarefa da
      // perda de foco só roda DEPOIS do `click` — o passo passava com o gatilho
      // tratado como lado de fora. Uma instância SÓ para apertar e soltar: duas
      // chamadas soltas de `userEvent.pointer` não geram `click`.
      const p = await open(trigger);
      within(p).getByRole("button", { name: /Cancelar/i }).focus();
      await expect(p.contains(document.activeElement)).toBe(true);
      const before = closeReasons().length;

      const user = userEvent.setup();
      await user.pointer({ keys: "[MouseLeft>]", target: trigger });
      await new Promise((resolve) => setTimeout(resolve, 150));
      await user.pointer({ keys: "[/MouseLeft]", target: trigger });

      await waitFor(() => expect(panel()).toBeNull());
      await settle();
      await expect(panel()).toBeNull();
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
      await expect(closeReasons()).toHaveLength(before + 1);
      await expect(closeReasons().at(-1)).toBe("overlay");
    });

    // Termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step("Estado final: painel aberto", async () => {
      await expect(await open(trigger)).toBeVisible();
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
          "Modo modal — o foco fica preso no painel, a rolagem da página trava, o painel se anuncia como diálogo modal e o resto da página fica escondido do leitor de tela. As quatro coisas andam juntas: anunciar que o resto da página está inerte sem prender o foco nem escondê-lo engana quem navega por leitor de tela.",
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
      // apertar Tab. Não-modal, o painel FECHA e o foco volta ao GATILHO (story
      // Focused), e esta asserção reprova; modal, ele volta ao primeiro. É a mesma tecla que separa os dois modos,
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

    await step("Com o painel aberto, a página atrás NÃO rola", async () => {
      // ─── C8, e até 2026-09-16 nenhuma das cinco media isto ───────────────
      //
      // A story afirmava `aria-modal` e o laço de tabulação, e parava aí. Mas o
      // contrato do modo modal são QUATRO coisas juntas — foco preso, rolagem
      // travada, o anúncio e o resto da página escondido do leitor de tela —, e
      // a que ninguém media até aqui era a rolagem.
      // `aria-modal="true"` promete que o resto da página está fora de alcance;
      // sem a trava a promessa é falsa, porque o leitor de tela não alcança o
      // que está atrás, mas a roda do mouse alcança.
      await waitFor(() => expect(inlineOverflow()).toContain("hidden"));
    });

    await step("E fechar o painel DEVOLVE a rolagem", async () => {
      // O par que dá dentes ao passo anterior. Uma trava que ficasse presa
      // deixaria a página inteira sem rolagem DEPOIS de o painel fechar — o
      // defeito mais caro de notar, porque não acontece na tela do componente:
      // acontece na página que vem depois dele.
      await userEvent.keyboard("{Escape}");
      await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
      await waitFor(() => expect(inlineOverflow()).not.toContain("hidden"));
    });

    await step("Com o painel modal aberto, o resto da página fica escondido do leitor de tela, e volta ao fechar", async () => {
      // ─── Item 7 da §7 do PRD, decisão da dona de 2026-09-17 ─────────────
      //
      // `aria-modal` sozinho não esconde a página em todo leitor de tela, então
      // o modo modal esconde os de fora com `aria-hidden`. Esta story NÃO tem
      // peça de fechar (D2): é o caso em que a base-ui não esconderia nada.
      //
      // ANDAIME: o ancestral da story que é filho direto do `<body>` recebe
      // `aria-hidden="false"` antes de abrir. É o elemento que o esconder
      // TOCA, e o valor prévio negado é o que dá dentes à restauração — quem
      // só remove o atributo ao fechar reprova aqui.
      const trigger = screen.getByRole("button", { name: /Abrir modal/i });
      let marked: HTMLElement = trigger;
      while (marked.parentElement && marked.parentElement !== document.body) {
        marked = marked.parentElement;
      }
      marked.setAttribute("aria-hidden", "false");
      try {
        await expect(screen.queryByRole("dialog")).toBeNull();
        await expect(trigger).not.toHaveAttribute("aria-hidden");

        await userEvent.click(trigger);
        const dialog = await waitFor(() => screen.getByRole("dialog"));

        await expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();
        await expect(dialog.closest('[aria-hidden="true"]')).toBeNull();

        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

        await expect(trigger).not.toHaveAttribute("aria-hidden");
        await expect(trigger.closest('[aria-hidden="true"]')).toBeNull();
        await expect(marked).toHaveAttribute("aria-hidden", "false");
      } finally {
        marked.removeAttribute("aria-hidden");
      }
    });

    await step("Uma região viva fora do painel continua anunciando com o modal aberto", async () => {
      // A EXCEÇÃO do "esconder os outros", decidida pela dona em 2026-09-17: o
      // item 7 mandava esconder todo elemento de fora, e com isso um toast de
      // "salvo" ou de erro ficava MUDO com o painel modal aberto. Região viva
      // existe para ser anunciada sem receber foco; `aria-hidden` apaga o
      // anúncio. `markOthers` da base-ui e o pacote `aria-hidden` 1.2.6 pulam os
      // mesmos elementos — `[aria-live]` e `<script>`.
      //
      // ANDAIME: a região viva mora direto no `body` para ser IRMÃ do painel,
      // que é portalado no `body` — é o que o algoritmo toca. Removida no
      // `finally`.
      const trigger = screen.getByRole("button", { name: /Abrir modal/i });
      const live = document.createElement("div");
      live.setAttribute("aria-live", "polite");
      live.setAttribute("data-testid", "popover-modal-outside-live");
      live.textContent = "Alterações salvas.";
      document.body.appendChild(live);
      try {
        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

        await userEvent.click(trigger);
        const dialog = await waitFor(() => screen.getByRole("dialog"));
        await expect(dialog).toHaveAttribute("aria-modal", "true");

        // Nem ela nem ancestral dela — `closest` cobre os dois.
        await expect(live).not.toHaveAttribute("aria-hidden");
        await expect(live.closest('[aria-hidden="true"]')).toBeNull();

        // O CONTRASTE, e é ele que dá sentido à asserção: um elemento comum de
        // fora CONTINUA escondido. Sem esta linha, uma exceção larga demais —
        // que não escondesse nada — passaria no passo.
        await expect(trigger.closest('[aria-hidden="true"]')).not.toBeNull();

        await userEvent.keyboard("{Escape}");
        await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

        // Nada sobrou de nenhum dos dois lados.
        await expect(live).not.toHaveAttribute("aria-hidden");
        await expect(trigger.closest('[aria-hidden="true"]')).toBeNull();
      } finally {
        live.remove();
      }
    });

    // Termina ABERTA: é o estado que o axe varre e o Chromatic fotografa.
    await step("Estado final: painel aberto", async () => {
      const trigger = screen.getByRole("button", { name: /Abrir modal/i });
      await userEvent.click(trigger);
      await expect(await waitFor(() => screen.getByRole("dialog"))).toBeVisible();
    });
  },
};
