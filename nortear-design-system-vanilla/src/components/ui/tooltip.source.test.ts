import { describe, expect, it } from 'vitest';
import {
  tooltipLadosSnippet,
  tooltipSnippet,
  tooltipSource,
  tooltipSourceWith,
} from './tooltip.source';

describe('tooltipSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML', () => {
    const código = tooltipSnippet();
    expect(código).toContain("import { createTooltip } from '@/components/ui/tooltip';");
    expect(código).toContain('createTooltip({');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('aria-describedby=');
  });

  it('monta o gatilho com a fábrica de botão, não com DOM cru nem helper de story', () => {
    const código = tooltipSnippet();
    expect(código).toContain("import { createButton } from '@/components/ui/button';");
    expect(código).toContain('createButton(');
    expect(código).not.toContain('balaoDe');
    expect(código).not.toContain('wrap(');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = tooltipSnippet();
    expect(código).not.toContain('side:');
    expect(código).not.toContain('delayDuration');
  });

  it('mostra o lado quando ele difere do topo', () => {
    expect(tooltipSnippet({ side: 'top' })).not.toContain('side:');
    expect(tooltipSnippet({ side: 'bottom' })).toContain("side: 'bottom'");
  });

  it('dá nome acessível ao gatilho só de ícone — o balão não substitui o nome', () => {
    const código = tooltipSnippet({ triggerSize: 'icon', triggerLabel: '', triggerAriaLabel: 'Salvar' });
    expect(código).toContain("size: 'icon'");
    expect(código).toContain("'aria-label': 'Salvar'");
  });

  it('troca a fábrica pelo provedor quando a story usa um grupo', () => {
    const código = tooltipSnippet({ provider: { delayDuration: 3000, skipDelayDuration: 5000 } });
    expect(código).toContain("import { createTooltipProvider } from '@/components/ui/tooltip';");
    expect(código).toContain('createTooltipProvider({');
    expect(código).toContain('delayDuration: 3000');
    expect(código).toContain('skipDelayDuration: 5000');
    expect(código).toContain('grupo.createTooltip({');
  });

  it('a espera por balão sai do snippet quando quem manda é o grupo', () => {
    const código = tooltipSnippet({ delayDuration: 800, provider: { delayDuration: 3000 } });
    expect(código).not.toContain('delayDuration: 800');
  });

  it('conteúdo com marcação entra como elemento, nunca como HTML em string', () => {
    const código = tooltipSnippet({ contentComMarcacao: true, content: 'Copiar' });
    expect(código).toContain("document.createElement('kbd')");
    expect(código).toContain('content: conteudo');
    expect(código).not.toContain('innerHTML');
    expect(código).not.toContain('<kbd>');
  });
});

describe('tooltipSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const topo = tooltipSource('<div data-slot="tooltip-content">', {});
    const lado = tooltipSource('<div data-slot="tooltip-content">', {
      args: { side: 'right', content: 'Outro texto' },
    });
    expect(topo).not.toBe(lado);
    expect(lado).toContain("side: 'right'");
    expect(lado).toContain("content: 'Outro texto'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(tooltipSource('<div data-slot="tooltip-content" role="tooltip">', {}))
      .not.toContain('role="tooltip"');
  });
});

describe('tooltipSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const código = tooltipSourceWith({ side: 'bottom' })('', { args: { side: 'top' } });
    expect(código).toContain("side: 'bottom'");
  });
});

describe('tooltipLadosSnippet', () => {
  it('percorre os quatro lados numa única passagem', () => {
    const código = tooltipLadosSnippet();
    expect(código).toContain("['top', 'right', 'bottom', 'left']");
    expect(código).toContain('createTooltip({ trigger: gatilho');
    expect(código).not.toContain('grid.style');
  });
});
