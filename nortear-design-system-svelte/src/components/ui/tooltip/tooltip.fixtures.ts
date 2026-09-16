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

/** De que lado o balão nasceu — o gancho `data-side` que o CSS lê. */
export function sideOf(balao: HTMLElement | null): string | null {
  return balao?.closest('[data-side]')?.getAttribute('data-side') ?? null;
}

/**
 * O vão entre gatilho e balão, em px: o `sideOffset` das cenas (4) mais a
 * altura da seta (5).
 *
 * Entra em toda conta de espaço. Sem ele, a premissa aprovaria uma cena em que
 * o balão cabe e o vão não — e é o vão que decide a virada.
 */
export const BUBBLE_GAP = 9;

/** Espaço livre entre uma borda do gatilho e a borda da JANELA. */
function slackOn(trigger: HTMLElement, side: string): number {
  const r = trigger.getBoundingClientRect();
  if (side === 'top') return r.top;
  if (side === 'bottom') return window.innerHeight - r.bottom;
  if (side === 'left') return r.left;
  return window.innerWidth - r.right;
}

/**
 * Quanto espaço há de um lado do gatilho, quanto o balão precisaria dali, e a
 * mensagem pronta para a asserção.
 *
 * Existe porque afirmar o lado EXATO sem garantir a folga não mede o
 * componente: mede o tamanho da janela de quem roda a suíte. Medido em
 * 2026-09-16 no react — ~38 px acima do gatilho para um balão de ~29 px mais o
 * vão — a lib virava o balão, CORRETAMENTE, e a story reprovava como se fosse
 * defeito de posicionamento.
 *
 * Nesta stack a folga vem do andaime (`nds-min-h-100`, 400 px), e até aqui isso
 * estava escrito em COMENTÁRIO. Comentário não reprova: no dia em que o andaime
 * encolher, quem acusa é a asserção do lado, apontando para o lugar errado. Com
 * a premissa medida, quem reprova primeiro é a cena, dizendo quanto faltou.
 *
 * Leitura pura — como as demais daqui, nunca de dentro de um `waitFor`.
 *
 * A folga é POR EIXO: altura não compra lado horizontal.
 */
export function fitsOnSide(
  trigger: HTMLElement,
  bubble: HTMLElement,
  side: string,
): { slack: number; needed: number; message: string } {
  const b = bubble.getBoundingClientRect();
  const slack = slackOn(trigger, side);
  const needed = (side === 'top' || side === 'bottom' ? b.height : b.width) + BUBBLE_GAP;
  return {
    slack,
    needed,
    // O tamanho do quadro vai junto: sem ele, "faltaram 6 px" não diz se a cena
    // é que ficou apertada ou se o quadro do runner é que é pequeno.
    message: `sem folga em "${side}": ${Math.round(slack)}px livres para um balão que precisa de ${Math.round(needed)}px (janela ${window.innerWidth}×${window.innerHeight}) — abra espaço em volta do gatilho`,
  };
}

/** Pausa explícita — usada só onde a asserção é "continua assim depois de X". */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Espera o balão aparecer por RELÓGIO, com prazo, e diz se apareceu.
 *
 * Não é `waitFor` de propósito, e o motivo é de mecanismo: o `waitFor` reagenda
 * por observador de mutação, então condição que toca o DOM provoca a própria
 * retentativa, o prazo nunca chega e o arquivo morre sem resultado nem falha.
 * Aqui a leitura é pura — `balaoDe` só consulta —, e o laço de relógio é o que
 * deixa o TEMPO ser medido em vez de apenas tolerado.
 *
 * Mora aqui, e não em cada arquivo de story, porque as duas medidas de tempo
 * do componente — a espera padrão do provedor e a janela de cortesia do grupo —
 * vivem em arquivos diferentes e faziam a mesma pergunta com duas cópias da
 * mesma resposta.
 */
export async function waitForBubble(trigger: HTMLElement, timeout: number): Promise<boolean> {
  const deadline = performance.now() + timeout;
  while (performance.now() < deadline) {
    if (balaoDe(trigger) !== null) return true;
    await wait(25);
  }
  return false;
}

/**
 * Espera, por RELÓGIO, até o balão PUBLICAR o lado esperado.
 *
 * Esperar o atributo EXISTIR não serve, e foi o defeito medido em 2026-09-16: o
 * `data-side` nasce com o lado PEDIDO e a virada só chega no quadro seguinte,
 * quando o posicionador mede de verdade. Um `waitFor(...toBeTruthy())` seguido
 * de leitura devolvia `top` numa cena que vira para `bottom`.
 *
 * Leitura pura aqui dentro. Quem devolve o valor para a asserção é o chamador —
 * assim a falha mostra o lado que veio, e não só um `false`.
 */
export async function waitForSide(
  trigger: HTMLElement,
  side: string,
  timeout: number,
): Promise<void> {
  const deadline = performance.now() + timeout;
  while (performance.now() < deadline) {
    if (sideOf(balaoDe(trigger)) === side) return;
    await wait(25);
  }
}

/** O par da função acima: o balão SUMIU dentro do prazo? */
export async function waitForBubbleGone(trigger: HTMLElement, timeout: number): Promise<boolean> {
  const deadline = performance.now() + timeout;
  while (performance.now() < deadline) {
    if (balaoDe(trigger) === null) return true;
    await wait(25);
  }
  return false;
}
