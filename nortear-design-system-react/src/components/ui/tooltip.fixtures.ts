// Fixture compartilhada pelas stories do Tooltip.
//
// Fica fora dos `*.stories.tsx` porque no CSF todo export nomeado é lido como
// story: um helper exportado de um arquivo de story apareceria na sidebar como
// se fosse um exemplo.
//
// As quatro cópias que existiam eram idênticas — o que é justamente o risco: o
// caminho até o balão é o CONTRATO de acessibilidade do componente, e trocá-lo
// numa cópia (por um `data-slot`, por um papel) deixaria os outros três
// arquivos provando um contrato que o componente não cumpre mais.

/**
 * O balão de um gatilho.
 *
 * Ele vive num portal no `body`, fora do `canvasElement`, e o caminho até ele é
 * o `aria-describedby` — o mesmo elo que o leitor de tela percorre. Procurar
 * pelo markup acharia o balão mesmo com a descrição desligada; por aqui, um
 * balão sem elo não é encontrado, que é o resultado certo.
 */
export function balaoDe(trigger: HTMLElement): HTMLElement | null {
  const id = trigger.getAttribute("aria-describedby");
  return id ? document.getElementById(id) : null;
}

/** Pausa explícita — usada só onde a asserção é "continua assim depois de X". */
export function wait(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

/**
 * Instante em que o balão apareceu, por relógio.
 *
 * Laço de relógio, e não `waitFor`: o que se afirma aqui é TEMPO, e o `waitFor`
 * reagenda por observador de mutação — um prazo dele diria "apareceu em algum
 * momento", que é justamente o que não distingue 300 ms de 600. O laço só LÊ
 * (`aria-describedby` + `getElementById`), sem tocar no DOM, então não há como
 * a própria tentativa provocar a seguinte.
 *
 * Passo de 10 ms porque a medição é de borda: o limite superior da asserção é o
 * default de 600 da biblioteca, e granularidade grossa comeria a margem.
 *
 * Mora aqui, e não num arquivo de story, porque DUAS medem tempo — o atraso
 * padrão nos estados e a janela do grupo nas composições. Copiada, a próxima
 * correção valeria para uma e deixaria a outra provando outra coisa.
 */
export async function bubbleShownAt(
  trigger: HTMLElement,
  budget: number,
): Promise<number> {
  const deadline = performance.now() + budget;
  while (performance.now() < deadline) {
    if (balaoDe(trigger) !== null) {
      return performance.now();
    }
    await wait(10);
  }
  return Number.POSITIVE_INFINITY;
}

/**
 * Leva o ponteiro ao centro de um elemento, por COORDENADA.
 *
 * Ditada à mão, e não `userEvent.hover(balao)`: a folha compartilhada deixa o
 * balão `pointer-events: none`, e um hover sintético sobre um nó assim chega
 * com `clientX/clientY` em 0,0 — mediria o ponteiro no canto da tela, não sobre
 * o balão (D2 do PRD). A área de tolerância do floating-ui lê COORDENADA, então
 * é coordenada que o teste precisa fornecer.
 */
/**
 * Espera o balão SUMIR, por relógio e com leitura pura.
 *
 * O par negativo de `bubbleShownAt`. `waitFor` não serve aqui pelo mesmo motivo
 * de lá — ele reagenda por observador de mutação, e o que se espera é o fim de
 * uma tolerância medida em TEMPO. Devolve `true` se fechou dentro do prazo,
 * para a asserção poder reprovar com mensagem própria em vez de estourar.
 */
export async function bubbleHiddenBy(
  trigger: HTMLElement,
  budget: number,
): Promise<boolean> {
  const deadline = performance.now() + budget;
  while (performance.now() < deadline) {
    if (balaoDe(trigger) === null) return true;
    await wait(10);
  }
  return balaoDe(trigger) === null;
}

/**
 * De que lado o balão nasceu.
 *
 * Divergência de lib, registrada e não "alinhada": o `@base-ui/react` publica
 * `data-side` no POSICIONADOR (`.nds-tooltip-positioner`), enquanto reka-ui,
 * bits-ui, radix-ng e a factory do Vanilla publicam no próprio balão. Subir até
 * o `[data-side]` mais próximo lê o gancho onde quer que ele esteja.
 */
function ladoDe(balao: HTMLElement | null): string | null {
  return balao?.closest("[data-side]")?.getAttribute("data-side") ?? null;
}

/**
 * Espera o `data-side` chegar ao valor ESPERADO, e devolve o que de fato ficou.
 *
 * Esperar só a EXISTÊNCIA do atributo é o defeito que reprovou as stories de
 * colisão: o atributo NASCE com o lado pedido, e a virada só chega no quadro
 * seguinte, quando o posicionador mede. Quem lê logo depois de um
 * `toBeTruthy()` lê o valor de ANTES da medição, e uma story de colisão passa
 * "provando" uma virada que ainda não aconteceu.
 *
 * Devolve o último valor visto em vez de estourar: quem chama é que afirma a
 * igualdade, e a mensagem mostra o lado que ficou. Laço de relógio com leitura
 * pura — nada de `waitFor`, que reagenda por observador de mutação.
 */
export async function esperarLado(
  balao: HTMLElement,
  esperado: Side,
  budget = 1000,
): Promise<string | null> {
  const deadline = performance.now() + budget;
  let visto = ladoDe(balao);
  while (performance.now() < deadline) {
    visto = ladoDe(balao);
    if (visto === esperado) return visto;
    await wait(10);
  }
  return visto;
}

/** Distância em px entre uma borda do elemento e a borda da JANELA. */
function folga(alvo: HTMLElement, side: Side): number {
  const r = alvo.getBoundingClientRect();
  if (side === "top") return r.top;
  if (side === "bottom") return window.innerHeight - r.bottom;
  if (side === "left") return r.left;
  return window.innerWidth - r.right;
}

export type Side = "top" | "right" | "bottom" | "left";

/**
 * `sideOffset` (4) + altura da seta (5), como `tooltip.tsx` os soma.
 *
 * É o vão entre gatilho e balão, e entra na conta do espaço necessário: sem ele
 * a premissa aprovaria um palco onde o balão cabe mas o vão não.
 */
const VAO = 9;

/**
 * Quanto espaço há de um lado do gatilho, e quanto o balão precisaria.
 *
 * Existe porque afirmar o lado EXATO sem garantir a folga não mede o
 * componente: mede o tamanho da janela de quem roda a suíte. Perto da borda o
 * base-ui vira o balão e está CERTO — a story é que estaria perguntando a coisa
 * errada. Quem afirma lado exato confere a premissa antes, e com os números na
 * mensagem, para um palco apertado reprovar dizendo o que faltou.
 *
 * Mora aqui porque DUAS stories afirmam lado exato (o Playground e a dos quatro
 * lados), e copiar a conta deixaria uma delas para trás na próxima correção.
 */
export function cabeNoLado(
  trigger: HTMLElement,
  balao: HTMLElement,
  side: Side,
): { folga: number; preciso: number; viewport: string } {
  const b = balao.getBoundingClientRect();
  const preciso = (side === "top" || side === "bottom" ? b.height : b.width) + VAO;
  // O tamanho do quadro vai junto na mensagem: sem ele, "faltaram 6px" não diz
  // se o palco é grande demais ou se o quadro do runner é que é pequeno — e foi
  // essa dúvida que custou uma rodada inteira aqui.
  return {
    folga: folga(trigger, side),
    preciso,
    viewport: `${window.innerWidth}×${window.innerHeight}`,
  };
}

export function movePointer(alvo: HTMLElement): { x: number; y: number } {
  const r = alvo.getBoundingClientRect();
  const x = r.left + r.width / 2;
  const y = r.top + r.height / 2;
  document.dispatchEvent(
    new MouseEvent("mousemove", { clientX: x, clientY: y, bubbles: true }),
  );
  return { x, y };
}
