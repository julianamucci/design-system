import { describe, expect, it } from 'vitest';
import {
  tabsAbaInitialSource,
  tabsAtivacaoManualSource,
  tabsConfigSource,
  tabsDesabilitadaSource,
  tabsLineSource,
  tabsNavigationVerticalSource,
  tabsPreviewCodeSource,
  tabsSource,
  tabsVerticalSource,
} from './tabs.source';

describe('tabsSource', () => {
  it('sem args, entrega três abas com o valor ligado e nenhum padrão repetido', () => {
    expect(tabsSource()).toBe(
      `<script lang="ts">
  import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
  } from "@/components/ui/tabs";

  let value = $state("overview");
</script>

<Tabs bind:value class="nds-max-w-lg">
  <TabsList aria-label="Seções do componente">
    <TabsTrigger value="overview">Visão geral</TabsTrigger>
    <TabsTrigger value="properties">Propriedades</TabsTrigger>
    <TabsTrigger value="examples">Exemplos</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">Conteúdo da visão geral</TabsContent>
  <TabsContent value="properties">Lista de propriedades</TabsContent>
  <TabsContent value="examples">Exemplos de uso</TabsContent>
</Tabs>`,
    );
  });

  it('a fileira sempre tem nome acessível', () => {
    expect(tabsSource()).toContain('aria-label="Seções do componente"');
  });

  it('acompanha o control de orientação', () => {
    expect(tabsSource('', { args: { orientation: 'vertical' } })).toContain(
      '<Tabs bind:value orientation="vertical" class="nds-max-w-lg">',
    );
    expect(tabsSource()).not.toContain('orientation=');
  });

  it('acompanha o control de ativação', () => {
    expect(tabsSource('', { args: { activationMode: 'manual' } })).toContain(
      'activationMode="manual"',
    );
    expect(tabsSource()).not.toContain('activationMode');
  });

  it('não escreve a variante padrão da lista', () => {
    expect(tabsSource()).not.toContain('variant=');
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('a variante line escreve a prop na lista, não na raiz', () => {
    expect(tabsLineSource()).toContain('<TabsList variant="line" aria-label=');
  });

  it('a orientação vertical vai na raiz', () => {
    expect(tabsVerticalSource()).toContain('orientation="vertical"');
  });

  it('o estado inicial escolhe qual aba nasce ativa', () => {
    expect(tabsAbaInitialSource()).toContain('let value = $state("properties");');
  });

  it('a aba desabilitada é a única com a prop', () => {
    const saida = tabsDesabilitadaSource();
    expect(saida).toContain('<TabsTrigger value="properties" disabled>Propriedades</TabsTrigger>');
    expect(saida.match(/disabled/g)).toHaveLength(1);
  });

  it('a composição de configurações nomeia a fileira pelo assunto', () => {
    const saida = tabsConfigSource();
    expect(saida).toContain('aria-label="Configurações"');
    expect(saida).toContain('let value = $state("profile");');
  });

  it('a composição preview/código usa a variante sem trilho e duas abas', () => {
    const saida = tabsPreviewCodeSource();
    expect(saida).toContain('variant="line"');
    expect(saida.match(/<TabsTrigger /g)).toHaveLength(2);
  });

  it('a navegação vertical tem quatro seções no eixo vertical', () => {
    const saida = tabsNavigationVerticalSource();
    expect(saida).toContain('orientation="vertical"');
    expect(saida.match(/<TabsContent /g)).toHaveLength(4);
  });

  it('a ativação manual escreve o modo na raiz', () => {
    expect(tabsAtivacaoManualSource()).toContain('activationMode="manual"');
  });
});
