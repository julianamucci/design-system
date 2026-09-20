import { beforeEach, describe, expect, it } from "vitest";
import {
  closeDrawerByApi,
  drawerCloseReasonWatch,
  drawerDragWatch,
  markDrawerClose,
  resetDrawerCloseReason,
  takeDrawerCloseReason,
} from "./drawer-close-reason";

describe("drawerCloseReason", () => {
  beforeEach(() => resetDrawerCloseReason());

  it("sem anotação, o fechamento é o botão de saída do rodapé", () => {
    // Aqui o default é `close-button` porque é ele que a lib NÃO anuncia por
    // evento próprio. Na família do Dialog é o contrário, e o default é `api`.
    expect(takeDrawerCloseReason()).toBe("close-button");
  });

  it.each([
    ["escape", "escape"],
    ["overlay", "overlay"],
    ["close-button", "close-button"],
    ["api", "api"],
  ] as const)("a anotação %s chega inteira ao evento", (anotado, esperado) => {
    markDrawerClose(anotado);
    expect(takeDrawerCloseReason()).toBe(esperado);
  });

  it("a anotação é CONSUMIDA: o fechamento seguinte não herda o motivo do anterior", () => {
    markDrawerClose("escape");
    expect(takeDrawerCloseReason()).toBe("escape");
    expect(takeDrawerCloseReason()).toBe("close-button");
  });

  it("o fechamento por código informa api, e não se confunde com o botão de sair", () => {
    // Sem este produtor, um painel recolhido pelo programa chegava ao relatório
    // como `close-button` — "desistiu" e "o sistema recolheu" na mesma barra.
    let fechou = false;
    closeDrawerByApi(() => {
      fechou = true;
    });
    expect(fechou).toBe(true);
    expect(takeDrawerCloseReason()).toBe("api");
  });

  it("a anotação entra ANTES da mudança de estado", () => {
    // A ordem é o contrato: quem consome o motivo é o `onOpenChange`, que corre
    // síncrono dentro do fechamento. Anotado depois, ele chegaria tarde e o
    // evento sairia com o default.
    const vistos: string[] = [];
    closeDrawerByApi(() => {
      vistos.push(takeDrawerCloseReason());
    });
    expect(vistos).toEqual(["api"]);
  });

  it("os ouvintes do conteúdo anotam escape e véu", () => {
    drawerCloseReasonWatch.onEscapeKeyDown();
    expect(takeDrawerCloseReason()).toBe("escape");
    drawerCloseReasonWatch.onPointerDownOutside();
    expect(takeDrawerCloseReason()).toBe("overlay");
  });

  it("o arraste que dispensa fecha por overlay, e o arraste curto não deixa resíduo", () => {
    // A lib fecha ANTES de anunciar a soltura, por isso a anotação sai do
    // arraste. O arraste curto volta ao repouso e é anunciado com open=true.
    drawerDragWatch.onDrag();
    drawerDragWatch.onRelease(null as never, true);
    expect(takeDrawerCloseReason()).toBe("close-button");

    drawerDragWatch.onDrag();
    drawerDragWatch.onRelease(null as never, false);
    expect(takeDrawerCloseReason()).toBe("overlay");
  });
});
