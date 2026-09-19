<script lang="ts">
  import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuCheckboxItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSub,
    DropdownMenuSubTrigger,
    DropdownMenuSubContent,
    DropdownMenuGroup,
    DropdownMenuGroupHeading,
    createMenuCloseWatch,
    type MenuCloseReason,
  } from './index';
  import { Button } from '@/components/ui/button';

  type Side = 'top' | 'bottom' | 'left' | 'right';
  type Align = 'start' | 'center' | 'end';
  type Variant =
    | 'default'
    | 'destructive'
    | 'withLabel'
    | 'withCheckbox'
    | 'indeterminate'
    | 'withRadio'
    | 'withSubmenu'
    | 'withShortcuts'
    | 'itemDisabled';

  interface Props {
    side?: Side;
    align?: Align;
    sideOffset?: number;
    defaultOpen?: boolean;
    open?: boolean;
    triggerLabel?: string;
    variant?: Variant;
    /**
     * Botões vizinhos do gatilho, que dão DESTINO ao Tab que sai do menu.
     * `'both'` põe um antes e outro depois; `'before'` só o de antes — o gatilho
     * vira a ÚLTIMA parada da página, o caso em que a lib não fechava.
     */
    neighbors?: 'both' | 'before';
    /**
     * Espião da escolha de item, com o valor estável do item. É o que deixa a
     * play afirmar que um fechamento NÃO executou nada — o clique fora (F13).
     */
    onSelect?: (value: string) => void;
    /**
     * Espião do MOTIVO do fechamento, na palavra do design system.
     *
     * A lib não publica motivo — o `onOpenChange` avisa QUE o menu fechou,
     * nunca por quê —, então quem traduz gesto em palavra é o
     * `menu-close-reason.ts`, ao lado das peças e compartilhado pelos três
     * membros da família. É o mesmo caminho que a docs page usa para alimentar
     * o `reason` do `dropdown_menu_close`, e é por ele que a play afirma que o
     * clique fora sai `overlay` e a escolha de item sai `api` — as outras
     * quatro stacks já afirmavam isso no Playground, e só esta não.
     */
    onCloseReason?: (reason: MenuCloseReason) => void;
  }
  // `defaultOpen` não existe no bits-ui nem no vaul-svelte: a prop era
  // passada, ignorada, e o overlay nunca abria. A API real é `open`
  // (bindable). Inicializar `open` com `defaultOpen` cobre os dois usos e
  // apaga o ramo duplicado que existia só para o caso não controlado.

  let {
    side = 'bottom',
    align = 'start',
    sideOffset = 4,
    defaultOpen = false,
    open = $bindable(defaultOpen),
    triggerLabel = 'Mais ações',
    variant = 'default',
    neighbors = undefined,
    onSelect = () => {},
    onCloseReason = undefined,
  }: Props = $props();

  // O observador do gesto: o painel anota Escape, clique fora e Tab; o gatilho
  // anota o clique com o menu JÁ ABERTO. Quem lê a palavra é o `onOpenChange`
  // abaixo, uma vez por fechamento.
  const closeWatch = createMenuCloseWatch({
    subContentSelector: '[data-slot="dropdown-menu-sub-content"]',
    isOpen: () => open,
  });

  function handleOpenChange(next: boolean) {
    if (next) {
      closeWatch.reset();
      return;
    }
    onCloseReason?.(closeWatch.takeReason());
  }

  /** A escolha de um item de AÇÃO é a decisão que fecha o menu — motivo `api`. */
  function chooseItem(value: string) {
    return () => {
      closeWatch.markItemPress();
      onSelect(value);
    };
  }

  // states for interactive variants
  let showName = $state(true);
  let showEmail = $state(false);
  let showRole = $state(false);
  let appearance = $state('light');
</script>

<div class={neighbors ? 'nds-cluster' : undefined} data-spacing={neighbors ? 'md' : undefined} style="contain: layout">
  {#if neighbors}<Button variant="ghost">Antes</Button>{/if}
  {#key `${side}-${align}-${defaultOpen}-${variant}`}
      <!--
        Sem `modal`: a prop não existe na API deste primitivo — era passada,
        aceita e ignorada em silêncio, e o control do Storybook não mudava nada.
        Divergência de API de framework não se alinha: fica registrada aqui, e o
        control saiu junto, porque control morto é pior que control ausente.
      -->
      <DropdownMenu bind:open onOpenChange={handleOpenChange}>
        <DropdownMenuTrigger {...closeWatch.trigger}>
          {#snippet child({ props })}
            <Button variant="outline" {...props}>{triggerLabel}</Button>
          {/snippet}
        </DropdownMenuTrigger>
        <DropdownMenuContent {side} {align} {sideOffset} {...closeWatch.content}>
          {#if variant === 'destructive'}
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive">Excluir conta</DropdownMenuItem>
          {:else if variant === 'withLabel'}
            <!--
              `Group` + `Label` é a dupla que dá NOME ao agrupamento: dentro de
              um grupo o rótulo VIRA o cabeçalho da lib, e o `id` dele entra no
              `aria-labelledby` do grupo — sem isso o leitor de tela anuncia
              "grupo" sem dizer de qual bloco se trata. Fora de um grupo o mesmo
              `Label` rotula visualmente e não nomeia nada.

              O SEGUNDO grupo usa `GroupHeading`, o nome da lib que esta stack
              também publica: ele delega ao `Label`, e a play conta DOIS rótulos
              com o mesmo `data-slot` — é o que prova que as duas peças não
              divergem. Mesma forma do ContextMenu desta stack.
            -->
            <DropdownMenuGroup>
              <DropdownMenuLabel>Conta</DropdownMenuLabel>
              <DropdownMenuItem>Perfil</DropdownMenuItem>
              <DropdownMenuItem>Configurações</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuGroupHeading>Suporte</DropdownMenuGroupHeading>
              <DropdownMenuItem>Documentação</DropdownMenuItem>
              <!--
                "Sair" sem `variant`: nas outras quatro stacks ela é um item
                comum aqui. Sair não apaga nada — marcar de vermelho o que só
                encerra a sessão gasta a cor que a seção Destructive reserva
                para o irreversível.
              -->
              <DropdownMenuItem>Sair</DropdownMenuItem>
            </DropdownMenuGroup>
          {:else if variant === 'withCheckbox'}
            <!--
              Mesmos itens das outras quatro stacks: colunas de uma tabela, não
              barras de um editor. "Status bar / Activity bar" era exemplo que
              não aparecia em stack nenhuma, e ainda vinha em inglês numa docs
              page em português.
            -->
            <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              checked={showName}
              onCheckedChange={(v) => (showName = v)}
            >
              Nome
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showEmail}
              onCheckedChange={(v) => (showEmail = v)}
            >
              E-mail
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={showRole}
              onCheckedChange={(v) => (showRole = v)}
            >
              Função
            </DropdownMenuCheckboxItem>
          {:else if variant === 'indeterminate'}
            <DropdownMenuLabel>Colunas visíveis</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <!--
              Os três estados lado a lado: sem o vizinho marcado a asserção do
              traço não teria com o que comparar o tique.
            -->
            <DropdownMenuCheckboxItem indeterminate>Nome</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem checked>E-mail</DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem>Telefone</DropdownMenuCheckboxItem>
          {:else if variant === 'withRadio'}
            <!-- Mesma escolha das outras quatro stacks: aparência, não posição. -->
            <DropdownMenuLabel>Aparência</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup bind:value={appearance}>
              <DropdownMenuRadioItem value="light">Claro</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="dark">Escuro</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="system">Sistema</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          {:else if variant === 'withSubmenu'}
            <!--
              Mesmo menu das outras quatro stacks. O assunto da composição é o
              segundo nível: o separador e o item destrutivo que vinham depois
              dele eram a lição da variante Destructive dentro desta, e o
              terceiro formato do submenu só alongava a lista.
            -->
            <DropdownMenuItem>Renomear</DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>PDF</DropdownMenuItem>
                <DropdownMenuItem>CSV</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          {:else if variant === 'withShortcuts'}
            <!--
              Mesmos itens e mesmos atalhos das outras quatro stacks. Antes eram
              Salvar/Duplicar/Excluir com Ctrl+S, Ctrl+D e Delete — exemplo que não aparecia
              em stack nenhuma, nem na docs page desta.
            -->
            <DropdownMenuItem>
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
            </DropdownMenuItem>
          {:else if variant === 'itemDisabled'}
            <DropdownMenuItem>Editar</DropdownMenuItem>
            <DropdownMenuItem disabled>Arquivar (indisponível)</DropdownMenuItem>
            <DropdownMenuItem>Duplicar</DropdownMenuItem>
          {:else}
            <DropdownMenuGroup>
              <DropdownMenuItem onSelect={chooseItem('profile')}>Perfil</DropdownMenuItem>
              <DropdownMenuItem onSelect={chooseItem('settings')}>Configurações</DropdownMenuItem>
              <DropdownMenuItem onSelect={chooseItem('team')}>Equipe</DropdownMenuItem>
            </DropdownMenuGroup>
          {/if}
        </DropdownMenuContent>
      </DropdownMenu>
  {/key}
  {#if neighbors === 'both'}<Button variant="ghost">Depois</Button>{/if}
</div>
