/**
 * Os textos do chat de documentação, nas três línguas do conteúdo.
 *
 * Ficam aqui, e não em `docs/shared/content/`, porque não são conteúdo do
 * design system: são a interface de uma APLICAÇÃO que o consome. Misturá-los ao
 * conteúdo compartilhado faria o auditor de literais cobrar deles regras que
 * não valem — e faria os cinco stacks carregarem texto de um chat que só existe
 * num manager.
 *
 * O idioma vem do mesmo `ds-locale` que as docs pages usam, para o chat não
 * abrir em outra língua que o resto da tela.
 */

import type { Locale } from '../../../docs/shared/primitives/locale-negotiation';
import type { ChatThreadLabels } from '../../src/components/ui/chat-thread';
import type { ComposerLabels } from '../../src/components/ui/composer';

export interface ChatDocsLabels {
  /** Nome acessível do botão que abre, e o texto dele. */
  launcher: string;
  /** Nome acessível do diálogo. */
  panel: string;
  title: string;
  close: string;
  /** O que a conversa mostra antes da primeira pergunta. */
  empty: string;
  /** Frase do indicador de espera. É o que quem ouve a tela recebe. */
  thinking: string;
  /** Cabeçalho da lista de fontes, dentro da mensagem. */
  sourcesHeading: string;
  thread: ChatThreadLabels;
  composer: ComposerLabels;
  /** Uma mensagem por código de erro que o servidor devolve. */
  errors: Record<string, string>;
  /** Qualquer código que este arquivo ainda não conheça. */
  errorFallback: string;
}

const PT: ChatDocsLabels = {
  launcher: 'Perguntar à documentação',
  panel: 'Conversar com a documentação',
  title: 'Perguntar à documentação',
  close: 'Fechar',
  empty:
    'Pergunte sobre qualquer componente do design system. As respostas saem da documentação compartilhada, e cada afirmação diz de qual componente veio.',
  thinking: 'Procurando na documentação',
  sourcesHeading: 'Componentes consultados',
  thread: {
    jumpToEnd: 'Ir para o fim da conversa ({count} novas)',
    reasoning: 'Raciocínio',
    sources: 'Fontes',
    toolState: {
      pending: 'Aguardando autorização',
      running: 'Em execução',
      done: 'Concluída',
      failed: 'Falhou',
    },
  },
  composer: {
    input: 'Sua pergunta sobre a documentação',
    placeholder: 'Como anuncio erro de formulário?',
    submit: 'Perguntar',
    stop: 'Interromper',
    hint: '{key} envia',
    limit: 'Até {max} caracteres',
  },
  errors: {
    sem_chave:
      'A chave da API não está configurada neste ambiente. O chat precisa de GEMINI_API_KEY na função de servidor — sem ela, nada é enviado a lugar nenhum.',
    sem_corpus:
      'O conteúdo compartilhado não subiu junto com a função de servidor. Ver o cabeçalho de api/corpus.ts.',
    limite_de_taxa: 'Muitas perguntas em pouco tempo. Espere um minuto e tente de novo.',
    pergunta_longa: 'A pergunta é longa demais. Encurte e tente de novo.',
    pergunta_vazia: 'Escreva uma pergunta.',
    chave_invalida: 'A chave configurada foi recusada pela API.',
    limite_do_modelo: 'A API está limitando as chamadas agora. Tente de novo em instantes.',
    falha_do_modelo: 'A chamada ao modelo falhou. Tente de novo.',
    sem_servidor:
      'A função de servidor não respondeu. Em desenvolvimento local ela só existe sob `vercel dev`.',
  },
  errorFallback: 'Algo deu errado ao perguntar.',
};

const EN: ChatDocsLabels = {
  launcher: 'Ask the docs',
  panel: 'Chat with the documentation',
  title: 'Ask the docs',
  close: 'Close',
  empty:
    'Ask about any component in the design system. Answers come from the shared documentation, and every claim names the component it came from.',
  thinking: 'Searching the documentation',
  sourcesHeading: 'Components consulted',
  thread: {
    jumpToEnd: 'Jump to the end of the conversation ({count} new)',
    reasoning: 'Reasoning',
    sources: 'Sources',
    toolState: {
      pending: 'Awaiting approval',
      running: 'Running',
      done: 'Done',
      failed: 'Failed',
    },
  },
  composer: {
    input: 'Your question about the documentation',
    placeholder: 'How do I announce a form error?',
    submit: 'Ask',
    stop: 'Stop',
    hint: '{key} sends',
    limit: 'Up to {max} characters',
  },
  errors: {
    sem_chave:
      'The API key is not configured in this environment. The chat needs GEMINI_API_KEY on the server function — without it, nothing is sent anywhere.',
    sem_corpus:
      'The shared content was not deployed with the server function. See the header of api/corpus.ts.',
    limite_de_taxa: 'Too many questions in a short time. Wait a minute and try again.',
    pergunta_longa: 'The question is too long. Shorten it and try again.',
    pergunta_vazia: 'Write a question.',
    chave_invalida: 'The configured key was rejected by the API.',
    limite_do_modelo: 'The API is rate limiting right now. Try again shortly.',
    falha_do_modelo: 'The model call failed. Try again.',
    sem_servidor:
      'The server function did not answer. Locally it only exists under `vercel dev`.',
  },
  errorFallback: 'Something went wrong while asking.',
};

const ES: ChatDocsLabels = {
  launcher: 'Preguntar a la documentación',
  panel: 'Conversar con la documentación',
  title: 'Preguntar a la documentación',
  close: 'Cerrar',
  empty:
    'Pregunta sobre cualquier componente del sistema de diseño. Las respuestas salen de la documentación compartida, y cada afirmación dice de qué componente vino.',
  thinking: 'Buscando en la documentación',
  sourcesHeading: 'Componentes consultados',
  thread: {
    jumpToEnd: 'Ir al final de la conversación ({count} nuevas)',
    reasoning: 'Razonamiento',
    sources: 'Fuentes',
    toolState: {
      pending: 'Esperando autorización',
      running: 'En ejecución',
      done: 'Completada',
      failed: 'Falló',
    },
  },
  composer: {
    input: 'Tu pregunta sobre la documentación',
    placeholder: '¿Cómo anuncio un error de formulario?',
    submit: 'Preguntar',
    stop: 'Detener',
    hint: '{key} envía',
    limit: 'Hasta {max} caracteres',
  },
  errors: {
    sem_chave:
      'La clave de la API no está configurada en este entorno. El chat necesita GEMINI_API_KEY en la función de servidor — sin ella no se envía nada a ninguna parte.',
    sem_corpus:
      'El contenido compartido no se publicó junto a la función de servidor. Ver la cabecera de api/corpus.ts.',
    limite_de_taxa: 'Demasiadas preguntas en poco tiempo. Espera un minuto e inténtalo de nuevo.',
    pergunta_longa: 'La pregunta es demasiado larga. Acórtala e inténtalo de nuevo.',
    pergunta_vazia: 'Escribe una pregunta.',
    chave_invalida: 'La clave configurada fue rechazada por la API.',
    limite_do_modelo: 'La API está limitando las llamadas ahora. Inténtalo en unos instantes.',
    falha_do_modelo: 'La llamada al modelo falló. Inténtalo de nuevo.',
    sem_servidor:
      'La función de servidor no respondió. En local solo existe con `vercel dev`.',
  },
  errorFallback: 'Algo salió mal al preguntar.',
};

const BY_LOCALE: Record<Locale, ChatDocsLabels> = { 'pt-BR': PT, en: EN, es: ES };

export function labelsFor(locale: Locale): ChatDocsLabels {
  return BY_LOCALE[locale] ?? PT;
}
