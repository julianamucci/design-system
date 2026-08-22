import { describe, expect, it } from 'vitest';
import {
  codeBlockPaletteSource,
  codeBlockRemovivelSource,
  codeBlockRolagemSource,
  codeBlockSource,
} from './code-block.source';

const TODAS = [
  codeBlockSource,
  codeBlockRolagemSource,
  codeBlockPaletteSource,
  codeBlockRemovivelSource,
];

describe('codeBlockSource', () => {
  it('ensina a importação do design system', () => {
    expect(codeBlockSource()).toContain('import { CodeBlock } from "@/components/ui/code-block";');
  });

  it('declara o trecho num template literal em vez de espremê-lo na prop', () => {
    const saida = codeBlockSource();
    expect(saida).toContain('const source = `');
    expect(saida).toContain('code={source}');
    // As quebras de linha do trecho sobrevivem ao copiar — é o motivo do literal.
    expect(saida).toContain('const items = await load();\nconst total = items.length;');
    expect(saida).not.toContain('\\n');
  });

  it('mapeia os args para as props reais', () => {
    const saida = codeBlockSource(undefined, {
      args: {
        code: 'const total = items.length;',
        language: 'ts',
        title: 'lista.ts',
        highlightLines: '1, 4-5',
        footer: 'A ação de copiar leva apenas o código.',
      },
    });
    expect(saida).toContain('language="ts"');
    expect(saida).toContain('title="lista.ts"');
    expect(saida).toContain('highlightLines="1, 4-5"');
    expect(saida).toContain('footer="A ação de copiar leva apenas o código."');
    expect(saida).toContain('const source = `const total = items.length;`;');
  });

  it('aceita as duas formas de highlightLines, como a API', () => {
    const emArray = codeBlockSource(undefined, { args: { highlightLines: [3, '5-7'] } });
    expect(emArray).toContain('highlightLines={[3, "5-7"]}');
    const inText = codeBlockSource(undefined, { args: { highlightLines: '3, 5-7' } });
    expect(inText).toContain('highlightLines="3, 5-7"');
  });

  it('a numeração só aparece quando é desligada, porque o padrão é ligada', () => {
    expect(codeBlockSource(undefined, { args: { showLineNumbers: true } })).not.toContain(
      'showLineNumbers',
    );
    expect(codeBlockSource(undefined, { args: { showLineNumbers: false } })).toContain(
      'showLineNumbers={false}',
    );
  });

  it('escapa o que abriria uma interpolação no literal publicado', () => {
    const saida = codeBlockSource(undefined, {
      args: { code: 'const s = `total: ${n}`;' },
    });
    expect(saida).toContain('\\`total: \\${n}\\`');
  });

  it('não deixa o espião do control virar código', () => {
    const spy = (() => 'CORPO_DO_MOCK') as never;
    const saida = codeBlockSource(undefined, { args: { code: spy, language: spy } });
    expect(saida).not.toContain('CORPO_DO_MOCK');
    expect(saida).toContain('<CodeBlock code={source} />');
  });
});

describe('overrides de story', () => {
  it('a rolagem não tem prop: o snippet mostra só um trecho que não cabe', () => {
    const saida = codeBlockRolagemSource();
    expect(saida).toContain('<CodeBlock code={source} language="ts" />');
    // A região de rolagem é do componente: não há prop nem tabIndex a escrever.
    expect(saida).not.toContain('tabIndex');
    expect(saida).not.toContain('overflow');
    // A parede de 40 linhas geradas da story fica de fora.
    expect(saida.split('\n').length).toBeLessThan(12);
  });

  it('a paleta é a mesma nos dois temas: o snippet não carrega tema nenhum', () => {
    const saida = codeBlockPaletteSource();
    expect(saida).toContain('highlightLines={[2]}');
    expect(saida).not.toContain('dark');
    expect(saida).not.toContain('theme');
  });

  it('o bloco removível ensina montagem condicional, não a limpeza interna', () => {
    const saida = codeBlockRemovivelSource();
    expect(saida).toContain('import { useState } from "react";');
    expect(saida).toContain('{visivel && <CodeBlock code={source} language="ts" />}');
    expect(saida).toContain('<Button variant="outline"');
    expect(saida).not.toContain('setTimeout');
  });
});

describe('regras do repositório', () => {
  it('nenhum snippet leva estilo inline nem andaime da story', () => {
    for (const fn of TODAS) {
      const saida = fn();
      expect(saida).toContain('code={source}');
      expect(saida).not.toContain('style={{');
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('{...args}');
    }
  });
});
