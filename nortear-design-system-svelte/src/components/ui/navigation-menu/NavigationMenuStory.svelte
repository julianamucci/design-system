<script lang="ts">
  import {
    NavigationMenuRoot,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink,
    NavigationMenuChild,
    NavigationMenuIndicator,
  } from './index';

  type Orientation = 'horizontal' | 'vertical';
  type Demonstration =
    | 'default'
    | 'bar'
    | 'simpleLink'
    | 'withDropdown'
    | 'megaMenuGrid'
    | 'withFeatured';

  interface Props {
    defaultValue?: string;
    /** Estado controlado; inicia com `defaultValue`. */
    value?: string;
    delayDuration?: number;
    orientation?: Orientation;
    ariaLabel?: string;
    demonstration?: Demonstration;
    /** Marca o destino da página atual. */
    activeHref?: string;
    /** Seta apontando para o gatilho ativo. */
    indicator?: boolean;
  }

  let {
    defaultValue = undefined,
    // `defaultValue` nao existe no bits-ui: a prop era ignorada e o painel
    // nunca abria. A API e `value` (bindable) — mesma familia do defaultOpen.
    //
    // O `?? ''` é o "nenhum menu aberto" escrito por extenso: agora que a raiz
    // declara `value` como vinculável com valor de partida, mandar `undefined`
    // para dentro de um `bind:` é erro de runtime do Svelte, e não silêncio.
    value = $bindable(defaultValue ?? ''),
    delayDuration = 100,
    orientation = 'horizontal',
    ariaLabel = 'Navegação principal',
    demonstration = 'default',
    activeHref = undefined,
    indicator = false,
  }: Props = $props();

  /**
   * Impede a navegação de verdade, como um roteador de cliente faria.
   *
   * Sem isto o clique tira a própria PÁGINA DE TESTE do ar — a conexão do
   * runner com o navegador morre e a story inteira some do resultado, sem
   * asserção nenhuma falhando.
   */
  function aoNavegar(event: MouseEvent): void {
    event.preventDefault();
  }
</script>

<div style="contain: layout">
  {#key `${defaultValue}-${delayDuration}-${orientation}-${ariaLabel}-${demonstration}-${activeHref}-${indicator}`}
    <NavigationMenuRoot
      bind:value
      {delayDuration}
      {orientation}
      aria-label={ariaLabel}
    >
      <NavigationMenuList
        class={orientation === 'vertical' ? 'nds-stack nds-w-sm' : undefined}
        data-spacing={orientation === 'vertical' ? 'xs' : undefined}
      >
        {#if demonstration === 'simpleLink'}
          <NavigationMenuItem value="inicio">
            <NavigationMenuLink
              href="#inicio"
              active={activeHref === '#inicio'}
              onclick={aoNavegar}
            >
              Início
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="precos">
            <NavigationMenuLink href="#precos" onclick={aoNavegar}>Preços</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="contato">
            <NavigationMenuLink href="#contato" onclick={aoNavegar}>Contato</NavigationMenuLink>
          </NavigationMenuItem>
        {:else if demonstration === 'withDropdown'}
          <NavigationMenuItem value="inicio">
            <NavigationMenuLink href="#inicio">Início</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="planos">
            <NavigationMenuTrigger>Planos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <NavigationMenuChild href="#inicial" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Plano Inicial</div>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#profissional" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Plano Profissional</div>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#empresarial" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Plano Empresarial</div>
                  </NavigationMenuChild>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="contato">
            <NavigationMenuLink href="#contato">Contato</NavigationMenuLink>
          </NavigationMenuItem>
        {:else if demonstration === 'megaMenuGrid'}
          <NavigationMenuItem value="inicio">
            <NavigationMenuLink href="#inicio" onclick={aoNavegar}>Início</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="solucoes">
            <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="nds-grid nds-list-none nds-w-lg" data-fixed data-cols="2" data-spacing="sm">
                <li>
                  <NavigationMenuChild href="#marketing" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Para Marketing</div>
                    <p class="nds-navigation-menu-child-description">
                      Campanhas, automação e atribuição num lugar só.
                    </p>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#vendas" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Para Vendas</div>
                    <p class="nds-navigation-menu-child-description">
                      Funil, previsão e histórico de cada negociação.
                    </p>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#suporte" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Para Suporte</div>
                    <p class="nds-navigation-menu-child-description">
                      Fila de atendimento, base de conhecimento e métricas.
                    </p>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#financeiro" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Para Financeiro</div>
                    <p class="nds-navigation-menu-child-description">
                      Cobrança recorrente, conciliação e relatórios fiscais.
                    </p>
                  </NavigationMenuChild>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        {:else if demonstration === 'withFeatured'}
          <NavigationMenuItem value="inicio">
            <NavigationMenuLink href="#inicio" onclick={aoNavegar}>Início</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="recursos">
            <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <div class="nds-grid nds-w-lg" data-fixed data-cols="2" data-spacing="sm">
                <NavigationMenuChild href="#comece" class="nds-h-full" onclick={aoNavegar}>
                  <div class="nds-navigation-menu-child-label">Comece agora</div>
                  <p class="nds-navigation-menu-child-description">
                    Publique o primeiro projeto em menos de cinco minutos.
                  </p>
                </NavigationMenuChild>

                <ul class="nds-stack nds-list-none" data-spacing="xs">
                  <li>
                    <NavigationMenuChild href="#guias" onclick={aoNavegar}>
                      <div class="nds-navigation-menu-child-label">Guias</div>
                    </NavigationMenuChild>
                  </li>
                  <li>
                    <NavigationMenuChild href="#api" onclick={aoNavegar}>
                      <div class="nds-navigation-menu-child-label">Referência da API</div>
                    </NavigationMenuChild>
                  </li>
                  <li>
                    <NavigationMenuChild href="#changelog" onclick={aoNavegar}>
                      <div class="nds-navigation-menu-child-label">Novidades</div>
                    </NavigationMenuChild>
                  </li>
                </ul>
              </div>
            </NavigationMenuContent>
          </NavigationMenuItem>
        {:else if demonstration === 'bar'}
          <!-- Cinco itens, dois deles com painel: a barra completa de um site. -->
          <NavigationMenuItem value="inicio">
            <NavigationMenuLink href="#inicio" onclick={aoNavegar}>Início</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="produtos">
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <NavigationMenuChild href="#inicial" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Plano Inicial</div>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#profissional" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Plano Profissional</div>
                  </NavigationMenuChild>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="recursos">
            <NavigationMenuTrigger>Recursos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <NavigationMenuChild href="#guias" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Guias</div>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#api" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Referência da API</div>
                  </NavigationMenuChild>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="precos">
            <NavigationMenuLink href="#precos" onclick={aoNavegar}>Preços</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="sobre">
            <NavigationMenuLink href="#sobre" onclick={aoNavegar}>Sobre</NavigationMenuLink>
          </NavigationMenuItem>
        {:else}
          <!-- default: dois destinos diretos e dois painéis -->
          <NavigationMenuItem value="inicio">
            <NavigationMenuLink
              href="#inicio"
              active={activeHref === '#inicio'}
              onclick={aoNavegar}
            >
              Início
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="produtos">
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <NavigationMenuChild href="#inicial" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Plano Inicial</div>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#profissional" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Plano Profissional</div>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#empresarial" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Plano Empresarial</div>
                  </NavigationMenuChild>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="solucoes">
            <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
                <li>
                  <NavigationMenuChild href="#marketing" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Para Marketing</div>
                  </NavigationMenuChild>
                </li>
                <li>
                  <NavigationMenuChild href="#vendas" onclick={aoNavegar}>
                    <div class="nds-navigation-menu-child-label">Para Vendas</div>
                  </NavigationMenuChild>
                </li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="sobre">
            <NavigationMenuLink
              href="#sobre"
              active={activeHref === '#sobre'}
              onclick={aoNavegar}
            >
              Sobre
            </NavigationMenuLink>
          </NavigationMenuItem>
        {/if}

        {#if indicator}
          <NavigationMenuIndicator />
        {/if}
      </NavigationMenuList>
    </NavigationMenuRoot>
  {/key}
</div>
