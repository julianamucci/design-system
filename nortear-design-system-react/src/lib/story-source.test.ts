/**
 * Testes das costuras das transforms do painel Code.
 *
 * O que se cobra aqui é o que nenhuma suíte de browser alcança: o painel monta
 * a string fora do DOM da `play`.
 */
import { describe, expect, it } from 'vitest';
import {
  attrs,
  attrsMultilinha,
  childText,
  indentar,
  jsxSnippet,
  propBool,
  propNumber,
  propOption,
  propText,
  texto,
} from './story-source';

/** Como o Storybook entrega uma prop de callback: função, não string. */
const espiao = () => 'CORPO_DO_MOCK';

describe('jsxSnippet', () => {
  it('separa cabeçalho e marcação por uma linha em branco', () => {
    expect(jsxSnippet('import { A } from "@/components/ui/a";', '<A />')).toBe(
      'import { A } from "@/components/ui/a";\n\n<A />',
    );
  });

  it('devolve só a marcação quando não há o que importar', () => {
    expect(jsxSnippet('', '<div className="nds-stack" />')).toBe('<div className="nds-stack" />');
  });
});

describe('attrs', () => {
  it('descarta vazios e abre com um espaço', () => {
    expect(attrs('a="1"', '', null, undefined, false, 'b')).toBe(' a="1" b');
  });

  it('não deixa espaço sobrando quando tudo é padrão', () => {
    expect(attrs('', undefined, false)).toBe('');
  });
});

describe('attrsMultilinha', () => {
  it('mantém em linha única enquanto couber', () => {
    expect(attrsMultilinha(['a="1"', 'b="2"'])).toBe(' a="1" b="2"');
  });

  it('quebra uma linha por atributo quando passa do limite', () => {
    const saida = attrsMultilinha([
      'aria-label="um rótulo bem comprido para caber em uma linha só"',
      'orientation="vertical"',
    ]);
    expect(saida.startsWith('\n')).toBe(true);
    expect(saida).toContain('\n  orientation="vertical"\n');
  });

  it('devolve vazio sem nenhum atributo', () => {
    expect(attrsMultilinha([undefined, false, ''])).toBe('');
  });
});

describe('texto', () => {
  it('aceita string não vazia', () => {
    expect(texto(' Salvar ')).toBe('Salvar');
  });

  it('recusa espião de control — ele chega como FUNÇÃO', () => {
    expect(texto(espiao)).toBeUndefined();
    // E o corpo do mock, que é o que apareceria no painel, não sobra em lugar
    // nenhum da montagem.
    expect(attrs(propText('onClick', espiao))).toBe('');
  });

  it('recusa string vazia, número, objeto e nulo', () => {
    for (const valor of ['', '   ', 42, {}, null, undefined, true]) {
      expect(texto(valor)).toBeUndefined();
    }
  });
});

describe('propTexto', () => {
  it('monta o atributo quando há conteúdo', () => {
    expect(propText('aria-label', 'Galeria')).toBe('aria-label="Galeria"');
  });

  it('some quando o arg não é string', () => {
    expect(propText('aria-label', espiao)).toBeUndefined();
  });
});

describe('propNumero', () => {
  it('usa chaves, como JSX exige', () => {
    expect(propNumber('max', 100)).toBe('max={100}');
  });

  it('recusa NaN, Infinity e não-números', () => {
    expect(propNumber('max', Number.NaN)).toBeUndefined();
    expect(propNumber('max', Number.POSITIVE_INFINITY)).toBeUndefined();
    expect(propNumber('max', '100')).toBeUndefined();
  });
});

describe('propBool', () => {
  it('usa a forma abreviada quando liga', () => {
    expect(propBool('disabled', true)).toBe('disabled');
  });

  it('escreve o falso explícito quando o padrão do componente é verdadeiro', () => {
    expect(propBool('decorative', false, true)).toBe('decorative={false}');
  });

  it('some quando o valor é o padrão', () => {
    expect(propBool('disabled', false)).toBeUndefined();
    expect(propBool('decorative', true, true)).toBeUndefined();
  });

  it('some quando o arg não é booleano', () => {
    expect(propBool('disabled', espiao)).toBeUndefined();
  });
});

describe('propOpcao', () => {
  const variantes = ['default', 'outline', 'destructive'] as const;

  it('entra só quando difere do padrão', () => {
    expect(propOption('variant', 'outline', variantes, 'default')).toBe('variant="outline"');
    expect(propOption('variant', 'default', variantes, 'default')).toBeUndefined();
  });

  it('não inventa atributo com valor fora da união', () => {
    expect(propOption('variant', 'roxo', variantes, 'default')).toBeUndefined();
    expect(propOption('variant', espiao, variantes, 'default')).toBeUndefined();
  });
});

describe('indentar', () => {
  it('não empurra linha em branco', () => {
    expect(indentar('a\n\nb')).toBe('  a\n\n  b');
  });
});

describe('filhoTexto', () => {
  it('cai no padrão quando o control entrega um espião', () => {
    expect(childText(espiao, 'Salvar')).toBe('Salvar');
    expect(childText('Enviar', 'Salvar')).toBe('Enviar');
  });
});
