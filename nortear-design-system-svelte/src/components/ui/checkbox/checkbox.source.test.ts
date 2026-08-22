import { describe, expect, it } from 'vitest';
import {
  checkboxComDescricaoSource,
  checkboxWithErrorSource,
  checkboxDesabilitadoMarcadoSource,
  checkboxDesabilitadoSource,
  checkboxEmFormularioSource,
  checkboxIndeterminadoSource,
  checkboxManterSessaoSource,
  checkboxCheckedWithLabelSource,
  checkboxMarcadoSource,
  checkboxSelecionarTodosSource,
  checkboxNoLabelSource,
  checkboxSource,
} from './checkbox.source';

describe('checkboxSource', () => {
  it('sem args, entrega o par caixa+rótulo com estado próprio', () => {
    expect(checkboxSource()).toBe(
      `<script lang="ts">
  import { Checkbox } from "@/components/ui/checkbox";
  import { Label } from "@/components/ui/label";

  let marcado = $state(false);
</script>

<div class="nds-cluster" data-spacing="sm">
  <Checkbox id="opcao" bind:checked={marcado} />
  <Label for="opcao">Aceito os termos e condições</Label>
</div>`,
    );
  });

  it('acompanha o control de marcado no valor inicial do estado', () => {
    expect(checkboxSource('', { args: { checked: true } })).toContain('$state(true)');
  });

  it('sem rótulo, a caixa passa a ser nomeada por ARIA e o Label sai do import', () => {
    const saida = checkboxSource('', { args: { withLabel: false } });
    expect(saida).toContain('aria-label="Aceito os termos e condições"');
    expect(saida).not.toContain('@/components/ui/label');
    expect(saida).not.toContain('id="opcao"');
  });

  it('o control de indeterminado acrescenta o segundo estado e a ligação', () => {
    const saida = checkboxSource('', { args: { indeterminate: true } });
    expect(saida).toContain('let parcial = $state(true);');
    expect(saida).toContain('bind:indeterminate={parcial}');
  });

  it('desabilitado marca também a linha, que é o que apaga o rótulo', () => {
    const saida = checkboxSource('', { args: { disabled: true } });
    expect(saida).toContain('data-disabled="true"');
    expect(saida).toContain('<Checkbox id="opcao" bind:checked={marcado} disabled />');
  });

  it('só escreve aria-invalid quando o control pede o estado de erro', () => {
    expect(checkboxSource()).not.toContain('aria-invalid');
    expect(checkboxSource('', { args: { ariaInvalid: true } })).toContain('aria-invalid="true"');
  });

  it('a descrição amarra o texto de apoio por aria-describedby', () => {
    const saida = checkboxSource('', { args: { withDescription: true } });
    expect(saida).toContain('aria-describedby="opcao-apoio"');
    expect(saida).toContain('<p id="opcao-apoio" class="nds-text-body">');
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('a caixa sozinha não abre a linha de rótulo', () => {
    expect(checkboxNoLabelSource()).not.toContain('nds-cluster');
  });

  it('a caixa sozinha marcada parte de true', () => {
    expect(checkboxMarcadoSource()).toContain('$state(true)');
  });

  it('a caixa sozinha indeterminada liga o segundo estado', () => {
    expect(checkboxIndeterminadoSource()).toContain('bind:indeterminate={parcial}');
  });

  it('a descrição traz o rótulo e o apoio da story', () => {
    const saida = checkboxComDescricaoSource();
    expect(saida).toContain('Receber novidades por email');
    expect(saida).toContain('você concorda em receber comunicações de marketing');
  });

  it('o par marcado guarda o rótulo padrão, e a sessão guarda o próprio', () => {
    expect(checkboxCheckedWithLabelSource()).toContain('Aceito os termos e condições');
    expect(checkboxManterSessaoSource()).toContain('Manter sessão ativa');
  });

  it('a seleção parcial de grupo é rotulada pelo que ela comanda', () => {
    expect(checkboxSelecionarTodosSource()).toContain('Selecionar todos os itens');
  });

  it('os dois desabilitados apagam a linha, e um deles continua marcado', () => {
    expect(checkboxDesabilitadoSource()).toContain('data-disabled="true"');
    expect(checkboxDesabilitadoMarcadoSource()).toContain('$state(true)');
  });

  it('o erro aparece pelo canal ARIA, sem desabilitar a caixa', () => {
    const saida = checkboxWithErrorSource();
    expect(saida).toContain('aria-invalid="true"');
    expect(saida).not.toContain('data-disabled');
  });

  it('o formulário leva name e value, que é o que chega ao envio', () => {
    const saida = checkboxEmFormularioSource();
    expect(saida).toContain('<form class="nds-stack" data-spacing="md">');
    expect(saida).toContain('name="termos"');
    expect(saida).toContain('value="aceito"');
    expect(saida).toContain('<Button type="submit">Enviar</Button>');
  });
});
