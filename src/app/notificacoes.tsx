import React, { useState, useCallback } from 'react';
import { SafeAreaView, ScrollView, Alert } from 'react-native';
import { YStack, XStack, Text, Button, Spinner } from 'tamagui';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, Stack } from 'expo-router';
import api from '../services/api';

export default function Notificacoes() {
  const [alertas, setAlertas] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processandoId, setProcessandoId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      carregarAlertas();
    }, [])
  );

  const carregarAlertas = async () => {
    setIsLoading(true);
    try {
      // O backend agora só devolve os alertas PENDENTES e paginados
      const response = await api.get('/auth/notify');
      setAlertas(response.data.content || response.data || []);
    } catch (error) {
      console.error('Erro ao buscar alertas:', error);
      Alert.alert('Erro', 'Não foi possível carregar os seus alertas.');
    } finally {
      setIsLoading(false);
    }
  };

  const avaliarAlerta = async (id: string, isValido: boolean) => {
    setProcessandoId(id);
    try {
      // Envia a avaliação para o backend (que dará ou tirará pontos do remetente)
      await api.post(`/auth/notify/${id}`, { isMessageUtil: isValido });
      
      Alert.alert(
        'Avaliação Enviada', 
        isValido ? 'Obrigado por confirmar. O remetente ganhou pontos de cidadão!' : 'Obrigado por avisar. O remetente foi penalizado por enviar alerta falso.'
      );
      
      // Remove o alerta da lista visualmente sem precisar recarregar toda a API
      setAlertas((prev) => prev.filter((alerta) => alerta.id !== id));
    } catch (error: any) {
      console.error('Erro ao avaliar alerta:', error);
      Alert.alert('Aviso', error.response?.data?.message || 'Não foi possível processar a sua avaliação.');
    } finally {
      setProcessandoId(null);
    }
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '';
    const data = new Date(dataStr);
    return data.toLocaleDateString('pt-BR') + ' às ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <Stack.Screen options={{ headerShown: false }} />
      
      {/* CABEÇALHO CORRIGIDO COM RESPONSIVIDADE */}
      <XStack px="$6" pt="$8" pb="$4" jc="space-between" ai="center" accessible={true} accessibilityRole="header">
        <Text f={1} fontSize="$7" fontWeight="bold" color="white" numberOfLines={1} adjustsFontSizeToFit>
          Meus Alertas
        </Text>
        <Feather 
          name="refresh-cw" 
          size={20} 
          color="#94A3B8" 
          onPress={carregarAlertas} 
          accessible={true} 
          accessibilityRole="button" 
          accessibilityLabel="Atualizar lista de alertas" 
        />
      </XStack>

      {isLoading ? (
        <YStack f={1} jc="center" ai="center">
          <Spinner size="large" color="$blue10" />
        </YStack>
      ) : (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}>
          {alertas.length === 0 ? (
            <YStack ai="center" mt="$10" gap="$4" accessible={true} accessibilityLabel="Nenhum alerta pendente.">
              <Feather name="bell-off" size={64} color="#334155" />
              <Text color="#94A3B8" fontSize="$4" textAlign="center">
                Você não possui nenhum alerta pendente de avaliação.
              </Text>
            </YStack>
          ) : (
            alertas.map((alerta) => (
              <YStack 
                key={alerta.id} 
                bg="#1E293B" 
                p="$4" 
                br="$4" 
                mb="$4" 
                borderWidth={1} 
                borderColor="#334155"
                accessible={true}
                accessibilityLabel={`Alerta de ${alerta.destinatario} para o veículo ${alerta.notifyCarDTO?.modelo}. Mensagem: ${alerta.mensagem}`}
              >
                
                {/* INFO DO CARRO E DATA */}
                <XStack jc="space-between" ai="flex-start" mb="$2">
                  <YStack f={1}>
                    <Text color="$blue10" fontSize="$2" fontWeight="bold" mb="$1">
                      NOVO ALERTA • {formatarData(alerta.dataEnvio)}
                    </Text>
                    <Text color="white" fontSize="$5" fontWeight="bold">
                      {alerta.notifyCarDTO?.modelo || 'Veículo'} 
                      <Text color="#94A3B8" fontSize="$4" fontWeight="normal"> ({alerta.notifyCarDTO?.placa || 'Sem Placa'})</Text>
                    </Text>
                  </YStack>
                  <Ionicons name="car-sport" size={24} color="#94A3B8" />
                </XStack>

                {/* MENSAGEM DO ALERTA */}
                <YStack bg="#0F172A" p="$3" br="$3" mb="$3" borderWidth={1} borderColor="#334155">
                  <Text color="#E2E8F0" fontSize="$4" fontStyle="italic">
                    "{alerta.mensagem}"
                  </Text>
                  <Text color="#64748B" fontSize="$2" mt="$2" textAlign="right">
                    Enviado por: {alerta.citizienStatus === 'Anônimo' ? 'Anônimo' : `Usuário ${alerta.citizienStatus}`}
                  </Text>
                </YStack>

                {/* BOTÕES DE AVALIAÇÃO */}
                <Text color="#94A3B8" fontSize="$3" mb="$2" textAlign="center">
                  Este alerta foi realmente útil e verdadeiro?
                </Text>
                
                <XStack gap="$3">
                  <Button 
                    f={1} 
                    size="$4" 
                    bg="rgba(16, 185, 129, 0.15)" 
                    color="#10B981" 
                    borderWidth={1} 
                    borderColor="#10B981"
                    icon={processandoId === alerta.id ? () => <Spinner color="#10B981" /> : <Feather name="check" size={18} />}
                    disabled={processandoId === alerta.id}
                    onPress={() => avaliarAlerta(alerta.id, true)}
                    accessibilityRole="button"
                    accessibilityLabel="Aprovar alerta. Dar pontos ao remetente."
                  >
                    Sim, foi útil
                  </Button>
                  
                  <Button 
                    f={1} 
                    size="$4" 
                    bg="rgba(239, 68, 68, 0.15)" 
                    color="#EF4444" 
                    borderWidth={1} 
                    borderColor="#EF4444"
                    icon={processandoId === alerta.id ? () => <Spinner color="#EF4444" /> : <Feather name="x" size={18} />}
                    disabled={processandoId === alerta.id}
                    onPress={() => avaliarAlerta(alerta.id, false)}
                    accessibilityRole="button"
                    accessibilityLabel="Rejeitar alerta como falso. Retirar pontos do remetente."
                  >
                    Alerta Falso
                  </Button>
                </XStack>

              </YStack>
            ))
          )}
        </ScrollView>
      )}

      {/* BARRA DE NAVEGAÇÃO INFERIOR PADRONIZADA */}
      <XStack bg="#0F172A" pt="$3" pb="$5" px="$6" jc="space-between" borderTopWidth={1} borderTopColor="#1E293B">
        <YStack ai="center" gap="$1" opacity={0.5} onPress={() => router.replace('/home')} accessible={true} accessibilityRole="button" accessibilityLabel="Aba Home">
          <Feather name="home" size={24} color="white" />
          <Text color="white" fontSize={10}>Home</Text>
        </YStack>
        <YStack ai="center" gap="$1" opacity={0.5} onPress={() => router.replace('/mensagens')} accessible={true} accessibilityRole="button" accessibilityLabel="Aba Chats">
          <Feather name="message-circle" size={24} color="white" />
          <Text color="white" fontSize={10}>Chats</Text>
        </YStack>
        <YStack ai="center" gap="$1" opacity={1} onPress={() => router.replace('/notificacoes')} accessible={true} accessibilityRole="button" accessibilityLabel="Aba atual: Alertas">
          <Feather name="bell" size={24} color="white" />
          <Text color="white" fontSize={10}>Alertas</Text>
        </YStack>
        <YStack ai="center" gap="$1" opacity={0.5} onPress={() => router.replace('/carros')} accessible={true} accessibilityRole="button" accessibilityLabel="Aba Carros">
          <Ionicons name="car-sport" size={26} color="white" />
          <Text color="white" fontSize={10}>Carros</Text>
        </YStack>
      </XStack>
    </SafeAreaView>
  );
}