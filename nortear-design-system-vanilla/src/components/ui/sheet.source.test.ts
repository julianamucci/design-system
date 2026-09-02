import { describe, expect, it } from 'vitest';
import {
  sheetControlledSnippet,
  sheetSnippet,
  sheetSource,
  sheetSourceWith,
} from './sheet.source';

describe('sheetSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do painel', () => {
    const code = sheetSnippet();
    expect(code).toContain("import { createSheet } from '@/components/ui/sheet';");
    expect(code).toContain('createSheet({');
    expect(code).not.toContain('data-slot="sheet-content"');
    expect(code).not.toContain('aria-modal="true"');
  });

  it('omite o que já é padrão da fábrica', () => {
    // `right` é o lado padrão e o X do canto vem pronto: nenhum dos dois entra.
    expect(sheetSnippet()).not.toContain('side:');
    expect(sheetSnippet()).not.toContain('showCloseButton');
    expect(sheetSnippet({ side: 'right' })).not.toContain('side:');
  });

  it('mostra o lado quando a story o troca', () => {
    expect(sheetSnippet({ side: 'left' })).toContain("side: 'left'");
    expect(sheetSnippet({ side: 'bottom' })).toContain("side: 'bottom'");
  });

  it('monta o gatilho com a fábrica de botão, sem helper de story', () => {
    const code = sheetSnippet({ triggerLabel: 'Abrir filtros' });
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain("trigger: createButton({ variant: 'outline', label: 'Abrir filtros' })");
    expect(code).not.toContain('buildPlayground');
    expect(code).not.toContain('makeFooter');
    expect(code).not.toContain('buildSheetSide');
  });

  it('mostra que quem fecha pelo rodapé é o overlay — não existe botão componível', () => {
    const code = sheetSnippet();
    expect(code).toContain('footer: rodape');
    expect(code).toContain("[data-slot=\"sheet-overlay\"]");
    expect(code).not.toContain('SheetClose');
  });

  it('monta o painel sem rodapé quando a story não tem ações', () => {
    const code = sheetSnippet({ cancelLabel: false, applyLabel: false });
    expect(code).not.toContain('footer:');
    expect(code).not.toContain('const rodape');
  });

  it('troca o corpo conforme a composição, sempre com peças do design system', () => {
    const form = sheetSnippet({ body: 'formulario' });
    expect(form).toContain("import { createFormField } from '@/components/ui/form';");
    expect(form).toContain('createFormField({ label:');

    const navigation = sheetSnippet({ body: 'navegacao' });
    expect(navigation).toContain("corpo.setAttribute('aria-label', 'Seções');");

    const paragrafos = sheetSnippet({ body: 'paragrafos', paragrafos: 8 });
    expect(paragrafos).toContain('i <= 8');
  });

  it('mostra a limpeza só quando a story trata dela', () => {
    expect(sheetSnippet()).not.toContain('destroy()');
    expect(sheetSnippet({ mostrarDestroy: true })).toContain('painel.destroy();');
  });

  it('não repete o import do botão quando o corpo também o usa', () => {
    const code = sheetSnippet({ body: 'acoes' });
    expect(code.match(/from '@\/components\/ui\/button'/g)).toHaveLength(1);
  });
});

describe('sheetSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const atDefaults = sheetSource('<div data-slot="sheet-content">', {});
    const atLeft = sheetSource('<div data-slot="sheet-content">', {
      args: { side: 'left', title: 'Menu' },
    });
    expect(atDefaults).not.toBe(atLeft);
    expect(atLeft).toContain("side: 'left'");
    expect(atLeft).toContain("title: 'Menu'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(sheetSource('<div data-slot="sheet-content" data-side="right">', {})).not.toContain(
      'data-side=',
    );
  });

  it('liga a linha do callback quando a story passa um spy nos args', () => {
    const code = sheetSource('', { args: { onOpenChange: () => {} } });
    expect(code).toContain('onOpenChange: (aberto) => registrarPainel(aberto)');
  });
});

describe('sheetSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const code = sheetSourceWith({ side: 'bottom' })('', { args: { side: 'right' } });
    expect(code).toContain("side: 'bottom'");
  });
});

describe('sheetControladoSnippet', () => {
  it('abre pelo gatilho interno — a fábrica não expõe prop de estado', () => {
    const code = sheetControlledSnippet();
    expect(code).toContain("gatilhoInterno.classList.add('nds-sr-only');");
    expect(code).toContain('gatilhoInterno.click();');
    expect(code).toContain('onOpenChange: (estado) => { aberto = estado; }');
    expect(code).not.toContain('open: true');
  });
});

/**
 * Guarda de COERÊNCIA do snippet: toda referência tem de estar declarada.
 *
 * Nasceu de um defeito real — o snippet controlado declarava `gatilhoInterno` e
 * passava `trigger: triggerInterno`, um símbolo que não existia em lugar
 * nenhum. Quem copiasse recebia código que não roda, e nenhum portão via: os
 * três casos acima olhavam só linhas isoladas, e o snippet inteiro nunca foi
 * lido como programa.
 *
 * A varredura é sobre `chave: identificador,` — só identificador nu, porque
 * literal, chamada e arrow já se explicam sozinhos na própria linha.
 */
function referenciasSoltas(code: string): string[] {
  const declarados = new Set<string>();
  for (const m of code.matchAll(/\b(?:const|let|var|function)\s+([A-Za-z_$][\w$]*)/g)) {
    declarados.add(m[1]);
  }
  const soltas: string[] = [];
  for (const m of code.matchAll(/^\s{2,}[A-Za-z_$][\w$]*:\s*([A-Za-z_$][\w$]*),?\s*$/gm)) {
    const ref = m[1];
    if (ref === 'true' || ref === 'false' || ref === 'null' || ref === 'undefined') continue;
    if (!declarados.has(ref)) soltas.push(ref);
  }
  return soltas;
}

describe('coerência dos snippets', () => {
  it('não referencia símbolo que o próprio snippet não declara', () => {
    expect(referenciasSoltas(sheetSnippet({ body: 'formulario' }))).toEqual([]);
    expect(referenciasSoltas(sheetControlledSnippet())).toEqual([]);
  });

  it('mostra showCloseButton só quando ele é desligado', () => {
    expect(sheetSnippet({})).not.toContain('showCloseButton');
    expect(sheetSnippet({ showCloseButton: false })).toContain('showCloseButton: false');
  });
});
