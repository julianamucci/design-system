import { describe, expect, it } from 'vitest';
import {
  buttonLoadingSource,
  buttonAsLinkSource,
  buttonDefaultSource,
  buttonDisabledSource,
  buttonDestructiveWithIconSource,
  buttonDestructiveSource,
  buttonGhostSource,
  buttonIconDireitaSource,
  buttonIconEsquerdaSource,
  buttonIconLgSource,
  buttonIconSmSource,
  buttonIconSource,
  buttonIconXsSource,
  buttonInvalidoSource,
  buttonLinkSource,
  buttonOutlineSource,
  actionsButtonPairSource,
  buttonSecundarioSource,
  buttonSomenteIconSource,
  buttonSource,
  buttonSizeLgSource,
  buttonSizeDefaultSource,
  buttonSizeSmSource,
  buttonSizeXsSource,
} from './button.source';

/** Toda transform é chamável sem argumento — é o que a guarda transversal exige. */
const ALL: Array<() => string> = [
  buttonSource,
  buttonDefaultSource,
  buttonDestructiveSource,
  buttonOutlineSource,
  buttonSecundarioSource,
  buttonGhostSource,
  buttonLinkSource,
  buttonSizeDefaultSource,
  buttonSizeXsSource,
  buttonSizeSmSource,
  buttonSizeLgSource,
  buttonIconSource,
  buttonIconXsSource,
  buttonIconSmSource,
  buttonIconLgSource,
  buttonDisabledSource,
  buttonLoadingSource,
  buttonInvalidoSource,
  buttonIconEsquerdaSource,
  buttonIconDireitaSource,
  buttonDestructiveWithIconSource,
  buttonSomenteIconSource,
  actionsButtonPairSource,
  buttonAsLinkSource,
];

describe('buttonSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const output = buttonSource();
    expect(output).toContain('import { Button } from "@/components/ui/button";');
    expect(output).not.toContain('@base-ui');
  });

  it('omite variant e size quando são o padrão', () => {
    const output = buttonSource(undefined, {
      args: { variant: 'default', size: 'default', disabled: false, children: 'Botão' },
    });
    expect(output).toContain('<Button>Botão</Button>');
  });

  it('escreve cada control que difere do padrão, na ordem da API', () => {
    const output = buttonSource(undefined, {
      args: { variant: 'ghost', size: 'lg', disabled: true, children: 'Enviar' },
    });
    expect(output).toContain('<Button variant="ghost" size="lg" disabled>Enviar</Button>');
  });

  it('não inventa valor fora da união quando o control é adulterado', () => {
    const output = buttonSource(undefined, {
      args: { variant: 'roxo' as never, size: 'gigante' as never, children: 'X' },
    });
    expect(output).toContain('<Button>X</Button>');
  });

  it('cai no texto padrão quando o control entrega um espião no lugar da string', () => {
    // O Storybook cria espião para os args de callback; interpolado, o corpo do
    // mock apareceria no painel como se fosse código do design system.
    const spy = () => 'CORPO_DO_MOCK';
    const output = buttonSource(undefined, { args: { children: spy as never } });
    expect(output).toContain('<Button>Botão</Button>');
    expect(output).not.toContain('CORPO_DO_MOCK');
  });

  it('não imprime o onClick do control', () => {
    // O argType dele é `control: false` justamente porque o valor é um espião.
    expect(buttonSource()).not.toContain('onClick');
  });
});

describe('variantes', () => {
  it('cada uma diz a sua, porque o arquivo desliga os controls', () => {
    expect(buttonDefaultSource()).toContain('<Button>Salvar</Button>');
    expect(buttonDestructiveSource()).toContain('<Button variant="destructive">Excluir conta</Button>');
    expect(buttonOutlineSource()).toContain('<Button variant="outline">Cancelar</Button>');
    expect(buttonSecundarioSource()).toContain('<Button variant="secondary">Ver detalhes</Button>');
    expect(buttonGhostSource()).toContain('<Button variant="ghost">Fechar</Button>');
    expect(buttonLinkSource()).toContain('<Button variant="link">Saiba mais</Button>');
  });
});

describe('tamanhos', () => {
  it('o padrão não escreve size; os demais escrevem o seu', () => {
    expect(buttonSizeDefaultSource()).toContain('<Button>Padrão</Button>');
    expect(buttonSizeXsSource()).toContain('size="xs"');
    expect(buttonSizeSmSource()).toContain('size="sm"');
    expect(buttonSizeLgSource()).toContain('size="lg"');
  });

  it('os quatro botões de ícone repetem a mesma lição de nome acessível', () => {
    const bySize = {
      'icon': buttonIconSource(),
      'icon-xs': buttonIconXsSource(),
      'icon-sm': buttonIconSmSource(),
      'icon-lg': buttonIconLgSource(),
    };
    for (const [size, output] of Object.entries(bySize)) {
      expect(output).toContain(`size="${size}"`);
      // Sem texto dentro, quem nomeia é o aria-label e o ícone sai da árvore de
      // acessibilidade — as duas coisas juntas, ou o botão fica sem nome.
      expect(output).toContain('aria-label="Adicionar item"');
      expect(output).toContain('<Plus aria-hidden="true" />');
      expect(output).toContain('import { Plus } from "lucide-react";');
    }
  });
});

describe('estados', () => {
  it('desabilitado é o atributo nativo, não uma classe', () => {
    const output = buttonDisabledSource();
    expect(output).toContain('<Button disabled>Salvar</Button>');
    expect(output).not.toContain('nds-button-disabled');
  });

  it('carregando soma desabilitado, aria-busy e rótulo em progresso', () => {
    const output = buttonLoadingSource();
    expect(output).toContain('disabled');
    expect(output).toContain('aria-busy="true"');
    expect(output).toContain('Salvando…');
    // `.nds-spin` tem guarda de prefers-reduced-motion; `.nds-animate-spin` não.
    expect(output).toContain('nds-spin');
    expect(output).not.toContain('nds-animate-spin');
  });

  it('inválido se sinaliza por aria-invalid, que é o que o leitor anuncia', () => {
    expect(buttonInvalidoSource()).toContain('aria-invalid="true"');
    expect(buttonInvalidoSource()).toContain('variant="outline"');
  });
});

describe('composições', () => {
  it('a ordem entre ícone e rótulo é o que separa as duas primeiras', () => {
    const esquerda = buttonIconEsquerdaSource();
    const direita = buttonIconDireitaSource();
    expect(esquerda.indexOf('<Plus')).toBeLessThan(esquerda.indexOf('Adicionar item'));
    expect(direita.indexOf('Próximo')).toBeLessThan(direita.indexOf('<ChevronRight'));
  });

  it('todo ícone dentro de botão com texto sai da árvore de acessibilidade', () => {
    for (const output of [
      buttonIconEsquerdaSource(),
      buttonIconDireitaSource(),
      buttonDestructiveWithIconSource(),
      buttonSomenteIconSource(),
    ]) {
      expect(output).toContain('aria-hidden="true"');
    }
  });

  it('sem texto dentro, o aria-label é o único nome que sobra', () => {
    const output = buttonSomenteIconSource();
    expect(output).toContain('aria-label="Baixar arquivo"');
    expect(output).toContain('size="icon"');
  });

  it('o par de ações deixa a primária à direita, e o respiro é do contêiner', () => {
    const output = actionsButtonPairSource();
    expect(output).toContain('className="nds-cluster" data-spacing="md"');
    expect(output.indexOf('Cancelar')).toBeLessThan(output.indexOf('Confirmar'));
    expect(output).toContain('<Button variant="outline">Cancelar</Button>');
    expect(output).toContain('<Button>Confirmar</Button>');
  });

  it('link com aparência de botão é um <a> de verdade, não o componente', () => {
    const output = buttonAsLinkSource();
    expect(output).toContain('import { buttonVariants } from "@/components/ui/button";');
    expect(output).toContain('className={buttonVariants({ variant: "link" })}');
    // Um `<Button>` aqui ensinaria o oposto: a semântica de link se perderia.
    expect(output).not.toContain('<Button');
    expect(output).toContain('href="/docs"');
  });
});

describe('regras que valem para todo snippet de botão', () => {
  it('nenhum crava altura — ela é resultado do padding com o line-height', () => {
    // WCAG 1.4.4: altura fixa congela o botão e corta o texto a 200%.
    for (const fn of ALL) expect(fn()).not.toMatch(/height/i);
  });

  it('nenhum ensina o andaime da story', () => {
    for (const fn of ALL) {
      const output = fn();
      expect(output).not.toContain('fixtures');
      expect(output).not.toContain('{...args}');
      expect(output).not.toContain('undefined');
    }
  });
});
