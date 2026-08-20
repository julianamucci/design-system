import { describe, expect, it } from 'vitest';
import { navigationMenuSource } from './navigation-menu.source';

describe('navigationMenuSource', () => {
  it('sem args, entrega a barra canônica: dois destinos diretos e dois painéis', () => {
    expect(navigationMenuSource()).toBe(
      `<script lang="ts">
  import {
    NavigationMenuRoot,
    NavigationMenuList,
    NavigationMenuItem,
    NavigationMenuTrigger,
    NavigationMenuContent,
    NavigationMenuLink,
    NavigationMenuChild,
  } from "@/components/ui/navigation-menu";
</script>

<NavigationMenuRoot aria-label="Navegação principal">
  <NavigationMenuList>
    <NavigationMenuItem value="inicio">
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
          <li>
            <NavigationMenuChild href="#empresarial">
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
    <NavigationMenuItem value="sobre">
      <NavigationMenuLink href="#sobre">Sobre</NavigationMenuLink>
    </NavigationMenuItem>
  </NavigationMenuList>
</NavigationMenuRoot>`,
    );
  });

  it('o nome do landmark sai sempre escrito, e acompanha o control', () => {
    // Sem `aria-label` o leitor de tela anuncia só "navegação": aqui a prop não
    // é ruído, é o contrato de acessibilidade da barra.
    expect(navigationMenuSource()).toContain('aria-label="Navegação principal"');
    expect(navigationMenuSource('', { args: { ariaLabel: 'Navegação da conta' } })).toContain(
      'aria-label="Navegação da conta"',
    );
  });

  it('só escreve delayDuration quando difere do padrão', () => {
    expect(navigationMenuSource()).not.toContain('delayDuration');
    expect(navigationMenuSource('', { args: { delayDuration: 300 } })).toContain(
      'delayDuration={300}',
    );
  });

  it('a orientação vertical empilha a lista, além de trocar a prop', () => {
    expect(navigationMenuSource()).not.toContain('orientation');
    const vertical = navigationMenuSource('', { args: { orientation: 'vertical' } });
    expect(vertical).toContain('orientation="vertical"');
    expect(vertical).toContain('<NavigationMenuList class="nds-stack nds-w-sm" data-spacing="xs">');
  });

  it('o item aberto ao montar declara o estado de fora, por bind:value', () => {
    const saida = navigationMenuSource('', { args: { defaultValue: 'produtos' } });
    expect(saida).toContain('let aberto = $state("produtos");');
    expect(saida).toContain('bind:value={aberto}');
  });

  it('a página atual marca o destino, e só ele', () => {
    const saida = navigationMenuSource('', { args: { activeHref: '#inicio' } });
    expect(saida).toContain('<NavigationMenuLink href="#inicio" active>');
    expect(saida).toContain('<NavigationMenuLink href="#sobre">');
  });

  it('a seta indicadora só entra quando pedida, e importa a peça junto', () => {
    expect(navigationMenuSource()).not.toContain('NavigationMenuIndicator');
    const saida = navigationMenuSource('', { args: { indicator: true } });
    expect(saida).toContain('  NavigationMenuIndicator,');
    expect(saida).toContain('<NavigationMenuIndicator />');
  });

  it('sem painel, a composição de destinos diretos não importa gatilho nem conteúdo', () => {
    const saida = navigationMenuSource('', { args: { demonstration: 'simpleLink' } });
    expect(saida).not.toContain('NavigationMenuTrigger');
    expect(saida).not.toContain('NavigationMenuContent');
    expect(saida).not.toContain('NavigationMenuChild');
    expect(saida).toContain('<NavigationMenuLink href="#contato">Contato</NavigationMenuLink>');
  });

  it('a barra completa leva cinco itens, dois deles com painel', () => {
    const saida = navigationMenuSource('', { args: { demonstration: 'bar' } });
    expect(saida.match(/<NavigationMenuItem value=/g)).toHaveLength(5);
    expect(saida.match(/<NavigationMenuTrigger>/g)).toHaveLength(2);
  });

  it('o mega-menu abre em duas colunas e cada destino leva a sua linha de contexto', () => {
    const saida = navigationMenuSource('', { args: { demonstration: 'megaMenuGrid' } });
    expect(saida).toContain('data-cols="2"');
    expect(saida).toContain('nds-navigation-menu-child-description');
    expect(saida).toContain('Campanhas, automação e atribuição num lugar só.');
  });

  it('o painel com destaque estica o bloco principal pela altura da coluna', () => {
    const saida = navigationMenuSource('', { args: { demonstration: 'withFeatured' } });
    expect(saida).toContain('<NavigationMenuChild href="#comece" class="nds-h-full">');
    expect(saida).toContain('Publique o primeiro projeto em menos de cinco minutos.');
  });

  it('o gatilho com lista vertical fica entre dois destinos diretos', () => {
    const saida = navigationMenuSource('', { args: { demonstration: 'withDropdown' } });
    expect(saida).toContain('<NavigationMenuTrigger>Planos</NavigationMenuTrigger>');
    expect(saida.match(/<NavigationMenuTrigger>/g)).toHaveLength(1);
  });
});
