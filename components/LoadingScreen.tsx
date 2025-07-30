import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Flame } from 'lucide-react-native';

export default function LoadingScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Flame size={56} color="#FF6B35" />
        </View>
        <Text style={styles.title}>HazMap</Text>
        <Text style={styles.subtitle}>Loading...</Text>
        <ActivityIndicator size="large" color="#FF6B35" style={styles.spinner} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 24,
  },
  spinner: {
    marginTop: 16,
  },
}); 