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

const IMPORT_PALETTE = `import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { LayoutIcon, MinusIcon, TypeIcon } from "lucide-react";`;

/**
 * A moldura da paleta solta.
 *
 * `.nds-command` só pinta fundo e raio — largura, borda e sombra são de quem
 * posiciona a paleta na página. Dentro de um Popover ou de um CommandDialog o
 * painel já traz as três, e por isso a moldura some das duas composições.
 */
const FRAME = 'nds-w-sm nds-border-default nds-rounded-md nds-shadow-md';

/**
 * O que o comando faz é decisão do call site: a paleta só entrega o `value` do
 * comando escolhido, por clique ou por Enter.
 */
const ON_CHOOSE = `function aoEscolher(valor: string) {
  window.location.hash = valor;
}`;

/**
 * Transform do `meta` — vale para todas as stories do arquivo.
 *
 * Ensina o arranjo canônico: campo de busca, lista, mensagem de vazio DENTRO da
 * lista (é o lugar dela: fora, sobra uma área em branco onde a lista estava) e
 * dois grupos separados por divisor. `loop` e `shouldFilter` só aparecem quando
 * diferem do padrão do componente.
 */
export const commandSource: SourceTransform<CommandArgs> = (_gerado, ctx) => {
  const args = ctx?.args ?? {};
  const props = attrs(
    propBool('loop', args.loop, false),
    propBool('shouldFilter', args.shouldFilter, true),
  );

  return jsxSnippet(
    `${IMPORT_PALETTE}

${ON_CHOOSE}`,
    `<div className="${FRAME}">
  <Command${props}>
    <CommandInput placeholder="Buscar componente..." />
    <CommandList>
      <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
      <CommandGroup heading="Componentes">
        <CommandItem value="button" onSelect={aoEscolher}>
          <LayoutIcon />
          Button
        </CommandItem>
        <CommandItem value="input" onSelect={aoEscolher}>
          <TypeIcon />
          Input
        </CommandItem>
        <CommandItem value="separator" onSelect={aoEscolher}>
          <MinusIcon />
          Separator
        </CommandItem>
      </CommandGroup>
      <CommandSeparator />
      <CommandGroup heading="Utilitários">
        <CommandItem value="cn" onSelect={aoEscolher}>cn()</CommandItem>
        <CommandItem value="clsx" onSelect={aoEscolher}>clsx()</CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
</div>`,
  );
};

/**
 * Com atalho: o `CommandShortcut` mora DENTRO do comando, e sem `aria-hidden`.
 * Atalho escondido do leitor de tela é atalho que só quem enxerga descobre — o
 * nome acessível do comando passa a ser "Button ⌘B", que é a informação útil.
 */
export function commandWithShortcutsSource(): string {
  return jsxSnippet(
    `import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandShortcut,
} from "@/components/ui/command";
import { LayoutIcon, TypeIcon } from "lucide-react";`,
    `<div className="${FRAME}">
  <Command>
    <CommandInput placeholder="Buscar componente..." />
    <CommandList>
      <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
      <CommandGroup heading="Componentes">
        <CommandItem value="button">
          <LayoutIcon />
          Button <CommandShortcut>⌘B</CommandShortcut>
        </CommandItem>
        <CommandItem value="input">
          <TypeIcon />
          Input <CommandShortcut>⌘I</CommandShortcut>
        </CommandItem>
      </CommandGroup>
    </CommandList>
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
    `import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";`,
    `<div className="${FRAME}">
  <Command>
    <CommandInput placeholder="Buscar comando..." />
    <CommandList>
      <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
      <CommandGroup heading="Arquivo">
        <CommandItem value="novo">Novo</CommandItem>
        <CommandItem value="arquivar" disabled>Arquivar</CommandItem>
        <CommandItem value="renomear">Renomear</CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
</div>`,
  );
}

/**
 * Comando marcado: `checked` publica a escolha em `data-checked`, que é o
 * gancho da marca na folha compartilhada.
 *
 * Sem valor nenhum o atributo não é emitido — comando que não representa
 * escolha não declara estado de escolha, nem `false`. E marca e atalho disputam
 * a mesma borda: a folha esconde a marca quando há atalho, então a regra é
 * escolher um dos dois por comando.
 */
export function commandItemCheckedSource(): string {
  return jsxSnippet(
    `import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";`,
    `<div className="${FRAME}">
  <Command>
    <CommandInput placeholder="Buscar tema..." />
    <CommandList>
      <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
      <CommandGroup heading="Aparência">
        <CommandItem value="claro" checked>Claro</CommandItem>
        <CommandItem value="escuro" checked={false}>Escuro</CommandItem>
        <CommandItem value="sistema" checked={false}>Sistema</CommandItem>
      </CommandGroup>
    </CommandList>
  </Command>
</div>`,
  );
}

/**
 * Command palette, dentro do CommandDialog.
 *
 * `title` e `description` não são enfeite: o `CommandDialog` os põe fora da
 * tela DENTRO do painel, e é deles que sai o nome do diálogo. O atalho global
 * não pertence a componente nenhum — é um listener de janela, registrado por
 * quem consome, e o cleanup impede que ele sobreviva à desmontagem abrindo uma
 * paleta que já saiu da tela.
 */
export function commandPaletteSource(): string {
  return jsxSnippet(
    `import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { LayoutIcon, MinusIcon, SearchIcon, TypeIcon } from "lucide-react";`,
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

  return (
    <div className="nds-stack" data-spacing="md">
      <div
        className="nds-cluster nds-text-body nds-text-muted-foreground"
        data-align="center"
        data-spacing="sm"
      >
        <span>Pressione</span>
        <kbd className="nds-kbd">⌘K</kbd>
      </div>
      <Button
        variant="outline"
        onClick={() => setAberta(true)}
        aria-label="Abrir command palette"
      >
        <SearchIcon />
        Buscar
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
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup heading="Componentes">
              <CommandItem value="button" onSelect={() => setAberta(false)}>
                <LayoutIcon />
                Button <CommandShortcut>⌘B</CommandShortcut>
              </CommandItem>
              <CommandItem value="input" onSelect={() => setAberta(false)}>
                <TypeIcon />
                Input <CommandShortcut>⌘I</CommandShortcut>
              </CommandItem>
            </CommandGroup>
            <CommandSeparator />
            <CommandGroup heading="Utilitários">
              <CommandItem value="separator" onSelect={() => setAberta(false)}>
                <MinusIcon />
                Separator
              </CommandItem>
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </div>
  );
}`,
  );
}
