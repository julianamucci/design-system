import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, waitFor } from "storybook/test";
import { waitForPortal, waitForPortalGone } from "@/lib/wait-for-portal";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "./drawer";
import {
  drawerOpenSource,
  drawerControlledSource,
  drawerNotDispensavelSource,
  drawerSource,
} from "./drawer.source";
import { Button } from "./button";

const meta = {
  title: "Primitives/Overlay/Drawer/States",
  tags: ["overlay"],
  component: Drawer,
  parameters: {
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      // Fechado é o padrão do componente: esta transform já é o snippet da
      // story Closed.
      source: { transform: drawerSource },
      description: {
        component:
          "Estados canônicos do Drawer: fechado (padrão), aberto, controlado por estado externo e não dispensável.",
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

export const Closed: Story = {
  parameters: {
    covers: ["accessibility.item1"],
    docs: {
      description: {
        story:
          "Estado inicial — apenas o gatilho está na tela. O painel não existe no DOM, e o gatilho anuncia que há um diálogo atrás dele sem afirmar que já está aberto.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar perfil</DrawerTitle>
            <DrawerDescription>Atualize seus dados.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step("Fechado, o painel não existe no DOM", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir/i });
      await expect(trigger).toBeVisible();
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
      await expect(document.querySelector("[data-slot='drawer-content']")).toBeNull();
      await expect(document.querySelector("[data-slot='drawer-overlay']")).toBeNull();
    });

    await step("O gatilho é o único caminho de entrada, e está alcançável", async () => {
      const trigger = canvas.getByRole("button", { name: /Abrir/i });
      await expect(trigger).toHaveAttribute("data-slot", "drawer-trigger");
      await expect(trigger).toBeEnabled();
    });
  },
};

export const Open: Story = {
  parameters: {
    covers: ["accessibility.item2"],
    docs: {
      // Aqui abrir na montagem É o assunto — nas demais stories o `defaultOpen`
      // só serve à captura visual, e por isso não entra naqueles snippets.
      source: { transform: drawerOpenSource },
      description: {
        story:
          "Aberto ao montar, sem estado externo. Overlay ativo, foco dentro do painel e contrato de markup completo.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer defaultOpen>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Editar perfil</DrawerTitle>
            <DrawerDescription>Atualize seus dados.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ step }) => {
    const panel = await waitForPortal("dialog");

    await step("Monta já aberto, com o contrato de markup completo", async () => {
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAttribute("role", "dialog");
      await expect(panel).toHaveAttribute("aria-modal", "true");
      await expect(panel).toHaveAttribute("data-slot", "drawer-content");
      await expect(panel).toHaveAccessibleName("Editar perfil");
      await expect(document.querySelector("[data-slot='drawer-overlay']")).not.toBeNull();
    });

    await step("O foco está dentro do painel", async () => {
      await waitFor(() => {
        if (!panel.contains(document.activeElement)) {
          throw new Error("o foco não entrou no painel");
        }
      });
      await expect(panel.contains(document.activeElement)).toBe(true);
    });
  },
};

export const Controlled: Story = {
  parameters: {
    covers: ["functional.item6"],
    docs: {
      // Composição diferente: estado de fora, sem `DrawerTrigger` — quem abre é
      // o botão da página.
      source: { transform: drawerControlledSource },
      description: {
        story:
          "Estado do lado de fora: o componente não decide nada sozinho — abre quando o valor ligado diz que sim e avisa a cada mudança para que o dono do estado acompanhe.",
      },
    },
  },
  render: () => {
    const ControlledDemo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="nds-stack" data-spacing="sm" style={wrapperStyle}>
          <div className="nds-cluster" data-spacing="md">
            <Button onClick={() => setOpen(true)}>Abrir externamente</Button>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Fechar externamente
            </Button>
          </div>
          <Drawer open={open} onOpenChange={setOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>Editar perfil</DrawerTitle>
                <DrawerDescription>Atualize seus dados.</DrawerDescription>
              </DrawerHeader>
              <DrawerFooter>
                <DrawerClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DrawerClose>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const openBtn = canvas.getByRole("button", { name: /Abrir externamente/i });
    const closeBtn = canvas.getByRole("button", { name: /Fechar externamente/i });

    await step("Sem gatilho interno, o painel nasce fechado", async () => {
      if (within(document.body).queryAllByRole("dialog").length > 0) {
        await userEvent.click(closeBtn);
        await waitForPortalGone("dialog");
      }
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
    });

    await step("O estado externo abre o painel", async () => {
      await userEvent.click(openBtn);
      const panel = await waitForPortal("dialog");
      await expect(panel).toBeVisible();
      await expect(panel).toHaveAccessibleName("Editar perfil");
    });

    await step("Fechar por dentro devolve o valor a quem é dono dele", async () => {
      const panel = await waitForPortal("dialog");
      await userEvent.click(within(panel).getByRole("button", { name: /Cancelar/i }));
      await waitForPortalGone("dialog");
      // Se o callback não tivesse chegado, `open` continuaria true e o painel
      // reabriria no render seguinte.
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
    });
  },
};

export const NotDismissible: Story = {
  parameters: {
    covers: ["functional.item7"],
    docs: {
      // `dismissible={false}` só faz sentido junto da saída explícita do rodapé
      // — o snippet precisa mostrar os dois na mesma composição.
      source: { transform: drawerNotDispensavelSource },
      description: {
        story:
          "Sem dispensa por gesto: Escape e clique no overlay não fecham. A saída existe e é explícita — o botão do rodapé, alcançável por teclado.",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer defaultOpen dismissible={false}>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Confirmação obrigatória</DrawerTitle>
            <DrawerDescription>Use o botão Confirmar para prosseguir.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button>Confirmar e fechar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // A play é reexecutável no painel Interactions, e o último passo FECHA o
    // painel de verdade. Sem restabelecer a precondição, a segunda rodada
    // começaria com a tela vazia e os dois primeiros passos afirmariam nada.
    //
    // O gatilho só é PROCURADO dentro deste ramo, e é por isso que ele existe
    // aqui embaixo em vez de no topo da play: a story nasce `defaultOpen`, e
    // com o painel aberto a lib põe `aria-hidden` no resto da página — consulta
    // por papel não enxerga nada ali, e `getByRole` reprovava antes do primeiro
    // passo. Fechado, o `aria-hidden` sai e o gatilho volta a ser alcançável.
    if (within(document.body).queryAllByRole("dialog").length === 0) {
      await userEvent.click(canvas.getByRole("button", { name: /^Abrir$/i }));
    }
    const panel = await waitForPortal("dialog");

    await step("O painel ENTRA na tela, e não fica parado fora dela", async () => {
      // Guarda do desvio que esta variante usa: com `dismissible={false}` a raiz
      // controla a abertura, e aí o painel ENTRA por transição em vez de já
      // nascer no lugar. Sem esta asserção o desvio passaria despercebido — os
      // passos abaixo só contam diálogos e clicam botões, e um painel parado
      // fora da tela responde a todos eles igual.
      //
      // Espera de RELÓGIO, e nunca `waitFor`: a condição lê geometria, e leitura
      // que força layout dentro do `waitFor` reagenda a própria tentativa pelo
      // observador de mutação — o prazo não chega, a aba trava e o arquivo morre
      // sem reportar. Com laço de relógio, o pior caso é reprovar no prazo.
      const prazo = Date.now() + 2000;
      let box = panel.getBoundingClientRect();
      while (Date.now() < prazo && !(box.height > 0 && box.top < window.innerHeight - 1)) {
        await new Promise((r) => setTimeout(r, 50));
        box = panel.getBoundingClientRect();
      }
      await expect(box.height).toBeGreaterThan(0);
      await expect(box.top).toBeLessThan(window.innerHeight);
      await expect(box.bottom).toBeGreaterThan(0);
    });

    await step("Escape não fecha", async () => {
      await userEvent.keyboard("{Escape}");
      // Espera ATIVA por um fechamento que não deve acontecer: se fechasse, a
      // transição de saída levaria menos que isto.
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(1);
      await expect(panel).toBeVisible();
    });

    await step("Clique no overlay não fecha", async () => {
      const overlay = document.querySelector<HTMLElement>("[data-slot='drawer-overlay']");
      await expect(overlay).not.toBeNull();
      await userEvent.click(overlay!, { pointerEventsCheck: 0 });
      await new Promise((r) => setTimeout(r, 400));
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(1);
    });

    // O passo dizia "continua funcionando" e só olhava se o botão estava
    // VISÍVEL. Botão visível e inerte é exatamente o defeito que o rodapé de
    // uma gaveta não dispensável não pode ter: com Escape e véu desligados, ele
    // é a única saída. Agora o passo CLICA, e a asserção é o painel sumindo.
    await step("A saída explícita do rodapé fecha de verdade", async () => {
      const sair = within(panel).getByRole("button", { name: /Confirmar e fechar/i });
      await expect(sair).toBeVisible();
      await userEvent.click(sair);
      await waitForPortalGone("dialog");
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
    });

    // Volta a abrir: a foto do Chromatic é do painel aberto, e a próxima rodada
    // da play precisa do mesmo ponto de partida desta. O gatilho é consultado
    // AQUI, com o painel já fechado — é o único momento em que o `aria-hidden`
    // da lib não o esconde da consulta por papel.
    await userEvent.click(canvas.getByRole("button", { name: /^Abrir$/i }));
    await waitForPortal("dialog");
  },
};

// ─── Arraste para dispensar ───────────────────────────────────────────────────
//
// O gesto existe nas CINCO stacks. Aqui ele vem da lib de gaveta; em duas
// stacks vem de um motor de pointer escrito à mão sobre a leitura desta lib.
// Os limiares são os mesmos — 25% do tamanho do panel, ou 0,4 px/ms —, e é
// isso que esta play mede.
//
// Os eventos são despachados à mão porque `userEvent.pointer` não entrega a
// soltura no mesmo elemento quando há captura de pointer. E toda espera é de
// RELÓGIO: `pointermove` mexe no DOM, e um `waitFor` em volta de condição que
// provoca mutação se reagenda sozinho até a aba morrer sem reportar.

/** Um quadro — o intervalo que separa dois passos de um gesto real. */
function nextFrame(): Promise<void> {
  return new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
}

function wait(ms: number): Promise<void> {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

/** Um passo de pointer, com o evento que o gesto assina. */
function pointer(
  target: HTMLElement,
  type: "pointerdown" | "pointermove" | "pointerup",
  x: number,
  y: number,
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      pointerType: "mouse",
      isPrimary: true,
      clientX: x,
      clientY: y,
      button: 0,
      buttons: type === "pointerup" ? 0 : 1,
      bubbles: true,
      cancelable: true,
    }),
  );
}

/** O panel está parado na posição de repouso? */
function atRest(panel: HTMLElement): boolean {
  const t = getComputedStyle(panel).transform;
  return t === "none" || t === "matrix(1, 0, 0, 1, 0, 0)";
}

export const DragToDismiss: Story = {
  parameters: {
    covers: ["functional.item8", "functional.item9", "accessibility.item8"],
    // A foto seria a mesma da story Open: o que esta story mede é o gesto, e
    // gesto não aparece em imagem parada.
    chromatic: { disable: true },
    docs: {
      source: { transform: drawerOpenSource },
      description: {
        story:
          "Arrastar o panel na direção de entrada o dispensa; soltar antes de um quarto do seu tamanho o traz de volta. O gesto é extra de pointer: Escape, véu e o botão do rodapé fecham o mesmo panel sem trajeto nenhum (WCAG 2.5.7).",
      },
    },
  },
  render: () => (
    <div style={wrapperStyle}>
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline">Abrir</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Arraste para dispensar</DrawerTitle>
            <DrawerDescription>Puxe o panel para baixo, ou use Escape.</DrawerDescription>
          </DrawerHeader>
          <DrawerFooter>
            <DrawerClose asChild>
              <Button variant="outline">Cancelar</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const trigger = canvas.getByRole("button", { name: /^Abrir$/i });

    async function openPanel(): Promise<HTMLElement> {
      if (within(document.body).queryAllByRole("dialog").length === 0) {
        await userEvent.click(trigger);
      }
      const panel = await waitForPortal("dialog");
      // A carência de 500 ms depois da abertura é do gesto, não do teste: nela
      // o panel ainda está entrando, e a lib recusa arrastar de propósito.
      await wait(600);
      return panel;
    }

    await step("Arraste curto volta ao repouso, sem fechar", async () => {
      const panel = await openPanel();
      const box = panel.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + 10;

      pointer(panel, "pointerdown", x, y);
      await nextFrame();
      pointer(panel, "pointermove", x, y + 6);
      await nextFrame();
      // Devagar de propósito: 6px em ~150ms dá 0,04 px/ms, um décimo do limiar
      // de velocidade. O que decide aqui é a distância, e 6px não chega a um
      // quarto de panel nenhum.
      await wait(150);
      pointer(panel, "pointermove", x, y + 6);
      await nextFrame();
      pointer(panel, "pointerup", x, y + 6);

      await wait(700);
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(1);
      await expect(panel).toBeVisible();
      await expect(atRest(panel)).toBe(true);
    });

    await step("Arraste além de um quarto do panel dispensa, e o foco volta", async () => {
      const panel = await openPanel();
      const box = panel.getBoundingClientRect();
      const x = box.left + box.width / 2;
      const y = box.top + 10;
      const target = Math.max(box.height * 0.6, 80);

      pointer(panel, "pointerdown", x, y);
      await nextFrame();
      for (const fraction of [0.25, 0.5, 0.75, 1]) {
        pointer(panel, "pointermove", x, y + target * fraction);
        await nextFrame();
      }
      pointer(panel, "pointerup", x, y + target);

      await waitForPortalGone("dialog");
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
      await expect(document.activeElement).toBe(trigger);
    });

    await step("Nada depende do arraste: Escape fecha o mesmo panel", async () => {
      // É esta a asserção da WCAG 2.5.7. O gesto só dispensa, e dispensar tem
      // caminho sem trajeto de pointer — este passo prova que o caminho existe
      // e leva ao mesmo lugar.
      const panel = await openPanel();
      await expect(panel).toBeVisible();
      await userEvent.keyboard("{Escape}");
      await waitForPortalGone("dialog");
      await expect(within(document.body).queryAllByRole("dialog")).toHaveLength(0);
    });

    await step("A alça não é parada de teclado", async () => {
      const panel = await openPanel();
      const handle = panel.querySelector<HTMLElement>(".nds-drawer-handle");
      await expect(handle).not.toBeNull();
      // Afordância visual: o arraste vale no panel inteiro, não nela. Foco ali
      // seria uma parada de tabulação que não faz nada.
      await expect(handle!.getAttribute("aria-hidden")).toBe("true");
      await expect(handle!.hasAttribute("tabindex")).toBe(false);
    });
  },
};
