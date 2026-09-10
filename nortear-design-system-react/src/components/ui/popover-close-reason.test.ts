import { describe, expect, it } from "vitest";
import { popoverCloseReason } from "./popover-close-reason";

// A tabela inteira, e não um caso por categoria: quem ler este arquivo sabe o
// que cada motivo da lib vira sem abrir a função. É a tabela que tem de bater
// com a da outra stack que recebe o motivo pronto da lib.
describe("popoverCloseReason", () => {
  it.each([
    ["escape-key", "escape"],
    ["outside-press", "overlay"],
    ["focus-out", "overlay"],
    // A diferença deliberada em relação ao drawer: lá o gatilho fica coberto
    // pelo véu e só código fecha por ele; aqui ele continua clicável.
    ["trigger-press", "overlay"],
    ["close-press", "close-button"],
    // Fechado por código — onde cai "salvou e fechou".
    ["imperative-action", "api"],
    ["none", "api"],
  ])("%s vira %s", (motivo, esperado) => {
    expect(popoverCloseReason(motivo)).toBe(esperado);
  });

  it("motivo desconhecido ou ausente cai em api, e nunca em close-button", () => {
    // O padrão do drawer é close-button; aqui é api, porque com o do drawer o
    // formulário que salvou e fechou chegaria ao relatório como "apertou fechar".
    expect(popoverCloseReason(undefined)).toBe("api");
    expect(popoverCloseReason("qualquer-coisa-nova-da-lib")).toBe("api");
  });
});
