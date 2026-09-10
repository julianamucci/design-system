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

/**
 * Contexto do placeholder do campo de busca — é ele que NOMEIA a lista.
 *
 * Campo e lista são irmãos dentro da raiz, e a lista precisa de nome acessível
 * (`role="listbox"` sem nome é "lista" para o leitor de tela, e a pessoa não
 * sabe do que). O Vanilla, que é a referência, dá à lista o mesmo texto do
 * placeholder: é a frase que a pessoa acabou de ler em cima dela. Antes esta
 * stack cravava "Resultados da busca" em português, nos três idiomas, e quem
 * consumia a paleta em inglês ouvia a lista nomeada numa língua que não é a da
 * página.
 *
 * O campo ESCREVE, a lista LÊ, e quem guarda é a raiz — o único ancestral
 * comum dos dois. Estado reativo da raiz, e não um valor copiado: o placeholder
 * muda com o idioma e a lista tem de acompanhar.
 */
export type CommandSearchContext = {
  placeholder: string | undefined;
};

const SEARCH_KEY = Symbol('nds-command-search');

export function createCommandSearchContext(context: CommandSearchContext): CommandSearchContext {
  setContext(SEARCH_KEY, context);
  return context;
}

export function useCommandSearchContext(): CommandSearchContext | undefined {
  return getContext<CommandSearchContext | undefined>(SEARCH_KEY);
}

/**
 * Registro dos RÓTULOS dos comandos — o que faz o filtro comparar a busca com
 * o valor E com o rótulo (PRD, C9).
 *
 * O bits-ui, como o cmdk, pontua só o `value` quando ele existe (mais as
 * `keywords`): com `value="novo"`, buscar "arq" não achava "Novo arquivo". O
 * caminho óbvio — o item passar o rótulo em `keywords` — não funciona no
 * bits-ui 2.19.0, e foi medido: o item registra as palavras na PRIMEIRA
 * rodada do observador dele, antes de o nó existir, e o `registerValue` não
 * regrava um valor já registrado (`command.svelte.js`, `registerValue` e o
 * construtor de `CommandItemState`). O rótulo, que só se lê do nó, nunca
 * chegava.
 *
 * Então o rótulo entra onde a lib LÊ as palavras, e não onde as guarda: o
 * item publica aqui o próprio nó, e o filtro da raiz (`command.svelte`) soma
 * o rótulo às `keywords` de quem consome na hora de pontuar. O atalho fica de
 * fora — ele é só desenho (C5), e buscar "ctrl" não pode achar comando.
 *
 * O rótulo é lido do nó a cada pontuação enquanto ele está montado (acompanha
 * a troca de idioma) e fica guardado quando o filtro o desmonta. Limite
 * aceito: um comando que NASCE fora do filtro, com uma busca inicial que só o
 * rótulo casaria, não tem nó de onde ler até a busca mudar.
 */
export type CommandLabelRegistry = {
  /** Publica (ou atualiza) o nó de um comando. `null` = desmontado pelo filtro. */
  track(value: string, node: HTMLElement | null): void;
  /** Esquece o comando — quando o item sai de vez. */
  forget(value: string): void;
  /** O rótulo do comando, sem o atalho; `undefined` se nunca houve nó. */
  labelOf(value: string): string | undefined;
};

const LABEL_KEY = Symbol('nds-command-labels');

/** O texto do comando sem o atalho — é o que a pessoa lê como nome dele. */
export function commandItemLabel(node: HTMLElement): string {
  const clone = node.cloneNode(true) as HTMLElement;
  for (const shortcut of clone.querySelectorAll('[data-slot="command-shortcut"]')) {
    shortcut.remove();
  }
  return (clone.textContent ?? '').replace(/\s+/g, ' ').trim();
}

export function createCommandLabelRegistry(): CommandLabelRegistry {
  const entries = new Map<string, { node: HTMLElement | null; label: string }>();
  const registry: CommandLabelRegistry = {
    track(value, node) {
      const entry = entries.get(value) ?? { node: null, label: '' };
      entry.node = node;
      if (node) entry.label = commandItemLabel(node);
      entries.set(value, entry);
    },
    forget(value) {
      entries.delete(value);
    },
    labelOf(value) {
      const entry = entries.get(value);
      if (!entry) return undefined;
      if (entry.node?.isConnected) entry.label = commandItemLabel(entry.node);
      return entry.label || undefined;
    },
  };
  setContext(LABEL_KEY, registry);
  return registry;
}

export function useCommandLabelRegistry(): CommandLabelRegistry | undefined {
  return getContext<CommandLabelRegistry | undefined>(LABEL_KEY);
}
