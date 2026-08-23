import { describe, expect, it } from 'vitest';
import {
  switchCompactoSource,
  switchControlledSource,
  switchDisabledLigadoSource,
  switchDisabledSource,
  switchInvalidoSource,
  switchLigadoSource,
  switchListCompactaSource,
  switchPanelSource,
  switchPreferenciasSource,
  switchSource,
  switchWithDescriptionSource,
} from './switch.source';

/**
 * Todos os construtores do arquivo. A guarda transversal
 * `source-snippets.test.ts` varre `./**\/*.source.ts` por glob e já cobria estes
 * exports; o que faltava aqui era o teste POR COMPONENTE, que é o único que o
 * filtro `vitest --project=unit switch` alcança. Sem ele, rodar o portão do
 * switch nesta stack media zero e não avisava que media zero.
 */
const TODOS = [
  switchSource,
  switchLigadoSource,
  switchDisabledSource,
  switchDisabledLigadoSource,
  switchInvalidoSource,
  switchWithDescriptionSource,
  switchCompactoSource,
  switchPanelSource,
  switchPreferenciasSource,
  switchControlledSource,
  switchListCompactaSource,
];

describe('switchSource', () => {
  it('sem args, entrega o par mínimo: controle e rótulo vinculados pelo id', () => {
    expect(switchSource()).toBe(
      `import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

<div className="nds-cluster" data-spacing="sm">
  <Switch id="notificacoes" />
  <Label htmlFor="notificacoes">Receber notificações</Label>
</div>`,
    );
  });

  it('o nome do campo entra como veio do control', () => {
    expect(switchSource(undefined, { args: { name: 'alertas' } })).toContain(
      '<Switch id="notificacoes" name="alertas" />',
    );
  });

  it('o degrau padrão não é escrito, o compacto é', () => {
    expect(switchSource(undefined, { args: { size: 'default' } })).toContain(
      '<Switch id="notificacoes" />',
    );
    expect(switchSource(undefined, { args: { size: 'sm' } })).toContain('size="sm"');
  });

  it('omite toda prop igual ao padrão do componente', () => {
    const saida = switchSource(undefined, {
      args: { defaultChecked: false, disabled: false, size: 'default' },
    });
    expect(saida).toContain('<Switch id="notificacoes" />');
    expect(saida).not.toContain('defaultChecked');
    expect(saida).not.toContain('disabled');
  });

  it('não interpola o espião de onCheckedChange', () => {
    // O Storybook entrega um mock em `args`; o corpo dele apareceria no painel
    // como se fosse código do design system.
    const saida = switchSource(undefined, {
      args: { onCheckedChange: () => undefined } as never,
    });
    expect(saida).not.toContain('onCheckedChange');
  });
});

describe('estados', () => {
  it('ligado parte de defaultChecked, que é prop de montagem', () => {
    expect(switchLigadoSource()).toContain('defaultChecked');
    // `checked` congelaria o interruptor no valor escrito: quem copiasse teria
    // um controle que não responde ao clique.
    expect(switchLigadoSource()).not.toContain(' checked');
  });

  it('desabilitado mantém o rótulo — bloquear não é motivo para esconder o sentido', () => {
    const saida = switchDisabledSource();
    expect(saida).toContain('disabled');
    expect(saida).toContain('<Label htmlFor="notificacoes">Receber notificações</Label>');
  });

  it('desabilitado e ligado escreve as duas props, que são o assunto do exemplo', () => {
    const saida = switchDisabledLigadoSource();
    expect(saida).toContain('disabled');
    expect(saida).toContain('defaultChecked');
  });

  it('inválido leva o par aria-invalid + aria-describedby, nunca um sozinho', () => {
    const saida = switchInvalidoSource();
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).toContain('aria-describedby="aceitar-termos-erro"');
    // O anel de erro sem mensagem apontada diz que algo falhou e não diz o quê.
    expect(saida).toContain('id="aceitar-termos-erro"');
    expect(saida).toContain('Este campo é obrigatório.');
  });
});

describe('todos os construtores', () => {
  it('ensinam a importação do design system, não a da lib headless', () => {
    for (const construir of TODOS) {
      const saida = construir();
      expect(saida).toContain('import { Switch } from "@/components/ui/switch";');
      expect(saida).not.toContain('@base-ui');
    }
  });

  it('não vazam classe de lib removida do projeto', () => {
    // `flex`, `items-center` e afins têm forma de Tailwind, que saiu do projeto:
    // quem copiar recebe markup sem estilo, porque a folha não define nada disso.
    for (const construir of TODOS) {
      const saida = construir();
      const classes = [...saida.matchAll(/className="([^"]+)"/g)].flatMap(([, v]) =>
        v.split(/\s+/),
      );
      const forasteiras = classes.filter((c) => c && !c.startsWith('nds-'));
      expect(forasteiras, `${construir.name} escreve classe fora do prefixo nds-`).toEqual([]);
    }
  });

  it('nunca entregam um Switch sem nome acessível', () => {
    // Sem rótulo associado o controle é anunciado como "botão", sem dizer o que
    // ele liga. É a regra que faz todo snippet daqui montar o PAR.
    for (const construir of TODOS) {
      const saida = construir();
      const temRotulo = saida.includes('<Label') || saida.includes('aria-label');
      expect(temRotulo, `${construir.name} entrega Switch sem rótulo`).toBe(true);
    }
  });
});
