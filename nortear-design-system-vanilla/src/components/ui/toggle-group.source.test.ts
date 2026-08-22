import { describe, expect, it } from 'vitest';
import {
  toggleGroupSnippet,
  toggleGroupSource,
  toggleGroupSourceWith,
} from './toggle-group.source';

describe('toggleGroupSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML', () => {
    const código = toggleGroupSnippet();
    expect(código).toContain("import { createToggleGroup, type ToggleGroupItem } from '@/components/ui/toggle-group';");
    expect(código).toContain('createToggleGroup({');
    // O `[data-slot="toggle"]` que sobra é SELETOR de quem consome, não dump —
    // por isso a prova aqui é a ausência de markup renderizado.
    expect(código).not.toContain('<div');
    expect(código).not.toContain('role="toolbar"');
    expect(código).not.toContain('aria-pressed="false"');
  });

  it('nomeia o grupo — role="toolbar" sem nome não diz de que barra se trata', () => {
    expect(toggleGroupSnippet()).toContain("'aria-label': 'Alinhamento do texto'");
    expect(toggleGroupSnippet({ 'aria-label': 'Formatação' })).toContain("'aria-label': 'Formatação'");
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = toggleGroupSnippet();
    expect(código).not.toContain('type:');
    expect(código).not.toContain('orientation:');
    expect(código).not.toContain('spacing:');
    expect(código).not.toContain('size:');
    expect(código).not.toContain('disabled: true');
  });

  it('mostra tipo, eixo, espaçamento e bloqueio quando a story os usa', () => {
    const código = toggleGroupSnippet({
      type: 'multiple',
      orientation: 'vertical',
      spacing: 1,
      disabled: true,
    });
    expect(código).toContain("type: 'multiple'");
    expect(código).toContain("orientation: 'vertical'");
    expect(código).toContain('spacing: 1');
    expect(código).toContain('disabled: true');
  });

  it('o modo múltiplo leva defaultValue em array, o exclusivo em string', () => {
    expect(toggleGroupSnippet()).toContain("defaultValue: 'left'");
    expect(toggleGroupSnippet({ type: 'multiple' })).toContain("defaultValue: ['left']");
  });

  it('sem seleção inicial a opção sai do snippet', () => {
    expect(toggleGroupSnippet({ defaultValue: null })).not.toContain('defaultValue');
  });

  it('o item só de ícone leva nome acessível e children vazio', () => {
    const código = toggleGroupSnippet();
    expect(código).toContain("{ value: 'left', children: '', 'aria-label': 'Alinhar à esquerda' }");
  });

  it('o item com texto visível dispensa nome acessível', () => {
    const código = toggleGroupSnippet({
      items: [{ value: 'grid', icon: 'LayoutGrid', children: 'Grade' }],
    });
    expect(código).toContain("{ value: 'grid', children: 'Grade' }");
    expect(código).not.toContain("'aria-label': 'Grade'");
  });

  it('mostra a colocação do ícone, porque `children` do item só aceita texto', () => {
    const código = toggleGroupSnippet();
    expect(código).toContain("import { AlignLeft, AlignCenter, AlignRight, createElement } from 'lucide';");
    expect(código).toContain("grupo.querySelectorAll('[data-slot=\"toggle\"]')");
    expect(código).not.toContain('injectIcons');
    expect(código).not.toContain('buildLucideSvg');
  });

  it('sem ícone não há bloco de colocação nem import do lucide', () => {
    const código = toggleGroupSnippet({ items: [{ value: 'grid', children: 'Grade' }] });
    expect(código).not.toContain('lucide');
    expect(código).not.toContain('createElement');
  });
});

describe('toggleGroupSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const exclusivo = toggleGroupSource('<div data-slot="toggle-group">', {});
    const multiplo = toggleGroupSource('<div data-slot="toggle-group">', {
      args: { type: 'multiple', spacing: 2 },
    });
    expect(exclusivo).not.toBe(multiplo);
    expect(multiplo).toContain("type: 'multiple'");
    expect(multiplo).toContain('spacing: 2');
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(toggleGroupSource('<div data-slot="toggle-group" role="toolbar">', {}))
      .not.toContain('role="toolbar"');
  });
});

describe('toggleGroupSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const código = toggleGroupSourceWith({ orientation: 'vertical' })('', {
      args: { orientation: 'horizontal' },
    });
    expect(código).toContain("orientation: 'vertical'");
  });
});
