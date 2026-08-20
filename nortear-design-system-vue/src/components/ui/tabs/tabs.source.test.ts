import { describe, expect, it } from 'vitest';
import {
  tabsAbaAtivaSource,
  tabsAbaDesabilitadaSource,
  tabsComContadorSource,
  tabsComIconesSource,
  tabsConfiguracoesVerticaisSource,
  tabsControladoSource,
  tabsLinhaSource,
  tabsModoManualSource,
  tabsPadraoSource,
  tabsSource,
  tabsVerticalSource,
} from './tabs.source';

describe('tabsSource', () => {
  it('sem args, entrega o conjunto canônico: lista nomeada e um painel por aba', () => {
    expect(tabsSource()).toBe(
      `<script setup lang="ts">
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
</script>

<template>
  <Tabs default-value="overview" class="nds-w-cap-md">
    <TabsList aria-label="Seções do componente">
      <TabsTrigger value="overview">Visão geral</TabsTrigger>
      <TabsTrigger value="properties">Propriedades</TabsTrigger>
      <TabsTrigger value="examples">Exemplos</TabsTrigger>
    </TabsList>
    <TabsContent value="overview" class="nds-text-body nds-text-muted-foreground">Conteúdo da visão geral.</TabsContent>
    <TabsContent value="properties" class="nds-text-body nds-text-muted-foreground">Lista de propriedades.</TabsContent>
    <TabsContent value="examples" class="nds-text-body nds-text-muted-foreground">Exemplos de uso.</TabsContent>
  </Tabs>
</template>`,
    );
  });

  it('nenhum painel carrega respiro próprio — a raiz já separa lista e painel', () => {
    // As stories cravavam 12px de padding-top por cima do gap da raiz: um
    // meio-degrau que o vocabulário de utilitárias exclui de propósito.
    expect(tabsSource()).not.toContain('style=');
    expect(tabsSource()).not.toContain('padding');
  });

  it('o eixo vertical troca a moldura e move o respiro do painel para o lado', () => {
    const saida = tabsSource('', { args: { orientation: 'vertical' } });
    expect(saida).toContain('orientation="vertical"');
    expect(saida).toContain('nds-w-cap-lg');
    expect(saida).toContain('nds-pl-4');
  });

  it('não escreve os padrões de eixo e de ativação', () => {
    const saida = tabsSource('', { args: { orientation: 'horizontal', activationMode: 'automatic' } });
    expect(saida).not.toContain('orientation=');
    expect(saida).not.toContain('activation-mode=');
  });

  it('o modo manual do control chega ao snippet', () => {
    expect(tabsSource('', { args: { activationMode: 'manual' } })).toContain(
      'activation-mode="manual"',
    );
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = tabsSource('', { args: { defaultValue: (() => {}) as never } });
    expect(saida).not.toContain('function');
    // Sem aba de partida nenhuma nasceria ativa: o padrão da story assume o lugar.
    expect(saida).toContain('default-value="overview"');
  });
});

describe('transforms das stories de variante', () => {
  it('a padrão não escreve a variante da lista — default é o que ela já é', () => {
    expect(tabsPadraoSource()).toContain('<TabsList aria-label="Seções do componente">');
    expect(tabsPadraoSource()).not.toContain('variant=');
  });

  it('a variante line mora na LISTA, não na raiz', () => {
    const saida = tabsLinhaSource();
    expect(saida).toContain('<TabsList variant="line" aria-label="Seções do componente">');
    expect(saida).not.toContain('<Tabs variant');
  });

  it('a vertical declara o eixo na raiz e o respiro lateral no painel', () => {
    const saida = tabsVerticalSource();
    expect(saida).toContain('orientation="vertical"');
    expect(saida).toContain('class="nds-text-body nds-text-muted-foreground nds-pl-4"');
    // Na vertical a lista fica ao lado: o respiro superior não separa nada.
    expect(saida).not.toContain('nds-pt-');
  });
});

describe('transforms das stories de estado', () => {
  it('a aba de partida aponta para o `value`, nunca para a posição', () => {
    const saida = tabsAbaAtivaSource();
    expect(saida).toContain('<Tabs default-value="properties"');
    expect(saida).toContain('<TabsTrigger value="properties">Propriedades</TabsTrigger>');
  });

  it('a aba indisponível leva `disabled` no gatilho, e só nele', () => {
    const saida = tabsAbaDesabilitadaSource();
    expect(saida).toContain('<TabsTrigger value="properties" disabled>Propriedades</TabsTrigger>');
    expect([...saida.matchAll(/ disabled/g)]).toHaveLength(1);
    // O atributo nativo tiraria a aba do alcance do foco; quem marca é
    // `aria-disabled`, e é o componente que o emite.
    expect(saida).not.toContain('aria-disabled');
  });
});

describe('transforms das stories de composição', () => {
  it('o controlado liga valor e evento, e fecha o tipo do valor recebido', () => {
    const saida = tabsControladoSource();
    expect(saida).toContain(':model-value="aba"');
    expect(saida).toContain('@update:model-value="aba = String($event)"');
    expect(saida).toContain(`const aba = ref('overview')`);
    // Estado controlado e não-controlado no mesmo conjunto brigariam entre si.
    expect(saida).not.toContain('default-value');
  });

  it('o ícone é decorativo e vem do conjunto de ícones, não do design system', () => {
    const saida = tabsComIconesSource();
    expect(saida).toContain(`import { Code2, Eye, Settings2 } from 'lucide-vue-next'`);
    expect([...saida.matchAll(/aria-hidden="true"/g)]).toHaveLength(3);
    expect(saida).toContain('<Eye class="nds-size-4" aria-hidden="true" />');
  });

  it('o contador entra dentro do gatilho e não vira segundo alvo de foco', () => {
    const saida = tabsComContadorSource();
    expect(saida).toContain(`<TabsTrigger value="inbox">
        Caixa de entrada
        <Badge as="span">12</Badge>
      </TabsTrigger>`);
    // `as="span"` é o que impede o contador de virar um controle dentro de outro.
    expect(saida).not.toContain('<Badge>');
    // A terceira aba não tem contador: nem toda aba precisa de um.
    expect(saida).toContain('<TabsTrigger value="trash">Lixeira</TabsTrigger>');
  });

  it('nas configurações o título fica em contraste cheio e só o parágrafo atenua', () => {
    const saida = tabsConfiguracoesVerticaisSource();
    expect(saida).toContain('<h3 class="nds-font-medium nds-text-foreground">Perfil público</h3>');
    expect(saida).toContain('class="nds-text-body nds-pl-4"');
    // A cor atenuada desceu para o parágrafo: o painel inteiro não a carrega mais.
    expect(saida).not.toContain('nds-text-body nds-text-muted-foreground');
  });

  it('o modo manual é prop da raiz', () => {
    expect(tabsModoManualSource()).toContain('activation-mode="manual"');
  });
});
