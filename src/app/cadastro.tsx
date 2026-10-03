import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { router, Stack } from "expo-router";
import { YStack, Text, Input, Button, Label, XStack, Spinner } from "tamagui";
import axios from "axios";
import api from "../services/api";

export default function Cadastro() {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCadastro = async () => {
    if (!nome || !email || !senha) {
      Alert.alert("Atenção", "Por favor, preencha todos os campos.");
      return;
    }

    setIsLoading(true);

    try {
      await api.post("/auth/register", {
        nome: nome,
        email: email,
        password: senha,
      });

      Alert.alert(
        "Sucesso!",
        "Conta criada. Verifique seu e-mail para ativar.",
      );

      router.push({
        pathname: "/verificacao",
        params: { email: email },
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
          <YStack mb="$6">
            <Text fontSize="$9" fontWeight="800" color="white">
              Criar Conta
            </Text>
            <Text fontSize="$4" color="$gray9" mt="$2">
              Faça parte da rede.
            </Text>
          </YStack>

          <YStack gap="$2">
            <Label color="white">Nome Completo</Label>
            <Input
              size="$5"
              placeholder="Digite seu nome"
              autoCapitalize="words"
              value={nome}
              onChangeText={setNome}
              bg="#1E293B"
              borderColor="$gray6"
              color="white"
            />
          </YStack>

          <YStack gap="$2">
            <Label color="white">E-mail</Label>
            <Input
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
            <Label color="white">Senha</Label>
            <Input
              size="$5"
              placeholder="Crie uma senha segura"
              secureTextEntry
              value={senha}
              onChangeText={setSenha}
              bg="#1E293B"
              borderColor="$gray6"
              color="white"
            />
          </YStack>

          <Button
            size="$5"
            bg="$orange10"
            color="white"
            fontWeight="700"
            mt="$4"
            disabled={isLoading}
            opacity={isLoading ? 0.7 : 1}
            onPress={handleCadastro}
            icon={isLoading ? () => <Spinner color="white" /> : undefined}
          >
            {isLoading ? "Cadastrando..." : "Cadastrar"}
          </Button>

          <XStack jc="center" mt="$4" gap="$2">
            <Text color="$gray9">Já tem uma conta?</Text>
            <Text
              color="$blue10"
              fontWeight="700"
              onPress={() => router.push("/login")}
            >
              Faça Login
            </Text>
          </XStack>
        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
