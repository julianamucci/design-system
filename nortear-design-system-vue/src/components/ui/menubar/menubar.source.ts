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
export function menubarItemBloqueadoSource(): string {
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
export function menubarCheckboxMistoSource(): string {
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
 * A barra inteira de um editor: as quatro categorias convivem, e cada uma usa
 * a peça que o seu conteúdo pede — grupo com rótulo, separador antes do item
 * de perigo, atalho no item de teclado e alternador no menu de exibição.
 */
export function menubarEditorCompletoSource(): string {
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
