// ─── Sonda de ouvinte vazado ──────────────────────────────────────────────────
//
// Apoio das plays de `ListenerCleanup`, como `drawer-portal-cleanup.ts` é apoio
// das plays do Drawer.
//
// A pergunta que ela responde não é "`destroy()` foi chamado?" — espiar a
// chamada não prova nada, porque uma implementação que chame `destroy()` e não
// solte coisa nenhuma passaria igual. A pergunta é "o OUVINTE sumiu?", e ela é
// respondida por duas provas independentes:
//
//   1. CONTAGEM (prova principal). O livro-caixa de `listener-ledger.ts` conta
//      cada `addEventListener` e cada `removeEventListener` de `document` e
//      `window` durante a janela do teste. Depois de a raiz sair da página o
//      livro tem de fechar em zero. Falha se a fábrica registrar por fora dos
//      métodos trocados, ou se alguém além dela registrar na mesma janela — por
//      isso a janela é curta e o exercício é feito com eventos de DOM crus, sem
//      `userEvent`, que traz ouvintes próprios.
//
//   2. COMPORTAMENTO (confirmação). Depois da saída, a sonda dispara no
//      `document` a bateria de eventos que as fábricas escutam e confere que o
//      nó desanexado não reagiu. Esta prova é mais fraca de propósito: uma
//      fábrica que guarde o ouvinte mas o deixe INERTE — a barra de navegação
//      fazia isso, com `isConnected` no topo do handler — passa nela e é pega
//      só pela contagem. É por isso que são duas, e não uma.
//
// Tudo aqui é precondição, nunca epílogo: cada passo limpa o que encontra antes
// de medir, para a story sobreviver ao REPLAY do painel Interactions.

import { expect } from 'storybook/test';
import { espiarOuvintes, describeVivos, type ListenerVivo } from '@/lib/listener-ledger';

/** Caixa de montagem da sonda, com legenda para a story nunca ficar em branco. */
export function probeHost(caption: string): HTMLElement {
  const root = document.createElement('div');

  const text = document.createElement('p');
  text.style.margin = '0 0 0.75rem';
  text.style.fontSize = '0.875rem';
  text.textContent = caption;

  const host = document.createElement('div');
  host.dataset.testid = 'cleanup-host';
  host.classList.add('nds-min-h-24');

  root.append(text, host);
  return root;
}

/**
 * Uma asserção por prova, e a principal comparando a DESCRIÇÃO inteira: assim a
 * falha diz `apos-saida=[document:keydown, document:click]` em vez de
 * "esperava [] e veio [Object, Object]".
 */
export async function checkLimpeza(probe: ProbeResult): Promise<void> {
  await expect(probe.hasDestroy).toBe(true);
  await expect(probe.descricao).toBe(
    'apos-saida=[nenhum] apos-reprise=[nenhum] orfaos=0/0',
  );
  await expect(probe.leaveReagiuAfter).toBe(false);
  await expect(probe.idempotenceError).toBe(null);
}

export type ProbeResult = {
  /** Ouvintes de `document`/`window` vivos depois de a raiz sair da página. */
  vivosAposOutput: ListenerVivo[];
  /** Idem, depois de dois `destroy()` extras e da bateria de eventos. */
  vivosAposReprise: ListenerVivo[];
  /** Mensagem do erro lançado por um `destroy()` repetido, se algum lançou. */
  idempotenceError: string | null;
  /** Nós portalados que sobraram no `body` com a limpeza AUTOMÁTICA (observador). */
  orfaosAposOutput: number;
  /** Idem, depois do `destroy()` chamado à mão. Separa as duas vias. */
  orfaosAposDestroy: number;
  /** Se o nó desanexado reagiu à bateria de eventos disparada no documento. */
  leaveReagiuAfter: boolean;
  /** A fábrica devolveu algo com `destroy()`? */
  hasDestroy: boolean;
  /** Texto para a mensagem de falha dizer O QUE sobrou. */
  descricao: string;
};

const BATERIA: Array<() => Event> = [
  () => new MouseEvent('click', { bubbles: true }),
  () => new MouseEvent('mousemove', { bubbles: true }),
  () => new MouseEvent('mouseup', { bubbles: true }),
  () => new PointerEvent('pointerup', { bubbles: true }),
  () => new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  () => new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
  () => new KeyboardEvent('keydown', { key: 'b', ctrlKey: true, bubbles: true }),
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Quantos nós portalados ainda existem, dando tempo à saída.
 *
 * Espera em vez de dormir um número mágico: o AlertDialog remove o painel só
 * depois da animação de saída, e um `esperar(120)` cravado media a animação, não
 * a limpeza. Se nunca zerar, devolve o que sobrou — a espera dá prazo, não
 * perdão.
 */
async function countOrfaos(selector: string | undefined, limit = 1200): Promise<number> {
  if (!selector) return 0;
  const end = Date.now() + limit;
  let n = document.querySelectorAll(selector).length;
  while (n > 0 && Date.now() < end) {
    await sleep(30);
    n = document.querySelectorAll(selector).length;
  }
  return n;
}

function assinatura(no: HTMLElement, seletorDePortal?: string): string {
  const portais = seletorDePortal ? document.querySelectorAll(seletorDePortal).length : 0;
  return [
    no.dataset.state ?? '',
    String(no.hidden),
    String(no.innerHTML.length),
    String(portais),
  ].join('|');
}

export async function sondarOuvintes(opts: {
  /** Onde a instância é montada. Esvaziado antes de medir. */
  host: HTMLElement;
  /** Cria a instância. Roda DENTRO da janela de espionagem. */
  montar: () => HTMLElement;
  /** Leva a instância ao estado que vaza — quase sempre "aberto". */
  exercitar?: (no: HTMLElement) => void | Promise<void>;
  /**
   * Onde mora o `destroy()`, quando não é no nó devolvido. O Sidebar devolve um
   * objeto de instância e não o elemento, e é o objeto que carrega o comando.
   */
  destruirAlvo?: () => void;
  /** Nós que a fábrica pendura no `body`, para contar órfãos. */
  seletorDePortal?: string;
}): Promise<ProbeResult> {
  const { host, montar, exercitar, destruirAlvo, seletorDePortal } = opts;

  // Precondição do REPLAY: o que estiver aqui é resíduo da execução anterior.
  host.replaceChildren();
  if (seletorDePortal) {
    document.querySelectorAll(seletorDePortal).forEach((el) => el.remove());
  }
  document.body.style.overflow = '';
  await sleep(20);

  const spy = espiarOuvintes();
  try {
    const no = montar();
    host.appendChild(no);
    await sleep(20);
    await exercitar?.(no);
    await sleep(40);

    no.remove();
    // O observador da forma compartilhada roda em microtask; os `setTimeout(…,
    // 0)` de clique-fora, no tique seguinte. 200ms cobre os dois com folga sem
    // virar espera cega longa.
    await sleep(200);

    const vivosAposOutput = spy.vivos();
    const orfaosAposOutput = await countOrfaos(seletorDePortal);

    // A referência do teste de comportamento é o estado JÁ LIMPO, não o estado
    // aberto de antes da saída: a limpeza legítima muda o nó (fecha o painel,
    // zera `data-state`), e comparar com o "antes" acusava reação em toda
    // fábrica que funcionava.
    const aposLimpeza = assinatura(no, seletorDePortal);

    for (const fazer of BATERIA) document.dispatchEvent(fazer());
    await sleep(80);
    const leaveReagiuAfter = assinatura(no, seletorDePortal) !== aposLimpeza;

    const withDestroy = no as HTMLElement & { destroy?: () => void };
    const destruir = destruirAlvo ?? withDestroy.destroy?.bind(withDestroy);
    const hasDestroy = typeof destruir === 'function';

    // Idempotência: uma chamada depois de o observador já ter disparado, e
    // outra logo em seguida. Nenhuma das duas pode explodir nem ressuscitar
    // ouvinte.
    let idempotenceError: string | null = null;
    try {
      destruir?.();
      destruir?.();
    } catch (e) {
      idempotenceError = e instanceof Error ? e.message : String(e);
    }

    const orfaosAposDestroy = await countOrfaos(seletorDePortal, 400);

    for (const fazer of BATERIA) document.dispatchEvent(fazer());
    await sleep(80);
    const vivosAposReprise = spy.vivos();

    return {
      vivosAposOutput,
      vivosAposReprise,
      idempotenceError,
      orfaosAposOutput,
      orfaosAposDestroy,
      leaveReagiuAfter,
      hasDestroy,
      descricao:
        `apos-saida=[${describeVivos(vivosAposOutput)}]` +
        ` apos-reprise=[${describeVivos(vivosAposReprise)}]` +
        ` orfaos=${orfaosAposOutput}/${orfaosAposDestroy}`,
    };
  } finally {
    spy.parar();
  }
}
