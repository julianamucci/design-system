import { beforeEach, describe, expect, it } from "vitest";
import {
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
