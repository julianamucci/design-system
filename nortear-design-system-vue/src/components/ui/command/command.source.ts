/**
 * Transforms do painel Code do Command.
 *
 * Módulo de TS puro, sem import de `.vue`: é o que deixa as funções rodarem no
 * projeto `unit` do vitest. A saída do painel não chega ao DOM durante a `play`,
 * então este é o único lugar em que elas têm guarda.
 *
 * A paleta é composição de call site: raiz, campo de busca, lista com grupos e
 * a região de "nenhum resultado" FORA da lista. A tag da raiz sozinha não
 * ensinaria nenhuma dessas posições.
 */
import { attrBool, asCode, indentar, text, vueSnippet, type SourceTransform } from '@/lib/story-source';

export type CommandArgs = {
  placeholder: string;
  emptyMessage: string;
  showGroups: boolean;
  highlightOnHover: boolean;
};

/** Import do design system, com as peças que cada arranjo usa. */
function importing(...names: string[]): string {
  return `import {
${names.map((name) => `  ${name},`).join('\n')}
} from '@/components/ui/command'`;
}

const PARTS_BASICAS = ['Command', 'CommandEmpty', 'CommandGroup', 'CommandInput', 'CommandItem', 'CommandList'];

/**
 * A moldura da paleta inline: largura, borda e sombra são do call site, não do
 * componente — a raiz não desenha caixa nenhuma sozinha.
 */
function frame(interior: string): string {
  return `<div class="nds-w-sm nds-border-default nds-rounded-md nds-shadow-md">
${indentar(interior, 2)}
</div>`;
}

/**
 * A paleta: campo, lista e região viva.
 *
 * `CommandEmpty` fica FORA de `CommandList` de propósito — `role="status"` não
 * é filho permitido de `role="listbox"`, e dentro dela o axe reprova por
 * `aria-required-children`.
 */
function palette(options: {
  root?: string;
  placeholder: string;
  list: string;
  vazio?: string;
}): string {
  const { root = '', placeholder, list, vazio = 'Nenhum resultado encontrado.' } = options;
  const abertura = root ? `<Command ${root}>` : '<Command>';
  return `${abertura}
  <CommandInput placeholder="${placeholder}" />

  <CommandList>
${indentar(list, 4)}
  </CommandList>

  <CommandEmpty>${vazio}</CommandEmpty>
</Command>`;
}

/**
 * Playground: o campo, dois grupos separados por um divisor e cinco comandos.
 *
 * Os controls de texto passam por `asCode`/`text`, que descartam o que não
 * for string — o Storybook troca arg de ação por um espião, e o corpo do mock
 * interpolado apareceria no painel como se fosse o exemplo.
 *
 * `heading` some junto com o control de grupos: cabeçalho vazio não é o mesmo
 * que cabeçalho ausente, e o componente remove o `aria-labelledby` quando não há
 * rótulo, em vez de deixar a referência apontando para um id inexistente.
 */
export const commandSource: SourceTransform<CommandArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const placeholder = text(asCode(args.placeholder), 'Buscar componente...');
  const vazio = asCode(args.emptyMessage) ?? 'Nenhum resultado encontrado.';
  const withGroups = args.showGroups !== false;
  const title = (name: string) => (withGroups ? ` heading="${name}"` : '');

  return vueSnippet(
    `${importing(...PARTS_BASICAS, 'CommandSeparator', 'CommandShortcut')}

function executar(valor: string) {
  // roda o comando escolhido e devolve o foco para onde ele age
}`,
    frame(
      palette({
        root: attrBool('highlight-on-hover', args.highlightOnHover, false),
        placeholder,
        vazio,
        list: `<CommandGroup${title('Componentes')}>
  <CommandItem value="button" @select="executar('button')">
    Button
    <CommandShortcut>⌘B</CommandShortcut>
  </CommandItem>
  <CommandItem value="input" @select="executar('input')">Input</CommandItem>
  <CommandItem value="separator" @select="executar('separator')">Separator</CommandItem>
</CommandGroup>

<CommandSeparator />

<CommandGroup${title('Utilitários')}>
  <CommandItem value="cn" @select="executar('cn')">cn()</CommandItem>
  <CommandItem value="clsx" @select="executar('clsx')">clsx()</CommandItem>
</CommandGroup>`,
      }),
    ),
  );
};

/**
 * Sem resultados: nada de especial a escrever no call site — o componente
 * decide sozinho quando a região viva ganha conteúdo. O que o exemplo mostra é
 * a POSIÇÃO dela, fora da lista.
 */
export function commandEmptySource(): string {
  return vueSnippet(
    importing(...PARTS_BASICAS),
    frame(
      palette({
        placeholder: 'Buscar componente...',
        list: `<CommandGroup heading="Componentes">
  <CommandItem value="button">Button</CommandItem>
  <CommandItem value="input">Input</CommandItem>
</CommandGroup>`,
      }),
    ),
  );
}

/**
 * Comando desabilitado. `disabled` é do item, e o componente segura o `select`
 * antes que ele chegue a quem consome — as setas também pulam o comando, sem
 * nada escrito aqui.
 */
export function commandItemDisabledSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
${importing(...PARTS_BASICAS)}

const ultimo = ref('')`,
    `<div class="nds-stack" data-spacing="sm">
${indentar(
  frame(
    palette({
      placeholder: 'Buscar comando...',
      list: `<CommandGroup heading="Arquivo">
  <CommandItem value="novo" @select="ultimo = 'novo'">Novo</CommandItem>
  <CommandItem value="arquivar" disabled @select="ultimo = 'arquivar'">Arquivar</CommandItem>
  <CommandItem value="renomear" @select="ultimo = 'renomear'">Renomear</CommandItem>
</CommandGroup>`,
    }),
  ),
  2,
)}

  <p class="nds-text-body nds-text-muted-foreground">{{ ultimo }}</p>
</div>`,
  );
}

/**
 * Comando marcado. `checked` ausente e `checked` falso são coisas DIFERENTES:
 * sem a prop o comando não é marcável e não reserva espaço para a marca; com
 * `false` ele é marcável e está desmarcado. Por isso o `false` entra escrito.
 *
 * O item com atalho não leva marca: os dois disputariam a borda direita, e a
 * regra é escolher um dos dois por comando.
 */
export function commandItemCheckedSource(): string {
  return vueSnippet(
    importing(...PARTS_BASICAS, 'CommandShortcut'),
    frame(
      palette({
        placeholder: 'Buscar tema...',
        list: `<CommandGroup heading="Aparência">
  <CommandItem value="claro" :checked="true">Claro</CommandItem>
  <CommandItem value="escuro" :checked="false">Escuro</CommandItem>
  <CommandItem value="sistema" :checked="true">
    Sistema
    <CommandShortcut>⌘S</CommandShortcut>
  </CommandItem>
</CommandGroup>`,
      }),
    ),
  );
}

/**
 * Grupos nomeados com divisor entre eles. O divisor não é comando nem filho da
 * lista para a árvore de acessibilidade — o componente o esconde dela, porque
 * um listbox só admite `option` e `group`.
 */
export function commandWithGroupsSource(): string {
  return vueSnippet(
    importing(...PARTS_BASICAS, 'CommandSeparator'),
    frame(
      palette({
        placeholder: 'Buscar componente...',
        list: `<CommandGroup heading="Componentes">
  <CommandItem value="button">Button</CommandItem>
  <CommandItem value="input">Input</CommandItem>
  <CommandItem value="select">Select</CommandItem>
</CommandGroup>

<CommandSeparator />

<CommandGroup heading="Utilitários">
  <CommandItem value="separator">Separator</CommandItem>
  <CommandItem value="badge">Badge</CommandItem>
  <CommandItem value="avatar">Avatar</CommandItem>
</CommandGroup>`,
      }),
    ),
  );
}

/**
 * Atalho por comando. Ele fica DENTRO do item de propósito: assim entra no nome
 * acessível, e quem ouve a lista descobre a tecla junto com o comando.
 */
export function commandWithShortcutsSource(): string {
  return vueSnippet(
    importing(...PARTS_BASICAS, 'CommandSeparator', 'CommandShortcut'),
    frame(
      palette({
        placeholder: 'Buscar ação...',
        list: `<CommandGroup heading="Ações">
  <CommandItem value="novo-arquivo">
    Novo arquivo
    <CommandShortcut>⌘N</CommandShortcut>
  </CommandItem>
  <CommandItem value="abrir">
    Abrir
    <CommandShortcut>⌘O</CommandShortcut>
  </CommandItem>
  <CommandItem value="salvar">
    Salvar
    <CommandShortcut>⌘S</CommandShortcut>
  </CommandItem>
</CommandGroup>

<CommandSeparator />

<CommandGroup heading="Editar">
  <CommandItem value="desfazer">
    Desfazer
    <CommandShortcut>⌘Z</CommandShortcut>
  </CommandItem>
  <CommandItem value="refazer">
    Refazer
    <CommandShortcut>⌘⇧Z</CommandShortcut>
  </CommandItem>
</CommandGroup>`,
      }),
    ),
  );
}

/**
 * Combobox: a paleta dentro de um Popover, com um botão que mostra o escolhido.
 *
 * O papel de combobox NÃO tira o nome do conteúdo, ao contrário do de botão: o
 * texto visível deixa de nomear o gatilho no instante em que o papel muda. O
 * `aria-labelledby` costura a finalidade (rótulo invisível) com o valor que está
 * na tela, que é o que a WCAG 2.5.3 pede.
 *
 * Fechar ao escolher é parte do arranjo: sem isso o painel fica por cima do
 * valor que a pessoa acabou de selecionar.
 */
export function commandAsComboboxSource(): string {
  return vueSnippet(
    `import { ref } from 'vue'
import { Button } from '@/components/ui/button'
${importing(...PARTS_BASICAS)}
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

const aberto = ref(false)
const escolhido = ref('')
const itens = [
  { value: 'button', label: 'Button' },
  { value: 'input', label: 'Input' },
  { value: 'select', label: 'Select' },
  { value: 'textarea', label: 'Textarea' },
  { value: 'badge', label: 'Badge' },
  { value: 'avatar', label: 'Avatar' },
]

function escolher(value: string) {
  escolhido.value = value
  aberto.value = false
}`,
    `<Popover v-model:open="aberto">
  <span id="componente-rotulo" class="nds-sr-only">Componente</span>
  <PopoverTrigger as-child>
    <Button
      variant="outline"
      role="combobox"
      :aria-expanded="aberto"
      aria-labelledby="componente-rotulo componente-valor"
      class="nds-cluster nds-w-xs" data-spacing="md"
      data-justify="between"
    >
      <span id="componente-valor">{{
        escolhido
          ? itens.find((item) => item.value === escolhido)?.label
          : 'Selecione um item...'
      }}</span>
    </Button>
  </PopoverTrigger>

  <PopoverContent class="nds-p-0 nds-w-xs">
${indentar(
  palette({
    placeholder: 'Buscar item...',
    list: `<CommandGroup heading="Componentes">
  <CommandItem
    v-for="item in itens"
    :key="item.value"
    :value="item.value"
    @select="escolher(item.value)"
  >
    {{ item.label }}
  </CommandItem>
</CommandGroup>`,
  }),
  4,
)}
  </PopoverContent>
</Popover>`,
  );
}

/**
 * Command palette: a paleta dentro do Dialog, com título e descrição que só o
 * leitor de tela vê — o diálogo precisa de nome, e a paleta não tem cabeçalho
 * visível.
 *
 * O Cmd+K não é de componente nenhum: é ouvinte de janela, e quem o registra é
 * quem consome. `onUnmounted` remove — sem isso o atalho sobrevive à tela que o
 * criou. A dica visível no gatilho é o que faz o atalho ser descoberto.
 */
export function commandPaletteSource(): string {
  return vueSnippet(
    `import { onMounted, onUnmounted, ref } from 'vue'
import { Button } from '@/components/ui/button'
${importing('CommandDialog', 'CommandEmpty', 'CommandGroup', 'CommandInput', 'CommandItem', 'CommandList', 'CommandSeparator', 'CommandShortcut')}

const aberto = ref(false)
const ultimo = ref('')

function aoTeclar(evento: KeyboardEvent) {
  if (evento.key.toLowerCase() !== 'k' || !(evento.metaKey || evento.ctrlKey)) return
  // Sem isto o navegador leva o atalho para a barra de endereço.
  evento.preventDefault()
  aberto.value = true
}

onMounted(() => window.addEventListener('keydown', aoTeclar))
onUnmounted(() => window.removeEventListener('keydown', aoTeclar))

function executar(valor: string) {
  ultimo.value = valor
  aberto.value = false
}`,
    `<div class="nds-stack" data-align="center" data-spacing="md">
  <Button
    variant="outline"
    aria-haspopup="dialog"
    :aria-expanded="aberto"
    @click="aberto = true"
  >
    Buscar
    <kbd class="nds-kbd">⌘K</kbd>
  </Button>

  <CommandDialog
    v-model:open="aberto"
    title="Command Palette"
    description="Busque por um comando ou ação..."
  >
    <CommandInput placeholder="Buscar componente..." />

    <CommandList>
      <CommandGroup heading="Componentes">
        <CommandItem value="button" @select="executar('button')">
          Button
          <CommandShortcut>⌘B</CommandShortcut>
        </CommandItem>
        <CommandItem value="input" @select="executar('input')">
          Input
          <CommandShortcut>⌘I</CommandShortcut>
        </CommandItem>
      </CommandGroup>

      <CommandSeparator />

      <CommandGroup heading="Utilitários">
        <CommandItem value="separator" @select="executar('separator')">Separator</CommandItem>
      </CommandGroup>
    </CommandList>

    <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
  </CommandDialog>

  <p class="nds-text-body nds-text-muted-foreground">{{ ultimo }}</p>
</div>`,
  );
}
