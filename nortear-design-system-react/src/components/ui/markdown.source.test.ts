import { describe, expect, it } from 'vitest';
import {
  markdownChatSource,
  markdownEmptySource,
  markdownFullSource,
  markdownSource,
  markdownStreamingSource,
} from './markdown.source';

describe('markdownSource', () => {
  it('devolve a marcação que se escreve, e não o documento já desenhado', () => {
    const code = markdownSource('', { args: { content: '# oi' } });
    expect(code).toContain('import { Markdown } from "@/components/ui/markdown";');
    expect(code).toContain('<Markdown content={answer}');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('nds-markdown-paragraph');
  });

  it('o documento entra como template literal, com as quebras de pé', () => {
    // Achatar em '\n' esconderia a forma que o Markdown usa para significar: a
    // linha em branco entre parágrafos É a sintaxe.
    const code = markdownSource('', { args: { content: '# título\n\nparágrafo' } });
    expect(code).toContain('const answer = `# título\n\nparágrafo`;');
  });

  it('crase e interpolação dentro do documento não fecham o literal', () => {
    // Documento com bloco de código traz crase por definição — é o caso comum,
    // não a borda.
    const code = markdownSource('', { args: { content: 'use `npm i` e ${x}' } });
    expect(code).toContain('\\`npm i\\`');
    expect(code).toContain('\\${x}');
  });

  it('omite o que o componente já assume por padrão', () => {
    const code = markdownSource('', { args: { content: '# oi' } });
    expect(code).not.toContain('streaming');
    expect(code).not.toContain('allow');
    expect(code).not.toContain('onLinkClick');
  });

  it('a lista branca COMPLETA não entra: repetir o padrão ensina ruído', () => {
    const todos = markdownSource('', {
      args: {
        content: '# oi',
        allow: ['paragraph', 'heading', 'code', 'blockquote', 'list', 'thematicBreak', 'table', 'raw'],
      },
    });
    expect(todos).not.toContain('allow');
    // Restrita, sim: aí é decisão de quem escreveu a story.
    expect(markdownChatSource()).toContain('allow={[');
  });

  it('o ouvinte aparece como ponto de entrada, sem inventar o corpo', () => {
    const code = markdownSource('', { args: { content: '# oi', onLinkClick: () => {} } });
    expect(code).toContain('onLinkClick={(url) => abrir(url)}');
  });
});

describe('transforms de story', () => {
  it('cada uma devolve um snippet completo sem receber argumento', () => {
    for (const fn of [markdownFullSource, markdownChatSource, markdownStreamingSource, markdownEmptySource]) {
      const code = fn();
      expect(code).toContain('<Markdown content={answer}');
      expect(code).not.toContain('undefined');
    }
  });

  it('a de streaming mostra a prop que a story liga', () => {
    expect(markdownStreamingSource()).toContain('streaming');
  });
});
