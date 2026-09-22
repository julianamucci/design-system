import { describe, expect, it } from "vitest";
import { markConfirmation } from "./dialog-close-reason";
import {
  alertDialogCloseReason,
  type AlertDialogCloseReason,
} from "./alert-dialog-close-reason";

// A tabela inteira, e não um caso por categoria: quem ler este arquivo sabe o
// que cada motivo da lib vira sem abrir a função. O AlertDialog fala o mesmo
// dialeto do Dialog MENOS `overlay` — clique no véu não fecha este painel (D1
// do PRD), então a palavra não tem comportamento atrás dela.
describe("alertDialogCloseReason", () => {
  it.each([
    ["escape-key", "escape"],
    ["close-press", "close-button"],
    // Diferença deliberada em relação ao popover: no painel modal o gatilho
    // fica coberto pelo véu, e só código fecha por ele.
    ["trigger-press", "api"],
    ["imperative-action", "api"],
    ["none", "api"],
  ])("%s vira %s", (motivo, esperado) => {
    expect(alertDialogCloseReason(motivo)).toBe(esperado);
  });

  it.each(["outside-press", "focus-out"])(
    "%s não chega, e se chegar vira api — nunca overlay",
    (motivo) => {
      // Inventar `overlay` para eles criaria uma palavra que este componente
      // não tem, e o relatório ganharia uma dimensão sem gesto atrás.
      expect(alertDialogCloseReason(motivo)).toBe("api");
    },
  );

  it("motivo desconhecido ou ausente cai em api, e nunca em close-button", () => {
    expect(alertDialogCloseReason(undefined)).toBe("api");
    expect(alertDialogCloseReason("qualquer-coisa-nova-da-lib")).toBe("api");
  });

  it("o vocabulário tem três palavras, e a que falta é proposital", () => {
    const vocabulary: AlertDialogCloseReason[] = ["escape", "close-button", "api"];
    const observed = ["escape-key", "close-press", "none", "outside-press"].map(
      (motivo) => alertDialogCloseReason(motivo),
    );
    expect([...new Set(observed)].sort()).toEqual([...vocabulary].sort());
  });

  it("a confirmação marcada vence o motivo da lib, e vale uma vez só", () => {
    // A ação que confirma e o cancelar são as duas partes de fechar da lib, que
    // entrega `close-press` para as duas — a marca é o que as separa.
    markConfirmation();
    expect(alertDialogCloseReason("close-press")).toBe("api");
    // Consumida: o próximo fechamento pelo mesmo caminho volta a ser o botão.
    expect(alertDialogCloseReason("close-press")).toBe("close-button");
  });
});
