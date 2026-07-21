<script lang="ts">
  import {
    NavigationMenuRoot,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink,
  } from './index';

  type Orientation = 'horizontal' | 'vertical';
  type Demonstration =
    | 'default'
    | 'simpleLink'
    | 'withDropdown'
    | 'megaMenuGrid'
    | 'withFeatured';

  interface Props {
    defaultValue?: string;
    delayDuration?: number;
    orientation?: Orientation;
    ariaLabel?: string;
    demonstration?: Demonstration;
    activeHref?: string;
  }

  let {
    defaultValue = undefined,
    delayDuration = 80,
    orientation = 'horizontal',
    ariaLabel = 'Navegação principal',
    demonstration = 'default',
    activeHref = undefined,
  }: Props = $props();
</script>

<div style="contain: layout">
  {#key `${defaultValue}-${delayDuration}-${orientation}-${ariaLabel}-${demonstration}-${activeHref}`}
    <NavigationMenuRoot
      {defaultValue}
      {delayDuration}
      {orientation}
      aria-label={ariaLabel}
    >
      <NavigationMenuList>
        {#if demonstration === 'simpleLink'}
          <NavigationMenuItem value="home">
            <NavigationMenuLink
              href="/"
              aria-current={activeHref === '/' ? 'page' : undefined}
            >
              Início
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="about">
            <NavigationMenuLink
              href="/sobre"
              aria-current={activeHref === '/sobre' ? 'page' : undefined}
            >
              Sobre
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="contact">
            <NavigationMenuLink
              href="/contato"
              aria-current={activeHref === '/contato' ? 'page' : undefined}
            >
              Contato
            </NavigationMenuLink>
          </NavigationMenuItem>
        {:else if demonstration === 'withDropdown'}
          <NavigationMenuItem value="home">
            <NavigationMenuLink href="/">Início</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="produtos">
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="nds-grid nds-p-2" data-spacing="xs" style="width: 280px">
                <li><NavigationMenuLink href="/produtos/a">Produto A</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/produtos/b">Produto B</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/produtos/c">Produto C</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/produtos/d">Produto D</NavigationMenuLink></li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        {:else if demonstration === 'megaMenuGrid'}
          <NavigationMenuItem value="solucoes">
            <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="nds-grid" data-spacing="sm" data-cols="2" style="width: 480px; padding: 0.75rem">
                <li><NavigationMenuLink href="/solucoes/startups">Startups</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/solucoes/empresas">Empresas</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/solucoes/agencias">Agências</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/solucoes/educacao">Educação</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/solucoes/saude">Saúde</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/solucoes/governo">Governo</NavigationMenuLink></li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        {:else if demonstration === 'withFeatured'}
          <NavigationMenuItem value="produtos">
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="nds-grid grid-cols-[.9fr_1fr]" data-spacing="sm" style="width: 520px; padding: 0.75rem">
                <li class="row-span-3">
                  <NavigationMenuLink
                    href="/produtos/destaque"
                    class="nds-stack from-muted/40 to-muted nds-w-full nds-rounded-md bg-gradient-to-b nds-p-4 no-underline outline-none focus:shadow-md" data-justify="end" style="height: 100%"
                  >
                    <div class="mt-3 nds-mb-1 nds-text-base nds-font-medium">Plano Empresarial</div>
                    <p class="nds-text-muted-foreground nds-text-caption">
                      Solução completa com SLA dedicado e suporte premium.
                    </p>
                  </NavigationMenuLink>
                </li>
                <li><NavigationMenuLink href="/produtos/a">Produto A</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/produtos/b">Produto B</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/produtos/c">Produto C</NavigationMenuLink></li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
        {:else}
          <!-- default: 4 items mistos -->
          <NavigationMenuItem value="home">
            <NavigationMenuLink
              href="/"
              aria-current={activeHref === '/' ? 'page' : undefined}
            >
              Início
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem value="produtos">
            <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="nds-grid nds-p-2" data-spacing="xs" style="width: 280px">
                <li><NavigationMenuLink href="/produtos/a">Produto A</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/produtos/b">Produto B</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/produtos/c">Produto C</NavigationMenuLink></li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="solucoes">
            <NavigationMenuTrigger>Soluções</NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul class="nds-grid" data-spacing="sm" data-cols="2" style="width: 440px; padding: 0.75rem">
                <li><NavigationMenuLink href="/solucoes/startups">Startups</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/solucoes/empresas">Empresas</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/solucoes/agencias">Agências</NavigationMenuLink></li>
                <li><NavigationMenuLink href="/solucoes/educacao">Educação</NavigationMenuLink></li>
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem value="sobre">
            <NavigationMenuLink
              href="/sobre"
              aria-current={activeHref === '/sobre' ? 'page' : undefined}
            >
              Sobre
            </NavigationMenuLink>
          </NavigationMenuItem>
        {/if}
      </NavigationMenuList>
    </NavigationMenuRoot>
  {/key}
</div>
