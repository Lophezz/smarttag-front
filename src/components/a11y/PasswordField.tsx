import React, { useState } from "react";
import { TextInputProps } from "react-native";
import { YStack, XStack, Text, Input, Label } from "tamagui";
import { Feather } from "@expo/vector-icons";
import IconButton from "./IconButton";
import { cores } from "./colors";

// "style" fica de fora: o Input do Tamagui usa outro tipo de estilo que o do React Native
type Props = Omit<TextInputProps, "style"> & {
  label: string;
  id: string;
  /** "current-password" no login, "new-password" no cadastro/redefinição (SC 1.3.5). */
  autoComplete: "current-password" | "new-password";
  helper?: string;
  /** Conteúdo ao lado do rótulo (ex.: link "Esqueceu a senha?"). */
  accessory?: React.ReactNode;
};

export default function PasswordField({
  label,
  id,
  autoComplete,
  helper,
  accessory,
  ...inputProps
}: Props) {
  const [visivel, setVisivel] = useState(false);

  return (
    <YStack gap="$2">
      <XStack jc="space-between" ai="center">
        <Label color="white" htmlFor={id}>
          {label}
        </Label>
        {accessory}
      </XStack>
      <XStack
        ai="center"
        bg={cores.cartao}
        br="$4"
        borderWidth={1}
        borderColor={cores.bordaControle}
        pr="$2"
      >
        <Input
          id={id}
          f={1}
          size="$5"
          bg="transparent"
          color="white"
          borderWidth={0}
          secureTextEntry={!visivel}
          autoComplete={autoComplete}
          textContentType={autoComplete === "new-password" ? "newPassword" : "password"}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={cores.textoSecundario as any}
          accessibilityLabel={label}
          accessibilityHint={helper}
          {...(inputProps as any)}
        />
        <IconButton
          label={visivel ? "Ocultar senha" : "Mostrar senha"}
          onPress={() => setVisivel((v) => !v)}
        >
          <Feather
            name={visivel ? "eye-off" : "eye"}
            size={22}
            color={cores.textoSecundario}
          />
        </IconButton>
      </XStack>
      {!!helper && (
        <Text color={cores.textoSecundario} fontSize="$3">
          {helper}
        </Text>
      )}
    </YStack>
  );
}
