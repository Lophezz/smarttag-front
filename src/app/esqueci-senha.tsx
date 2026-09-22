import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { YStack, Text, Input, Button, Label, XStack, Spinner } from 'tamagui';
import axios from 'axios';
import api from '../services/api';

export default function EsqueciSenha() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSolicitarRecuperacao = async () => {
    if (!email) {
      Alert.alert('Atenção', 'Por favor, digite seu e-mail cadastrado.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/auth/request-password', {
        email: email,
      });

      Alert.alert(
        'E-mail Enviado!', 
        'Se o e-mail estiver cadastrado, você receberá um código de recuperação em instantes.'
      );
      
      router.push({
        pathname: '/resetar-senha',
        params: { email: email }
      });

    } catch (error) {
      console.error('Erro ao solicitar recuperação:', error);
      let mensagemErro = 'Não foi possível processar a solicitação. Tente novamente mais tarde.';

      if (axios.isAxiosError(error)) {
        mensagemErro = error.response?.data?.message || mensagemErro;
      }
      
      Alert.alert('Erro', mensagemErro);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: '#0F172A' }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center' }}>
        <YStack f={1} jc="center" px="$6" py="$8" gap="$4">
          
          <YStack mb="$6">
            <Text fontSize="$9" fontWeight="800" color="white">Recuperar Senha</Text>
            <Text fontSize="$4" color="$gray9" mt="$2">
              Digite o e-mail associado à sua conta. Enviaremos um código para você criar uma nova senha.
            </Text>
          </YStack>

          <YStack gap="$2">
            <Label color="white">E-mail</Label>
            <Input 
              size="$5" 
              placeholder="Digite seu e-mail" 
              keyboardType="email-address" 
              autoCapitalize="none" 
              value={email} 
              onChangeText={setEmail} 
              bg="#1E293B" 
              borderColor="$gray6" 
              color="white" 
            />
          </YStack>

          <Button 
            size="$5" 
            bg="$blue10" 
            color="white" 
            fontWeight="700" 
            mt="$4"
            disabled={isLoading}
            opacity={isLoading ? 0.7 : 1}
            pressStyle={{ scale: 0.97, bg: "$blue9" }}
            onPress={handleSolicitarRecuperacao}
            icon={isLoading ? () => <Spinner color="white" /> : undefined}
          >
            {isLoading ? 'Enviando...' : 'Enviar Código'}
          </Button>

          <XStack jc="center" mt="$4" gap="$2">
            <Text color="$gray9">Lembrou sua senha?</Text>
            <Text color="$orange10" fontWeight="700" onPress={() => router.back()}>
              Voltar ao Login
            </Text>
          </XStack>

        </YStack>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}