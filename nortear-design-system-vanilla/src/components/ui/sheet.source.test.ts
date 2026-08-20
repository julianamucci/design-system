import { describe, expect, it } from 'vitest';
import {
  sheetControladoSnippet,
  sheetSnippet,
  sheetSource,
  sheetSourceCom,
} from './sheet.source';

describe('sheetSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do painel', () => {
    const código = sheetSnippet();
    expect(código).toContain("import { createSheet } from '@/components/ui/sheet';");
    expect(código).toContain('createSheet({');
    expect(código).not.toContain('data-slot="sheet-content"');
    expect(código).not.toContain('aria-modal="true"');
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
    const código = sheetSnippet({ triggerLabel: 'Abrir filtros' });
    expect(código).toContain("import { createButton } from '@/components/ui/button';");
    expect(código).toContain("trigger: createButton({ variant: 'outline', label: 'Abrir filtros' })");
    expect(código).not.toContain('buildPlayground');
    expect(código).not.toContain('makeFooter');
    expect(código).not.toContain('buildSheetSide');
  });

  it('mostra que quem fecha pelo rodapé é o overlay — não existe botão componível', () => {
    const código = sheetSnippet();
    expect(código).toContain('footer: rodape');
    expect(código).toContain("[data-slot=\"sheet-overlay\"]");
    expect(código).not.toContain('SheetClose');
  });

  it('monta o painel sem rodapé quando a story não tem ações', () => {
    const código = sheetSnippet({ cancelLabel: false, applyLabel: false });
    expect(código).not.toContain('footer:');
    expect(código).not.toContain('const rodape');
  });

  it('troca o corpo conforme a composição, sempre com peças do design system', () => {
    const formulario = sheetSnippet({ corpo: 'formulario' });
    expect(formulario).toContain("import { createFormField } from '@/components/ui/form';");
    expect(formulario).toContain('createFormField({ label:');

    const navegacao = sheetSnippet({ corpo: 'navegacao' });
    expect(navegacao).toContain("corpo.setAttribute('aria-label', 'Seções');");

    const paragrafos = sheetSnippet({ corpo: 'paragrafos', paragrafos: 8 });
    expect(paragrafos).toContain('i <= 8');
  });

  it('mostra a limpeza só quando a story trata dela', () => {
    expect(sheetSnippet()).not.toContain('destroy()');
    expect(sheetSnippet({ mostrarDestroy: true })).toContain('painel.destroy();');
  });

  it('não repete o import do botão quando o corpo também o usa', () => {
    const código = sheetSnippet({ corpo: 'acoes' });
    expect(código.match(/from '@\/components\/ui\/button'/g)).toHaveLength(1);
  });
});

describe('sheetSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const padrão = sheetSource('<div data-slot="sheet-content">', {});
    const esquerda = sheetSource('<div data-slot="sheet-content">', {
      args: { side: 'left', title: 'Menu' },
    });
    expect(padrão).not.toBe(esquerda);
    expect(esquerda).toContain("side: 'left'");
    expect(esquerda).toContain("title: 'Menu'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(sheetSource('<div data-slot="sheet-content" data-side="right">', {})).not.toContain(
      'data-side=',
    );
  });

  it('liga a linha do callback quando a story passa um spy nos args', () => {
    const código = sheetSource('', { args: { onOpenChange: () => {} } });
    expect(código).toContain('onOpenChange: (aberto) => registrarPainel(aberto)');
  });
});

describe('sheetSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const código = sheetSourceCom({ side: 'bottom' })('', { args: { side: 'right' } });
    expect(código).toContain("side: 'bottom'");
  });
});

describe('sheetControladoSnippet', () => {
  it('abre pelo gatilho interno — a fábrica não expõe prop de estado', () => {
    const código = sheetControladoSnippet();
    expect(código).toContain("gatilhoInterno.classList.add('nds-sr-only');");
    expect(código).toContain('gatilhoInterno.click();');
    expect(código).toContain('onOpenChange: (estado) => { aberto = estado; }');
    expect(código).not.toContain('open: true');
  });
});
