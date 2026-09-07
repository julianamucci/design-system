/**
 * O transporte do chat: `fetch` + leitura de SSE.
 *
 * `fetch` e não `EventSource` porque a pergunta vai no corpo de um POST, e
 * `EventSource` só sabe fazer GET. O preço é ter que partir o fluxo em eventos
 * à mão, e é o que este arquivo faz — em vinte linhas, contra um endpoint que
 * teria que aceitar a pergunta na URL.
 *
 * Isto NÃO é um componente do design system, e o lugar é a prova: nenhuma peça
 * de `src/components/ui/` faz `fetch` (guideline 17 §2). O chat é uma aplicação
 * que consome as peças, e o transporte é dela.
 */

import type { Locale } from '../../../docs/shared/primitives/locale-negotiation';

/** As fontes recuperadas, antes do primeiro token da resposta. */
export interface SourcesEvent {
  weak: boolean;
  floor: number;
  hits: { slug: string; score: number }[];
}

export interface AskHandlers {
  onSources: (event: SourcesEvent) => void;
  onDelta: (text: string) => void;
  onDone: (info: { stopReason: string | null }) => void;
  /** Recebe o CÓDIGO, e não uma frase: quem traduz é `labels.ts`. */
  onError: (code: string) => void;
}

/**
 * O caminho da função.
 *
 * Relativo à origem do manager. Em produção a Vercel serve `/api/perguntar` do
 * mesmo domínio que o Storybook estático; em desenvolvimento local, só existe
 * sob `vercel dev` — `storybook dev` não roda função nenhuma, e é por isso que
 * existe o código de erro `sem_servidor`.
 */
const ENDPOINT = '/api/perguntar';

/** Uma linha `data:` que ainda não fechou o evento. */
interface PendingEvent {
  name: string;
  data: string;
}

function dispatch(pending: PendingEvent, handlers: AskHandlers): void {
  if (!pending.name || !pending.data) return;
  let payload: unknown;
  try {
    payload = JSON.parse(pending.data);
  } catch {
    return;
  }
  if (pending.name === 'sources') handlers.onSources(payload as SourcesEvent);
  else if (pending.name === 'delta') handlers.onDelta((payload as { text: string }).text);
  else if (pending.name === 'done') handlers.onDone(payload as { stopReason: string | null });
  else if (pending.name === 'error') handlers.onError((payload as { code: string }).code);
}

/**
 * Faz a pergunta e chama os manipuladores conforme o fluxo chega.
 *
 * Devolve quando o fluxo fecha. `signal` permite interromper — é o que o botão
 * de parar do composer usa.
 */
/** Um turno já dito. `model` é o nome que a API do provedor usa para o assistente. */
export interface TurnoAnterior {
  papel: 'user' | 'model';
  texto: string;
}

export async function ask(
  question: string,
  locale: Locale,
  handlers: AskHandlers,
  signal?: AbortSignal,
  historico: TurnoAnterior[] = [],
): Promise<void> {
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ pergunta: question, locale, historico }),
      signal,
    });
  } catch (error) {
    if ((error as Error)?.name === 'AbortError') return;
    handlers.onError('sem_servidor');
    return;
  }

  // Falha ANTES do fluxo vem como JSON com código HTTP — inclusive `sem_chave`,
  // que é o estado que alguém sem a variável de ambiente vê primeiro. O
  // `content-type` é o que separa os dois formatos.
  const contentType = response.headers.get('content-type') ?? '';
  if (!contentType.includes('text/event-stream')) {
    let code = 'falha_do_modelo';
    try {
      const body = (await response.json()) as { code?: string };
      if (body.code) code = body.code;
    } catch {
      // Resposta que não é JSON nem SSE: quase sempre é o `storybook dev`
      // devolvendo o index.html porque não existe função nenhuma servindo.
      code = 'sem_servidor';
    }
    handlers.onError(code);
    return;
  }

  const body = response.body;
  if (!body) {
    handlers.onError('sem_servidor');
    return;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      // Um evento SSE termina em linha em branco. Partir por isso é o protocolo
      // inteiro: nada de `\r\n` normalizado à mão, porque o servidor é nosso.
      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const chunk = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        const pending: PendingEvent = { name: '', data: '' };
        for (const line of chunk.split('\n')) {
          if (line.startsWith('event: ')) pending.name = line.slice(7).trim();
          else if (line.startsWith('data: ')) pending.data += line.slice(6);
        }
        dispatch(pending, handlers);

        boundary = buffer.indexOf('\n\n');
      }
    }
  } catch (error) {
    if ((error as Error)?.name !== 'AbortError') handlers.onError('falha_do_modelo');
  }
}
