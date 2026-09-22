import React from 'react';
import { SafeAreaView, ScrollView } from 'react-native';
import { YStack, XStack, Text, Button } from 'tamagui';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function Carros() {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1 }}>
        <YStack f={1} px="$5" pt="$10" pb="$4" gap="$6">
          
          {/* Cabeçalho */}
          <Text fontSize="$7" fontWeight="bold" color="white">Meus Veículos</Text>

          {/* Placeholder: Estado Vazio */}
          <YStack bg="#1E293B" p="$6" br="$4" ai="center" jc="center" gap="$3" borderWidth={1} borderColor="#334155" mt="$4">
            <Ionicons name="car-sport-outline" size={64} color="#94A3B8" />
            <Text color="white" fontSize="$5" fontWeight="600" mt="$2">Nenhum veículo</Text>
            <Text color="#94A3B8" ta="center" fontSize="$3">
              Você ainda não possui veículos cadastrados na sua conta Smart Tag.
            </Text>
            
            <Button 
              size="$4" 
              bg="$blue10" 
              color="white" 
              fontWeight="700" 
              mt="$4"
              pressStyle={{ scale: 0.97, opacity: 0.8 }}
              onPress={() => console.log('Ir para tela de adicionar carro')}
            >
              Adicionar Veículo
            </Button>
          </YStack>

        </YStack>
      </ScrollView>

      {/* BARRA DE NAVEGAÇÃO INFERIOR */}
      <XStack bg="#0F172A" pt="$3" pb="$5" px="$6" jc="space-between" borderTopWidth={1} borderTopColor="#1E293B">
        <YStack ai="center" gap="$1" opacity={0.5} onPress={() => router.replace('/home')}>
          <Feather name="home" size={24} color="white" />
          <Text color="white" fontSize={10}>Home</Text>
        </YStack>
        <YStack ai="center" gap="$1" opacity={0.5} onPress={() => router.replace('/notificacoes')}>
          <Feather name="bell" size={24} color="white" />
          <Text color="white" fontSize={10}>Notificações</Text>
        </YStack>
        
        {/* Aba de Carros Ativa */}
        <YStack ai="center" gap="$1" opacity={1} onPress={() => router.replace('/carros')}>
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