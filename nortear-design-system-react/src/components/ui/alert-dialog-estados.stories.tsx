import { figmaDesign } from "@shared/figma/design-links";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { userEvent, within, expect, fn, waitFor } from "storybook/test";
import { waitForPortal } from "@/lib/wait-for-portal";
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

const meta = {
  title: "UI/AlertDialog/Estados",
  tags: ["overlay"],
  component: AlertDialog,
  parameters: {
    design: figmaDesign("alertDialog"),
    layout: "centered",
    controls: { disable: true },
    actions: { disable: true },
    docs: {
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
 * Garante o diálogo aberto sem depender do estado de montagem.
 *
 * `defaultOpen` só vale na primeira montagem, e o painel Interactions
 * reexecuta a play no MESMO DOM: na segunda rodada o diálogo já foi fechado
 * pelos passos anteriores e o passo de abertura media o vazio.
 */
async function garantirAberto(canvas: ReturnType<typeof within>) {
    // querySelector e não queryByRole: numa rodada do arquivo inteiro sobra o
  // portal da story anterior por alguns quadros, e queryByRole estoura em
  // "multiple elements" antes de a limpeza acontecer.
  if (!document.querySelector('[role="alertdialog"]')) {
    await userEvent.click(canvas.getByRole("button", { name: /^Excluir$/i }));
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

export const Closed: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Estado inicial — o trigger está visível e o diálogo não foi aberto ainda.",
      },
    },
  },
  render: () => (
    <AlertDialog>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Excluir item
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
          <AlertDialogDescription>
            Esta ação não pode ser desfeita.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Apenas o trigger está visível", async () => {
      const trigger = canvas.getByRole("button", { name: /Excluir item/i });
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
    covers: ["accessibility.item6", "accessibility.item7"],
    docs: {
      description: {
        story:
          "Diálogo aberto com `defaultOpen`. Usado para captura visual no Chromatic.",
      },
    },
  },
  render: () => (
    <AlertDialog defaultOpen>
      <AlertDialogTrigger render={<Button variant="destructive" />}>
        Excluir item
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Excluir item permanentemente?</AlertDialogTitle>
          <AlertDialogDescription>
            O item será removido de forma definitiva e não poderá ser recuperado.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction variant="destructive">
            Excluir
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  ),
  play: async ({ step }) => {
    await step("Diálogo abre já montado e com backdrop", async () => {
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toBeVisible();
      await expect(
        document.querySelector('[data-slot="alert-dialog-overlay"]'),
      ).not.toBeNull();
    });

    await step("Nome e descrição acessíveis vêm do Title e da Description", async () => {
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toHaveAccessibleName(/Excluir item/i);
      await expect(dialog).toHaveAccessibleDescription(/removido de forma definitiva/i);
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
      description: {
        story:
          "Usuário confirma a ação clicando em Action — handler `onClick` é disparado e o diálogo fecha. Enter com o Action focado produz o mesmo resultado.",
      },
    },
  },
  beforeEach: () => {
    onConfirm.mockClear();
  },
  render: () => {
    return (
      <AlertDialog defaultOpen>
        <AlertDialogTrigger render={<Button variant="destructive" />}>
          Excluir
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              data-testid="confirm-action"
              variant="destructive"
              onClick={onConfirm}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Diálogo está aberto", async () => {
      const dialog = await garantirAberto(canvas);
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

    await step("Enter com o Action focado confirma de novo", async () => {
      const trigger = canvas.getByRole("button", { name: /^Excluir$/i });
      await userEvent.click(trigger);
      await waitForPortal("alertdialog");
      const action = await within(document.body).findByTestId("confirm-action");
      action.focus();
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
  render: () => {
    return (
      <AlertDialog defaultOpen>
        <AlertDialogTrigger render={<Button variant="destructive" />}>
          Excluir
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é permanente e não poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="cancel-action" onClick={onCancel}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={onCancelledAction}>
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step("Cancel é clicado, dispara o callback e o diálogo fecha", async () => {
      await garantirAberto(canvas);
      const cancel = await waitForPortal("button", { name: /Cancelar/i });
      await userEvent.click(cancel);
      await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1), {
        timeout: 1000,
      });
      await waitForClosed();
      // O ponto do cancelamento: a ação destrutiva não roda.
      await expect(onCancelledAction).not.toHaveBeenCalled();
    });

    await step("Space com o Cancel focado cancela de novo", async () => {
      const trigger = canvas.getByRole("button", { name: /^Excluir$/i });
      await userEvent.click(trigger);
      await waitForPortal("alertdialog");
      const cancel = await within(document.body).findByTestId("cancel-action");
      cancel.focus();
      await expect(cancel).toHaveFocus();
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

export const Controlled: Story = {
  parameters: {
    covers: ["functional.item7"],
    docs: {
      description: {
        story:
          "Abertura controlada via `open` + `onOpenChange` — pai decide quando abrir e fechar.",
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
            Abrir via estado externo
          </Button>
          <AlertDialog
            open={open}
            onOpenChange={(next) => {
              onControlledOpenChange(next);
              setOpen(next);
            }}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Controlado pelo pai</AlertDialogTitle>
                <AlertDialogDescription>
                  Este diálogo é comandado por estado externo via `open` e
                  `onOpenChange`.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Fechar</AlertDialogCancel>
                <AlertDialogAction
                  variant="destructive"
                  onClick={() => setOpen(false)}
                >
                  Confirmar
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

    await step("Clique no trigger externo abre o diálogo", async () => {
      const trigger = canvas.getByRole("button", {
        name: /Abrir via estado externo/i,
      });
      await userEvent.click(trigger);
      const dialog = await waitForPortal("alertdialog");
      await expect(dialog).toBeVisible();
    });

    await step("Escape fecha o diálogo controlado e notifica o pai", async () => {
      await userEvent.keyboard("{Escape}");
      // Mesmo motivo do Playground: sem teto abaixo do default.
      await waitForClosed();
      await waitFor(() => expect(onControlledOpenChange).toHaveBeenCalledWith(false));
    });
  },
};
