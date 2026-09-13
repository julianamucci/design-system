import { describe, expect, it } from 'vitest';
import { popoverFormSource, popoverPlaygroundSource } from './popover.source';

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

  it('a raiz é controlada, e o control semeia o sinal', () => {
    // O painel do snippet é controlado por `[(open)]` — é o que dá ao "Salvar"
    // como fechar por código. Num painel controlado o estado inicial mora no
    // SINAL, não em `defaultOpen`: os dois juntos seriam duas fontes para a
    // mesma pergunta, e o control do Playground responde por uma só.
    const closed = popoverPlaygroundSource('', { args: { defaultOpen: false } });
    expect(closed).toContain('<div ndsPopover [(open)]="aberto">');
    expect(closed).toContain('readonly aberto = signal(false);');

    const opened = popoverPlaygroundSource('', { args: { defaultOpen: true } });
    expect(opened).toContain('<div ndsPopover [(open)]="aberto">');
    expect(opened).toContain('readonly aberto = signal(true);');
    expect(opened).not.toContain('[defaultOpen]');
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
    expect(code).toContain('<h2 ndsPopoverTitle>Configurações de exibição</h2>');
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
    expect(actions).toContain('ndsButton size="sm" (click)="salvar()">Salvar<');
    expect(actions.match(/variant=/g)).toHaveLength(1);
    expect(actions).not.toContain('Limpar');
    expect(actions).not.toContain('Aplicar');
  });

  it('as duas ações fecham, mas por caminhos DIFERENTES', () => {
    // A diferença é a que o relatório precisa: a peça de fechar publica
    // `close-press`, que o design system lê como `close-button` — o motivo de
    // quem DESISTIU —, e o fechamento por código cai em `api`, que é onde mora
    // "salvou e fechou". Com `ndsPopoverClose` nos dois, "concluiu" chegaria ao
    // GA4 como "apertou o botão de fechar", e quem copia o snippet levaria essa
    // forma para o produto dele.
    const code = popoverPlaygroundSource();
    const actions = footer(code);

    // Só o Cancelar é a peça de fechar.
    expect(actions.match(/ndsPopoverClose/g)).toHaveLength(1);
    expect(actions).toContain('<button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar<');
    expect(actions).not.toMatch(/ndsPopoverClose[^>]*>\s*Salvar/);

    // E o Salvar fecha por código — o método existe na classe do exemplo, senão
    // o binding não resolveria na mão de quem copia.
    expect(actions).toContain('(click)="salvar()"');
    expect(code).toContain('salvar(): void {');
    expect(code).toContain('this.aberto.set(false);');
  });
});

describe('popoverFormSource', () => {
  it('devolve o componente do painel com formulário, e não o template da story', () => {
    const code = popoverFormSource();
    expect(code).toContain("import { NDS_POPOVER } from '@/components/ui/popover';");
    expect(code).toContain("import { NdsInput } from '@/components/ui/input';");
    expect(code).toContain("import { NdsLabel } from '@/components/ui/label';");
    expect(code).toContain('imports: [...NDS_POPOVER, NdsButton, NdsInput, NdsLabel]');
    expect(code).toContain('<form class="nds-stack" data-spacing="md"');
    // Rótulo e campo amarrados: campo sem `for`/`id` chega ao leitor de tela
    // sem nome nenhum, e o painel com formulário é onde isso mais custa.
    expect(code).toContain('<label ndsLabel for="perfil-nome">Nome</label>');
    expect(code).toContain('<input ndsInput id="perfil-nome"');

    // O que o renderer imprimiria sozinho, e o que as diretivas escrevem em
    // runtime — a mesma régua do construtor do Playground, sem afrouxar.
    expect(code).not.toContain('args.');
    expect(code).not.toContain('{{');
    expect(code).not.toContain('(openChange)');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('[attr.');
  });

  it('leva o rótulo do gatilho que veio dos controls', () => {
    const code = popoverFormSource('', { args: { triggerLabel: 'Editar conta' } });
    expect(code).toContain('>Editar conta</button>');
    expect(code).not.toContain('>Editar perfil</button>');
  });

  it('a raiz é controlada — é o que dá ao submit como fechar por código', () => {
    const code = popoverFormSource();
    expect(code).toContain('<div ndsPopover [(open)]="aberto">');
    expect(code).toContain('readonly aberto = signal(false);');
    expect(code).not.toContain('[defaultOpen]');
  });

  it('as duas ações fecham, mas por caminhos DIFERENTES — e aqui um deles é o submit', () => {
    // Mesma diferença do rodapé sem formulário (`close-button` × `api`), com
    // uma mudança de LUGAR que é o que este caso guarda: quando a ação que
    // conclui é `type="submit"`, o fechamento por código não pode morar no
    // clique dela. Fechar no clique desmontaria o formulário antes do envio, e
    // deixaria de fora o Enter num campo — que é como metade das pessoas envia
    // formulário, e nunca passa pelo clique.
    const code = popoverFormSource();
    const actions = footer(code);

    // Só o Cancelar é a peça de fechar.
    expect(actions.match(/ndsPopoverClose/g)).toHaveLength(1);
    expect(actions).toContain(
      '<button ndsPopoverClose ndsButton variant="ghost" size="sm">Cancelar<',
    );
    expect(actions).not.toMatch(/ndsPopoverClose[^>]*>\s*Atualizar/);

    // E o Atualizar conclui pelo formulário: `type="submit"`, sem `(click)`
    // nenhum no rodapé.
    expect(actions).toContain('<button ndsButton type="submit" size="sm">Atualizar<');
    expect(actions).not.toContain('(click)=');

    // O fechamento mora no `(submit)` do form, e o handler existe na classe do
    // exemplo — senão o binding não resolveria na mão de quem copia.
    expect(code).toMatch(/<form[^>]*\(submit\)="atualizar\(\$event\)"/);
    expect(code).toContain('atualizar(evento: Event): void {');
    expect(code).toContain('evento.preventDefault();');
    expect(code).toContain('this.aberto.set(false);');

    // E nessa ORDEM: fechar antes do `preventDefault()` deixaria o navegador
    // navegar a página no envio.
    expect(code.indexOf('evento.preventDefault();')).toBeLessThan(
      code.indexOf('this.aberto.set(false);'),
    );
  });
});
