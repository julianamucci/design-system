// ─── A lista dos cards de Variantes do ContextMenu ───────────────────────────
//
// A forma da lista e o leitor do estado inicial dela. A docs page monta a
// PRÉVIA com os dois (o snippet recursivo `menuEntries` e o `$state` dos
// cards), e `contextMenuEntriesSource`, no `context-menu.source.ts`, imprime o
// CÓDIGO a partir da mesma lista — como a `variantMenu` do vanilla.
//
// Por que aqui, e não no `context-menu.source.ts` onde nasceram (2026-09-10):
// aquele módulo só exporta construtor de snippet chamável SEM argumento, que é
// a convenção que deixa `source-snippets.test.ts` chamar cada export e
// conferir o que ele ensina. `contextMenuEntriesState` devolve estado, não
// snippet, e exportado de lá reprovava a convenção de nome e quebrava a
// chamada sem argumento.

/**
 * Uma entrada do menu de um card de Variantes, já com o rótulo no idioma da
 * página.
 *
 * A MESMA lista monta a prévia (o snippet recursivo `menuEntries` da docs page)
 * e imprime o código (`contextMenuEntriesSource`), como a `variantMenu` do
 * vanilla: até 2026-09-10 cada card tinha um literal de código em português ao
 * lado, e em inglês a prévia dizia "Edit" e o código "Editar"; o de marcação
 * publicava os estados trocados e o destrutivo mostrava um atalho que a prévia
 * das outras stacks não tem.
 *
 * `value` é o valor ESTÁVEL do item — o `label` do `context_menu_item_select`,
 * o valor da opção no grupo de rádio e, na marcação, o nome da variável do
 * estado (`show-grid` → `showGrid`). Grupo e grupo de rádio são entradas com
 * filhos porque é assim que o rótulo nomeia o bloco nesta stack: só DENTRO do
 * grupo ele vira o `aria-labelledby` dele.
 */
export type ContextMenuDocsEntry =
  | {
      type: 'item';
      label: string;
      value: string;
      shortcut?: string;
      variant?: 'destructive';
      inset?: boolean;
    }
  | { type: 'separator' }
  | { type: 'group'; label: string; inset?: boolean; items: ContextMenuDocsEntry[] }
  | { type: 'checkbox'; label: string; value: string; checked: boolean }
  | {
      type: 'radio-group';
      label: string;
      /** Nome da variável que guarda a escolha — identificador, não se traduz. */
      name: string;
      /** Opção marcada ao abrir. */
      value: string;
      items: Array<{ label: string; value: string }>;
    }
  | { type: 'submenu'; label: string; items: ContextMenuDocsEntry[] };

/** O estado inicial das marcações e dos grupos de rádio de uma lista. */
export type ContextMenuDocsState = {
  checked: Record<string, boolean>;
  radio: Record<string, string>;
};

/**
 * Lê da lista o estado com que o menu abre — a prévia inicia o `$state` dela
 * por aqui, e o código declara as mesmas variáveis com os mesmos valores.
 */
export function contextMenuEntriesState(entries: ContextMenuDocsEntry[]): ContextMenuDocsState {
  const state: ContextMenuDocsState = { checked: {}, radio: {} };
  const visit = (list: ContextMenuDocsEntry[]) => {
    for (const entry of list) {
      if (entry.type === 'checkbox') state.checked[entry.value] = entry.checked;
      else if (entry.type === 'radio-group') state.radio[entry.name] = entry.value;
      else if (entry.type === 'group' || entry.type === 'submenu') visit(entry.items);
    }
  };
  visit(entries);
  return state;
}
