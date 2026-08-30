import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, fn, userEvent } from "storybook/test";
import { toast } from "sonner";
import { Toaster, CLOSE_LABEL } from "./sonner";
import {
  waitForNoToasts,
  waitForToast,
  clearToasts,
  PERSISTENT,
  TEXTS,
} from "./sonner.fixtures";
import {
  sonnerWithActionSource,
  sonnerWithDescriptionSource,
  sonnerPersistentSource,
  sonnerPromiseSource,
  sonnerSource,
} from "./sonner.source";

// ─── Meta ─────────────────────────────────────────────────────────────────────
//
// O que a notificação PODE carregar além do título: descrição, ação, o ciclo de
// uma promessa e o prazo infinito. Cada composição resolve um caso; empilhá-las
// todas na mesma notificação faria uma caixa de diálogo flutuante, que é
// exatamente o que este componente não é.

const undoSpy = fn();

const meta = {
  title: "Primitives/Feedback/Sonner/Compositions",
  tags: ["feedback"],
  parameters: {
    layout: "padded",
    // Sem argTypes nestas stories: sem isto o painel Controls abre vazio.
    controls: { disable: true },
    actions: { disable: true },
    // Ver PATCHES.md#sonner-rich-colors-contrast.
    a11y: {
      config: {
        rules: [
          { id: "color-contrast", enabled: false },
          { id: "aria-prohibited-attr", enabled: false },
        ],
      },
    },
    docs: {
      source: { transform: sonnerSource },
      description: {
        component:
          "Descrição, ação, ciclo de promessa e prazo infinito. A ação oferecida dentro da notificação precisa existir em outro lugar da interface: a notificação some, e o que só existia nela some junto.",
      },
    },
  },
  render: () => (
    <div style={{ contain: "layout", position: "relative", minHeight: 120 }}>
      <Toaster position="top-right" richColors />
    </div>
  ),
} satisfies Meta;

export default meta;
type Story = StoryObj;

// ─── Stories ──────────────────────────────────────────────────────────────────

export const WithDescription: Story = {
  parameters: {
    covers: ["visual.item2"],
    docs: {
      // A descrição é opção da chamada, e nenhum arg deste arquivo a descreve.
      source: { transform: sonnerWithDescriptionSource },
      description: {
        story:
          "Título mais descrição, para quando o título sozinho não orienta. A descrição é uma frase completa — se precisar de três linhas, o lugar da mensagem não é uma notificação.",
      },
    },
  },
  play: async ({ step }) => {
    await clearToasts();

    await step("Título e descrição vivem no mesmo bloco de conteúdo", async () => {
      toast.success(TEXTS.comDescricao, {
        ...PERSISTENT,
        description: TEXTS.comDescricaoDetalhe,
      });
      const toastEl = await waitForToast({ type: "success" });

      const title = toastEl.querySelector<HTMLElement>("[data-title]")!;
      const description = toastEl.querySelector<HTMLElement>("[data-description]")!;
      await expect(title).toHaveTextContent(TEXTS.comDescricao);
      await expect(description).toHaveTextContent(TEXTS.comDescricaoDetalhe);

      // Os dois dentro do mesmo bloco de conteúdo: é isso que faz o leitor de
      // tela anunciar a notificação como uma coisa só, e não como dois avisos.
      const content = toastEl.querySelector<HTMLElement>("[data-content]")!;
      await expect(content.contains(title) && content.contains(description)).toBe(true);
    });
  },
};

export const WithAction: Story = {
  parameters: {
    covers: ["functional.item5", "accessibility.item2", "visual.item2"],
    docs: {
      // A ação vive na chamada, e aqui o botão que exclui é o gatilho honesto.
      source: { transform: sonnerWithActionSource },
      description: {
        story:
          "Ação embutida para operação reversível. O botão entra na sequência de foco enquanto a notificação está na tela, e some com ela — por isso desfazer também precisa existir fora daqui.",
      },
    },
  },
  play: async ({ step }) => {
    await clearToasts();
    // O espião é de módulo e sobrevive ao replay da play no painel Interactions;
    // zerá-lo aqui é o que mantém a contagem abaixo verdadeira nas duas rodadas.
    undoSpy.mockClear();

    await step("O botão de ação é alcançável por Tab enquanto a notificação está na tela", async () => {
      // accessibility.item2 — o `<button>` é de verdade e está no fluxo de foco.
      // Sem isso, quem navega por teclado veria a ação e não teria como chegar
      // até ela antes de o prazo vencer (WCAG 2.1.1).
      toast(TEXTS.withAction, {
        ...PERSISTENT,
        action: { label: TEXTS.comAcaoRotulo, onClick: () => undoSpy() },
      });
      const toastEl = await waitForToast({ type: "default" });
      const action = toastEl.querySelector<HTMLButtonElement>("[data-button]")!;

      await expect(action.tagName).toBe("BUTTON");
      await expect(action).toHaveTextContent(TEXTS.comAcaoRotulo);

      action.focus();
      await expect(action).toHaveFocus();
    });

    await step("Enter dispara a ação e retira a notificação", async () => {
      // functional.item5 — a notificação existia para oferecer a ação; cumprida,
      // ela sai na hora em vez de continuar ocupando a pilha.
      await userEvent.keyboard("{Enter}");

      await expect(undoSpy).toHaveBeenCalledTimes(1);
      await waitForNoToasts();
      await expect(document.querySelectorAll("[data-sonner-toast]").length).toBe(0);
    });
  },
};

export const PromiseResolved: Story = {
  parameters: {
    covers: ["functional.item3", "visual.item2"],
    docs: {
      // `toast.promise` é outra API: o meta imprimiria uma notificação avulsa.
      source: { transform: sonnerPromiseSource },
      description: {
        story:
          "Uma notificação para a operação inteira: nasce em carregamento e vira êxito no mesmo lugar, sem piscar duas caixas.",
      },
    },
  },
  play: async ({ step }) => {
    await clearToasts();

    await step("O carregamento vira êxito no MESMO nó do DOM", async () => {
      // functional.item3 — a promessa é resolvida À MÃO, e não por temporizador.
      // Com prazo fixo, a resolução chegava antes de o carregamento terminar de
      // entrar (a notificação leva um fade para assentar) e o estado
      // intermediário ficava inobservável — o teste falharia por corrida.
      let resolve: () => void = () => undefined;
      const operation = new Promise<void>((resolveOperation) => {
        resolve = resolveOperation;
      });
      toast.promise(operation, {
        loading: TEXTS.promessaCarregando,
        success: TEXTS.promessaSucesso,
        error: TEXTS.promessaErro,
        duration: Number.POSITIVE_INFINITY,
      });

      const loading = await waitForToast({ type: "loading" });
      await expect(loading).toHaveTextContent(TEXTS.promessaCarregando);

      resolve();
      const resolved = await waitForToast({ type: "success" });
      await expect(resolved).toHaveTextContent(TEXTS.promessaSucesso);

      // Mesmo elemento: trocar o nó faria o leitor de tela anunciar duas
      // notificações para um evento só.
      await expect(resolved).toBe(loading);
      await expect(document.querySelectorAll("[data-sonner-toast]").length).toBe(1);
    });
  },
};

export const PromiseRejected: Story = {
  parameters: {
    covers: ["functional.item4"],
    docs: {
      // Mesmo código do desfecho resolvido — o que muda é a promessa rejeitar.
      source: { transform: sonnerPromiseSource },
      description: {
        story:
          "O mesmo ciclo, com a operação falhando: o carregamento vira falha, com o texto que diz o caminho de saída.",
      },
    },
  },
  play: async ({ step }) => {
    await clearToasts();

    await step("O carregamento vira falha quando a operação rejeita", async () => {
      // functional.item4 — a falha é provocada à mão pelo mesmo motivo do caso
      // resolvido: com temporizador, o estado intermediário fica inobservável.
      let fail: () => void = () => undefined;
      const operation = new Promise<void>((_resolve, reject) => {
        fail = () => reject(new Error("falha simulada"));
      });
      operation.catch(() => undefined);
      toast.promise(operation, {
        loading: TEXTS.promessaCarregando,
        success: TEXTS.promessaSucesso,
        error: TEXTS.promessaErro,
        duration: Number.POSITIVE_INFINITY,
      });

      const loading = await waitForToast({ type: "loading" });
      await expect(loading).toHaveAttribute("data-type", "loading");

      fail();
      const failed = await waitForToast({ type: "error" });
      await expect(failed).toHaveTextContent(TEXTS.promessaErro);
      await expect(failed).toBe(loading);
    });
  },
};

export const Persistent: Story = {
  parameters: {
    covers: ["functional.item6", "visual.item2"],
    docs: {
      // O prazo infinito e o botão de fechar só existem no render e na play.
      source: { transform: sonnerPersistentSource },
      description: {
        story:
          "Prazo infinito, reservado a falha crítica que exige decisão. Sempre com botão de fechar: uma notificação que não sai sozinha e não pode ser fechada vira obstáculo.",
      },
    },
  },
  // Prazo default curtíssimo de propósito: é o que prova que o `Infinity` desta
  // notificação é dela, e não do relógio da página.
  render: () => (
    <div style={{ contain: "layout", position: "relative", minHeight: 120 }}>
      <Toaster position="top-right" richColors duration={300} closeButton />
    </div>
  ),
  play: async ({ step }) => {
    await clearToasts();

    await step("A notificação sobrevive ao prazo que valeria para as outras", async () => {
      // functional.item6 — 700ms com prazo default de 300ms: se o `Infinity`
      // fosse ignorado, ela já teria saído duas vezes.
      toast.error(TEXTS.persistente, PERSISTENT);
      const toastEl = await waitForToast({ type: "error" });

      await new Promise<void>((resolve) => setTimeout(resolve, 700));
      await expect(document.body.contains(toastEl)).toBe(true);
      await expect(toastEl).not.toHaveAttribute("data-removed", "true");
    });

    await step("Fechar manualmente é o único caminho de saída", async () => {
      const close = document.querySelector<HTMLButtonElement>("[data-close-button]")!;
      await expect(close).toHaveAttribute("aria-label", CLOSE_LABEL);
      await userEvent.click(close);
      await waitForNoToasts();
      await expect(document.querySelectorAll("[data-sonner-toast]").length).toBe(0);
    });
  },
};
