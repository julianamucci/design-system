import { describe, expect, it } from 'vitest';
import {
  resizableAninhadoSource,
  resizableArrastandoSource,
  resizableComPegadorSource,
  resizableEditorSource,
  resizableFaixasSource,
  resizableFocoSource,
  resizableHorizontalSource,
  resizableLimitesSource,
  resizableSidebarConsoleSource,
  resizableSource,
  resizableTravadoSource,
  resizableVerticalSource,
} from './resizable.source';

const TODAS = [
  resizableSource(),
  resizableHorizontalSource(),
  resizableVerticalSource(),
  resizableAninhadoSource(),
  resizableComPegadorSource(),
  resizableArrastandoSource(),
  resizableLimitesSource(),
  resizableFocoSource(),
  resizableTravadoSource(),
  resizableEditorSource(),
  resizableFaixasSource(),
  resizableSidebarConsoleSource(),
];

describe('resizableSource', () => {
  it('sem args, entrega a forma canônica no eixo horizontal', () => {
    expect(resizableSource()).toBe(
      `<script setup lang="ts">
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
</script>

<template>
  <div class="nds-w-cap-lg nds-aspect-16-9 nds-rounded-md nds-border-default nds-overflow-hidden">
    <ResizablePanelGroup direction="horizontal">
      <ResizablePanel :default-size="30" :min-size="20" :max-size="60">
        <div class="nds-stack nds-p-4" data-spacing="xs">
          <p class="nds-text-body nds-font-semibold">Sidebar</p>
          <p class="nds-text-caption nds-text-muted-foreground">Navegação do projeto</p>
        </div>
      </ResizablePanel>
      <ResizableHandle with-handle aria-label="Redimensionar painéis — use setas para ajustar" />
      <ResizablePanel :default-size="70" :min-size="20">
        <div class="nds-stack nds-p-4" data-spacing="xs">
          <p class="nds-text-body nds-font-semibold">Conteúdo principal</p>
          <p class="nds-text-caption nds-text-muted-foreground">
            Arraste o divisor ou use as setas com ele focado.
          </p>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  </div>
</template>`,
    );
  });

  it('acompanha o control de direção', () => {
    expect(resizableSource('', { args: { direction: 'vertical' } })).toContain(
      '<ResizablePanelGroup direction="vertical">',
    );
  });

  // `direction` é prop OBRIGATÓRIA do grupo: omiti-la por ser "o padrão"
  // entregaria ao leitor um trecho que não roda.
  it('escreve a direção mesmo quando o control não trouxe nada', () => {
    expect(resizableSource()).toContain('direction="horizontal"');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = resizableSource('', { args: { direction: (() => {}) as never } });
    expect(saida).not.toContain('function');
    expect(saida).toContain('direction="horizontal"');
  });

  // O `:key="args.direction"` do render existe só para remontar o grupo quando
  // o control muda: é andaime do Storybook, não do exemplo.
  it('não leva o truque de remontagem da story', () => {
    expect(resizableSource('', { args: { direction: 'vertical' } })).not.toContain(':key=');
  });
});

describe('a moldura de tamanho definido', () => {
  it('toda transform embrulha o grupo num contêiner com tamanho', () => {
    // Sem tamanho no pai não há o que dividir: o grupo vertical empilharia os
    // painéis no tamanho do conteúdo e nada se ajustaria.
    for (const saida of TODAS) {
      expect(saida).toMatch(/<div class="nds-w-cap-\w+ nds-aspect-[\w-]+ /);
    }
  });

  it('o tamanho vem de utilitária, nunca de style inline', () => {
    for (const saida of TODAS) expect(saida).not.toContain('style=');
  });

  it('o conteúdo de cada painel ocupa a faixa inteira', () => {
    // Sem `nds-h-full` o miolo fica boiando no topo e a divisão some da tela.
    expect(resizableHorizontalSource()).toContain('nds-cluster nds-h-full nds-p-4');
  });
});

describe('transforms das stories de variante', () => {
  it('o eixo do grupo troca com a variante', () => {
    expect(resizableHorizontalSource()).toContain('direction="horizontal"');
    expect(resizableVerticalSource()).toContain('direction="vertical"');
    // A proporção acompanha: um split empilhado precisa de altura para dividir.
    expect(resizableVerticalSource()).toContain('nds-aspect-4-3');
  });

  it('o aninhado tem dois grupos, e o de dentro tem eixo próprio', () => {
    const saida = resizableAninhadoSource();
    expect([...saida.matchAll(/<ResizablePanelGroup/g)]).toHaveLength(2);
    expect(saida).toContain('<ResizablePanelGroup direction="vertical">');
    // O grupo de dentro entra COMO conteúdo de um painel do de fora.
    expect(saida).toMatch(/<ResizablePanel :default-size="70" :min-size="50">\n\s+<ResizablePanelGroup/);
  });

  it('o pegador é flag do divisor, e não muda o nome acessível', () => {
    const saida = resizableComPegadorSource();
    expect(saida).toContain('<ResizableHandle with-handle aria-label="Redimensionar painéis — use setas" />');
    // O pegador é desenho: nenhum texto entra nele, senão comporia o nome.
    expect(saida).not.toContain('nds-resizable-grip-bar');
  });
});

describe('transforms das stories de estado', () => {
  it('os limites moram no painel, não no divisor', () => {
    const saida = resizableLimitesSource();
    expect(saida).toContain('<ResizablePanel :default-size="50" :min-size="30" :max-size="60">');
    expect(saida).not.toContain('<ResizableHandle :min-size');
  });

  it('o arrasto deixa o piso baixo para o divisor ter curso', () => {
    expect(resizableArrastandoSource()).toContain(':min-size="10"');
  });

  it('a story de foco mostra a linha nua', () => {
    const saida = resizableFocoSource();
    expect(saida).not.toContain('with-handle');
    // O componente já põe o divisor na ordem de tabulação; escrever tabindex
    // ensinaria um atributo que ninguém precisa passar.
    expect(saida).not.toContain('tabindex');
  });

  it('o travado marca o divisor e mantém o rótulo', () => {
    const saida = resizableTravadoSource();
    expect(saida).toContain('<ResizableHandle disabled with-handle aria-label=');
    // Travado continua anunciado: nada de sumir da ordem de tabulação.
    expect(saida).not.toContain('tabindex="-1"');
  });
});

describe('transforms das stories de composição', () => {
  it('três painéis pedem dois divisores, cada um com nome próprio', () => {
    const saida = resizableEditorSource();
    expect([...saida.matchAll(/<ResizablePanel /g)]).toHaveLength(3);
    const nomes = [...saida.matchAll(/<ResizableHandle[^>]*aria-label="([^"]+)"/g)].map((m) => m[1]);
    expect(nomes).toHaveLength(2);
    // Rótulos repetidos deixariam três entradas iguais na lista de marcos.
    expect(new Set(nomes).size).toBe(nomes.length);
  });

  it('as três faixas empilhadas somam 100 e dividem a altura', () => {
    const saida = resizableFaixasSource();
    expect(saida).toContain('direction="vertical"');
    const tamanhos = [...saida.matchAll(/:default-size="(\d+)"/g)].map((m) => Number(m[1]));
    expect(tamanhos).toEqual([20, 60, 20]);
  });

  it('a sidebar com console aninha o segundo grupo dentro do painel maior', () => {
    const saida = resizableSidebarConsoleSource();
    expect([...saida.matchAll(/<ResizablePanelGroup/g)]).toHaveLength(2);
    expect(saida).toContain('Workspace');
    expect(saida).toContain('Console');
  });
});

describe('o andaime das stories não entra no snippet', () => {
  it('nenhuma transform cita a medição de proporção nem a caixa da story', () => {
    for (const saida of TODAS) {
      expect(saida).not.toContain('fracaoDoPrimeiro');
      expect(saida).not.toContain('resizable.fixtures');
    }
  });
});
