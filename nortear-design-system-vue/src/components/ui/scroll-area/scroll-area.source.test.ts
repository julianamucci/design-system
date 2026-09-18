import { describe, expect, it } from 'vitest';
import {
  scrollAreaAoRolarSource,
  scrollAreaBidirecionalSource,
  scrollAreaContentFocavelSource,
  scrollAreaGaleriaSource,
  scrollAreaHorizontalSource,
  scrollAreaOciosoSource,
  scrollAreaNoLimitSource,
  scrollAreaSempreSource,
  scrollAreaSidebarSource,
  scrollAreaSource,
  scrollAreaTableSource,
  scrollAreaVerticalSource,
} from './scroll-area.source';

const ALL = [
  scrollAreaSource(),
  scrollAreaVerticalSource(),
  scrollAreaHorizontalSource(),
  scrollAreaBidirecionalSource(),
  scrollAreaOciosoSource(),
  scrollAreaSempreSource(),
  scrollAreaAoRolarSource(),
  scrollAreaContentFocavelSource(),
  scrollAreaNoLimitSource(),
  scrollAreaSidebarSource(),
  scrollAreaGaleriaSource(),
  scrollAreaTableSource(),
];

describe('scrollAreaSource', () => {
  it('sem args, entrega a forma canônica com altura da escada', () => {
    expect(scrollAreaSource()).toBe(
      `<script setup lang="ts">
import { ScrollArea } from '@/components/ui/scroll-area'

const tags = Array.from({ length: 40 }, (_, i) => \`Tag \${i + 1}\`)
</script>

<template>
  <div class="nds-w-xs nds-rounded-md nds-border-default nds-overflow-hidden">
    <ScrollArea size="xl" class="nds-w-full">
      <div class="nds-p-4">
        <h4 class="nds-mb-2 nds-text-body nds-font-medium nds-leading-none">Tags</h4>
        <div class="nds-stack" data-spacing="sm">
          <div
            v-for="tag in tags"
            :key="tag"
            class="nds-text-body nds-rounded-sm nds-border-default nds-px-2 nds-py-1"
          >
            {{ tag }}
          </div>
        </div>
      </div>
    </ScrollArea>
  </div>
</template>`,
    );
  });

  it('o control de exibição da barra vira atributo quando sai do padrão', () => {
    expect(scrollAreaSource('', { args: { type: 'always' } })).toContain('<ScrollArea type="always"');
    expect(scrollAreaSource('', { args: { scrollHideDelay: 1200 } })).toContain(
      ':scroll-hide-delay="1200"',
    );
  });

  it('não escreve os padrões do componente', () => {
    const output = scrollAreaSource('', { args: { type: 'hover', scrollHideDelay: 600 } });
    expect(output).not.toContain('type=');
    expect(output).not.toContain('scroll-hide-delay');
  });

  it('ignora control que não é string nem número', () => {
    const output = scrollAreaSource('', {
      args: { type: (() => {}) as never, scrollHideDelay: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).not.toContain('type=');
    expect(output).not.toContain('scroll-hide-delay');
  });

  it('o componente monta viewport, barra e canto — o snippet não os escreve', () => {
    const output = scrollAreaSource();
    expect(output).not.toContain('ScrollAreaViewport');
    expect(output).not.toContain('scroll-area-viewport');
    expect(output).not.toContain('tabindex');
  });
});

describe('a altura é a lição do componente', () => {
  it('toda transform que promete rolagem declara o tamanho da janela', () => {
    // Sem limite não há transbordo, e sem transbordo não há rolagem.
    const withScroll = ALL.filter((s) => s !== scrollAreaNoLimitSource());
    for (const output of withScroll) expect(output).toMatch(/<ScrollArea[^>]*size="/);
  });

  it('nenhuma transform crava medida em style inline', () => {
    for (const output of ALL) expect(output).not.toContain('style=');
  });

  it('a story do erro de uso mostra as duas áreas, uma sem tamanho', () => {
    const output = scrollAreaNoLimitSource();
    expect(output).toContain('<ScrollArea class="nds-w-full">');
    expect(output).toContain('<ScrollArea size="sm" class="nds-w-full">');
  });
});

describe('transforms das stories de variante', () => {
  it('o eixo vertical não declara barra nenhuma — o componente já a monta', () => {
    const output = scrollAreaVerticalSource();
    expect(output).toContain('type="always"');
    expect(output).not.toContain('<ScrollBar');
    expect(output).not.toContain('ScrollBar }');
  });

  it('o eixo horizontal declara a barra e usa linha sem quebra', () => {
    const output = scrollAreaHorizontalSource();
    expect(output).toContain('<ScrollBar orientation="horizontal" />');
    expect(output).toContain(`import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'`);
    // `nds-cluster` quebra linha quando aperta: o conteúdo caberia e não haveria
    // o que rolar. `nds-row` é a linha que não quebra.
    expect(output).toContain('<div class="nds-row nds-p-4" data-spacing="md">');
    expect(output).not.toContain('nds-cluster');
    // O item que não encolhe é o que empurra a faixa para além do viewport.
    expect(output).toContain('nds-shrink-0');
  });

  it('o bidirecional monta as duas barras com uma só declaração', () => {
    const output = scrollAreaBidirecionalSource();
    expect([...output.matchAll(/<ScrollBar/g)]).toHaveLength(1);
    expect(output).toContain('<table class="nds-border-collapse nds-text-body">');
  });
});

describe('transforms das stories de estado', () => {
  it('o ocioso não escreve o modo — hover é o padrão do componente', () => {
    expect(scrollAreaOciosoSource()).toContain('<ScrollArea size="lg" class="nds-w-full">');
  });

  it('cada modo de exibição da barra aparece como o que é: uma prop', () => {
    expect(scrollAreaSempreSource()).toContain('type="always"');
    expect(scrollAreaAoRolarSource()).toContain('type="scroll"');
    // O tempo de espera tem padrão no componente: repeti-lo ensinaria ruído.
    expect(scrollAreaAoRolarSource()).not.toContain('scroll-hide-delay');
  });

  it('o conteúdo focável é uma navegação nomeada dentro da área', () => {
    const output = scrollAreaContentFocavelSource();
    expect(output).toContain('<nav aria-label="Ações" class="nds-p-4">');
    expect(output).toContain('<ul class="nds-stack nds-list-none" data-spacing="xs">');
    // `nds-list-none` já zera marcador, padding e margem da lista.
    expect(output).not.toContain('padding: 0');
  });
});

describe('transforms das stories de composição', () => {
  it('a sidebar rola ao lado de uma área que não se move', () => {
    const output = scrollAreaSidebarSource();
    expect(output).toContain('<aside class="nds-w-xs nds-shrink-0');
    expect(output).toContain('<main class="nds-flex-1');
    expect(output).toContain('aria-label="Seções da documentação"');
  });

  it('a miniatura da galeria tira a altura de uma proporção', () => {
    const output = scrollAreaGaleriaSource();
    expect(output).toContain('<div class="nds-aspect-16-9 nds-bg-muted"></div>');
    expect(output).toContain('<figcaption class="nds-p-2 nds-text-caption">{{ imagem }}</figcaption>');
  });

  it('a tabela ampla percorre colunas e células em vez de repetir a marcação', () => {
    const output = scrollAreaTableSource();
    expect(output).toContain('v-for="(pessoa, i) in pessoas"');
    expect(output).toContain('v-for="(celula, c) in pessoa"');
    // Uma linha por célula seria sete <td> quase iguais no painel.
    expect([...output.matchAll(/<td/g)]).toHaveLength(1);
    expect(output).toContain('<ScrollBar orientation="horizontal" />');
  });
});

describe('o andaime das stories não entra no snippet', () => {
  it('nenhuma transform cita a sonda de transbordo nem o molde da story', () => {
    for (const output of ALL) {
      expect(output).not.toContain('transbordo');
      expect(output).not.toContain('scroll-area-probe');
      expect(output).not.toContain('wrapTemplate');
    }
  });
});
