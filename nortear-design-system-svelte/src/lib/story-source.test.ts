import { describe, expect, it } from 'vitest';
import { attrs, attrsMultilinha, FIM_SCRIPT, svelteSnippet } from './story-source';

describe('attrs', () => {
  it('devolve string vazia quando nada difere do padrão', () => {
    expect(attrs('', false, null, undefined)).toBe('');
  });

  it('abre com espaço e junta só o que sobrou', () => {
    expect(attrs('a="1"', false, 'b="2"')).toBe(' a="1" b="2"');
  });
});

describe('attrsMultilinha', () => {
  it('mantém em linha única enquanto couber no limite', () => {
    expect(attrsMultilinha(['a="1"', 'b="2"'])).toBe(' a="1" b="2"');
  });

  it('quebra uma linha por atributo quando passa do limite', () => {
    const saida = attrsMultilinha(['aaaa="1"', 'bbbb="2"'], '  ', 10);
    expect(saida).toBe('\n  aaaa="1"\n  bbbb="2"\n');
  });
});

describe('svelteSnippet', () => {
  it('fecha o bloco de script sem escapar a barra', () => {
    expect(FIM_SCRIPT).toBe('</script>');
    const saida = svelteSnippet('import { X } from "@/components/ui/x";', '<X />');
    expect(saida).toBe(
      '<script lang="ts">\n  import { X } from "@/components/ui/x";\n</script>\n\n<X />',
    );
  });

  it('devolve só a marcação quando não há o que importar', () => {
    expect(svelteSnippet('', '<div class="nds-card"></div>')).toBe('<div class="nds-card"></div>');
  });
});
