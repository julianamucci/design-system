<script lang="ts">
  /**
   * A tela de demonstração: uma página de entrada qualquer.
   *
   * NENHUMA CAPTURA DE SISTEMA REAL, e é a §1 da guideline 17 aplicada: uma
   * fotografia de produto de terceiro traz marca registrada e conteúdo que não é
   * nosso. A saída é desenhar a tela com os PRÓPRIOS primitivos do design system
   * — o que, de quebra, mostra o contrato certo: a peça recebe um espaço, e
   * qualquer marcação serve.
   *
   * ELA É INERTE, e essa é a decisão que se leva daqui para quem consome. A tela
   * dentro da moldura é uma FOTO: ninguém está preenchendo aquele formulário. Sem
   * `inert`, o teclado entraria em campos de uma tela que não é a de quem navega
   * — parada de tabulação para dentro de um retrato — e o leitor de tela leria um
   * formulário que não existe. Com ele, a figura volta a ser o que a legenda diz
   * que é.
   *
   * OS CAMPOS TÊM RÓTULO DE VERDADE, ainda que inertes. É cinto e suspensório: se
   * a ferramenta de auditoria não honrar `inert`, um campo sem rótulo reprovaria,
   * e o defeito seria do andaime — não da peça.
   *
   * É COMPONENTE, e não função: nesta stack a tela entra como `Snippet`, e
   * snippet só existe dentro de marcação. Quem monta a story escreve
   * `{#snippet screen()}<ComputerUseDemoScreen />{/snippet}` e o encaixe fica
   * igual ao das irmãs.
   */
  import { Button } from '@/components/ui/button';
  import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
  import { Input } from '@/components/ui/input';
  import { Label } from '@/components/ui/label';
  import { locale } from '@/lib/i18n';
  import { computerUseDemoScreenTextFor } from './computer-use.fixtures';

  const text = $derived(computerUseDemoScreenTextFor($locale));

  /**
   * Escopo de id por INSTÂNCIA.
   *
   * A demonstração monta várias telas na mesma página, e cada uma tem dois campos
   * rotulados. Ids derivados só do nome do campo colidiriam, e `for` passaria a
   * resolver para o PRIMEIRO campo do documento — dando ao segundo formulário o
   * rótulo do primeiro. Mesma precaução do bloco de terminal, pelo mesmo motivo.
   */
  const uid = $props.id();
  const emailId = `${uid}-email`;
  const passwordId = `${uid}-password`;
</script>

<!--
  A FOTO NÃO SE OPERA (ver o docblock acima). `inert` tira a tela inteira da
  ordem de foco e da árvore de acessibilidade de uma vez só, sem precisar
  desabilitar controle por controle — e desabilitar mudaria o DESENHO da tela,
  que é justamente o que a demonstração quer mostrar intacto.
-->
<div inert>
  <Card class="nds-h-full nds-w-full">
    <CardHeader>
      <CardTitle>{text.title}</CardTitle>
    </CardHeader>
    <CardContent class="nds-stack" data-spacing="sm">
      <div class="nds-stack" data-spacing="xs">
        <Label for={emailId}>{text.email}</Label>
        <Input id={emailId} type="email" value="agente@exemplo.com" />
      </div>
      <div class="nds-stack" data-spacing="xs">
        <Label for={passwordId}>{text.password}</Label>
        <Input id={passwordId} type="password" value="ainda-nao-digitada" />
      </div>
      <Button class="nds-w-full">{text.submit}</Button>
    </CardContent>
  </Card>
</div>
