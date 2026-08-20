import { describe, expect, it } from 'vitest';
import {
  buttonCarregandoSource,
  buttonComoLinkSource,
  buttonDefaultSource,
  buttonDesabilitadoSource,
  buttonDestrutivoComIconeSource,
  buttonDestrutivoSource,
  buttonGhostSource,
  buttonIconeDireitaSource,
  buttonIconeEsquerdaSource,
  buttonIconeLgSource,
  buttonIconeSmSource,
  buttonIconeSource,
  buttonIconeXsSource,
  buttonInvalidoSource,
  buttonLinkSource,
  buttonOutlineSource,
  buttonParDeAcoesSource,
  buttonSecundarioSource,
  buttonSomenteIconeSource,
  buttonSource,
  buttonTamanhoLgSource,
  buttonTamanhoPadraoSource,
  buttonTamanhoSmSource,
  buttonTamanhoXsSource,
} from './button.source';

/** Toda transform é chamável sem argumento — é o que a guarda transversal exige. */
const TODOS: Array<() => string> = [
  buttonSource,
  buttonDefaultSource,
  buttonDestrutivoSource,
  buttonOutlineSource,
  buttonSecundarioSource,
  buttonGhostSource,
  buttonLinkSource,
  buttonTamanhoPadraoSource,
  buttonTamanhoXsSource,
  buttonTamanhoSmSource,
  buttonTamanhoLgSource,
  buttonIconeSource,
  buttonIconeXsSource,
  buttonIconeSmSource,
  buttonIconeLgSource,
  buttonDesabilitadoSource,
  buttonCarregandoSource,
  buttonInvalidoSource,
  buttonIconeEsquerdaSource,
  buttonIconeDireitaSource,
  buttonDestrutivoComIconeSource,
  buttonSomenteIconeSource,
  buttonParDeAcoesSource,
  buttonComoLinkSource,
];

describe('buttonSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    const saida = buttonSource();
    expect(saida).toContain('import { Button } from "@/components/ui/button";');
    expect(saida).not.toContain('@base-ui');
  });

  it('omite variant e size quando são o padrão', () => {
    const saida = buttonSource(undefined, {
      args: { variant: 'default', size: 'default', disabled: false, children: 'Botão' },
    });
    expect(saida).toContain('<Button>Botão</Button>');
  });

  it('escreve cada control que difere do padrão, na ordem da API', () => {
    const saida = buttonSource(undefined, {
      args: { variant: 'ghost', size: 'lg', disabled: true, children: 'Enviar' },
    });
    expect(saida).toContain('<Button variant="ghost" size="lg" disabled>Enviar</Button>');
  });

  it('não inventa valor fora da união quando o control é adulterado', () => {
    const saida = buttonSource(undefined, {
      args: { variant: 'roxo' as never, size: 'gigante' as never, children: 'X' },
    });
    expect(saida).toContain('<Button>X</Button>');
  });

  it('cai no texto padrão quando o control entrega um espião no lugar da string', () => {
    // O Storybook cria espião para os args de callback; interpolado, o corpo do
    // mock apareceria no painel como se fosse código do design system.
    const espiao = () => 'CORPO_DO_MOCK';
    const saida = buttonSource(undefined, { args: { children: espiao as never } });
    expect(saida).toContain('<Button>Botão</Button>');
    expect(saida).not.toContain('CORPO_DO_MOCK');
  });

  it('não imprime o onClick do control', () => {
    // O argType dele é `control: false` justamente porque o valor é um espião.
    expect(buttonSource()).not.toContain('onClick');
  });
});

describe('variantes', () => {
  it('cada uma diz a sua, porque o arquivo desliga os controls', () => {
    expect(buttonDefaultSource()).toContain('<Button>Salvar</Button>');
    expect(buttonDestrutivoSource()).toContain('<Button variant="destructive">Excluir conta</Button>');
    expect(buttonOutlineSource()).toContain('<Button variant="outline">Cancelar</Button>');
    expect(buttonSecundarioSource()).toContain('<Button variant="secondary">Ver detalhes</Button>');
    expect(buttonGhostSource()).toContain('<Button variant="ghost">Fechar</Button>');
    expect(buttonLinkSource()).toContain('<Button variant="link">Saiba mais</Button>');
  });
});

describe('tamanhos', () => {
  it('o padrão não escreve size; os demais escrevem o seu', () => {
    expect(buttonTamanhoPadraoSource()).toContain('<Button>Padrão</Button>');
    expect(buttonTamanhoXsSource()).toContain('size="xs"');
    expect(buttonTamanhoSmSource()).toContain('size="sm"');
    expect(buttonTamanhoLgSource()).toContain('size="lg"');
  });

  it('os quatro botões de ícone repetem a mesma lição de nome acessível', () => {
    const porTamanho = {
      'icon': buttonIconeSource(),
      'icon-xs': buttonIconeXsSource(),
      'icon-sm': buttonIconeSmSource(),
      'icon-lg': buttonIconeLgSource(),
    };
    for (const [tamanho, saida] of Object.entries(porTamanho)) {
      expect(saida).toContain(`size="${tamanho}"`);
      // Sem texto dentro, quem nomeia é o aria-label e o ícone sai da árvore de
      // acessibilidade — as duas coisas juntas, ou o botão fica sem nome.
      expect(saida).toContain('aria-label="Adicionar item"');
      expect(saida).toContain('<Plus aria-hidden="true" />');
      expect(saida).toContain('import { Plus } from "lucide-react";');
    }
  });
});

describe('estados', () => {
  it('desabilitado é o atributo nativo, não uma classe', () => {
    const saida = buttonDesabilitadoSource();
    expect(saida).toContain('<Button disabled>Salvar</Button>');
    expect(saida).not.toContain('nds-button-disabled');
  });

  it('carregando soma desabilitado, aria-busy e rótulo em progresso', () => {
    const saida = buttonCarregandoSource();
    expect(saida).toContain('disabled');
    expect(saida).toContain('aria-busy="true"');
    expect(saida).toContain('Salvando…');
    // `.nds-spin` tem guarda de prefers-reduced-motion; `.nds-animate-spin` não.
    expect(saida).toContain('nds-spin');
    expect(saida).not.toContain('nds-animate-spin');
  });

  it('inválido se sinaliza por aria-invalid, que é o que o leitor anuncia', () => {
    expect(buttonInvalidoSource()).toContain('aria-invalid="true"');
    expect(buttonInvalidoSource()).toContain('variant="outline"');
  });
});

describe('composições', () => {
  it('a ordem entre ícone e rótulo é o que separa as duas primeiras', () => {
    const esquerda = buttonIconeEsquerdaSource();
    const direita = buttonIconeDireitaSource();
    expect(esquerda.indexOf('<Plus')).toBeLessThan(esquerda.indexOf('Adicionar item'));
    expect(direita.indexOf('Próximo')).toBeLessThan(direita.indexOf('<ChevronRight'));
  });

  it('todo ícone dentro de botão com texto sai da árvore de acessibilidade', () => {
    for (const saida of [
      buttonIconeEsquerdaSource(),
      buttonIconeDireitaSource(),
      buttonDestrutivoComIconeSource(),
      buttonSomenteIconeSource(),
    ]) {
      expect(saida).toContain('aria-hidden="true"');
    }
  });

  it('sem texto dentro, o aria-label é o único nome que sobra', () => {
    const saida = buttonSomenteIconeSource();
    expect(saida).toContain('aria-label="Baixar arquivo"');
    expect(saida).toContain('size="icon"');
  });

  it('o par de ações deixa a primária à direita, e o respiro é do contêiner', () => {
    const saida = buttonParDeAcoesSource();
    expect(saida).toContain('className="nds-cluster" data-spacing="sm"');
    expect(saida.indexOf('Cancelar')).toBeLessThan(saida.indexOf('Confirmar'));
    expect(saida).toContain('<Button variant="outline">Cancelar</Button>');
    expect(saida).toContain('<Button>Confirmar</Button>');
  });

  it('link com aparência de botão é um <a> de verdade, não o componente', () => {
    const saida = buttonComoLinkSource();
    expect(saida).toContain('import { buttonVariants } from "@/components/ui/button";');
    expect(saida).toContain('className={buttonVariants({ variant: "link" })}');
    // Um `<Button>` aqui ensinaria o oposto: a semântica de link se perderia.
    expect(saida).not.toContain('<Button');
    expect(saida).toContain('href="/docs"');
  });
});

describe('regras que valem para todo snippet de botão', () => {
  it('nenhum crava altura — ela é resultado do padding com o line-height', () => {
    // WCAG 1.4.4: altura fixa congela o botão e corta o texto a 200%.
    for (const fn of TODOS) expect(fn()).not.toMatch(/height/i);
  });

  it('nenhum ensina o andaime da story', () => {
    for (const fn of TODOS) {
      const saida = fn();
      expect(saida).not.toContain('fixtures');
      expect(saida).not.toContain('{...args}');
      expect(saida).not.toContain('undefined');
    }
  });
});
