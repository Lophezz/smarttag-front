import React from "react";
import { XStack, Text } from "tamagui";
import { Feather } from "@expo/vector-icons";
import IconButton from "./IconButton";
import { useCores } from "./AccessibilityMenu";

type Props = {
  titulo: string;
  onVoltar?: () => void;
  acao?: { icone: React.ComponentProps<typeof Feather>["name"]; label: string; onPress: () => void };
};

export default function Cabecalho({ titulo, onVoltar, acao }: Props) {
  const cores = useCores();

  return (
    <XStack px="$6" pt="$10" pb="$4" jc="space-between" ai="center" gap="$3">
      {onVoltar && (
        <IconButton label="Voltar" onPress={onVoltar}>
          <Feather name="arrow-left" size={24} color={cores.textoSuave} />
        </IconButton>
      )}
      <Text
        f={1}
        fontSize="$7"
        fontWeight="bold"
        color={cores.texto}
        accessibilityRole="header"
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {titulo}
      </Text>
      {acao && (
        <IconButton label={acao.label} onPress={acao.onPress}>
          <Feather name={acao.icone} size={22} color={cores.textoSuave} />
        </IconButton>
      )}
    </XStack>
  );
}