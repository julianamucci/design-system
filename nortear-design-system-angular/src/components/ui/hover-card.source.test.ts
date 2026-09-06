import { describe, expect, it } from 'vitest';
import { hoverCardPlaygroundSource } from './hover-card.source';

/**
 * O painel Code imprime o `template` da story literalmente, com os bindings
 * ligados aos args — quem lê copiaria código que só compila dentro da story. O
 * `transform` devolve o uso real, e é isto que estes casos guardam.
 *
 * As outras quatro stacks já tinham este teste; o angular era a única sem, e é
 * ele que impede a story e o snippet de divergirem em silêncio. Nesta campanha
 * a divergência apareceu duas vezes em outros componentes: o preview mudou, o
 * snippet ao lado continuou ensinando a forma antiga, e nenhum portão viu.
 */
describe('hoverCardPlaygroundSource', () => {
  it('devolve o componente que se escreve, e não o template da story', () => {
    const code = hoverCardPlaygroundSource();
    expect(code).toContain("import { NDS_HOVER_CARD } from '@/components/ui/hover-card';");
    expect(code).toContain('<span ndsHoverCard>');
    expect(code).toContain('ndsHoverCardTrigger');
    expect(code).toContain('<ng-template ndsHoverCardContent');
    // O que o renderer imprimiria sozinho: binding para args e atributos que a
    // diretiva escreve em runtime.
    expect(code).not.toContain('args.');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('[attr.');
  });

  it('omite atraso e posição quando são o padrão', () => {
    const code = hoverCardPlaygroundSource('', {
      args: { openDelay: 600, closeDelay: 300, side: 'bottom', align: 'center' },
    });
    // Repetir valor padrão no snippet ensina ruído: quem copia passa a declarar
    // o que já vem de graça, e some a informação de que existe um padrão.
    expect(code).not.toContain('[openDelay]');
    expect(code).not.toContain('[closeDelay]');
    // A asserção olha a TAG, não a substring: o cartão de perfil traz
    // `data-align="start"` no cluster, e um `not.toContain('align=')` casaria
    // ali dentro. Foi o que esta primeira versão fez, e o caso reprovou por
    // defeito da asserção, não do construtor.
    expect(code).toContain('<ng-template ndsHoverCardContent>');
  });

  it('imprime atraso e posição quando diferem do padrão', () => {
    const code = hoverCardPlaygroundSource('', {
      args: { openDelay: 500, closeDelay: 200, side: 'right', align: 'start' },
    });
    expect(code).toContain('[openDelay]="500"');
    expect(code).toContain('[closeDelay]="200"');
    expect(code).toContain('side="right"');
    expect(code).toContain('align="start"');
  });

  it('leva o rótulo do gatilho que veio dos controls', () => {
    const code = hoverCardPlaygroundSource('', { args: { triggerLabel: '@maria' } });
    expect(code).toContain('>@maria</a>');
  });

  it('o gatilho continua um link navegável', () => {
    // É a lição do par 1 do Do & Don't desta página: o cartão complementa o
    // link, não o substitui. Um snippet que ensinasse `<span>` no gatilho
    // ensinaria a versão que quebra para quem usa toque.
    const code = hoverCardPlaygroundSource();
    expect(code).toContain('href="/users/joana"');
    expect(code).toMatch(/<a\s+[^>]*ndsHoverCardTrigger/s);
  });
});
