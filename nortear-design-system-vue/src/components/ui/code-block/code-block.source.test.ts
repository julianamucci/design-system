import { describe, expect, it } from 'vitest';
import {
  codeBlockHeaderActionsSource,
  codeBlockLineKindsSource,
  codeBlockPaletteSource,
  codeBlockRemovidoSource,
  codeBlockRolagemSource,
  codeBlockSource,
} from './code-block.source';

/**
 * O literal que o snippet põe no `script setup`. As costuras internas do módulo
 * não são exportadas — a guarda transversal chama TODA função exportada como se
 * fosse uma transform —, então elas são medidas pela saída.
 */
const declaration = (output: string) => output.split('\n').find((l) => l.startsWith('const source ='));

/** O `</script>` que não veio escapado — o do próprio SFC deve ser o único. */
const fechamentosDeScript = (output: string) => output.match(/(^|[^\\])<\/script>/g) ?? [];

describe('codeBlockSource', () => {
  it('sem args, entrega o bloco com o trecho de partida no script', () => {
    expect(codeBlockSource()).toBe(
      `<script setup lang="ts">
import { CodeBlock } from '@/components/ui/code-block'

const source = \`const items = await load();
const total = items.length;
render(items, total);\`
</script>

<template>
  <CodeBlock :code="source" />
</template>`,
    );
  });

  it('cada control vira o atributo documentado', () => {
    const output = codeBlockSource('', {
      args: {
        code: 'const total = items.length;',
        language: 'ts',
        title: 'lista.ts',
        highlightLines: '1, 3-4',
        footer: 'A ação de copiar leva apenas o código.',
      },
    });
    expect(output).toContain(`const source = 'const total = items.length;'`);
    expect(output).toContain('language="ts"');
    expect(output).toContain('title="lista.ts"');
    expect(output).toContain('highlight-lines="1, 3-4"');
    expect(output).toContain('footer="A ação de copiar leva apenas o código."');
  });

  it('não escreve o que já é padrão do componente', () => {
    const output = codeBlockSource('', {
      args: { language: 'text', showLineNumbers: true, title: '', footer: '' },
    });
    expect(output).not.toContain('language=');
    // A numeração nasce ligada: escrevê-la ensinaria uma configuração que não é.
    expect(output).not.toContain('show-line-numbers');
    expect(output).not.toContain('title=');
    expect(output).not.toContain('footer=');
  });

  it('desligar a numeração é o que entra, porque difere do padrão', () => {
    expect(codeBlockSource('', { args: { showLineNumbers: false } })).toContain(
      ':show-line-numbers="false"',
    );
  });

  it('escapa o fim de script do conteúdo — senão o exemplo para de compilar', () => {
    const output = codeBlockSource('', {
      args: {
        code: `<script setup lang="ts">
const x = 1
</script>`,
      },
    });
    expect(output).toContain('<\\/script>');
    // O único fechamento vivo é o do próprio SFC do snippet.
    expect(fechamentosDeScript(output)).toHaveLength(1);
  });

  it('ignora control que não é do tipo esperado — o espião de ação vira ruído no painel', () => {
    const spy = (() => {}) as never;
    const output = codeBlockSource('', {
      args: {
        code: spy,
        language: spy,
        title: spy,
        showLineNumbers: spy,
        highlightLines: spy,
        footer: spy,
      },
    });
    // Sem código utilizável, o snippet cai no trecho de partida em vez de
    // imprimir o corpo do mock.
    expect(output).toBe(codeBlockSource());
    expect(output).not.toContain('function');
  });
});

describe('o código no script setup', () => {
  it('uma linha simples cabe numa string comum', () => {
    expect(declaration(codeBlockSource('', { args: { code: 'npm run build' } }))).toBe(
      `const source = 'npm run build'`,
    );
  });

  it('aspas simples no conteúdo pedem literal de crase', () => {
    expect(declaration(codeBlockSource('', { args: { code: "const a = 'x'" } }))).toBe(
      'const source = `' + "const a = 'x'" + '`',
    );
  });

  it('no literal de crase, crase e interpolação do conteúdo saem escapadas', () => {
    // Sem o escape elas fechariam o literal e o resto do trecho viraria código.
    const output = codeBlockSource('', { args: { code: 'const a = `${b}`\nconst c = 2' } });
    expect(output).toContain('const source = `const a = \\`\\${b}\\`\nconst c = 2`');
    // Numa string comum a crase é caractere inerte: escapá-la ali só sujaria.
    expect(declaration(codeBlockSource('', { args: { code: 'const a = `${b}`' } }))).toBe(
      "const source = 'const a = `${b}`'",
    );
  });
});

describe('as linhas destacadas', () => {
  it('o texto vira atributo comum e a lista vira ligação', () => {
    expect(codeBlockSource('', { args: { highlightLines: '3, 5-7' } })).toContain(
      'highlight-lines="3, 5-7"',
    );
    expect(codeBlockSource('', { args: { highlightLines: [2] } })).toContain(
      ':highlight-lines="[2]"',
    );
    // Aspas simples por dentro: as duplas já são as do atributo.
    expect(codeBlockSource('', { args: { highlightLines: [1, '4-5'] } })).toContain(
      `:highlight-lines="[1, '4-5']"`,
    );
  });

  it('vazio não vira atributo', () => {
    expect(codeBlockSource('', { args: { highlightLines: '' } })).not.toContain('highlight-lines');
    expect(codeBlockSource('', { args: { highlightLines: [] } })).not.toContain('highlight-lines');
    expect(codeBlockSource()).not.toContain('highlight-lines');
  });
});

describe('transforms das stories de composição própria', () => {
  it('a paleta empilha um bloco por linguagem mais um com destaque', () => {
    const output = codeBlockPaletteSource();
    expect(output).toContain('v-for="trecho in trechos"');
    expect(output).toContain(':language="trecho.language"');
    // Os dois fundos possíveis do componente: a superfície e a linha marcada.
    expect(output).toContain(':highlight-lines="[2]"');
    expect(output).toContain(`{ language: 'bash', code: 'npm run build -- --mode production # publica' },`);
    expect(fechamentosDeScript(output)).toHaveLength(1);
  });

  it('a rolagem gera o trecho em vez de colar quarenta linhas', () => {
    const output = codeBlockRolagemSource();
    expect(output).toContain('Array.from(');
    expect(output).toContain('{ length: 40 }');
    expect(output).toContain('<CodeBlock :code="rotas" language="ts" />');
    // Não há prop de rolagem a ligar: a região é do próprio componente.
    expect(output).not.toContain('scroll');
  });

  it('o bloco removido convive com o botão que o monta e desmonta', () => {
    const output = codeBlockRemovidoSource();
    expect(output).toContain(`import { ref } from 'vue'`);
    expect(output).toContain('<CodeBlock v-if="visivel" :code="source" language="ts" />');
    expect(output).toContain('@click="visivel = !visivel"');
    // O cancelamento do temporizador é do componente: não há nada a escrever.
    expect(output).not.toContain('clearTimeout');
  });

  it('a lista de espécies aparece junto do trecho que ela indexa', () => {
    const output = codeBlockLineKindsSource();
    expect(output).toContain(`:line-kinds="['context', 'removed', 'added', 'context']"`);
    // Uma entrada por linha: lista e trecho precisam ter o mesmo comprimento,
    // senão o exemplo ensina uma classificação que não fecha.
    expect(output).toContain('const total = items.filter(Boolean).length;');
  });

  it('a fila do cabeçalho vem pelo encaixe nomeado, com o botão importado', () => {
    const output = codeBlockHeaderActionsSource();
    expect(output).toContain(`import { Button } from '@/components/ui/button'`);
    expect(output).toContain('<template #actions>');
    expect(output).toContain('<Button variant="ghost" size="sm">Executar</Button>');
  });

  it('nenhum snippet carrega valor de design em style inline', () => {
    for (const output of [
      codeBlockSource(),
      codeBlockPaletteSource(),
      codeBlockRolagemSource(),
      codeBlockRemovidoSource(),
      codeBlockLineKindsSource(),
      codeBlockHeaderActionsSource(),
    ]) {
      expect(output).not.toContain('style="');
    }
  });
});
