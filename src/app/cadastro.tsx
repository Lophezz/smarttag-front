import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { router, Stack } from "expo-router";
import { YStack, Text, Input, Button, Label, XStack, Spinner } from "tamagui";
import { Feather } from "@expo/vector-icons";
import axios from "axios";
import api from "../services/api";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);

  // Validações de segurança da senha
  const reqLength = senha.length >= 6;
  const reqUpper = /[A-Z]/.test(senha);
  const reqLower = /[a-z]/.test(senha);
  const reqNumber = /[0-9]/.test(senha);
  const reqSpecial = /[@#$%^&+=!]/.test(senha);

  const isPasswordValid =
    reqLength && reqUpper && reqLower && reqNumber && reqSpecial;

  const handleCadastro = async () => {
    if (!nome || !email || !senha) {
      Alert.alert("Atenção", "Por favor, preencha todos os campos.");
      return;
    }

    if (!isPasswordValid) {
      Alert.alert(
        "Senha Fraca",
        "A sua senha não cumpre todos os requisitos de segurança.",
      );
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/register", {
        nome: nome,
        email: email.toLowerCase().trim(),
        password: senha,
      });

      Alert.alert(
        "Sucesso!",
        "Conta criada. Verifique seu e-mail para ativar.",
      );

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

      Alert.alert("Erro no Cadastro", mensagemErro);
    } finally {
      setIsLoading(false);
    }
  };

  const RequisitoSenha = ({
    atende,
    texto,
  }: {
    atende: boolean;
    texto: string;
  }) => (
    <XStack
      ai="center"
      gap="$2"
      mb="$1"
      accessible={true}
      accessibilityLabel={`Requisito de senha: ${texto}. ${atende ? "Cumprido" : "Não cumprido"}`}
    >
      <Feather
        name={atende ? "check-circle" : "circle"}
        size={14}
        color={atende ? "#10B981" : "#64748B"}
      />
      <Text color={atende ? "#10B981" : "#64748B"} fontSize="$3">
        {texto}
      </Text>
    </XStack>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0F172A" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
      >
        <YStack f={1} jc="center" px="$6" py="$8" gap="$4">
          <YStack mb="$6" accessible={true} accessibilityRole="header">
            <Text fontSize="$9" fontWeight="800" color="white">
              Criar Conta
            </Text>
            <Text fontSize="$4" color="$gray9" mt="$2">
              Faça parte da rede.
            </Text>
          </YStack>

          <YStack gap="$2">
            <Label color="white" htmlFor="nome">
              Nome Completo
            </Label>
            <Input
              id="nome"
              size="$5"
              placeholder="Digite seu nome"
              autoCapitalize="words"
              value={nome}
              onChangeText={setNome}
              bg="#1E293B"
              borderColor="$gray6"
              color="white"
              accessibilityLabel="Campo de entrada para o nome completo"
            />
          </YStack>

          <YStack gap="$2">
            <Label color="white" htmlFor="email">
              E-mail
            </Label>
            <Input
              id="email"
              size="$5"
              placeholder="Digite seu e-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              bg="#1E293B"
              borderColor="$gray6"
              color="white"
              accessibilityLabel="Campo de entrada para o endereço de e-mail"
            />
          </YStack>

          <YStack gap="$2">
            <Label color="white" htmlFor="senha">
              Senha Segura
            </Label>
            <XStack
              ai="center"
              bg="#1E293B"
              br="$4"
              borderWidth={1}
              borderColor="$gray6"
              pr="$3"
            >
              <Input
                id="senha"
                f={1}
                size="$5"
                placeholder="Crie uma senha segura"
                secureTextEntry={!mostrarSenha}
                value={senha}
                onChangeText={setSenha}
                bg="transparent"
                color="white"
                borderWidth={0}
                accessibilityLabel="Campo de entrada para a senha"
              />
              <Feather
                name={mostrarSenha ? "eye-off" : "eye"}
                size={20}
                color="#94A3B8"
                onPress={() => setMostrarSenha(!mostrarSenha)}
                accessibilityRole="button"
                accessibilityLabel={
                  mostrarSenha ? "Ocultar senha" : "Mostrar senha"
                }
                accessibilityHint="Alterna a visibilidade da senha digitada"
              />
            </XStack>
          </YStack>

          <YStack
            bg="#0F172A"
            p="$3"
            br="$3"
            borderWidth={1}
            borderColor={isPasswordValid ? "#10B981" : "#334155"}
          >
            <RequisitoSenha
              atende={reqLength}
              texto="Pelo menos 6 caracteres"
            />
            <RequisitoSenha atende={reqUpper} texto="Uma letra maiúscula" />
            <RequisitoSenha atende={reqLower} texto="Uma letra minúscula" />
            <RequisitoSenha atende={reqNumber} texto="Um número" />
            <RequisitoSenha
              atende={reqSpecial}
              texto="Um caractere especial (@#$%^&+=!)"
            />
          </YStack>

          <Button
            size="$5"
            bg="$orange10"
            color="white"
            fontWeight="700"
            mt="$4"
            disabled={isLoading || !isPasswordValid}
            opacity={isLoading || !isPasswordValid ? 0.5 : 1}
            onPress={handleCadastro}
            icon={isLoading ? () => <Spinner color="white" /> : undefined}
            accessibilityRole="button"
            accessibilityLabel="Botão para confirmar cadastro"
            accessibilityHint="Toque para enviar o formulário e criar a sua conta"
          >
            {isLoading ? "Cadastrando..." : "Cadastrar"}
          </Button>

          <XStack jc="center" mt="$4" gap="$2">
            <Text color="$gray9">Já tem uma conta?</Text>
            <Text
              color="$blue10"
              fontWeight="700"
              onPress={() => router.push("/login")}
              accessibilityRole="link"
              accessibilityLabel="Fazer login"
              accessibilityHint="Toque para ir à tela de acesso"
            >
              Faça Login
            </Text>
          </XStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
