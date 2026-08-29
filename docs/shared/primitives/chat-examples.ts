/**
 * A conversa de demonstração do ChatThread, uma só para as cinco stacks.
 *
 * Mesma razão do `markdown-examples.ts`, e um degrau mais forte: aqui o exemplo
 * não é só a entrada de um parser, é o CONTRATO da demonstração. Uma mensagem a
 * mais numa cópia e as cinco stories deixam de fotografar a mesma tela — e a
 * divergência só apareceria no Chromatic, como diferença de layout que ninguém
 * consegue atribuir a nada.
 *
 * Nada de framework e nada de i18n: o texto é o mesmo nos três idiomas da
 * documentação. O que a `translations.json` carrega são os RÓTULOS da interface
 * — botão de ir ao fim, resumo do raciocínio, título das fontes —, não a fala.
 */

/** Papéis que a thread desenha. */
export type ChatExampleRole = 'user' | 'assistant' | 'system';

export type ChatExampleMessage = {
  role: ChatExampleRole;
  content: string;
  author?: string;
  time?: string;
  reasoning?: string;
  toolCalls?: Array<{ name: string; state: 'running' | 'done' | 'failed'; detail?: string }>;
  sources?: Array<{ title: string; url: string }>;
};

/** A conversa curta: uma pergunta, uma resposta com estrutura, um aviso. */
export const CHAT_CONVERSA: ChatExampleMessage[] = [
  {
    role: 'user',
    author: 'Você',
    time: '14:31',
    content: 'Como o componente decide se acompanha o fim da conversa?',
  },
  {
    role: 'assistant',
    author: 'Assistente',
    time: '14:31',
    content: `A rolagem só acompanha o fim **se já estava no fim**. Quem está lendo
uma resposta antiga continua onde está, e o botão de ir ao fim aparece com a
contagem do que chegou.

- a medida sai do container que rola
- a decisão é de \`chat-scroll\`, compartilhada pelas cinco stacks
- a ordem importa: decidir antes de inserir`,
  },
  {
    role: 'system',
    content: 'A conversa foi retomada de um histórico salvo.',
  },
];

/** A resposta com raciocínio, chamada de ferramenta e fontes. */
export const CHAT_COM_FERRAMENTAS: ChatExampleMessage[] = [
  {
    role: 'user',
    author: 'Você',
    time: '09:12',
    content: 'Quantos componentes o design system tem hoje?',
  },
  {
    role: 'assistant',
    author: 'Assistente',
    time: '09:12',
    reasoning:
      'A contagem precisa vir do repositório, e não da memória: o número muda a cada rodada. Vou listar os slugs de conteúdo compartilhado.',
    toolCalls: [
      {
        name: 'listar_componentes',
        state: 'done',
        detail: 'Leu docs/shared/content/ e devolveu 54 slugs.',
      },
    ],
    sources: [
      { title: 'docs/shared/content', url: 'https://exemplo.test/content' },
      { title: 'scripts/audit.mjs', url: 'https://exemplo.test/audit' },
    ],
    content: `São **54** slugs de conteúdo compartilhado, e cada um existe nas
cinco stacks.`,
  },
];

/** A resposta ainda chegando, com a cerca de código aberta. */
export const CHAT_EM_STREAMING: ChatExampleMessage[] = [
  {
    role: 'user',
    author: 'Você',
    time: '11:04',
    content: 'Me mostra como ligar o streaming.',
  },
  {
    role: 'assistant',
    author: 'Assistente',
    time: '11:04',
    content: `Claro. O caminho mais curto é este:

\`\`\`ts
const view = createChatThread({ messages, labels`,
  },
];

/** Uma chamada de ferramenta que falhou — o estado que não pode ser só cor. */
export const CHAT_FERRAMENTA_FALHOU: ChatExampleMessage[] = [
  {
    role: 'user',
    author: 'Você',
    time: '16:40',
    content: 'Publica a versão nova.',
  },
  {
    role: 'assistant',
    author: 'Assistente',
    time: '16:40',
    toolCalls: [
      {
        name: 'publicar',
        state: 'failed',
        detail: 'O registro recusou: falta a versão no package.json.',
      },
    ],
    content: 'Não publiquei: o registro recusou porque falta a versão. Corrige e eu tento de novo.',
  },
];

/**
 * Conversa longa, para provar a ancoragem no fim.
 *
 * Trinta turnos é o que garante transbordo em qualquer altura de janela que as
 * stories usem — sem transbordo não há rolagem, e sem rolagem a decisão que
 * este componente existe para tomar não acontece.
 */
export const CHAT_LONGA: ChatExampleMessage[] = Array.from({ length: 30 }, (_, i) => {
  const n = i + 1;
  return i % 2 === 0
    ? { role: 'user' as const, author: 'Você', content: `Pergunta ${n / 2 + 0.5}.` }
    : { role: 'assistant' as const, author: 'Assistente', content: `Resposta ${n / 2}.` };
});
