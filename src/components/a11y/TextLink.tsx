import React from "react";
import { Pressable, Text, StyleSheet, TextStyle } from "react-native";
import { cores } from "./colors";

type Props = {
  children: string;
  onPress: () => void;
  hint?: string;
  color?: string;
  style?: TextStyle;
};

/**
 * Link de texto focável por teclado (Tab + Enter/Espaço) com papel "link".
 * Substitui <Text onPress>, que não recebe foco no navegador (SC 2.1.1).
 * Nome acessível = texto visível (SC 2.5.3).
 */
export default function TextLink({
  children,
  onPress,
  hint,
  color = cores.link,
  style,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      accessible
      accessibilityRole="link"
      accessibilityHint={hint}
      hitSlop={8}
      style={({ focused }: any) => [styles.box, focused && styles.focused]}
    >
      <Text style={[styles.text, { color }, style]}>{children}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: { minHeight: 44, justifyContent: "center", paddingHorizontal: 2 },
  text: { fontSize: 15, fontWeight: "700", textDecorationLine: "underline" },
  focused: { borderWidth: 2, borderColor: "#FFFFFF", borderRadius: 6 },
});
