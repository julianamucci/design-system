/**
 * Marcação que a story e a transform do painel Code do Collapsible dividem.
 *
 * O chevron aparece nos dois lugares e precisa ser o MESMO desenho: se a story
 * mostrasse um ícone e o snippet ensinasse outro, quem copiasse veria um
 * componente diferente do que acabou de ver na tela. Mora aqui — e não no
 * `.source.ts` — porque o `source-snippets.test.ts` cobra que todo export
 * daquele módulo seja construtor de snippet, e isto é marcação, não construtor.
 */

/**
 * Chevron do lucide desenhado no próprio template.
 *
 * `NdsButtonIcon` não tem `chevron-down` no mapa, e o ícone aqui é decorativo —
 * o estado quem conta é o `aria-expanded`. A rotação de 180° é global:
 * `.nds-chevron` gira sob `[aria-expanded="true"]` e sob `[data-state="open"]`,
 * os dois presentes no trigger.
 */
export const CHEVRON = `<svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="nds-icon nds-shrink-0 nds-transition-transform nds-chevron"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>`;
