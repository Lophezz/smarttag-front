import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router, Stack } from "expo-router";
import { YStack, Text, Button, XStack, Spinner } from "tamagui";
import axios from "axios";
import api from "../services/api";
import { Alert } from "../services/alert";
import FormField from "../components/a11y/FormField";
import TextLink from "../components/a11y/TextLink";
import { cores } from "../components/a11y/colors";

export default function EsqueciSenha() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [erro, setErro] = useState<string | undefined>();

  const handleSolicitarRecuperacao = async () => {
    if (!email.trim()) {
      setErro("Informe o e-mail cadastrado.");
      return;
    }
    setErro(undefined);
    setIsLoading(true);

    try {
      await api.post("/auth/request-password", {
        email: email.toLowerCase().trim(),
      });

      Alert.alert(
        "E-mail enviado!",
        "Se o e-mail estiver cadastrado, você receberá um código de recuperação em instantes.",
      );
      router.push({
        pathname: "/resetar-senha",
        params: { email: email.toLowerCase().trim() },
      });
    } catch (error) {
      console.error("Erro ao solicitar recuperação:", error);
      let mensagemErro =
        "Não foi possível processar a solicitação. Tente novamente mais tarde.";
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
              color="white"
              accessibilityRole="header"
            >
              Recuperar Senha
            </Text>
            <Text fontSize="$4" color={cores.textoSecundario} mt="$2">
              Digite o e-mail associado à sua conta. Enviaremos um código para
              você criar uma nova senha.
            </Text>
          </YStack>

          <FormField
            id="email"
            label="E-mail"
            placeholder="nome@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            error={erro}
          />

          <Button
            size="$5"
            bg={cores.botaoPrimario}
            color="white"
            fontWeight="700"
            mt="$4"
            disabled={isLoading}
            opacity={isLoading ? 0.7 : 1}
            pressStyle={{ scale: 0.97 }}
            onPress={handleSolicitarRecuperacao}
            icon={isLoading ? () => <Spinner color="white" /> : undefined}
            accessibilityState={{ busy: isLoading, disabled: isLoading }}
          >
            {isLoading ? "Enviando..." : "Enviar código"}
          </Button>

          <XStack jc="center" ai="center" mt="$4" gap="$2" fw="wrap">
            <Text color={cores.textoSecundario}>Lembrou sua senha?</Text>
            <TextLink
              color={cores.linkAlternativo}
              onPress={() => router.back()}
              hint="Volta para a tela de acesso"
            >
              Voltar ao login
            </TextLink>
          </XStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
