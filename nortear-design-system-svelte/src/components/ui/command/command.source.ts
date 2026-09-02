/**
 * Transforms do painel Code do Command.
 *
 * Módulo de TS puro, sem import de `.svelte`: é o que deixa as funções rodarem
 * no projeto `unit` do vitest. A saída do painel não chega ao DOM durante a
 * `play`, então este é o único lugar em que elas têm guarda.
 *
 * Os snippets usam os nomes ACHATADOS (`CommandInput`, `CommandGroup`…) e não o
 * namespace: é a API que a estrutura básica da docs page ensina e a que o
 * `index.ts` publica.
 */
import { attrs, svelteSnippet } from '@/lib/story-source';

export type CommandArgs = {
  placeholder: string;
  emptyMessage: string;
  loop: boolean;
  shouldFilter: boolean;
};

/** Corpo de `executar`, o destino de cada comando escolhido. */
const EXECUTAR = `function executar(value: string) {
  // roda o comando e devolve o foco para onde ele age
}`;

/** Monta o bloco de imports achatados do próprio Command. */
function importing(...parts: string[]): string {
  return `import {
${parts.map((part) => `  ${part},`).join('\n')}
} from '@/components/ui/command';`;
}

/**
 * Forma canônica: busca, lista com dois grupos e o divisor entre eles, e a
 * mensagem de vazio IRMÃ da lista.
 *
 * O lugar da mensagem não é detalhe de layout: ela é a região viva que anuncia
 * a busca sem resultado, e `role="status"` não é filho permitido de
 * `role="listbox"`. Ensinar o snippet com ela dentro da lista seria ensinar o
 * defeito. Serve o Playground e cascateia como padrão dos arquivos de estados e
 * composições.
 */
export function commandSource(
  _gerado?: string,
  ctx?: { args?: Partial<CommandArgs> },
): string {
  const {
    placeholder = 'Buscar componente...',
    emptyMessage = 'Nenhum resultado encontrado.',
    loop = false,
    shouldFilter = true,
  } = ctx?.args ?? {};

  const props = attrs(loop ? 'loop' : '', shouldFilter ? '' : 'shouldFilter={false}');

  return svelteSnippet(
    `${importing(
      'Command',
      'CommandInput',
      'CommandList',
      'CommandEmpty',
      'CommandGroup',
      'CommandItem',
      'CommandSeparator',
    )}

${EXECUTAR}`,
    `<Command${props}>
  <CommandInput placeholder="${placeholder}" />
  <CommandList>
    <CommandGroup heading="Componentes">
      <CommandItem value="button" onSelect={() => executar('button')}>Button</CommandItem>
      <CommandItem value="input" onSelect={() => executar('input')}>Input</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Utilitários">
      <CommandItem value="cn" onSelect={() => executar('cn')}>cn()</CommandItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>${emptyMessage}</CommandEmpty>
</Command>`,
  );
}

/** Estado EmptyState: a frase de vazio, irmã da lista, quando nada casa. */
export function commandNoResultsSource(): string {
  return svelteSnippet(
    importing(
      'Command',
      'CommandInput',
      'CommandList',
      'CommandEmpty',
      'CommandGroup',
      'CommandItem',
    ),
    `<Command>
  <CommandInput placeholder="Buscar componente..." />
  <CommandList>
    <CommandGroup heading="Componentes">
      <CommandItem value="button">Button</CommandItem>
      <CommandItem value="input">Input</CommandItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</Command>`,
  );
}

/**
 * Estado LoadingState: o indicador fica FORA da lista.
 *
 * Ele se anuncia como progresso, e progresso não é filho permitido de uma
 * lista de opções — dentro dela a estrutura de acessibilidade fica inválida.
 */
export function commandLoadingSource(): string {
  return svelteSnippet(
    `${importing('Command', 'CommandInput', 'CommandList', 'CommandEmpty', 'CommandLoading')}
import LoaderCircle from '@lucide/svelte/icons/loader-circle';`,
    `<Command>
  <CommandInput placeholder="Buscar componente..." />
  <CommandLoading>
    <div
      class="nds-cluster nds-p-4 nds-text-body nds-text-muted-foreground"
      data-align="center"
      data-justify="center"
      data-spacing="sm"
    >
      <LoaderCircle class="nds-size-4 nds-animate-spin" aria-hidden="true" />
      <span>Carregando resultados...</span>
    </div>
  </CommandLoading>
  <CommandList />
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</Command>`,
  );
}

/** Estado ItemDisabled: o comando indisponível não recebe clique nem seta. */
export function commandItemDisabledSource(): string {
  return svelteSnippet(
    `${importing(
      'Command',
      'CommandInput',
      'CommandList',
      'CommandEmpty',
      'CommandGroup',
      'CommandItem',
    )}

${EXECUTAR}`,
    `<Command>
  <CommandInput placeholder="Buscar comando..." />
  <CommandList>
    <CommandGroup heading="Arquivo">
      <CommandItem value="novo" onSelect={() => executar('novo')}>Novo</CommandItem>
      <CommandItem value="arquivar" disabled onSelect={() => executar('arquivar')}>
        Arquivar
      </CommandItem>
      <CommandItem value="renomear" onSelect={() => executar('renomear')}>
        Renomear
      </CommandItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</Command>`,
  );
}

/**
 * Estado CheckedItem: `checked` é o que torna o comando marcável.
 *
 * Sem a prop o comando não ganha marca nenhuma; com ela, `true` e `false` são
 * os dois estados de um mesmo comando — por isso o `false` aparece explícito.
 */
export function commandItemCheckedSource(): string {
  return svelteSnippet(
    importing(
      'Command',
      'CommandInput',
      'CommandList',
      'CommandEmpty',
      'CommandGroup',
      'CommandItem',
      'CommandShortcut',
    ),
    `<Command>
  <CommandInput placeholder="Buscar tema..." />
  <CommandList>
    <CommandGroup heading="Aparência">
      <CommandItem value="claro" checked={true}>Claro</CommandItem>
      <CommandItem value="escuro" checked={false}>Escuro</CommandItem>
      <CommandItem value="sistema" checked={true}>
        Sistema
        <CommandShortcut>Ctrl+S</CommandShortcut>
      </CommandItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</Command>`,
  );
}

/** Composição WithGroups: o cabeçalho nomeia o bloco e o divisor só desenha. */
export function commandWithGroupsSource(): string {
  return svelteSnippet(
    importing(
      'Command',
      'CommandInput',
      'CommandList',
      'CommandEmpty',
      'CommandGroup',
      'CommandItem',
      'CommandSeparator',
    ),
    `<Command>
  <CommandInput placeholder="Buscar componente..." />
  <CommandList>
    <CommandGroup heading="Componentes">
      <CommandItem value="button">Button</CommandItem>
      <CommandItem value="input">Input</CommandItem>
      <CommandItem value="badge">Badge</CommandItem>
      <CommandItem value="separator">Separator</CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Utilitários">
      <CommandItem value="cn">cn()</CommandItem>
      <CommandItem value="clsx">clsx()</CommandItem>
      <CommandItem value="twmerge">twMerge()</CommandItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</Command>`,
  );
}

/**
 * Composição WithShortcuts: o atalho mora DENTRO do comando.
 *
 * É lido junto do rótulo e não entra no filtro, que roda sobre o `value`.
 */
export function commandWithShortcutsSource(): string {
  return svelteSnippet(
    importing(
      'Command',
      'CommandInput',
      'CommandList',
      'CommandEmpty',
      'CommandGroup',
      'CommandItem',
      'CommandSeparator',
      'CommandShortcut',
    ),
    `<Command>
  <CommandInput placeholder="Buscar ação..." />
  <CommandList>
    <CommandGroup heading="Ações">
      <CommandItem value="new-file">
        Novo arquivo
        <CommandShortcut>Ctrl+N</CommandShortcut>
      </CommandItem>
      <CommandItem value="open-file">
        Abrir arquivo
        <CommandShortcut>Ctrl+O</CommandShortcut>
      </CommandItem>
      <CommandItem value="save-file">
        Salvar
        <CommandShortcut>Ctrl+S</CommandShortcut>
      </CommandItem>
      <CommandItem value="find">
        Buscar
        <CommandShortcut>Ctrl+F</CommandShortcut>
      </CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Navegação">
      <CommandItem value="settings">
        Configurações
        <CommandShortcut>Ctrl+,</CommandShortcut>
      </CommandItem>
      <CommandItem value="command-palette">
        Command Palette
        <CommandShortcut>Ctrl+K</CommandShortcut>
      </CommandItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</Command>`,
  );
}

/** Composição WithLinkItem: o comando que navega é uma âncora de verdade. */
export function commandWithLinkItemSource(): string {
  return svelteSnippet(
    `${importing(
      'Command',
      'CommandInput',
      'CommandList',
      'CommandEmpty',
      'CommandGroup',
      'CommandLinkItem',
      'CommandSeparator',
    )}
import BookOpen from '@lucide/svelte/icons/book-open';
import Code2 from '@lucide/svelte/icons/code-2';
import ExternalLink from '@lucide/svelte/icons/external-link';`,
    `<Command>
  <CommandInput placeholder="Buscar recurso..." />
  <CommandList>
    <CommandGroup heading="Documentação">
      <CommandLinkItem href="/docs/button" value="docs-button">
        <BookOpen aria-hidden="true" />
        Button — Docs
        <ExternalLink class="nds-spacer-start nds-opacity-50" aria-hidden="true" />
      </CommandLinkItem>
      <CommandLinkItem href="/docs/input" value="docs-input">
        <BookOpen aria-hidden="true" />
        Input — Docs
        <ExternalLink class="nds-spacer-start nds-opacity-50" aria-hidden="true" />
      </CommandLinkItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Links externos">
      <CommandLinkItem
        href="https://github.com"
        value="github"
        target="_blank"
        rel="noopener noreferrer"
      >
        <Code2 aria-hidden="true" />
        GitHub
        <ExternalLink class="nds-spacer-start nds-opacity-50" aria-hidden="true" />
      </CommandLinkItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</Command>`,
  );
}

/**
 * Composição CommandPalette: a paleta dentro do CommandDialog.
 *
 * O `title` e a `description` nomeiam o diálogo para quem não vê a tela; o
 * componente já os mantém fora da tela por dentro.
 */
export function commandPaletteSource(): string {
  return svelteSnippet(
    `import { Button } from '@/components/ui/button';
${importing(
  'CommandDialog',
  'CommandInput',
  'CommandList',
  'CommandEmpty',
  'CommandGroup',
  'CommandItem',
  'CommandSeparator',
  'CommandShortcut',
)}
import FileText from '@lucide/svelte/icons/file-text';
import LayoutDashboard from '@lucide/svelte/icons/layout-dashboard';
import Search from '@lucide/svelte/icons/search';
import Settings from '@lucide/svelte/icons/settings';
import Users from '@lucide/svelte/icons/users';

let aberto = $state(false);

function executar(value: string) {
  // roda o comando; fechar a paleta faz parte do gesto
  aberto = false;
}

$effect(() => {
  function aoTeclar(evento: KeyboardEvent) {
    if ((evento.metaKey || evento.ctrlKey) && evento.key.toLowerCase() === 'k') {
      // Sem isto o navegador leva o atalho para a barra de endereço.
      evento.preventDefault();
      // Atribuição, e não alternância: repetir a tecla não pode fechar o que
      // se acabou de pedir.
      aberto = true;
    }
  }
  window.addEventListener('keydown', aoTeclar);
  return () => window.removeEventListener('keydown', aoTeclar);
});`,
    `<Button
  variant="outline"
  class="nds-cluster nds-w-xs nds-text-muted-foreground" data-spacing="md"
  data-justify="between"
  onclick={() => (aberto = true)}
>
  <span class="nds-cluster" data-spacing="sm">
    <Search class="nds-size-4" aria-hidden="true" />
    Buscar...
  </span>
  <kbd class="nds-kbd">Ctrl+K</kbd>
</Button>

<CommandDialog
  bind:open={aberto}
  title="Command Palette"
  description="Busque por um comando ou ação..."
>
  <CommandInput placeholder="Buscar comando ou ação..." />
  <CommandList>
    <CommandGroup heading="Páginas">
      <CommandItem value="dashboard" onSelect={() => executar('dashboard')}>
        <LayoutDashboard aria-hidden="true" />
        Dashboard
        <CommandShortcut>Ctrl+D</CommandShortcut>
      </CommandItem>
      <CommandItem value="documents" onSelect={() => executar('documents')}>
        <FileText aria-hidden="true" />
        Documentos
      </CommandItem>
      <CommandItem value="users" onSelect={() => executar('users')}>
        <Users aria-hidden="true" />
        Usuários
      </CommandItem>
    </CommandGroup>
    <CommandSeparator />
    <CommandGroup heading="Configurações">
      <CommandItem value="settings" onSelect={() => executar('settings')}>
        <Settings aria-hidden="true" />
        Configurações
        <CommandShortcut>Ctrl+,</CommandShortcut>
      </CommandItem>
    </CommandGroup>
  </CommandList>
  <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
</CommandDialog>`,
  );
}
