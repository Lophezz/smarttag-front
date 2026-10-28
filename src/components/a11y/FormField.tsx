import React from "react";
import { TextInputProps } from "react-native";
import { YStack, Text, Input, Label } from "tamagui";
import { cores } from "./colors";

// "style" fica de fora: o Input do Tamagui usa outro tipo de estilo que o do React Native
type Props = Omit<TextInputProps, "style"> & {
  /** Rótulo visível. Também vira o nome acessível no nativo (SC 1.3.1, 3.3.2, 2.5.3). */
  label: string;
  id: string;
  /** Mensagem de erro exibida em texto, não apenas por cor (SC 3.3.1). */
  error?: string;
  /** Instrução auxiliar sempre visível (SC 3.3.2). */
  helper?: string;
};

/**
 * Campo de formulário com rótulo visível, ajuda e erro anunciável.
 * Use `autoComplete` para identificar a finalidade do campo (SC 1.3.5).
 */
export default function FormField({
  label,
  id,
  error,
  helper,
  ...inputProps
}: Props) {
  return (
    <YStack gap="$2">
      <Label color="white" htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        size="$5"
        bg={cores.cartao}
        color="white"
        borderColor={error ? cores.erro : cores.bordaControle}
        borderWidth={1}
        placeholderTextColor={cores.textoSecundario as any}
        accessibilityLabel={label}
        accessibilityHint={error ?? helper}
        {...(inputProps as any)}
      />
      {!!helper && !error && (
        <Text color={cores.textoSecundario} fontSize="$3">
          {helper}
        </Text>
      )}
      {!!error && (
        <Text
          id={`${id}-erro`}
          color={cores.erro}
          fontSize="$3"
          accessibilityRole="alert"
          accessibilityLiveRegion="assertive"
        >
          Erro: {error}
        </Text>
      )}
    </YStack>
  );
}
