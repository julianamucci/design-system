// ─── Forma única de limpeza das fábricas ──────────────────────────────────────
//
// Quem registra ouvinte em `document` ou `window` precisa de um jeito de soltar.
// Sem framework não existe `unmount`: a fábrica devolve um nó, quem chama o
// insere e, um dia, o remove — e nesse dia ninguém avisa o ouvinte.
//
// Duas garantias:
//
// 1. `destroy()` público e idempotente. Chamar duas vezes não faz nada na
//    segunda; chamar depois de o observador já ter disparado também não.
// 2. Disparo automático quando a raiz sai do documento. É o que faz a limpeza
//    acontecer sem exigir disciplina de quem consome — que era a situação
//    anterior, em que "não vaza" dependia de o consumidor fechar antes de
//    remover.
//
// O observador é UM para o módulo inteiro, não um por instância. Antes desta
// forma cada fábrica montava o seu, e uma página com uma tabela, um menu e
// quatro tooltips pagava seis varreduras de `subtree` a cada mutação do body.

export type Destroyable = {
  /**
   * Solta os ouvintes de documento e desmonta o que a fábrica pendurou fora da
   * própria raiz. Chamado sozinho quando a raiz sai do documento.
   */
  destroy: () => void;
};

/** Nó devolvido por uma fábrica que também aceita `destroy()`. */
export type DestroyableElement<T extends HTMLElement = HTMLElement> = T & Destroyable;

/**
 * Prazo para uma raiz recém-criada entrar no documento.
 *
 * Existem dois motivos diferentes para uma raiz aparecer desconectada, e a
 * limpeza deve o oposto a cada um:
 *
 *   • "AINDA não entrou" — a fábrica devolve a raiz e quem chama a insere
 *     depois. Quem abre o painel no mesmo tique da criação (as stories que
 *     nascem abertas fazem isso) produz uma mutação com a raiz ainda solta.
 *     Limpar aqui desmontaria o painel no quadro seguinte ao de abrir.
 *   • "NUNCA entrou" — a instância foi criada e descartada. Se ela chegou a
 *     abrir, o painel foi portalado para o `body` e ficou lá: ninguém mais tem
 *     referência para chamar `destroy()`, e a raiz nunca vai se conectar para
 *     disparar a limpeza automática.
 *
 * O que separa os dois é tempo, e só. A inserção de quem chama acontece no
 * mesmo quadro; este prazo é uma ordem de grandeza maior que isso e uma ordem
 * de grandeza menor que a vida de uma tela.
 */
const MOUNT_MS_GRACA = 600;

type Registro = {
  raiz: HTMLElement;
  limpar: () => void;
  /** Se a raiz já foi vista dentro do documento alguma vez. */
  jaConectou: boolean;
  /** Quando a instância foi criada, para medir a graça de montagem. */
  nascidoEm: number;
};

const registros = new Set<Registro>();
let observador: MutationObserver | null = null;

function varrer(): void {
  for (const registro of [...registros]) {
    if (registro.raiz.isConnected) {
      registro.jaConectou = true;
      continue;
    }
    if (!registro.jaConectou && Date.now() - registro.nascidoEm < MOUNT_MS_GRACA) {
      continue;
    }
    registros.delete(registro);
    // Um observador para todos: sem esta cerca, a limpeza de UM componente que
    // lançasse abortaria o laço e deixaria todos os seguintes por limpar — e o
    // erro morreria dentro do callback do MutationObserver, sem teste nenhum
    // ficando vermelho. O preço de compartilhar o observador é isolar a falha.
    try {
      registro.limpar();
    } catch (erro) {
      // Relançar viraria erro global não tratado e derrubaria a story que por
      // acaso estivesse rodando — que não é a culpada. O console basta para o
      // caso aparecer na saída da suíte.
      console.error('[nds] falha ao limpar instância ao sair do documento', erro);
    }
  }
  if (registros.size === 0) {
    observador?.disconnect();
    observador = null;
  }
}

function ensureObservador(): void {
  /* v8 ignore next -- guarda de ambiente: o browser sempre tem
     MutationObserver, e a suíte roda em browser. Existe para render em ambiente
     sem DOM completo. */
  if (typeof MutationObserver === 'undefined') return;
  if (observador) return;
  observador = new MutationObserver(varrer);
  const observar = () => observador?.observe(document.body, { childList: true, subtree: true });
  /* v8 ignore next 2 -- no browser o body já existe quando a fábrica roda; o
     fallback cobre montagem em documento ainda sem body. */
  if (document.body) observar();
  else queueMicrotask(observar);
}

/**
 * Pendura `destroy()` no que a fábrica devolve e passa a vigiar a raiz.
 *
 * @param raiz  Nó que quem consome insere e remove — é a saída dele do
 *              documento que dispara a limpeza.
 * @param alvo  O que a fábrica devolve. Quase sempre a própria raiz; o Sidebar
 *              devolve um objeto de instância, e recebe `destroy` do mesmo
 *              jeito.
 * @param limpar Solta o que a instância prendeu. Roda no máximo UMA vez.
 */
export function tornarDestruivel<T extends object>(
  raiz: HTMLElement,
  alvo: T,
  limpar: () => void,
): T & Destroyable {
  let destruido = false;

  const registro: Registro = {
    raiz,
    jaConectou: false,
    nascidoEm: Date.now(),
    limpar: () => {
      if (destruido) return;
      destruido = true;
      limpar();
    },
  };

  registros.add(registro);
  ensureObservador();

  // Uma varredura armada no fim da graça. Sem ela, a instância criada e
  // descartada só seria recolhida na PRÓXIMA mutação do body — que pode não
  // vir, e aí o painel que ela portalou fica na tela sem dono.
  if (typeof setTimeout !== 'undefined') {
    setTimeout(varrer, MOUNT_MS_GRACA + 50);
  }

  Object.defineProperty(alvo, 'destroy', {
    value: (): void => {
      // Sai do registro ANTES de limpar: se `limpar` mexer no DOM — e mexe,
      // remove painel portalado —, a varredura disparada por essa mutação não
      // pode reentrar neste mesmo registro.
      registros.delete(registro);
      registro.limpar();
    },
    writable: true,
    configurable: true,
    enumerable: false,
  });

  return alvo as T & Destroyable;
}
