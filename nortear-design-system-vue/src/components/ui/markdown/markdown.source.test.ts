import { describe, expect, it } from 'vitest';
import {
  markdownChatSource,
  markdownCodeBlockSource,
  markdownEmptySource,
  markdownFullSource,
  markdownSource,
  markdownStreamingSource,
} from './markdown.source';

describe('markdownSource', () => {
  it('devolve o SFC que se escreve, e não o documento já desenhado', () => {
    const code = markdownSource('', { args: { content: '# oi' } });
    expect(code).toContain("import { Markdown } from '@/components/ui/markdown'");
    expect(code).toContain('<Markdown :content="answer"');
    expect(code).toContain('<template>');
    expect(code).not.toContain('data-slot=');
    expect(code).not.toContain('nds-markdown-paragraph');
  });

  it('o documento entra como literal, com as quebras de pé', () => {
    // Achatar em '\n' esconderia a forma que o Markdown usa para significar: a
    // linha em branco entre parágrafos É a sintaxe.
    const code = markdownSource('', { args: { content: '# título\n\nparágrafo' } });
    expect(code).toContain('const answer = `# título\n\nparágrafo`');
  });

  it('crase e interpolação dentro do documento não fecham o literal', () => {
    // Documento com bloco de código traz crase por definição — é o caso comum,
    // não a borda.
    const code = markdownSource('', { args: { content: 'use `npm i` e ${x}' } });
    expect(code).toContain('\\`npm i\\`');
    expect(code).toContain('\\${x}');
  });

  it('`</script` no conteúdo não fecha o bloco do SFC', () => {
    // Sem o escape, o parser do SFC fecharia o script no meio da string e o
    // exemplo deixaria de compilar no primeiro colar.
    const code = markdownSource('', { args: { content: 'texto </script> mais texto' } });
    expect(code).toContain('<\\/script>');
  });

  it('omite o que o componente já assume por padrão', () => {
    const code = markdownSource('', { args: { content: '# oi' } });
    expect(code).not.toContain('streaming');
    expect(code).not.toContain('allow');
  });

  it('a lista branca COMPLETA não entra: repetir o padrão ensina ruído', () => {
    const todos = markdownSource('', {
      args: {
        content: '# oi',
        allow: ['paragraph', 'heading', 'code', 'blockquote', 'list', 'thematicBreak', 'table', 'raw'],
      },
    });
    expect(todos).not.toContain(':allow');
    // Restrita, sim: aí é decisão de quem escreveu a story.
    expect(markdownChatSource()).toContain(':allow="[');
  });

  it('o ouvinte aparece como evento, que é a forma desta stack', () => {
    const code = markdownSource('', { args: { content: '# oi', onLinkClick: () => {} } });
    expect(code).toContain('@link-click="abrir"');
  });
});

describe('transforms de story', () => {
  it('cada uma devolve um snippet completo sem receber argumento', () => {
    for (const fn of [
      markdownFullSource,
      markdownChatSource,
      markdownStreamingSource,
      markdownEmptySource,
      markdownCodeBlockSource,
    ]) {
      const code = fn();
      expect(code).toContain('<Markdown :content="answer"');
      expect(code).not.toContain('undefined');
    }
  });

  it('a de streaming mostra a prop que a story liga', () => {
    expect(markdownStreamingSource()).toContain('streaming');
  });
});
