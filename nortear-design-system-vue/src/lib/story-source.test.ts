import { describe, expect, it } from 'vitest';
import {
  attr,
  attrBool,
  attrNum,
  attrs,
  attrsMultilinha,
  asCode,
  indentar,
  texto,
  vueSnippet,
} from './story-source';

describe('vueSnippet', () => {
  it('monta o SFC com script setup e template indentado', () => {
    expect(vueSnippet(`import { Badge } from '@/components/ui/badge'`, '<Badge>Novo</Badge>')).toBe(
      `<script setup lang="ts">
import { Badge } from '@/components/ui/badge'
</script>

<template>
  <Badge>Novo</Badge>
</template>`,
    );
  });

  it('sem script, devolve só o template — há exemplo que não importa nada', () => {
    expect(vueSnippet('', '<p class="nds-text-sm">Texto</p>')).toBe(
      `<template>
  <p class="nds-text-sm">Texto</p>
</template>`,
    );
  });

  it('não indenta linha vazia — espaço à toa vira diff no painel', () => {
    expect(indentar('a\n\nb')).toBe('  a\n\n  b');
  });
});

describe('attrs', () => {
  it('devolve string vazia quando nada difere do padrão', () => {
    expect(attrs('', undefined, false, null)).toBe('');
  });

  it('traz o espaço da frente junto quando há atributo', () => {
    expect(attrs('a="1"', '', 'b="2"')).toBe(' a="1" b="2"');
  });
});

describe('attrsMultilinha', () => {
  it('mantém em linha única enquanto couber', () => {
    expect(attrsMultilinha(['a="1"', 'b="2"'])).toBe(' a="1" b="2"');
  });

  it('quebra um por linha quando a fila passa do limite', () => {
    const saida = attrsMultilinha(['aaaaaaaaaa="1"', 'bbbbbbbbbb="2"'], '  ', 10);
    expect(saida).toBe('\n  aaaaaaaaaa="1"\n  bbbbbbbbbb="2"\n');
  });
});

describe('comoCodigo', () => {
  it('deixa passar string útil', () => {
    expect(asCode('contar()')).toBe('contar()');
  });

  it('barra o espião de ação — control de handler chega como FUNÇÃO', () => {
    // Sem esta guarda o corpo do mock do Storybook aparece no painel como se
    // fosse o exemplo que o leitor deve copiar.
    const spy = Object.assign(() => {}, { isAction: true });
    expect(asCode(spy)).toBeUndefined();
  });

  it('barra objeto, número e string em branco', () => {
    expect(asCode({ a: 1 })).toBeUndefined();
    expect(asCode(3)).toBeUndefined();
    expect(asCode('   ')).toBeUndefined();
  });
});

describe('texto', () => {
  it('cai no padrão quando o control não trouxe string', () => {
    expect(texto(undefined, 'Salvar')).toBe('Salvar');
    expect(texto(() => {}, 'Salvar')).toBe('Salvar');
  });

  it('escapa aspas — elas fechariam o atributo cedo', () => {
    expect(texto('diz "oi"')).toBe('diz &quot;oi&quot;');
  });
});

describe('attr / attrBool / attrNum', () => {
  it('omite o atributo quando o valor bate com o padrão', () => {
    expect(attr('variant', 'default', 'default')).toBe('');
    expect(attrBool('disabled', false, false)).toBe('');
    expect(attrNum('max', 100, 100)).toBe('');
  });

  it('escreve só o que difere do padrão', () => {
    expect(attr('variant', 'outline', 'default')).toBe('variant="outline"');
    expect(attrBool('disabled', true, false)).toBe('disabled');
    expect(attrBool('decorative', false, true)).toBe(':decorative="false"');
    expect(attrNum('max', 50, 100)).toBe(':max="50"');
  });

  it('não deixa função virar atributo', () => {
    expect(attr('label', () => {})).toBe('');
  });
});
