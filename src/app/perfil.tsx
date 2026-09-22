import React, { useState } from 'react';
import { SafeAreaView, ScrollView, Alert } from 'react-native';
import { YStack, XStack, Text, Button, Spinner } from 'tamagui';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function Perfil() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);

    try {
      // Chama a rota de logout do backend para limpar os cookies da sessão
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Erro ao deslogar no backend:', error);
      // Mesmo se a API falhar, continuamos para limpar o app localmente
    } finally {
      // Limpa qualquer token que tenhamos salvo no celular
      await AsyncStorage.removeItem('userToken');
      
      // Redireciona para o Login, impedindo de voltar pelo botão do celular
      router.replace('/login');
    }
  };

  const confirmarLogout = () => {
    Alert.alert(
      'Sair da Conta',
      'Tem certeza que deseja sair do aplicativo?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Sair', style: 'destructive', onPress: handleLogout }
      ]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#0F172A' }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <YStack f={1} px="$6" pt="$10" pb="$4" gap="$6" ai="center">
          
          <Feather name="user" size={64} color="white" />
          <Text fontSize="$7" fontWeight="bold" color="white" mt="$2">Meu Perfil</Text>
          <Text fontSize="$4" color="$gray9" ta="center">
            Configurações e gerenciamento da sua conta estarão disponíveis aqui.
          </Text>

          <YStack f={1} w="100%" jc="flex-end" pb="$4">
            <Button 
              size="$5" 
              bg="$red10" 
              color="white" 
              fontWeight="700" 
              onPress={confirmarLogout}
              disabled={isLoggingOut}
              icon={isLoggingOut ? () => <Spinner color="white" /> : undefined}
            >
              {isLoggingOut ? 'Saindo...' : 'Sair da Conta'}
            </Button>
          </YStack>

        </YStack>
      </ScrollView>

      {/* BARRA DE NAVEGAÇÃO INFERIOR (Perfil Destacado) */}
      <XStack bg="#0F172A" pt="$3" pb="$5" px="$6" jc="space-between" borderTopWidth={1} borderTopColor="#1E293B">
        <YStack ai="center" gap="$1" opacity={0.5} onPress={() => router.replace('/home')}>
          <Feather name="home" size={24} color="white" />
          <Text color="white" fontSize={10}>Home</Text>
        </YStack>
        
        <YStack ai="center" gap="$1" opacity={0.5} onPress={() => router.replace('/notificacoes')}>
          <Feather name="bell" size={24} color="white" />
          <Text color="white" fontSize={10}>Notificações</Text>
        </YStack>
        
        <YStack ai="center" gap="$1" opacity={0.5} onPress={() => router.replace('/carros')}>
          <Ionicons name="car-sport-outline" size={26} color="white" />
          <Text color="white" fontSize={10}>Carros</Text>
        </YStack>
        
        {/* Aba de Perfil com opacidade 1 indicando que estamos nela */}
        <YStack ai="center" gap="$1" opacity={1} onPress={() => router.replace('/perfil')}>
          <Feather name="user" size={24} color="white" />
          <Text color="white" fontSize={10}>Perfil</Text>
        </YStack>
      </XStack>
    </SafeAreaView>
  );
}