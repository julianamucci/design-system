import { describe, expect, it } from 'vitest';
import { markdownSnippet, markdownSource, markdownSourceWith } from './markdown.source';

describe('markdownSnippet', () => {
  it('devolve a chamada da fábrica, e não o documento já desenhado', () => {
    const code = markdownSnippet();
    expect(code).toContain("import { createMarkdown } from '@/components/ui/markdown';");
    expect(code).toContain('createMarkdown({');
    expect(code).toContain("document.querySelector('#app')?.append(view);");
    // O que o `outerHTML` traria e que não se escreve à mão.
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('nds-markdown-paragraph');
  });

  it('omite o que a fábrica já assume por padrão', () => {
    const code = markdownSnippet();
    expect(code).not.toContain('streaming');
    expect(code).not.toContain('allow');
    expect(code).not.toContain('allowedProtocols');
    expect(code).not.toContain('onLinkClick');
  });

  it('mostra as opções quando a story as usa', () => {
    const code = markdownSnippet({
      streaming: true,
      allow: ['paragraph', 'code'],
      allowedProtocols: ['https:'],
      onLinkClick: true,
      class: 'nds-max-w-prose',
    });
    expect(code).toContain('streaming: true');
    expect(code).toContain("allow: ['paragraph', 'code']");
    expect(code).toContain("allowedProtocols: ['https:']");
    expect(code).toContain('onLinkClick: (url) => abrir(url)');
    expect(code).toContain("class: 'nds-max-w-prose'");
  });

  it('lista vazia não vira opção — é o mesmo que não passar nada', () => {
    expect(markdownSnippet({ allow: [] })).not.toContain('allow');
  });

  it('o documento entra como literal de várias linhas, com as quebras de pé', () => {
    // Achatar em '\n' esconderia a forma que o Markdown usa para significar: a
    // linha em branco entre parágrafos É a sintaxe.
    const code = markdownSnippet({ content: '# título\n\nparágrafo' });
    expect(code).toContain('const resposta = `# título\n\nparágrafo`;');
    expect(code).toContain('content: resposta');
  });

  it('crase e interpolação dentro do documento não fecham o literal', () => {
    // Um documento com bloco de código traz crase por definição — é o caso
    // comum, não a borda.
    const code = markdownSnippet({ content: 'use `npm i` e ${x}' });
    expect(code).toContain('\\`npm i\\`');
    expect(code).toContain('\\${x}');
  });
});

describe('markdownSource', () => {
  it('lê os args da story e ignora o outerHTML gerado', () => {
    const code = markdownSource('<div class="nds-markdown">…</div>', {
      args: { content: '# oi', streaming: true },
    });
    expect(code).toContain('const resposta = `# oi`;');
    expect(code).toContain('streaming: true');
    expect(code).not.toContain('<div');
  });

  it('sem args, ainda devolve um snippet completo', () => {
    expect(markdownSource('', {})).toContain('createMarkdown({');
  });
});

describe('markdownSourceWith', () => {
  it('o que a story fixa vence o que veio nos args', () => {
    const transform = markdownSourceWith({ streaming: true });
    const code = transform('', { args: { content: '# oi', streaming: false } });
    expect(code).toContain('streaming: true');
  });
});
