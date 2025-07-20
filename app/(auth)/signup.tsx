import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Shield, TriangleAlert as AlertTriangle } from 'lucide-react-native';

export default function SignUpScreen() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'citizen', // citizen, official, responder
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      router.replace('/(tabs)');
    }, 1000);
  };

  const updateFormData = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Shield size={48} color="#FF6B35" />
                <AlertTriangle size={32} color="#FFD23F" style={styles.alertIcon} />
              </View>
              <Text style={styles.title}>Join WildSafe</Text>
              <Text style={styles.subtitle}>Create your emergency response account</Text>
            </View>

            <View style={styles.form}>
              <Text style={styles.label}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(value) => updateFormData('firstName', value)}
                placeholder="Enter your first name"
                placeholderTextColor="#666"
              />

              <Text style={styles.label}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(value) => updateFormData('lastName', value)}
                placeholder="Enter your last name"
                placeholderTextColor="#666"
              />

              <Text style={styles.label}>Email *</Text>
              <TextInput
                style={styles.input}
                value={formData.email}
                onChangeText={(value) => updateFormData('email', value)}
                placeholder="Enter your email"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <Text style={styles.label}>Password *</Text>
              <TextInput
                style={styles.input}
                value={formData.password}
                onChangeText={(value) => updateFormData('password', value)}
                placeholder="Create a password"
                placeholderTextColor="#666"
                secureTextEntry
              />

              <Text style={styles.label}>Confirm Password *</Text>
              <TextInput
                style={styles.input}
                value={formData.confirmPassword}
                onChangeText={(value) => updateFormData('confirmPassword', value)}
                placeholder="Confirm your password"
                placeholderTextColor="#666"
                secureTextEntry
              />

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSignUp}
                disabled={isLoading}
              >
                <Text style={styles.buttonText}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Text>
              </TouchableOpacity>

              <View style={styles.linkContainer}>
                <Text style={styles.linkText}>Already have an account? </Text>
                <Link href="/(auth)/login" style={styles.link}>
                  <Text style={styles.linkHighlight}>Sign In</Text>
                </Link>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F0F0F',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 24,
    paddingTop: 48,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  alertIcon: {
    position: 'absolute',
    top: -8,
    right: -8,
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
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  label: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#1A1A1A',
    borderColor: '#333',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  linkText: {
    color: '#888',
    fontSize: 16,
  },
  link: {
    marginLeft: 4,
  },
  linkHighlight: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
});