import { describe, expect, it } from 'vitest';
import {
  hoverCardClassNameExtraSource,
  hoverCardControlledSource,
  hoverCardDefinicaoSource,
  hoverCardWaitCurtaSource,
  hoverCardLadosSource,
  hoverCardMetricaSource,
  hoverCardDefaultSource,
  hoverCardPerfilSource,
  hoverCardPreviaDeLinkSource,
  hoverCardSource,
} from './hover-card.source';

describe('hoverCardSource', () => {
  it('sem args, entrega a forma canônica com o gatilho dentro de uma frase', () => {
    expect(hoverCardSource()).toBe(
      `<script setup lang="ts">
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
</script>

<template>
  <p class="nds-text-body nds-max-w-sm">
    Comentário de
    <HoverCard>
      <HoverCardTrigger as-child>
        <a href="/users/joana" class="nds-text-primary nds-font-medium nds-hover-underline">@joana</a>
      </HoverCardTrigger>
      <HoverCardContent>
        <div class="nds-cluster" data-spacing="sm" data-align="start">
          <div class="nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted" aria-hidden="true"></div>
          <div class="nds-stack" data-spacing="xs">
            <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
            <p class="nds-text-caption nds-text-muted-foreground">Designer · 142 seguidores</p>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
    há 2 horas.
  </p>
</template>`,
    );
  });

  it('omite lado, alinhamento e esperas quando batem com o padrão do componente', () => {
    const saida = hoverCardSource('', {
      args: { side: 'bottom', align: 'center', openDelay: 600, closeDelay: 300, defaultOpen: false },
    });
    expect(saida).toContain('<HoverCard>');
    expect(saida).toContain('<HoverCardContent>');
    expect(saida).not.toContain('open-delay');
    expect(saida).not.toContain('default-open');
  });

  it('escreve lado e alinhamento só quando o control os tira do padrão', () => {
    const saida = hoverCardSource('', { args: { side: 'top', align: 'start' } });
    expect(saida).toContain('<HoverCardContent side="top" align="start">');
  });

  it('a espera entra no markup quando difere dos 600/300 do componente', () => {
    const saida = hoverCardSource('', { args: { openDelay: 150, closeDelay: 100 } });
    expect(saida).toContain('<HoverCard :open-delay="150" :close-delay="100">');
  });

  it('não copia o :key que a story usa só para remontar ao trocar o control', () => {
    // Instrumento do Storybook: `default-open` só é lido na montagem. Copiado,
    // viraria uma linha sem sentido no código de quem consome.
    expect(hoverCardSource('', { args: { defaultOpen: true } })).not.toContain(':key');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const saida = hoverCardSource('', {
      args: { triggerLabel: (() => {}) as never, side: (() => {}) as never },
    });
    expect(saida).not.toContain('function');
    expect(saida).not.toContain('side=');
    // Cair no padrão do meta é melhor que um gatilho sem texto: sem rótulo o
    // painel perde o nome acessível, que sai justamente do gatilho.
    expect(saida).toContain('>@joana</a>');
  });

  it('o gatilho é um link de verdade — no toque não existe hover', () => {
    expect(hoverCardSource()).toContain('href="/users/joana"');
  });
});

describe('transforms das stories de tempo', () => {
  it('a espera padrão não escreve atraso nenhum no markup', () => {
    const saida = hoverCardDefaultSource();
    expect(saida).toContain('<HoverCard>');
    expect(saida).not.toContain('open-delay');
    expect(saida).not.toContain('close-delay');
  });

  it('a espera curta escreve as duas, e é o que a distingue', () => {
    expect(hoverCardWaitCurtaSource()).toContain(
      '<HoverCard :open-delay="150" :close-delay="100">',
    );
  });
});

describe('transforms das stories de estado', () => {
  it('fechado e aberto compartilham a marcação, sem estado escrito nela', () => {
    const saida = hoverCardPerfilSource();
    // Abrir é interação: `default-open` no snippet ensinaria a nascer aberto,
    // que é recurso de captura visual da story, não uso real.
    expect(saida).not.toContain('default-open');
    // O gatilho não é um menu que o leitor comanda.
    expect(saida).not.toContain('aria-expanded');
    expect(saida).not.toContain('aria-haspopup');
  });

  it('o controlado liga o estado externo nos dois sentidos', () => {
    const saida = hoverCardControlledSource();
    expect(saida).toContain('const aberto = ref(false)');
    expect(saida).toContain('<HoverCard v-model:open="aberto">');
    expect(saida).toContain('@click="aberto = true"');
  });

  it('os botões do controlado têm nomes próprios, e não os do gatilho', () => {
    const saida = hoverCardControlledSource();
    // Dois controles com o mesmo nome acessível são ambíguos em leitor de tela.
    expect(saida).toContain('>Abrir pelo estado externo</Button>');
    expect(saida).toContain('>Fechar pelo estado externo</Button>');
  });
});

describe('transforms das stories de composição', () => {
  it('a prévia de link mostra origem, título e descrição do destino', () => {
    const saida = hoverCardPreviaDeLinkSource();
    expect(saida).toContain('design-system.dev/overlays');
    expect(saida).toContain('Guia de overlays acessíveis');
  });

  it('o gatilho de definição é botão, e não envia formulário', () => {
    const saida = hoverCardDefinicaoSource();
    expect(saida).toContain('<button type="button"');
    expect(saida).not.toContain('<a href');
  });

  it('o painel de definição declara o próprio rótulo', () => {
    // Sem ele o nome cairia no texto do gatilho e repetiria a sigla sem dizer
    // o que o cartão traz.
    expect(hoverCardDefinicaoSource()).toContain(
      '<HoverCardContent aria-label="Definição de WCAG 2.2 AA">',
    );
  });

  it('na métrica a cor semântica fica no número, não no texto corrido', () => {
    const saida = hoverCardMetricaSource();
    expect(saida).toContain('<span class="nds-text-caption nds-font-medium nds-text-success">1.8s</span>');
    const descricao = saida.slice(saida.indexOf('Tempo até o maior elemento'));
    expect(descricao).not.toContain('nds-text-success');
  });

  it('os quatro lados saem de um laço sobre dados, não de quatro blocos copiados', () => {
    const saida = hoverCardLadosSource();
    expect(saida).toContain('v-for="l in lados"');
    expect(saida).toContain(':side="l.side"');
    expect([...saida.matchAll(/<HoverCard>/g)]).toHaveLength(1);
    // Cada painel com nome próprio: quatro cartões com o mesmo nome acessível
    // seriam indistinguíveis no leitor de tela.
    expect(saida).toContain(`:aria-label="'Cartão ' + l.rotulo + ' do gatilho'"`);
  });

  it('a largura do conjunto de lados vem de utilitária, não de style inline', () => {
    const saida = hoverCardLadosSource();
    expect(saida).toContain('class="nds-grid nds-max-w-lg"');
    expect(saida).not.toContain('style=');
  });

  it('a classe extra convive com a do componente e troca a largura', () => {
    expect(hoverCardClassNameExtraSource()).toContain(
      '<HoverCardContent class="nds-w-md nds-text-center">',
    );
  });

  it('nenhuma composição carrega o style que a story usa para dar espaço ao portal', () => {
    // `contain: layout; min-height: 250px` existe para o painel caber no canvas
    // centralizado do Storybook — é andaime de captura, não parte do uso.
    for (const fn of [
      hoverCardPerfilSource,
      hoverCardPreviaDeLinkSource,
      hoverCardDefinicaoSource,
      hoverCardMetricaSource,
      hoverCardClassNameExtraSource,
    ]) {
      expect(fn()).not.toContain('style=');
      expect(fn()).not.toContain('min-height');
    }
  });
});
