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
  it('devolve o componente que se escreve, e não o template da story', () => {
    const code = markdownSource('', { args: { content: '# oi' } });
    expect(code).toContain("import { NdsMarkdown } from '@/components/ui/markdown';");
    expect(code).toContain('<nds-markdown');
    expect(code).toContain('[content]="answer"');
    // O que o renderer imprimiria sozinho: bindings apontando para props que
    // só existem no arquivo de story.
    expect(code).not.toContain('props');
    expect(code).not.toContain('data-slot=');
  });

  it('o documento entra linha a linha, e não num literal recuado', () => {
    // Recuo no começo de uma linha de Markdown gruda a linha no parágrafo
    // anterior, e com quatro casas vira bloco de código. Cada linha é um item
    // de lista, então o recuo do código-fonte não entra no texto.
    const code = markdownSource('', { args: { content: '# título\n\nparágrafo' } });
    expect(code).toContain("'# título',");
    expect(code).toContain("'',");
    expect(code).toContain("'parágrafo',");
    expect(code).toContain("join('\\n')");
  });

  it('crase do conteúdo sobrevive, porque o literal não é de crase', () => {
    // Todo documento com bloco de código traz três crases. Num template
    // literal elas fechariam a string; aqui são texto comum.
    const code = markdownSource('', { args: { content: '```ts' } });
    expect(code).toContain("'```ts',");
  });

  it('aspa simples do conteúdo sai escapada', () => {
    const code = markdownSource('', { args: { content: "não é o 'padrão'" } });
    expect(code).toContain("\\'padrão\\'");
  });

  it('omite o que o componente já assume por padrão', () => {
    const code = markdownSource('', { args: { content: '# oi' } });
    expect(code).not.toContain('[streaming]');
    expect(code).not.toContain('[allow]');
    expect(code).not.toContain('linkClick');
  });

  it('a lista branca COMPLETA não entra: repetir o padrão ensina ruído', () => {
    const todos = markdownSource('', {
      args: {
        content: '# oi',
        allow: ['paragraph', 'heading', 'code', 'blockquote', 'list', 'thematicBreak', 'table', 'raw'],
      },
    });
    expect(todos).not.toContain('[allow]');
    // Restrita, sim: aí é decisão de quem escreveu a story.
    expect(markdownChatSource()).toContain('[allow]="[');
  });

  it('o ouvinte aparece como evento, que é a forma desta stack', () => {
    const code = markdownSource('', { args: { content: '# oi', linkClick: () => {} } });
    expect(code).toContain('(linkClick)="abrir($event)"');
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
      expect(code).toContain('<nds-markdown');
      expect(code).not.toContain('undefined');
    }
  });

  it('a de streaming mostra o input que a story liga', () => {
    expect(markdownStreamingSource()).toContain('[streaming]="true"');
  });
});
