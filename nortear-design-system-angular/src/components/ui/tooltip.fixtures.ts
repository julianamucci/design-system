/**
 * Andaime de leitura do Tooltip — um helper, quatro arquivos de story.
 *
 * Mora fora dos `*.stories.ts` porque ali TODO export nomeado vira story: uma
 * função auxiliar exportada apareceria na barra lateral do Storybook como se
 * fosse um exemplo do componente.
 *
 * As quatro cópias eram idênticas — o que é justamente o risco: o caminho até o
 * balão é o CONTRATO de acessibilidade do componente, e trocá-lo numa cópia
 * (por um `data-slot`, por um papel) deixaria os outros três arquivos provando
 * um contrato que o componente não cumpre mais. Só `tooltip.stories.ts`
 * carregava a explicação; ela veio junto.
 */

/**
 * O balão de um gatilho.
 *
 * Ele vive num portal no `body`, fora do `canvasElement`, e o caminho até ele é
 * o `aria-describedby` — o mesmo elo que o leitor de tela percorre. Procurar
 * pelo markup acharia o balão mesmo com a descrição desligada; por aqui, um
 * balão sem elo não é encontrado, que é o resultado certo.
 */
export function balaoDe(trigger: HTMLElement): HTMLElement | null {
  const id = trigger.getAttribute('aria-describedby');
  return id ? document.getElementById(id) : null;
}

/**
 * Ícone `save` do lucide desenhado no próprio template.
 *
 * O mapa do `NdsButtonIcon` não tem `save`, e aqui o ícone é decorativo — quem
 * nomeia o botão é o `aria-label`, que o Tooltip complementa e nunca substitui.
 *
 * Mora aqui porque o markup é lido por dois consumidores: a story, que o
 * desenha, e `tooltip.source.ts`, que o publica no painel Code. Cópia em dois
 * lugares é como um `aria-hidden` some de um deles sem ninguém ver.
 */
export const SAVE_ICON = `<svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
          class="nds-icon nds-shrink-0"
        >
          <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
          <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
          <path d="M7 3v4a1 1 0 0 0 1 1h7" />
        </svg>`;
