import { describe, expect, it } from 'vitest';
import {
  separatorEmCardSnippet,
  separatorSnippet,
  separatorSource,
  separatorSourceCom,
} from './separator.source';

describe('separatorSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = separatorSnippet();
    expect(código).toContain("import { createSeparator } from '@/components/ui/separator';");
    expect(código).toContain('createSeparator()');
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('role="none"');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = separatorSnippet();
    expect(código).not.toContain('orientation');
    expect(código).not.toContain('decorative');
    expect(código).not.toContain('emphasis');
  });

  it('mostra orientação, modo semântico, ênfase e classe quando a story os usa', () => {
    const código = separatorSnippet({
      orientation: 'vertical',
      decorative: false,
      emphasis: 'strong',
      className: 'nds-mt-4',
    });
    expect(código).toContain("orientation: 'vertical'");
    expect(código).toContain('decorative: false');
    expect(código).toContain("emphasis: 'strong'");
    expect(código).toContain("className: 'nds-mt-4'");
  });

  it('mantém a chamada em uma linha só, dentro do append', () => {
    const código = separatorSnippet({ decorative: false });
    expect(código).toContain('secao.append(topo, createSeparator({ decorative: false }), base);');
  });

  it('troca o contêiner conforme o eixo — a linha vertical estica no flex', () => {
    expect(separatorSnippet()).toContain("secao.className = 'nds-stack nds-max-w-md';");
    const vertical = separatorSnippet({ orientation: 'vertical' });
    expect(vertical).toContain("secao.className = 'nds-cluster nds-max-w-md';");
    expect(vertical).toContain('secao.append(esquerda,');
  });

  it('põe o elemento na página e não vaza helper de story', () => {
    const código = separatorSnippet();
    expect(código).toContain("document.querySelector('#app')?.append(secao);");
    expect(código).not.toContain('playgroundSource');
    expect(código).not.toContain('texto(');
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
    const código = separatorSourceCom({ orientation: 'vertical' })('', {
      args: { orientation: 'horizontal' },
    });
    expect(código).toContain("orientation: 'vertical'");
  });
});

describe('separatorEmCardSnippet', () => {
  it('monta o cartão com as sub-fábricas do design system', () => {
    const código = separatorEmCardSnippet();
    expect(código).toContain("import { createCard, createCardContent");
    expect(código).toContain('createCardTitle({');
    expect(código).toContain('cartao.append(cabecalho, createSeparator(), conteudo);');
    // `class` é o nome canônico do Card; `className` é apelido depreciado.
    expect(código).toContain("createCard({ class: 'nds-max-w-md' })");
    expect(código).not.toContain("createCard({ className:");
  });
});
