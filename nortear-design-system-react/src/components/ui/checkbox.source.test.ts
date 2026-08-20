import { describe, expect, it } from 'vitest';
import {
  checkboxComDescricaoSource,
  checkboxDesabilitadoMarcadoSource,
  checkboxDesabilitadoSource,
  checkboxEmCardSource,
  checkboxEmFormularioSource,
  checkboxErroSource,
  checkboxGrupoSource,
  checkboxIndeterminadoSource,
  checkboxMarcadoSource,
  checkboxSelecionarTodosSource,
  checkboxSource,
} from './checkbox.source';

const TODAS = [
  checkboxSource,
  checkboxMarcadoSource,
  checkboxIndeterminadoSource,
  checkboxDesabilitadoSource,
  checkboxDesabilitadoMarcadoSource,
  checkboxErroSource,
  checkboxComDescricaoSource,
  checkboxGrupoSource,
  checkboxSelecionarTodosSource,
  checkboxEmCardSource,
  checkboxEmFormularioSource,
];

describe('checkboxSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    expect(checkboxSource()).toContain('import { Checkbox } from "@/components/ui/checkbox";');
  });

  it('escreve o par caixa+rótulo, que é a unidade mínima do componente', () => {
    const saida = checkboxSource();
    expect(saida).toContain('<Checkbox id="termos" />');
    expect(saida).toContain('<label htmlFor="termos" className="nds-label">');
  });

  it('omite toda prop que é igual ao padrão do componente', () => {
    const saida = checkboxSource(undefined, {
      args: {
        defaultChecked: false,
        disabled: false,
        required: false,
        readOnly: false,
        indeterminate: false,
        value: 'on',
      },
    });
    expect(saida).toContain('<Checkbox id="termos" />');
    expect(saida).not.toContain('value=');
    expect(saida).not.toContain('disabled');
  });

  it('mapeia cada arg ligado para a prop real do componente', () => {
    const saida = checkboxSource(undefined, {
      args: {
        name: 'termos',
        value: 'aceito',
        defaultChecked: true,
        indeterminate: true,
        disabled: true,
        required: true,
        readOnly: true,
      },
    });
    for (const parte of [
      'name="termos"',
      'value="aceito"',
      'defaultChecked',
      'indeterminate',
      'disabled',
      'required',
      'readOnly',
    ]) {
      expect(saida).toContain(parte);
    }
    // Fila longa quebra uma prop por linha; o fechamento volta à indentação da tag.
    expect(saida).toContain('<Checkbox\n');
    expect(saida).toContain('\n  />');
  });

  it('não deixa o espião do control virar atributo', () => {
    const espiao = (() => 'CORPO_DO_MOCK') as never;
    const saida = checkboxSource(undefined, { args: { name: espiao, value: espiao } });
    expect(saida).toContain('<Checkbox id="termos" />');
    expect(saida).not.toContain('CORPO_DO_MOCK');
  });
});

describe('estados', () => {
  it('marcada nasce de defaultChecked, sem controle externo', () => {
    expect(checkboxMarcadoSource()).toContain('<Checkbox id="sessao" defaultChecked />');
  });

  it('o estado misto é propriedade dedicada, não um terceiro valor de checked', () => {
    const saida = checkboxIndeterminadoSource();
    expect(saida).toContain('indeterminate');
    expect(saida).not.toContain('checked="indeterminate"');
    expect(saida).not.toContain('defaultChecked');
  });

  it('o esmaecimento do desabilitado é do grupo, e o rótulo apaga junto', () => {
    for (const saida of [checkboxDesabilitadoSource(), checkboxDesabilitadoMarcadoSource()]) {
      expect(saida).toContain('data-disabled="true"');
      expect(saida).toContain('disabled');
      expect(saida).toContain('className="nds-label"');
    }
    expect(checkboxDesabilitadoMarcadoSource()).toContain('defaultChecked');
  });

  it('o erro é sinalizado por aria-invalid, com a mensagem fora do rótulo', () => {
    const saida = checkboxErroSource();
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).toContain('nds-text-destructive');
    expect(saida).toContain('Você precisa aceitar os termos para continuar.');
    // A mensagem é irmã do par: dentro do <label> ela entraria no nome acessível.
    expect(saida.indexOf('</label>')).toBeLessThan(saida.indexOf('nds-text-destructive'));
  });
});

describe('composições', () => {
  it('o texto auxiliar alinha o par pelo topo', () => {
    const saida = checkboxComDescricaoSource();
    expect(saida).toContain('data-align="start"');
    expect(saida).toContain('Enviaremos no máximo 2 emails por semana.');
  });

  it('o grupo existe por fieldset + legend, e não por proximidade visual', () => {
    const saida = checkboxGrupoSource();
    expect(saida).toContain('<fieldset');
    expect(saida).toContain('<legend');
    expect(saida).toContain('Preferências de contato');
  });

  it('a seleção em massa ensina o modo controlado que produz o estado misto', () => {
    const saida = checkboxSelecionarTodosSource();
    expect(saida).toContain('import { useState } from "react";');
    expect(saida).toContain('const [marcados, setMarcados] = useState<string[]>([]);');
    expect(saida).toContain('checked={todos}');
    expect(saida).toContain('indeterminate={alguns}');
    expect(saida).toContain('onCheckedChange={(marcado) =>');
  });

  it('o card é moldura: quem recebe o clique continua sendo o par', () => {
    const saida = checkboxEmCardSource();
    expect(saida).toContain('nds-shadow-sm');
    expect(saida).toContain('<label htmlFor="plano-pro"');
    expect(saida).not.toContain('onClick');
  });

  it('no formulário o estado que vale é o do FormData', () => {
    const saida = checkboxEmFormularioSource();
    expect(saida).toContain('name="termos"');
    expect(saida).toContain('value="aceito"');
    expect(saida).toContain('new FormData(evento.currentTarget)');
    expect(saida).toContain('<Button type="submit">Enviar</Button>');
  });
});

describe('regras do repositório', () => {
  it('toda caixa tem rótulo associado, e nenhum snippet leva estilo inline', () => {
    for (const fn of TODAS) {
      const saida = fn();
      expect(saida).toContain('htmlFor=');
      expect(saida).not.toContain('style={{');
      expect(saida).not.toContain('fixtures');
    }
  });
});
