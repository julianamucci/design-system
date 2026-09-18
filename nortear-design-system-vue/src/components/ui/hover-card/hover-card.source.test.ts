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
          <div class="nds-cluster nds-size-10 nds-shrink-0 nds-rounded-full nds-bg-muted nds-text-body nds-font-medium" data-align="center" data-justify="center" aria-hidden="true">JS</div>
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
    const output = hoverCardSource('', {
      args: { side: 'bottom', align: 'center', openDelay: 600, closeDelay: 300, defaultOpen: false },
    });
    expect(output).toContain('<HoverCard>');
    expect(output).toContain('<HoverCardContent>');
    expect(output).not.toContain('open-delay');
    expect(output).not.toContain('default-open');
  });

  it('escreve lado e alinhamento só quando o control os tira do padrão', () => {
    const output = hoverCardSource('', { args: { side: 'top', align: 'start' } });
    expect(output).toContain('<HoverCardContent side="top" align="start">');
  });

  it('a espera entra no markup quando difere dos 600/300 do componente', () => {
    const output = hoverCardSource('', { args: { openDelay: 150, closeDelay: 100 } });
    expect(output).toContain('<HoverCard :open-delay="150" :close-delay="100">');
  });

  it('não copia o :key que a story usa só para remontar ao trocar o control', () => {
    // Instrumento do Storybook: `default-open` só é lido na montagem. Copiado,
    // viraria uma linha sem sentido no código de quem consome.
    expect(hoverCardSource('', { args: { defaultOpen: true } })).not.toContain(':key');
  });

  it('ignora control que não é string — o espião de ação vira ruído no painel', () => {
    const output = hoverCardSource('', {
      args: { triggerLabel: (() => {}) as never, side: (() => {}) as never },
    });
    expect(output).not.toContain('function');
    expect(output).not.toContain('side=');
    // Cair no padrão do meta é melhor que um gatilho sem texto: sem rótulo o
    // painel perde o nome acessível, que sai justamente do gatilho.
    expect(output).toContain('>@joana</a>');
  });

  it('o gatilho é um link de verdade — no toque não existe hover', () => {
    expect(hoverCardSource()).toContain('href="/users/joana"');
  });
});

describe('transforms das stories de tempo', () => {
  it('a espera padrão não escreve atraso nenhum no markup', () => {
    const output = hoverCardDefaultSource();
    expect(output).toContain('<HoverCard>');
    expect(output).not.toContain('open-delay');
    expect(output).not.toContain('close-delay');
  });

  it('a espera curta escreve as duas, e é o que a distingue', () => {
    expect(hoverCardWaitCurtaSource()).toContain(
      '<HoverCard :open-delay="150" :close-delay="100">',
    );
  });
});

describe('transforms das stories de estado', () => {
  it('fechado e aberto compartilham a marcação, sem estado escrito nela', () => {
    const output = hoverCardPerfilSource();
    // Abrir é interação: `default-open` no snippet ensinaria a nascer aberto,
    // que é recurso de captura visual da story, não uso real.
    expect(output).not.toContain('default-open');
    // O gatilho não é um menu que o leitor comanda.
    expect(output).not.toContain('aria-expanded');
    expect(output).not.toContain('aria-haspopup');
  });

  it('o controlado liga o estado externo nos dois sentidos', () => {
    const output = hoverCardControlledSource();
    expect(output).toContain('const aberto = ref(false)');
    expect(output).toContain('<HoverCard v-model:open="aberto">');
    expect(output).toContain('@click="aberto = true"');
  });

  it('os botões do controlado têm nomes próprios, e não os do gatilho', () => {
    const output = hoverCardControlledSource();
    // Dois controles com o mesmo nome acessível são ambíguos em leitor de tela.
    expect(output).toContain('>Abrir pelo estado externo</Button>');
    expect(output).toContain('>Fechar pelo estado externo</Button>');
  });
});

describe('transforms das stories de composição', () => {
  it('a prévia de link mostra origem, título e descrição do destino', () => {
    const output = hoverCardPreviaDeLinkSource();
    expect(output).toContain('design-system.dev/overlays');
    expect(output).toContain('Guia de overlays acessíveis');
  });

  it('o gatilho de definição LEVA ao verbete no glossário', () => {
    // D15: o caminho alternativo do C8 é o destino do próprio gatilho, e o
    // snippet tem de ensinar isso — quem copiar um `<button>` daqui publica a
    // composição sem saída nenhuma em touch.
    const output = hoverCardDefinicaoSource();
    expect(output).toContain('<a href="/glossario/wcag-2-2-aa"');
    expect(output).not.toContain('<button');
  });

  it('o gatilho da métrica LEVA à página da métrica', () => {
    const output = hoverCardMetricaSource();
    expect(output).toContain('<a href="/metricas/conversao"');
    expect(output).not.toContain('<button');
  });

  it('os dois gatilhos de explicação largam as utilitárias que zeravam o botão', () => {
    // `nds-bg-transparent`, `nds-border-none` e `nds-p-0` existiam para
    // neutralizar o cromo nativo de `<button>`. Num `<a>` não neutralizam nada,
    // e copiadas viram três classes que o leitor não sabe por que estão ali.
    for (const fn of [hoverCardDefinicaoSource, hoverCardMetricaSource]) {
      const output = fn();
      // O que DISTINGUE "isto explica alguma coisa" de um link de navegação
      // continua no lugar.
      expect(output).toContain('nds-underline-dotted');
      expect(output).toContain('nds-cursor-help');
      expect(output).not.toContain('nds-bg-transparent');
      expect(output).not.toContain('nds-border-none');
      expect(output).not.toContain('nds-p-0');
    }
  });

  it('o painel de definição não declara rótulo próprio', () => {
    // O painel não tem papel desde 2026-09-02, e nome próprio em elemento sem
    // papel é `aria-prohibited-attr` no axe. Quem descreve é o gatilho, por
    // `aria-describedby` — escrito pelo componente, não pelo snippet.
    expect(hoverCardDefinicaoSource()).toContain('<HoverCardContent>');
    expect(hoverCardDefinicaoSource()).not.toContain('aria-label');
  });

  it('na métrica a cor semântica fica no número, não no texto corrido', () => {
    const output = hoverCardMetricaSource();
    expect(output).toContain('<span class="nds-text-caption nds-font-medium nds-text-success">3,42%</span>');
    const description = output.slice(output.indexOf('Cliques no CTA'));
    expect(description).not.toContain('nds-text-success');
  });

  it('os quatro lados saem de um laço sobre dados, não de quatro blocos copiados', () => {
    const output = hoverCardLadosSource();
    expect(output).toContain('v-for="l in lados"');
    expect(output).toContain(':side="l.side"');
    expect([...output.matchAll(/<HoverCard>/g)]).toHaveLength(1);
    // Sem nome próprio em painel nenhum: sem `role`, `aria-label` ali é
    // `aria-prohibited-attr` no axe. Quem distingue os quatro é o gatilho de
    // cada um, que os descreve por `aria-describedby`.
    expect(output).not.toContain('aria-label');
  });

  it('a largura do conjunto de lados vem de utilitária, não de style inline', () => {
    const output = hoverCardLadosSource();
    expect(output).toContain('class="nds-grid nds-max-w-lg"');
    expect(output).not.toContain('style=');
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
