import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { YStack, XStack, Text, Button, Spinner, Input, Label } from "tamagui";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "../services/api";

export default function Perfil() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Armazena o ID e os dados editáveis
  const [userId, setUserId] = useState("");
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    cpf: "",
  });

  useEffect(() => {
    carregarDadosUsuario();
  }, []);

  const carregarDadosUsuario = async () => {
    try {
      const response = await api.get("/auth/me");
      setUserId(response.data.id); // Guarda o ID para a exclusão
      setFormData({
        nome: response.data.nome || "",
        telefone: response.data.telefone || "",
        cpf: response.data.cpf || "",
      });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível carregar os dados do perfil.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAtualizarDados = async () => {
    setIsSaving(true);
    try {
      // Trocamos de POST para PUT aqui
      await api.put("/auth", {
        nome: formData.nome,
        telefone: formData.telefone,
        cpf: formData.cpf,
      });
      Alert.alert("Sucesso", "Seus dados foram atualizados com sucesso!");
    } catch (error) {
      console.error("Erro ao atualizar:", error);
      Alert.alert("Erro", "Ocorreu um problema ao salvar seus dados.");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmarExclusao = () => {
    Alert.alert(
      "Atenção: Excluir Conta",
      "Esta ação é irreversível. Todos os seus dados serão apagados permanentemente. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, Apagar Conta",
          style: "destructive",
          onPress: deletarConta,
        },
      ],
    );
  };

  const deletarConta = async () => {
    if (!userId) return;

    setIsDeleting(true);
    try {
      // DELETE usando o ID capturado no GET
      await api.delete(`/auth/${userId}`);
      Alert.alert("Conta Excluída", "Sua conta foi apagada com sucesso.");
      router.replace("/login");
    } catch (error) {
      console.error("Erro ao deletar:", error);
      Alert.alert("Erro", "Não foi possível excluir a conta no momento.");
      setIsDeleting(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await api.post("/auth/logout");
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    } finally {
      router.replace("/login");
    }
  };

  if (isLoading) {
    return (
      <YStack f={1} bg="#0F172A" ai="center" jc="center">
        <Spinner size="large" color="$blue10" />
      </YStack>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
          <YStack f={1} px="$6" pt="$8" pb="$4" gap="$4">
            <Text fontSize="$7" fontWeight="bold" color="white" mb="$2">
              Meu Perfil
            </Text>

            {/* Formulário de Atualização */}
            <YStack gap="$2">
              <Label color="white">Nome</Label>
              <Input
                value={formData.nome}
                onChangeText={(text) =>
                  setFormData({ ...formData, nome: text })
                }
                bg="#1E293B"
                color="white"
                borderColor="$gray6"
              />
            </YStack>

            <YStack gap="$2">
              <Label color="white">Telefone</Label>
              <Input
                value={formData.telefone}
                onChangeText={(text) =>
                  setFormData({ ...formData, telefone: text })
                }
                keyboardType="phone-pad"
                bg="#1E293B"
                color="white"
                borderColor="$gray6"
              />
            </YStack>

            <YStack gap="$2">
              <Label color="white">CPF</Label>
              <Input
                value={formData.cpf}
                onChangeText={(text) => setFormData({ ...formData, cpf: text })}
                keyboardType="numeric"
                bg="#1E293B"
                color="white"
                borderColor="$gray6"
              />
            </YStack>

            <Button
              size="$5"
              bg="$blue10"
              color="white"
              fontWeight="700"
              mt="$2"
              onPress={handleAtualizarDados}
              disabled={isSaving}
              icon={isSaving ? () => <Spinner color="white" /> : undefined}
            >
              {isSaving ? "Salvando..." : "Atualizar Dados"}
            </Button>

            {/* Separador */}
            <YStack borderBottomWidth={1} borderColor="#334155" my="$4" />

            {/* Ações de Conta */}
            <YStack gap="$3" mt="auto">
              <Button
                size="$4"
                bg="transparent"
                color="$red10"
                borderWidth={1}
                borderColor="$red10"
                onPress={confirmarExclusao}
                disabled={isDeleting}
                icon={isDeleting ? () => <Spinner color="$red10" /> : undefined}
              >
                {isDeleting ? "Apagando..." : "Excluir Minha Conta"}
              </Button>

              <Button
                size="$5"
                bg="#334155"
                color="white"
                fontWeight="700"
                onPress={handleLogout}
                disabled={isLoggingOut}
              >
                Sair da Conta
              </Button>
            </YStack>
          </YStack>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* BARRA DE NAVEGAÇÃO INFERIOR */}
      <XStack
        bg="#0F172A"
        pt="$3"
        pb="$5"
        px="$6"
        jc="space-between"
        borderTopWidth={1}
        borderTopColor="#1E293B"
      >
        <YStack
          ai="center"
          gap="$1"
          opacity={0.5}
          onPress={() => router.replace("/home")}
        >
          <Feather name="home" size={24} color="white" />
          <Text color="white" fontSize={10}>
            Home
          </Text>
        </YStack>
        <YStack
          ai="center"
          gap="$1"
          opacity={0.5}
          onPress={() => router.replace("/notificacoes")}
        >
          <Feather name="bell" size={24} color="white" />
          <Text color="white" fontSize={10}>
            Notificações
          </Text>
        </YStack>
        <YStack
          ai="center"
          gap="$1"
          opacity={0.5}
          onPress={() => router.replace("/carros")}
        >
          <Ionicons name="car-sport-outline" size={26} color="white" />
          <Text color="white" fontSize={10}>
            Carros
          </Text>
        </YStack>
        <YStack
          ai="center"
          gap="$1"
          opacity={1}
          onPress={() => router.replace("/perfil")}
        >
          <Feather name="user" size={24} color="white" />
          <Text color="white" fontSize={10}>
            Perfil
          </Text>
        </YStack>
      </XStack>
    </SafeAreaView>
  );
}
