import { describe, expect, it } from 'vitest';
import {
  tooltipLadosSnippet,
  tooltipSnippet,
  tooltipSource,
  tooltipSourceWith,
} from './tooltip.source';

describe('tooltipSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML', () => {
    const code = tooltipSnippet();
    expect(code).toContain("import { createTooltip } from '@/components/ui/tooltip';");
    expect(code).toContain('createTooltip({');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('aria-describedby=');
  });

  it('monta o gatilho com a fábrica de botão, não com DOM cru nem helper de story', () => {
    const code = tooltipSnippet();
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain('createButton(');
    expect(code).not.toContain('balaoDe');
    expect(code).not.toContain('wrap(');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = tooltipSnippet();
    expect(code).not.toContain('side:');
    expect(code).not.toContain('delayDuration');
  });

  it('mostra o lado quando ele difere do topo', () => {
    expect(tooltipSnippet({ side: 'top' })).not.toContain('side:');
    expect(tooltipSnippet({ side: 'bottom' })).toContain("side: 'bottom'");
  });

  it('dá nome acessível ao gatilho só de ícone — o balão não substitui o nome', () => {
    const code = tooltipSnippet({ triggerSize: 'icon', triggerLabel: '', triggerAriaLabel: 'Salvar' });
    expect(code).toContain("size: 'icon'");
    expect(code).toContain("'aria-label': 'Salvar'");
  });

  it('troca a fábrica pelo provedor quando a story usa um grupo', () => {
    const code = tooltipSnippet({ provider: { delayDuration: 3000, skipDelayDuration: 5000 } });
    expect(code).toContain("import { createTooltipProvider } from '@/components/ui/tooltip';");
    expect(code).toContain('createTooltipProvider({');
    expect(code).toContain('delayDuration: 3000');
    expect(code).toContain('skipDelayDuration: 5000');
    expect(code).toContain('grupo.createTooltip({');
  });

  it('a espera por balão sai do snippet quando quem manda é o grupo', () => {
    const code = tooltipSnippet({ delayDuration: 800, provider: { delayDuration: 3000 } });
    expect(code).not.toContain('delayDuration: 800');
  });

  it('conteúdo com marcação entra como elemento, nunca como HTML em string', () => {
    const code = tooltipSnippet({ contentComMarcacao: true, content: 'Copiar' });
    expect(code).toContain("document.createElement('kbd')");
    expect(code).toContain('content: conteudo');
    expect(code).not.toContain('innerHTML');
    expect(code).not.toContain('<kbd>');
  });
});

describe('tooltipSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const topo = tooltipSource('<div data-slot="tooltip-content">', {});
    const side = tooltipSource('<div data-slot="tooltip-content">', {
      args: { side: 'right', content: 'Outro texto' },
    });
    expect(topo).not.toBe(side);
    expect(side).toContain("side: 'right'");
    expect(side).toContain("content: 'Outro texto'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(tooltipSource('<div data-slot="tooltip-content" role="tooltip">', {}))
      .not.toContain('role="tooltip"');
  });
});

describe('tooltipSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const code = tooltipSourceWith({ side: 'bottom' })('', { args: { side: 'top' } });
    expect(code).toContain("side: 'bottom'");
  });
});

describe('tooltipLadosSnippet', () => {
  it('percorre os quatro lados numa única passagem', () => {
    const code = tooltipLadosSnippet();
    expect(code).toContain("['top', 'right', 'bottom', 'left']");
    expect(code).toContain('createTooltip({ trigger: gatilho');
    expect(code).not.toContain('grid.style');
  });
});
