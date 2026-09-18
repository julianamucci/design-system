import { describe, expect, it } from 'vitest';
import {
  checkboxWithDescriptionSource,
  checkboxWithErrorSource,
  checkboxDisabledCheckedSource,
  checkboxDisabledSource,
  formCheckboxSource,
  checkboxIndeterminadoSource,
  checkboxManterSessaoSource,
  checkboxCheckedWithLabelSource,
  checkboxCheckedSource,
  checkboxSelectAllSource,
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
    const output = checkboxSource('', { args: { withLabel: false } });
    expect(output).toContain('aria-label="Aceito os termos e condições"');
    expect(output).not.toContain('@/components/ui/label');
    expect(output).not.toContain('id="opcao"');
  });

  it('o control de indeterminado acrescenta o segundo estado e a ligação', () => {
    const output = checkboxSource('', { args: { indeterminate: true } });
    expect(output).toContain('let parcial = $state(true);');
    expect(output).toContain('bind:indeterminate={parcial}');
  });

  it('desabilitado marca também a linha, que é o que apaga o rótulo', () => {
    const output = checkboxSource('', { args: { disabled: true } });
    expect(output).toContain('data-disabled="true"');
    expect(output).toContain('<Checkbox id="opcao" bind:checked={marcado} disabled />');
  });

  it('só escreve aria-invalid quando o control pede o estado de erro', () => {
    expect(checkboxSource()).not.toContain('aria-invalid');
    expect(checkboxSource('', { args: { ariaInvalid: true } })).toContain('aria-invalid="true"');
  });

  it('a descrição amarra o texto de apoio por aria-describedby', () => {
    const output = checkboxSource('', { args: { withDescription: true } });
    expect(output).toContain('aria-describedby="opcao-apoio"');
    expect(output).toContain('<p id="opcao-apoio" class="nds-text-body">');
  });
});

describe('transforms das stories de variação, estado e composição', () => {
  it('a caixa sozinha não abre a linha de rótulo', () => {
    expect(checkboxNoLabelSource()).not.toContain('nds-cluster');
  });

  it('a caixa sozinha marcada parte de true', () => {
    expect(checkboxCheckedSource()).toContain('$state(true)');
  });

  it('a caixa sozinha indeterminada liga o segundo estado', () => {
    expect(checkboxIndeterminadoSource()).toContain('bind:indeterminate={parcial}');
  });

  it('a descrição traz o rótulo e o apoio da story', () => {
    const output = checkboxWithDescriptionSource();
    expect(output).toContain('Receber novidades por email');
    expect(output).toContain('você concorda em receber comunicações de marketing');
  });

  it('o par marcado guarda o rótulo padrão, e a sessão guarda o próprio', () => {
    expect(checkboxCheckedWithLabelSource()).toContain('Aceito os termos e condições');
    expect(checkboxManterSessaoSource()).toContain('Manter sessão ativa');
  });

  it('a seleção parcial de grupo é rotulada pelo que ela comanda', () => {
    expect(checkboxSelectAllSource()).toContain('Selecionar todos os itens');
  });

  it('os dois desabilitados apagam a linha, e um deles continua marcado', () => {
    expect(checkboxDisabledSource()).toContain('data-disabled="true"');
    expect(checkboxDisabledCheckedSource()).toContain('$state(true)');
  });

  it('o erro aparece pelo canal ARIA, sem desabilitar a caixa', () => {
    const output = checkboxWithErrorSource();
    expect(output).toContain('aria-invalid="true"');
    expect(output).not.toContain('data-disabled');
  });

  it('o formulário leva name e value, que é o que chega ao envio', () => {
    const output = formCheckboxSource();
    expect(output).toContain('<form class="nds-stack" data-spacing="md">');
    expect(output).toContain('name="termos"');
    expect(output).toContain('value="aceito"');
    expect(output).toContain('<Button type="submit">Enviar</Button>');
  });
});
