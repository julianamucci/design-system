import { describe, expect, it } from 'vitest';
import {
  navigationMenuOpenSource,
  navigationMenuActiveSource,
  navigationMenuWithHighlightSource,
  navigationMenuWithPanelSource,
  navigationMenuClosedSource,
  navigationMenuHorizontalSource,
  navigationMenuMegaMenuSource,
  navigationMenuSomenteLinksSource,
  navigationMenuSource,
  navigationMenuVerticalSource,
} from './navigation-menu.source';

describe('navigationMenuSource', () => {
  it('sem args, entrega a barra canônica com destinos diretos e painéis', () => {
    expect(navigationMenuSource()).toBe(
      `<script setup lang="ts">
import {
  NavigationMenu,
  NavigationMenuChild,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
</script>

<template>
  <NavigationMenu aria-label="Navegação principal">
    <NavigationMenuList>
      <NavigationMenuItem>
        <NavigationMenuLink href="#inicio">Início</NavigationMenuLink>
      </NavigationMenuItem>

      <NavigationMenuItem value="produtos">
        <NavigationMenuTrigger>Produtos</NavigationMenuTrigger>
        <NavigationMenuContent>
          <ul class="nds-stack nds-list-none nds-w-xs" data-spacing="xs">
            <li>
              <NavigationMenuChild href="#inicial">
                <div class="nds-navigation-menu-child-label">Plano Inicial</div>
              </NavigationMenuChild>
            </li>
            <li>
              <NavigationMenuChild href="#profissional">
                <div class="nds-navigation-menu-child-label">Plano Profissional</div>
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
              <NavigationMenuChild href="#marketing">
                <div class="nds-navigation-menu-child-label">Para Marketing</div>
              </NavigationMenuChild>
            </li>
            <li>
              <NavigationMenuChild href="#vendas">
                <div class="nds-navigation-menu-child-label">Para Vendas</div>
              </NavigationMenuChild>
            </li>
          </ul>
        </NavigationMenuContent>
      </NavigationMenuItem>

      <NavigationMenuItem>
        <NavigationMenuLink href="#sobre">Sobre</NavigationMenuLink>
      </NavigationMenuItem>
    </NavigationMenuList>
  </NavigationMenu>
</template>`,
    );
  });

  it('o item aberto na montagem casa com o `value` declarado no item', () => {
    const saida = navigationMenuSource('', { args: { defaultValue: 'produtos' } });
    expect(saida).toContain('default-value="produtos"');
    expect(saida).toContain('<NavigationMenuItem value="produtos">');
  });

  it('a fila de atributos quebra em linhas quando cresce demais', () => {
    // Atributo em linha longa some na barra de rolagem do painel Code.
    const saida = navigationMenuSource('', {
      args: { defaultValue: 'produtos', delayDuration: 400, orientation: 'vertical' },
    });
    expect(saida).toContain(`  <NavigationMenu
    default-value="produtos"
    :delay-duration="400"
    orientation="vertical"
    aria-label="Navegação principal"
  >`);
  });

  it('não escreve o padrão: nem a direção horizontal nem a espera de fábrica', () => {
    const saida = navigationMenuSource('', {
      args: { defaultValue: '', delayDuration: 200, orientation: 'horizontal' },
    });
    expect(saida).toContain('<NavigationMenu aria-label="Navegação principal">');
    expect(saida).not.toContain('orientation=');
    expect(saida).not.toContain('delay-duration');
    expect(saida).not.toContain('default-value');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    // `onUpdate:modelValue` chega como espião do Storybook; nenhum control pode
    // atravessar para o markup sem passar pela guarda de tipo.
    const saida = navigationMenuSource('', {
      args: {
        defaultValue: (() => {}) as never,
        orientation: (() => {}) as never,
        delayDuration: (() => {}) as never,
      },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('default-value');
    expect(saida).not.toContain('delay-duration');
    expect(saida).not.toContain('orientation=');
  });
});

describe('transforms das stories de variante', () => {
  it('a horizontal não escreve a própria direção', () => {
    const saida = navigationMenuHorizontalSource();
    expect(saida).not.toContain('orientation=');
    // Cinco itens, dois deles com painel: é o cabeçalho de site completo.
    expect(saida.match(/<NavigationMenuItem[ >]/g)).toHaveLength(5);
    expect(saida.match(/<NavigationMenuTrigger>/g)).toHaveLength(2);
  });

  it('a vertical troca o eixo e dá largura e respiro próprios à lista', () => {
    const saida = navigationMenuVerticalSource();
    expect(saida).toContain('<NavigationMenu orientation="vertical" aria-label="Navegação da conta">');
    expect(saida).toContain('<NavigationMenuList class="nds-stack nds-w-sm" data-spacing="xs">');
    // Numa coluna de barra lateral não há painel: só destinos.
    expect(saida).not.toContain('NavigationMenuTrigger');
  });
});

describe('transforms das stories de estado', () => {
  it('fechado é ausência: nenhuma prop declara o estado', () => {
    const saida = navigationMenuClosedSource();
    expect(saida).toContain('<NavigationMenu aria-label="Navegação principal">');
    expect(saida).not.toContain('default-value');
  });

  it('aberto na montagem casa a raiz com o item, e traz a seta indicadora', () => {
    const saida = navigationMenuOpenSource();
    expect(saida).toContain('default-value="produtos"');
    expect(saida).toContain('<NavigationMenuIndicator />');
    // A seta é irmã dos itens DENTRO da lista: fora dela não teria contra o que
    // se posicionar.
    expect(saida).toContain('      <NavigationMenuIndicator />\n    </NavigationMenuList>');
  });

  it('a página atual se marca com `active` no destino, um só por barra', () => {
    const saida = navigationMenuActiveSource();
    expect(saida).toContain('<NavigationMenuLink href="#inicio" :active="true">Início</NavigationMenuLink>');
    expect(saida.match(/:active="true"/g)).toHaveLength(1);
    // `aria-current` é o que o componente DERIVA de `active`; escrevê-lo à mão
    // ensinaria a duplicar o que a prop já faz.
    expect(saida).not.toContain('aria-current');
  });
});

describe('transforms das stories de composição', () => {
  it('a barra plana não tem gatilho nenhum — sem hierarquia, sem painel', () => {
    const saida = navigationMenuSomenteLinksSource();
    expect(saida).toContain('aria-label="Navegação institucional"');
    expect(saida).not.toContain('NavigationMenuTrigger');
    expect(saida).not.toContain('NavigationMenuContent');
  });

  it('o painel simples é uma lista vertical de destinos sob um gatilho', () => {
    const saida = navigationMenuWithPanelSource();
    expect(saida).toContain('<NavigationMenuItem value="planos">');
    expect(saida).toContain('<NavigationMenuTrigger>Planos</NavigationMenuTrigger>');
    expect(saida.match(/<NavigationMenuChild /g)).toHaveLength(3);
    // O `@click` que barra a navegação existe só para a página de teste não sair
    // do ar; quem consome QUER que o destino navegue.
    expect(saida).not.toContain('@click');
  });

  it('o mega-menu põe título e linha de contexto em cada destino', () => {
    const saida = navigationMenuMegaMenuSource();
    expect(saida).toContain('<ul class="nds-grid nds-list-none nds-w-lg" data-fixed data-cols="2" data-spacing="sm">');
    expect(saida.match(/nds-navigation-menu-child-description/g)).toHaveLength(4);
    // A descrição completa o nome do destino (WCAG 2.4.4): escondê-la deixaria
    // "Para Marketing" sozinho, que não diz o que há do outro lado.
    expect(saida).not.toContain('aria-hidden');
  });

  it('no painel com destaque o destino grande é irmão da lista, sem `<li>`', () => {
    const saida = navigationMenuWithHighlightSource();
    expect(saida).toContain('<NavigationMenuChild href="#comece" class="nds-h-full">');
    // A hierarquia vem do tamanho do bloco, e o bloco só ocupa a coluna inteira
    // por estar solto na grade — dentro de um `<li>` ele voltaria à altura do
    // conteúdo.
    expect(saida).not.toContain('<li>\n            <NavigationMenuChild href="#comece"');
    expect(saida.match(/<li>/g)).toHaveLength(3);
  });
});

describe('o snippet ensina o design system, não o andaime da story', () => {
  const todas = [
    navigationMenuSource,
    navigationMenuHorizontalSource,
    navigationMenuVerticalSource,
    navigationMenuClosedSource,
    navigationMenuOpenSource,
    navigationMenuActiveSource,
    navigationMenuSomenteLinksSource,
    navigationMenuWithPanelSource,
    navigationMenuMegaMenuSource,
    navigationMenuWithHighlightSource,
  ];

  it('nenhuma traz a moldura de contenção nem o barrador de navegação', () => {
    for (const fn of todas) {
      const saida = fn();
      expect(saida).not.toContain('contain: layout');
      expect(saida).not.toContain('min-height');
      expect(saida).not.toContain('aoNavegar');
      expect(saida).not.toContain('preventDefault');
    }
  });

  it('toda barra é um landmark com nome próprio', () => {
    // Sem nome o leitor de tela anuncia só "navegação", e duas barras homônimas
    // na mesma página reprovam em `landmark-unique`.
    for (const fn of todas) {
      expect(fn()).toMatch(/<NavigationMenu[\s\S]*?aria-label="/);
    }
  });

  it('todas importam do design system, nunca de um caminho interno', () => {
    for (const fn of todas) {
      expect(fn()).toContain(`from '@/components/ui/navigation-menu'`);
    }
  });
});
