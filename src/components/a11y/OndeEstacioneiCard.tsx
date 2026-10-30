import React, { useState, useEffect } from "react";
import { Linking, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { YStack, XStack, Text, Button, Spinner } from "tamagui";
import { Feather, Ionicons } from "@expo/vector-icons";
import { Alert } from "../../services/alert";
import { useCores } from "../a11y/AccessibilityMenu";

const STORAGE_KEY_VAGA = "@smarttag:vaga_estacionada";

type Coordenadas = {
  latitude: number;
  longitude: number;
  salvoEm: string;
};

// Fórmula de Haversine para calcular a distância em metros entre dois pontos
function calcularDistanciaMetros(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371e3; // Raio da Terra em metros
  const toRad = (graus: number) => (graus * Math.PI) / 180;

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function OndeEstacioneiCard() {
  const cores = useCores();
  const [vaga, setVaga] = useState<Coordenadas | null>(null);
  const [posicaoAtual, setPosicaoAtual] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Carrega a vaga salva ao abrir a tela
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY_VAGA)
      .then((salvo) => {
        if (salvo) {
          setVaga(JSON.parse(salvo));
        }
      })
      .catch(() => undefined);
  }, []);

  // Quando há uma vaga salva, monitora a posição do usuário para atualizar a distância
  useEffect(() => {
    if (!vaga) {
      setPosicaoAtual(null);
      return;
    }

    let inscricao: Location.LocationSubscription | null = null;
    let ativo = true;

    const acompanharPosicao = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") return;

        const atual = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        if (ativo) {
          setPosicaoAtual({
            latitude: atual.coords.latitude,
            longitude: atual.coords.longitude,
          });
        }

        // Atualiza conforme o usuário caminha (a cada 5 metros ou 5 segundos)
        inscricao = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 5,
            timeInterval: 5000,
          },
          (novaPos) => {
            if (ativo) {
              setPosicaoAtual({
                latitude: novaPos.coords.latitude,
                longitude: novaPos.coords.longitude,
              });
            }
          }
        );
      } catch (error) {
        console.error("Erro ao acompanhar localização:", error);
      }
    };

    acompanharPosicao();

    return () => {
      ativo = false;
      inscricao?.remove();
    };
  }, [vaga]);

  const marcarEstacionamento = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão negada",
          "Precisamos da sua localização para salvar onde você estacionou o veículo."
        );
        return;
      }

      const local = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const novaVaga: Coordenadas = {
        latitude: local.coords.latitude,
        longitude: local.coords.longitude,
        salvoEm: new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      await AsyncStorage.setItem(STORAGE_KEY_VAGA, JSON.stringify(novaVaga));
      setVaga(novaVaga);
      setPosicaoAtual({
        latitude: novaVaga.latitude,
        longitude: novaVaga.longitude,
      });
      Alert.alert("Local salvo!", "A localização do seu carro foi registrada.");
    } catch (error) {
      console.error("Erro ao obter localização:", error);
      Alert.alert(
        "Erro de localização",
        "Não foi possível obter o seu GPS. Verifique se a localização do aparelho está ativada."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const removerMarcacao = () => {
    Alert.alert(
      "Liberar vaga",
      "Já encontrou o seu veículo? Isso removerá a marcação atual.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Sim, remover",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem(STORAGE_KEY_VAGA);
            setVaga(null);
            setPosicaoAtual(null);
          },
        },
      ]
    );
  };

  const abrirNoGps = () => {
    if (!vaga) return;
    const { latitude, longitude } = vaga;

    // URL universal do Google Maps já com rota de caminhada (travelmode=walking)
    const urlWebOuAndroid = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=walking`;
    // No iOS, abre o Apple Maps com rota a pé (dirflg=w) ou cai no Google Maps
    const urlIos = `http://maps.apple.com/?daddr=${latitude},${longitude}&dirflg=w`;

    const urlFinal = Platform.OS === "ios" ? urlIos : urlWebOuAndroid;
    Linking.openURL(urlFinal).catch(() => {
      Linking.openURL(urlWebOuAndroid);
    });
  };

  // Cálculo da distância e tempo de caminhada (80 metros por minuto)
  const distanciaMetros =
    vaga && posicaoAtual
      ? Math.round(
          calcularDistanciaMetros(
            posicaoAtual.latitude,
            posicaoAtual.longitude,
            vaga.latitude,
            vaga.longitude
          )
        )
      : null;

  const tempoMinutos =
    distanciaMetros !== null ? Math.max(1, Math.round(distanciaMetros / 80)) : null;

  const textoDistancia =
    distanciaMetros !== null
      ? distanciaMetros >= 1000
        ? `${(distanciaMetros / 1000).toFixed(1)} km`
        : `${distanciaMetros} m`
      : "Calculando...";

  return (
    <YStack
      bg={cores.cartao}
      br="$4"
      p="$4"
      gap="$3"
      borderWidth={1}
      borderColor={cores.bordaCartao}
    >
      <XStack ai="center" jc="space-between">
        <XStack ai="center" gap="$2">
          <Ionicons name="location" size={22} color={cores.link} />
          <Text color={cores.texto} fontSize="$5" fontWeight="700" accessibilityRole="header">
            Onde estacionei?
          </Text>
        </XStack>
        {vaga && (
          <Text color={cores.textoSecundario} fontSize="$2">
            Salvo às {vaga.salvoEm}
          </Text>
        )}
      </XStack>

      {!vaga ? (
        <>
          <Text color={cores.textoSecundario} fontSize="$3">
            Marque a posição atual para encontrar seu carro depois com distância e tempo de caminhada.
          </Text>
          <Button
            size="$4"
            bg={cores.botaoPrimario}
            color={cores.textoEmBotao}
            fontWeight="700"
            disabled={isLoading}
            onPress={marcarEstacionamento}
            icon={
              isLoading ? (
                () => <Spinner color="white" />
              ) : (
                <Feather name="map-pin" size={18} color={cores.textoEmBotao} />
              )
            }
            accessibilityLabel="Estacionei aqui. Salva a localização atual do veículo."
          >
            {isLoading ? "Obtendo GPS..." : "Estacionei aqui"}
          </Button>
        </>
      ) : (
        <>
          <YStack
            bg={cores.fundo}
            p="$3"
            br="$3"
            borderWidth={1}
            borderColor={cores.bordaControle}
            accessible={true}
            accessibilityRole="summary"
            accessibilityLabel={
              distanciaMetros !== null
                ? `Seu carro está a ${textoDistancia}, aproximadamente ${tempoMinutos} minutos andando.`
                : "Calculando distância até o seu carro."
            }
          >
            {distanciaMetros !== null ? (
              <Text color={cores.texto} fontSize="$4" fontWeight="600">
                Seu carro está a{" "}
                <Text color={cores.link} fontWeight="800">
                  {textoDistancia}
                </Text>{" "}
                {distanciaMetros < 15
                  ? "(você está próximo ao veículo)"
                  : `(aprox. ${tempoMinutos} min andando)`}
              </Text>
            ) : (
              <XStack ai="center" gap="$2">
                <Spinner size="small" color={cores.link} />
                <Text color={cores.textoSecundario} fontSize="$3">
                  Calculando distância em tempo real...
                </Text>
              </XStack>
            )}
          </YStack>

          <XStack gap="$3">
            <Button
              f={1}
              size="$4"
              bg={cores.botaoPrimario}
              color={cores.textoEmBotao}
              fontWeight="700"
              icon={<Feather name="navigation" size={16} color={cores.textoEmBotao} />}
              onPress={abrirNoGps}
              accessibilityLabel="Ver no GPS. Abre o aplicativo de mapas com a rota a pé até o carro."
            >
              Ver no GPS
            </Button>
            <Button
              size="$4"
              bg="transparent"
              color={cores.erro}
              borderWidth={1}
              borderColor={cores.erro}
              icon={<Feather name="trash-2" size={16} color={cores.erro} />}
              onPress={removerMarcacao}
              accessibilityLabel="Remover marcação de estacionamento"
            >
              Liberar
            </Button>
          </XStack>
        </>
      )}
    </YStack>
  );
}