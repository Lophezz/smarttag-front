import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { useLocalSearchParams, router, Stack } from "expo-router";
import { YStack, Text, Button, Spinner } from "tamagui";
import axios from "axios";
import api from "../services/api";
import { Alert } from "../services/alert";
import FormField from "../components/a11y/FormField";
import PasswordField from "../components/a11y/PasswordField";
import RequisitosSenha, { validarSenha } from "../components/a11y/RequisitosSenha";
import { cores } from "../components/a11y/colors";

export default function ResetarSenha() {
  const { email } = useLocalSearchParams();

  const [codigo, setCodigo] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [erros, setErros] = useState<{ codigo?: string; geral?: string }>({});

  const { valida: isPasswordValid } = validarSenha(novaSenha);

  const handleResetarSenha = async () => {
    if (!codigo.trim()) {
      setErros({ codigo: "Informe o código recebido por e-mail." });
      return;
    }
    setErros({});
    setIsLoading(true);

    try {
      await api.post("/auth/reset-password", {
        email: email ? String(email).toLowerCase().trim() : "",
        code: codigo,
        newPassword: novaSenha,
      });

      Alert.alert(
        "Sucesso!",
        "Sua senha foi redefinida. Faça login com a nova credencial.",
      );
      router.replace("/login");
    } catch (error) {
      console.error("Erro ao resetar senha:", error);
      let mensagemErro =
        "Não foi possível redefinir a senha. Verifique o código e tente novamente.";
      if (axios.isAxiosError(error)) {
        mensagemErro = error.response?.data?.message || mensagemErro;
      }
      setErros({ geral: mensagemErro });
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
              Criar Nova Senha
            </Text>
            <Text fontSize="$4" color={cores.textoSecundario} mt="$2">
              Digite o código que enviamos para {email || "seu e-mail"} e
              escolha sua nova senha.
            </Text>
          </YStack>

          {!!erros.geral && (
            <YStack
              bg="rgba(248,113,113,0.12)"
              borderWidth={1}
              borderColor={cores.erro}
              br="$4"
              p="$3"
              accessibilityRole="alert"
              accessibilityLiveRegion="assertive"
            >
              <Text color={cores.erro} fontSize="$4">
                Erro: {erros.geral}
              </Text>
            </YStack>
          )}

          <FormField
            id="codigo"
            label="Código de recuperação"
            placeholder="6 dígitos"
            keyboardType="number-pad"
            autoComplete="one-time-code"
            textContentType="oneTimeCode"
            value={codigo}
            onChangeText={setCodigo}
            error={erros.codigo}
          />

          <PasswordField
            id="nova-senha"
            label="Nova senha"
            autoComplete="new-password"
            value={novaSenha}
            onChangeText={setNovaSenha}
            helper="A senha precisa cumprir todos os requisitos abaixo."
          />

          <RequisitosSenha senha={novaSenha} />

          <Button
            size="$5"
            bg={cores.botaoAlternativo}
            color="white"
            fontWeight="700"
            mt="$4"
            disabled={isLoading || !isPasswordValid}
            opacity={isLoading || !isPasswordValid ? 0.5 : 1}
            pressStyle={{ scale: 0.97 }}
            onPress={handleResetarSenha}
            icon={isLoading ? () => <Spinner color="white" /> : undefined}
            accessibilityState={{ busy: isLoading, disabled: isLoading || !isPasswordValid }}
          >
            {isLoading ? "Salvando..." : "Redefinir senha"}
          </Button>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
