import { describe, expect, it } from 'vitest';
import {
  separatorEmCardSnippet,
  separatorSnippet,
  separatorSource,
  separatorSourceWith,
} from './separator.source';

describe('separatorSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = separatorSnippet();
    expect(code).toContain("import { createSeparator } from '@/components/ui/separator';");
    expect(code).toContain('createSeparator()');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('role="none"');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = separatorSnippet();
    expect(code).not.toContain('orientation');
    expect(code).not.toContain('decorative');
    expect(code).not.toContain('emphasis');
  });

  it('mostra orientação, modo semântico, ênfase e classe quando a story os usa', () => {
    const code = separatorSnippet({
      orientation: 'vertical',
      decorative: false,
      emphasis: 'strong',
      className: 'nds-mt-4',
    });
    expect(code).toContain("orientation: 'vertical'");
    expect(code).toContain('decorative: false');
    expect(code).toContain("emphasis: 'strong'");
    expect(code).toContain("className: 'nds-mt-4'");
  });

  it('mantém a chamada em uma linha só, dentro do append', () => {
    const code = separatorSnippet({ decorative: false });
    expect(code).toContain('secao.append(topo, createSeparator({ decorative: false }), base);');
  });

  it('troca o contêiner conforme o eixo — a linha vertical estica no flex', () => {
    expect(separatorSnippet()).toContain("secao.className = 'nds-stack nds-max-w-md';");
    const vertical = separatorSnippet({ orientation: 'vertical' });
    expect(vertical).toContain("secao.className = 'nds-cluster nds-max-w-md';");
    expect(vertical).toContain('secao.append(esquerda,');
  });

  it('põe o elemento na página e não vaza helper de story', () => {
    const code = separatorSnippet();
    expect(code).toContain("document.querySelector('#app')?.append(secao);");
    expect(code).not.toContain('playgroundSource');
    expect(code).not.toContain('texto(');
  });
});

describe('separatorSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const padrão = separatorSource('<div data-slot="separator">', {});
    const forte = separatorSource('<div data-slot="separator">', {
      args: { emphasis: 'strong', decorative: false },
    });
    expect(padrão).not.toBe(forte);
    expect(forte).toContain("emphasis: 'strong'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(separatorSource('<div data-slot="separator" aria-hidden="true">', {})).not.toContain(
      'aria-hidden="true"',
    );
  });
});

describe('separatorSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const code = separatorSourceWith({ orientation: 'vertical' })('', {
      args: { orientation: 'horizontal' },
    });
    expect(code).toContain("orientation: 'vertical'");
  });
});

describe('separatorEmCardSnippet', () => {
  it('monta o cartão com as sub-fábricas do design system', () => {
    const code = separatorEmCardSnippet();
    expect(code).toContain("import { createCard, createCardContent");
    expect(code).toContain('createCardTitle({');
    expect(code).toContain('cartao.append(cabecalho, createSeparator(), conteudo);');
    // `class` é o nome canônico do Card; `className` é apelido depreciado.
    expect(code).toContain("createCard({ class: 'nds-max-w-md' })");
    expect(code).not.toContain("createCard({ className:");
  });
});
