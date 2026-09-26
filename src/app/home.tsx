import React, { useState, useEffect } from "react";
import { SafeAreaView, ScrollView, Alert } from "react-native";
import { YStack, XStack, Text, Button, Avatar, Spinner } from "tamagui";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import api from "../services/api";

// Dados mockados mantidos para as ações recentes
const acoesRecentes = [
  { id: "1", titulo: "Remoção rápida", pontos: "+10", icone: "star" },
  { id: "2", titulo: "Vaga solidária liberada", pontos: "+5", icone: "star" },
  { id: "3", titulo: "Farol aceso ajudado", pontos: "+12", icone: "star" },
];

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [usuario, setUsuario] = useState({
    nome: "",
    foto: "https://i.pravatar.cc/150?img=11",
    pontos: 320, // Mockado até o backend ter sistema de pontos
  });

  useEffect(() => {
    buscarDadosUsuario();
  }, []);

  const buscarDadosUsuario = async () => {
    try {
      const response = await api.get("/auth/me");
      const dadosUsuario = response.data;

      // Atualiza com o nome real vindo do banco de dados
      setUsuario((prev) => ({
        ...prev,
        nome: dadosUsuario.nome || "Usuário",
      }));

      // Verificação de Primeiro Acesso / Dados Incompletos
      // Se não houver telefone ou CPF cadastrado, exibe o pop-up
      if (!dadosUsuario.telefone || !dadosUsuario.cpf) {
        Alert.alert(
          "Complete seu Cadastro",
          "Percebemos que seus dados estão incompletos. Atualize seu perfil para utilizar todos os recursos da Smart Tag.",
          [
            { text: "Fazer Depois", style: "cancel" },
            {
              text: "Atualizar Agora",
              onPress: () => router.replace("/perfil"),
            },
          ],
        );
      }
    } catch (error) {
      console.error("Erro ao buscar usuário:", error);
      // Mantém silencioso para não incomodar caso seja apenas uma falha de rede momentânea
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        <YStack f={1} px="$5" pt="$8" pb="$4" gap="$6">
          <XStack ai="center" jc="space-between">
            <XStack ai="center" gap="$3">
              <Avatar circular size="$6">
                <Avatar.Image source={{ uri: usuario.foto }} />
                <Avatar.Fallback bc="$blue10" />
              </Avatar>

              {isLoading ? (
                <Spinner size="small" color="$blue10" />
              ) : (
                <Text color="white" fontSize="$5" fontWeight="600">
                  {usuario.nome}
                </Text>
              )}
            </XStack>

            <Feather
              name="settings"
              size={24}
              color="#94A3B8"
              onPress={() => router.replace("/perfil")}
            />
          </XStack>

          <XStack
            bg="#1E293B"
            br="$4"
            p="$4"
            jc="center"
            ai="center"
            borderWidth={1}
            borderColor="#334155"
          >
            <Text fontSize="$4" fontWeight="600">
              <Text color="$blue10">Bom cidadão - </Text>
              <Text color="white">{usuario.pontos} pontos</Text>
            </Text>
          </XStack>

          <YStack gap="$3">
            <Text color="#94A3B8" fontSize="$3" mb="$2">
              Ações Recentes
            </Text>
            {acoesRecentes.map((acao) => (
              <XStack
                key={acao.id}
                bg="#1E293B"
                p="$4"
                br="$4"
                ai="center"
                jc="space-between"
              >
                <Text color="white" fontSize="$4" fontWeight="500">
                  {acao.titulo}
                </Text>
                <XStack ai="center" gap="$2">
                  <Text color="#10B981" fontSize="$3">
                    {acao.pontos} pontos
                  </Text>
                  <Feather name={acao.icone as any} size={16} color="white" />
                </XStack>
              </XStack>
            ))}
          </YStack>

          <Button
            size="$5"
            bg="#2A9D8F"
            color="white"
            fontWeight="700"
            mt="$4"
            pressStyle={{ scale: 0.97, opacity: 0.8 }}
          >
            Histórico de Ações
          </Button>
        </YStack>
      </ScrollView>

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
          opacity={1}
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
          opacity={0.5}
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
