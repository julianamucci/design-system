/**
 * Transforms do painel Code do DropdownMenu.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O painel imprimia a árvore do `render`: o `<div class="nds-min-h-80"
 * style={{ contain }}>` que segura o canvas da story, o `{...rootArgs}` e, nas
 * composições, os componentes de estado declarados dentro do arquivo de
 * story. Nada disso compila fora dali.
 *
 * Duas coisas ficam FORA dos snippets de propósito:
 *
 *  · **`defaultOpen` e `modal={false}` das stories abertas.** Existem para o
 *    Chromatic fotografar o menu aberto sem a guarda de foco do modal
 *    interferir. Não são o uso de produção.
 *  · **`onOpenChange` do Playground.** O Storybook o entrega como espião;
 *    interpolado, o corpo do mock viraria código no painel. Quem ensina o par
 *    controlado é a story Controlled, com estado de verdade.
 *
 * Uma regra do primitivo que todo snippet respeita: **o rótulo mora DENTRO do
 * grupo que ele nomeia**. Fora de um `DropdownMenuGroup`/`DropdownMenuRadioGroup`
 * ele lança "MenuGroupContext is missing" e o menu inteiro deixa de renderizar
 * — sem erro na tela, só um portal vazio.
 */
import {
  attrs,
  attrsMultilinha,
  indentar,
  jsxSnippet,
  propBool,
  propOption,
  type SourceTransform,
} from '@/lib/story-source';

export type DropdownMenuArgs = {
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
  modal: boolean;
  defaultOpen: boolean;
};

const LADOS = ['top', 'bottom', 'left', 'right'] as const;
const ALINHAMENTOS = ['start', 'center', 'end'] as const;

/** Import base: só as peças que o snippet correspondente usa. */
function importDe(...parts: string[]): string {
  const list = ['DropdownMenu', ...parts].sort();
  return `import {
${list.map((part) => `  ${part},`).join('\n')}
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";`;
}

/**
 * O gatilho entra por `asChild`: quem recebe foco, `aria-haspopup` e
 * `aria-expanded` é o `<Button>` de quem consome. Sem `asChild` sobraria um
 * elemento a mais entre o botão e o menu.
 */
function trigger(label: string): string {
  return `<DropdownMenuTrigger asChild>
  <Button variant="outline">${label}</Button>
</DropdownMenuTrigger>`;
}

function menu(propsRaiz: string, rotuloGatilho: string, propsConteudo: string, items: string): string {
  return `<DropdownMenu${propsRaiz}>
${indentar(trigger(rotuloGatilho))}
  <DropdownMenuContent${propsConteudo}>
${indentar(items, '    ')}
  </DropdownMenuContent>
</DropdownMenu>`;
}

/**
 * Transform do `meta` — cascateia para todas as stories do arquivo.
 *
 * Lê os controls do Playground. `side` e `align` moram no Content, não na raiz;
 * `modal` e `defaultOpen`, na raiz. Cada um só aparece quando difere do padrão
 * do componente.
 */
export const dropdownMenuSource: SourceTransform<DropdownMenuArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const root = attrsMultilinha([
    propBool('defaultOpen', args.defaultOpen),
    propBool('modal', args.modal, true),
  ]);
  const content = attrs(
    propOption('side', args.side, LADOS, 'bottom'),
    propOption('align', args.align, ALINHAMENTOS, 'start'),
  );

  return jsxSnippet(
    importDe(
      'DropdownMenuContent',
      'DropdownMenuGroup',
      'DropdownMenuItem',
      'DropdownMenuLabel',
      'DropdownMenuSeparator',
      'DropdownMenuTrigger',
    ),
    menu(
      root,
      'Abrir menu',
      content,
      `<DropdownMenuGroup>
  <DropdownMenuLabel>Conta</DropdownMenuLabel>
  <DropdownMenuItem>Perfil</DropdownMenuItem>
  <DropdownMenuItem>Configurações</DropdownMenuItem>
  <DropdownMenuSeparator />
  <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
</DropdownMenuGroup>`,
    ),
  );
};

/**
 * Itens neutros, sem grupo nem rótulo. É a forma mínima do menu: uma lista de
 * ações. O `variant` fica de fora justamente porque `default` é o padrão —
 * escrevê-lo ensinaria ruído.
 */
export function dropdownMenuItemDefaultSource(): string {
  return jsxSnippet(
    importDe('DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuTrigger'),
    menu(
      '',
      'Conta',
      '',
      `<DropdownMenuItem>Perfil</DropdownMenuItem>
<DropdownMenuItem>Configurações</DropdownMenuItem>
<DropdownMenuItem>Equipe</DropdownMenuItem>`,
    ),
  );
}

/**
 * Item destrutivo. A variante existe para que "Excluir conta" não pareça
 * "Editar perfil": ela troca a cor do texto E, ao ser destacado, a cor do
 * fundo — quem não distingue matiz precisa do segundo sinal.
 */
export function dropdownMenuItemDestructiveSource(): string {
  return jsxSnippet(
    importDe(
      'DropdownMenuContent',
      'DropdownMenuItem',
      'DropdownMenuSeparator',
      'DropdownMenuTrigger',
    ),
    menu(
      '',
      'Conta',
      '',
      `<DropdownMenuItem>Perfil</DropdownMenuItem>
<DropdownMenuSeparator />
<DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>`,
    ),
  );
}

/**
 * Item desabilitado. `disabled` anuncia `aria-disabled` e desliga os eventos de
 * ponteiro no CSS — a seta ainda pousa nele, para que seja anunciado, mas ele
 * não executa. É o padrão de menu da WAI-ARIA.
 */
export function dropdownMenuItemDisabledSource(): string {
  return jsxSnippet(
    importDe('DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuTrigger'),
    menu(
      '',
      'Ações',
      '',
      `<DropdownMenuItem>Editar</DropdownMenuItem>
<DropdownMenuItem disabled>Arquivar</DropdownMenuItem>
<DropdownMenuItem>Duplicar</DropdownMenuItem>`,
    ),
  );
}

/**
 * Modo controlado: o par `open` + `onOpenChange`. Sem o callback o valor ligado
 * nunca voltaria a `false`, e o menu reabriria a cada tentativa de fechar —
 * inclusive pelo Escape.
 */
export function dropdownMenuControlledSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${importDe('DropdownMenuContent', 'DropdownMenuItem', 'DropdownMenuTrigger')}`,
    `function AcoesDoItem() {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="nds-stack" data-spacing="sm">
      <Button onClick={() => setAberto(!aberto)}>
        {aberto ? "Fechar pelo estado" : "Abrir pelo estado"}
      </Button>

      <DropdownMenu open={aberto} onOpenChange={setAberto}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline">Ações</Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Duplicar</DropdownMenuItem>
          <DropdownMenuItem>Arquivar</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}`,
  );
}

/**
 * Grupos com rótulo. O rótulo dá NOME ACESSÍVEL ao grupo — sem ele o leitor
 * anuncia "grupo" e a pessoa não sabe de qual bloco se trata —, e não é item de
 * menu: a seta não pousa nele e o typeahead não o traz como resultado.
 */
export function dropdownMenuWithLabelSource(): string {
  return jsxSnippet(
    importDe(
      'DropdownMenuContent',
      'DropdownMenuGroup',
      'DropdownMenuItem',
      'DropdownMenuLabel',
      'DropdownMenuSeparator',
      'DropdownMenuTrigger',
    ),
    menu(
      '',
      'Conta',
      '',
      `<DropdownMenuGroup>
  <DropdownMenuLabel>Conta</DropdownMenuLabel>
  <DropdownMenuItem>Perfil</DropdownMenuItem>
  <DropdownMenuItem>Configurações</DropdownMenuItem>
</DropdownMenuGroup>
<DropdownMenuSeparator />
<DropdownMenuGroup>
  <DropdownMenuLabel>Suporte</DropdownMenuLabel>
  <DropdownMenuItem>Documentação</DropdownMenuItem>
  <DropdownMenuItem>Sair</DropdownMenuItem>
</DropdownMenuGroup>`,
    ),
  );
}

/**
 * Alternadores independentes. Cada item guarda o próprio `checked`, alternar um
 * não mexe no outro e o menu NÃO fecha — quem marca uma coluna costuma marcar a
 * próxima. O estado vive fora do componente, que só o reflete.
 */
export function dropdownMenuWithCheckboxSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${importDe(
  'DropdownMenuCheckboxItem',
  'DropdownMenuContent',
  'DropdownMenuGroup',
  'DropdownMenuLabel',
  'DropdownMenuTrigger',
)}`,
    `function ColunasVisiveis() {
  const [nome, setNome] = useState(true);
  const [email, setEmail] = useState(false);
  const [funcao, setFuncao] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Colunas</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuGroup>
          <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
          <DropdownMenuCheckboxItem checked={nome} onCheckedChange={setNome}>
            Nome
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={email} onCheckedChange={setEmail}>
            E-mail
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={funcao} onCheckedChange={setFuncao}>
            Função
          </DropdownMenuCheckboxItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}`,
  );
}

/**
 * Escolha única. O valor mora no grupo, não em cada item: escolher um desmarca
 * o anterior sozinho. O rótulo fica DENTRO do `DropdownMenuRadioGroup`, que
 * também é um grupo para efeito do contexto do primitivo.
 */
export function dropdownMenuWithRadioSource(): string {
  return jsxSnippet(
    `import { useState } from "react";
${importDe(
  'DropdownMenuContent',
  'DropdownMenuLabel',
  'DropdownMenuRadioGroup',
  'DropdownMenuRadioItem',
  'DropdownMenuTrigger',
)}`,
    `function EscolhaDeTema() {
  const [tema, setTema] = useState("light");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">Tema</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuRadioGroup value={tema} onValueChange={setTema}>
          <DropdownMenuLabel>Aparência</DropdownMenuLabel>
          <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}`,
  );
}

/**
 * Submenu. O trio Sub/SubTrigger/SubContent é o que faz o segundo painel abrir
 * AO LADO do primeiro e responder à seta para a direita. A seta indicadora do
 * gatilho vem do próprio componente — não se acrescenta ícone aqui.
 */
export function dropdownMenuWithSubmenuSource(): string {
  return jsxSnippet(
    importDe(
      'DropdownMenuContent',
      'DropdownMenuItem',
      'DropdownMenuSub',
      'DropdownMenuSubContent',
      'DropdownMenuSubTrigger',
      'DropdownMenuTrigger',
    ),
    menu(
      '',
      'Arquivo',
      '',
      `<DropdownMenuItem>Renomear</DropdownMenuItem>
<DropdownMenuSub>
  <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
  <DropdownMenuSubContent>
    <DropdownMenuItem>PDF</DropdownMenuItem>
    <DropdownMenuItem>CSV</DropdownMenuItem>
  </DropdownMenuSubContent>
</DropdownMenuSub>`,
    ),
  );
}

/**
 * Atalhos de teclado. O atalho é INFORMAÇÃO, não decoração: fica dentro do
 * item, entra no nome acessível ("Copiar Ctrl+C") e por isso nunca leva
 * `aria-hidden`. Quem o empurra para a borda direita é o próprio componente.
 */
export function dropdownMenuWithShortcutsSource(): string {
  return jsxSnippet(
    importDe(
      'DropdownMenuContent',
      'DropdownMenuItem',
      'DropdownMenuSeparator',
      'DropdownMenuShortcut',
      'DropdownMenuTrigger',
    ),
    menu(
      '',
      'Editar',
      '',
      `<DropdownMenuItem>
  Desfazer
  <DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
</DropdownMenuItem>
<DropdownMenuItem>
  Copiar
  <DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
</DropdownMenuItem>
<DropdownMenuSeparator />
<DropdownMenuItem>
  Colar
  <DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
</DropdownMenuItem>`,
    ),
  );
}

/**
 * Marcação mista: os três estados de um item de marcação lado a lado.
 *
 * Misto quer dizer "alguns dos filhos" e desenha traço; marcado desenha tique.
 * Os três vão por extenso de propósito — o assunto é o CONTRASTE entre eles, e
 * omitir o desmarcado apagaria metade da lição.
 *
 * `indeterminate` é prop do wrapper, e controlada: o primeiro clique chama
 * `onCheckedChange(true)`, e é ali que quem guarda o estado tira o misto.
 */
export function dropdownMenuCheckboxIndeterminateSource(): string {
  return jsxSnippet(
    importDe(
      'DropdownMenuCheckboxItem',
      'DropdownMenuContent',
      'DropdownMenuGroup',
      'DropdownMenuLabel',
      'DropdownMenuTrigger',
    ),
    menu(
      '',
      'Exibir',
      '',
      `<DropdownMenuGroup>
  <DropdownMenuLabel>Mostrar na tela</DropdownMenuLabel>
  <DropdownMenuCheckboxItem checked={false} indeterminate>
    Colunas
  </DropdownMenuCheckboxItem>
  <DropdownMenuCheckboxItem checked>Régua</DropdownMenuCheckboxItem>
  <DropdownMenuCheckboxItem checked={false}>Grade</DropdownMenuCheckboxItem>
</DropdownMenuGroup>`,
    ),
  );
}

// ─── O menu como DADO: uma lista monta a prévia e imprime o código ────────────
//
// Os cards de Variantes da docs page tinham um literal de código ao lado de
// cada prévia, em português — e dois deles nem prévia tinham, só o texto
// `variant="default"`. É o desenho do ContextMenu desta stack e do vanilla: a
// MESMA lista de entradas vira o menu vivo e o trecho que se copia, então os
// dois não têm como divergir — nem de idioma, nem de estrutura.

/**
 * Item de ação. `value` é o id ESTÁVEL do item — é o que o evento de escolha
 * manda ao GA4 —, e o snippet não o imprime: o item de ação não tem `value`.
 */
export type DropdownMenuActionEntry = {
  kind: 'item';
  label: string;
  value: string;
  shortcut?: string;
  destructive?: boolean;
};

/**
 * Item de marcação. `value` é o id estável e também dá NOME ao estado no
 * snippet: `column-email` vira `const [columnEmail, setColumnEmail]`.
 */
export type DropdownMenuCheckboxEntry = {
  kind: 'checkbox';
  label: string;
  value: string;
  checked: boolean;
};

/**
 * Uma entrada do menu. O grupo de escolha única carrega o PRÓPRIO rótulo: é o
 * `DropdownMenuRadioGroup` que o rótulo nomeia, sem `DropdownMenuGroup` em
 * volta — dois grupos aninhados anunciavam um deles anônimo.
 */
export type DropdownMenuEntry =
  | DropdownMenuActionEntry
  | DropdownMenuCheckboxEntry
  | { kind: 'separator' }
  | { kind: 'submenu'; label: string; items: DropdownMenuActionEntry[] }
  | {
      kind: 'group';
      label: string;
      items: Array<DropdownMenuActionEntry | DropdownMenuCheckboxEntry>;
    }
  | {
      kind: 'radio-group';
      label: string;
      /** Id estável do grupo e nome do estado no snippet. */
      value: string;
      /** A opção marcada ao montar. */
      selected: string;
      /** `value` de cada opção é o id estável dela — e o do evento de escolha. */
      options: Array<{ label: string; value: string }>;
    };

/** `column-email` → `columnEmail`: o nome do estado sai do id estável. */
function stateName(value: string): string {
  return value.replace(/-([a-z0-9])/g, (_, letter: string) => letter.toUpperCase());
}

function setterName(state: string): string {
  return `set${state.charAt(0).toUpperCase()}${state.slice(1)}`;
}

/**
 * Texto de JSX. O rótulo vem do conteúdo compartilhado, e um `{` ou um `<`
 * nele quebraria o trecho copiado — nesse caso ele vai como string entre chaves.
 */
function jsxText(text: string): string {
  return /[{}<>]/.test(text) ? `{${JSON.stringify(text)}}` : text;
}

function actionLines(entry: DropdownMenuActionEntry, pad: string): string[] {
  const open = `<DropdownMenuItem${entry.destructive ? ' variant="destructive"' : ''}>`;
  if (!entry.shortcut) return [`${pad}${open}${jsxText(entry.label)}</DropdownMenuItem>`];
  return [
    `${pad}${open}`,
    `${pad}  ${jsxText(entry.label)}`,
    `${pad}  <DropdownMenuShortcut>${jsxText(entry.shortcut)}</DropdownMenuShortcut>`,
    `${pad}</DropdownMenuItem>`,
  ];
}

function entryLines(entry: DropdownMenuEntry, pad: string): string[] {
  switch (entry.kind) {
    case 'item':
      return actionLines(entry, pad);
    case 'separator':
      return [`${pad}<DropdownMenuSeparator />`];
    case 'checkbox': {
      const state = stateName(entry.value);
      return [
        `${pad}<DropdownMenuCheckboxItem checked={${state}} onCheckedChange={${setterName(state)}}>`,
        `${pad}  ${jsxText(entry.label)}`,
        `${pad}</DropdownMenuCheckboxItem>`,
      ];
    }
    case 'submenu':
      return [
        `${pad}<DropdownMenuSub>`,
        `${pad}  <DropdownMenuSubTrigger>${jsxText(entry.label)}</DropdownMenuSubTrigger>`,
        `${pad}  <DropdownMenuSubContent>`,
        ...entry.items.flatMap((item) => actionLines(item, `${pad}    `)),
        `${pad}  </DropdownMenuSubContent>`,
        `${pad}</DropdownMenuSub>`,
      ];
    case 'group':
      return [
        `${pad}<DropdownMenuGroup>`,
        `${pad}  <DropdownMenuLabel>${jsxText(entry.label)}</DropdownMenuLabel>`,
        ...entry.items.flatMap((item) => entryLines(item, `${pad}  `)),
        `${pad}</DropdownMenuGroup>`,
      ];
    case 'radio-group': {
      const state = stateName(entry.value);
      return [
        `${pad}<DropdownMenuRadioGroup value={${state}} onValueChange={${setterName(state)}}>`,
        `${pad}  <DropdownMenuLabel>${jsxText(entry.label)}</DropdownMenuLabel>`,
        ...entry.options.map(
          (option) =>
            `${pad}  <DropdownMenuRadioItem value=${JSON.stringify(option.value)}>${jsxText(option.label)}</DropdownMenuRadioItem>`,
        ),
        `${pad}</DropdownMenuRadioGroup>`,
      ];
    }
  }
}

/** O `useState` de cada marcação e de cada grupo de escolha única, na ordem do menu. */
function stateLines(entries: readonly DropdownMenuEntry[]): string[] {
  return entries.flatMap((entry) => {
    if (entry.kind === 'checkbox') {
      const state = stateName(entry.value);
      return [`const [${state}, ${setterName(state)}] = useState(${entry.checked});`];
    }
    if (entry.kind === 'radio-group') {
      const state = stateName(entry.value);
      return [`const [${state}, ${setterName(state)}] = useState(${JSON.stringify(entry.selected)});`];
    }
    if (entry.kind === 'group') return stateLines(entry.items);
    return [];
  });
}

/** As peças que as entradas usam — é o bloco de import, e só ele. */
function entryParts(entries: readonly DropdownMenuEntry[], parts: Set<string>): Set<string> {
  for (const entry of entries) {
    switch (entry.kind) {
      case 'item':
        parts.add('DropdownMenuItem');
        if (entry.shortcut) parts.add('DropdownMenuShortcut');
        break;
      case 'separator':
        parts.add('DropdownMenuSeparator');
        break;
      case 'checkbox':
        parts.add('DropdownMenuCheckboxItem');
        break;
      case 'submenu':
        parts.add('DropdownMenuSub').add('DropdownMenuSubTrigger').add('DropdownMenuSubContent');
        entryParts(entry.items, parts);
        break;
      case 'group':
        parts.add('DropdownMenuGroup').add('DropdownMenuLabel');
        entryParts(entry.items, parts);
        break;
      case 'radio-group':
        parts.add('DropdownMenuRadioGroup').add('DropdownMenuLabel').add('DropdownMenuRadioItem');
        break;
    }
  }
  return parts;
}

/** O menu canônico, o mesmo do `meta`: grupo rotulado, divisor e a ação destrutiva. */
const ENTRIES_DEFAULT: readonly DropdownMenuEntry[] = [
  {
    kind: 'group',
    label: 'Conta',
    items: [
      { kind: 'item', label: 'Perfil', value: 'profile' },
      { kind: 'item', label: 'Configurações', value: 'settings' },
    ],
  },
  { kind: 'separator' },
  { kind: 'item', label: 'Sair', value: 'logout', destructive: true },
];

export type DropdownMenuSnippetOptions = {
  /** Texto do botão que abre o menu. */
  triggerLabel?: string;
  /** O menu como lista de entradas; sem ela, o menu canônico. */
  entries?: readonly DropdownMenuEntry[];
};

/**
 * O trecho do menu descrito por `entries`, com os rótulos EXATAMENTE como
 * chegam — quem chama os lê do conteúdo compartilhado, no idioma da página.
 *
 * O trecho é o que se COLA: o import só das peças usadas e, havendo marcação ou
 * escolha única, o `useState` de cada uma dentro de um componente. Sem
 * `entries` o construtor cai no menu canônico, que é como a guarda transversal
 * o chama.
 */
export function dropdownMenuSnippet(o: DropdownMenuSnippetOptions = {}): string {
  const entries = o.entries ?? ENTRIES_DEFAULT;
  const state = stateLines(entries);
  const parts = [...entryParts(entries, new Set(['DropdownMenuContent', 'DropdownMenuTrigger']))];
  const items = entries.flatMap((entry) => entryLines(entry, '')).join('\n');
  const markup = menu('', jsxText(o.triggerLabel ?? 'Conta'), '', items);

  if (state.length === 0) return jsxSnippet(importDe(...parts), markup);

  return jsxSnippet(
    `import { useState } from "react";
${importDe(...parts)}`,
    `function DropdownMenuWithState() {
${indentar(state.join('\n'), '  ')}

  return (
${indentar(markup, '    ')}
  );
}`,
  );
}
