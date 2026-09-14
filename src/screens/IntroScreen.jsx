import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity,
  StatusBar,
  Easing,
  Image,
} from 'react-native';
import logo from '../Assests/Logo1.png';

// Import the new component for the main content
import MainContent from './MainContent';

const { width, height } = Dimensions.get('window');

const IntroPage = ({ navigation }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const backgroundAnim = useRef(new Animated.Value(0)).current;
  const buttonAnim = useRef(new Animated.Value(0)).current;
  const logoTextAnim = useRef(new Animated.Value(0)).current;
  const energyAnim = useRef(new Animated.Value(0)).current;

  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    startIntroAnimation();
  }, []);

  const startIntroAnimation = () => {
    // Background energy animation
    Animated.timing(backgroundAnim, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    }).start();

    // Energy pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(energyAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
        Animated.timing(energyAnim, {
          toValue: 0,
          duration: 2000,
          easing: Easing.bezier(0.4, 0, 0.6, 1),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Logo entrance with dynamic effect
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 6,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowContent(true);
      startContentAnimation();
    });

    // Logo text typing effect
    Animated.timing(logoTextAnim, {
      toValue: 1,
      duration: 2000,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    // Athletic pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 800,
          easing: Easing.out(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.in(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();
  };

  const startContentAnimation = () => {
    // Action button with power
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(buttonAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.back(1.2)),
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }, 600);
  };

  const handleGetStarted = () => {
    // Power exit animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.2,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // navigation.navigate('Home');
      console.log('Navigate to main app');
      navigation.navigate('Register');
    });
  };

  const energyPulse = energyAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.3],
  });

  const energyOpacity = energyAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  const backgroundInterpolation = backgroundAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(76, 175, 80, 0.05)', 'rgba(76, 175, 80, 0.12)'],
  });

  return (
    <>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <Animated.View style={[styles.container, { backgroundColor: backgroundInterpolation }]}>
        
        {/* Dynamic Background Elements */}
        <View style={styles.backgroundElements}>
          <Animated.View
            style={[
              styles.energyRing,
              styles.ring1,
              {
                transform: [{ scale: energyPulse }],
                opacity: energyOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.energyRing,
              styles.ring2,
              {
                transform: [{ scale: Animated.multiply(energyPulse, 0.8) }],
                opacity: Animated.multiply(energyOpacity, 0.6),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.athleticShape,
              styles.shape1,
              {
                transform: [{ scale: pulseAnim }, { rotate: '45deg' }],
              },
            ]}
          />
          <Animated.View
            style={[
              styles.athleticShape,
              styles.shape2,
              {
                transform: [{ scale: Animated.multiply(pulseAnim, 0.7) }, { rotate: '-30deg' }],
              },
            ]}
          />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          
          {/* Logo Section */}
          <Animated.View
            style={[
              styles.logoContainer,
              {
                opacity: fadeAnim,
                transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
              },
            ]}
          >
            <View style={styles.logoWrapper}>
              <View style={styles.logo}>
                <Image source={logo} style={styles.logoImage} />
              </View>
            </View>
          </Animated.View>

          {/* Conditionally render the new component */}
          {showContent && <MainContent />}

          {/* Action Buttons */}
          <Animated.View
            style={[
              styles.buttonContainer,
              {
                opacity: buttonAnim,
                transform: [{ translateY: slideAnim }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleGetStarted}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonText}>Get Started</Text>
              <View style={styles.buttonArrow}>
                <Text style={styles.arrowText}>⚡</Text>
              </View>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.7}>
              <Text style={styles.secondaryButtonText}>Log in</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Athletic Progress Indicator */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <Animated.View 
              style={[
                styles.progressFill,
                {
                  transform: [{ scaleX: logoTextAnim }],
                }
              ]} 
            />
          </View>
          <Text style={styles.progressText}>Welcome to ATHLEET</Text>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  backgroundElements: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  energyRing: {
    position: 'absolute',
    borderRadius: 1000,
    borderWidth: 3,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  ring1: {
    width: 300,
    height: 300,
    top: '20%',
    left: '50%',
    marginLeft: -150,
    marginTop: -150,
  },
  ring2: {
    width: 200,
    height: 200,
    bottom: '25%',
    right: '10%',
  },
  athleticShape: {
    position: 'absolute',
    backgroundColor: 'rgba(76, 175, 80, 0.08)',
  },
  shape1: {
    width: 80,
    height: 80,
    top: '15%',
    right: '15%',
    borderRadius: 20,
  },
  shape2: {
    width: 60,
    height: 60,
    bottom: '40%',
    left: '10%',
    borderRadius: 15,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 25,
    paddingTop: 80,
  },
  logoContainer: {
    marginBottom: 50,
    alignItems: 'center',
  },
  logoWrapper: {
    position: 'relative',
    alignItems: 'center',
  },
  logo: {
    alignItems: 'center',
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 16,
    resizeMode: 'contain',
    marginVertical: 4,
  },
  logoTextMain: {
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 4,
  },
  logoAccent: {
    position: 'absolute',
    bottom: 5,
    left: '50%',
    width: 40,
    height: 3,
    backgroundColor: '#ffffff',
    borderRadius: 2,
    marginLeft: -20,
  },
  energyGlow: {
    position: 'absolute',
    width: 140,
    height: 80,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 25,
    top: -5,
  },
  buttonContainer: {
    alignItems: 'center',
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 35,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#4CAF50',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    marginBottom: 15,
    minWidth: 220,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 12,
  },
  buttonArrow: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrowText: {
    color: '#ffffff',
    fontSize: 16,
  },
  secondaryButton: {
    paddingVertical: 15,
    paddingHorizontal: 25,
  },
  secondaryButtonText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 60,
    width: '100%',
    alignItems: 'center',
  },
  progressTrack: {
    width: 200,
    height: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 2,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '500',
  },
});

export default IntroPage;