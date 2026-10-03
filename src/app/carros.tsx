import React, { useState, useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  Alert,
  Modal,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { YStack, XStack, Text, Button, Input, Spinner, Label } from "tamagui";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import QRCode from "react-native-qrcode-svg";
import api from "../services/api";

export default function Carros() {
  const [carros, setCarros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Novo estado para controlar o modal do QR Code ampliado
  const [qrCodeAmpliado, setQrCodeAmpliado] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    modelo: "",
    ano: "",
    placa: "",
    imagem: null as any,
  });

  useFocusEffect(
    useCallback(() => {
      carregarCarros();
    }, []),
  );

  const carregarCarros = async () => {
    setIsLoading(true);
    try {
      const response = await api.get("/car");
      setCarros(response.data.content || response.data);
    } catch (error) {
      console.error("Erro ao buscar carros:", error);
      Alert.alert("Erro", "Não foi possível carregar a sua lista de carros.");
    } finally {
      setIsLoading(false);
    }
  };

  const selecionarImagem = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images", // Sintaxe atualizada para remover o aviso (WARN)
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setFormData({ ...formData, imagem: result.assets[0] });
    }
  };

  const abrirModalNovo = () => {
    setEditingId(null);
    setFormData({ modelo: "", ano: "", placa: "", imagem: null });
    setModalVisible(true);
  };

  const abrirModalEditar = (carro: any) => {
    setEditingId(carro.id);
    setFormData({
      modelo: carro.modelo,
      ano: carro.ano,
      placa: carro.placa,
      imagem: { uri: carro.link },
    });
    setModalVisible(true);
  };

  const salvarCarro = async () => {
    if (!formData.modelo || !formData.ano) {
      Alert.alert("Aviso", "Modelo e Ano são obrigatórios.");
      return;
    }

    // Trava de segurança para edição
    const isNovaImagem =
      formData.imagem &&
      formData.imagem.uri &&
      !formData.imagem.uri.startsWith("http");
    if (editingId && !isNovaImagem) {
      Alert.alert(
        "Atenção",
        "Como exigência do sistema, é necessário selecionar a foto do carro novamente para poder salvar a edição.",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const form = new FormData();
      form.append("modelo", formData.modelo);
      form.append("ano", formData.ano);
      form.append("placa", formData.placa);

      // --- A MÁGICA PARA FUNCIONAR NA WEB E NO MOBILE ---
      if (isNovaImagem) {
        if (Platform.OS === "web") {
          // Solução para o Vercel (Navegador)
          // Transforma a URI (base64 ou blob url) num arquivo binário real (Blob)
          const response = await fetch(formData.imagem.uri);
          const blob = await response.blob();
          form.append("imagem", blob, "carro.jpg");
        } else {
          // Solução para o Celular (Expo Go / APK)
          form.append("imagem", {
            uri: formData.imagem.uri,
            name: formData.imagem.fileName || "carro.jpg",
            type: formData.imagem.mimeType || "image/jpeg",
          } as any);
        }
      }

      if (editingId) {
        await api.put(`/car/${editingId}`, form);
        Alert.alert("Sucesso", "Veículo atualizado!");
      } else {
        await api.post("/car/add", form);
        Alert.alert("Sucesso", "Veículo adicionado!");
      }

      setModalVisible(false);
      carregarCarros();
    } catch (error) {
      console.error("Erro ao salvar carro:", error);
      Alert.alert(
        "Erro",
        "Não foi possível guardar os dados do veículo. Verifique se a placa já existe.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const deletarCarro = (id: string) => {
    Alert.alert(
      "Apagar Veículo",
      "Tem a certeza que deseja remover este carro?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Apagar",
          style: "destructive",
          onPress: async () => {
            try {
              await api.delete(`/car/${id}`);
              Alert.alert("Sucesso", "Veículo removido.");
              carregarCarros();
            } catch (error) {
              console.error("Erro ao deletar:", error);
              Alert.alert("Erro", "Não foi possível remover o veículo.");
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <Stack.Screen options={{ headerShown: false }} />

      <XStack px="$6" pt="$8" pb="$4" jc="space-between" ai="center">
        <Text fontSize="$7" fontWeight="bold" color="white">
          Meus Carros
        </Text>
        <Button
          size="$3"
          bg="$blue10"
          color="white"
          circular
          icon={<Feather name="plus" size={20} />}
          onPress={abrirModalNovo}
        />
      </XStack>

      {isLoading ? (
        <YStack f={1} jc="center" ai="center">
          <Spinner size="large" color="$blue10" />
        </YStack>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        >
          {carros.length === 0 ? (
            <YStack ai="center" mt="$10" gap="$4">
              <Ionicons name="car-sport-outline" size={64} color="#334155" />
              <Text color="#94A3B8" fontSize="$4">
                Nenhum carro cadastrado.
              </Text>
            </YStack>
          ) : (
            carros.map((carro) => (
              <YStack
                key={carro.id}
                bg="#1E293B"
                br="$4"
                overflow="hidden"
                mb="$4"
                borderWidth={1}
                borderColor="#334155"
              >
                {carro.link ? (
                  <Image
                    source={{ uri: carro.link }}
                    style={{ width: "100%", height: 160 }}
                    resizeMode="cover"
                  />
                ) : (
                  <YStack
                    width="100%"
                    height={160}
                    bg="#0F172A"
                    jc="center"
                    ai="center"
                  >
                    <Ionicons name="car" size={48} color="#334155" />
                  </YStack>
                )}

                <YStack p="$4" gap="$2">
                  <XStack jc="space-between" ai="flex-start">
                    <YStack f={1} pr="$2">
                      <Text
                        color="white"
                        fontSize="$5"
                        fontWeight="bold"
                        numberOfLines={1}
                      >
                        {carro.modelo}
                      </Text>
                      <Text color="#94A3B8" fontSize="$3">
                        {carro.ano} • Placa: {carro.placa}
                      </Text>
                    </YStack>

                    {/* Botão para ampliar o QR Code */}
                    <TouchableOpacity
                      onPress={() => setQrCodeAmpliado(carro.qrcode)}
                      activeOpacity={0.7}
                    >
                      <YStack ai="center" bg="white" p="$2" br="$2">
                        <QRCode
                          value={`https://smarttag-front.vercel.app/alerta/${carro.qrcode}`}
                          size={50}
                        />
                        <Text
                          color="black"
                          fontSize={9}
                          mt="$1"
                          fontWeight="bold"
                        >
                          TOCAR
                        </Text>
                      </YStack>
                    </TouchableOpacity>
                  </XStack>

                  <XStack gap="$3" mt="$3">
                    <Button
                      f={1}
                      size="$3"
                      bg="#334155"
                      color="white"
                      onPress={() => abrirModalEditar(carro)}
                    >
                      Editar
                    </Button>
                    <Button
                      f={1}
                      size="$3"
                      bg="transparent"
                      color="$red10"
                      borderWidth={1}
                      borderColor="$red10"
                      onPress={() => deletarCarro(carro.id)}
                    >
                      Apagar
                    </Button>
                  </XStack>
                </YStack>
              </YStack>
            ))
          )}
        </ScrollView>
      )}

      {/* MODAL QR CODE AMPLIADO */}
      <Modal visible={!!qrCodeAmpliado} animationType="fade" transparent={true}>
        <YStack f={1} bg="rgba(0, 0, 0, 0.85)" jc="center" ai="center" px="$6">
          <YStack bg="white" p="$6" br="$4" ai="center" gap="$4" width="100%">
            <Text fontSize="$5" fontWeight="bold" color="#0F172A">
              O seu SmartTag
            </Text>
            {qrCodeAmpliado && (
              <YStack p="$2" borderWidth={2} borderColor="#E2E8F0" br="$2">
                <QRCode
                  value={`https://smarttag-front.vercel.app/alerta/${qrCodeAmpliado}`}
                  size={220}
                />
              </YStack>
            )}
            <Text color="#64748B" fontSize="$3" textAlign="center" mt="$2">
              Qualquer pessoa pode apontar a câmera para este código para lhe
              enviar alertas anônimos.
            </Text>
            <Button
              size="$4"
              mt="$2"
              width="100\%"
              bg="$blue10"
              color="white"
              onPress={() => setQrCodeAmpliado(null)}
            >
              Fechar
            </Button>
          </YStack>
        </YStack>
      </Modal>

      {/* MODAL DE ADICIONAR/EDITAR (MANTIDO) */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <YStack f={1} bg="rgba(15, 23, 42, 0.95)" jc="flex-end">
          <YStack
            bg="#1E293B"
            p="$6"
            borderTopLeftRadius={24}
            borderTopRightRadius={24}
            gap="$4"
          >
            <XStack jc="space-between" ai="center" mb="$2">
              <Text color="white" fontSize="$6" fontWeight="bold">
                {editingId ? "Editar Veículo" : "Novo Veículo"}
              </Text>
              <Feather
                name="x"
                size={24}
                color="#94A3B8"
                onPress={() => setModalVisible(false)}
              />
            </XStack>

            <YStack gap="$2" ai="center" mb="$2">
              <Button
                size="$3"
                bg="#334155"
                color="white"
                onPress={selecionarImagem}
              >
                {formData.imagem
                  ? "Trocar Imagem"
                  : "Selecionar Imagem do Carro"}
              </Button>
              {formData.imagem && (
                <Image
                  source={{ uri: formData.imagem.uri }}
                  style={{
                    width: 100,
                    height: 75,
                    borderRadius: 8,
                    marginTop: 8,
                  }}
                />
              )}
            </YStack>

            <YStack gap="$2">
              <Label color="white">Modelo</Label>
              <Input
                value={formData.modelo}
                onChangeText={(t) => setFormData({ ...formData, modelo: t })}
                bg="#0F172A"
                color="white"
                borderColor="$gray6"
              />
            </YStack>

            <XStack gap="$4">
              <YStack f={1} gap="$2">
                <Label color="white">Ano</Label>
                <Input
                  value={formData.ano}
                  onChangeText={(t) => setFormData({ ...formData, ano: t })}
                  keyboardType="numeric"
                  bg="#0F172A"
                  color="white"
                  borderColor="$gray6"
                />
              </YStack>
              <YStack f={1} gap="$2">
                <Label color="white">Placa</Label>
                <Input
                  value={formData.placa}
                  onChangeText={(t) => setFormData({ ...formData, placa: t })}
                  autoCapitalize="characters"
                  bg="#0F172A"
                  color="white"
                  borderColor="$gray6"
                />
              </YStack>
            </XStack>

            <Button
              size="$5"
              bg="$blue10"
              color="white"
              fontWeight="700"
              mt="$4"
              onPress={salvarCarro}
              disabled={isSubmitting}
              icon={isSubmitting ? () => <Spinner color="white" /> : undefined}
            >
              {isSubmitting ? "A Guardar..." : "Guardar Veículo"}
            </Button>
          </YStack>
        </YStack>
      </Modal>

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
            Alertas
          </Text>
        </YStack>
        <YStack
          ai="center"
          gap="$1"
          opacity={1}
          onPress={() => router.replace("/carros")}
        >
          <Ionicons name="car-sport" size={26} color="white" />
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
