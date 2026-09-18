import { describe, expect, it } from 'vitest';
import {
  resizableNestedSource,
  resizableArrastandoSource,
  resizableWithGrabberSource,
  resizableEditorSource,
  resizableFaixasSource,
  resizableFocusSource,
  resizableHorizontalSource,
  resizableLimitesSource,
  resizableSidebarConsoleSource,
  resizableSource,
  resizableTravadoSource,
  resizableVerticalSource,
} from './resizable.source';

const ALL = [
  resizableSource(),
  resizableHorizontalSource(),
  resizableVerticalSource(),
  resizableNestedSource(),
  resizableWithGrabberSource(),
  resizableArrastandoSource(),
  resizableLimitesSource(),
  resizableFocusSource(),
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
  <div class="nds-w-lg nds-aspect-16-9 nds-rounded-md nds-border-default nds-overflow-hidden">
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
    const output = resizableSource('', { args: { direction: (() => {}) as never } });
    expect(output).not.toContain('function');
    expect(output).toContain('direction="horizontal"');
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
    for (const output of ALL) {
      expect(output).toMatch(/<div class="nds-w-\w+ nds-aspect-[\w-]+ /);
    }
  });

  it('o tamanho vem de utilitária, nunca de style inline', () => {
    for (const output of ALL) expect(output).not.toContain('style=');
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
    const output = resizableNestedSource();
    expect([...output.matchAll(/<ResizablePanelGroup/g)]).toHaveLength(2);
    expect(output).toContain('<ResizablePanelGroup direction="vertical">');
    // O grupo de dentro entra COMO conteúdo de um painel do de fora.
    expect(output).toMatch(/<ResizablePanel :default-size="70" :min-size="50">\n\s+<ResizablePanelGroup/);
  });

  it('o pegador é flag do divisor, e não muda o nome acessível', () => {
    const output = resizableWithGrabberSource();
    expect(output).toContain('<ResizableHandle with-handle aria-label="Redimensionar painéis — use setas" />');
    // O pegador é desenho: nenhum texto entra nele, senão comporia o nome.
    expect(output).not.toContain('nds-resizable-grip-bar');
  });
});

describe('transforms das stories de estado', () => {
  it('os limites moram no painel, não no divisor', () => {
    const output = resizableLimitesSource();
    expect(output).toContain('<ResizablePanel :default-size="50" :min-size="30" :max-size="60">');
    expect(output).not.toContain('<ResizableHandle :min-size');
  });

  it('o arrasto deixa o piso baixo para o divisor ter curso', () => {
    expect(resizableArrastandoSource()).toContain(':min-size="10"');
  });

  it('a story de foco mostra a linha nua', () => {
    const output = resizableFocusSource();
    expect(output).not.toContain('with-handle');
    // O componente já põe o divisor na ordem de tabulação; escrever tabindex
    // ensinaria um atributo que ninguém precisa passar.
    expect(output).not.toContain('tabindex');
  });

  it('o travado marca o divisor e mantém o rótulo', () => {
    const output = resizableTravadoSource();
    expect(output).toContain('<ResizableHandle disabled with-handle aria-label=');
    // Travado continua anunciado: nada de sumir da ordem de tabulação.
    expect(output).not.toContain('tabindex="-1"');
  });
});

describe('transforms das stories de composição', () => {
  it('três painéis pedem dois divisores, cada um com nome próprio', () => {
    const output = resizableEditorSource();
    expect([...output.matchAll(/<ResizablePanel /g)]).toHaveLength(3);
    const names = [...output.matchAll(/<ResizableHandle[^>]*aria-label="([^"]+)"/g)].map((m) => m[1]);
    expect(names).toHaveLength(2);
    // Rótulos repetidos deixariam três entradas iguais na lista de marcos.
    expect(new Set(names).size).toBe(names.length);
  });

  it('as três faixas empilhadas somam 100 e dividem a altura', () => {
    const output = resizableFaixasSource();
    expect(output).toContain('direction="vertical"');
    const sizes = [...output.matchAll(/:default-size="(\d+)"/g)].map((m) => Number(m[1]));
    expect(sizes).toEqual([20, 60, 20]);
  });

  it('a sidebar com console aninha o segundo grupo dentro do painel maior', () => {
    const output = resizableSidebarConsoleSource();
    expect([...output.matchAll(/<ResizablePanelGroup/g)]).toHaveLength(2);
    expect(output).toContain('Workspace');
    expect(output).toContain('Console');
  });
});

describe('o andaime das stories não entra no snippet', () => {
  it('nenhuma transform cita a medição de proporção nem a caixa da story', () => {
    for (const output of ALL) {
      expect(output).not.toContain('fracaoDoPrimeiro');
      expect(output).not.toContain('resizable.fixtures');
    }
  });
});
