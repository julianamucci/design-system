import { describe, expect, it } from 'vitest';
import {
  sidebarSearchSource,
  sidebarLoadingSource,
  sidebarExpandidaSource,
  sidebarFixaSource,
  sidebarGavetaMovelSource,
  sidebarGroupsSource,
  sidebarSideDireitoSource,
  sidebarPlaygroundSource,
  sidebarRecolhidaIconSource,
  sidebarSubmenuSource,
  sidebarVariantFloatingSource,
  sidebarVariantInsetSource,
  sidebarVariantSidebarSource,
} from './sidebar.source';

/** Todas as transforms deste componente, para as regras que valem para o conjunto. */
const ALL = [
  sidebarPlaygroundSource,
  sidebarVariantSidebarSource,
  sidebarVariantFloatingSource,
  sidebarVariantInsetSource,
  sidebarSideDireitoSource,
  sidebarExpandidaSource,
  sidebarRecolhidaIconSource,
  sidebarFixaSource,
  sidebarLoadingSource,
  sidebarGavetaMovelSource,
  sidebarGroupsSource,
  sidebarSubmenuSource,
  sidebarSearchSource,
];

describe('sidebarPlaygroundSource', () => {
  it('sem args, entrega a página canônica', () => {
    expect(sidebarPlaygroundSource()).toBe(
      `<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Blocks, LayoutDashboard, Palette, Settings, User } from 'lucide-vue-next'
</script>

<template>
  <SidebarProvider>
    <nav aria-label="Navegação principal">
      <Sidebar>
        <SidebarHeader class="nds-p-4 nds-font-semibold nds-text-muted-foreground">Design System</SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Aplicação</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton is-active tooltip="Dashboard" aria-current="page">
                    <LayoutDashboard aria-hidden="true" />
                    <span>Dashboard</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Componentes">
                    <Blocks aria-hidden="true" />
                    <span>Componentes</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Tokens">
                    <Palette aria-hidden="true" />
                    <span>Tokens</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarSeparator />
          <SidebarGroup>
            <SidebarGroupLabel>Conta</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Configurações">
                    <Settings aria-hidden="true" />
                    <span>Configurações</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton tooltip="Perfil">
                    <User aria-hidden="true" />
                    <span>Perfil</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarRail />
      </Sidebar>
    </nav>
    <SidebarInset>
      <header class="nds-cluster nds-px-4 nds-py-2 nds-border-b" data-align="center" data-spacing="sm">
        <SidebarTrigger />
        <span class="nds-text-body nds-text-muted-foreground">Conteúdo principal</span>
      </header>
      <main id="main-content" class="nds-p-4">
        <p class="nds-text-body">Conteúdo da página, adjacente à barra.</p>
      </main>
    </SidebarInset>
  </SidebarProvider>
</template>`,
    );
  });

  it('os controls de desenho moram na BARRA', () => {
    const output = sidebarPlaygroundSource('', {
      args: { side: 'right', variant: 'floating', collapsible: 'icon' },
    });
    expect(output).toContain('<Sidebar side="right" variant="floating" collapsible="icon">');
    // O provider guarda o estado; ele não sabe de lado, variante nem recolhimento.
    expect(output).toContain('<SidebarProvider>');
  });

  it('o ponto de virada mora no PROVIDER', () => {
    const output = sidebarPlaygroundSource('', { args: { mobileQuery: '(max-width: 1024px)' } });
    expect(output).toContain('<SidebarProvider mobile-query="(max-width: 1024px)">');
    expect(output).toContain('<Sidebar>');
  });

  it('não escreve os padrões — repetir valor padrão ensina ruído', () => {
    const output = sidebarPlaygroundSource('', {
      args: {
        side: 'left',
        variant: 'sidebar',
        collapsible: 'offcanvas',
        mobileQuery: '(max-width: 767px)',
      },
    });
    expect(output).toContain('<Sidebar>');
    expect(output).not.toContain('side=');
    expect(output).not.toContain('variant=');
    expect(output).not.toContain('collapsible=');
    expect(output).not.toContain('mobile-query');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = sidebarPlaygroundSource('', {
      args: { variant: (() => {}) as never, mobileQuery: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).not.toContain('variant=');
    expect(output).not.toContain('mobile-query');
  });
});

describe('a divisão de props entre provider e barra', () => {
  // Prop desconhecida não dá erro em Vue: ela cai na queda de atributos e vira
  // atributo solto no elemento. Escrever `default-open` na barra abriria a barra
  // do mesmo jeito — pelo padrão do provider — e ninguém veria o engano.
  const abreProvider = /<SidebarProvider(?:\s[^>]*)?>/;
  const abreBar = /<Sidebar(?:\s[^>]*)?>/;

  it('default-open, open e mobile-query só aparecem no provider', () => {
    for (const fn of ALL) {
      const barra = fn().match(abreBar)?.[0] ?? '';
      expect(barra).not.toContain('default-open');
      expect(barra).not.toContain(':open');
      expect(barra).not.toContain('mobile-query');
    }
  });

  it('side, variant e collapsible só aparecem na barra', () => {
    for (const fn of ALL) {
      const provider = fn().match(abreProvider)?.[0] ?? '';
      expect(provider).not.toContain('side=');
      expect(provider).not.toContain('variant=');
      expect(provider).not.toContain('collapsible=');
    }
  });

  it('a barra mora dentro de um marco de navegação nomeado', () => {
    for (const fn of ALL) {
      expect(fn()).toContain('<nav aria-label="Navegação principal">');
    }
  });
});

describe('transforms das stories de variante', () => {
  it('a padrão não escreve a variante; as outras duas escrevem a sua', () => {
    expect(sidebarVariantSidebarSource()).not.toContain('variant=');
    expect(sidebarVariantFloatingSource()).toContain('<Sidebar variant="floating">');
    expect(sidebarVariantInsetSource()).toContain('<Sidebar variant="inset">');
  });

  it('à direita, o conteúdo vem antes da navegação', () => {
    const output = sidebarSideDireitoSource();
    expect(output).toContain('<Sidebar side="right">');
    // A ordem é o segundo assunto da story: `side` posiciona na tela, mas quem
    // decide a ordem de leitura e de tabulação é a ordem no documento.
    expect(output.indexOf('<SidebarInset>')).toBeLessThan(output.indexOf('<nav '));
  });
});

describe('transforms das stories de estado', () => {
  it('expandida liga default-open no provider', () => {
    expect(sidebarExpandidaSource()).toContain('<SidebarProvider default-open>');
  });

  it('o modo ícone é um par: prop na barra e estado inicial no provider', () => {
    const output = sidebarRecolhidaIconSource();
    expect(output).toContain('<SidebarProvider :default-open="false">');
    expect(output).toContain('<Sidebar collapsible="icon">');
    // Sem rótulo visível, o balão é o nome que sobra para quem usa ponteiro.
    expect(output).toContain('tooltip="Dashboard"');
    expect(output).toContain('<span class="nds-sidebar-hide-collapsed">Design System</span>');
  });

  it('fixa tira o recolhimento e, com ele, o gatilho, a faixa e o balão', () => {
    const output = sidebarFixaSource();
    expect(output).toContain('<Sidebar collapsible="none">');
    expect(output).not.toContain('SidebarTrigger');
    expect(output).not.toContain('SidebarRail');
    expect(output).not.toContain('tooltip=');
  });

  it('carregando troca o item de menu pelo placeholder', () => {
    const output = sidebarLoadingSource();
    expect(output).toContain('<SidebarMenuItem v-for="i in 5" :key="i">');
    expect(output).toContain('<SidebarMenuSkeleton show-icon />');
    expect(output).not.toContain('SidebarMenuButton');
  });

  it('a gaveta vem de uma consulta sempre verdadeira no provider', () => {
    const output = sidebarGavetaMovelSource();
    expect(output).toContain('<SidebarProvider mobile-query="(min-width: 0px)">');
    // Quem abre a gaveta é o gatilho; a faixa é da coluna e não existe aqui.
    expect(output).toContain('<SidebarTrigger />');
    expect(output).not.toContain('SidebarRail');
    // A marca de classe que a story usa para medir é andaime do teste.
    expect(output).not.toContain('story-sidebar-marca');
  });
});

describe('transforms das stories de composição', () => {
  it('o contador fica FORA do botão, e a ação leva nome próprio', () => {
    const output = sidebarGroupsSource();
    expect(output).toContain('</SidebarMenuButton>\n                  <SidebarMenuBadge>3</SidebarMenuBadge>');
    expect(output).toContain('<SidebarGroupAction title="Adicionar item">');
    expect(output).toContain('<span class="nds-sr-only">Adicionar item</span>');
    expect(output).toContain('<span class="nds-sr-only">Mais opções</span>');
    expect(output).toContain('<SidebarSeparator />');
  });

  it('o submenu é lista aninhada dentro do item pai, e o pai se declara aberto', () => {
    const output = sidebarSubmenuSource();
    expect(output).toContain('<SidebarMenuButton tooltip="Componentes" aria-expanded="true">');
    expect(output).toContain('<ChevronRight class="nds-spacer-start nds-chevron" aria-hidden="true" />');
    // A sub-lista é irmã do botão e filha do item — nunca filha do botão.
    expect(output).toContain('</SidebarMenuButton>\n                  <SidebarMenuSub>');
    expect(output).toContain('<SidebarMenuSubButton is-active>');
  });

  it('o campo de busca leva nome porque o placeholder some ao digitar', () => {
    const output = sidebarSearchSource();
    expect(output).toContain(
      '<SidebarInput placeholder="Buscar..." aria-label="Buscar na navegação" />',
    );
    expect(output).toContain('<SidebarHeader class="nds-p-2" data-spacing="sm">');
  });
});
