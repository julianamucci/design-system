import { describe, expect, it } from 'vitest';
import {
  hoverCardClassNameExtraSource,
  hoverCardDefinicaoSource,
  hoverCardWaitDefaultSource,
  hoverCardLadosSource,
  hoverCardMetricaSource,
  hoverCardPerfilSource,
  hoverCardPreviaDeLinkSource,
  hoverCardSource,
} from './hover-card.source';

describe('hoverCardSource', () => {
  it('sem args, entrega o gatilho dentro de uma frase e o cartão preso a ele', () => {
    expect(hoverCardSource()).toBe(
      `<script lang="ts">
  import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
  } from "@/components/ui/hover-card";
</script>

<p class="nds-text-body nds-max-w-sm">
  Comentário de
  <HoverCard>
    <HoverCardTrigger>
      {#snippet child({ props })}
        <a href="/users/joana" {...props}>@joana</a>
      {/snippet}
    </HoverCardTrigger>
    <HoverCardContent>
      <div class="nds-stack" data-spacing="xs">
        <p class="nds-text-body nds-font-medium nds-leading-none">Joana Silva</p>
        <p class="nds-text-caption nds-text-muted-foreground">
          Espera padrão: 600ms para abrir e 300ms para fechar.
        </p>
      </div>
    </HoverCardContent>
  </HoverCard>
  há 2 horas.
</p>`,
    );
  });

  it('a espera padrão do componente não é escrita no markup', () => {
    const defaultDelays = hoverCardSource('', { args: { openDelay: 600, closeDelay: 300 } });
    expect(defaultDelays).not.toContain('openDelay');
    expect(defaultDelays).not.toContain('closeDelay');

    const shortDelays = hoverCardSource('', { args: { openDelay: 150, closeDelay: 100 } });
    expect(shortDelays).toContain('<HoverCard openDelay={150} closeDelay={100}>');
  });

  it('acompanha os controls de posicionamento, e só escreve o que difere do padrão', () => {
    expect(hoverCardSource()).not.toContain('side=');
    expect(hoverCardSource()).not.toContain('align=');
    expect(hoverCardSource('', { args: { side: 'top', align: 'start', sideOffset: 12 } })).toContain(
      '<HoverCardContent side="top" align="start" sideOffset={12}>',
    );
  });

  it('a abertura inicial é a prop do componente; a externa vira estado ligado', () => {
    const inicial = hoverCardSource('', { args: { defaultOpen: true } });
    expect(inicial).toContain('<HoverCard defaultOpen>');
    expect(inicial).not.toContain('$state');

    const externo = hoverCardSource('', { args: { open: true } });
    expect(externo).toContain('let aberto = $state(true);');
    expect(externo).toContain('<HoverCard bind:open={aberto}>');
    // Com estado de fora, `defaultOpen` só duplicaria a fonte da verdade.
    expect(externo).not.toContain('defaultOpen');
  });

  it('acompanha os controls do gatilho', () => {
    expect(hoverCardSource('', { args: { triggerLabel: '@caio', href: '/users/caio' } })).toContain(
      '<a href="/users/caio" {...props}>@caio</a>',
    );
  });

  it('o painel não carrega nome próprio em snippet nenhum', () => {
    // O painel não tem papel desde 2026-09-02, e nome próprio em elemento sem
    // papel é `aria-prohibited-attr` no axe. Quem descreve é o gatilho, por
    // `aria-describedby` — escrito pelo componente, não pelo snippet.
    expect(hoverCardSource()).not.toContain('aria-label');
    expect(hoverCardSource('', { args: { variant: 'definition' } })).not.toContain('aria-label');
  });

  it('troca o miolo do cartão conforme o control de composição', () => {
    expect(hoverCardSource('', { args: { variant: 'linkPreview' } })).toContain(
      'design-system.dev/overlays',
    );
    expect(hoverCardSource('', { args: { variant: 'metric' } })).toContain(
      'Largest Contentful Paint',
    );
  });
});

describe('transforms das stories de variação e composição', () => {
  it('nenhum override abre o cartão na montagem — isso é andaime da captura', () => {
    for (const fn of [
      hoverCardWaitDefaultSource,
      hoverCardPerfilSource,
      hoverCardPreviaDeLinkSource,
      hoverCardDefinicaoSource,
      hoverCardMetricaSource,
      hoverCardClassNameExtraSource,
      hoverCardLadosSource,
    ]) {
      expect(fn(), fn.name).not.toContain('defaultOpen');
      expect(fn(), fn.name).not.toContain('bind:open');
    }
  });

  it('a espera padrão não aparece como número em lugar nenhum do markup', () => {
    const saida = hoverCardWaitDefaultSource();
    expect(saida).not.toContain('openDelay');
    expect(saida).not.toContain('closeDelay');
  });

  it('o perfil traz o avatar escondido do leitor de tela, e o link continua navegável', () => {
    const saida = hoverCardPerfilSource();
    expect(saida).toContain('aria-hidden="true"');
    expect(saida).toContain('<a href="/users/joana" {...props}>@joana</a>');
  });

  it('a prévia de link aponta o gatilho para o destino externo', () => {
    const saida = hoverCardPreviaDeLinkSource();
    expect(saida).toContain('<a href="https://design-system.dev" {...props}>design-system.dev</a>');
  });

  it('a definição usa botão, porque não há para onde navegar', () => {
    const saida = hoverCardDefinicaoSource();
    // Sem `type="button"`, o mesmo gatilho dentro de um formulário o enviaria.
    expect(saida).toContain('<button type="button" {...props}>WCAG 2.2 AA</button>');
    expect(saida).not.toContain('<a href');
    // O painel não carrega nome: sem papel, `aria-label` é `aria-prohibited-attr`.
    expect(saida).not.toContain('aria-label');
  });

  it('a métrica deixa a cor semântica no número, e não no texto corrido', () => {
    const saida = hoverCardMetricaSource();
    expect(saida).toContain('<span class="nds-text-caption nds-font-medium nds-text-success">1.8s</span>');
    expect(saida).toContain('<p class="nds-text-caption nds-text-muted-foreground">');
    expect(saida).not.toContain('aria-label');
  });

  it('a classe extra convive com a classe do componente, não a substitui', () => {
    expect(hoverCardClassNameExtraSource()).toContain(
      '<HoverCardContent class="nds-w-md nds-text-center">',
    );
  });

  it('os quatro lados saem de uma lista, e nenhum painel carrega nome próprio', () => {
    const saida = hoverCardLadosSource();
    expect(saida).toContain('{#each LADOS as lado (lado.side)}');
    expect(saida).toContain('<HoverCardContent side={lado.side}>');
    expect(saida).not.toContain('aria-label');
    expect(saida.match(/side: "/g)).toHaveLength(4);
  });
});
