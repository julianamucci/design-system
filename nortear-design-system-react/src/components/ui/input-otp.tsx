import * as React from "react"
import { OTPInput, OTPInputContext, REGEXP_ONLY_DIGITS } from "input-otp"

import { cn } from "@/lib/utils"
import { MinusIcon } from "lucide-react"

function InputOTP({
  className,
  containerClassName,
  // A lib não filtra caractere nenhum sem `pattern`, e `inputMode="numeric"` é
  // só uma dica de teclado de software: num teclado físico a letra entrava num
  // código de seis DÍGITOS sem nada recusá-la. O conteúdo compartilhado já
  // documentava "apenas dígitos" como padrão, e as stacks sem lib filtram —
  // aqui o default agora cumpre o que está escrito. Quem quer alfanumérico
  // continua passando o próprio `pattern`.
  pattern = REGEXP_ONLY_DIGITS,
  ...props
}: React.ComponentProps<typeof OTPInput> & {
  containerClassName?: string
}) {
  return (
    <OTPInput
      data-slot="input-otp"
      containerClassName={cn("nds-input-otp-container", containerClassName)}
      spellCheck={false}
      pattern={pattern}
      className={cn("nds-input-otp-input", className)}
      {...props}
    />
  )
}

function InputOTPGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-group"
      className={cn("nds-input-otp-group", className)}
      {...props}
    />
  )
}

function InputOTPSlot({
  index,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  index: number
}) {
  const inputOTPContext = React.useContext(OTPInputContext)
  const { char, hasFakeCaret, isActive } = inputOTPContext?.slots[index] ?? {}

  return (
    <div
      data-slot="input-otp-slot"
      data-active={isActive}
      className={cn("nds-input-otp-slot", className)}
      {...props}
    >
      {char}
      {hasFakeCaret && (
        <div className="nds-input-otp-caret-wrap">
          <div className="nds-input-otp-caret" />
        </div>
      )}
    </div>
  )
}

function InputOTPSeparator({ ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="input-otp-separator"
      className="nds-input-otp-separator"
      role="separator"
      {...props}
    >
      <MinusIcon
      />
    </div>
  )
}

export { InputOTP, InputOTPGroup, InputOTPSlot, InputOTPSeparator }
