// ─── Contador de ouvintes de `document` / `window` ────────────────────────────
//
// Apoio de play function, como `wait-for-portal.ts`. Existe para responder a UMA
// pergunta que nenhuma asserção de DOM responde: depois que o nó saiu da página,
// SOBROU ouvinte preso ao documento?
//
// Provar que `destroy()` foi chamado não prova nada — o que interessa é o
// ouvinte ter sumido. Aqui a prova é por contagem: o espião troca
// `addEventListener` / `removeEventListener` de `document` e `window` por
// versões que mantêm um livro-caixa, e no fim o livro tem de fechar em zero.
//
// Por que esta prova pode falhar, dito na cara:
//
//   • Ela só enxerga o que passa pelos métodos trocados. Uma fábrica que
//     tivesse guardado a referência a `addEventListener` ANTES de o espião
//     começar registraria por fora do livro, e o zero seria mentira. Nenhuma
//     das fábricas faz isso, mas nada no código impede.
//   • Ela só cobre `document` e `window`. Ouvinte pendurado em `document.body`
//     ou noutro nó que sobreviva à troca de story não aparece.
//   • Ela conta o que for registrado na JANELA em que está ligada — inclusive
//     por terceiros. Se o runner de stories registrar algo nesse intervalo, o
//     livro acusa vazamento que não é da fábrica. Por isso a janela é curta:
//     liga, cria o componente, exercita, remove, confere, desliga.
//   • Ouvinte com `{ once: true }` é embrulhado para poder ser baixado quando o
//     browser o remove sozinho. Um remove por identidade da função original
//     continua funcionando (o livro traduz), mas quem chamar
//     `removeEventListener` DEPOIS de `parar()` não acha o embrulho.

type Alvo = 'document' | 'window';

type Entrada = {
  alvo: Alvo;
  type: string;
  fn: unknown;
  capture: boolean;
  origem: string;
  embrulho?: EventListener;
};

export type ListenerVivo = { alvo: Alvo; type: string; origem: string };

/**
 * Arquivo:linha de quem chamou `addEventListener`.
 *
 * Sem isto, "sobrou um `document:keydown`" manda quem lê para uma caçada em
 * catorze fábricas. O quadro é o primeiro fora deste arquivo.
 */
function callOrigem(): string {
  const pilha = new Error().stack ?? '';
  for (const linha of pilha.split('\n').slice(1)) {
    if (linha.includes('listener-ledger')) continue;
    const m = linha.match(/([\w.-]+\.[jt]s)[?:][^)]*?(\d+):\d+/);
    if (m) return `${m[1]}:${m[2]}`;
  }
  return 'desconhecido';
}

export type OuvintesSpy = {
  /** Ouvintes registrados durante a espionagem e ainda não removidos. */
  vivos: () => ListenerVivo[];
  /** Devolve `addEventListener` / `removeEventListener` ao original. */
  parar: () => void;
};

function capturaDe(opts?: boolean | AddEventListenerOptions | EventListenerOptions): boolean {
  return typeof opts === 'boolean' ? opts : Boolean(opts?.capture);
}

export function espiarOuvintes(): OuvintesSpy {
  const entradas: Entrada[] = [];
  const restauradores: Array<() => void> = [];

  const instalar = (nome: Alvo, obj: EventTarget): void => {
    const addOriginal = EventTarget.prototype.addEventListener.bind(obj);
    const removeOriginal = EventTarget.prototype.removeEventListener.bind(obj);

    const baixar = (type: string, fn: unknown, capture: boolean): Entrada | undefined => {
      const i = entradas.findIndex(
        (e) => e.alvo === nome && e.type === type && e.fn === fn && e.capture === capture,
      );
      if (i < 0) return undefined;
      return entradas.splice(i, 1)[0];
    };

    Object.defineProperty(obj, 'addEventListener', {
      configurable: true,
      writable: true,
      value: (type: string, fn: unknown, opts?: boolean | AddEventListenerOptions): void => {
        const capture = capturaDe(opts);
        if (!fn) return addOriginal(type, fn as EventListener, opts);

        const umaVez = typeof opts === 'object' && opts !== null && Boolean(opts.once);
        if (!umaVez) {
          entradas.push({ alvo: nome, type, fn, capture, origem: callOrigem() });
          return addOriginal(type, fn as EventListener, opts);
        }

        // `{ once: true }`: o browser remove sozinho ao disparar, sem passar por
        // `removeEventListener`. Sem o embrulho o livro nunca baixaria a
        // entrada e acusaria vazamento onde não há.
        const embrulho: EventListener = (evento) => {
          baixar(type, fn, capture);
          (fn as EventListener).call(obj, evento);
        };
        entradas.push({ alvo: nome, type, fn, capture, embrulho, origem: callOrigem() });
        return addOriginal(type, embrulho, opts);
      },
    });

    Object.defineProperty(obj, 'removeEventListener', {
      configurable: true,
      writable: true,
      value: (type: string, fn: unknown, opts?: boolean | EventListenerOptions): void => {
        const entrada = baixar(type, fn, capturaDe(opts));
        // Sem entrada no livro, o ouvinte é anterior à espionagem: repassa
        // direto, senão o espião viraria um bloqueador de limpeza alheia.
        return removeOriginal(type, (entrada?.embrulho ?? fn) as EventListener, opts);
      },
    });

    restauradores.push(() => {
      delete (obj as unknown as Record<string, unknown>).addEventListener;
      delete (obj as unknown as Record<string, unknown>).removeEventListener;
    });
  };

  instalar('document', document);
  instalar('window', window);

  return {
    vivos: () => entradas.map(({ alvo, type, origem }) => ({ alvo, type, origem })),
    parar: () => restauradores.forEach((r) => r()),
  };
}

/**
 * Descrição legível do livro, para a mensagem de falha dizer O QUE sobrou em vez
 * de só "esperava 0, veio 2".
 */
export function describeVivos(vivos: ListenerVivo[]): string {
  if (vivos.length === 0) return 'nenhum';
  return vivos.map((v) => `${v.alvo}:${v.type}@${v.origem}`).join(', ');
}
