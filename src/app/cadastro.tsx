import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router, Stack } from "expo-router";
import { YStack, Text, Button, XStack, Spinner } from "tamagui";
import axios from "axios";
import api from "../services/api";
import { Alert } from "../services/alert";
import FormField from "../components/a11y/FormField";
import PasswordField from "../components/a11y/PasswordField";
import RequisitosSenha, { validarSenha } from "../components/a11y/RequisitosSenha";
import TextLink from "../components/a11y/TextLink";
import { cores } from "../components/a11y/colors";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [erros, setErros] = useState<{ nome?: string; email?: string; geral?: string }>({});

  const { valida: isPasswordValid } = validarSenha(senha);

  const handleCadastro = async () => {
    const novos: typeof erros = {};
    if (!nome.trim()) novos.nome = "Informe o seu nome completo.";
    if (!email.trim()) novos.email = "Informe o seu e-mail.";
    setErros(novos);
    if (Object.keys(novos).length) return;

    setIsLoading(true);
    try {
      await api.post("/auth/register", {
        nome,
        email: email.toLowerCase().trim(),
        password: senha,
      });

      Alert.alert("Sucesso!", "Conta criada. Verifique seu e-mail para ativar.");
      router.push({
        pathname: "/verificacao",
        params: { email: email.toLowerCase().trim() },
      });
    } catch (error) {
      console.error("Erro ao cadastrar:", error);
      let mensagemErro =
        "Não foi possível criar a conta. Verifique os dados e tente novamente.";
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
              color="white"
              accessibilityRole="header"
            >
              Criar Conta
            </Text>
            <Text fontSize="$4" color={cores.textoSecundario} mt="$2">
              Faça parte da rede.
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
                Erro no cadastro: {erros.geral}
              </Text>
            </YStack>
          )}

          <FormField
            id="cadastro-nome"
            label="Nome completo"
            placeholder="Seu nome"
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            value={nome}
            onChangeText={setNome}
            error={erros.nome}
          />

          <FormField
            id="cadastro-email"
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
            id="cadastro-senha"
            label="Senha segura"
            autoComplete="new-password"
            value={senha}
            onChangeText={setSenha}
            helper="A senha precisa cumprir todos os requisitos abaixo."
          />

          <RequisitosSenha senha={senha} />

          <Button
            size="$5"
            bg={cores.botaoAlternativo}
            color="white"
            fontWeight="700"
            mt="$4"
            disabled={isLoading || !isPasswordValid}
            opacity={isLoading || !isPasswordValid ? 0.5 : 1}
            onPress={handleCadastro}
            icon={isLoading ? () => <Spinner color="white" /> : undefined}
            accessibilityState={{ busy: isLoading, disabled: isLoading || !isPasswordValid }}
          >
            {isLoading ? "Cadastrando..." : "Cadastrar"}
          </Button>

          <XStack jc="center" ai="center" mt="$4" gap="$2" fw="wrap">
            <Text color={cores.textoSecundario}>Já tem uma conta?</Text>
            <TextLink
              onPress={() => router.push("/login")}
              hint="Abre a tela de acesso"
            >
              Faça login
            </TextLink>
          </XStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
