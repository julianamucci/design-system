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
 * O respiro que o posicionador guarda entre balão e borda da janela antes de
 * considerar que houve colisão — `collisionPadding` da configuração do tooltip.
 */
const COLLISION_PADDING = 5;

/**
 * Cabe um balão do lado pedido sem a janela recortá-lo?
 *
 * Existe para que asserção de lado EXATO tenha precondição medida, e não
 * presumida. Afirmar `data-side === side` só é honesto onde há espaço para
 * aquele lado: num quadro mais baixo o balão vira, e a story reprovaria pelo
 * tamanho da janela do teste em vez de por defeito do componente. A story de
 * colisão usa a mesma função ao contrário — ali a precondição é NÃO caber.
 *
 * A conta é a da lib: tamanho do balão no eixo do lado, mais a distância pedida
 * (`sideOffset`) e o respiro de colisão.
 */
export function fitsOnSide(
  trigger: HTMLElement,
  bubble: HTMLElement,
  side: 'top' | 'right' | 'bottom' | 'left',
  sideOffset = 4,
): boolean {
  const triggerBox = trigger.getBoundingClientRect();
  const bubbleBox = bubble.getBoundingClientRect();
  const needed =
    (side === 'top' || side === 'bottom' ? bubbleBox.height : bubbleBox.width)
    + sideOffset
    + COLLISION_PADDING;
  const available =
    side === 'top'
      ? triggerBox.top
      : side === 'bottom'
        ? window.innerHeight - triggerBox.bottom
        : side === 'left'
          ? triggerBox.left
          : window.innerWidth - triggerBox.right;
  return available >= needed;
}

/** Pausa explícita — usada só onde a asserção é "continua assim depois de X". */
export function wait(ms: number): Promise<void> {
  return new Promise((resolver) => setTimeout(resolver, ms));
}

/**
 * Um passo de ponteiro com a COORDENADA ditada.
 *
 * `userEvent.hover(balao)` / `unhover` não servem ao trajeto do ponteiro, e o
 * motivo é de mecanismo: a folha compartilhada deixa o balão
 * `pointer-events: none`, então o ponteiro real nunca o toca — quem segura (e
 * quem solta) a abertura é a ÁREA DE TOLERÂNCIA entre gatilho e balão, um
 * polígono calculado a partir do ponto de SAÍDA do gatilho e da caixa do balão.
 * Hover sintético num nó sem eventos de ponteiro chega com `clientX`/`clientY`
 * em 0,0 (D2 do PRD): mediria o ponteiro no canto da tela.
 *
 * Por isso os eventos vão à mão, e o `pointermove` vai no `body` — é ele que
 * recebe o evento quando o balão não recebe nada.
 *
 * Mora aqui, e não dentro de um arquivo de story, porque agora tem dois
 * leitores: a story de persistência, que prova a tolerância, e a do grupo, que
 * precisa FECHAR um balão aberto por ponteiro. Duas cópias é como uma delas
 * perde o `bubbles` e passa a medir outro caminho.
 */
export function pointerAt(
  target: HTMLElement,
  type: 'pointerleave' | 'pointermove',
  x: number,
  y: number,
): void {
  target.dispatchEvent(
    new PointerEvent(type, {
      pointerId: 1,
      pointerType: 'mouse',
      isPrimary: true,
      clientX: x,
      clientY: y,
      // `pointerleave` não borbulha no navegador, e o ouvinte da área de
      // tolerância está no PRÓPRIO gatilho — copiar a mecânica real é o que faz
      // o teste medir o caminho que a pessoa percorre.
      bubbles: type === 'pointermove',
      cancelable: true,
    }),
  );
}

/**
 * Espera o balão ASSENTAR no lado esperado.
 *
 * Esperar a EXISTÊNCIA do `data-side` e ler o valor em seguida é uma corrida
 * perdida, e ela foi medida nas stacks irmãs em 2026-09-16: o atributo nasce com
 * o lado PEDIDO e só troca no quadro em que o posicionador mede. Uma story de
 * colisão que lesse logo depois do "o atributo existe" receberia o lado pedido e
 * passaria afirmando uma virada que ainda não tinha acontecido.
 *
 * Relógio, e não `waitFor`: a leitura é pura (`getAttribute`), e o prazo ESTOURA
 * nomeando o lado que estava lá — em vez de pendurar, que é o que o `waitFor`
 * faz quando a condição toca o DOM.
 */
export async function sideSettledAs(
  trigger: HTMLElement,
  expected: 'top' | 'right' | 'bottom' | 'left',
  deadline = 2000,
): Promise<void> {
  const start = performance.now();
  for (;;) {
    const side = balaoDe(trigger)?.getAttribute('data-side') ?? null;
    if (side === expected) return;
    if (performance.now() - start > deadline) {
      throw new Error(
        `o balão não assentou em "${expected}" em ${deadline}ms — data-side lido: "${side}"`,
      );
    }
    await wait(16);
  }
}

/**
 * Quanto tempo, a partir de `start`, levou para `condition()` ficar verdadeira.
 *
 * NÃO É `waitFor`, e a diferença é a armadilha desta casa: o `waitFor` da suíte
 * reagenda por observador de mutação, então uma condição que MEXE no DOM provoca
 * a própria tentativa seguinte — o prazo nunca chega, o navegador crava um
 * núcleo e o arquivo morre sem resultado nem falha. Aqui a condição é leitura
 * pura (`getAttribute` + `getElementById`) e a espera é de relógio, com prazo
 * que ESTOURA em erro nomeado em vez de pendurar.
 *
 * O relógio é marcado pelo chamador, antes do gesto, porque o que se mede é o
 * tempo desde o hover — não desde o começo da espera.
 *
 * Mora aqui, e não em cada arquivo de story, pelo mesmo motivo do `balaoDe`: a
 * medição de TEMPO é o que separa "abriu" de "abriu na hora", e duas cópias são
 * como uma delas perde o prazo sem ninguém ver.
 */
export async function openedAfter(
  condition: () => boolean,
  start: number,
  deadline: number,
): Promise<number> {
  for (;;) {
    const elapsed = performance.now() - start;
    if (condition()) return elapsed;
    if (elapsed > deadline) {
      throw new Error(`nada abriu em ${Math.round(elapsed)}ms (prazo de ${deadline}ms)`);
    }
    await wait(8);
  }
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

/**
 * Ícone `circle-help` do lucide — o gatilho de ajuda ao lado de um rótulo.
 *
 * Mesma razão do `SAVE_ICON`: o desenho tem dois leitores, a story que o
 * renderiza e `tooltip.source.ts`, que o publica no painel Code. Em duas cópias
 * é assim que o `aria-hidden` sai de uma delas sem ninguém ver.
 */
export const HELP_ICON = `<svg
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
          <circle cx="12" cy="12" r="10" />
          <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
          <path d="M12 17h.01" />
        </svg>`;

/** Ícone `info` do lucide — o gatilho que expande uma sigla. */
export const INFO_ICON = `<svg
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
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>`;
