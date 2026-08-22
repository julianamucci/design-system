import { describe, expect, it } from 'vitest';
import {
  codeBlockWithRemovalSnippet,
  codeBlockSnippet,
  codeBlockSource,
  codeBlockSourceWith,
} from './code-block.source';

describe('codeBlockSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const código = codeBlockSnippet();
    expect(código).toContain("import { createCodeBlock } from '@/components/ui/code-block';");
    expect(código).toContain('createCodeBlock({');
    expect(código).toContain("document.querySelector('#app')?.append(bloco);");
    expect(código).not.toContain('data-slot=');
    expect(código).not.toContain('nds-code-block-line');
  });

  it('omite o que já é padrão da fábrica', () => {
    const código = codeBlockSnippet();
    expect(código).not.toContain('showLineNumbers');
    expect(código).not.toContain('title');
    expect(código).not.toContain('highlightLines');
    expect(código).not.toContain('footer');
  });

  it('mostra as opções quando a story as usa', () => {
    const código = codeBlockSnippet({
      language: 'ts',
      title: 'exemplo.ts',
      showLineNumbers: false,
      highlightLines: '3, 5-7',
      footer: 'A ação de copiar leva apenas o código.',
    });
    expect(código).toContain("language: 'ts'");
    expect(código).toContain("title: 'exemplo.ts'");
    expect(código).toContain('showLineNumbers: false');
    expect(código).toContain("highlightLines: '3, 5-7'");
    expect(código).toContain("footer: 'A ação de copiar leva apenas o código.'");
  });

  it('guarda as duas formas de intervalo, como a fábrica as aceita', () => {
    expect(codeBlockSnippet({ highlightLines: [2] })).toContain('highlightLines: [2]');
    expect(codeBlockSnippet({ highlightLines: [3, '5-7'] })).toContain(
      "highlightLines: [3, '5-7']",
    );
    // Vazio não é intervalo: o control do Playground começa em branco.
    expect(codeBlockSnippet({ highlightLines: '' })).not.toContain('highlightLines');
  });

  it('não repete a linguagem que já é a padrão, e mostra a desconhecida', () => {
    expect(codeBlockSnippet({ language: 'text' })).not.toContain('language');
    expect(codeBlockSnippet({ language: 'txt' })).not.toContain('language');
    // Desconhecida é o assunto de uma story: a fábrica cai em texto simples sem
    // quebrar, e esconder o valor apagaria a lição.
    expect(codeBlockSnippet({ language: 'cobol' })).toContain("language: 'cobol'");
  });

  it('leva o código como literal de várias linhas, sem helper de story', () => {
    const código = codeBlockSnippet({ code: 'const a = 1;\nconst b = 2;' });
    expect(código).toContain('const source = `const a = 1;\nconst b = 2;`;');
    expect(código).not.toContain('COMPOSITION_CODE');
    expect(código).not.toContain('LANGUAGE_ITEMS');
    expect(código).not.toContain('LONG_CODE');
    expect(código).not.toContain('renderLanguage');
  });

  it('escapa o que fecharia a crase antes da hora', () => {
    const código = codeBlockSnippet({ code: 'const s = `${x}`;' });
    expect(código).toContain('\\`');
    expect(código).toContain('\\${');
  });
});

describe('codeBlockComRemocaoSnippet', () => {
  it('acrescenta a saída da página à mesma chamada', () => {
    const código = codeBlockWithRemovalSnippet({ language: 'ts' });
    expect(código).toContain('createCodeBlock({');
    expect(código).toContain('bloco.remove();');
  });
});

describe('codeBlockSource', () => {
  it('acompanha os controls em vez de congelar um snippet fixo', () => {
    const noArgs = codeBlockSource('<div data-slot="code-block">', {});
    const withArgs = codeBlockSource('<div data-slot="code-block">', {
      args: { language: 'ts', title: 'exemplo.ts' },
    });
    expect(noArgs).not.toBe(withArgs);
    expect(withArgs).toContain("title: 'exemplo.ts'");
  });

  it('ignora o HTML gerado pelo renderer', () => {
    expect(codeBlockSource('<div data-slot="code-block" data-numbered="true">', {})).not.toContain(
      'data-numbered',
    );
  });
});

describe('codeBlockSourceCom', () => {
  it('sobrepõe os args da story com as opções fixas', () => {
    const transform = codeBlockSourceWith({ language: 'css', showLineNumbers: false });
    const código = transform('', { args: { language: 'ts' } });
    expect(código).toContain("language: 'css'");
    expect(código).not.toContain("language: 'ts'");
    expect(código).toContain('showLineNumbers: false');
  });
});
