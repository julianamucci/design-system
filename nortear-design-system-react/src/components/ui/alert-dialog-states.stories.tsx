import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
import alertDialogTranslations from "@shared/content/alert-dialog/translations.json";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "./alert-dialog";
import { Button } from "./button";
import { markConfirmation } from "./dialog-close-reason";
import {
  alertDialogCloseReason,
  type AlertDialogCloseReason,
} from "./alert-dialog-close-reason";
import {
  alertDialogCancelledSource,
  alertDialogConfirmedSource,
  alertDialogControlledSource,
  alertDialogSource,
} from "./alert-dialog.source";

const meta = {
  title: "Components/Overlay/AlertDialog/States",
  tags: ["overlay"],
  component: AlertDialog,
  parameters: {
    design: figmaDesign("alertDialog"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
      source: { transform: alertDialogSource },
      description: {
        component:
          "Cada estado canônico do AlertDialog: closed, open, confirmed, cancelled e controlled.",
      },
    },
  },
} satisfies Meta<typeof AlertDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * O conjunto destrutivo de `demonstration.labels` — o mesmo exemplo da seção
 * Demonstração da docs page, nas cinco stories deste arquivo. Lido do conteúdo
 * compartilhado, e não copiado, para o texto da story não se afastar dele.
 */
const LABELS = alertDialogTranslations["pt-BR"].demonstration.labels;

/** Nome exato do gatilho — o título tem o mesmo texto, então a âncora importa. */
const TRIGGER_NAME = new RegExp(`^${LABELS.triggerLabel}$`, "i");
const CANCEL_NAME = new RegExp(`^${LABELS.cancel}$`, "i");
const ACTION_NAME = new RegExp(`^${LABELS.action}$`, "i");

/**
 * Garante o diálogo aberto sem depender do estado de montagem.
 *
 * `defaultOpen` só vale na primeira montagem, e o painel Interactions
 * reexecuta a play no MESMO DOM: na segunda rodada o diálogo já foi fechado
 * pelos passos anteriores e o passo de abertura media o vazio.
 */
async function ensureOpen(canvas: ReturnType<typeof within>) {
  // querySelector e não queryByRole: numa rodada do arquivo inteiro sobra o
  // portal da story anterior por alguns quadros, e queryByRole estoura em
  // "multiple elements" antes de a limpeza acontecer.
  if (!document.querySelector('[role="alertdialog"]')) {
    await userEvent.click(canvas.getByRole("button", { name: TRIGGER_NAME }));
  }
  return waitForPortal("alertdialog");
}

/** Espera o portal do alert dialog sumir (ou ficar com data-state=closed). */
async function waitForClosed(timeout = 1000) {
  await waitFor(
    () => {
      const dialog = within(document.body).queryByRole("alertdialog");
      if (dialog && dialog.getAttribute("data-state") !== "closed") {
        throw new Error("dialog still open");
      }
    },
    { timeout },
  );
}

/**
 * Abre pelo gatilho como um TOQUE.
 *
 * A lib lê o tipo de ponteiro do `pointerdown` e, sem escolha explícita, foca
 * o PAINEL quando a abertura vem de toque — para não subir o teclado virtual.
 * É por isso que a D3 do PRD exige o foco no Cancelar escolhido pelo
 * componente, e este é o caminho que a prova: pela ordem do rodapé, o toque
 * cairia no painel. Os eventos são disparados à mão porque o tipo do ponteiro
 * é o assunto, e ele precisa chegar ao `pointerdown` e ao `click` exatamente
 * como `touch`.
 */
function openByTouch(trigger: HTMLElement) {
  const init: PointerEventInit = {
    bubbles: true,
    cancelable: true,
    composed: true,
    pointerType: "touch",
    isPrimary: true,
    detail: 1,
  };
  trigger.dispatchEvent(new PointerEvent("pointerdown", init));
  trigger.dispatchEvent(new PointerEvent("pointerup", init));
  trigger.dispatchEvent(new PointerEvent("click", init));
}

/** A confirmação destrutiva canônica, com os callbacks opcionais que cada estado mede. */
function DestructiveConfirm({
  defaultOpen,
  onAction,
  onCancel,
}: {
  defaultOpen?: boolean;
  onAction?: () => void;
  onCancel?: () => void;
}) {
  return (
    <AlertDialog defaultOpen={defaultOpen}>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        {LABELS.triggerLabel}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{LABELS.title}</AlertDialogTitle>
          <AlertDialogDescription>{LABELS.description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel data-testid="cancel-action" onClick={onCancel}>
            {LABELS.cancel}
          </AlertDialogCancel>
          <AlertDialogAction
            data-testid="confirm-action"
            variant="destructive"
            onClick={onAction}
          >
            {LABELS.action}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado inicial — o trigger está visível e o diálogo não foi aberto ainda.",
      },
    },
  },
  render: () => <DestructiveConfirm />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Apenas o trigger está visível", async () => {
      const trigger = canvas.getByRole("button", { name: TRIGGER_NAME });
      await expect(trigger).toBeVisible();
    });

    await step("Nenhum conteúdo do diálogo foi renderizado", async () => {
      await expect(
        within(document.body).queryByRole("alertdialog"),
      ).not.toBeInTheDocument();
      await expect(
        document.querySelector('[data-slot="alert-dialog-overlay"]'),
      ).toBeNull();
    });
  },
};

export const Open: Story = {
  parameters: {
    // A story termina com o diálogo aberto: é sobre ela que o addon-a11y roda
    // a varredura axe (contraste incluído) do estado aberto.
    covers: ["accessibility.item3", "accessibility.item6", "accessibility.item7"],
    docs: {
      // Sem override: o painel mostra a confirmação canônica do `meta`. O
      // `defaultOpen` do render é andaime de captura, e nenhum trecho o ensina.
      description: {
        story:
          "Diálogo aberto na montagem, para a captura visual no Chromatic e a varredura de acessibilidade do estado aberto. O foco inicial vai ao Cancelar por escolha do componente — também quando a abertura vem de toque.",
      },
    },
  },
  render: () => <DestructiveConfirm defaultOpen />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Diálogo abre já montado e com backdrop", async () => {
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toBeVisible();
      await expect(
        document.querySelector('[data-slot="alert-dialog-overlay"]'),
      ).not.toBeNull();
    });

    await step("Nome e descrição acessíveis vêm do Title e da Description", async () => {
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toHaveAccessibleName(LABELS.title);
      await expect(dialog).toHaveAccessibleDescription(LABELS.description);
    });

    await step("Foco inicial no Cancelar, e não na ação destrutiva", async () => {
      const dialog = await waitForPortal("alertdialog");
      const cancel = within(dialog).getByRole("button", { name: CANCEL_NAME });
      await waitFor(() => expect(cancel).toHaveFocus());
      await expect(within(dialog).getByRole("button", { name: ACTION_NAME })).not.toHaveFocus();
    });

    await step("Aberto por toque, o foco inicial continua no Cancelar", async () => {
      // Fecha pelo Escape para reabrir pelo gatilho: `defaultOpen` não tem tipo
      // de interação, e o que se mede aqui é justamente o toque.
      await userEvent.keyboard("{Escape}");
      await waitForClosed();
      const trigger = canvas.getByRole("button", { name: TRIGGER_NAME });
      openByTouch(trigger);
      const dialog = await waitForPortal("alertdialog");
      const cancel = within(dialog).getByRole("button", { name: CANCEL_NAME });
      await waitFor(() => expect(cancel).toHaveFocus());
      // O painel é o que a lib focaria por padrão no toque — medido contra ele.
      await expect(dialog).not.toHaveFocus();
    });
  },
};

// Spy no escopo do módulo: o play precisa inspecionar o mesmo mock que o
// render entrega ao Action. `beforeEach` zera entre execuções da story.
const onConfirm = fn();

export const Confirmed: Story = {
  parameters: {
    covers: ["functional.item2"],
    docs: {
      // O `onClick` no Action é o que a story mede; o `meta` não o tem.
      source: { transform: alertDialogConfirmedSource },
      description: {
        story:
          "Usuário confirma a ação clicando em Action — handler `onClick` é disparado e o diálogo fecha. Enter com o Action focado produz o mesmo resultado.",
      },
    },
  },
  beforeEach: () => {
    onConfirm.mockClear();
  },
  render: () => <DestructiveConfirm defaultOpen onAction={onConfirm} />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Diálogo está aberto", async () => {
      const dialog = await ensureOpen(canvas);
      await expect(dialog).toBeVisible();
    });

    await step("Confirmar dispara o callback do consumidor", async () => {
      const action = await within(document.body).findByTestId("confirm-action");
      await userEvent.click(action);
      await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(1), {
        timeout: 1000,
      });
    });

    await step("Confirmar também fecha o diálogo", async () => {
      await waitFor(
        () =>
          expect(
            within(document.body).queryByRole("alertdialog", { hidden: false }),
          ).not.toBeInTheDocument(),
        { timeout: 1000 }
      );
    });

    await step("Enter no Action confirma pelo teclado e devolve o foco ao trigger", async () => {
      const trigger = canvas.getByRole("button", { name: TRIGGER_NAME });
      await userEvent.click(trigger);
      const dialog = await waitForPortal("alertdialog");
      const cancel = within(dialog).getByRole("button", { name: CANCEL_NAME });
      const action = await within(document.body).findByTestId("confirm-action");
      // O foco entra no Cancelar (D3); um Tab leva ao Action — o caminho de quem
      // confirma pelo teclado, sem foco programático no meio.
      await waitFor(() => expect(cancel).toHaveFocus());
      await userEvent.tab();
      await expect(action).toHaveFocus();
      await userEvent.keyboard("{Enter}");
      await waitFor(() => expect(onConfirm).toHaveBeenCalledTimes(2), {
        timeout: 1000,
      });
      await waitForClosed();
      // functional.item2 fecha o ciclo no trigger: confirmar devolve o foco a
      // quem abriu, senão o teclado volta pro topo do documento.
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  },
};

// Mesmo padrão do Confirmed: o spy precisa sobreviver ao re-render do Base UI.
const onCancel = fn();
// Espião da ação destrutiva: cancelar não pode executá-la em momento nenhum.
const onCancelledAction = fn();

export const Cancelled: Story = {
  parameters: {
    covers: ["functional.item3"],
    docs: {
      // O Cancel também recebe `onClick`, e a ação destrutiva não roda por ele.
      source: { transform: alertDialogCancelledSource },
      description: {
        story:
          "Usuário cancela — diálogo fecha e `onClick` do Cancel é disparado. Space com o Cancel focado produz o mesmo resultado.",
      },
    },
  },
  beforeEach: () => {
    onCancel.mockClear();
    onCancelledAction.mockClear();
  },
  render: () => (
    <DestructiveConfirm defaultOpen onCancel={onCancel} onAction={onCancelledAction} />
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Cancel é clicado, dispara o callback e o diálogo fecha", async () => {
      await ensureOpen(canvas);
      const cancel = await waitForPortal("button", { name: CANCEL_NAME });
      await userEvent.click(cancel);
      await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1), {
        timeout: 1000,
      });
      await waitForClosed();
      // O ponto do cancelamento: a ação destrutiva não roda.
      await expect(onCancelledAction).not.toHaveBeenCalled();
    });

    await step("Space com o Cancel focado cancela de novo", async () => {
      const trigger = canvas.getByRole("button", { name: TRIGGER_NAME });
      await userEvent.click(trigger);
      await waitForPortal("alertdialog");
      const cancel = await within(document.body).findByTestId("cancel-action");
      // O foco já chega ao Cancelar pela abertura (D3) — sem `.focus()` à mão.
      await waitFor(() => expect(cancel).toHaveFocus());
      await userEvent.keyboard(" ");
      await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(2), {
        timeout: 1000,
      });
      await waitForClosed();
      await expect(onCancelledAction).not.toHaveBeenCalled();
      // functional.item3: cancelar devolve o foco ao trigger que abriu.
      await waitFor(() => expect(trigger).toHaveFocus());
    });
  },
};

// Spy de módulo para provar que o callback de mudança dispara em modo controlado.
const onControlledOpenChange = fn();

/**
 * O motivo que cada fechamento do painel controlado relatou, na ordem.
 *
 * A play roda no mesmo módulo que a story e lê daqui. Um `fn()` de args não
 * serviria: o motivo não é prop do AlertDialog, e entraria na tabela de
 * propriedades da docs page como se fosse.
 */
const controlledCloseReasons: AlertDialogCloseReason[] = [];

export const Controlled: Story = {
  parameters: {
    covers: ["functional.item7"],
    docs: {
      // Composição diferente da do `meta`: estado do pai, gatilho FORA da raiz
      // e nenhum AlertDialogTrigger.
      source: { transform: alertDialogControlledSource },
      description: {
        story:
          "Abertura controlada via `open` + `onOpenChange` — o pai decide quando abrir, e o botão que abre fica fora do diálogo.",
      },
    },
  },
  beforeEach: () => {
    onControlledOpenChange.mockClear();
  },
  render: () => {
    const ControlledDemo = () => {
      const [open, setOpen] = useState(false);
      return (
        <div className="nds-stack" data-spacing="sm">
          <Button variant="destructive" onClick={() => setOpen(true)}>
            {LABELS.triggerLabel}
          </Button>
          <AlertDialog
            open={open}
            onOpenChange={(next, details) => {
              onControlledOpenChange(next);
              // O motivo é o que alimenta o `reason` do `dialog_close` — o
              // mesmo mapeador que a docs page usa, e o mesmo vocabulário de
              // três palavras. Só na SAÍDA: abrir não tem motivo.
              if (!next) {
                controlledCloseReasons.push(alertDialogCloseReason(details?.reason));
              }
              setOpen(next);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{LABELS.title}</AlertDialogTitle>
                <AlertDialogDescription>{LABELS.description}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{LABELS.cancel}</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  // A marca vem ANTES do fechamento: a lib entrega
                  // `close-press` para o Cancelar e para a ação, e sem ela a
                  // confirmação chegaria ao relatório como "apertou o cancelar".
                  onClick={() => markConfirmation()}
                >
                  {LABELS.action}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    };
    return <ControlledDemo />;
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    // A play REEXECUTA no mesmo DOM, e o que a rodada anterior empilhou não é
    // desta medição.
    controlledCloseReasons.length = 0;

    await step("Clique no trigger externo abre o diálogo", async () => {
      const trigger = canvas.getByRole("button", { name: TRIGGER_NAME });
      await userEvent.click(trigger);
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toBeVisible();
      // Sem asserção de callback na ABERTURA, e isso é decisão: aqui o gatilho
      // externo chama `setOpen(true)` direto — o pai já sabe, porque foi ele que
      // mandou. `onOpenChange` é o componente PEDINDO a mudança, e só dispara na
      // saída (Escape, Cancelar, ação). Medido: exigir a chamada com `true`
      // reprova. Uma fiação que roteie a abertura pelo próprio callback cobraria
      // os dois sentidos — mesma story, outra forma de compor.
    });

    await step("Escape fecha o diálogo controlado, notifica o pai e devolve o foco", async () => {
      await userEvent.keyboard("{Escape}");
      // Mesmo motivo do Playground: sem teto abaixo do default.
      await waitForClosed();
      await waitFor(() => expect(onControlledOpenChange).toHaveBeenCalledWith(false));
      // Sem AlertDialogTrigger, quem recebe o foco de volta é o elemento que o
      // tinha na abertura — o botão externo que o pai usou para abrir.
      await waitFor(() =>
        expect(canvas.getByRole("button", { name: TRIGGER_NAME })).toHaveFocus(),
      );
      await expect(controlledCloseReasons.at(-1)).toBe("escape");
    });

    await step("O Cancelar se chama close-button, e não 'o que sobrou'", async () => {
      await userEvent.click(canvas.getByRole("button", { name: TRIGGER_NAME }));
      const dialog = await waitForPortal("alertdialog");
      await userEvent.click(within(dialog).getByRole("button", { name: CANCEL_NAME }));
      await waitForClosed();
      await expect(controlledCloseReasons.at(-1)).toBe("close-button");
    });

    await step("A ação confirma, e o motivo sai api — não close-button", async () => {
      await userEvent.click(canvas.getByRole("button", { name: TRIGGER_NAME }));
      const dialog = await waitForPortal("alertdialog");
      await userEvent.click(within(dialog).getByRole("button", { name: ACTION_NAME }));
      await waitForClosed();
      // A lib entrega o MESMO `close-press` do Cancelar; o que separa os dois é
      // a marca que o `onClick` da ação deixa antes do fechamento.
      await expect(controlledCloseReasons.at(-1)).toBe("api");
    });

    await step("Os três caminhos relataram motivos DIFERENTES", async () => {
      // O vocabulário inteiro do componente, exercido de ponta a ponta: três
      // palavras, três gestos, nenhuma repetição. Sem este passo, um mapeador
      // que devolvesse a mesma palavra para tudo passaria nos anteriores.
      await expect(controlledCloseReasons).toEqual(["escape", "close-button", "api"]);
    });
  },
};
