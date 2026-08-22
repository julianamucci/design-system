import { describe, expect, it } from 'vitest';
import {
  resizableNestedSource,
  resizableArrastoSource,
  resizableWithGrabberSource,
  resizableDisabledSource,
  resizableDivisaoVerticalSource,
  resizableEditorPreviewSource,
  resizableFocusSource,
  resizableHorizontalSource,
  resizableIdeSource,
  resizableLimitesSource,
  resizableSidebarSource,
  resizableSource,
  resizableVerticalSource,
} from './resizable.source';

describe('resizableSource', () => {
  it('sem args, entrega o split lateral com divisor nomeado', () => {
    expect(resizableSource()).toBe(
      `<script lang="ts">
  import {
    ResizablePaneGroup,
    ResizablePane,
    ResizableHandle,
  } from "@/components/ui/resizable";
</script>

<div
  class="nds-w-full nds-rounded-md nds-border-default nds-bg-background nds-overflow-hidden"
  style="height: 260px"
>
  <ResizablePaneGroup direction="horizontal">
    <ResizablePane defaultSize={30} minSize={20} maxSize={60}>
      <div class="nds-cluster nds-h-full" data-align="center" data-justify="center">
        <span class="nds-text-body nds-text-muted-foreground">Sidebar</span>
      </div>
    </ResizablePane>
    <ResizableHandle withHandle aria-label="Redimensionar painéis — use setas para ajustar" />
    <ResizablePane defaultSize={70} minSize={20}>
      <div class="nds-cluster nds-h-full" data-align="center" data-justify="center">
        <span class="nds-text-body">Conteúdo principal</span>
      </div>
    </ResizablePane>
  </ResizablePaneGroup>
</div>`,
    );
  });

  it('o invólucro sempre tem altura — sem ela não há espaço livre para repartir', () => {
    // O grupo reparte o espaço LIVRE do eixo. Num contêiner de altura
    // automática os painéis nascem com zero e o layout some sem erro nenhum.
    expect(resizableSource()).toContain('style="height:');
    expect(resizableVerticalSource()).toContain('style="height:');
  });

  it('a direção do grupo acompanha o control', () => {
    expect(resizableSource('', { args: { direction: 'vertical' } })).toContain(
      '<ResizablePaneGroup direction="vertical">',
    );
  });

  it('o pegador só é escrito quando pedido', () => {
    expect(resizableSource('', { args: { withHandle: false } })).not.toContain('withHandle');
    expect(resizableSource('', { args: { withHandle: true } })).toContain(
      '<ResizableHandle withHandle',
    );
  });

  it('o segundo painel recebe o complemento do primeiro', () => {
    const saida = resizableSource('', { args: { defaultSize: 40, minSize: 15 } });
    expect(saida).toContain('<ResizablePane defaultSize={40} minSize={15} maxSize={60}>');
    expect(saida).toContain('<ResizablePane defaultSize={60} minSize={15}>');
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('a variante horizontal reparte a largura em 30/70', () => {
    const saida = resizableHorizontalSource();
    expect(saida).toContain('direction="horizontal"');
    expect(saida).toContain('<ResizablePane defaultSize={30} minSize={20}>');
  });

  it('a variante vertical empilha os painéis e reparte a altura', () => {
    const saida = resizableVerticalSource();
    expect(saida).toContain('direction="vertical"');
    expect(saida).toContain('<span class="nds-text-body">Rodapé</span>');
  });

  it('a variante aninhada põe um grupo no eixo oposto dentro do segundo painel', () => {
    const saida = resizableNestedSource();
    expect(saida.match(/<ResizablePaneGroup /g)).toHaveLength(2);
    expect(saida).toContain('<ResizablePaneGroup direction="vertical">');
    // Cada grupo tem o seu divisor, com nome próprio.
    expect(saida).toContain('aria-label="Redimensionar editor e console — use setas"');
  });

  it('a variante com pegador divide ao meio e mostra o controle', () => {
    const saida = resizableWithGrabberSource();
    expect(saida).toContain('<ResizableHandle withHandle');
    expect(saida).toContain('<ResizablePane defaultSize={50} minSize={20}>');
  });

  it('o estado de arrasto abre o piso para o painel encolher de verdade', () => {
    expect(resizableArrastoSource()).toContain('minSize={10}');
  });

  it('o estado de limites declara piso e teto', () => {
    expect(resizableLimitesSource()).toContain('minSize={30} maxSize={60}');
  });

  it('o estado de foco não muda a marcação — o anel é comportamento', () => {
    expect(resizableFocusSource()).toContain('<span class="nds-text-body">Dois</span>');
  });

  it('o divisor travado escreve a prop, e continua nomeado', () => {
    const saida = resizableDisabledSource();
    expect(saida).toContain('<ResizableHandle withHandle disabled aria-label=');
  });

  it('a composição de sidebar nomeia o divisor pelo que ele redimensiona', () => {
    expect(resizableSidebarSource()).toContain(
      'aria-label="Redimensionar sidebar — use setas para ajustar"',
    );
  });

  it('a composição de editor e preview reparte em partes iguais', () => {
    const saida = resizableEditorPreviewSource();
    expect(saida).toContain('<span class="nds-text-body">Preview</span>');
    expect(saida).toContain('<ResizablePane defaultSize={50} minSize={20}>');
  });

  it('a divisão vertical empilha lista e detalhe em 40/60', () => {
    const saida = resizableDivisaoVerticalSource();
    expect(saida).toContain('direction="vertical"');
    expect(saida).toContain('<ResizablePane defaultSize={60} minSize={20}>');
  });

  it('a composição de IDE aninha o console sob o editor', () => {
    const saida = resizableIdeSource();
    expect(saida.match(/<ResizablePaneGroup /g)).toHaveLength(2);
    expect(saida).toContain('Arquivos');
    expect(saida).toContain('Console');
  });
});
