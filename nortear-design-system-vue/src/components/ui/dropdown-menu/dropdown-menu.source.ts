/**
 * Transforms do painel Code do DropdownMenu.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * Três coisas das stories NÃO entram no snippet, porque são andaime do quadro
 * do Storybook e não lição:
 *
 * - o `<div>` de contenção com altura mínima, que só existe para o popup caber
 *   no canvas;
 * - o `default-open`, que deixa o Chromatic fotografar o menu montado — um menu
 *   que se abre sozinho ao carregar a página é o oposto do que se copia;
 * - o `:modal="false"` que acompanha esse `default-open` para que o canvas não
 *   fique travado por trás do popup.
 *
 * Só o Playground escreve as duas props, e só quando o control as tira do
 * padrão.
 */
import { attrBool, attrs, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type DropdownMenuArgs = {
  defaultOpen: boolean;
  modal: boolean;
};

/** Ordem canônica das peças no bloco de import — a mesma do `index.ts`. */
const ORDER = [
  'DropdownMenu',
  'DropdownMenuCheckboxItem',
  'DropdownMenuContent',
  'DropdownMenuGroup',
  'DropdownMenuItem',
  'DropdownMenuLabel',
  'DropdownMenuRadioGroup',
  'DropdownMenuRadioItem',
  'DropdownMenuSeparator',
  'DropdownMenuShortcut',
  'DropdownMenuSub',
  'DropdownMenuSubContent',
  'DropdownMenuSubTrigger',
  'DropdownMenuTrigger',
];

/** Bloco de import: as peças do menu e o Button, que é sempre o gatilho. */
function importing(parts: string[]): string {
  const usadas = ORDER.filter((part) => parts.includes(part));
  return [
    `import {`,
    ...usadas.map((part) => `  ${part},`),
    `} from '@/components/ui/dropdown-menu'`,
    `import { Button } from '@/components/ui/button'`,
  ].join('\n');
}

/** Tríade mínima, presente em toda composição. */
const BASE = ['DropdownMenu', 'DropdownMenuContent', 'DropdownMenuTrigger'];

/**
 * O gatilho e o painel em volta do conteúdo do menu.
 *
 * `as-child` no gatilho não é enfeite: sem ele o design system renderizaria um
 * botão DENTRO de outro botão. `side="bottom"` e `align="start"` NÃO aparecem —
 * são os padrões do painel, e repeti-los ensinaria ruído.
 *
 * O conteúdo já chega indentado com quatro espaços.
 */
function menu(options: { trigger: string; content: string; root?: string }): string {
  const { trigger, content, root = '' } = options;
  return `<DropdownMenu${attrs(root)}>
  <DropdownMenuTrigger as-child>
    <Button variant="outline">${trigger}</Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent>
${content}
  </DropdownMenuContent>
</DropdownMenu>`;
}

/**
 * Forma canônica: um grupo nomeado, duas ações e a saída destrutiva separada
 * delas.
 *
 * Os dois controls do Playground chegam aqui, e os dois nascem no padrão da
 * raiz — fechado e modal.
 */
export const dropdownMenuSource: SourceTransform<DropdownMenuArgs> = (_gerado, ctx) => {
  const { defaultOpen, modal } = ctx?.args ?? {};
  return vueSnippet(
    importing([
      ...BASE,
      'DropdownMenuGroup',
      'DropdownMenuItem',
      'DropdownMenuLabel',
      'DropdownMenuSeparator',
    ]),
    menu({
      root: attrs(
        attrBool('default-open', defaultOpen, false),
        attrBool('modal', modal, true),
      ).trim(),
      trigger: 'Abrir menu',
      content: `    <DropdownMenuGroup>
      <DropdownMenuLabel>Conta</DropdownMenuLabel>
      <DropdownMenuItem>Perfil</DropdownMenuItem>
      <DropdownMenuItem>Configurações</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem variant="destructive">Sair</DropdownMenuItem>
    </DropdownMenuGroup>`,
    }),
  );
};

/**
 * Variante Default: o item neutro, que herda a cor do painel.
 *
 * `variant` não aparece: `default` é o padrão do item, e escrevê-lo daria a
 * entender que existe uma escolha a fazer no caso comum.
 */
export function dropdownMenuDefaultSource(): string {
  return vueSnippet(
    importing([...BASE, 'DropdownMenuItem']),
    menu({
      trigger: 'Conta',
      content: `    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuItem>Configurações</DropdownMenuItem>
    <DropdownMenuItem>Equipe</DropdownMenuItem>`,
    }),
  );
}

/**
 * Variante Destructive: a ação irreversível marcada pela cor de perigo.
 *
 * Ela existe para que "Excluir conta" não pareça "Editar perfil", e vem
 * separada das demais.
 */
export function dropdownMenuDestructiveSource(): string {
  return vueSnippet(
    importing([...BASE, 'DropdownMenuItem', 'DropdownMenuSeparator']),
    menu({
      trigger: 'Conta',
      content: `    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>`,
    }),
  );
}

/**
 * Estado Closed: só o gatilho na tela.
 *
 * Fechado não é "escondido": o portal desmonta o painel, e um popup só oculto
 * continuaria no percurso do leitor de tela.
 */
export function dropdownMenuClosedSource(): string {
  return vueSnippet(
    importing([...BASE, 'DropdownMenuItem']),
    menu({
      trigger: 'Abrir menu',
      content: `    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuItem>Sair</DropdownMenuItem>`,
    }),
  );
}

/**
 * Estado Open: o menu montado, com os três itens que o teclado percorre.
 *
 * Setas, Home, End e o salto por letra vêm do primitivo — não há prop nenhuma a
 * ligar, e escrever uma ensinaria API que não existe.
 */
export function dropdownMenuOpenSource(): string {
  return vueSnippet(
    importing([...BASE, 'DropdownMenuItem']),
    menu({
      root: 'default-open',
      trigger: 'Abrir menu',
      content: `    <DropdownMenuItem>Perfil</DropdownMenuItem>
    <DropdownMenuItem>Configurações</DropdownMenuItem>
    <DropdownMenuItem>Equipe</DropdownMenuItem>`,
    }),
  );
}

/**
 * Estado Controlled: a abertura vem de fora.
 *
 * O gatilho continua ali — o que muda é que a raiz passa a seguir o valor
 * ligado. Sem o evento de volta, fechar por dentro deixaria o valor externo em
 * `true` e o rótulo do botão de fora passaria a mentir.
 */
export function dropdownMenuControlledSource(): string {
  return vueSnippet(
    `${importing([...BASE, 'DropdownMenuItem'])}
import { ref } from 'vue'

const aberto = ref(false)`,
    `<div class="nds-stack" data-spacing="sm">
  <Button @click="aberto = !aberto">
    {{ aberto ? 'Fechar pelo estado' : 'Abrir pelo estado' }}
  </Button>
  <DropdownMenu :open="aberto" @update:open="aberto = $event">
    <DropdownMenuTrigger as-child>
      <Button variant="outline">Ações</Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem>Duplicar</DropdownMenuItem>
      <DropdownMenuItem>Arquivar</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</div>`,
  );
}

/**
 * Estado ItemDisabled: o item indisponível continua no menu, e é pulado.
 *
 * A seta salta por cima dele e o ponteiro não o alcança — as duas coisas vêm da
 * prop, não de cada consumidor.
 */
export function dropdownMenuItemDisabledSource(): string {
  return vueSnippet(
    importing([...BASE, 'DropdownMenuItem']),
    menu({
      trigger: 'Ações',
      content: `    <DropdownMenuItem>Editar</DropdownMenuItem>
    <DropdownMenuItem disabled>Arquivar</DropdownMenuItem>
    <DropdownMenuItem>Duplicar</DropdownMenuItem>`,
    }),
  );
}

/**
 * Estado CheckboxIndeterminate: os três estados de uma marcação lado a lado.
 *
 * Misto quer dizer "alguns dos filhos" e desenha traço; marcado desenha tique.
 * Os três são escritos por extenso de propósito — o assunto da story é o
 * CONTRASTE entre eles, e omitir o desmarcado apagaria metade da lição.
 *
 * O valor entra por `model-value` porque aqui ele é fixo, e não ligado: um
 * `v-model` pediria um estado que a story não tem.
 */
export function dropdownMenuMarkupMistaSource(): string {
  return vueSnippet(
    importing([...BASE, 'DropdownMenuCheckboxItem']),
    menu({
      trigger: 'Colunas',
      content: `    <DropdownMenuCheckboxItem model-value="indeterminate">Nome</DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem :model-value="true">E-mail</DropdownMenuCheckboxItem>
    <DropdownMenuCheckboxItem :model-value="false">Telefone</DropdownMenuCheckboxItem>`,
    }),
  );
}

/**
 * Composição WithLabel: grupos nomeados pelo próprio rótulo.
 *
 * É o que o rótulo entrega além do texto: sem ele o leitor anuncia "grupo" e a
 * pessoa não sabe de qual bloco se trata. O rótulo não é item de menu — a seta
 * não pousa nele.
 */
export function dropdownMenuWithLabelSource(): string {
  return vueSnippet(
    importing([
      ...BASE,
      'DropdownMenuGroup',
      'DropdownMenuItem',
      'DropdownMenuLabel',
      'DropdownMenuSeparator',
    ]),
    menu({
      trigger: 'Conta',
      content: `    <DropdownMenuGroup>
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
    }),
  );
}

/**
 * Composição WithCheckboxItems: alternadores independentes entre si.
 *
 * Cada item guarda a própria marcação, e alternar não fecha o menu — quem marca
 * uma coluna costuma marcar a próxima.
 */
export function dropdownMenuWithMarkupSource(): string {
  return vueSnippet(
    `${importing([
      ...BASE,
      'DropdownMenuCheckboxItem',
      'DropdownMenuGroup',
      'DropdownMenuLabel',
    ])}
import { ref } from 'vue'

const mostrarNome = ref(true)
const mostrarEmail = ref(false)
const mostrarFuncao = ref(false)`,
    menu({
      trigger: 'Colunas',
      content: `    <DropdownMenuGroup>
      <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
      <DropdownMenuCheckboxItem v-model="mostrarNome">Nome</DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem v-model="mostrarEmail">E-mail</DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem v-model="mostrarFuncao">Função</DropdownMenuCheckboxItem>
    </DropdownMenuGroup>`,
    }),
  );
}

/**
 * Composição WithRadioGroup: escolha única, o valor vive no grupo.
 *
 * É o que separa a escolha única da marcação: escolher um item desmarca o
 * anterior sem que ninguém escreva essa regra.
 */
export function dropdownMenuWithChoiceUnicaSource(): string {
  return vueSnippet(
    `${importing([
      ...BASE,
      'DropdownMenuLabel',
      'DropdownMenuRadioGroup',
      'DropdownMenuRadioItem',
    ])}
import { ref } from 'vue'

const tema = ref('light')`,
    menu({
      trigger: 'Tema',
      content: `    <DropdownMenuRadioGroup v-model="tema">
      <DropdownMenuLabel>Aparência</DropdownMenuLabel>
      <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
      <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
    </DropdownMenuRadioGroup>`,
    }),
  );
}

/**
 * Composição WithSubmenu: um segundo nível que abre ao lado.
 *
 * A tríade é obrigatória: `Sub` guarda o estado, `SubTrigger` é o item que
 * abre, `SubContent` é o painel filho. A seta para a direita entra e a da
 * esquerda volta — nada disso pede prop.
 */
export function dropdownMenuWithSubmenuSource(): string {
  return vueSnippet(
    importing([
      ...BASE,
      'DropdownMenuItem',
      'DropdownMenuSub',
      'DropdownMenuSubContent',
      'DropdownMenuSubTrigger',
    ]),
    menu({
      trigger: 'Arquivo',
      content: `    <DropdownMenuItem>Renomear</DropdownMenuItem>
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        <DropdownMenuItem>PDF</DropdownMenuItem>
        <DropdownMenuItem>CSV</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuSub>`,
    }),
  );
}

/**
 * Composição WithShortcuts: o atalho encostado na borda direita do item.
 *
 * Ele mora DENTRO do item, e sem `aria-hidden`: é assim que ele entra no nome
 * acessível ("Copiar Ctrl+C"). Escondido, a pessoa ouviria só "Copiar" e nunca
 * saberia que existe uma tecla.
 */
export function dropdownMenuWithShortcutsSource(): string {
  return vueSnippet(
    importing([
      ...BASE,
      'DropdownMenuItem',
      'DropdownMenuSeparator',
      'DropdownMenuShortcut',
    ]),
    menu({
      trigger: 'Editar',
      content: `    <DropdownMenuItem>
      Desfazer<DropdownMenuShortcut>Ctrl+Z</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuItem>
      Copiar<DropdownMenuShortcut>Ctrl+C</DropdownMenuShortcut>
    </DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem>
      Colar<DropdownMenuShortcut>Ctrl+V</DropdownMenuShortcut>
    </DropdownMenuItem>`,
    }),
  );
}

// ─── O menu como DADO: uma lista monta a prévia e imprime o código ────────────
//
// Os cards de Variantes da docs page tinham um literal de código ao lado de
// cada prévia, em português nos três idiomas e sem o estado inicial das
// marcações: em inglês a prévia dizia "Columns" e o código "Colunas", e o
// trecho ligava `v-model` a nomes que não declarava. É o desenho do ContextMenu
// desta stack: a MESMA lista de entradas vira o menu vivo
// (`DropdownMenuPreview.vue`) e o trecho que se copia, então os dois não têm
// como divergir — nem de idioma, nem de estrutura, nem de estado inicial.

/**
 * Item de ação. `value` é o id ESTÁVEL do item — é o que o evento de escolha
 * manda ao GA4 —, e o snippet não o imprime: o item de ação não tem valor.
 */
export type DropdownMenuSnippetAction = {
  kind: 'item';
  label: string;
  value: string;
  shortcut?: string;
  destructive?: boolean;
};

/**
 * Item de marcação. `value` é o id estável e também dá NOME ao `ref` no
 * snippet: `column-email` vira `const columnEmail = ref(false)`.
 */
export type DropdownMenuSnippetCheckbox = {
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
export type DropdownMenuSnippetEntry =
  | DropdownMenuSnippetAction
  | DropdownMenuSnippetCheckbox
  | { kind: 'separator' }
  | { kind: 'submenu'; label: string; items: DropdownMenuSnippetAction[] }
  | {
      kind: 'group';
      label: string;
      items: Array<DropdownMenuSnippetAction | DropdownMenuSnippetCheckbox>;
    }
  | {
      kind: 'radio-group';
      label: string;
      /** Id estável do grupo e nome do `ref` no snippet. */
      value: string;
      /** A opção marcada ao montar — o valor inicial do `ref`. */
      selected: string;
      /** `value` de cada opção é o id estável dela — e o do evento de escolha. */
      options: Array<{ label: string; value: string }>;
    };

/** `column-email` → `columnEmail`: o nome do `ref` sai do id estável. */
function refName(value: string): string {
  return value.replace(/-([a-z0-9])/g, (_, letter: string) => letter.toUpperCase());
}

/**
 * Texto de template. O rótulo vem do conteúdo compartilhado, e um `<` ou um
 * `{{` nele quebraria o trecho copiado — nesse caso ele vai como expressão.
 */
function templateText(text: string): string {
  if (!/[<>{}]/.test(text)) return text;
  return `{{ '${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}' }}`;
}

/** Um item de ação em linhas, no recuo `pad`. */
function actionLines(entry: DropdownMenuSnippetAction, pad: string, parts: Set<string>): string[] {
  parts.add('DropdownMenuItem');
  const open = `<DropdownMenuItem${attrs(entry.destructive && 'variant="destructive"')}>`;
  if (!entry.shortcut) return [`${pad}${open}${templateText(entry.label)}</DropdownMenuItem>`];
  parts.add('DropdownMenuShortcut');
  return [
    `${pad}${open}`,
    `${pad}  ${templateText(entry.label)}`,
    `${pad}  <DropdownMenuShortcut>${templateText(entry.shortcut)}</DropdownMenuShortcut>`,
    `${pad}</DropdownMenuItem>`,
  ];
}

/** Uma entrada em linhas, no recuo `pad`; registra as peças e os `ref` usados. */
function entryLines(
  entry: DropdownMenuSnippetEntry,
  pad: string,
  parts: Set<string>,
  refs: string[],
): string[] {
  switch (entry.kind) {
    case 'item':
      return actionLines(entry, pad, parts);
    case 'separator':
      parts.add('DropdownMenuSeparator');
      return [`${pad}<DropdownMenuSeparator />`];
    case 'checkbox': {
      parts.add('DropdownMenuCheckboxItem');
      const name = refName(entry.value);
      refs.push(`const ${name} = ref(${entry.checked})`);
      return [
        `${pad}<DropdownMenuCheckboxItem v-model="${name}">`,
        `${pad}  ${templateText(entry.label)}`,
        `${pad}</DropdownMenuCheckboxItem>`,
      ];
    }
    case 'submenu':
      parts.add('DropdownMenuSub').add('DropdownMenuSubTrigger').add('DropdownMenuSubContent');
      return [
        `${pad}<DropdownMenuSub>`,
        `${pad}  <DropdownMenuSubTrigger>${templateText(entry.label)}</DropdownMenuSubTrigger>`,
        `${pad}  <DropdownMenuSubContent>`,
        ...entry.items.flatMap((item) => actionLines(item, `${pad}    `, parts)),
        `${pad}  </DropdownMenuSubContent>`,
        `${pad}</DropdownMenuSub>`,
      ];
    case 'group':
      parts.add('DropdownMenuGroup').add('DropdownMenuLabel');
      return [
        `${pad}<DropdownMenuGroup>`,
        `${pad}  <DropdownMenuLabel>${templateText(entry.label)}</DropdownMenuLabel>`,
        ...entry.items.flatMap((item) => entryLines(item, `${pad}  `, parts, refs)),
        `${pad}</DropdownMenuGroup>`,
      ];
    case 'radio-group': {
      parts.add('DropdownMenuRadioGroup').add('DropdownMenuLabel').add('DropdownMenuRadioItem');
      const name = refName(entry.value);
      refs.push(`const ${name} = ref('${entry.selected}')`);
      return [
        `${pad}<DropdownMenuRadioGroup v-model="${name}">`,
        `${pad}  <DropdownMenuLabel>${templateText(entry.label)}</DropdownMenuLabel>`,
        ...entry.options.map(
          (option) =>
            `${pad}  <DropdownMenuRadioItem value="${option.value}">${templateText(option.label)}</DropdownMenuRadioItem>`,
        ),
        `${pad}</DropdownMenuRadioGroup>`,
      ];
    }
  }
}

/** O menu canônico, o mesmo do `meta`: grupo rotulado, divisor e a saída destrutiva. */
const ENTRIES_DEFAULT: readonly DropdownMenuSnippetEntry[] = [
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

/**
 * O trecho do menu descrito por `entries`, com os rótulos EXATAMENTE como
 * chegam — quem chama os lê do conteúdo compartilhado, no idioma da página.
 *
 * O trecho é o que se COLA: o import só das peças usadas e, havendo marcação ou
 * escolha única, o `ref` de cada uma com o valor que a prévia tem ao montar.
 * Sem `entries` o construtor cai no menu canônico, que é como a guarda
 * transversal (`source-snippets.test.ts`) o chama.
 */
export function dropdownMenuSnippet(
  options: { entries?: readonly DropdownMenuSnippetEntry[]; triggerLabel?: string } = {},
): string {
  const parts = new Set(BASE);
  const refs: string[] = [];
  const content = (options.entries ?? ENTRIES_DEFAULT)
    .flatMap((entry) => entryLines(entry, '    ', parts, refs))
    .join('\n');
  const imports = importing([...parts]);
  const script = refs.length
    ? `${imports}
import { ref } from 'vue'

${refs.join('\n')}`
    : imports;
  return vueSnippet(script, menu({ trigger: templateText(options.triggerLabel ?? 'Conta'), content }));
}
