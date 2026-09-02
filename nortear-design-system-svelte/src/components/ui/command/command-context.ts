import { getContext, setContext } from 'svelte';

/**
 * Contexto do vazio da paleta — só a resposta "o filtro não casou com nada".
 *
 * A mensagem de vazio é uma região viva, e por isso ela mora FORA do
 * `Command.List` (`role="status"` não é filho permitido de `role="listbox"`).
 * Fora da lista ela também fica fora do alcance de qualquer estado que a lib
 * exponha por composição: quem tem o número filtrado é a raiz, que o recebe da
 * lib por `onStateChange`.
 *
 * Um getter, e não um valor: assim a leitura acontece no template do vazio e a
 * reatividade da raiz atravessa o contexto. Copiar o booleano aqui congelaria
 * a resposta da primeira busca.
 */
export type CommandEmptyContext = {
  get empty(): boolean;
};

const KEY = Symbol('nds-command-empty');

export function createCommandEmptyContext(read: () => boolean): CommandEmptyContext {
  const context: CommandEmptyContext = {
    get empty() {
      return read();
    },
  };
  setContext(KEY, context);
  return context;
}

export function useCommandEmptyContext(): CommandEmptyContext | undefined {
  return getContext<CommandEmptyContext | undefined>(KEY);
}
