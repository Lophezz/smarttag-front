import React, { useState } from "react";
import { TextInputProps } from "react-native";
import { YStack, XStack, Text, Input, Label } from "tamagui";
import { Feather } from "@expo/vector-icons";
import IconButton from "./IconButton";
import { useCores } from "./AccessibilityMenu";

type Props = Omit<TextInputProps, "style"> & {
  label: string;
  id: string;
  autoComplete: "current-password" | "new-password";
  helper?: string;
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
  const cores = useCores();

  return (
    <YStack gap="$2">
      <XStack jc="space-between" ai="center">
        <Label color={cores.texto} htmlFor={id}>
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
          color={cores.texto}
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