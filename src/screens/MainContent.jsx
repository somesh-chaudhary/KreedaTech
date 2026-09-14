// MainContent.jsx
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

const MainContent = () => {
  const titleAnim = new Animated.Value(-100);
  const subtitleAnim = new Animated.Value(100);

  useEffect(() => {
    // Animate the title and subtitle when the component mounts
    Animated.spring(titleAnim, {
      toValue: 0,
      tension: 60,
      friction: 8,
      useNativeDriver: true,
    }).start();

    Animated.spring(subtitleAnim, {
      toValue: 0,
      tension: 45,
      friction: 7,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <>
      <Animated.View
        style={[
          styles.textContainer,
          {
            transform: [{ translateY: titleAnim }],
          },
        ]}
      >
        <Text style={styles.title}>Unleash Your Potential</Text>
        <Text style={styles.subtitle2}>Elite Athletic Performance</Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.featuresContainer,
          {
            transform: [{ translateY: subtitleAnim }],
          },
        ]}
      >
        <Text style={styles.description}>
          Transform your athletic journey with cutting-edge performance tracking and professional training insights.
        </Text>

        <View style={styles.featureGrid}>
          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🏃‍♂️</Text>
            </View>
            <Text style={styles.featureText}>Performance Analytics</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>📊</Text>
            </View>
            <Text style={styles.featureText}>Progress Tracking</Text>
          </View>

          <View style={styles.featureItem}>
            <View style={styles.featureIcon}>
              <Text style={styles.featureEmoji}>🏆</Text>
            </View>
            <Text style={styles.featureText}>Goal Achievement</Text>
          </View>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  // ... (add the relevant styles from IntroScreen.jsx)
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -1,
  },
  subtitle2: {
    fontSize: 18,
    color: '#4CAF50',
    fontWeight: '600',
    letterSpacing: 1,
  },
  featuresContainer: {
    alignItems: 'center',
    marginBottom: 50,
    width: '100%',
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 35,
    paddingHorizontal: 5,
  },
  featureGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingHorizontal: 10,
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureEmoji: {
    fontSize: 24,
  },
  featureText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default MainContent;