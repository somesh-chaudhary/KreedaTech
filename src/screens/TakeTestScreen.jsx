import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// --- THEME & STYLES (MATCHING HOMESCREEN) ---
const greenTheme = {
  colors: {
    primary: '#2E7D32',
    primaryLight: '#4CAF50',
    background: '#F4F6F9',
    card: '#FFFFFF',
    text: '#1D2C3B',
    textSecondary: '#6B7A8B',
    border: '#EAECEF',
    white: '#FFFFFF',
  },
  spacing: { s: 8, m: 16, l: 24 },
  typography: {
    h1: { fontSize: 24, fontWeight: 'bold' },
    h2: { fontSize: 20, fontWeight: 'bold' },
    body: { fontSize: 16, fontWeight: '500', lineHeight: 24 },
    caption: { fontSize: 13, color: '#6B7A8B' },
  },
  borderRadius: { m: 16, l: 24 },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 5,
  },
};

const TakeTestScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();

  const testType = route?.params?.testName || route?.params?.testType || '40-Yard Dash';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={greenTheme.colors.background} />

      {/* --- HEADER (FIXED AT THE TOP) --- */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FeatherIcon name="arrow-left" size={24} color={greenTheme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>{testType}</Text>
          <Text style={styles.headerSubtitle}>Ready to challenge yourself?</Text>
        </View>
      </View>

      {/* --- SCROLLABLE CONTENT --- */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- Test Information Card --- */}
        <View style={[styles.card, greenTheme.shadow]}>
          <Text style={styles.cardTitle}>Assessment Test</Text>
          <InfoRow icon="clock" label="Time Limit:" value="1-5 minutes" />
          <InfoRow icon="list" label="Test Type:" value={testType} />
          <InfoRow icon="star" label="Difficulty:" value="Intermediate" />
          <View style={styles.divider} />
          <Text style={styles.descriptionText}>
            This test will be analysed by our assessment engine. Please keep your camera on during the test.
          </Text>
        </View>

        {/* --- Instructions Card --- */}
        <View style={[styles.card, greenTheme.shadow]}>
          <Text style={styles.cardTitle}>Instructions</Text>
          <InstructionItem text="Ensure camera permission is enabled." />
          <InstructionItem text="Place phone in a stable position with full body visibility." />
          <InstructionItem text="Tap 'Start Test' and complete the exercise when the timer starts." />
        </View>
      </ScrollView>

      {/* --- FLOATING ACTION BUTTON --- */}
      <View style={[styles.buttonContainer, { paddingBottom: insets.bottom > 0 ? insets.bottom : 20 }]}>
        <TouchableOpacity
          style={[styles.actionButton, greenTheme.shadow]}
          onPress={() => navigation.navigate('LiveTest', { testType })}
        >
          <Text style={styles.actionButtonText}>Start Test</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

// --- Reusable sub-components for cleaner code ---
const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <FeatherIcon name={icon} size={18} color={greenTheme.colors.textSecondary} />
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

const InstructionItem = ({ text }) => (
  <View style={styles.instructionItem}>
    <FeatherIcon name="check-circle" size={20} color={greenTheme.colors.primary} />
    <Text style={styles.instructionText}>{text}</Text>
  </View>
);

// --- STYLES ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: greenTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: greenTheme.spacing.m,
    paddingBottom: greenTheme.spacing.s,
    backgroundColor: greenTheme.colors.background,
  },
  backButton: {
    padding: greenTheme.spacing.s,
    marginRight: greenTheme.spacing.m,
  },
  headerTextContainer: {},
  headerTitle: {
    ...greenTheme.typography.h1,
  },
  headerSubtitle: {
    ...greenTheme.typography.caption,
  },
  scrollContent: {
    padding: greenTheme.spacing.m,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: greenTheme.colors.card,
    borderRadius: greenTheme.borderRadius.m,
    padding: greenTheme.spacing.l,
    marginBottom: greenTheme.spacing.m,
  },
  cardTitle: {
    ...greenTheme.typography.h2,
    marginBottom: greenTheme.spacing.l,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: greenTheme.spacing.m,
  },
  infoLabel: {
    ...greenTheme.typography.body,
    color: greenTheme.colors.textSecondary,
    marginLeft: greenTheme.spacing.m,
  },
  infoValue: {
    ...greenTheme.typography.body,
    fontWeight: 'bold',
    color: greenTheme.colors.text,
    marginLeft: 'auto',
  },
  divider: {
    height: 1,
    backgroundColor: greenTheme.colors.border,
    marginVertical: greenTheme.spacing.m,
  },
  descriptionText: {
    ...greenTheme.typography.caption,
    lineHeight: 20,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: greenTheme.spacing.m,
  },
  instructionText: {
    ...greenTheme.typography.body,
    color: greenTheme.colors.text,
    marginLeft: greenTheme.spacing.m,
    flex: 1,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: greenTheme.spacing.l,
    paddingTop: 10,
    backgroundColor: 'transparent',
  },
  actionButton: {
    backgroundColor: greenTheme.colors.primary,
    borderRadius: greenTheme.borderRadius.l,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    ...greenTheme.typography.body,
    fontWeight: 'bold',
    color: greenTheme.colors.white,
    fontSize: 18,
  },
});

export default TakeTestScreen;