import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome5';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // Import useSafeAreaInsets

// --- THEME & STYLES ---
const appTheme = {
    // ... (Your theme object is unchanged)
    colors: { primary: '#1D821F', primaryLight: '#4CAF50', background: '#F8F9FB', card: '#FFFFFF', text: '#1C1C1C', textSecondary: '#6B7A8B', border: '#EAECEF', white: '#FFFFFF', statGreen: '#2E7D32', statBlue: '#2196F3', statRed: '#FF5722', statYellow: '#FFC107', statBgGreen: '#E8F5E9', statBgBlue: '#E3F2FD', statBgRed: '#FBE9E7', statBgYellow: '#FFFDE7', accent: '#FFC107', featuredGradient1: '#4CAF50', featuredGradient2: '#2E7D32', },
    spacing: { s: 8, m: 16, l: 24 },
    typography: { h1: { fontSize: 26, fontWeight: 'bold' }, h2: { fontSize: 20, fontWeight: 'bold' }, body: { fontSize: 16, fontWeight: '500' }, caption: { fontSize: 13, color: '#6B7A8B' }, },
    borderRadius: { m: 16, l: 24, l_s: 30 },
    shadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 8, },
};

const NavItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <FeatherIcon name={icon} size={24} color={active ? appTheme.colors.primary : appTheme.colors.textSecondary} />
    <Text style={[styles.navText, { color: active ? appTheme.colors.primary : appTheme.colors.textSecondary }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const TestScreen = () => { // Removed navigation prop as useNavigation is used
  const isFocused = useIsFocused();
  const nav = useNavigation();
  const insets = useSafeAreaInsets(); // Get safe area insets

  const handleStartTest = (testName) => {
    // Navigate to the instructions screen, passing the test name
    nav.navigate('TakeTest', { testName: testName });
  };

  const isScreenActive = (screenName) => {
    if (!isFocused) return false;
    try {
        const state = nav.getState();
        const currentRoute = state.routes[state.index];
        return currentRoute.name === screenName;
    } catch(e) { return false; }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={appTheme.colors.background} />

      {/* --- HEADER --- */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <FeatherIcon name="arrow-left" size={24} color={appTheme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Select Test</Text>
          <Text style={styles.headerSubtitle}>Choose a test to assess your skills</Text>
        </View>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Featured Test Card */}
        <LinearGradient
          colors={[appTheme.colors.featuredGradient1, appTheme.colors.featuredGradient2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.featuredCard, appTheme.shadow]}
        >
          {/* ... (content of featured card) ... */}
          <View style={styles.featuredHeader}>
            <Text style={styles.featuredBadge}>Featured</Text>
            <View style={styles.participantsContainer}><Icon name="users" size={16} color={appTheme.colors.white} /><Text style={styles.participantsText}>3,247 participants</Text></View>
          </View>
          <Text style={styles.featuredTitle}>Complete Athletic Assessment</Text>
          <Text style={styles.featuredDescription}>Full evaluation across all athletic dimensions</Text>
          <View style={styles.featuredDetails}>
            <View style={styles.detailItem}><FeatherIcon name="clock" size={16} color={appTheme.colors.white} /><Text style={styles.detailText}>25 min</Text></View>
            <Text style={[styles.difficultyBadge, { color: appTheme.colors.featuredGradient2 }]}>Intermediate</Text>
          </View>
          {/* CORRECTED: Added onPress handler */}
          <TouchableOpacity style={styles.featuredButton} onPress={() => handleStartTest('Complete Athletic Assessment')}>
            <Text style={styles.featuredButtonText}>Start Assessment</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Speed & Agility Section */}
        <Text style={styles.sectionTitle}>Speed & Agility</Text>
        <View style={styles.testList}>
          {/* Test Card 1 */}
          <View style={[styles.testCard, { backgroundColor: appTheme.colors.statBgGreen }]}>
            <View style={styles.testCardContent}>
              <View>
                <Text style={styles.testCardTitle}>40-Yard Dash</Text>
                <Text style={styles.testCardDescription}>Test your straight-line speed</Text>
              </View>
              <View style={styles.testCardDetails}>
                <View style={styles.testDetailItem}><FeatherIcon name="clock" size={16} color={appTheme.colors.statGreen} /><Text style={[styles.testDetailText, { color: appTheme.colors.statGreen }]}>2 min</Text></View>
                <View style={styles.testDetailItem}><Icon name="users" size={16} color={appTheme.colors.statGreen} /><Text style={[styles.testDetailText, { color: appTheme.colors.statGreen }]}>1,249</Text></View>
                <Text style={[styles.difficultyBadge, { color: appTheme.colors.statGreen }]}>Beginner</Text>
              </View>
              {/* CORRECTED: Added onPress handler */}
              <TouchableOpacity style={[styles.testButton, { backgroundColor: appTheme.colors.statGreen }]} onPress={() => handleStartTest('40-Yard Dash')}>
                <Text style={styles.testButtonText}>Start Test</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Test Card 2 */}
          <View style={[styles.testCard, { backgroundColor: appTheme.colors.statBgYellow }]}>
            <View style={styles.testCardContent}>
              <View>
                <Text style={styles.testCardTitle}>Cone Drill</Text>
                <Text style={styles.testCardDescription}>Measure agility and quick direction changes</Text>
              </View>
              <View style={styles.testCardDetails}>
                <View style={styles.testDetailItem}><FeatherIcon name="clock" size={16} color={appTheme.colors.statYellow} /><Text style={[styles.testDetailText, { color: appTheme.colors.statYellow }]}>3 min</Text></View>
                <View style={styles.testDetailItem}><Icon name="users" size={16} color={appTheme.colors.statYellow} /><Text style={[styles.testDetailText, { color: appTheme.colors.statYellow }]}>892</Text></View>
                <Text style={[styles.difficultyBadge, { color: appTheme.colors.statYellow }]}>Intermediate</Text>
              </View>
              {/* CORRECTED: Added onPress handler */}
              <TouchableOpacity style={[styles.testButton, { backgroundColor: appTheme.colors.statYellow }]} onPress={() => handleStartTest('Cone Drill')}>
                <Text style={styles.testButtonText}>Start Test</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* --- BOTTOM NAVIGATION (CORRECTED) --- */}
      <View style={[styles.bottomNav, { paddingBottom: insets.bottom > 0 ? insets.bottom : appTheme.spacing.s }]}>
        <NavItem
          icon="home"
          label="Dashboard"
          active={isScreenActive('Home') || isScreenActive('HomeScreen')}
          onPress={() => nav.navigate('Home')}
        />
        <NavItem
          icon="list"
          label="Tests"
          active={isScreenActive('Test') || isScreenActive('TestScreen')}
          onPress={() => nav.navigate('Test')}
        />
        <NavItem
          icon="bar-chart-2"
          label="Leaderboard"
          active={isScreenActive('Leaderboard') || isScreenActive('LeaderboardScreen')}
          onPress={() => nav.navigate('Leaderboard')}
        />
        <NavItem
          icon="user"
          label="Profile"
          active={isScreenActive('ProfilePage') || isScreenActive('ProfilePageScreen')}
          onPress={() => nav.navigate('ProfilePage')}
        />
      </View>
    </View>
  );
};

// --- STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: appTheme.colors.background },
  scrollContent: { paddingHorizontal: appTheme.spacing.m, paddingBottom: 100 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: appTheme.spacing.m,
    paddingBottom: appTheme.spacing.s,
    backgroundColor: appTheme.colors.background,
  },
  headerTextContainer: { marginLeft: appTheme.spacing.m },
  headerTitle: { ...appTheme.typography.h2, color: appTheme.colors.text },
  headerSubtitle: { fontSize: 14, color: appTheme.colors.textSecondary },
  featuredCard: {
    borderRadius: appTheme.borderRadius.m,
    padding: appTheme.spacing.l,
    marginBottom: appTheme.spacing.m,
    marginTop: appTheme.spacing.m,
  },
  featuredHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: appTheme.spacing.s },
  featuredBadge: { backgroundColor: appTheme.colors.white, color: appTheme.colors.primary, borderRadius: appTheme.borderRadius.l_s, paddingHorizontal: appTheme.spacing.s, paddingVertical: appTheme.spacing.s / 2, fontWeight: 'bold', fontSize: 12 },
  participantsContainer: { flexDirection: 'row', alignItems: 'center' },
  participantsText: { color: appTheme.colors.white, marginLeft: appTheme.spacing.s / 2, fontSize: 12 },
  featuredTitle: { fontSize: 18, fontWeight: '600', color: appTheme.colors.white, marginBottom: 5 },
  featuredDescription: { fontSize: 14, color: appTheme.colors.white, marginBottom: appTheme.spacing.m },
  featuredDetails: { flexDirection: 'row', alignItems: 'center', marginBottom: appTheme.spacing.m },
  detailItem: { flexDirection: 'row', alignItems: 'center', marginRight: appTheme.spacing.m },
  detailText: { color: appTheme.colors.white, marginLeft: appTheme.spacing.s / 2, fontSize: 12 },
  difficultyBadge: { backgroundColor: appTheme.colors.white, borderRadius: appTheme.borderRadius.l_s, paddingHorizontal: appTheme.spacing.s, paddingVertical: appTheme.spacing.s / 2, fontWeight: 'bold', fontSize: 12 },
  featuredButton: { backgroundColor: appTheme.colors.white, borderRadius: appTheme.borderRadius.l, paddingVertical: appTheme.spacing.m, alignItems: 'center' },
  featuredButtonText: { fontSize: 14, fontWeight: '600', color: appTheme.colors.featuredGradient2 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: appTheme.colors.text, marginBottom: appTheme.spacing.s, marginTop: appTheme.spacing.l },
  testList: { marginBottom: appTheme.spacing.m },
  testCard: { borderRadius: appTheme.borderRadius.m, marginBottom: appTheme.spacing.s, padding: appTheme.spacing.m, ...appTheme.shadow,},
  testCardContent: { padding: appTheme.spacing.s },
  testCardTitle: { fontSize: 16, fontWeight: '600', color: appTheme.colors.text, marginBottom: appTheme.spacing.s / 2 },
  testCardDescription: { fontSize: 12, color: appTheme.colors.textSecondary, marginBottom: appTheme.spacing.s },
  testCardDetails: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', marginTop: appTheme.spacing.m },
  testDetailItem: { flexDirection: 'row', alignItems: 'center', marginRight: appTheme.spacing.s, marginBottom: appTheme.spacing.s / 2 },
  testDetailText: { marginLeft: appTheme.spacing.s / 2, fontSize: 12, fontWeight: '500' },
  testButton: { borderRadius: appTheme.borderRadius.l, paddingVertical: appTheme.spacing.s, alignItems: 'center', marginTop: appTheme.spacing.s },
  testButtonText: { fontSize: 14, fontWeight: '600', color: appTheme.colors.white },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: appTheme.colors.card,
    borderTopWidth: 1,
    borderTopColor: appTheme.colors.border,
    paddingVertical: appTheme.spacing.s,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    ...appTheme.shadow,
  },
  navItem: { alignItems: 'center', flex: 1, paddingVertical: appTheme.spacing.s },
  navText: { fontSize: 12, fontWeight: '500', marginTop: appTheme.spacing.s / 2 },
});

export default TestScreen;