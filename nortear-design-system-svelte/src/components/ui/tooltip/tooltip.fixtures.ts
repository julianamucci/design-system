// Fixture compartilhada pelas quatro stories do Tooltip.
//
// `balaoDe` estava copiado nos quatro arquivos, idêntico nos quatro. O caminho
// que ele percorre — gatilho → `aria-describedby` → elemento → balão — É a
// asserção de acessibilidade do componente, e não um atalho de consulta: quando
// ele devolve `null`, ou o balão não existe, ou a ligação com o gatilho se
// perdeu. Manter quatro cópias de uma prova dessas é manter quatro versões de
// uma regra só.
//
// Módulo à parte porque num `*.stories.ts` TODO export nomeado vira story: um
// helper exportado apareceria na sidebar como se fosse um exemplo.

/**
 * O balão de um gatilho, ou `null`.
 *
 * O balão vive num portal no `body`, então a busca é no DOCUMENTO — presa ao
 * `canvasElement` ela nunca acharia nada, passando por engano em toda asserção
 * de "está fechado".
 *
 * E o caminho até ele é o `aria-describedby`: uma consulta direta por
 * `[data-slot="tooltip-content"]` acharia o balão de QUALQUER gatilho da tela e
 * passaria mesmo com a descrição desligada do gatilho — que é justamente o
 * defeito que estas plays existem para pegar.
 */
export function balaoDe(trigger: HTMLElement): HTMLElement | null {
  const id = trigger.getAttribute('aria-describedby');
  const target = id ? document.getElementById(id) : null;
  return target?.closest<HTMLElement>('[data-slot="tooltip-content"]') ?? null;
}
