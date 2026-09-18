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
    const output = navigationMenuSource('', { args: { defaultValue: 'produtos' } });
    expect(output).toContain('let aberto = $state("produtos");');
    expect(output).toContain('bind:value={aberto}');
  });

  it('a página atual marca o destino, e só ele', () => {
    const output = navigationMenuSource('', { args: { activeHref: '#inicio' } });
    expect(output).toContain('<NavigationMenuLink href="#inicio" active>');
    expect(output).toContain('<NavigationMenuLink href="#sobre">');
  });

  it('a seta indicadora só entra quando pedida, e importa a peça junto', () => {
    expect(navigationMenuSource()).not.toContain('NavigationMenuIndicator');
    const output = navigationMenuSource('', { args: { indicator: true } });
    expect(output).toContain('  NavigationMenuIndicator,');
    expect(output).toContain('<NavigationMenuIndicator />');
  });

  it('sem painel, a composição de destinos diretos não importa gatilho nem conteúdo', () => {
    const output = navigationMenuSource('', { args: { demonstration: 'simpleLink' } });
    expect(output).not.toContain('NavigationMenuTrigger');
    expect(output).not.toContain('NavigationMenuContent');
    expect(output).not.toContain('NavigationMenuChild');
    expect(output).toContain('<NavigationMenuLink href="#contato">Contato</NavigationMenuLink>');
  });

  it('a barra completa leva cinco itens, dois deles com painel', () => {
    const output = navigationMenuSource('', { args: { demonstration: 'bar' } });
    expect(output.match(/<NavigationMenuItem value=/g)).toHaveLength(5);
    expect(output.match(/<NavigationMenuTrigger>/g)).toHaveLength(2);
  });

  it('o mega-menu abre em duas colunas e cada destino leva a sua linha de contexto', () => {
    const output = navigationMenuSource('', { args: { demonstration: 'megaMenuGrid' } });
    expect(output).toContain('data-cols="2"');
    expect(output).toContain('nds-navigation-menu-child-description');
    expect(output).toContain('Campanhas, automação e atribuição num lugar só.');
  });

  it('o painel com destaque estica o bloco principal pela altura da coluna', () => {
    const output = navigationMenuSource('', { args: { demonstration: 'withFeatured' } });
    expect(output).toContain('<NavigationMenuChild href="#comece" class="nds-h-full">');
    expect(output).toContain('Publique o primeiro projeto em menos de cinco minutos.');
  });

  it('o gatilho com lista vertical fica entre dois destinos diretos', () => {
    const output = navigationMenuSource('', { args: { demonstration: 'withDropdown' } });
    expect(output).toContain('<NavigationMenuTrigger>Planos</NavigationMenuTrigger>');
    expect(output.match(/<NavigationMenuTrigger>/g)).toHaveLength(1);
  });
});
