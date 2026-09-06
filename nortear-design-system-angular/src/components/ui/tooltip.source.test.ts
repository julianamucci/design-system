import { describe, expect, it } from 'vitest';
import { tooltipPlaygroundSource } from './tooltip.source';

/**
 * O painel Code imprime o `template` da story literalmente, com os bindings
 * ligados aos args — quem lê copiaria código que só compila dentro da story. O
 * `transform` devolve o uso real, e é isto que estes casos guardam.
 *
 * As outras quatro stacks já tinham este teste. A ausência dele aqui custou
 * caro: quando as stories foram alinhadas e os construtores não, o gatilho do
 * Playground passou a renderizar `outline` enquanto o snippet ao lado ensinava
 * `ghost`, e nenhum portão viu. Vue e Svelte, que já tinham o teste, não
 * divergiram.
 */
describe('tooltipPlaygroundSource', () => {
  it('devolve o componente que se escreve, e não o template da story', () => {
    const code = tooltipPlaygroundSource();
    expect(code).toContain("import { NDS_TOOLTIP } from '@/components/ui/tooltip';");
    expect(code).toContain("import { NdsButton } from '@/components/ui/button';");
    expect(code).toContain('<span ndsTooltip>');
    expect(code).toContain('<ng-template ndsTooltipContent>');
    // O que só existe dentro da story: binding para os args do Storybook,
    // espião de output e os atributos que a diretiva escreve em runtime.
    expect(code).not.toContain('args.');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('[attr.');
    expect(code).not.toContain('openChange');
    expect(code).not.toContain('[open]');
  });

  it('omite lado, alinhamento e distância quando são os padrões', () => {
    const code = tooltipPlaygroundSource('', {
      args: { side: 'top', align: 'center', sideOffset: 4 },
    });
    // Repetir valor padrão no snippet ensina ruído: quem copia passa a declarar
    // o que já vem de graça, e some a informação de que existe um padrão.
    //
    // A asserção olha a TAG inteira, e não a substring `align=`: um
    // `not.toContain('align=')` casaria num `data-align="start"` legítimo em
    // qualquer cluster do snippet, reprovando por defeito da asserção.
    expect(code).toContain('<ng-template ndsTooltipContent>');
  });

  it('imprime lado, alinhamento e distância quando diferem, com o valor do control', () => {
    const code = tooltipPlaygroundSource('', {
      args: { side: 'right', align: 'start', sideOffset: 12 },
    });
    expect(code).toContain(
      '<ng-template ndsTooltipContent side="right" align="start" [sideOffset]="12">',
    );
  });

  it('o texto do balão vem dos controls', () => {
    const code = tooltipPlaygroundSource('', { args: { label: 'Duplicar' } });
    expect(code).toContain('>Duplicar</ng-template>');
    expect(code).not.toContain('Salvar (Ctrl+S)');
  });

  it('o gatilho é outline, a mesma variante que a story do Playground renderiza', () => {
    // Este é o caso que faltava. O commit que alinhou as stories não tocou nos
    // construtores, e o snippet seguiu ensinando `ghost` ao lado de um preview
    // `outline` — divergência que só um caso sobre a variante alcança.
    const code = tooltipPlaygroundSource();
    expect(code).toContain(
      '<button ndsTooltipTrigger ndsButton variant="outline" size="icon" aria-label="Salvar">',
    );
    expect(code).not.toContain('variant="ghost"');
  });

  it('o provider entra uma vez só, no root, e é ele que carrega a espera', () => {
    // A espera é comum a todos os balões da aplicação: declará-la no balão
    // ensinaria a duplicá-la em cada gatilho.
    const code = tooltipPlaygroundSource('', { args: { delay: 600 } });
    expect(code.match(/ndsTooltipProvider/g)).toHaveLength(1);
    expect(code).toContain('<div ndsTooltipProvider [delay]="600">');
    expect(code).not.toContain('[delay]="0"');
  });

  it('o botão só-ícone carrega o próprio nome — o balão não é o único portador', () => {
    // Quem chega pelo toque nunca vê o balão: sem o `aria-label` no botão, o
    // gatilho fica anônimo para quem não usa mouse.
    const code = tooltipPlaygroundSource();
    expect(code).toContain('aria-label="Salvar"');
    // E o ícone sai da árvore de acessibilidade, para não competir com o rótulo.
    expect(code).toContain('aria-hidden="true"');
  });
});
