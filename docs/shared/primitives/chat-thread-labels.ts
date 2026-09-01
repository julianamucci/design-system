/**
 * Rótulos falados do ChatThread que o DESIGN SYSTEM escreve, por idioma.
 *
 * Um só, por enquanto, e vale explicar por que ele não mora com os outros. O
 * resto de `ChatThreadLabels` — "ir para o fim", "raciocínio", "fontes", os
 * estados de ferramenta — é texto que quem consome passa, e a interface de cada
 * stack o exige sem padrão escondido: são palavras do produto, não do design
 * system. O nome da região que rola é o contrário. Ninguém que compõe uma
 * conversa pensa em nomeá-la, porque ela não é uma peça que se vê: é o
 * elemento com `tabindex="0"` que existe para que a rolagem alcance quem não
 * usa mouse (WCAG 2.1.1). Sem nome, essa parada de teclado chegava ao leitor de
 * tela sem dizer onde a pessoa entrou — a metade que faltava da regra 6 da §8
 * da guideline 17, "uma só camada rola, e ela tem nome e `tabindex=0`".
 *
 * Mora no compartilhado, e não copiado em cada stack, pelo mesmo motivo de
 * `code-block-labels.ts` e `sidebar-a11y-labels.ts`: é texto que o usuário
 * final OUVE, e cinco cópias divergem na primeira revisão de conteúdo. Cadeia
 * literal no componente seria pior ainda — decidiria o idioma em cinco lugares,
 * nenhum deles alcançável por quem monta o produto.
 *
 * O padrão é o português: não há lib por trás trazendo texto traduzido, o texto
 * é do design system, e a regra do projeto é que o que o usuário lê ou ouve sai
 * em português comum. As outras duas línguas existem para quem monta produto
 * multilíngue e passa o rótulo adiante pela API do componente (prop, opção de
 * fábrica ou input, conforme a stack).
 *
 * O conteúdo compartilhado (`docs/shared/content/chat-thread/translations.json`)
 * descreve este texto em `accessibility.*` de forma API-neutra e aponta para
 * cá; a cadeia em si vive só neste arquivo, para que não exista uma segunda
 * cópia para divergir.
 */

export interface ChatThreadRegionLabels {
  /**
   * Nome da região que rola.
   *
   * Diz o que a pessoa alcançou, e não o que o elemento faz: "região de
   * rolagem" descreveria o mecanismo e não informaria nada: quem chegou ali por
   * Tab já sabe que rola, o que não sabe é ONDE entrou.
   *
   * Genérico de propósito. Quem tiver mais de uma conversa na mesma tela — duas
   * abas de atendimento lado a lado, por exemplo — passa nomes DISTINTOS pela
   * API do componente: duas paradas de teclado homônimas são indistinguíveis
   * para quem navega ouvindo.
   */
  region: string;
}

const LABELS: Record<string, ChatThreadRegionLabels> = {
  'pt-BR': { region: 'Conversa' },
  en: { region: 'Conversation' },
  es: { region: 'Conversación' },
};

/** O que o componente usa quando quem compõe não passa nada. */
export const LABELS_CHAT_THREAD_DEFAULT: ChatThreadRegionLabels = LABELS['pt-BR'];

/**
 * Aceita a tag BCP-47 inteira ("pt-BR", "es-ES") e cai na língua base quando a
 * região não tem entrada própria. Idioma desconhecido usa o padrão do design
 * system, que é o português.
 */
export function chatThreadLabels(locale: string | undefined): ChatThreadRegionLabels {
  if (!locale) return LABELS_CHAT_THREAD_DEFAULT;
  return LABELS[locale] ?? LABELS[locale.split('-')[0]] ?? LABELS_CHAT_THREAD_DEFAULT;
}
