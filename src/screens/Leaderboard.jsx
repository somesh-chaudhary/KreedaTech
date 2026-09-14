import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, ActivityIndicator } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import FeatherIcon from 'react-native-vector-icons/Feather';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const API_BASE_URL = 'http://127.0.0.1:5000';

// --- THEME & STYLES ---
const greenTheme = {
    colors: { primary: '#2E7D32', primaryLight: '#4CAF50', background: '#F4F6F9', card: '#FFFFFF', text: '#1D2C3B', textSecondary: '#6B7A8B', border: '#EAECEF', white: '#FFFFFF', statGreen: '#2E7D32', statBlue: '#2196F3', statRed: '#FF5722', statYellow: '#FFC107', statBgGreen: '#E8F5E9', statBgBlue: '#E3F2FD', statBgRed: '#FBE9E7', statBgYellow: '#FFFDE7', accent: '#FFC107' },
    spacing: { s: 8, m: 16, l: 24 },
    typography: { h1: { fontSize: 26, fontWeight: 'bold' }, h2: { fontSize: 20, fontWeight: 'bold' }, body: { fontSize: 16, fontWeight: '500' }, caption: { fontSize: 13, color: '#6B7A8B' },},
    borderRadius: { m: 16, l: 24 },
    shadow: { shadowColor: '#000', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.08, shadowRadius: 10, elevation: 8, },
};

// --- REUSABLE COMPONENTS ---
const NavItem = ({ icon, label, active, onPress }) => (
  <TouchableOpacity style={styles.navItem} onPress={onPress}>
    <FeatherIcon name={icon} size={24} color={active ? greenTheme.colors.primary : greenTheme.colors.textSecondary} />
    <Text style={[styles.navText, { color: active ? greenTheme.colors.primary : greenTheme.colors.textSecondary }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const LeaderboardScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  
  const [activeView, setActiveView] = useState('National');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);
  const [athletes, setAthletes] = useState([]);
  const [userRankInfo, setUserRankInfo] = useState({
    rank: '#7',
    score: 847,
    bestTime: '4.8s',
    percentile: '85%'
  });

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const res = await fetchWithFallback(`/api/leaderboard?view=${activeView}&limit=20`);
      const json = await res.json();

      if (json.success && Array.isArray(json.data)) {
        setAthletes(json.data);
        
        // Find current user's rank in list if present
        const userIdx = json.data.findIndex(a => a.name === 'Anirudh Singh' || a.userId === 'usr_0001');
        if (userIdx !== -1) {
          const u = json.data[userIdx];
          setUserRankInfo({
            rank: `#${u.rank}`,
            score: u.score,
            bestTime: u.bestPerformance || '4.8s',
            percentile: `${u.percentageScore || 85}%`
          });
        }
      } else {
        setErrorMessage(json.error || 'Unable to load leaderboard data.');
      }
    } catch (err) {
      console.log('Error fetching leaderboard API:', err.message);
      setErrorMessage('Network error: Unable to connect to server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [activeView, isFocused]);

  const isNationalView = activeView === 'National';
  const listTitle = isNationalView ? 'Top National Athletes' : 'Top Local Athletes';

  const isScreenActive = (screenName) => {
    if (!isFocused) return false;
    try { 
        const state = navigation.getState(); 
        return state.routes[state.index].name === screenName; 
    } catch(e) { 
        return false; 
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={greenTheme.colors.background} />
      
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()}><FeatherIcon name="arrow-left" size={24} color={greenTheme.colors.text} /></TouchableOpacity>
        <View style={styles.headerTextContainer}><Text style={styles.headerTitle}>Leaderboard</Text><Text style={styles.headerSubtitle}>Athletic Performance Rankings</Text></View>
        <FeatherIcon name="award" size={30} color={greenTheme.colors.accent} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Your Ranking Card */}
        <LinearGradient colors={[greenTheme.colors.primaryLight, greenTheme.colors.primary]} style={styles.rankingCard}>
          <Text style={styles.rankingTitle}>Your Ranking</Text>
          <View style={styles.rankingDetails}>
            <Text style={styles.rankingNumber}>{userRankInfo.rank}</Text>
            <Text style={styles.rankingGlobal}>{isNationalView ? 'National' : 'Local'}</Text>
          </View>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}><Text style={styles.statValue}>{userRankInfo.score}</Text><Text style={styles.statLabel}>Score</Text></View>
            <View style={styles.statItem}><Text style={styles.statValue}>{userRankInfo.bestTime}</Text><Text style={styles.statLabel}>Best Time</Text></View>
            <View style={styles.statItem}><Text style={styles.statValue}>{userRankInfo.percentile}</Text><Text style={styles.statLabel}>Percentile</Text></View>
          </View>
        </LinearGradient>
        
        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tabItem, isNationalView && styles.activeTab]}
            onPress={() => setActiveView('National')}
          >
            <FeatherIcon name="globe" size={20} color={isNationalView ? greenTheme.colors.white : greenTheme.colors.textSecondary} />
            <Text style={[styles.tabText, { color: isNationalView ? greenTheme.colors.white : greenTheme.colors.textSecondary }]}>National</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.tabItem, !isNationalView && styles.activeTab]}
            onPress={() => setActiveView('Local')}
          >
            <FeatherIcon name="users" size={20} color={!isNationalView ? greenTheme.colors.white : greenTheme.colors.textSecondary} />
            <Text style={[styles.tabText, { color: !isNationalView ? greenTheme.colors.white : greenTheme.colors.textSecondary }]}>Local</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.topAthletesHeader}>
          <Text style={styles.sectionTitle}>{listTitle}</Text>
          <TouchableOpacity><Text style={styles.liveRankingsText}>Live Rankings</Text></TouchableOpacity>
        </View>

        {loading ? (
          <View style={{ paddingVertical: 40, alignItems: 'center' }}>
            <ActivityIndicator size="large" color={greenTheme.colors.primary} />
            <Text style={{ ...greenTheme.typography.caption, marginTop: 10 }}>Loading leaderboard rankings...</Text>
          </View>
        ) : errorMessage ? (
          <View style={[styles.card, { padding: greenTheme.spacing.l, alignItems: 'center', marginVertical: greenTheme.spacing.m }]}>
            <FeatherIcon name="alert-triangle" size={32} color={greenTheme.colors.statRed} />
            <Text style={{ ...greenTheme.typography.body, color: greenTheme.colors.text, marginTop: 8, textAlign: 'center' }}>{errorMessage}</Text>
            <TouchableOpacity 
              style={{ marginTop: 16, backgroundColor: greenTheme.colors.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 }}
              onPress={fetchLeaderboard}
            >
              <Text style={{ color: greenTheme.colors.white, fontWeight: 'bold' }}>Tap to Retry</Text>
            </TouchableOpacity>
          </View>
        ) : athletes.length > 0 ? (
          athletes.map((athlete, index) => {
            const isCurrentUser = athlete.name === 'Anirudh Singh' || athlete.userId === 'usr_0001';
            const changeStr = athlete.change || '+5';
            const isPos = changeStr.startsWith('+');

            return (
              <View key={athlete.userId || index} style={[styles.athleteItem, isCurrentUser && styles.userAthleteItem]}>
                <View style={styles.athleteInfo}>
                  <View style={[styles.athleteAvatar, { backgroundColor: isCurrentUser ? greenTheme.colors.primary : greenTheme.colors.border }]}>
                    <Text style={[styles.athleteRankText, { color: isCurrentUser ? greenTheme.colors.white : greenTheme.colors.text }]}>{athlete.rank}</Text>
                  </View>
                  <View>
                    <Text style={styles.athleteName}>{athlete.name}</Text>
                    <Text style={styles.athleteLocation}>{athlete.location}</Text>
                  </View>
                </View>
                <View style={styles.athleteStats}>
                  <Text style={styles.athleteScore}>{athlete.score}</Text>
                  <View style={[styles.athleteScoreChange, { backgroundColor: isPos ? greenTheme.colors.statBgGreen : greenTheme.colors.statBgRed }]}>
                    <FeatherIcon name={isPos ? "trending-up" : "trending-down"} size={16} color={isPos ? greenTheme.colors.statGreen : greenTheme.colors.statRed} />
                    <Text style={[styles.scoreChangeText, { color: isPos ? greenTheme.colors.statGreen : greenTheme.colors.statRed }]}>{changeStr}</Text>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={[styles.card, { padding: greenTheme.spacing.l, alignItems: 'center', marginVertical: greenTheme.spacing.m }]}>
            <FeatherIcon name="award" size={32} color={greenTheme.colors.textSecondary} />
            <Text style={{ ...greenTheme.typography.body, color: greenTheme.colors.textSecondary, marginTop: 8, textAlign: 'center' }}>
              No test results available yet.
            </Text>
          </View>
        )}
      </ScrollView>
      
      <View style={[styles.card, styles.bottomNav, { paddingBottom: insets.bottom > 0 ? insets.bottom : greenTheme.spacing.m }]}>
        <NavItem icon="home" label="Home" active={isScreenActive('Home') || isScreenActive('HomeScreen')} onPress={() => navigation.navigate('Home')} />
        <NavItem icon="list" label="Tests" active={isScreenActive('Test') || isScreenActive('TestScreen')} onPress={() => navigation.navigate('Test')} />
        <NavItem icon="bar-chart-2" label="Leaderboard" active={true} onPress={() => {}} />
        <NavItem icon="user" label="Profile" active={isScreenActive('ProfilePage') || isScreenActive('ProfileScreen')} onPress={() => navigation.navigate('ProfilePage')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: greenTheme.colors.background },
    header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: greenTheme.spacing.m, paddingBottom: greenTheme.spacing.s, backgroundColor: greenTheme.colors.background, },
    headerTextContainer: { flex: 1, marginLeft: greenTheme.spacing.m },
    headerTitle: { ...greenTheme.typography.h1 },
    headerSubtitle: { ...greenTheme.typography.body, color: greenTheme.colors.textSecondary },
    scrollContent: { paddingHorizontal: greenTheme.spacing.m, paddingBottom: 100 },
    rankingCard: { borderRadius: greenTheme.borderRadius.m, padding: greenTheme.spacing.l, marginBottom: greenTheme.spacing.l, ...greenTheme.shadow },
    rankingTitle: { ...greenTheme.typography.h2, color: greenTheme.colors.white },
    rankingDetails: { flexDirection: 'row', alignItems: 'baseline', marginTop: greenTheme.spacing.m },
    rankingNumber: { ...greenTheme.typography.h1, fontSize: 48, color: greenTheme.colors.white },
    rankingGlobal: { ...greenTheme.typography.h2, color: greenTheme.colors.white, opacity: 0.7, marginLeft: greenTheme.spacing.s },
    statsContainer: { flexDirection: 'row', justifyContent: 'space-around', marginTop: greenTheme.spacing.l },
    statItem: { alignItems: 'center' },
    statValue: { ...greenTheme.typography.h2, color: greenTheme.colors.white, fontSize: 24 },
    statLabel: { ...greenTheme.typography.caption, color: greenTheme.colors.white, opacity: 0.8, marginTop: 4 },
    tabsContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: greenTheme.spacing.l },
    tabItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: greenTheme.spacing.l, paddingVertical: greenTheme.spacing.s, borderRadius: 50, marginHorizontal: greenTheme.spacing.s / 2, backgroundColor: greenTheme.colors.card, ...greenTheme.shadow},
    activeTab: { backgroundColor: greenTheme.colors.primary },
    tabText: { ...greenTheme.typography.body, fontWeight: 'bold', marginLeft: greenTheme.spacing.s },
    topAthletesHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: greenTheme.spacing.m },
    sectionTitle: { ...greenTheme.typography.h2, color: greenTheme.colors.text },
    liveRankingsText: { ...greenTheme.typography.caption, color: greenTheme.colors.primary, fontWeight: 'bold' },
    athleteItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: greenTheme.colors.card, borderRadius: greenTheme.borderRadius.m, padding: greenTheme.spacing.m, marginBottom: greenTheme.spacing.s },
    userAthleteItem: { borderWidth: 2, borderColor: greenTheme.colors.primary },
    athleteInfo: { flexDirection: 'row', alignItems: 'center' },
    athleteAvatar: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginRight: greenTheme.spacing.m },
    athleteRankText: { ...greenTheme.typography.body, fontWeight: 'bold' },
    athleteName: { ...greenTheme.typography.body, fontWeight: 'bold', color: greenTheme.colors.text },
    athleteLocation: { ...greenTheme.typography.caption, color: greenTheme.colors.textSecondary },
    athleteStats: { flexDirection: 'row', alignItems: 'center' },
    athleteScore: { ...greenTheme.typography.h2, color: greenTheme.colors.text, fontSize: 18, marginRight: greenTheme.spacing.s },
    athleteScoreChange: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: greenTheme.spacing.s, paddingVertical: greenTheme.spacing.s / 2, borderRadius: greenTheme.borderRadius.m },
    scoreChangeText: { ...greenTheme.typography.caption, fontWeight: 'bold', marginLeft: greenTheme.spacing.s / 2 },
    bottomNav: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center', paddingVertical: greenTheme.spacing.s, position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: greenTheme.colors.card, borderTopLeftRadius: greenTheme.borderRadius.l, borderTopRightRadius: greenTheme.borderRadius.l, ...greenTheme.shadow },
    navItem: { alignItems: 'center', flex: 1, paddingVertical: greenTheme.spacing.s },
    navText: { fontSize: 12, color: greenTheme.colors.textSecondary, marginTop: 4, fontWeight: '500' },
});

export default LeaderboardScreen;