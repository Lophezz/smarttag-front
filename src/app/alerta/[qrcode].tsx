import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, Alert, Image } from 'react-native';
import { YStack, XStack, Text, Button, Spinner } from 'tamagui';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import api from '../../services/api';

// Mapeamento dos alertas baseados no Enum do seu Backend
const OPCOES_ALERTA = [
  { id: 'FAROL_ACESO', titulo: 'Farol Aceso', icone: 'sun' },
  { id: 'ALARME_DISPARANDO', titulo: 'Alarme Disparando', icone: 'bell' },
  { id: 'VIDRO_ABERTO', titulo: 'Vidro Aberto', icone: 'wind' },
  { id: 'ESTACIONAMENTO', titulo: 'Bloqueando Saída', icone: 'alert-triangle' },
];

export default function PaginaAlerta() {
  // Captura o ID do QR Code diretamente da URL
  const { qrcode } = useLocalSearchParams();
  
  const [carro, setCarro] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [alertaEnviado, setAlertaEnviado] = useState(false);

  useEffect(() => {
    if (qrcode) {
      buscarDadosDoCarro();
    }
  }, [qrcode]);

  const buscarDadosDoCarro = async () => {
    try {
      // GET na rota pública para procurar os dados do carro pelo QR Code
      const response = await api.get(`/alert/${qrcode}`);
      setCarro(response.data);
    } catch (error) {
      console.error('Erro ao buscar carro:', error);
      Alert.alert('Erro', 'QR Code inválido ou veículo não encontrado.');
      router.replace('/login'); // Redireciona caso o código seja falso
    } finally {
      setIsLoading(false);
    }
  };

  const enviarAlerta = async (tipoAlerta: string) => {
    setIsSending(true);
    try {
      // POST enviando o Enum exato que o backend espera no QuickAlertRequestDTO
      await api.post(`/alert/${qrcode}`, {
        quickAlert: tipoAlerta
      });
      
      setAlertaEnviado(true);
      Alert.alert('Sucesso!', 'O proprietário foi notificado anonimamente.');
    } catch (error: any) {
      console.error('Erro ao enviar alerta:', error);
      Alert.alert('Ops', error.response?.data?.message || 'Não foi possível enviar o alerta neste momento.');
    } finally {
      setIsSending(false);
    }
  };

  if (isLoading) {
    return (
      <YStack f={1} bg="#0F172A" ai="center" jc="center">
        <Stack.Screen options={{ headerShown: false }} />
        <Spinner size="large" color="$blue10" />
        <Text color="white" mt="$4">A localizar veículo...</Text>
      </YStack>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 24, justifyContent: 'center' }}>
        
        {alertaEnviado ? (
          <YStack ai="center" gap="$4" bg="#1E293B" p="$6" br="$4" borderWidth={1} borderColor="#10B981">
            <Ionicons name="checkmark-circle" size={80} color="#10B981" />
            <Text color="white" fontSize="$6" fontWeight="bold" textAlign="center">
              Alerta Enviado!
            </Text>
            <Text color="#94A3B8" fontSize="$4" textAlign="center">
              Obrigado por ser um bom cidadão. O proprietário do veículo acaba de ser notificado.
            </Text>
            <Button size="$4" bg="$blue10" color="white" mt="$4" onPress={() => router.replace('/login')}>
              Conhecer a SmartTag
            </Button>
          </YStack>
        ) : (
          <YStack gap="$6">
            <YStack ai="center" gap="$2">
              <Ionicons name="car-sport" size={64} color="white" />
              <Text color="white" fontSize="$6" fontWeight="bold" textAlign="center">
                Notificar Proprietário
              </Text>
              <Text color="#94A3B8" fontSize="$3" textAlign="center">
                Selecione o que está a acontecer com este veículo. O aviso será enviado imediatamente.
              </Text>
            </YStack>

            {/* CARD DO CARRO */}
            {carro && (
              <YStack bg="#1E293B" br="$4" overflow="hidden" borderWidth={1} borderColor="#334155">
                {carro.link ? (
                  <Image source={{ uri: carro.link }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
                ) : (
                  <YStack width="100%" height={120} bg="#0F172A" jc="center" ai="center">
                    <Ionicons name="car" size={48} color="#334155" />
                  </YStack>
                )}
                <YStack p="$4" ai="center">
                  <Text color="white" fontSize="$5" fontWeight="bold">{carro.modelo}</Text>
                  <Text color="#94A3B8" fontSize="$4" mt="$1">Placa: {carro.placa}</Text>
                </YStack>
              </YStack>
            )}

            {/* OPÇÕES DE ALERTA */}
            <YStack gap="$3" opacity={isSending ? 0.5 : 1} pointerEvents={isSending ? 'none' : 'auto'}>
              {OPCOES_ALERTA.map((opcao) => (
                <Button 
                  key={opcao.id}
                  size="$5" 
                  bg="#334155" 
                  color="white" 
                  justifyContent="flex-start"
                  icon={<Feather name={opcao.icone as any} size={20} color="#EAB308" />}
                  onPress={() => enviarAlerta(opcao.id)}
                >
                  {opcao.titulo}
                </Button>
              ))}
            </YStack>

            {isSending && (
              <YStack ai="center" mt="$2">
                <Spinner size="small" color="$blue10" />
                <Text color="#94A3B8" mt="$2">A notificar...</Text>
              </YStack>
            )}

          </YStack>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}