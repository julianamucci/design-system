import { describe, expect, it } from 'vitest';
import {
  codeBlockPaletteSource,
  codeBlockRemovivelSource,
  codeBlockSource,
} from './code-block.source';

describe('codeBlockSource', () => {
  it('sem args, entrega o bloco mínimo com a linguagem no padrão', () => {
    expect(codeBlockSource()).toBe(
      `<script lang="ts">
  import { CodeBlock } from "@/components/ui/code-block";
  const source = "…";
</script>

<CodeBlock
  code={source}
  language="text"
/>`,
    );
  });

  it('acompanha o control de linguagem', () => {
    expect(codeBlockSource('', { args: { language: 'svelte' } })).toContain('language="svelte"');
  });

  it('só escreve o rótulo do arquivo quando o control traz um', () => {
    expect(codeBlockSource()).not.toContain('title=');
    expect(codeBlockSource('', { args: { title: 'lista.ts' } })).toContain('title="lista.ts"');
  });

  it('só escreve a numeração quando ela é desligada — ligada é o padrão', () => {
    expect(codeBlockSource('', { args: { showLineNumbers: true } })).not.toContain(
      'showLineNumbers',
    );
    expect(codeBlockSource('', { args: { showLineNumbers: false } })).toContain(
      'showLineNumbers={false}',
    );
  });

  it('escreve o destaque na forma que o control usou', () => {
    // As duas formas são API do componente: a lista vai entre chaves, o texto
    // entre aspas. Trocar uma pela outra ensinaria a escrever o que não compila.
    expect(codeBlockSource('', { args: { highlightLines: [2] } })).toContain(
      'highlightLines={[2]}',
    );
    expect(codeBlockSource('', { args: { highlightLines: '1, 4-5' } })).toContain(
      'highlightLines="1, 4-5"',
    );
    expect(codeBlockSource('', { args: { highlightLines: [] } })).not.toContain('highlightLines');
  });

  it('só escreve o rodapé quando há observação', () => {
    expect(codeBlockSource('', { args: { footer: '' } })).not.toContain('footer');
    expect(codeBlockSource('', { args: { footer: 'A cópia leva só o código.' } })).toContain(
      'footer="A cópia leva só o código."',
    );
  });
});

describe('transforms das stories de paleta e de remoção', () => {
  it('a paleta empilha um bloco por linguagem e um com linha em destaque', () => {
    const saida = codeBlockPaletteSource();
    expect(saida).toContain('{#each trechos as trecho (trecho.language)}');
    expect(saida).toContain('showLineNumbers={false}');
    expect(saida).toContain('highlightLines={[2]}');
  });

  it('a remoção mostra a montagem condicional que cancela o temporizador', () => {
    const saida = codeBlockRemovivelSource();
    expect(saida).toContain('let visivel = $state(true);');
    expect(saida).toContain('{#if visivel}');
    expect(saida).toContain('<CodeBlock code={source} language="ts" />');
  });
});
