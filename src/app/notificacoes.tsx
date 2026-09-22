import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

// Dados falsos (mock) para ilustrar a tela
const notificacoesMock = [
  { id: '1', titulo: 'Bem-vindo à Smart Tag!', descricao: 'Configure seu perfil para aproveitar ao máximo a plataforma.', lida: false, tempo: 'Agora' },
  { id: '2', titulo: '5 Pontos recebidos', descricao: 'Você ajudou a liberar uma vaga solidária. Continue assim!', lida: true, tempo: 'Há 2 horas' },
];

export default function Notificacoes() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <YStack f={1} px="$5" pt="$10" pb="$4" gap="$6">
          
          {/* Cabeçalho */}
          <XStack ai="center" jc="space-between">
            <Text fontSize="$7" fontWeight="bold" color="white">Notificações</Text>
            <Text color="$blue10" fontSize="$3" fontWeight="600">Marcar todas como lidas</Text>
          </XStack>

          {/* Lista de Notificações */}
          <YStack gap="$3">
            {notificacoesMock.map((notificacao) => (
              <XStack 
                key={notificacao.id} 
                bg="#1E293B" 
                p="$4" 
                br="$4" 
                gap="$4" 
                borderWidth={1} 
                borderColor={notificacao.lida ? "#334155" : "$blue10"} // Destaca se não foi lida
              >
                <YStack pt="$1">
                  <Feather 
                    name={notificacao.titulo.includes('Pontos') ? 'star' : 'info'} 
                    size={20} 
                    color={notificacao.lida ? "#94A3B8" : "$blue10"} 
                  />
                </YStack>
                
                <YStack f={1} gap="$1">
                  <XStack jc="space-between" ai="center">
                    <Text color="white" fontSize="$4" fontWeight="600">{notificacao.titulo}</Text>
                    <Text color="#94A3B8" fontSize={10}>{notificacao.tempo}</Text>
                  </XStack>
                  <Text color="#94A3B8" fontSize="$3">{notificacao.descricao}</Text>
                </YStack>
              </XStack>
            ))}
          </YStack>

        </YStack>
      </ScrollView>

      {/* BARRA DE NAVEGAÇÃO INFERIOR */}
      <XStack bg="#0F172A" pt="$3" pb="$5" px="$6" jc="space-between" borderTopWidth={1} borderTopColor="#1E293B">
        <YStack ai="center" gap="$1" opacity={0.5} onPress={() => router.replace('/home')}>
          <Feather name="home" size={24} color="white" />
          <Text color="white" fontSize={10}>Home</Text>
        </YStack>
        
        {/* Aba de Notificações Ativa */}
        <YStack ai="center" gap="$1" opacity={1} onPress={() => router.replace('/notificacoes')}>
          <Feather name="bell" size={24} color="white" />
          <Text color="white" fontSize={10}>Notificações</Text>
        </YStack>
        
        <YStack ai="center" gap="$1" opacity={0.5} onPress={() => router.replace('/carros')}>
          <Ionicons name="car-sport-outline" size={26} color="white" />
          <Text color="white" fontSize={10}>Carros</Text>
        </YStack>
        <YStack ai="center" gap="$1" opacity={0.5} onPress={() => router.replace('/perfil')}>
          <Feather name="user" size={24} color="white" />
          <Text color="white" fontSize={10}>Perfil</Text>
        </YStack>
      </XStack>
    </SafeAreaView>
  );
}