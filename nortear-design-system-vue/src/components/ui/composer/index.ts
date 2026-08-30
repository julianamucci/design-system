export { default as Composer } from './Composer.vue'

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
