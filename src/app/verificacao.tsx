import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { YStack, Text, Button, Spinner } from "tamagui";
import axios from "axios";
import api from "../services/api";
import { Alert } from "../services/alert";
import FormField from "../components/a11y/FormField";
import { cores } from "../components/a11y/colors";

export default function Verificacao() {
  const { email } = useLocalSearchParams();
  const [codigo, setCodigo] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | undefined>();

  const handleVerificacao = async () => {
    if (!codigo.trim()) {
      setErro("Digite o código de verificação recebido no e-mail.");
      return;
    }
    setErro(undefined);
    setIsLoading(true);

    try {
      await api.post("/auth/verify", {
        email: email ? String(email).toLowerCase().trim() : "",
        code: codigo,
      });

      Alert.alert(
        "Conta ativada!",
        "Sua conta foi verificada com sucesso. Agora você pode fazer o login.",
      );
      router.push("/login");
    } catch (error) {
      console.error("Erro na verificação:", error);
      let mensagemErro = "Código inválido ou expirado. Tente novamente.";
      if (axios.isAxiosError(error)) {
        mensagemErro = error.response?.data?.message || mensagemErro;
      }
      setErro(mensagemErro);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: cores.fundo }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        keyboardShouldPersistTaps="handled"
      >
        <YStack f={1} jc="center" px="$6" py="$8" gap="$4">
          <YStack mb="$6">
            <Text
              fontSize="$9"
              fontWeight="800"
              color={cores.texto}
              accessibilityRole="header"
            >
              Ativar Conta
            </Text>
            <Text fontSize="$4" color={cores.textoSecundario} mt="$2">
              Enviamos um código de ativação para {email || "seu e-mail"}.
              Digite-o abaixo.
            </Text>
          </YStack>

          <FormField
            id="codigo"
            label="Código de verificação"
            placeholder="6 dígitos"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            maxLength={6}
            value={codigo}
            onChangeText={setCodigo}
            error={erro}
            helper="Código numérico de 6 dígitos enviado ao seu e-mail."
          />

          <Button
            size="$5"
            bg={cores.botaoAlternativo}
            color="white"
            fontWeight="700"
            mt="$4"
            disabled={isLoading}
            opacity={isLoading ? 0.7 : 1}
            onPress={handleVerificacao}
            icon={isLoading ? () => <Spinner color="white" /> : undefined}
            accessibilityState={{ busy: isLoading, disabled: isLoading }}
          >
            {isLoading ? "Verificando..." : "Ativar conta"}
          </Button>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
