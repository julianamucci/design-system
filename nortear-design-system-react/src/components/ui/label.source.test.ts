import { describe, expect, it } from 'vitest';
import {
  labelWithCheckboxSource,
  blockLabelDisabledSource,
  labelDisabledSource,
  labelObrigatorioSource,
  labelSource,
} from './label.source';

const ALL = [
  labelSource,
  labelDisabledSource,
  blockLabelDisabledSource,
  labelObrigatorioSource,
  labelWithCheckboxSource,
];

describe('labelSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    expect(labelSource()).toContain('import { Label } from "@/components/ui/label";');
  });

  it('lê o texto do control', () => {
    expect(labelSource(undefined, { args: { children: 'Telefone' } })).toContain(
      '>Telefone</Label>',
    );
  });

  it('cai no texto padrão quando o control entrega um espião no lugar da string', () => {
    const spy = () => 'CORPO_DO_MOCK';
    const saida = labelSource(undefined, { args: { children: spy as never } });
    expect(saida).toContain('>Nome completo</Label>');
    expect(saida).not.toContain('CORPO_DO_MOCK');
  });

  it('omite o className quando o control está vazio', () => {
    expect(labelSource(undefined, { args: { className: '' } })).toContain(
      '<Label htmlFor="nome-completo">',
    );
  });

  it('escreve o className quando o control traz algo', () => {
    expect(labelSource(undefined, { args: { className: 'nds-text-caption' } })).toContain(
      '<Label htmlFor="nome-completo" className="nds-text-caption">',
    );
  });
});

describe('o par htmlFor ↔ id', () => {
  it('todo snippet mostra o rótulo ligado a um controle real', () => {
    for (const fn of ALL) {
      const saida = fn();
      const target = saida.match(/<Label htmlFor="([a-z-]+)"/)?.[1];
      expect(target, `${fn.name} não tem htmlFor`).toBeDefined();
      // O `id` correspondente precisa existir no MESMO snippet: um `for`
      // apontando para nada é o defeito que o componente existe para evitar.
      expect(saida).toContain(`id="${target}"`);
    }
  });

  it('nenhum snippet deixa o placeholder fazer as vezes do rótulo', () => {
    for (const fn of ALL) {
      const saida = fn();
      if (!saida.includes('placeholder=')) continue;
      expect(saida, `${fn.name} usa placeholder sem rótulo`).toContain('<Label htmlFor=');
    }
  });
});

describe('estados', () => {
  it('o desabilitado põe a marca de irmão no CONTROLE, não no rótulo', () => {
    const saida = labelDisabledSource();
    expect(saida).toMatch(/<Input[^>]*className="nds-peer"/);
    expect(saida).toMatch(/<Input[^>]*disabled/);
    expect(saida).not.toMatch(/<Label[^>]*nds-peer/);
  });

  it('o bloco desabilitado marca o ancestral, e não cada rótulo', () => {
    const saida = blockLabelDisabledSource();
    expect(saida).toContain('data-disabled="true"');
    expect(saida.indexOf('data-disabled="true"')).toBeLessThan(saida.indexOf('<Label'));
  });

  it('a obrigatoriedade tem as duas metades: asterisco decorativo e aria-required', () => {
    const saida = labelObrigatorioSource();
    expect(saida).toContain('aria-hidden="true"');
    expect(saida).toContain('nds-text-destructive');
    // Sem isto o asterisco seria só pintura: `aria-hidden` o esconde do leitor
    // de tela, e nada mais diria que o campo é obrigatório.
    expect(saida).toContain('aria-required="true"');
  });
});

describe('composições', () => {
  it('a caixa de seleção continua ligada pelo mesmo par for/id', () => {
    const saida = labelWithCheckboxSource();
    expect(saida).toContain('import { Checkbox } from "@/components/ui/checkbox";');
    expect(saida).toContain('<Checkbox id="termos" />');
    expect(saida).toContain('<Label htmlFor="termos">');
  });

  it('nenhum snippet crava altura nem valor de design em style', () => {
    // A altura do rótulo e do campo é resultado de padding + line-height
    // (WCAG 1.4.4), e valor de design mora em classe `.nds-*`, nunca inline.
    for (const fn of ALL) {
      expect(fn()).not.toContain('style=');
      expect(fn()).not.toMatch(/\bheight\b/);
    }
  });

  it('nenhum snippet ensina o andaime da story', () => {
    for (const fn of ALL) {
      expect(fn()).not.toContain('fixtures');
      expect(fn()).not.toContain('{...args}');
    }
  });
});
