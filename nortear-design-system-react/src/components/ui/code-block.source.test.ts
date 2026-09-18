import { describe, expect, it } from 'vitest';
import {
  codeBlockHeaderActionsSource,
  codeBlockLineKindsSource,
  codeBlockPaletteSource,
  codeBlockRemovivelSource,
  codeBlockRolagemSource,
  codeBlockSource,
} from './code-block.source';

const ALL = [
  codeBlockSource,
  codeBlockRolagemSource,
  codeBlockPaletteSource,
  codeBlockRemovivelSource,
  codeBlockLineKindsSource,
  codeBlockHeaderActionsSource,
];

describe('codeBlockSource', () => {
  it('ensina a importação do design system', () => {
    expect(codeBlockSource()).toContain('import { CodeBlock } from "@/components/ui/code-block";');
  });

  it('declara o trecho num template literal em vez de espremê-lo na prop', () => {
    const output = codeBlockSource();
    expect(output).toContain('const source = `');
    expect(output).toContain('code={source}');
    // As quebras de linha do trecho sobrevivem ao copiar — é o motivo do literal.
    expect(output).toContain('const items = await load();\nconst total = items.length;');
    expect(output).not.toContain('\\n');
  });

  it('mapeia os args para as props reais', () => {
    const output = codeBlockSource(undefined, {
      args: {
        code: 'const total = items.length;',
        language: 'ts',
        title: 'lista.ts',
        highlightLines: '1, 4-5',
        footer: 'A ação de copiar leva apenas o código.',
      },
    });
    expect(output).toContain('language="ts"');
    expect(output).toContain('title="lista.ts"');
    expect(output).toContain('highlightLines="1, 4-5"');
    expect(output).toContain('footer="A ação de copiar leva apenas o código."');
    expect(output).toContain('const source = `const total = items.length;`;');
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
    const output = codeBlockSource(undefined, {
      args: { code: 'const s = `total: ${n}`;' },
    });
    expect(output).toContain('\\`total: \\${n}\\`');
  });

  it('não deixa o espião do control virar código', () => {
    const spy = (() => 'CORPO_DO_MOCK') as never;
    const output = codeBlockSource(undefined, { args: { code: spy, language: spy } });
    expect(output).not.toContain('CORPO_DO_MOCK');
    expect(output).toContain('<CodeBlock code={source} />');
  });
});

describe('overrides de story', () => {
  it('a rolagem não tem prop: o snippet mostra só um trecho que não cabe', () => {
    const output = codeBlockRolagemSource();
    expect(output).toContain('<CodeBlock code={source} language="ts" />');
    // A região de rolagem é do componente: não há prop nem tabIndex a escrever.
    expect(output).not.toContain('tabIndex');
    expect(output).not.toContain('overflow');
    // A parede de 40 linhas geradas da story fica de fora.
    expect(output.split('\n').length).toBeLessThan(12);
  });

  it('a paleta é a mesma nos dois temas: o snippet não carrega tema nenhum', () => {
    const output = codeBlockPaletteSource();
    expect(output).toContain('highlightLines={[2]}');
    expect(output).not.toContain('dark');
    expect(output).not.toContain('theme');
  });

  it('o bloco removível ensina montagem condicional, não a limpeza interna', () => {
    const output = codeBlockRemovivelSource();
    expect(output).toContain('import { useState } from "react";');
    expect(output).toContain('{visivel && <CodeBlock code={source} language="ts" />}');
    expect(output).toContain('<Button variant="outline"');
    expect(output).not.toContain('setTimeout');
  });
});

describe('codeBlockLineKindsSource', () => {
  it('mostra a lista de espécies junto do trecho que ela indexa', () => {
    const output = codeBlockLineKindsSource();
    expect(output).toContain('lineKinds={["context", "removed", "added", "context"]}');
    // Uma entrada por linha: lista e trecho precisam ter o mesmo comprimento,
    // senão o exemplo ensina uma classificação que não fecha.
    expect(output).toContain('const total = items.filter(Boolean).length;');
  });
});

describe('codeBlockHeaderActionsSource', () => {
  it('ensina a importar o botão que ele monta na fila', () => {
    const output = codeBlockHeaderActionsSource();
    expect(output).toContain('import { Button } from "@/components/ui/button";');
    expect(output).toContain('actions={<Button variant="ghost" size="sm">Executar</Button>}');
  });
});

describe('regras do repositório', () => {
  it('nenhum snippet leva estilo inline nem andaime da story', () => {
    for (const fn of ALL) {
      const output = fn();
      expect(output).toContain('code={source}');
      expect(output).not.toContain('style={{');
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('{...args}');
    }
  });
});
