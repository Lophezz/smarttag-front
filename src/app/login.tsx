import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Alert } from "react-native";
import { router, Stack } from "expo-router";
import { YStack, Text, Input, Button, Label, XStack, Spinner } from "tamagui";
import { Feather } from "@expo/vector-icons"; // <-- Adicionado para o ícone do olho
import axios from "axios";
import api from "../services/api";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false); // <-- Estado do olhinho

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Atenção", "Por favor, preencha seu e-mail e senha.");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/login", {
        email: email.toLowerCase().trim(), // Boa prática: normalizar e-mail
        password: senha,
      });

      // Como o backend manda o token por Cookie e não pelo JSON,
      // não vamos usar o AsyncStorage aqui por enquanto para não dar erro.

      router.replace("/home");
    } catch (error) {
      console.error("Erro no login:", error);
      let mensagemErro =
        "Não foi possível fazer o login. Verifique suas credenciais.";

      if (axios.isAxiosError(error)) {
        mensagemErro = error.response?.data?.message || mensagemErro;
      }

      Alert.alert("Erro de Acesso", mensagemErro);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#0F172A" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <YStack f={1} jc="center" px="$6" gap="$4">
        {/* Título com Acessibilidade */}
        <YStack ai="center" mb="$6" accessible={true} accessibilityRole="header">
          <Text fontSize="$9" fontWeight="800" color="white">
            Smart<Text color="$blue10">Tag</Text>
          </Text>
          <Text fontSize="$4" color="$gray9" ta="center" mt="$2">
            Acesse sua conta para gerenciar seus veículos.
          </Text>
        </YStack>

        {/* Inputs */}
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
            accessibilityLabel="Campo de entrada para o e-mail"
          />
        </YStack>

        <YStack gap="$2">
          <XStack jc="space-between" ai="center">
            <Label color="white" htmlFor="senha">
              Senha
            </Label>
            {/* Link para recuperar senha */}
            <Text
              color="$blue10"
              fontSize="$3"
              fontWeight="600"
              onPress={() => router.push("/esqueci-senha")}
              accessibilityRole="link"
              accessibilityLabel="Esqueceu a senha?"
              accessibilityHint="Toque para ir para a tela de recuperação de senha"
            >
              Esqueceu a senha?
            </Text>
          </XStack>

          {/* Input de Senha com Ícone */}
          <XStack ai="center" bg="#1E293B" br="$4" borderWidth={1} borderColor="$gray6" pr="$3">
            <Input
              id="senha"
              f={1}
              size="$5"
              placeholder="Digite sua senha"
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
              accessibilityLabel={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            />
          </XStack>
        </YStack>

        {/* Botão Principal */}
        <Button
          size="$5"
          bg="$blue10"
          color="white"
          fontWeight="700"
          mt="$4"
          disabled={isLoading}
          opacity={isLoading ? 0.7 : 1}
          pressStyle={{ scale: 0.97, bg: "$blue9" }}
          onPress={handleLogin}
          icon={isLoading ? () => <Spinner color="white" /> : undefined}
          accessibilityRole="button"
          accessibilityLabel="Botão Entrar"
          accessibilityHint="Toque para fazer login na sua conta"
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </Button>

        {/* Link para Cadastro */}
        <XStack jc="center" mt="$4" gap="$2">
          <Text color="$gray9">Não tem uma conta?</Text>
          <Text
            color="$orange10"
            fontWeight="700"
            onPress={() => router.push("/cadastro")}
            accessibilityRole="link"
            accessibilityLabel="Cadastre-se"
            accessibilityHint="Toque para criar uma nova conta"
          >
            Cadastre-se
          </Text>
        </XStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}