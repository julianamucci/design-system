import { describe, expect, it } from 'vitest';
import {
  checkboxWithDescriptionSource,
  checkboxDisabledCheckedSource,
  checkboxDisabledSource,
  checkboxEmCardSource,
  formCheckboxSource,
  checkboxErrorSource,
  checkboxGroupSource,
  checkboxIndeterminadoSource,
  checkboxCheckedSource,
  checkboxSelectAllSource,
  checkboxSource,
} from './checkbox.source';

const ALL = [
  checkboxSource,
  checkboxCheckedSource,
  checkboxIndeterminadoSource,
  checkboxDisabledSource,
  checkboxDisabledCheckedSource,
  checkboxErrorSource,
  checkboxWithDescriptionSource,
  checkboxGroupSource,
  checkboxSelectAllSource,
  checkboxEmCardSource,
  formCheckboxSource,
];

describe('checkboxSource', () => {
  it('ensina a importação do design system, não a da lib headless', () => {
    expect(checkboxSource()).toContain('import { Checkbox } from "@/components/ui/checkbox";');
  });

  it('escreve o par caixa+rótulo, que é a unidade mínima do componente', () => {
    const output = checkboxSource();
    expect(output).toContain('<Checkbox id="termos" />');
    expect(output).toContain('<label htmlFor="termos" className="nds-label">');
  });

  it('omite toda prop que é igual ao padrão do componente', () => {
    const output = checkboxSource(undefined, {
      args: {
        defaultChecked: false,
        disabled: false,
        required: false,
        readOnly: false,
        indeterminate: false,
        value: 'on',
      },
    });
    expect(output).toContain('<Checkbox id="termos" />');
    expect(output).not.toContain('value=');
    expect(output).not.toContain('disabled');
  });

  it('mapeia cada arg ligado para a prop real do componente', () => {
    const output = checkboxSource(undefined, {
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
      expect(output).toContain(parte);
    }
    // Fila longa quebra uma prop por linha; o fechamento volta à indentação da tag.
    expect(output).toContain('<Checkbox\n');
    expect(output).toContain('\n  />');
  });

  it('não deixa o espião do control virar atributo', () => {
    const spy = (() => 'CORPO_DO_MOCK') as never;
    const output = checkboxSource(undefined, { args: { name: spy, value: spy } });
    expect(output).toContain('<Checkbox id="termos" />');
    expect(output).not.toContain('CORPO_DO_MOCK');
  });
});

describe('estados', () => {
  it('marcada nasce de defaultChecked, sem controle externo', () => {
    expect(checkboxCheckedSource()).toContain('<Checkbox id="sessao" defaultChecked />');
  });

  it('o estado misto é propriedade dedicada, não um terceiro valor de checked', () => {
    const output = checkboxIndeterminadoSource();
    expect(output).toContain('indeterminate');
    expect(output).not.toContain('checked="indeterminate"');
    expect(output).not.toContain('defaultChecked');
  });

  it('o esmaecimento do desabilitado é do grupo, e o rótulo apaga junto', () => {
    for (const output of [checkboxDisabledSource(), checkboxDisabledCheckedSource()]) {
      expect(output).toContain('data-disabled="true"');
      expect(output).toContain('disabled');
      expect(output).toContain('className="nds-label"');
    }
    expect(checkboxDisabledCheckedSource()).toContain('defaultChecked');
  });

  it('o erro é sinalizado por aria-invalid, com a mensagem fora do rótulo', () => {
    const output = checkboxErrorSource();
    expect(output).toContain('aria-invalid="true"');
    expect(output).toContain('nds-text-destructive');
    expect(output).toContain('Você precisa aceitar os termos para continuar.');
    // A mensagem é irmã do par: dentro do <label> ela entraria no nome acessível.
    expect(output.indexOf('</label>')).toBeLessThan(output.indexOf('nds-text-destructive'));
  });
});

describe('composições', () => {
  it('o texto auxiliar alinha o par pelo topo', () => {
    const output = checkboxWithDescriptionSource();
    expect(output).toContain('data-align="start"');
    expect(output).toContain('Enviaremos no máximo 2 emails por semana.');
  });

  it('o grupo existe por fieldset + legend, e não por proximidade visual', () => {
    const output = checkboxGroupSource();
    expect(output).toContain('<fieldset');
    expect(output).toContain('<legend');
    expect(output).toContain('Preferências de contato');
  });

  it('a seleção em massa ensina o modo controlado que produz o estado misto', () => {
    const output = checkboxSelectAllSource();
    expect(output).toContain('import { useState } from "react";');
    expect(output).toContain('const [marcados, setMarcados] = useState<string[]>([]);');
    expect(output).toContain('checked={todos}');
    expect(output).toContain('indeterminate={alguns}');
    expect(output).toContain('onCheckedChange={(marcado) =>');
  });

  it('o card é moldura: quem recebe o clique continua sendo o par', () => {
    const output = checkboxEmCardSource();
    expect(output).toContain('nds-shadow-sm');
    expect(output).toContain('<label htmlFor="plano-pro"');
    expect(output).not.toContain('onClick');
  });

  it('no formulário o estado que vale é o do FormData', () => {
    const output = formCheckboxSource();
    expect(output).toContain('name="termos"');
    expect(output).toContain('value="aceito"');
    expect(output).toContain('new FormData(evento.currentTarget)');
    expect(output).toContain('<Button type="submit">Enviar</Button>');
  });
});

describe('regras do repositório', () => {
  it('toda caixa tem rótulo associado, e nenhum snippet leva estilo inline', () => {
    for (const fn of ALL) {
      const output = fn();
      expect(output).toContain('htmlFor=');
      expect(output).not.toContain('style={{');
      expect(output).not.toContain('fixtures');
    }
  });
});
