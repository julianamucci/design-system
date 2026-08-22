// ─── Precondição das plays do Drawer ─────────────────────────────────────────
//
// A factory portaliza o painel para o `document.body`, e o runner de stories só
// limpa o canvas — o que estiver no body sobrevive à troca de story. Antes, cada
// play fechava o painel no fim para compensar, o que deixava as stories de
// estado ABERTO terminando fechadas: o axe roda depois da play e o Chromatic
// fotografa o fim, então a foto e a varredura pegavam a tela errada.
//
// Agora a limpeza é PRECONDIÇÃO, não epílogo: no começo da play qualquer painel
// no body é resíduo da story anterior, porque esta ainda não abriu nada. Assim
// cada story pode terminar no estado que ela existe para demonstrar.

export function drawerClearPortais(): void {
  document
    .querySelectorAll('[data-slot="drawer-content"], [data-slot="drawer-overlay"]')
    .forEach((el) => el.remove());
  // A trava de rolagem é do modo modal e mora no body; sem devolvê-la, a story
  // seguinte nasce sem poder rolar.
  document.body.style.overflow = '';
}
