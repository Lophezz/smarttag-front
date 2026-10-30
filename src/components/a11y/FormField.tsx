import React from "react";
import { TextInputProps } from "react-native";
import { YStack, Text, Input, Label } from "tamagui";
import { useCores } from "./AccessibilityMenu";

type Props = Omit<TextInputProps, "style"> & {
  label: string;
  id: string;
  error?: string;
  helper?: string;
};

export default function FormField({
  label,
  id,
  error,
  helper,
  ...inputProps
}: Props) {
  const cores = useCores();

  return (
    <YStack gap="$2">
      <Label color={cores.texto} htmlFor={id}>
        {label}
      </Label>
      <Input
        id={id}
        size="$5"
        bg={cores.cartao}
        color={cores.texto}
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