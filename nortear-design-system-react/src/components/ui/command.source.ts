/**
 * Transforms do painel Code do Command.
 *
 * Módulo de TS puro — o `.tsx` só entra por `import type`, que o compilador
 * apaga. É o que deixa as funções rodarem no projeto `unit` do vitest, a única
 * guarda que elas têm: a saída do painel não chega ao DOM durante a `play`.
 *
 * O que o painel imprimia antes era a árvore do `render`: a moldura de
 * demonstração, os espiões das actions e, na composição da paleta, um
 * `<CommandPaletteDemo />` que só existe dentro do arquivo de story. Quem
 * copiava recebia uma tag sem origem.
 *
 * Cada construtor ensina a MESMA lista que a story ao lado desenha — itens,
 * grupos, placeholder e atalhos são os do Vanilla, que é a referência. Snippet
 * que mostra três itens ao lado de uma story com quatro ensina outra coisa.
 */
import {
  attrs,
  jsxSnippet,
  propBool,
  type SourceTransform,
} from '@/lib/story-source';

export type CommandArgs = {
  loop: boolean;
  shouldFilter: boolean;
};

/** A importação só do que o snippet usa — peça importada e não usada é ruído. */
function importPieces(...pieces: string[]): string {
  return `import {
${pieces.map((piece) => `  ${piece},`).join('\n')}
} from "@/components/ui/command";`;
}

/**
 * A moldura da paleta solta.
 *
 * `.nds-command` só pinta fundo e raio — largura, borda e sombra são de quem
 * posiciona a paleta na página. Dentro de um Popover ou de um CommandDialog o
 * painel já traz as três, e por isso a moldura some das duas composições.
 */
const FRAME = 'nds-w-sm nds-border-default nds-rounded-md nds-shadow-md';

const NO_RESULT = 'Nenhum resultado encontrado.';

/**
 * O que o comando faz é decisão do call site: a paleta só entrega o `value` do
 * comando escolhido, por clique ou por Enter.
 */
const ON_CHOOSE = `function aoEscolher(valor: string) {
  window.location.hash = valor;
}`;

/**
 * Transform do `meta` — vale para todas as stories do arquivo que não trazem
 * a própria.
 *
 * Ensina o arranjo canônico: campo de busca, lista com dois grupos separados por
 * divisor, e a mensagem de vazio IRMÃ da lista.
 *
 * O lugar da mensagem não é detalhe de layout: ela é a região viva que anuncia
 * a busca sem resultado, e `role="status"` não é filho permitido de
 * `role="listbox"`. Ensinar o snippet com ela dentro da lista seria ensinar o
 * defeito. `loop` e `shouldFilter` só aparecem quando diferem do padrão do
 * componente.
 */
export const commandSource: SourceTransform<CommandArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const props = attrs(
    propBool('loop', args.loop, false),
    propBool('shouldFilter', args.shouldFilter, true),
  );

  return jsxSnippet(
    `${importPieces(
      'Command',
      'CommandEmpty',
      'CommandGroup',
      'CommandInput',
      'CommandItem',
      'CommandList',
      'CommandSeparator',
    )}

${ON_CHOOSE}`,
    `<div className="${FRAME}">
  <Command${props}>
    <CommandInput placeholder="Buscar componente..." />
    <CommandList>
      <CommandGroup heading="Componentes">
        <CommandItem value="button" onSelect={aoEscolher}>Button</CommandItem>
        <CommandItem value="input" onSelect={aoEscolher}>Input</CommandItem>
        <CommandItem value="separator" onSelect={aoEscolher}>Separator</CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Utilitários">
        <CommandItem value="cn" onSelect={aoEscolher}>cn()</CommandItem>
        <CommandItem value="clsx" onSelect={aoEscolher}>clsx()</CommandItem>
      </CommandGroup>
    </CommandList>
    <CommandEmpty>${NO_RESULT}</CommandEmpty>
  </Command>
</div>`,
  );
};

/**
 * Com grupos: cada bloco nomeado pelo próprio cabeçalho, e o divisor entre
 * eles. O filtro atravessa os dois — a divisão é de leitura, não de busca.
 */
export function commandWithGroupsSource(): string {
  return jsxSnippet(
    importPieces(
      'Command',
      'CommandEmpty',
      'CommandGroup',
      'CommandInput',
      'CommandItem',
      'CommandList',
      'CommandSeparator',
    ),
    `<div className="${FRAME}">
  <Command>
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
    <CommandEmpty>${NO_RESULT}</CommandEmpty>
  </Command>
</div>`,
  );
}

/**
 * Sem resultados: três comandos num grupo SEM cabeçalho, e a mensagem de vazio
 * que é o assunto da story. Item sem grupo mora num grupo sem cabeçalho — a
 * caixa dá o padding de que o raio aninhado do item depende. A busca sem
 * correspondência que a story já traz digitada é andaime de demonstração —
 * quem copia recebe a paleta vazia de busca, que é como ela nasce.
 */
export function commandEmptyStateSource(): string {
  return jsxSnippet(
    importPieces(
      'Command',
      'CommandEmpty',
      'CommandGroup',
      'CommandInput',
      'CommandItem',
      'CommandList',
    ),
    `<div className="${FRAME}">
  <Command>
    <CommandInput placeholder="Buscar componente..." />
    <CommandList>
      <CommandGroup>
        <CommandItem value="button">Button</CommandItem>
        <CommandItem value="input">Input</CommandItem>
        <CommandItem value="separator">Separator</CommandItem>
      </CommandGroup>
    </CommandList>
    <CommandEmpty>${NO_RESULT}</CommandEmpty>
  </Command>
</div>`,
  );
}

/**
 * Comando desabilitado: `disabled` é do comando, não da paleta.
 *
 * O estado precisa chegar ao markup (`aria-disabled`) porque a atenuação
 * sozinha não é anunciada, e a navegação por seta PULA o comando — quem usa
 * teclado nunca para no que não pode executar.
 */
export function commandItemDisabledSource(): string {
  return jsxSnippet(
    importPieces(
      'Command',
      'CommandEmpty',
      'CommandGroup',
      'CommandInput',
      'CommandItem',
      'CommandList',
    ),
    `<div className="${FRAME}">
  <Command>
    <CommandInput placeholder="Buscar comando..." />
    <CommandList>
      <CommandGroup>
        <CommandItem value="novo">Novo</CommandItem>
        <CommandItem value="arquivar" disabled>Arquivar</CommandItem>
        <CommandItem value="renomear">Renomear</CommandItem>
      </CommandGroup>
    </CommandList>
    <CommandEmpty>${NO_RESULT}</CommandEmpty>
  </Command>
</div>`,
  );
}

/**
 * Comando marcado: `checked` publica a escolha em `data-checked`, que é o
 * gancho da marca na folha compartilhada.
 *
 * Sem valor nenhum o atributo não é emitido, e a marca nem entra no item —
 * comando que não representa escolha não declara estado de escolha, nem
 * `false`. O terceiro comando é marcado E tem atalho de propósito: é o caso em
 * que a folha esconde a marca, porque as duas disputam a mesma borda.
 */
export function commandItemCheckedSource(): string {
  return jsxSnippet(
    importPieces(
      'Command',
      'CommandEmpty',
      'CommandGroup',
      'CommandInput',
      'CommandItem',
      'CommandList',
      'CommandShortcut',
    ),
    `<div className="${FRAME}">
  <Command>
    <CommandInput placeholder="Buscar tema..." />
    <CommandList>
      <CommandGroup heading="Aparência">
        <CommandItem value="claro" checked>Claro</CommandItem>
        <CommandItem value="escuro" checked={false}>Escuro</CommandItem>
        <CommandItem value="sistema" checked>
          Sistema <CommandShortcut>Ctrl+S</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </CommandList>
    <CommandEmpty>${NO_RESULT}</CommandEmpty>
  </Command>
</div>`,
  );
}

/**
 * Lista longa: trinta comandos num grupo só. Quem segura a paleta na tela é o
 * teto de 300px da lista, que rola — nada a declarar no call site.
 */
export function commandLongListSource(): string {
  return jsxSnippet(
    `${importPieces(
      'Command',
      'CommandEmpty',
      'CommandGroup',
      'CommandInput',
      'CommandItem',
      'CommandList',
    )}

const COMPONENTES = [
  "Accordion", "Alert", "AlertDialog", "AspectRatio", "Avatar",
  "Badge", "Breadcrumb", "Button", "Calendar", "Card",
  "Carousel", "Chart", "Checkbox", "Collapsible", "Command",
  "ContextMenu", "DataTable", "DatePicker", "Dialog", "Drawer",
  "DropdownMenu", "Form", "HoverCard", "Input", "InputOTP",
  "Label", "Menubar", "NavigationMenu", "Pagination", "Popover",
];`,
    `<div className="${FRAME}">
  <Command>
    <CommandInput placeholder="Buscar componente..." />
    <CommandList>
      <CommandGroup heading="Componentes">
        {COMPONENTES.map((nome) => (
          <CommandItem key={nome} value={nome.toLowerCase()}>
            {nome}
          </CommandItem>
        ))}
      </CommandGroup>
    </CommandList>
    <CommandEmpty>${NO_RESULT}</CommandEmpty>
  </Command>
</div>`,
  );
}

/**
 * Traço numa lista SEM grupos nomeados: ele separa "o que se faz com o
 * arquivo" de "o que encerra a sessão" sem inventar um nome de grupo para cada
 * bloco. Cada bloco mora num grupo sem cabeçalho, e o traço fica entre os dois.
 */
export function commandWithSeparatorSource(): string {
  return jsxSnippet(
    importPieces(
      'Command',
      'CommandEmpty',
      'CommandGroup',
      'CommandInput',
      'CommandItem',
      'CommandList',
      'CommandSeparator',
    ),
    `<div className="${FRAME}">
  <Command>
    <CommandInput placeholder="Buscar comando..." />
    <CommandList>
      <CommandGroup>
        <CommandItem value="novo">Novo arquivo</CommandItem>
        <CommandItem value="abrir">Abrir recente</CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup>
        <CommandItem value="sair">Sair</CommandItem>
      </CommandGroup>
    </CommandList>
    <CommandEmpty>${NO_RESULT}</CommandEmpty>
  </Command>
</div>`,
  );
}

/**
 * Com atalho: o `CommandShortcut` mora DENTRO do comando, e sem `aria-hidden`.
 * Atalho escondido do leitor de tela é atalho que só quem enxerga descobre — o
 * nome acessível do comando passa a ser "Salvar Ctrl+S", que é a informação
 * útil. Comando sem atalho não leva o span vazio.
 */
export function commandWithShortcutsSource(): string {
  return jsxSnippet(
    importPieces(
      'Command',
      'CommandEmpty',
      'CommandGroup',
      'CommandInput',
      'CommandItem',
      'CommandList',
      'CommandSeparator',
      'CommandShortcut',
    ),
    `<div className="${FRAME}">
  <Command>
    <CommandInput placeholder="Buscar comando..." />
    <CommandList>
      <CommandGroup heading="Arquivo">
        <CommandItem value="novo">
          Novo arquivo <CommandShortcut>Ctrl+N</CommandShortcut>
        </CommandItem>
        <CommandItem value="abrir">
          Abrir <CommandShortcut>Ctrl+O</CommandShortcut>
        </CommandItem>
        <CommandItem value="salvar">
          Salvar <CommandShortcut>Ctrl+S</CommandShortcut>
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Aplicativo">
        <CommandItem value="preferencias">Preferências</CommandItem>
      </CommandGroup>
    </CommandList>
    <CommandEmpty>${NO_RESULT}</CommandEmpty>
  </Command>
</div>`,
  );
}

/**
 * Vários comandos desabilitados, espalhados pelos dois grupos: a seta percorre
 * só os habilitados, em sequência, e para no último — não volta ao primeiro.
 */
export function commandWithDisabledItemsSource(): string {
  return jsxSnippet(
    importPieces(
      'Command',
      'CommandEmpty',
      'CommandGroup',
      'CommandInput',
      'CommandItem',
      'CommandList',
      'CommandSeparator',
    ),
    `<div className="${FRAME}">
  <Command>
    <CommandInput placeholder="Buscar..." />
    <CommandList>
      <CommandGroup heading="Componentes">
        <CommandItem value="button">Button</CommandItem>
        <CommandItem value="input" disabled>Input</CommandItem>
        <CommandItem value="badge">Badge</CommandItem>
        <CommandItem value="select" disabled>Select</CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Utilitários">
        <CommandItem value="cn">cn()</CommandItem>
        <CommandItem value="clsx" disabled>clsx()</CommandItem>
      </CommandGroup>
    </CommandList>
    <CommandEmpty>${NO_RESULT}</CommandEmpty>
  </Command>
</div>`,
  );
}

/**
 * Command palette, dentro do CommandDialog.
 *
 * `title` e `description` não são enfeite: o `CommandDialog` os põe fora da
 * tela DENTRO do painel, e é deles que sai o nome do diálogo. A dica do atalho
 * mora DENTRO do gatilho, num `<kbd>`, e o nome do botão sai do texto visível —
 * `aria-label` diferente do que se lê viola a WCAG 2.5.3. O gatilho mora fora
 * do `CommandDialog`, então é ele que declara `aria-haspopup="dialog"` e o
 * `aria-expanded` que acompanha o estado. O atalho global não
 * pertence a componente nenhum: é um listener de janela, registrado por quem
 * consome, que só ABRE, e o cleanup impede que ele sobreviva à desmontagem.
 * Escolher um comando executa e fecha a paleta — fechar é do call site.
 */
export function commandPaletteSource(): string {
  return jsxSnippet(
    `${importPieces(
      'Command',
      'CommandDialog',
      'CommandEmpty',
      'CommandGroup',
      'CommandInput',
      'CommandItem',
      'CommandList',
      'CommandSeparator',
      'CommandShortcut',
    )}
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";`,
    `function PaletaDeComandos() {
  const [aberta, setAberta] = useState(false);

  useEffect(() => {
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key.toLowerCase() !== "k") return;
      if (!evento.metaKey && !evento.ctrlKey) return;
      // Sem isto o navegador leva o atalho para a barra de endereço.
      evento.preventDefault();
      setAberta(true);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, []);

  const executar = (valor: string) => {
    window.location.hash = valor;
    setAberta(false);
  };

  return (
    <>
      <Button
        variant="outline"
        aria-haspopup="dialog"
        aria-expanded={aberta}
        onClick={() => setAberta(true)}
      >
        Buscar
        <kbd className="nds-kbd">Ctrl+K</kbd>
      </Button>
      <CommandDialog
        open={aberta}
        onOpenChange={setAberta}
        title="Command Palette"
        description="Busque por um comando ou ação..."
      >
        <Command>
          <CommandInput placeholder="Buscar componente..." />
          <CommandList>
            <CommandGroup heading="Componentes">
              <CommandItem value="button" onSelect={executar}>
                Button <CommandShortcut>Ctrl+B</CommandShortcut>
              </CommandItem>
              <CommandItem value="input" onSelect={executar}>
                Input <CommandShortcut>Ctrl+I</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Utilitários">
              <CommandItem value="cn" onSelect={executar}>cn()</CommandItem>
            </CommandGroup>
          </CommandList>
          <CommandEmpty>${NO_RESULT}</CommandEmpty>
        </Command>
      </CommandDialog>
    </>
  );
}`,
  );
}
