import React from "react";
import { Pressable, StyleSheet, ViewStyle } from "react-native";

type Props = {
  /** Nome acessível obrigatório: o ícone sozinho não tem texto (SC 1.1.1 / 4.1.2). */
  label: string;
  onPress: () => void;
  hint?: string;
  disabled?: boolean;
  style?: ViewStyle;
  children: React.ReactNode;
};

/**
 * Botão de ícone: focável por teclado, com papel "button", alvo mínimo de 44x44
 * e indicador de foco visível (SC 2.1.1, 2.4.7, 4.1.2).
 */
export default function IconButton({
  label,
  onPress,
  hint,
  disabled,
  style,
  children,
}: Props) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={hint}
      accessibilityState={{ disabled: !!disabled }}
      hitSlop={8}
      style={({ pressed, focused }: any) => [
        styles.base,
        pressed && styles.pressed,
        focused && styles.focused,
        style,
      ]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minWidth: 44,
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 22,
  },
  pressed: { opacity: 0.6 },
  focused: { borderWidth: 2, borderColor: "#FFFFFF" },
});
