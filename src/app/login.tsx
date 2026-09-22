import React, { useState } from "react";
import { KeyboardAvoidingView, Platform, Alert } from "react-native";
import { router } from "expo-router";
import { YStack, Text, Input, Button, Label, XStack, Spinner } from "tamagui";
import axios from "axios";
import api from "../services/api";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !senha) {
      Alert.alert("Atenção", "Por favor, preencha seu e-mail e senha.");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/login", {
        email: email,
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
      <YStack f={1} jc="center" px="$6" gap="$4">
        {/* Título */}
        <YStack ai="center" mb="$6">
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
              onPress={() => router.push("/esqueci-senha")} //
            >
              Esqueceu a senha?
            </Text>
          </XStack>
          <Input
            id="senha"
            size="$5"
            placeholder="Digite sua senha"
            secureTextEntry
            value={senha}
            onChangeText={setSenha}
            bg="#1E293B"
            borderColor="$gray6"
            color="white"
          />
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
          >
            Cadastre-se
          </Text>
        </XStack>
      </YStack>
    </KeyboardAvoidingView>
  );
}
