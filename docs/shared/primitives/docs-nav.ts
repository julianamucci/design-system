/**
 * A forma do menu lateral das docs pages.
 *
 * É um contrato de três pontas: o `DocsNav` desenha o menu, o `DocsPageLayout`
 * recebe os grupos, e cada docs page monta o array. As três precisam concordar,
 * e nenhuma delas consegue conferir as outras sozinha.
 *
 * Vivia declarado cinco vezes, uma por stack, cada uma no seu próprio
 * `DocsNav` — e no Vue duas vezes dentro da mesma stack. Enquanto as cópias
 * eram idênticas nada quebrava, que é exatamente por que sobreviveram. O custo
 * aparecia no dia de mudar a forma: com um tipo só, o compilador aponta todos os
 * pontos que precisam acompanhar; com cinco, cada um aprova a si mesmo.
 *
 * Fica aqui, e não em `types.ts`: aquele arquivo se propunha a isto e passou
 * tanto tempo sem um único importador que suas declarações derivaram do código
 * sem ninguém notar — `ButtonSize` com metade dos valores, `BadgeVariant` com
 * duas variantes que saíram por contraste. Módulo com propósito estreito é lido
 * por quem o importa; gaveta de tipos genéricos não é lida por ninguém.
 */

/** Um item do menu: a âncora e o rótulo que a pessoa lê. */
export interface DocsNavSection {
  /** Id da `<section>` correspondente. É para cá que o menu rola. */
  id: string;
  label: string;
}

/** Um bloco do menu, com seu título e as seções que ele agrupa. */
export interface DocsNavGroup {
  label: string;
  sections: DocsNavSection[];
}
