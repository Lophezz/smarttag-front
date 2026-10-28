import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router, Stack } from "expo-router";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import axios from "axios";
import api from "../services/api";
import FormField from "../components/a11y/FormField";
import PasswordField from "../components/a11y/PasswordField";
import TextLink from "../components/a11y/TextLink";
import { cores } from "../components/a11y/colors";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [erros, setErros] = useState<{ email?: string; senha?: string; geral?: string }>({});

  const handleLogin = async () => {
    // Validação com erro identificado em texto, junto ao campo (SC 3.3.1, 3.3.3)
    const novos: typeof erros = {};
    if (!email.trim()) novos.email = "Informe o seu e-mail.";
    if (!senha) novos.senha = "Informe a sua senha.";
    setErros(novos);
    if (Object.keys(novos).length) return;

    setIsLoading(true);
    try {
      await api.post("/auth/login", {
        email: email.toLowerCase().trim(),
        password: senha,
      });
      router.replace("/home");
    } catch (error) {
      console.error("Erro no login:", error);
      let mensagemErro =
        "Não foi possível fazer o login. Verifique suas credenciais.";
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
          <YStack ai="center" mb="$6">
            <Text
              fontSize="$9"
              fontWeight="800"
              color="white"
              accessibilityRole="header"
            >
              Smart<Text color={cores.link}>Tag</Text>
            </Text>
            <Text fontSize="$4" color={cores.textoSecundario} ta="center" mt="$2">
              Acesse sua conta para gerenciar seus veículos.
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
                Erro de acesso: {erros.geral}
              </Text>
            </YStack>
          )}

          <FormField
            id="login-email"
            label="E-mail"
            placeholder="nome@exemplo.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            textContentType="emailAddress"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
            error={erros.email}
          />

          <PasswordField
            id="login-senha"
            label="Senha"
            autoComplete="current-password"
            value={senha}
            onChangeText={setSenha}
            accessory={
              <TextLink
                onPress={() => router.push("/esqueci-senha")}
                hint="Abre a tela de recuperação de senha"
              >
                Esqueceu a senha?
              </TextLink>
            }
          />
          {!!erros.senha && (
            <Text color={cores.erro} fontSize="$3" accessibilityRole="alert">
              Erro: {erros.senha}
            </Text>
          )}

          <Button
            size="$5"
            bg={cores.botaoPrimario}
            color="white"
            fontWeight="700"
            mt="$4"
            disabled={isLoading}
            opacity={isLoading ? 0.7 : 1}
            pressStyle={{ scale: 0.97 }}
            onPress={handleLogin}
            icon={isLoading ? () => <Spinner color="white" /> : undefined}
            accessibilityState={{ busy: isLoading, disabled: isLoading }}
          >
            {isLoading ? "Entrando..." : "Entrar"}
          </Button>

          <XStack jc="center" ai="center" mt="$4" gap="$2" fw="wrap">
            <Text color={cores.textoSecundario}>Não tem uma conta?</Text>
            <TextLink
              color={cores.linkAlternativo}
              onPress={() => router.push("/cadastro")}
              hint="Abre a tela de criação de conta"
            >
              Cadastre-se
            </TextLink>
          </XStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
