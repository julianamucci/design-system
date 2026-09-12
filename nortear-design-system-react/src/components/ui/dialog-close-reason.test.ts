import { describe, expect, it } from "vitest";
import { dialogCloseReason, markConfirmation } from "./dialog-close-reason";

// A tabela inteira, e não um caso por categoria: quem ler este arquivo sabe o
// que cada motivo da lib vira sem abrir a função. É a mesma tabela das outras
// stacks — a do Vue e a do Svelte partem de gestos observados, porque a lib de
// lá não publica motivo, mas chegam nestas quatro palavras.
describe("dialogCloseReason", () => {
  it.each([
    ["escape-key", "escape"],
    ["outside-press", "overlay"],
    ["focus-out", "overlay"],
    ["close-press", "close-button"],
    // Diferença deliberada em relação ao popover: no painel modal o gatilho
    // fica coberto pelo véu, e só código fecha por ele.
    ["trigger-press", "api"],
    ["imperative-action", "api"],
    ["none", "api"],
  ])("%s vira %s", (motivo, esperado) => {
    expect(dialogCloseReason(motivo)).toBe(esperado);
  });

  it("motivo desconhecido ou ausente cai em api, e nunca em close-button", () => {
    // Com o padrão `close-button`, quem confirmou e fechou chegaria ao
    // relatório como "apertou o botão de fechar".
    expect(dialogCloseReason(undefined)).toBe("api");
    expect(dialogCloseReason("qualquer-coisa-nova-da-lib")).toBe("api");
  });

  it("a confirmação marcada vence o motivo da lib, e vale uma vez só", () => {
    // A ação que confirma e o cancelar são as duas partes de fechar da lib, que
    // entrega `close-press` para as duas — a marca é o que as separa.
    markConfirmation();
    expect(dialogCloseReason("close-press")).toBe("api");
    // Consumida: o próximo fechamento pelo mesmo caminho volta a ser o botão.
    expect(dialogCloseReason("close-press")).toBe("close-button");
  });
});
