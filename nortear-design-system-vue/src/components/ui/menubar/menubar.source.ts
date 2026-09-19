/**
 * Transforms do painel Code do Menubar.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * O que as stories envolvem num `div` de contenção de layout não entra aqui: a
 * moldura existe para o portal do menu não empurrar a foto do Chromatic, e não
 * faz parte do que quem consome escreve.
 */
import { attr, attrBool, attrs, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type MenubarArgs = {
  defaultValue: string;
  loop: boolean;
};

/**
 * Import do design system, uma peça por linha e em ordem alfabética — a mesma
 * forma do `index.ts` do componente. Quem copia o snippet copia um import que
 * resolve.
 */
function importa(...parts: string[]): string {
  const list = [...new Set(parts)].sort();
  return `import {\n${list.map((part) => `  ${part},`).join('\n')}\n} from '@/components/ui/menubar'`;
}

/** Massa do Playground: quatro categorias clássicas de barra de aplicação. */
const MENUS_DO_EDITOR = `type Menu = {
  value: string
  label: string
  itens: { label: string; atalho?: string }[]
}

const menus: Menu[] = [
  {
    value: 'file',
    label: 'Arquivo',
    itens: [
      { label: 'Novo', atalho: 'Ctrl+N' },
      { label: 'Abrir', atalho: 'Ctrl+O' },
      { label: 'Salvar', atalho: 'Ctrl+S' },
    ],
  },
  {
    value: 'edit',
    label: 'Editar',
    itens: [
      { label: 'Desfazer', atalho: 'Ctrl+Z' },
      { label: 'Refazer', atalho: 'Ctrl+Shift+Z' },
      { label: 'Copiar', atalho: 'Ctrl+C' },
    ],
  },
  {
    value: 'view',
    label: 'Exibir',
    itens: [{ label: 'Aproximar' }, { label: 'Afastar' }, { label: 'Tela cheia' }],
  },
  {
    value: 'help',
    label: 'Ajuda',
    itens: [{ label: 'Documentação' }, { label: 'Atalhos de teclado' }],
  },
]`;

/**
 * Forma canônica: a barra, um menu por categoria, e o gatilho de cada um
 * abrindo o painel de itens. O atalho é opcional e só aparece quando o item o
 * declara.
 *
 * `defaultValue` e `loop` só entram quando diferem do padrão — a barra nasce
 * fechada e a seta já dá a volta sem que ninguém peça.
 */
export const menubarSource: SourceTransform<MenubarArgs> = (_gerado, ctx) => {
  const root = attrs(
    attr('default-value', ctx?.args?.defaultValue),
    attrBool('loop', ctx?.args?.loop, true),
  );
  return vueSnippet(
    `${importa(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarShortcut',
      'MenubarTrigger',
    )}

${MENUS_DO_EDITOR}`,
    `<Menubar${root}>
  <MenubarMenu v-for="m in menus" :key="m.value" :value="m.value">
    <MenubarTrigger>{{ m.label }}</MenubarTrigger>
    <MenubarContent>
      <MenubarItem v-for="i in m.itens" :key="i.label">
        {{ i.label }}
        <MenubarShortcut v-if="i.atalho">{{ i.atalho }}</MenubarShortcut>
      </MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
};

/**
 * Item neutro: a ênfase padrão não se escreve. `variant="default"` no markup
 * ensinaria a repetir o que o componente já faz sozinho.
 */
export function menubarItemDefaultSource(): string {
  return vueSnippet(
    `${importa('Menubar', 'MenubarContent', 'MenubarItem', 'MenubarMenu', 'MenubarTrigger')}

const itens = ['Novo', 'Abrir', 'Salvar']`,
    `<Menubar default-value="file">
  <MenubarMenu value="file">
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem v-for="i in itens" :key="i">{{ i }}</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="edit">
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Desfazer</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
}

/**
 * Item destrutivo: a ação irreversível carrega a ênfase de perigo, e um
 * separador a afasta do item que se parece com ela — "Descartar alterações"
 * não pode ficar encostado em "Salvar".
 */
export function menubarItemDestructiveSource(): string {
  return vueSnippet(
    importa(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarSeparator',
      'MenubarTrigger',
    ),
    `<Menubar default-value="file">
  <MenubarMenu value="file">
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Salvar</MenubarItem>
      <MenubarSeparator />
      <MenubarItem variant="destructive">Descartar alterações</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
}

/**
 * Estado fechado: é AUSÊNCIA. Nenhuma prop declara "fechado" — a barra nasce
 * assim, e o painel de cada menu só existe no DOM enquanto está aberto.
 */
export function menubarClosedSource(): string {
  return vueSnippet(
    `${importa('Menubar', 'MenubarContent', 'MenubarItem', 'MenubarMenu', 'MenubarTrigger')}

const menus = ['Arquivo', 'Editar', 'Exibir', 'Ajuda']`,
    `<Menubar>
  <MenubarMenu v-for="m in menus" :key="m" :value="m">
    <MenubarTrigger>{{ m }}</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>{{ m }} — primeira ação</MenubarItem>
      <MenubarItem>{{ m }} — segunda ação</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
}

/**
 * Estado aberto na montagem: `default-value` casa com o `value` de UM dos
 * menus. É a única forma não-controlada de a barra abrir sozinha, e é o
 * assunto da story.
 */
export function menubarOpenSource(): string {
  return vueSnippet(
    importa('Menubar', 'MenubarContent', 'MenubarItem', 'MenubarMenu', 'MenubarTrigger'),
    `<Menubar default-value="file">
  <MenubarMenu value="file">
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Novo</MenubarItem>
      <MenubarItem>Abrir</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="edit">
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Desfazer</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
}

/**
 * Item bloqueado: o item continua no menu e continua alcançável pela seta —
 * ele é ANUNCIADO como indisponível em vez de sumir sem explicação de quem
 * navega por teclado.
 */
export function menubarItemDisabledSource(): string {
  return vueSnippet(
    `${importa('Menubar', 'MenubarContent', 'MenubarItem', 'MenubarMenu', 'MenubarTrigger')}

const itens = [
  { label: 'Novo', disabled: false },
  { label: 'Salvar', disabled: false },
  { label: 'Enviar para revisão', disabled: true },
]`,
    `<Menubar default-value="file">
  <MenubarMenu value="file">
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem
        v-for="i in itens"
        :key="i.label"
        :disabled="i.disabled"
      >{{ i.label }}</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
}

/**
 * Item de marcação: a API é `checked` / `@update:checked`, e o estado precisa
 * ser REATIVO. Com um objeto solto o clique emitiria a mudança e nada
 * re-renderizaria — o item ficaria preso no estado inicial.
 */
export function menubarCheckboxCheckedSource(): string {
  return vueSnippet(
    `${importa(
      'Menubar',
      'MenubarCheckboxItem',
      'MenubarContent',
      'MenubarLabel',
      'MenubarMenu',
      'MenubarTrigger',
    )}
import { reactive } from 'vue'

const estado = reactive<Record<string, boolean>>({ 'Régua': true, Grade: false })`,
    `<Menubar default-value="view">
  <MenubarMenu value="view">
    <MenubarTrigger>Exibir</MenubarTrigger>
    <MenubarContent>
      <MenubarLabel>Mostrar na tela</MenubarLabel>
      <MenubarCheckboxItem
        v-for="(marcado, nome) in estado"
        :key="nome"
        :checked="marcado"
        @update:checked="estado[nome] = $event"
      >{{ nome }}</MenubarCheckboxItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
}

/**
 * Estado misto: `checked` aceita três estados, e `'indeterminate'` é o valor
 * que diz "alguns dos filhos". Ele entra como string literal — a comparação
 * frouxa de um booleano leria o misto como marcado.
 */
export function menubarCheckboxIndeterminateSource(): string {
  return vueSnippet(
    importa(
      'Menubar',
      'MenubarCheckboxItem',
      'MenubarContent',
      'MenubarLabel',
      'MenubarMenu',
      'MenubarTrigger',
    ),
    `<Menubar default-value="view">
  <MenubarMenu value="view">
    <MenubarTrigger>Exibir</MenubarTrigger>
    <MenubarContent>
      <MenubarLabel>Mostrar na tela</MenubarLabel>
      <MenubarCheckboxItem checked="indeterminate">Colunas</MenubarCheckboxItem>
      <MenubarCheckboxItem :checked="true">Régua</MenubarCheckboxItem>
      <MenubarCheckboxItem :checked="false">Grade</MenubarCheckboxItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
}

/**
 * Atalhos visíveis: o atalho é filho do item, e NÃO leva `aria-hidden` —
 * "Desfazer Ctrl+Z" é o nome acessível inteiro, e é ele que dá serventia ao atalho
 * para quem não enxerga a tela.
 */
export function menubarWithShortcutsSource(): string {
  return vueSnippet(
    `${importa(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarShortcut',
      'MenubarTrigger',
    )}

const atalhos = [
  { label: 'Desfazer', atalho: 'Ctrl+Z' },
  { label: 'Refazer', atalho: 'Ctrl+Shift+Z' },
  { label: 'Copiar', atalho: 'Ctrl+C' },
]`,
    `<Menubar default-value="edit">
  <MenubarMenu value="edit">
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenubarContent>
      <MenubarItem v-for="a in atalhos" :key="a.label">
        {{ a.label }}
        <MenubarShortcut>{{ a.atalho }}</MenubarShortcut>
      </MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
}

/**
 * Submenu: `MenubarSub` embrulha o par gatilho/painel DENTRO do painel do menu
 * pai. O pai continua aberto quando o filho abre — é o que separa submenu de
 * troca de menu.
 */
export function menubarWithSubmenuSource(): string {
  return vueSnippet(
    `${importa(
      'Menubar',
      'MenubarContent',
      'MenubarItem',
      'MenubarMenu',
      'MenubarSub',
      'MenubarSubContent',
      'MenubarSubTrigger',
      'MenubarTrigger',
    )}

const exportacoes = ['PDF', 'CSV', 'PNG']`,
    `<Menubar default-value="file">
  <MenubarMenu value="file">
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Novo</MenubarItem>
      <MenubarSub>
        <MenubarSubTrigger>Exportar</MenubarSubTrigger>
        <MenubarSubContent>
          <MenubarItem v-for="e in exportacoes" :key="e">{{ e }}</MenubarItem>
        </MenubarSubContent>
      </MenubarSub>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
}

/**
 * Alternadores independentes: cada linha marca ou desmarca sozinha, e o
 * rótulo do grupo diz do que se trata. Marcar NÃO fecha o menu — quem marca
 * uma quer marcar a próxima.
 */
export function menubarWithCheckboxSource(): string {
  return vueSnippet(
    `${importa(
      'Menubar',
      'MenubarCheckboxItem',
      'MenubarContent',
      'MenubarGroup',
      'MenubarLabel',
      'MenubarMenu',
      'MenubarTrigger',
    )}
import { reactive } from 'vue'

const exibicoes = ['Régua', 'Barra lateral', 'Grade']
const estado = reactive<Record<string, boolean>>({
  'Régua': true,
  'Barra lateral': false,
  Grade: false,
})`,
    `<Menubar default-value="view">
  <MenubarMenu value="view">
    <MenubarTrigger>Exibir</MenubarTrigger>
    <MenubarContent>
      <MenubarGroup>
        <MenubarLabel>Mostrar na tela</MenubarLabel>
        <MenubarCheckboxItem
          v-for="e in exibicoes"
          :key="e"
          :checked="estado[e]"
          @update:checked="estado[e] = $event"
        >{{ e }}</MenubarCheckboxItem>
      </MenubarGroup>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
}

/**
 * Escolha única: o grupo é o dono do valor, e `v-model` nele basta — a opção
 * só declara o próprio `value`. Escolher outra transfere a marcação sozinha.
 */
export function menubarWithRadioSource(): string {
  return vueSnippet(
    `${importa(
      'Menubar',
      'MenubarContent',
      'MenubarLabel',
      'MenubarMenu',
      'MenubarRadioGroup',
      'MenubarRadioItem',
      'MenubarTrigger',
    )}
import { ref } from 'vue'

const temas = [
  { valor: 'light', label: 'Claro' },
  { valor: 'dark', label: 'Escuro' },
  { valor: 'system', label: 'Do sistema' },
]
const tema = ref('light')`,
    `<Menubar default-value="theme">
  <MenubarMenu value="theme">
    <MenubarTrigger>Aparência</MenubarTrigger>
    <MenubarContent>
      <MenubarRadioGroup v-model="tema">
        <MenubarLabel>Tema</MenubarLabel>
        <MenubarRadioItem v-for="t in temas" :key="t.valor" :value="t.valor">
          {{ t.label }}
        </MenubarRadioItem>
      </MenubarRadioGroup>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
}

/**
 * Quantas ações o menu longo lista.
 *
 * SESSENTA, que é o número da medição que fixou a D17: com 60 itens numa janela
 * de 900px o painel transborda e o axe acusa `scrollable-region-focusable`. O
 * número não é decorativo — menor, o painel CABE, e a story fecharia verde sem
 * exercer o recorte que é o assunto dela. É a armadilha medida no svelte no
 * mesmo dia.
 */
export const LONG_MENU_ITEMS = 60;

/** Os rótulos do menu longo — a mesma lista que a story renderiza. */
export const LONG_MENU_LABELS: readonly string[] = Array.from(
  { length: LONG_MENU_ITEMS },
  (_, i) => `Ação ${i + 1}`,
);

/**
 * O menu que não cabe na tela (D17).
 *
 * A lição do exemplo é que NÃO HÁ nada a escrever: o recorte e a rolagem saem
 * da folha — `max-height` pela altura disponível, `overflow-y: auto` —, e o
 * teclado continua alcançando o item que rolou para fora porque o foco é
 * itinerante. Nenhuma prop do markup pede rolagem, e essa ausência é o que o
 * painel Code ensina aqui.
 *
 * A lista é GERADA no trecho, e não escrita item a item: sessenta linhas de
 * `<MenubarItem>` ensinariam a repetição do andaime e não a forma do item.
 */
export function menubarLongMenuSource(): string {
  return vueSnippet(
    `${importa('Menubar', 'MenubarContent', 'MenubarItem', 'MenubarMenu', 'MenubarTrigger')}

const acoes = Array.from({ length: ${LONG_MENU_ITEMS} }, (_, i) => \`Ação \${i + 1}\`)`,
    `<Menubar>
  <MenubarMenu value="actions">
    <MenubarTrigger>Ações</MenubarTrigger>
    <MenubarContent>
      <MenubarItem v-for="a in acoes" :key="a">{{ a }}</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
}

/**
 * A barra inteira de um editor: as quatro categorias convivem, e cada uma usa
 * a peça que o seu conteúdo pede — grupo com rótulo, separador antes do item
 * de perigo, atalho no item de teclado e alternador no menu de exibição.
 */
export function menubarEditorSource(): string {
  return vueSnippet(
    importa(
      'Menubar',
      'MenubarCheckboxItem',
      'MenubarContent',
      'MenubarGroup',
      'MenubarItem',
      'MenubarLabel',
      'MenubarMenu',
      'MenubarSeparator',
      'MenubarShortcut',
      'MenubarTrigger',
    ),
    `<Menubar>
  <MenubarMenu value="file">
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarGroup>
        <MenubarLabel>Documento</MenubarLabel>
        <MenubarItem>Novo <MenubarShortcut>Ctrl+N</MenubarShortcut></MenubarItem>
        <MenubarItem>Abrir <MenubarShortcut>Ctrl+O</MenubarShortcut></MenubarItem>
      </MenubarGroup>
      <MenubarSeparator />
      <MenubarItem variant="destructive">Descartar alterações</MenubarItem>
    </MenubarContent>
  </MenubarMenu>

  <MenubarMenu value="edit">
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Desfazer <MenubarShortcut>Ctrl+Z</MenubarShortcut></MenubarItem>
      <MenubarItem>Refazer <MenubarShortcut>Ctrl+Shift+Z</MenubarShortcut></MenubarItem>
    </MenubarContent>
  </MenubarMenu>

  <MenubarMenu value="view">
    <MenubarTrigger>Exibir</MenubarTrigger>
    <MenubarContent>
      <MenubarGroup>
        <MenubarLabel>Mostrar na tela</MenubarLabel>
        <MenubarCheckboxItem :checked="true">Régua</MenubarCheckboxItem>
        <MenubarCheckboxItem :checked="false">Grade</MenubarCheckboxItem>
      </MenubarGroup>
    </MenubarContent>
  </MenubarMenu>

  <MenubarMenu value="help">
    <MenubarTrigger>Ajuda</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Documentação</MenubarItem>
      <MenubarItem>Atalhos de teclado</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
}

/**
 * Menu CONTROLADO — `v-model` na BARRA.
 *
 * É a forma que `props.extensibilityCode` ensina, e nesta stack quem guarda a
 * abertura é a raiz: o modelo é o `value` do menu aberto, e string vazia é a
 * barra fechada. Controlar um menu só, deixando os vizinhos de fora, não é
 * possível aqui — a divergência é de API de framework, e fica registrada assim.
 *
 * O botão externo entra no trecho porque ele é o assunto: é ele que mostra o
 * estado de fora comandando a barra. E o `v-model` é o que garante o caminho de
 * volta — sem ele o menu abriria e nunca mais fecharia, nem por Escape, que é
 * armadilha de teclado (WCAG 2.1.2).
 */
export function menubarControlledSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
${importa('Menubar', 'MenubarContent', 'MenubarItem', 'MenubarMenu', 'MenubarTrigger')}

const openMenu = ref('')`,
    `<button
  type="button"
  class="nds-button nds-button-outline nds-button-sm"
  @click="openMenu = 'file'"
>
  Abrir Arquivo
</button>

<Menubar v-model="openMenu">
  <MenubarMenu value="file">
    <MenubarTrigger>Arquivo</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Novo</MenubarItem>
      <MenubarItem>Abrir</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
  <MenubarMenu value="edit">
    <MenubarTrigger>Editar</MenubarTrigger>
    <MenubarContent>
      <MenubarItem>Desfazer</MenubarItem>
    </MenubarContent>
  </MenubarMenu>
</Menubar>`,
  );
}

// ─── A barra como DADO: uma lista monta a prévia e imprime o código ───────────
//
// Os cards de Variantes da docs page tinham um literal de código ao lado de
// cada prévia, em português nos três idiomas e sem o estado inicial das
// marcações e da escolha única: em inglês a prévia dizia "View" e o código
// "Exibir", e o trecho ligava `:checked` a nomes que não declarava. É o desenho
// do ContextMenu desta stack: a MESMA lista de menus vira a barra viva
// (`MenubarPreview.vue`) e o trecho que se copia, então os dois não têm como
// divergir.

/**
 * Item de ação. `value` é o id ESTÁVEL do item — é o que o evento de escolha
 * manda ao GA4 —, e o snippet não o imprime: o item de ação não tem valor.
 */
export type MenubarSnippetAction = {
  kind: 'item';
  label: string;
  value: string;
  shortcut?: string;
  destructive?: boolean;
};

/**
 * Item de marcação, ligado por `v-model:checked` — a API do
 * `MenubarCheckboxItem` desta stack. `value` é o id estável e dá NOME ao `ref`:
 * `show-ruler` vira `const showRuler = ref(true)`.
 */
export type MenubarSnippetCheckbox = {
  kind: 'checkbox';
  label: string;
  value: string;
  checked: boolean;
};

/**
 * Uma entrada de um menu da barra. O submenu aceita qualquer entrada, inclusive
 * outro submenu: é assim que o "evite" do par 2 desenha o nível a mais que a
 * legenda condena, vivo. O grupo de escolha única carrega o próprio rótulo
 * quando tem um — é ele que o rótulo nomeia.
 */
export type MenubarSnippetEntry =
  | MenubarSnippetAction
  | MenubarSnippetCheckbox
  | { kind: 'separator' }
  | { kind: 'submenu'; label: string; items: MenubarSnippetEntry[] }
  | { kind: 'group'; label: string; items: Array<MenubarSnippetAction | MenubarSnippetCheckbox> }
  | {
      kind: 'radio-group';
      label?: string;
      /** Id estável do grupo e nome do `ref` no snippet. */
      value: string;
      /** A opção marcada ao montar — o valor inicial do `ref`. */
      selected: string;
      /** `value` de cada opção é o id estável dela — e o do evento de escolha. */
      options: Array<{ label: string; value: string }>;
    };

/** Um menu da barra: o `value` do `MenubarMenu`, o texto do gatilho e as entradas. */
export type MenubarSnippetMenu = {
  value: string;
  trigger: string;
  entries: MenubarSnippetEntry[];
};

/** `show-ruler` → `showRuler`: o nome do `ref` sai do id estável. */
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

/** Uma entrada em linhas, no recuo `pad`; registra as peças e os `ref` usados. */
function entryLines(
  entry: MenubarSnippetEntry,
  pad: string,
  parts: Set<string>,
  refs: string[],
): string[] {
  switch (entry.kind) {
    case 'item': {
      parts.add('MenubarItem');
      const open = `<MenubarItem${attrs(entry.destructive && 'variant="destructive"')}>`;
      if (!entry.shortcut) return [`${pad}${open}${templateText(entry.label)}</MenubarItem>`];
      parts.add('MenubarShortcut');
      return [
        `${pad}${open}`,
        `${pad}  ${templateText(entry.label)}`,
        `${pad}  <MenubarShortcut>${templateText(entry.shortcut)}</MenubarShortcut>`,
        `${pad}</MenubarItem>`,
      ];
    }
    case 'separator':
      parts.add('MenubarSeparator');
      return [`${pad}<MenubarSeparator />`];
    case 'checkbox': {
      parts.add('MenubarCheckboxItem');
      const name = refName(entry.value);
      refs.push(`const ${name} = ref(${entry.checked})`);
      return [
        `${pad}<MenubarCheckboxItem v-model:checked="${name}">`,
        `${pad}  ${templateText(entry.label)}`,
        `${pad}</MenubarCheckboxItem>`,
      ];
    }
    case 'submenu':
      parts.add('MenubarSub').add('MenubarSubTrigger').add('MenubarSubContent');
      return [
        `${pad}<MenubarSub>`,
        `${pad}  <MenubarSubTrigger>${templateText(entry.label)}</MenubarSubTrigger>`,
        `${pad}  <MenubarSubContent>`,
        ...entry.items.flatMap((item) => entryLines(item, `${pad}    `, parts, refs)),
        `${pad}  </MenubarSubContent>`,
        `${pad}</MenubarSub>`,
      ];
    case 'group':
      parts.add('MenubarGroup').add('MenubarLabel');
      return [
        `${pad}<MenubarGroup>`,
        `${pad}  <MenubarLabel>${templateText(entry.label)}</MenubarLabel>`,
        ...entry.items.flatMap((item) => entryLines(item, `${pad}  `, parts, refs)),
        `${pad}</MenubarGroup>`,
      ];
    case 'radio-group': {
      parts.add('MenubarRadioGroup').add('MenubarRadioItem');
      if (entry.label) parts.add('MenubarLabel');
      const name = refName(entry.value);
      refs.push(`const ${name} = ref('${entry.selected}')`);
      return [
        `${pad}<MenubarRadioGroup v-model="${name}">`,
        ...(entry.label ? [`${pad}  <MenubarLabel>${templateText(entry.label)}</MenubarLabel>`] : []),
        ...entry.options.map(
          (option) =>
            `${pad}  <MenubarRadioItem value="${option.value}">${templateText(option.label)}</MenubarRadioItem>`,
        ),
        `${pad}</MenubarRadioGroup>`,
      ];
    }
  }
}

/** A barra canônica: um menu de arquivo, com o atalho de cada item. */
const MENUS_DEFAULT: readonly MenubarSnippetMenu[] = [
  {
    value: 'file',
    trigger: 'Arquivo',
    entries: [
      { kind: 'item', label: 'Novo', value: 'new', shortcut: 'Ctrl+N' },
      { kind: 'item', label: 'Salvar', value: 'save', shortcut: 'Ctrl+S' },
    ],
  },
];

/**
 * O trecho da barra descrita por `menus`, com os rótulos EXATAMENTE como chegam
 * — quem chama os lê do conteúdo compartilhado, no idioma da página.
 *
 * O trecho é o que se COLA: o import só das peças usadas e, havendo marcação ou
 * escolha única, o `ref` de cada uma com o valor que a prévia tem ao montar.
 * `loop` não aparece: a barra desta stack já nasce dando a volta. Sem `menus` o
 * construtor cai na barra canônica, que é como a guarda transversal
 * (`source-snippets.test.ts`) o chama.
 */
export function menubarSnippet(options: { menus?: readonly MenubarSnippetMenu[] } = {}): string {
  const parts = new Set(['Menubar', 'MenubarContent', 'MenubarMenu', 'MenubarTrigger']);
  const refs: string[] = [];
  const markup = (options.menus ?? MENUS_DEFAULT)
    .map((menu) =>
      [
        `  <MenubarMenu value="${menu.value}">`,
        `    <MenubarTrigger>${templateText(menu.trigger)}</MenubarTrigger>`,
        `    <MenubarContent>`,
        ...menu.entries.flatMap((entry) => entryLines(entry, '      ', parts, refs)),
        `    </MenubarContent>`,
        `  </MenubarMenu>`,
      ].join('\n'),
    )
    .join('\n');
  const imports = importa(...parts);
  const script = refs.length
    ? `${imports}
import { ref } from 'vue'

${refs.join('\n')}`
    : imports;
  return vueSnippet(script, `<Menubar>\n${markup}\n</Menubar>`);
}
