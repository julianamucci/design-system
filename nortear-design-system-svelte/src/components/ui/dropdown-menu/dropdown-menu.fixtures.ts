// ─── A lista dos cards de Variantes do DropdownMenu e do Menubar ─────────────
//
// A forma da lista, o leitor do estado inicial dela e o escritor da marcação
// que ela imprime. A docs page monta a PRÉVIA com a lista (um snippet recursivo
// e o `$state` dos cards), e `dropdownMenuEntriesSource` / `menubarEntriesSource`
// imprimem o CÓDIGO a partir da mesma lista — o desenho que o ContextMenu desta
// stack já tinha (`context-menu.fixtures.ts`) e o da `variantMenu` do vanilla.
//
// Uma lista só para os dois componentes porque a peça é a mesma: um menu da
// barra É um DropdownMenu (`bits/menu` nos dois), com o mesmo item, a mesma
// marcação, o mesmo grupo de rádio e o mesmo submenu. Muda o prefixo da peça no
// código impresso.
//
// Por que aqui, e não no `*.source.ts`: aquele módulo só exporta construtor de
// snippet chamável SEM argumento — a convenção que deixa `source-snippets.test.ts`
// chamar cada export e conferir o que ele ensina. Leitor de estado e escritor de
// linhas exportados de lá reprovariam a convenção de nome.

/**
 * Uma entrada do menu de um card de Variantes, já com o rótulo no idioma da
 * página.
 *
 * Até 2026-09-11 cada card tinha, ao lado da prévia traduzida, um literal de
 * código em português — e o de `default` e o de `destructive` mostravam um item
 * solto que nem existia na prévia ("Novo arquivo" não era chave do conteúdo).
 *
 * `value` é o valor ESTÁVEL do item — o `label` do evento de escolha, o valor
 * da opção no grupo de rádio e, na marcação, o nome da variável do estado
 * (`column-name` → `columnName`). Grupo e grupo de rádio são entradas com
 * filhos porque é assim que o rótulo nomeia o bloco: só DENTRO do grupo o
 * cabeçalho vira o `aria-labelledby` dele.
 */
export type MenuDocsEntry =
  | {
      type: 'item';
      label: string;
      value: string;
      shortcut?: string;
      variant?: 'destructive';
    }
  | { type: 'separator' }
  | { type: 'group'; label: string; items: MenuDocsEntry[] }
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
  | { type: 'submenu'; label: string; items: MenuDocsEntry[] };

/** O estado inicial das marcações e dos grupos de rádio de uma lista. */
export type MenuDocsState = {
  checked: Record<string, boolean>;
  radio: Record<string, string>;
};

/**
 * Lê da lista o estado com que o menu abre — a prévia inicia o `$state` dela
 * por aqui, e o código declara as mesmas variáveis com os mesmos valores.
 */
export function menuEntriesState(entries: MenuDocsEntry[]): MenuDocsState {
  const state: MenuDocsState = { checked: {}, radio: {} };
  const visit = (list: MenuDocsEntry[]) => {
    for (const entry of list) {
      if (entry.type === 'checkbox') state.checked[entry.value] = entry.checked;
      else if (entry.type === 'radio-group') state.radio[entry.name] = entry.value;
      else if (entry.type === 'group' || entry.type === 'submenu') visit(entry.items);
    }
  };
  visit(entries);
  return state;
}

/** `column-name` → `columnName`: o nome da variável que guarda a marcação. */
export function menuStateName(value: string): string {
  return value.replace(/-([a-z0-9])/g, (_match, letter: string) => letter.toUpperCase());
}

// ─── O código que a lista escreve ─────────────────────────────────────────────
//
// As peças têm o MESMO sufixo nos dois componentes (`Item`, `Shortcut`,
// `GroupHeading`, `SubContent`…), e só o prefixo muda: `DropdownMenu` ou
// `Menubar`. O escritor é um só para que os dois cards imprimam a mesma forma —
// o rótulo de grupo DENTRO do grupo, o atalho numa linha própria dentro do item,
// a marcação ligada a uma variável que o `<script>` do exemplo declara.

/** O prefixo das peças de um dos dois componentes. */
export type MenuPiecePrefix = 'DropdownMenu' | 'Menubar';

/** As peças que a lista usa, para o bloco de import. */
export function menuEntriesParts(
  prefix: MenuPiecePrefix,
  entries: MenuDocsEntry[],
  parts: Set<string> = new Set(),
): Set<string> {
  for (const entry of entries) {
    switch (entry.type) {
      case 'item':
        parts.add(`${prefix}Item`);
        if (entry.shortcut) parts.add(`${prefix}Shortcut`);
        break;
      case 'separator':
        parts.add(`${prefix}Separator`);
        break;
      case 'group':
        parts.add(`${prefix}Group`).add(`${prefix}GroupHeading`);
        menuEntriesParts(prefix, entry.items, parts);
        break;
      case 'checkbox':
        parts.add(`${prefix}CheckboxItem`);
        break;
      case 'radio-group':
        parts.add(`${prefix}RadioGroup`).add(`${prefix}GroupHeading`).add(`${prefix}RadioItem`);
        break;
      case 'submenu':
        parts.add(`${prefix}Sub`).add(`${prefix}SubTrigger`).add(`${prefix}SubContent`);
        menuEntriesParts(prefix, entry.items, parts);
        break;
    }
  }
  return parts;
}

/** Uma entrada por linha, com os filhos recuados dentro da entrada que os abre. */
export function menuEntriesMarkup(
  prefix: MenuPiecePrefix,
  entries: MenuDocsEntry[],
  indent: string,
): string[] {
  return entries.flatMap((entry): string[] => {
    switch (entry.type) {
      case 'item': {
        const props = entry.variant ? ` variant="${entry.variant}"` : '';
        if (!entry.shortcut) return [`${indent}<${prefix}Item${props}>${entry.label}</${prefix}Item>`];
        return [
          `${indent}<${prefix}Item${props}>`,
          `${indent}  ${entry.label}`,
          `${indent}  <${prefix}Shortcut>${entry.shortcut}</${prefix}Shortcut>`,
          `${indent}</${prefix}Item>`,
        ];
      }
      case 'separator':
        return [`${indent}<${prefix}Separator />`];
      case 'group':
        return [
          `${indent}<${prefix}Group>`,
          `${indent}  <${prefix}GroupHeading>${entry.label}</${prefix}GroupHeading>`,
          ...menuEntriesMarkup(prefix, entry.items, `${indent}  `),
          `${indent}</${prefix}Group>`,
        ];
      case 'checkbox':
        return [
          `${indent}<${prefix}CheckboxItem bind:checked={${menuStateName(entry.value)}}>`,
          `${indent}  ${entry.label}`,
          `${indent}</${prefix}CheckboxItem>`,
        ];
      case 'radio-group':
        return [
          `${indent}<${prefix}RadioGroup bind:value={${entry.name}}>`,
          `${indent}  <${prefix}GroupHeading>${entry.label}</${prefix}GroupHeading>`,
          ...entry.items.map(
            (option) =>
              `${indent}  <${prefix}RadioItem value="${option.value}">${option.label}</${prefix}RadioItem>`,
          ),
          `${indent}</${prefix}RadioGroup>`,
        ];
      case 'submenu':
        return [
          `${indent}<${prefix}Sub>`,
          `${indent}  <${prefix}SubTrigger>${entry.label}</${prefix}SubTrigger>`,
          `${indent}  <${prefix}SubContent>`,
          ...menuEntriesMarkup(prefix, entry.items, `${indent}    `),
          `${indent}  </${prefix}SubContent>`,
          `${indent}</${prefix}Sub>`,
        ];
    }
  });
}

/** As declarações de `$state` que a marcação da lista liga, na ordem em que aparecem. */
export function menuEntriesDeclarations(entries: MenuDocsEntry[]): string[] {
  const { checked, radio } = menuEntriesState(entries);
  return [
    ...Object.entries(checked).map(([value, on]) => `let ${menuStateName(value)} = $state(${on});`),
    ...Object.entries(radio).map(([name, value]) => `let ${name} = $state('${value}');`),
  ];
}
