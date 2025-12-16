import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Pressable,
  StyleSheet,
  StatusBar,
  Image,
  Platform,
  ImageBackground
} from 'react-native';
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();

  return (
    <ImageBackground
      source={require("../img/f2.png")}
      style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
    >
      <SafeAreaView style={styles.safe}>
        <StatusBar
          barStyle="light-content"
          backgroundColor="transparent"
          translucent
        />
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.logo}>🐶 StrayMandu</Text>
          <Text style={styles.tagline}>Find, Care, Report — Help every stray</Text>
        </View>

        <View style={styles.card}>
          <View style={styles.illustration}>
            {/* Simple emoji illustration so no asset is required */}
            <Text style={styles.illustrationEmoji}>🐾</Text>
          </View>

          <Text style={styles.title}>Welcome!</Text>
          <Text style={styles.subtitle}>
            Thank you for helping our community. You can create a new report or
            browse existing ones.
          </Text>

          <View style={styles.actions}>
            <Pressable
              accessibilityLabel="Go to report page"
              style={({ pressed }) => [
                styles.buttonPrimary,
                pressed && styles.buttonPressed
              ]}
              onPress={() => router.push('/report')}
            >
              <Text style={styles.buttonPrimaryText}>Create Report</Text>
            </Pressable>

            <Pressable
              accessibilityLabel="Browse reports"
              style={({ pressed }) => [
                styles.buttonSecondary,
                pressed && styles.buttonPressed
              ]}
              onPress={() => router.push('/reportdocs')}
            >
              <Text style={styles.buttonSecondaryText}>Browse Reports</Text>
            </Pressable>
          </View>
        </View>

        <Text style={styles.footer}>Made with ❤️ by the StrayMandu community</Text>
      </View>
    </SafeAreaView>
    </ImageBackground>
  );
}
// ...existing code...

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)'
  },
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight ?? 24 : 0,
    padding: 20,
    justifyContent: 'space-between',
    backgroundColor: 'transparent'
  },
  header: {
    marginTop: 8
  },
  logo: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff'
  },
  tagline: {
    color: 'rgba(255,255,255,0.9)',
    marginTop: 6
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 12,
    elevation: 8
  },
  illustration: {
    alignItems: 'center',
    marginBottom: 12
  },
  illustrationEmoji: {
    fontSize: 48
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2b2b2b',
    textAlign: 'center'
  },
  subtitle: {
    marginTop: 8,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20
  },
  actions: {
    marginTop: 18,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: '#6b3f2b',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 8
  },
  buttonPrimaryText: {
    color: '#fff',
    fontWeight: '700'
  },
  buttonSecondary: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dcdcdc',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 8
  },
  buttonSecondaryText: {
    color: '#6b3f2b',
    fontWeight: '700'
  },
  buttonPressed: {
    opacity: 0.85
  },
  footer: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.95)',
    marginBottom: 8
  }
});