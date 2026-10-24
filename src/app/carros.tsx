import React, { useState, useCallback, useRef } from "react";
import { ScrollView, Modal, Image, TouchableOpacity, Platform, View } from "react-native";
import { Alert } from "../services/alert";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { YStack, XStack, Text, Button, Input, Spinner, Label } from "tamagui";
import { Feather, Ionicons } from "@expo/vector-icons";
import { router, useFocusEffect, Stack } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import QRCode from "react-native-qrcode-svg";
import api from "../services/api";
import * as ImageManipulator from "expo-image-manipulator";

export default function Carros() {
  const [busca, setBusca] = useState("");
  const qrHiResRef = useRef<any>(null);
  const [isSavingQr, setIsSavingQr] = useState(false);
  const insets = useSafeAreaInsets();
  const [carros, setCarros] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [qrCodeAmpliado, setQrCodeAmpliado] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  // ESTADO ADICIONADO PARA MEMORIZAR A PLACA ORIGINAL
  const [placaOriginal, setPlacaOriginal] = useState<string | null>(null);

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
    mediaTypes: "images",
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  });

  if (!result.canceled) {
    const asset = result.assets[0];
    try {
      const reduzida = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 1024 } }],
        { compress: 0.6, format: ImageManipulator.SaveFormat.JPEG }
      );
      setFormData({ ...formData, imagem: { ...asset, uri: reduzida.uri } });
    } catch {
      // se a compressão falhar, usa a imagem original
      setFormData({ ...formData, imagem: asset });
    }
  }
};

  const abrirModalNovo = () => {
    setEditingId(null);
    setPlacaOriginal(null); // Limpa a memória para um carro novo
    setFormData({ modelo: "", ano: "", placa: "", imagem: null });
    setModalVisible(true);
  };

  const abrirModalEditar = (carro: any) => {
    setEditingId(carro.id);
    setPlacaOriginal(carro.placa); // Guarda a placa que veio do banco
    setFormData({
      modelo: carro.modelo,
      ano: carro.ano,
      placa: carro.placa,
      imagem: { uri: carro.link },
    });
    setModalVisible(true);
  };

  const salvarCarro = async () => {
    // Validação básica
    if (!editingId && (!formData.modelo || !formData.ano || !formData.placa)) {
      Alert.alert(
        "Aviso",
        "Modelo, Ano e Placa são obrigatórios para um novo veículo.",
      );
      return;
    }

    if (!editingId && !formData.imagem) {
      Alert.alert("Aviso", "Selecione uma imagem do veículo para continuar.");
      return;
    }

    const regexPlaca = /^[A-Z]{3}-?[0-9][A-Z0-9][0-9]{2}$/i;
    if (formData.placa && !regexPlaca.test(formData.placa)) {
      Alert.alert(
        "Placa Inválida",
        "Insira uma placa válida (Ex: ABC-1234 ou ABC1A23).",
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const form = new FormData();
      // O backend agora aceita apenas os campos que queremos alterar (PATCH)
      if (formData.modelo) form.append("modelo", formData.modelo);
      if (formData.ano) form.append("ano", formData.ano);

      // SÓ ENVIA A PLACA SE O UTILIZADOR A TIVER ALTERADO
      if (
        formData.placa &&
        formData.placa.toUpperCase() !== placaOriginal?.toUpperCase()
      ) {
        form.append("placa", formData.placa.toUpperCase());
      }

      const isNovaImagem =
        formData.imagem &&
        formData.imagem.uri &&
        !formData.imagem.uri.startsWith("http");

      // Anexa a imagem apenas se for realmente um novo arquivo local
      if (isNovaImagem) {
        if (Platform.OS === "web") {
          const response = await fetch(formData.imagem.uri);
          const blob = await response.blob();
          form.append("imagem", blob, "carro.jpg");
        } else {
          form.append("imagem", {
            uri: formData.imagem.uri,
            name: formData.imagem.fileName || "carro.jpg",
            type: formData.imagem.mimeType || "image/jpeg",
          } as any);
        }
      }

      if (editingId) {
        // Alterado de PUT para PATCH para espelhar a atualização do backend
        await api.patch(`/car/${editingId}`, form);
        Alert.alert("Sucesso", "Veículo atualizado!");
      } else {
        await api.post("/car/add", form);
        Alert.alert("Sucesso", "Veículo adicionado!");
      }

      setModalVisible(false);
      carregarCarros();
    } catch (error: any) {
      console.error("Erro ao salvar carro:", error);
      let mensagemErro = "Não foi possível guardar os dados do veículo.";
      if (error.response) {
        mensagemErro = error.response.data?.message || mensagemErro;
      }
      Alert.alert("Aviso do Sistema", mensagemErro);
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
            } catch (error: any) {
              console.error("Erro ao deletar:", error);
              let mensagemErro = "Não foi possível remover o veículo.";
              if (error.response && error.response.status === 403) {
                mensagemErro =
                  "Veículo Fantasma (Erro 403). Este carro possui dados antigos ou corrompidos. Peça ao administrador para removê-lo diretamente do banco de dados.";
              }
              Alert.alert("Aviso do Sistema", mensagemErro);
            }
          },
        },
      ],
    );
  };

  const alternarModoPrivacidade = async (id: string, estadoAtual: boolean) => {
    const novoEstado = !estadoAtual;
    try {
      await api.patch(`/car/${id}/toggle_alert`, {
        PermitirAlertas: novoEstado,
      });
      Alert.alert(
        "Modo Privacidade",
        novoEstado
          ? "Recebimento de alertas ativado."
          : "Alertas bloqueados com sucesso. Ninguém poderá enviar mensagens para este veículo.",
      );
      carregarCarros();
    } catch (error) {
      console.error("Erro ao alternar privacidade:", error);
      Alert.alert(
        "Erro",
        "Não foi possível alterar as definições de privacidade.",
      );
    }
  };

  const gerarNovoQrCode = (id: string) => {
    Alert.alert(
      "Atenção: Novo QR Code",
      "Gerar um novo código invalidará a etiqueta atual colada no seu carro. Deseja continuar?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Gerar Novo",
          style: "destructive",
          onPress: async () => {
            try {
              await api.put(`/car/qrcode/${id}`);
              Alert.alert(
                "Sucesso",
                "Novo QR Code gerado. Lembre-se de imprimir a nova etiqueta.",
              );
              carregarCarros();
            } catch (error) {
              console.error("Erro ao gerar QR Code:", error);
              Alert.alert("Erro", "Não foi possível gerar um novo código.");
            }
          },
        },
      ],
    );
  };

  const baixarQrCode = async () => {
    if (!qrCodeAmpliado || !qrHiResRef.current) return;

    setIsSavingQr(true);
    try {
      // Gera o PNG em base64 a partir do QR de alta resolução
      const base64: string = await new Promise((resolve, reject) => {
        try {
          qrHiResRef.current.toDataURL((data: string) => resolve(data));
        } catch (e) {
          reject(e);
        }
      });

      // WEB: dispara o download direto no navegador
      if (Platform.OS === "web") {
        const link = document.createElement("a");
        link.href = `data:image/png;base64,${base64}`;
        link.download = "smarttag-qrcode.png";
        link.click();
        return;
      }

      // MOBILE: grava o arquivo e abre o menu de compartilhar/salvar
      const fileUri = `${FileSystem.cacheDirectory}smarttag-qrcode-${Date.now()}.png`;
      await FileSystem.writeAsStringAsync(fileUri, base64, {
        encoding: FileSystem.EncodingType.Base64,
      });

      if (!(await Sharing.isAvailableAsync())) {
        Alert.alert("Erro", "Compartilhamento indisponível neste dispositivo.");
        return;
      }

      await Sharing.shareAsync(fileUri, {
        mimeType: "image/png",
        UTI: "public.png",
        dialogTitle: "Salvar ou imprimir o QR Code",
      });
    } catch (error) {
      console.error("Erro ao baixar QR Code:", error);
      Alert.alert("Erro", "Não foi possível gerar o QR Code.");
    } finally {
      setIsSavingQr(false);
    }
  };

  const normalizarPlaca = (texto: string) =>
    (texto || "").replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

  const carrosFiltrados = carros.filter((carro) =>
    normalizarPlaca(carro.placa).includes(normalizarPlaca(busca)),
  );

  useFocusEffect(
    useCallback(() => {
      setBusca("");
      carregarCarros();
    }, []),
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#0F172A" }}>
      <Stack.Screen options={{ headerShown: false }} />

      <XStack
        px="$6"
        pt="$8"
        pb="$4"
        jc="space-between"
        ai="center"
        accessible={true}
        accessibilityRole="header"
      >
        <Text
          f={1}
          fontSize="$7"
          fontWeight="bold"
          color="white"
          numberOfLines={1}
          adjustsFontSizeToFit
        >
          Meus Carros
        </Text>
        <Button
          size="$3"
          bg="$blue10"
          color="white"
          circular
          icon={<Feather name="plus" size={20} />}
          onPress={abrirModalNovo}
          accessibilityRole="button"
          accessibilityLabel="Adicionar novo veículo"
        />
      </XStack>

      <XStack
        mx="$6"
        mb="$3"
        px="$3"
        ai="center"
        gap="$2"
        bg="#1E293B"
        br="$4"
        borderWidth={1}
        borderColor="#334155"
      >
        <Feather name="search" size={18} color="#94A3B8" />
        <Input
          f={1}
          unstyled
          value={busca}
          onChangeText={setBusca}
          placeholder="Pesquisar por placa"
          placeholderTextColor={"#64748B" as any}
          color="white"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          accessibilityLabel="Campo de pesquisa de carros por placa"
        />
        {busca.length > 0 && (
          <TouchableOpacity
            onPress={() => setBusca("")}
            accessibilityRole="button"
            accessibilityLabel="Limpar pesquisa"
          >
            <Feather name="x" size={18} color="#94A3B8" />
          </TouchableOpacity>
        )}
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
            <YStack
              ai="center"
              mt="$10"
              gap="$4"
              accessible={true}
              accessibilityLabel="Você não possui nenhum veículo cadastrado"
            >
              <Ionicons name="car-sport-outline" size={64} color="#334155" />
              <Text color="#94A3B8" fontSize="$4">
                Nenhum carro cadastrado.
              </Text>
            </YStack>
          ) : carrosFiltrados.length === 0 ? (
            <YStack
              ai="center"
              mt="$10"
              gap="$4"
              accessible={true}
              accessibilityLabel="Nenhum carro encontrado para esta placa"
            >
              <Feather name="search" size={48} color="#334155" />
              <Text color="#94A3B8" fontSize="$4">
                Nenhum carro encontrado para essa placa.
              </Text>
            </YStack>
          ) : (
            carrosFiltrados.map((carro) => (
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
                    accessible={true}
                    accessibilityLabel={`Foto do veículo ${carro.modelo}`}
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

                    <TouchableOpacity
                      onPress={() => setQrCodeAmpliado(carro.qrcode)}
                      activeOpacity={0.7}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel="Tocar para ampliar o código QR deste veículo"
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
                      bg={
                        carro.AllowAlert
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(239, 68, 68, 0.15)"
                      }
                      color={carro.AllowAlert ? "#10B981" : "#EF4444"}
                      borderWidth={1}
                      borderColor={carro.AllowAlert ? "#10B981" : "#EF4444"}
                      icon={
                        <Feather
                          name={carro.AllowAlert ? "bell" : "bell-off"}
                          size={16}
                        />
                      }
                      onPress={() =>
                        alternarModoPrivacidade(carro.id, carro.AllowAlert)
                      }
                      accessibilityRole="button"
                      accessibilityLabel={
                        carro.AllowAlert
                          ? "Bloquear alertas (Ativar modo privacidade)"
                          : "Permitir alertas (Desativar modo privacidade)"
                      }
                    >
                      {carro.AllowAlert ? "Alertas ON" : "Alertas OFF"}
                    </Button>
                    <Button
                      f={1}
                      size="$3"
                      bg="#334155"
                      color="white"
                      icon={<Ionicons name="qr-code-outline" size={16} />}
                      onPress={() => gerarNovoQrCode(carro.id)}
                      accessibilityRole="button"
                      accessibilityLabel="Gerar novo código QR"
                    >
                      Novo QR
                    </Button>
                  </XStack>

                  <XStack gap="$3" mt="$1">
                    <Button
                      f={1}
                      size="$3"
                      bg="#0F172A"
                      color="white"
                      borderWidth={1}
                      borderColor="#334155"
                      onPress={() => abrirModalEditar(carro)}
                      accessibilityRole="button"
                      accessibilityLabel="Editar veículo"
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
                      accessibilityRole="button"
                      accessibilityLabel="Apagar veículo"
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

      <Modal visible={!!qrCodeAmpliado} animationType="fade" transparent={true}>
        <YStack f={1} bg="rgba(0, 0, 0, 0.85)" jc="center" ai="center" px="$6">
          <YStack
            bg="white"
            p="$6"
            br="$4"
            ai="center"
            gap="$4"
            width="100%"
            accessible={true}
            accessibilityViewIsModal={true}
          >
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
              width="100%"
              bg="#10B981"
              color="white"
              disabled={isSavingQr}
              icon={
                isSavingQr ? (
                  () => <Spinner color="white" />
                ) : (
                  <Feather name="download" size={18} color="white" />
                )
              }
              onPress={baixarQrCode}
              accessibilityRole="button"
              accessibilityLabel="Baixar QR Code como imagem para imprimir"
            >
              {isSavingQr ? "Salvando..." : "Baixar para imprimir"}
            </Button>

            <Button
              size="$4"
              width="100%"
              bg="$blue10"
              color="white"
              onPress={() => setQrCodeAmpliado(null)}
              accessibilityRole="button"
              accessibilityLabel="Fechar ampliação do código QR"
            >
              Fechar
            </Button>
          </YStack>

          {/* QR INVISÍVEL EM ALTA RESOLUÇÃO, usado só para gerar a imagem de impressão */}
          {qrCodeAmpliado && (
            <View
              pointerEvents="none"
              style={{ position: "absolute", left: -5000, top: 0 }}
            >
              <QRCode
                value={`https://smarttag-front.vercel.app/alerta/${qrCodeAmpliado}`}
                size={1000}
                quietZone={60}
                backgroundColor="white"
                color="black"
                getRef={(c) => (qrHiResRef.current = c)}
              />
            </View>
          )}
        </YStack>
      </Modal>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <YStack f={1} bg="rgba(15, 23, 42, 0.95)" jc="flex-end">
          <YStack
            bg="#1E293B"
            p="$6"
            borderTopLeftRadius={24}
            borderTopRightRadius={24}
            gap="$4"
            accessible={true}
            accessibilityViewIsModal={true}
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
                accessibilityRole="button"
                accessibilityLabel="Fechar formulário de veículo"
              />
            </XStack>

            <YStack gap="$2" ai="center" mb="$2">
              <Button
                size="$3"
                bg="#334155"
                color="white"
                onPress={selecionarImagem}
                accessibilityRole="button"
                accessibilityLabel={
                  formData.imagem
                    ? "Trocar Imagem do veículo"
                    : "Selecionar Imagem do Carro da galeria"
                }
              >
                {formData.imagem ? "Trocar Imagem" : "Selecionar Imagem"}
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
                  accessible={true}
                  accessibilityLabel="Pré-visualização da imagem do veículo"
                />
              )}
            </YStack>

            <YStack gap="$2">
              <Label color="white" htmlFor="modelo">
                Modelo
              </Label>
              <Input
                id="modelo"
                value={formData.modelo}
                onChangeText={(t) => setFormData({ ...formData, modelo: t })}
                bg="#0F172A"
                color="white"
                borderColor="$gray6"
                accessibilityLabel="Campo de entrada para o modelo do carro"
              />
            </YStack>

            <XStack gap="$4">
              <YStack f={1} gap="$2">
                <Label color="white" htmlFor="ano">
                  Ano
                </Label>
                <Input
                  id="ano"
                  value={formData.ano}
                  onChangeText={(t) => setFormData({ ...formData, ano: t })}
                  keyboardType="numeric"
                  bg="#0F172A"
                  color="white"
                  borderColor="$gray6"
                  accessibilityLabel="Campo de entrada para o ano do carro"
                />
              </YStack>
              <YStack f={1} gap="$2">
                <Label color="white" htmlFor="placa">
                  Placa
                </Label>
                <Input
                  id="placa"
                  value={formData.placa}
                  onChangeText={(t) => setFormData({ ...formData, placa: t })}
                  autoCapitalize="characters"
                  bg="#0F172A"
                  color="white"
                  borderColor="$gray6"
                  accessibilityLabel="Campo de entrada para a placa do carro"
                  accessibilityHint="Deve estar no formato ABC-1234 ou ABC1A23"
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
              accessibilityRole="button"
              accessibilityLabel={
                editingId
                  ? "Guardar alterações do veículo"
                  : "Adicionar novo veículo"
              }
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
        pb={Math.max(insets.bottom, 20)}
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
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Aba Home"
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
          onPress={() => router.replace("/mensagens")}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Aba Chats"
        >
          <Feather name="message-circle" size={24} color="white" />
          <Text color="white" fontSize={10}>
            Chats
          </Text>
        </YStack>
        <YStack
          ai="center"
          gap="$1"
          opacity={0.5}
          onPress={() => router.replace("/notificacoes")}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Aba Alertas"
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
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Aba atual: Carros"
        >
          <Ionicons name="car-sport" size={26} color="white" />
          <Text color="white" fontSize={10}>
            Carros
          </Text>
        </YStack>
      </XStack>
    </SafeAreaView>
  );
}
