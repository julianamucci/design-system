import type { TriggerSpec } from '@shared/primitives/composer-trigger'
import type { AttachmentState, ChatRole, ContextKind } from '@shared/primitives/chat-protocol'
import type { FileSizeUnit } from '@shared/primitives/file-size'

export { default as Composer } from './Composer.vue'
export { default as ComposerAttachments } from './ComposerAttachments.vue'
export { default as ComposerContext } from './ComposerContext.vue'

/**
 * O vocabulário do compositor.
 *
 * A API DIVERGE da raiz imperativa da referência, e é assim que tem de ser. Lá
 * ela expõe `getValue()`, `setValue()` e `setRunning()`; aqui o texto é um
 * `v-model:value` e o estado de geração é a PROP `running`. Divergência de API
 * de framework não se "alinha": registra-se.
 *
 * O motivo é o mesmo dos dois lados. Quem sabe se a resposta está sendo gerada
 * é quem consome — o componente não acompanha a rede —, e a diferença é só por
 * onde esse estado entra: lá por um método, aqui por uma prop que o render lê.
 *
 * A segunda divergência é o trilho. Ele não é `HTMLElement[]`: é um SLOT COM
 * ESCOPO (`#railStart`), que é a forma desta stack para "marcação que quem
 * consome fornece". O conceito é o mesmo — o trilho é um ESPAÇO, e o composer
 * reserva o lugar sem saber o que se põe nele.
 */

/** Como se pede o envio pelo teclado. */
export type ComposerSubmitOn =
  /** Enter envia; Shift+Enter quebra linha. Convenção de teclado físico. */
  | 'enter'
  /** Ctrl/Cmd+Enter envia; Enter quebra linha. É o certo no toque. */
  | 'modifier'

/** Rótulos que a interface mostra. Sem padrão em inglês escondido. */
export interface ComposerLabels {
  /** Nome acessível do campo. */
  input: string
  placeholder: string
  /** Nome do botão em repouso. */
  submit: string
  /** Nome do MESMO botão enquanto gera — troca de nome, não só de ícone. */
  stop: string
  /** A dica de teclado. `{key}` vira a combinação que envia. */
  hint: string
  /** Descrição do limite. `{max}` vira o número. */
  limit: string
}

/**
 * O vocabulário do SELETOR DO CARACTERE GATILHO.
 *
 * A máquina — onde o gatilho vale, o que ele recorta, como o filtro ordena e o
 * que fica escrito depois da escolha — vive em
 * `@shared/primitives/composer-trigger` e é compartilhada. O que mora aqui é só
 * o vocabulário que o composer expõe a quem consome.
 */

/** Uma opção do seletor. */
export interface TriggerOption {
  /** Endereço da opção. Vira o `id` do elemento, que o campo aponta. */
  id: string
  /** O que se lê na lista, e o que o filtro compara. */
  label: string
  /** Informação de apoio à direita — time, atalho, descrição curta. */
  hint?: string
  /**
   * O que fica escrito ao escolher. Sem ele, o caractere gatilho mais o rótulo.
   *
   * Existe porque o que se escreve nem sempre é o que se lê: um comando mostra
   * "Resumir a conversa" e escreve `/resumir`.
   */
  value?: string
}

/** Um gatilho e as opções que ele oferece. */
export interface TriggerSource {
  spec: TriggerSpec
  options: TriggerOption[]
}

/** O texto do painel. Não há padrão em inglês escondido. */
export interface TriggerPopoverLabels {
  /**
   * O que aparece quando o filtro não deixa nada.
   *
   * Texto, e não lista vazia: lista vazia é silêncio para quem não vê a tela, e
   * silêncio parece que a busca não respondeu.
   */
  empty: string
  /** Nome acessível da lista. */
  list: string
}

/**
 * O vocabulário da FILA DE ANEXOS.
 *
 * A conversão de bytes vive em `@shared/primitives/file-size` e é a mesma nas
 * cinco stacks; o que mora aqui é só o texto, porque unidade e estado são texto
 * de interface e têm três idiomas.
 */
export interface ComposerAttachmentLabels {
  /** Nome acessível da fila. */
  list: string
  /** Nome do botão de remover. `{name}` vira o nome do arquivo. */
  remove: string
  /** A palavra de cada estado. É ela que o leitor de tela recebe. */
  state: Record<AttachmentState, string>
  /** A palavra de cada unidade de tamanho. */
  unit: Record<FileSizeUnit, string>
}

/**
 * O vocabulário da LISTA DE CONTEXTO.
 *
 * NÃO é o da fila de anexos, ainda que a geometria seja quase a mesma. Anexo é
 * carga — sobe, tem progresso, pode falhar. Contexto é referência: aponta para
 * o que já existe, e por isso não tem estado nenhum a comunicar. O que separa
 * as duas peças está no protocolo compartilhado, não no texto.
 *
 * O item em si — `ContextItem` — vem de `@shared/primitives/chat-protocol`, e é
 * o mesmo nas cinco stacks. O que mora aqui é só o texto, porque a palavra de
 * cada espécie e a marca do que entrou sozinho são texto de interface e têm
 * três idiomas.
 */
export interface ComposerContextLabels {
  /** Nome acessível da lista. */
  list: string
  /** Nome do botão de remover. `{label}` vira o nome do item. */
  remove: string
  /** A palavra de cada espécie. É ela que o leitor de tela recebe. */
  kind: Record<ContextKind, string>
  /** A marca do que entrou sem ninguém pedir. É texto, e não só a cor. */
  automatic: string
}

/**
 * O vocabulário da CITAÇÃO.
 *
 * Só os tipos saem daqui; o bloco em si é montado pelo composer, e não há por
 * que quem consome montá-lo por fora — ele existe para descrever UM campo, e é
 * o campo que aponta a descrição. O nome `ComposerQuote` fica para o dado, que
 * é o que atravessa a fronteira: quem consome o produz a partir da mensagem
 * citada e o entrega inteiro.
 *
 * O papel de quem escreveu vem de `@shared/primitives/chat-protocol` — é o
 * mesmo vocabulário da thread, e é o que liga as duas peças.
 */
export interface ComposerQuote {
  /** Endereço da mensagem citada, para quem consome saber a qual responder. */
  id?: string
  /** Quem escreveu. É o nome que aparece e o que entra no botão de dispensar. */
  author: string
  /** O papel de quem escreveu — o mesmo vocabulário da thread. */
  role?: ChatRole
  /**
   * O texto citado, INTEIRO.
   *
   * Passe o texto completo: o corte é do desenho, e cortar aqui apagaria o
   * resto para quem lê por audição.
   */
  excerpt: string
}

export interface ComposerQuoteLabels {
  /** Nome do botão que dispensa. `{author}` vira o nome de quem escreveu. */
  dismiss: string
  /** Como a citação se apresenta ao campo. `{author}` vira o nome. */
  describes: string
}
