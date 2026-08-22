import type { InjectionKey } from 'vue'

/**
 * Registro da descrição no painel — existe por causa de UM detalhe do primitivo
 * desta stack.
 *
 * O `DialogContentImpl` gera o id da descrição SEMPRE (`descriptionId ||= useId()`)
 * e liga `aria-describedby` a ele mesmo quando ninguém renderiza a descrição. Como
 * a descrição é opcional, o painel ficava apontando para um id que não existe no
 * documento — o leitor de tela não anuncia nada e o axe reprova em
 * `aria-valid-attr-value`. A própria lib prescreve a saída no aviso que emite em
 * desenvolvimento: declarar `aria-describedby` indefinido quando não há descrição.
 *
 * Quem sabe se há descrição é a descrição. Ela se registra aqui na montagem, e o
 * painel só omite o atributo enquanto o contador está em zero.
 */
export interface AlertDialogDescriptionRegistro {
  /** Chamado no `setup` da descrição; desfaz-se sozinho quando ela sai do escopo. */
  registrar: () => void
}

export const ALERT_DIALOG_DESCRIPTION: InjectionKey<AlertDialogDescriptionRegistro> =
  Symbol('nds-alert-dialog-descricao')
