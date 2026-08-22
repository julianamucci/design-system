import { describe, expect, it } from 'vitest';
import {
  scrollAreaBothSource,
  scrollAreaContentFocavelSource,
  scrollAreaDuranteScrollSource,
  scrollAreaHorizontalSource,
  sidebarScrollAreaListSource,
  scrollAreaOciosoSource,
  scrollAreaNoTetoSource,
  scrollAreaSempreVisibleSource,
  scrollAreaSource,
  scrollAreaTableAmplaSource,
  scrollAreaVerticalSource,
} from './scroll-area.source';

describe('scrollAreaSource', () => {
  it('sem args, entrega a lista vertical com o teto de altura declarado', () => {
    expect(scrollAreaSource()).toBe(
      `<script lang="ts">
  import { ScrollArea } from "@/components/ui/scroll-area";

  const tags = Array.from({ length: 30 }, (_, i) => \`Tag \${i + 1}\`);
</script>

<ScrollArea orientation="vertical" type="always" size="xl">
  <div class="nds-p-4">
    {#each tags as tag (tag)}
      <div class="nds-text-body nds-border-b nds-last-border-0 nds-pb-2">{tag}</div>
    {/each}
  </div>
</ScrollArea>`,
    );
  });

  it('o control de orientação troca o conteúdo junto com o eixo', () => {
    const horizontal = scrollAreaSource('', { args: { orientation: 'horizontal' } });
    expect(horizontal).toContain('orientation="horizontal"');
    // Sem faixa mais larga que a janela não há transbordo, e sem transbordo não
    // há barra nenhuma para mostrar.
    expect(horizontal).toContain('width: max-content');

    const both = scrollAreaSource('', { args: { orientation: 'both' } });
    expect(both).toContain('orientation="both"');
    expect(both).toContain('<table');
  });

  it('só escreve type quando o valor difere do padrão', () => {
    expect(scrollAreaSource('', { args: { type: 'hover' } })).not.toContain('type=');
    expect(scrollAreaSource('', { args: { type: 'scroll' } })).toContain('type="scroll"');
  });

  it('só escreve scrollHideDelay quando o valor difere do padrão', () => {
    expect(scrollAreaSource('', { args: { scrollHideDelay: 600 } })).not.toContain(
      'scrollHideDelay',
    );
    expect(scrollAreaSource('', { args: { scrollHideDelay: 1000 } })).toContain(
      'scrollHideDelay={1000}',
    );
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('cada variante declara o próprio eixo', () => {
    expect(scrollAreaVerticalSource()).toContain('orientation="vertical"');
    expect(scrollAreaHorizontalSource()).toContain('orientation="horizontal"');
    expect(scrollAreaBothSource()).toContain('orientation="both"');
  });

  it('a variante horizontal impede a quebra de linha da faixa', () => {
    expect(scrollAreaHorizontalSource()).toContain('class="nds-whitespace-nowrap"');
  });

  it('o estado ocioso fica no padrão de type, e o sempre visível o declara', () => {
    expect(scrollAreaOciosoSource()).not.toContain('type=');
    expect(scrollAreaSempreVisibleSource()).toContain('type="always"');
  });

  it('a barra durante a rolagem traz o atraso próprio para sumir', () => {
    const saida = scrollAreaDuranteScrollSource();
    expect(saida).toContain('type="scroll"');
    expect(saida).toContain('scrollHideDelay={1000}');
  });

  it('o conteúdo focável mora numa navegação com nome acessível', () => {
    const saida = scrollAreaContentFocavelSource();
    expect(saida).toContain('aria-label="Ações"');
    expect(saida).toContain('<a href="#secao-{n}"');
  });

  it('sem teto de altura o snippet não declara size — é o erro que a story mostra', () => {
    expect(scrollAreaNoTetoSource()).not.toContain('size=');
  });

  it('a lista em barra lateral nomeia a navegação da documentação', () => {
    const saida = sidebarScrollAreaListSource();
    expect(saida).toContain('aria-label="Seções da documentação"');
    expect(saida).toContain('size="xl"');
  });

  it('a tabela ampla usa a janela mais alta da escada', () => {
    const saida = scrollAreaTableAmplaSource();
    expect(saida).toContain('orientation="both"');
    expect(saida).toContain('size="xl"');
    expect(saida).toContain('{ length: 15 }');
  });
});
