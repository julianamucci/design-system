import { describe, expect, it } from 'vitest';
import {
  tabsAbaAtivaSource,
  tabsAbaDesabilitadaSource,
  tabsWithCounterSource,
  tabsWithIconsSource,
  tabsConfigVerticaisSource,
  tabsControlledSource,
  tabsLineSource,
  tabsModeManualSource,
  tabsDefaultSource,
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
  <Tabs default-value="overview" class="nds-w-md">
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
    const output = tabsSource('', { args: { orientation: 'vertical' } });
    expect(output).toContain('orientation="vertical"');
    expect(output).toContain('nds-w-lg');
    expect(output).toContain('nds-pl-4');
  });

  it('não escreve os padrões de eixo e de ativação', () => {
    const output = tabsSource('', { args: { orientation: 'horizontal', activationMode: 'automatic' } });
    expect(output).not.toContain('orientation=');
    expect(output).not.toContain('activation-mode=');
  });

  it('o modo manual do control chega ao snippet', () => {
    expect(tabsSource('', { args: { activationMode: 'manual' } })).toContain(
      'activation-mode="manual"',
    );
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = tabsSource('', { args: { defaultValue: (() => {}) as never } });
    expect(output).not.toContain('function');
    // Sem aba de partida nenhuma nasceria ativa: o padrão da story assume o lugar.
    expect(output).toContain('default-value="overview"');
  });
});

describe('transforms das stories de variante', () => {
  it('a padrão não escreve a variante da lista — default é o que ela já é', () => {
    expect(tabsDefaultSource()).toContain('<TabsList aria-label="Seções do componente">');
    expect(tabsDefaultSource()).not.toContain('variant=');
  });

  it('a variante line mora na LISTA, não na raiz', () => {
    const output = tabsLineSource();
    expect(output).toContain('<TabsList variant="line" aria-label="Seções do componente">');
    expect(output).not.toContain('<Tabs variant');
  });

  it('a vertical declara o eixo na raiz e o respiro lateral no painel', () => {
    const output = tabsVerticalSource();
    expect(output).toContain('orientation="vertical"');
    expect(output).toContain('class="nds-text-body nds-text-muted-foreground nds-pl-4"');
    // Na vertical a lista fica ao lado: o respiro superior não separa nada.
    expect(output).not.toContain('nds-pt-');
  });
});

describe('transforms das stories de estado', () => {
  it('a aba de partida aponta para o `value`, nunca para a posição', () => {
    const output = tabsAbaAtivaSource();
    expect(output).toContain('<Tabs default-value="properties"');
    expect(output).toContain('<TabsTrigger value="properties">Propriedades</TabsTrigger>');
  });

  it('a aba indisponível leva `disabled` no gatilho, e só nele', () => {
    const output = tabsAbaDesabilitadaSource();
    expect(output).toContain('<TabsTrigger value="properties" disabled>Propriedades</TabsTrigger>');
    expect([...output.matchAll(/ disabled/g)]).toHaveLength(1);
    // O atributo nativo tiraria a aba do alcance do foco; quem marca é
    // `aria-disabled`, e é o componente que o emite.
    expect(output).not.toContain('aria-disabled');
  });
});

describe('transforms das stories de composição', () => {
  it('o controlado liga valor e evento, e fecha o tipo do valor recebido', () => {
    const output = tabsControlledSource();
    expect(output).toContain(':model-value="aba"');
    expect(output).toContain('@update:model-value="aba = String($event)"');
    expect(output).toContain(`const aba = ref('overview')`);
    // Estado controlado e não-controlado no mesmo conjunto brigariam entre si.
    expect(output).not.toContain('default-value');
  });

  it('o ícone é decorativo e vem do conjunto de ícones, não do design system', () => {
    const output = tabsWithIconsSource();
    expect(output).toContain(`import { Code2, Eye, Settings2 } from 'lucide-vue-next'`);
    expect([...output.matchAll(/aria-hidden="true"/g)]).toHaveLength(3);
    expect(output).toContain('<Eye class="nds-size-4" aria-hidden="true" />');
  });

  it('o contador entra dentro do gatilho e não vira segundo alvo de foco', () => {
    const output = tabsWithCounterSource();
    expect(output).toContain(`<TabsTrigger value="inbox">
        Caixa de entrada
        <Badge as="span">12</Badge>
      </TabsTrigger>`);
    // `as="span"` é o que impede o contador de virar um controle dentro de outro.
    expect(output).not.toContain('<Badge>');
    // A terceira aba não tem contador: nem toda aba precisa de um.
    expect(output).toContain('<TabsTrigger value="trash">Lixeira</TabsTrigger>');
  });

  it('nas configurações o título fica em contraste cheio e só o parágrafo atenua', () => {
    const output = tabsConfigVerticaisSource();
    expect(output).toContain('<h3 class="nds-font-medium nds-text-foreground">Perfil público</h3>');
    expect(output).toContain('class="nds-text-body nds-pl-4"');
    // A cor atenuada desceu para o parágrafo: o painel inteiro não a carrega mais.
    expect(output).not.toContain('nds-text-body nds-text-muted-foreground');
  });

  it('o modo manual é prop da raiz', () => {
    expect(tabsModeManualSource()).toContain('activation-mode="manual"');
  });
});
