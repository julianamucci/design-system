import { describe, expect, it } from 'vitest';
import { popoverPlaygroundSource } from './popover.source';

/**
 * O painel Code imprime o `template` da story literalmente, com os bindings
 * ligados aos args e o `(openChange)` do espião — quem lê copiaria código que só
 * compila dentro da story. O `transform` devolve o uso real, e é isto que estes
 * casos guardam.
 *
 * A varredura genérica do `source-snippets.test.ts` já prova coerência de
 * import; o que ela NÃO alcança é se o snippet ensina o certo. Nesta campanha a
 * distância apareceu aqui mesmo: o snippet do angular prometia `Limpar` /
 * `Aplicar` no rodapé enquanto o preview ao lado mostrava `Cancelar` / `Salvar`.
 * Nenhum portão viu, e quem lê copia o snippet, não o preview.
 */

/** A abertura da tag do painel — do `<ng-template` até o `>` que a fecha. */
function panelTag(output: string): string {
  const start = output.indexOf('<ng-template ndsPopoverContent');
  expect(start).toBeGreaterThan(-1);
  return output.slice(start, output.indexOf('>', start) + 1);
}

/** O bloco de ações do rodapé, do cluster encostado à direita até fechá-lo. */
function footer(output: string): string {
  const start = output.indexOf('data-justify="end"');
  expect(start).toBeGreaterThan(-1);
  return output.slice(start, output.indexOf('</div>', start));
}

describe('popoverPlaygroundSource', () => {
  it('devolve o componente que se escreve, e não o template da story', () => {
    const code = popoverPlaygroundSource();
    expect(code).toContain("import { NDS_POPOVER } from '@/components/ui/popover';");
    expect(code).toContain("import { NdsButton } from '@/components/ui/button';");
    expect(code).toContain('imports: [...NDS_POPOVER, NdsButton]');
    expect(code).toContain('<div ndsPopover');
    expect(code).toContain('<button ndsPopoverTrigger ndsButton variant="outline">');
    expect(code).toContain('<ng-template ndsPopoverContent');

    // O que o renderer imprimiria sozinho: interpolação de args, os bindings
    // que a story usa para ligar os controls e o espião de action.
    expect(code).not.toContain('args.');
    expect(code).not.toContain('{{');
    expect(code).not.toContain('(openChange)');
    expect(code).not.toContain('[side]');
    expect(code).not.toContain('[align]');
    // Atributos que as diretivas escrevem em runtime — e que no Angular são
    // disputados pelo host binding, então o snippet não pode ensiná-los.
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('[attr.');
  });

  it('omite side, align e sideOffset quando são o padrão do componente', () => {
    const code = popoverPlaygroundSource('', {
      args: { side: 'bottom', align: 'center', sideOffset: 4 },
    });
    // Repetir valor padrão ensina ruído: quem copia passa a declarar o que já
    // vem de graça, e some a informação de que existe um padrão.
    //
    // A asserção é sobre a TAG inteira, não sobre a substring: `data-justify`,
    // `data-spacing` e o `variant` dos botões vivem no mesmo texto, e um
    // `not.toContain('align=')` solto casaria fora do painel — foi assim que a
    // primeira versão do teste do hover-card reprovou por defeito da asserção.
    expect(panelTag(code)).toBe('<ng-template ndsPopoverContent>');
  });

  it('imprime side, align e sideOffset quando diferem do padrão', () => {
    const code = popoverPlaygroundSource('', {
      args: { side: 'right', align: 'start', sideOffset: 12 },
    });
    expect(panelTag(code)).toBe(
      '<ng-template ndsPopoverContent side="right" align="start" [sideOffset]="12">',
    );
  });

  it('a distância é binding e a posição é atributo — cada uma na sua forma', () => {
    // `sideOffset` é número: escrito como `sideOffset="12"` chegaria à diretiva
    // como a STRING "12". A posição é união de strings e não precisa de colchete.
    const code = popoverPlaygroundSource('', { args: { sideOffset: 16, side: 'top' } });
    expect(code).toContain('[sideOffset]="16"');
    expect(code).toContain('side="top"');
    expect(code).not.toContain('sideOffset="16"');
  });

  it('defaultOpen entra na raiz quando ligado, e some quando é o padrão', () => {
    expect(popoverPlaygroundSource('', { args: { defaultOpen: false } })).toContain(
      '<div ndsPopover>',
    );
    expect(popoverPlaygroundSource('', { args: { defaultOpen: true } })).toContain(
      '<div ndsPopover [defaultOpen]="true">',
    );
  });

  it('leva o rótulo do gatilho que veio dos controls', () => {
    const code = popoverPlaygroundSource('', { args: { triggerLabel: 'Preferências' } });
    expect(code).toContain('>Preferências</button>');
    expect(code).not.toContain('>Abrir popover</button>');
  });
});

describe('as lições do componente', () => {
  it('o painel COM título se nomeia pelo título, e não carrega aria-label junto', () => {
    // O nome acessível sai do `ndsPopoverTitle`, que a diretiva liga por
    // `aria-labelledby`. Com título não existe `aria-label`: seriam dois
    // contratos de nome no mesmo painel, e a story ao lado reprova nisso.
    //
    // A contrapartida é o painel SEM título visível, que aí sim se nomeia por
    // `aria-label` — é o motivo de a variante `default` existir, para o conteúdo
    // livre. Este construtor é o do Playground, e o Playground tem cabeçalho.
    const code = popoverPlaygroundSource();
    expect(code).toContain('<h3 ndsPopoverTitle>Configurações de exibição</h3>');
    expect(code).toContain('<p ndsPopoverDescription>');
    expect(code).not.toContain('aria-label');
  });

  it('o rodapé é Cancelar ghost + ação primária, nessa ordem', () => {
    // Esta é a asserção que a campanha pagou: o snippet prometia `Limpar` /
    // `Aplicar` enquanto o preview mostrava `Salvar`.
    //
    // A ação de descarte é a discreta e vem primeiro; a que confirma é a única
    // com peso visual, e o peso vem da AUSÊNCIA de `variant` — a primária é o
    // padrão do NdsButton. Escrever `variant="default"` ali ensinaria ruído.
    const actions = footer(popoverPlaygroundSource());
    expect(actions).toContain('ndsButton variant="ghost" size="sm">Cancelar<');
    expect(actions).toContain('ndsButton size="sm">Salvar<');
    expect(actions.match(/variant=/g)).toHaveLength(1);
    expect(actions).not.toContain('Limpar');
    expect(actions).not.toContain('Aplicar');
  });

  it('as ações fecham pelo ndsPopoverClose, não por estado escrito à mão', () => {
    // É o que separa o snippet de uma reimplementação: quem copia não precisa
    // manter um sinal de abertura só para fechar o painel a partir de dentro.
    const actions = footer(popoverPlaygroundSource());
    expect(actions.match(/ndsPopoverClose/g)).toHaveLength(2);
    expect(actions).not.toContain('(click)');
  });
});
