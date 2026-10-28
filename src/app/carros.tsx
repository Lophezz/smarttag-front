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
import BottomTabBar from "../components/a11y/BottomTabBar";
import Cabecalho from "../components/a11y/Cabecalho";
import FormField from "../components/a11y/FormField";
import IconButton from "../components/a11y/IconButton";
import { cores } from "../components/a11y/colors";
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

      <Cabecalho
        titulo="Meus carros"
        acao={{ icone: "plus", label: "Adicionar novo veículo", onPress: abrirModalNovo }}
      />

      <XStack
        mx="$6"
        mb="$3"
        px="$3"
        ai="center"
        gap="$2"
        bg="#1E293B"
        br="$4"
        borderWidth={1}
        borderColor={cores.bordaControle}
      >
        <Feather name="search" size={18} color={cores.textoSecundario} accessibilityElementsHidden importantForAccessibility="no" />
        <Input
          f={1}
          unstyled
          value={busca}
          onChangeText={setBusca}
          placeholder="Pesquisar por placa"
          placeholderTextColor={cores.textoSecundario as any}
          color="white"
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={8}
          accessibilityLabel="Pesquisar por placa"
          returnKeyType="search"
        />
        {busca.length > 0 && (
          <IconButton label="Limpar pesquisa" onPress={() => setBusca("")}>
            <Feather name="x" size={18} color={cores.textoSecundario} />
          </IconButton>
        )}
      </XStack>

      {isLoading ? (
        <YStack f={1} jc="center" ai="center">
          <Spinner size="large" color={cores.link} accessibilityLabel="Carregando veículos" accessibilityLiveRegion="polite" />
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
              <Ionicons name="car-sport-outline" size={64} color={cores.bordaControle} />
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
              <Feather name="search" size={48} color={cores.bordaControle} />
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
                    <Ionicons name="car" size={48} color={cores.bordaControle} accessibilityElementsHidden importantForAccessibility="no" />
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
                        accessibilityRole="header"
                      >
                        {carro.modelo}
                      </Text>
                      <Text color={cores.textoSecundario} fontSize="$3">
                        {carro.ano} • Placa: {carro.placa}
                      </Text>
                    </YStack>

                    <TouchableOpacity
                      onPress={() => setQrCodeAmpliado(carro.qrcode)}
                      activeOpacity={0.7}
                      accessible={true}
                      accessibilityRole="button"
                      accessibilityLabel={`Tocar para ampliar o código QR do veículo ${carro.modelo}, placa ${carro.placa}`}
                    >
                      <YStack ai="center" bg="white" p="$2" br="$2">
                        <QRCode
                          value={`https://smarttag-front.vercel.app/alerta/${carro.qrcode}`}
                          size={50}
                        />
                        <Text
                          color="black"
                          fontSize={11}
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
                      color={carro.AllowAlert ? cores.sucesso : cores.erro}
                      borderWidth={1}
                      borderColor={carro.AllowAlert ? cores.sucesso : cores.erro}
                      icon={
                        <Feather
                          name={carro.AllowAlert ? "bell" : "bell-off"}
                          size={16}
                        />
                      }
                      onPress={() =>
                        alternarModoPrivacidade(carro.id, carro.AllowAlert)
                      }
                      accessibilityLabel={
                        carro.AllowAlert
                          ? `Alertas ON do veículo ${carro.modelo}. Toque para bloquear alertas e ativar o modo privacidade`
                          : `Alertas OFF do veículo ${carro.modelo}. Toque para permitir alertas e desativar o modo privacidade`
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
                      accessibilityLabel={`Novo QR para o veículo ${carro.modelo}, placa ${carro.placa}`}
                      accessibilityHint="O código QR atual deixará de funcionar"
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
                      accessibilityLabel={`Editar veículo ${carro.modelo}, placa ${carro.placa}`}
                    >
                      Editar
                    </Button>
                    <Button
                      f={1}
                      size="$3"
                      bg="transparent"
                      color={cores.erro}
                      borderWidth={1}
                      borderColor={cores.erro}
                      onPress={() => deletarCarro(carro.id)}
                      accessibilityLabel={`Apagar veículo ${carro.modelo}, placa ${carro.placa}`}
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

      <Modal
        visible={!!qrCodeAmpliado}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setQrCodeAmpliado(null)}
      >
        <YStack f={1} bg="rgba(0, 0, 0, 0.85)" jc="center" ai="center" px="$6">
          <YStack
            bg="white"
            p="$6"
            br="$4"
            ai="center"
            gap="$4"
            width="100%"
            accessibilityViewIsModal={true}
          >
            <Text fontSize="$5" fontWeight="bold" color="#0F172A" accessibilityRole="header">
              O seu SmartTag
            </Text>
            {qrCodeAmpliado && (
              <YStack
                p="$2"
                borderWidth={2}
                borderColor="#E2E8F0"
                br="$2"
                accessible
                accessibilityRole="image"
                accessibilityLabel="Código QR do seu SmartTag. Ao ser lido, abre a página para enviar alertas ao seu veículo."
              >
                <QRCode
                  value={`https://smarttag-front.vercel.app/alerta/${qrCodeAmpliado}`}
                  size={220}
                />
              </YStack>
            )}
            <Text color="#475569" fontSize="$3" textAlign="center" mt="$2">
              Qualquer pessoa pode apontar a câmera para este código para lhe
              enviar alertas anônimos.
            </Text>

            <Button
              size="$4"
              mt="$2"
              width="100%"
              bg="#047857"
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
              accessibilityHint="Salva o QR Code como imagem para você imprimir"
              accessibilityState={{ busy: isSavingQr, disabled: isSavingQr }}
            >
              {isSavingQr ? "Salvando..." : "Baixar para imprimir"}
            </Button>

            <Button
              size="$4"
              width="100%"
              bg={cores.botaoPrimario}
              color="white"
              onPress={() => setQrCodeAmpliado(null)}
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

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <YStack f={1} bg="rgba(15, 23, 42, 0.95)" jc="flex-end">
          <YStack
            bg="#1E293B"
            p="$6"
            borderTopLeftRadius={24}
            borderTopRightRadius={24}
            gap="$4"
            accessibilityViewIsModal={true}
          >
            <XStack jc="space-between" ai="center" mb="$2">
              <Text color="white" fontSize="$6" fontWeight="bold" accessibilityRole="header">
                {editingId ? "Editar veículo" : "Novo veículo"}
              </Text>
              <IconButton label="Fechar formulário de veículo" onPress={() => setModalVisible(false)}>
                <Feather name="x" size={24} color={cores.textoSuave} />
              </IconButton>
            </XStack>

            <YStack gap="$2" ai="center" mb="$2">
              <Button
                size="$3"
                bg={cores.botaoNeutro}
                color="white"
                onPress={selecionarImagem}
                accessibilityHint="Abre a galeria para escolher a foto do veículo"
              >
                {formData.imagem ? "Trocar imagem" : "Selecionar imagem"}
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

            <FormField
              id="carro-modelo"
              label="Modelo"
              value={formData.modelo}
              onChangeText={(t) => setFormData({ ...formData, modelo: t })}
              autoComplete="off"
            />

            <XStack gap="$4">
              <YStack f={1}>
                <FormField
                  id="carro-ano"
                  label="Ano"
                  value={formData.ano}
                  onChangeText={(t) => setFormData({ ...formData, ano: t })}
                  keyboardType="numeric"
                  autoComplete="off"
                />
              </YStack>
              <YStack f={1}>
                <FormField
                  id="carro-placa"
                  label="Placa"
                  value={formData.placa}
                  onChangeText={(t) => setFormData({ ...formData, placa: t })}
                  autoCapitalize="characters"
                  autoComplete="off"
                  helper="Formato ABC-1234 ou ABC1A23"
                />
              </YStack>
            </XStack>

            <Button
              size="$5"
              bg={cores.botaoPrimario}
              color="white"
              fontWeight="700"
              mt="$4"
              onPress={salvarCarro}
              disabled={isSubmitting}
              icon={isSubmitting ? () => <Spinner color="white" /> : undefined}
              accessibilityState={{ busy: isSubmitting, disabled: isSubmitting }}
            >
              {isSubmitting ? "A guardar..." : "Guardar veículo"}
            </Button>
          </YStack>
        </YStack>
      </Modal>

      <BottomTabBar ativa="carros" />
    </SafeAreaView>
  );
}
