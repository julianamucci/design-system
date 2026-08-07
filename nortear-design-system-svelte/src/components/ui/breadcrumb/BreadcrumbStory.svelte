<script lang="ts">
  import {
    Breadcrumb,
    BreadcrumbList,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbPage,
    BreadcrumbSeparator,
    BreadcrumbEllipsis,
  } from './index';
  import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
  } from '@/components/ui/dropdown-menu';
  import Slash from '@lucide/svelte/icons/slash';

  type Variant = 'default' | 'simple' | 'withEllipsis' | 'customSeparator' | 'responsive' | 'asChildLink';

  interface Props {
    variant?: Variant;
    /** Reportado no clique dos links — o espião mora na story, não aqui. */
    onNavigate?: (payload: { event: string; label: string }) => void;
  }

  let { variant = 'default', onNavigate }: Props = $props();

  const navegar = (label: string) => (e: MouseEvent) => {
    e.preventDefault();
    onNavigate?.({ event: 'navigation_click', label });
  };
</script>

{#if variant === 'default'}
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="#" onclick={navegar('Início')}>Início</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="#" onclick={navegar('Componentes')}>Componentes</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
{:else if variant === 'simple'}
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="#" onclick={navegar('Início')}>Início</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Componentes</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
{:else if variant === 'withEllipsis'}
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Início</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbEllipsis label="Mais páginas" />
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Componentes</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
{:else if variant === 'customSeparator'}
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Início</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator><Slash data-icon="slash" /></BreadcrumbSeparator>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Componentes</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator><Slash data-icon="slash" /></BreadcrumbSeparator>
      <BreadcrumbItem>
        <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
{:else if variant === 'asChildLink'}
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">
          {#snippet child({ props })}
            <a {...props} data-router-link="true">Início</a>
          {/snippet}
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbLink href="#">
          {#snippet child({ props })}
            <a {...props} data-router-link="true">Componentes</a>
          {/snippet}
        </BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
{:else if variant === 'responsive'}
  <Breadcrumb>
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink href="#">Início</BreadcrumbLink>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <DropdownMenu>
          <DropdownMenuTrigger class="nds-cluster" data-spacing="xs" aria-label="Expandir níveis ocultos">
            <!-- Sem rótulo aqui: quem nomeia é o gatilho, e dois nomes no mesmo
                 controle viram leitura duplicada. -->
            <BreadcrumbEllipsis />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem>Documentação</DropdownMenuItem>
            <DropdownMenuItem>Guia</DropdownMenuItem>
            <DropdownMenuItem>Componentes</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </BreadcrumbItem>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>Breadcrumb</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
{/if}
