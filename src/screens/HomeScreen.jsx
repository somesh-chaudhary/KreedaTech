import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useIsFocused } from '@react-navigation/native';

import { fetchWithFallback } from '../config/api';

// --- THEME & STYLES ---
const greenTheme = {
  colors: { primary: '#2E7D32', primaryLight: '#4CAF50', background: '#F4F6F9', card: '#FFFFFF', text: '#1D2C3B', textSecondary: '#6B7A8B', border: '#EAECEF', white: '#FFFFFF', statGreen: '#2E7D32', statBlue: '#2196F3', statRed: '#FF5722', statYellow: '#FFC107', statBgGreen: '#E8F5E9', statBgBlue: '#E3F2FD', statBgRed: '#FBE9E7', statBgYellow: '#FFFDE7', },
  spacing: { s: 8, m: 16, l: 24 },
  typography: { h1: { fontSize: 26, fontWeight: 'bold' }, h2: { fontSize: 20, fontWeight: 'bold' }, body: { fontSize: 16, fontWeight: '500' }, caption: { fontSize: 13, color: '#6B7A8B' }, },
  borderRadius: { m: 16, l: 24 },
  shadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 8, },
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: greenTheme.colors.background },
  scrollContent: { padding: greenTheme.spacing.m, paddingBottom: 150 },
  card: { backgroundColor: greenTheme.colors.card, borderRadius: greenTheme.borderRadius.m, ...greenTheme.shadow },
  header: { borderBottomLeftRadius: greenTheme.borderRadius.l, borderBottomRightRadius: greenTheme.borderRadius.l, marginBottom: greenTheme.spacing.m, ...greenTheme.shadow },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: greenTheme.spacing.l, },
  welcomeText: { ...greenTheme.typography.h1, color: greenTheme.colors.white },
  promptText: { ...greenTheme.typography.body, color: greenTheme.colors.white, opacity: 0.9, marginTop: 4 },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: greenTheme.colors.white, justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: greenTheme.colors.primary, fontWeight: 'bold', fontSize: 20 },
  xpCard: { padding: greenTheme.spacing.m, marginBottom: greenTheme.spacing.l },
  xpCardTitle: { ...greenTheme.typography.h2, color: greenTheme.colors.text },
  xpCardXP: { ...greenTheme.typography.body, color: greenTheme.colors.textSecondary, marginVertical: greenTheme.spacing.s / 2 },
  progressBarBackground: { height: 12, borderRadius: 6, backgroundColor: greenTheme.colors.border, overflow: 'hidden', marginVertical: greenTheme.spacing.s },
  progressBarFill: { height: '100%', backgroundColor: greenTheme.colors.primary, borderRadius: 6 },
  xpCardLevelUpText: { ...greenTheme.typography.caption, color: greenTheme.colors.textSecondary },
  sectionTitle: { ...greenTheme.typography.h2, color: greenTheme.colors.text, marginBottom: greenTheme.spacing.m, marginTop: greenTheme.spacing.s },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  statItem: { width: '48%', padding: greenTheme.spacing.m, alignItems: 'center', marginBottom: greenTheme.spacing.m, borderRadius: greenTheme.borderRadius.m, ...greenTheme.shadow },
  statValue: { ...greenTheme.typography.h2, fontSize: 24, marginTop: greenTheme.spacing.s },
  statLabel: { ...greenTheme.typography.caption, marginTop: 4, textAlign: 'center' },
  quickActionsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: greenTheme.spacing.l },
  quickActionButton: { flex: 1, marginHorizontal: greenTheme.spacing.s / 2, paddingVertical: greenTheme.spacing.m, alignItems: 'center' },
  quickActionButtonText: { ...greenTheme.typography.body, color: greenTheme.colors.text, fontWeight: 'bold', marginTop: greenTheme.spacing.s },
  testItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: greenTheme.spacing.m, marginBottom: greenTheme.spacing.s, },
  testTextContainer: { flex: 1 },
  testName: { ...greenTheme.typography.body, fontWeight: 'bold', color: greenTheme.colors.text },
  testScore: { ...greenTheme.typography.caption, color: greenTheme.colors.textSecondary, marginTop: 2 },
  bottomNav: { flexDirection: 'row', justifyContent: 'space-around', paddingVertical: greenTheme.spacing.s, position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: greenTheme.borderRadius.l, borderTopRightRadius: greenTheme.borderRadius.l, ...greenTheme.shadow, },
  navItem: { alignItems: 'center' },
  navText: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  leaderboardCard: { padding: greenTheme.spacing.l, borderRadius: greenTheme.borderRadius.m, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: greenTheme.spacing.l, },
  leaderboardTextContainer: { flex: 1 },
  leaderboardTitle: { ...greenTheme.typography.body, color: greenTheme.colors.white, opacity: 0.9, },
  leaderboardRank: { ...greenTheme.typography.h1, color: greenTheme.colors.white, fontSize: 36, },
  leaderboardCta: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255, 255, 255, 0.2)', paddingHorizontal: greenTheme.spacing.m, paddingVertical: greenTheme.spacing.s, borderRadius: 50, },
  leaderboardCtaText: { ...greenTheme.typography.body, fontWeight: 'bold', color: greenTheme.colors.white, marginRight: greenTheme.spacing.s, },
});

// --- REUSABLE COMPONENTS ---
const StatItem = ({ icon, value, label, color, bgColor }) => (
  <View style={[styles.statItem, { backgroundColor: bgColor }]}>
    <FeatherIcon name={icon} size={24} color={color} />
    <Text style={[styles.statValue, { color: greenTheme.colors.text }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const TestItem = ({ name, score }) => (
  <View style={[styles.card, styles.testItem]}>
    <FeatherIcon name="trending-up" size={20} color={greenTheme.colors.primary} style={{ marginRight: greenTheme.spacing.m }} />
    <View style={styles.testTextContainer}>
      <Text style={styles.testName}>{name}</Text>
      <Text style={styles.testScore}>Score: {score}%</Text>
    </View>
    <FeatherIcon name="chevron-right" size={20} color={greenTheme.colors.textSecondary} />
  </View>
);

const NavItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <FeatherIcon name={icon} size={24} color={active ? greenTheme.colors.primary : greenTheme.colors.textSecondary} />
    <Text style={[styles.navText, { color: active ? greenTheme.colors.primary : greenTheme.colors.textSecondary }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// --- MAIN SCREEN COMPONENT ---
const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  
  const [loading, setLoading] = useState(true);
  const [recentTests, setRecentTests] = useState([]);
  const [userStats, setUserStats] = useState({
    name: 'Anirudh Singh',
    totalTests: 12,
    hours: 45,
    rank: '#24',
    score: 847,
    totalXP: 2340,
    level: 8
  });

  useEffect(() => {
    let isMounted = true;
    const fetchHomeData = async () => {
      try {
        setLoading(true);
        const userId = 'usr_0001';

        // 1. Fetch Recent Tests API
        const recentRes = await fetchWithFallback(`/api/tests/recent/${userId}?limit=5`);
        const recentJson = await recentRes.json();

        // 2. Fetch User Analytics API
        const analyticsRes = await fetchWithFallback(`/api/analytics/${userId}`);
        const analyticsJson = await analyticsRes.json();

        if (isMounted) {
          if (recentJson.success && Array.isArray(recentJson.data)) {
            setRecentTests(recentJson.data);
          }
          if (analyticsJson.success && analyticsJson.stats) {
            setUserStats(prev => ({
              ...prev,
              name: analyticsJson.userProfile?.name || 'Anirudh Singh',
              totalTests: analyticsJson.stats.totalTests || prev.totalTests,
              score: analyticsJson.stats.bestScore || prev.score,
              totalXP: analyticsJson.stats.totalXP || prev.totalXP
            }));
          }
        }
      } catch (err) {
        console.log('Error fetching home data from API:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchHomeData();
    return () => { isMounted = false; };
  }, [isFocused]);

  const isScreenActive = (screenName) => {
    if (!isFocused) return false;
    try {
        const state = navigation.getState();
        const currentRoute = state.routes[state.index];
        return currentRoute.name === screenName;
    } catch(e) { return false; }
  };

  const getInitials = (name) => {
    if (!name) return 'AS';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={greenTheme.colors.primary} />
      
      <LinearGradient
        colors={[greenTheme.colors.primaryLight, greenTheme.colors.primary]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.header, { paddingTop: insets.top + greenTheme.spacing.m, paddingBottom: greenTheme.spacing.l }]}>
        <View style={styles.headerContent}>
          <View>
            <Text style={styles.welcomeText}>Welcome back, {userStats.name.split(' ')[0]}!</Text>
            <Text style={styles.promptText}>Ready to ace your next test? ✨</Text>
          </View>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getInitials(userStats.name)}</Text>
          </View>
        </View>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={[styles.card, styles.xpCard]}>
          <Text style={styles.xpCardTitle}>Level {userStats.level}</Text>
          <Text style={styles.xpCardXP}>{userStats.totalXP} / 3,000 XP</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${Math.min(100, Math.round((userStats.totalXP / 3000) * 100))}%` }]} />
          </View>
          <Text style={styles.xpCardLevelUpText}>{Math.max(0, 3000 - userStats.totalXP)} XP to Level {userStats.level + 1}</Text>
        </View>

        <Text style={styles.sectionTitle}>Your Performance</Text>
        <View style={styles.statsGrid}>
          <StatItem icon="compass" value={String(userStats.totalTests)} label="Tests" color={greenTheme.colors.statGreen} bgColor={greenTheme.colors.statBgGreen} />
          <StatItem icon="clock" value={String(userStats.hours)} label="Hours" color={greenTheme.colors.statBlue} bgColor={greenTheme.colors.statBgBlue} />
          <StatItem icon="award" value={userStats.rank} label="Rank" color={greenTheme.colors.statRed} bgColor={greenTheme.colors.statBgRed} />
          <StatItem icon="star" value={String(userStats.score)} label="Score" color={greenTheme.colors.statYellow} bgColor={greenTheme.colors.statBgYellow} />
        </View>

        <Text style={styles.sectionTitle}>Your Ranking</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Leaderboard')}>
          <LinearGradient
            colors={[greenTheme.colors.primary, '#225B24']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[styles.leaderboardCard, greenTheme.shadow]}>
              <View style={styles.leaderboardTextContainer}>
                <Text style={styles.leaderboardTitle}>Your Rank</Text>
                <Text style={styles.leaderboardRank}>{userStats.rank}</Text>
              </View>
              <View style={styles.leaderboardCta}>
                <Text style={styles.leaderboardCtaText}>View</Text>
                <FeatherIcon name="arrow-right-circle" size={22} color={greenTheme.colors.white} />
              </View>
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsContainer}>
          <TouchableOpacity 
            style={[styles.card, styles.quickActionButton]}
            onPress={() => navigation.navigate('TakeTest')}
          >
            <FeatherIcon name="edit-3" size={24} color={greenTheme.colors.primary} />
            <Text style={styles.quickActionButtonText}>Take a New Test</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.card, styles.quickActionButton]}
            onPress={() => navigation.navigate('Analytics')}
          >
            <FeatherIcon name="bar-chart-2" size={24} color={greenTheme.colors.primary} />
            <Text style={styles.quickActionButtonText}>View Analytics</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Recent Tests</Text>
        <View>
          {loading ? (
            <ActivityIndicator size="small" color={greenTheme.colors.primary} style={{ marginVertical: 10 }} />
          ) : recentTests.length > 0 ? (
            recentTests.map((t, idx) => (
              <TestItem
                key={t._id || idx}
                name={t.testType}
                score={String(t.percentageScore || parseFloat((t.score / 10).toFixed(1)))}
              />
            ))
          ) : (
            <>
              <TestItem name="Situps" score="92" />
              <TestItem name="Jumps" score="88" />
            </>
          )}
        </View>
      </ScrollView>

      <View style={[styles.card, styles.bottomNav, { paddingBottom: insets.bottom + greenTheme.spacing.s }]}>
        <NavItem
          icon="home"
          label="Home"
          active={isScreenActive('Home') || isScreenActive('HomeScreen')}
          onPress={() => navigation.navigate('Home')}
        />
        <NavItem
          icon="list"
          label="Tests"
          active={isScreenActive('Test')}
          onPress={() => navigation.navigate('Test')}
        />
        <NavItem
          icon="bar-chart-2"
          label="Leaderboard"
          active={isScreenActive('Leaderboard') || isScreenActive('LeaderboardScreen')}
          onPress={() => navigation.navigate('Leaderboard')}
        />
        <NavItem
          icon="user"
          label="Profile"
          active={isScreenActive('ProfilePage') || isScreenActive('ProfilePageScreen')}
          onPress={() => navigation.navigate('ProfilePage')}
        />
      </View>
    </View>
  );
};

export default HomeScreen;