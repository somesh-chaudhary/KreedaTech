import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fetchWithFallback } from '../config/api';

const API_BASE_URL = 'http://127.0.0.1:5000';

// --- THEME & STYLES ---
const greenTheme = {
    colors: { primary: '#2E7D32', primaryLight: '#4CAF50', background: '#F4F6F9', card: '#FFFFFF', text: '#1D2C3B', textSecondary: '#6B7A8B', border: '#EAECEF', white: '#FFFFFF' },
    spacing: { s: 8, m: 16, l: 24 },
    typography: { h1: { fontSize: 26, fontWeight: 'bold' }, h2: { fontSize: 20, fontWeight: 'bold' }, body: { fontSize: 16, fontWeight: '500' }, caption: { fontSize: 13, color: '#6B7A8B' } },
    borderRadius: { m: 16, l: 24 },
    shadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 8, },
};

const NavItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <FeatherIcon name={icon} size={24} color={active ? greenTheme.colors.primary : greenTheme.colors.textSecondary} />
    <Text style={[styles.navText, { color: active ? greenTheme.colors.primary : greenTheme.colors.textSecondary }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const ProfilePageScreen = () => {
  const nav = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();

  const [profileData, setProfileData] = useState({
    name: 'Anirudh Singh',
    email: 'athlete001@demo.kreedatech.local',
    location: 'Bengaluru, Karnataka',
    totalXP: 2340,
    testsCount: 12,
    score: 847,
    rank: '#24'
  });

  useEffect(() => {
    let isMounted = true;
    const fetchProfileData = async () => {
      try {
        const userId = 'usr_0001';
        const res = await fetchWithFallback(`/api/analytics/${userId}`);
        const json = await res.json();

        if (isMounted && json.success) {
          const p = json.userProfile;
          if (p) {
            const loc = p.city ? `${p.city}, ${p.state || ''}` : 'Kanpur, UP';
            setProfileData(prev => ({
              ...prev,
              name: p.name || prev.name,
              email: p.email || prev.email,
              location: loc,
              testsCount: json.stats?.totalTests || prev.testsCount,
              score: json.stats?.bestScore || prev.score,
              totalXP: json.stats?.totalXP || prev.totalXP
            }));
          }
        }
      } catch (err) {
        console.log('Error fetching profile data from API:', err.message);
      }
    };

    fetchProfileData();
    return () => { isMounted = false; };
  }, [isFocused]);

  const isScreenActive = (screenName) => {
    if (!isFocused) return false;
    try {
        const state = nav.getState();
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
      <StatusBar barStyle="dark-content" backgroundColor={greenTheme.colors.background} />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => nav.goBack()}>
          <FeatherIcon name="arrow-left" size={24} color={greenTheme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.headerTitle}>Profile</Text>
          <Text style={styles.headerSubtitle}>Manage your account and preferences</Text>
        </View>
        <TouchableOpacity>
            <FeatherIcon name="edit-2" size={24} color={greenTheme.colors.text} />
        </TouchableOpacity>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card */}
        <View style={[styles.profileCard, greenTheme.shadow]}>
          <View style={styles.profileInfo}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{getInitials(profileData.name)}</Text></View>
            <View style={styles.profileText}>
              <Text style={styles.profileName}>{profileData.name}</Text>
              <Text style={styles.profileEmail}>{profileData.email}</Text>
              <Text style={styles.profileJoined}>Joined March 2024</Text>
            </View>
            <TouchableOpacity style={styles.editButton}><Text style={styles.editButtonText}>Edit</Text></TouchableOpacity>
          </View>
          <View style={styles.xpSection}>
            <View style={styles.xpHeader}><Text style={styles.xpLevel}>Level 8</Text><Text style={styles.xpProgress}>{profileData.totalXP} / 3000 XP</Text></View>
            <View style={styles.progressBarBackground}><View style={[styles.progressBarFill, { width: `${Math.min(100, Math.round((profileData.totalXP / 3000) * 100))}%` }]} /></View>
            <Text style={styles.levelUpText}>{Math.max(0, 3000 - profileData.totalXP)} XP to Level 9</Text>
          </View>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}><Text style={styles.statValue}>{profileData.testsCount}</Text><Text style={styles.statLabel}>Tests</Text></View>
            <View style={styles.statItem}><Text style={styles.statValue}>{profileData.score}</Text><Text style={styles.statLabel}>Score</Text></View>
            <View style={styles.statItem}><Text style={styles.statValue}>{profileData.rank}</Text><Text style={styles.statLabel}>Rank</Text></View>
            <View style={styles.statItem}><Text style={styles.statValue}>12</Text><Text style={styles.statLabel}>Badges</Text></View>
          </View>
        </View>

        {/* Personal Information Section */}
        <View style={[styles.infoCard, greenTheme.shadow]}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Location</Text><Text style={styles.infoValue}>{profileData.location}</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Age</Text><Text style={styles.infoValue}>21 years</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Height</Text><Text style={styles.infoValue}>5'10"</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Weight</Text><Text style={styles.infoValue}>165 lbs</Text></View>
          <View style={styles.infoRow}><Text style={styles.infoLabel}>Primary Sport</Text><Text style={styles.infoValue}>Running</Text></View>
        </View>

        {/* Achievements Section */}
        <View style={[styles.infoCard, greenTheme.shadow]}>
          <View style={styles.achievementsHeader}><Text style={styles.sectionTitle}>Achievements</Text><Text style={styles.achievementCount}>0/6</Text></View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, greenTheme.shadow, { paddingBottom: insets.bottom > 0 ? insets.bottom : greenTheme.spacing.m }]}>
        <NavItem icon="home" label="Home" active={isScreenActive('Home') || isScreenActive('HomeScreen')} onPress={() => nav.navigate('Home')} />
        <NavItem icon="list" label="Tests" active={isScreenActive('Test') || isScreenActive('TestScreen')} onPress={() => nav.navigate('Test')} />
        <NavItem icon="bar-chart-2" label="Leaderboard" active={isScreenActive('Leaderboard') || isScreenActive('LeaderboardScreen')} onPress={() => nav.navigate('Leaderboard')} />
        <NavItem icon="user" label="Profile" active={true} onPress={() => {}} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: greenTheme.colors.background, },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: greenTheme.spacing.m, paddingBottom: greenTheme.spacing.m, backgroundColor: greenTheme.colors.background },
    headerTextContainer: { flex: 1, marginLeft: greenTheme.spacing.m },
    headerTitle: { ...greenTheme.typography.h1 },
    headerSubtitle: { ...greenTheme.typography.body, color: greenTheme.colors.textSecondary, fontSize: 14 },
    scrollContent: { paddingHorizontal: greenTheme.spacing.m, paddingBottom: 100 },
    profileCard: { backgroundColor: greenTheme.colors.card, borderRadius: greenTheme.borderRadius.m, padding: greenTheme.spacing.m, marginBottom: greenTheme.spacing.m },
    profileInfo: { flexDirection: 'row', alignItems: 'center', marginBottom: greenTheme.spacing.l },
    avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: greenTheme.colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: greenTheme.spacing.m, },
    avatarText: { color: greenTheme.colors.white, fontWeight: 'bold', fontSize: 24 },
    profileText: { flex: 1 },
    profileName: { ...greenTheme.typography.h2 },
    profileEmail: { ...greenTheme.typography.caption },
    profileJoined: { ...greenTheme.typography.caption, marginTop: 4 },
    editButton: { backgroundColor: greenTheme.colors.border, borderRadius: 20, paddingHorizontal: greenTheme.spacing.m, paddingVertical: greenTheme.spacing.s, },
    editButtonText: { ...greenTheme.typography.caption, fontWeight: 'bold' },
    xpSection: { marginBottom: greenTheme.spacing.m },
    xpHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: greenTheme.spacing.s },
    xpLevel: { ...greenTheme.typography.body, fontWeight: 'bold' },
    xpProgress: { ...greenTheme.typography.caption },
    progressBarBackground: { height: 8, borderRadius: 4, backgroundColor: greenTheme.colors.border, overflow: 'hidden' },
    progressBarFill: { height: '100%', backgroundColor: greenTheme.colors.primary, borderRadius: 4 },
    levelUpText: { ...greenTheme.typography.caption, marginTop: greenTheme.spacing.s, textAlign: 'right' },
    statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginTop: greenTheme.spacing.l },
    statItem: { alignItems: 'center' },
    statValue: { ...greenTheme.typography.h2, fontSize: 22 },
    statLabel: { ...greenTheme.typography.caption, color: greenTheme.colors.textSecondary, marginTop: 4 },
    infoCard: { backgroundColor: greenTheme.colors.card, borderRadius: greenTheme.borderRadius.m, padding: greenTheme.spacing.l, marginBottom: greenTheme.spacing.m },
    sectionTitle: { ...greenTheme.typography.h2, marginBottom: greenTheme.spacing.m },
    infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: greenTheme.spacing.s, borderBottomWidth: 1, borderBottomColor: greenTheme.colors.border },
    infoLabel: { ...greenTheme.typography.body, color: greenTheme.colors.textSecondary },
    infoValue: { ...greenTheme.typography.body, fontWeight: 'bold' },
    achievementsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    achievementCount: { ...greenTheme.typography.body, color: greenTheme.colors.textSecondary },
    bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', backgroundColor: greenTheme.colors.card, borderTopWidth: 1, borderTopColor: greenTheme.colors.border, paddingVertical: greenTheme.spacing.s, position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: greenTheme.borderRadius.l, borderTopRightRadius: greenTheme.borderRadius.l },
    navItem: { alignItems: 'center', flex: 1, paddingVertical: greenTheme.spacing.s },
    navText: { fontSize: 12, fontWeight: '500', marginTop: greenTheme.spacing.s, },
});

export default ProfilePageScreen;