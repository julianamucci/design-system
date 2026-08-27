// A opacidade da hachura do decal — um número, num lugar só.
//
// Vive aqui porque é lido dos DOIS lados: pelas cinco stacks, que traçam a
// trama, e pelas cinco suítes, que verificam a cor com que ela foi traçada. Um
// número repetido dez vezes é um número que vai divergir na primeira vez que
// alguém o ajustar.

/**
 * Opacidade com que a hachura do decal é traçada, sobre a cor do fundo.
 *
 * ─── Por que não é 1 ─────────────────────────────────────────────────────────
 *
 * A hachura é traçada na cor do FUNDO, e em plena opacidade a listra ficava
 * dura: medido, 6.81 no pior caso entre a linha e o preenchimento. Ótimo para a
 * WCAG 1.4.1 e ruidoso na tela — cada série soma mais uma cor e mais uma forma
 * ao mesmo desenho, e num gráfico de oito séries o conjunto vira confusão.
 *
 * Com alfa, a linha vira mistura do fundo com a cor da série que está por baixo.
 *
 * ─── Por que a hachura, e não a fatia ────────────────────────────────────────
 *
 * A primeira ideia foi velar a FATIA com a cor do fundo. Duas medições a
 * descartaram:
 *
 * 1. O custo. A hachura é a cor do fundo, e a página também: aproximar o
 *    preenchimento do fundo aproxima a hachura do preenchimento NA MESMA
 *    MEDIDA. Um véu de 20% levava a fatia de 6.81 para 4.58 contra a página, e
 *    de 30% para 3.64 — os dois critérios caindo juntos. Suavizando a hachura,
 *    o preenchimento não é tocado e a fatia continua a 6.81 (WCAG 1.4.11).
 *
 * 2. A lib IGNORA `backgroundColor` no decal. Medido: o ladrilho sai byte a
 *    byte idêntico com e sem ele, e nem uma cor berrante aparece.
 *
 * ─── Por que 0.70 ────────────────────────────────────────────────────────────
 *
 * Separação entre a linha e o preenchimento, pior caso entre as oito séries,
 * nos três temas e nos dois modos:
 *
 *   1.00 · 6.81      0.80 · 4.52      0.70 · 3.61      0.60 · 2.93 — reprova
 *
 * 0.70 é o piso que ainda entrega os 3:1 de objeto gráfico, e é onde a listra
 * perde quase metade da dureza. Abaixo disso a trama volta a ser declarada e não
 * entregue — que é o modo mais silencioso de a 1.4.1 falhar, e o mesmo defeito
 * da lista padrão da lib, que traça em preto a 20% e mede de 1.14 a 1.57.
 */
export const HATCH_OPACITY = 0.7;
