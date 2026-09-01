import { describe, expect, it } from 'vitest';
import {
  codeBlockWithRemovalSnippet,
  codeBlockHeaderActionsSource,
  codeBlockLineKindsSource,
  codeBlockSnippet,
  codeBlockSource,
  codeBlockSourceWith,
} from './code-block.source';

describe('codeBlockSnippet', () => {
  it('devolve a chamada da fábrica, e não o outerHTML do elemento', () => {
    const code = codeBlockSnippet();
    expect(code).toContain("import { createCodeBlock } from '@/components/ui/code-block';");
    expect(code).toContain('createCodeBlock({');
    expect(code).toContain("document.querySelector('#app')?.append(bloco);");
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('nds-code-block-line');
  });

  it('omite o que já é padrão da fábrica', () => {
    const code = codeBlockSnippet();
    expect(code).not.toContain('showLineNumbers');
    expect(code).not.toContain('title');
    expect(code).not.toContain('highlightLines');
    expect(code).not.toContain('footer');
  });

  it('mostra as opções quando a story as usa', () => {
    const code = codeBlockSnippet({
      language: 'ts',
      title: 'exemplo.ts',
      showLineNumbers: false,
      highlightLines: '3, 5-7',
      footer: 'A ação de copiar leva apenas o código.',
    });
    expect(code).toContain("language: 'ts'");
    expect(code).toContain("title: 'exemplo.ts'");
    expect(code).toContain('showLineNumbers: false');
    expect(code).toContain("highlightLines: '3, 5-7'");
    expect(code).toContain("footer: 'A ação de copiar leva apenas o código.'");
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
    const code = codeBlockSnippet({ code: 'const a = 1;\nconst b = 2;' });
    expect(code).toContain('const source = `const a = 1;\nconst b = 2;`;');
    expect(code).not.toContain('COMPOSITION_CODE');
    expect(code).not.toContain('LANGUAGE_ITEMS');
    expect(code).not.toContain('LONG_CODE');
    expect(code).not.toContain('renderLanguage');
  });

  it('escapa o que fecharia a crase antes da hora', () => {
    const code = codeBlockSnippet({ code: 'const s = `${x}`;' });
    expect(code).toContain('\\`');
    expect(code).toContain('\\${');
  });
});

describe('codeBlockLineKindsSource', () => {
  it('mostra a lista de espécies junto do trecho que ela indexa', () => {
    const code = codeBlockLineKindsSource();
    expect(code).toContain("lineKinds: ['context', 'removed', 'added', 'context']");
    // Uma entrada por linha: lista e trecho precisam ter o mesmo comprimento,
    // senão o exemplo ensina uma classificação que não fecha.
    expect(code).toContain('const total = items.filter(Boolean).length;');
  });
});

describe('codeBlockHeaderActionsSource', () => {
  it('ensina a importar o botão que ele monta na fila', () => {
    const code = codeBlockHeaderActionsSource();
    expect(code).toContain("import { createButton } from '@/components/ui/button';");
    expect(code).toContain("actions: [createButton({ variant: 'ghost', size: 'sm', label: 'Executar' })]");
  });
});

describe('codeBlockComRemocaoSnippet', () => {
  it('acrescenta a saída da página à mesma chamada', () => {
    const code = codeBlockWithRemovalSnippet({ language: 'ts' });
    expect(code).toContain('createCodeBlock({');
    expect(code).toContain('bloco.remove();');
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
    const code = transform('', { args: { language: 'ts' } });
    expect(code).toContain("language: 'css'");
    expect(code).not.toContain("language: 'ts'");
    expect(code).toContain('showLineNumbers: false');
  });
});
