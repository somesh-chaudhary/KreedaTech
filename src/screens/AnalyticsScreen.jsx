import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, StatusBar, Image, ActivityIndicator } from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FeatherIcon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import { LineChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

import { fetchWithFallback } from '../config/api';

// --- USING THE SAME THEME AS HOMESCREEN ---
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
    h2: { fontSize: 18, fontWeight: '600' },
    body: { fontSize: 16, fontWeight: '500' },
    caption: { fontSize: 12 },
  },
  borderRadius: { m: 16, l: 20 },
  shadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
};

// --- Reusable NavItem Component ---
const NavItem = ({ icon, label, active, onPress }) => (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <FeatherIcon name={icon} size={24} color={active ? greenTheme.colors.primary : greenTheme.colors.textSecondary} />
      <Text style={[styles.navText, { color: active ? greenTheme.colors.primary : greenTheme.colors.textSecondary }]}>
        {label}
      </Text>
    </TouchableOpacity>
);

const AnalyticsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();

  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('Anirudh Singh');
  const [stats, setStats] = useState({
    trainingHours: '12h',
    performance: '87%',
    totalXP: '2,340'
  });
  const [chartData, setChartData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    datasets: [
      {
        data: [40, 52, 65, 62, 98],
        color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  });
  const [insights, setInsights] = useState([
    'Strong endurance this week',
    'Work on sprinting speed',
    '15% improvement over last week'
  ]);

  useEffect(() => {
    let isMounted = true;
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const userId = 'usr_0001';
        const res = await fetchWithFallback(`/api/analytics/${userId}`);
        const json = await res.json();

        if (isMounted && json.success) {
          if (json.userProfile?.name) {
            setUserName(json.userProfile.name);
          }
          if (json.stats) {
            setStats({
              trainingHours: `${Math.round(json.stats.totalTests * 2.5)}h`,
              performance: `${json.stats.averageScore ? Math.round(json.stats.averageScore / 10) : 87}%`,
              totalXP: String(json.stats.totalXP || 2340)
            });
          }
          if (json.chartData?.labels && json.chartData?.datasets?.[0]?.data?.length > 0) {
            setChartData({
              labels: json.chartData.labels,
              datasets: [
                {
                  data: json.chartData.datasets[0].data,
                  color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
                  strokeWidth: 3
                }
              ]
            });
          }
          if (Array.isArray(json.insights) && json.insights.length > 0) {
            setInsights(json.insights);
          }
        }
      } catch (err) {
        console.log('Error fetching analytics API:', err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchAnalyticsData();
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

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={greenTheme.colors.primary} />
      
      {/* Header */}
      <LinearGradient
        colors={[greenTheme.colors.primaryLight, greenTheme.colors.primary]}
        style={[styles.header, { paddingTop: insets.top + greenTheme.spacing.m }]}
      >
        <Image
          source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }}
          style={styles.avatar}
        />
        <Text style={styles.userName}>{userName}</Text>
        <TouchableOpacity style={styles.dropdown}>
          <FeatherIcon name="bell" size={18} color={greenTheme.colors.primary} style={{ marginRight: 8 }} />
          <Text style={styles.dropdownText}>Notification</Text>
          <FeatherIcon name="chevron-down" size={16} color={greenTheme.colors.primary} />
        </TouchableOpacity>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Stat Cards */}
        <View style={styles.statRow}>
          <View style={[styles.statCard, greenTheme.shadow]}>
            <Text style={styles.statValue}>{stats.trainingHours}</Text>
            <Text style={styles.statLabel}>Training Hours</Text>
          </View>
          <View style={[styles.statCard, greenTheme.shadow]}>
            <Text style={styles.statValue}>{stats.performance}</Text>
            <Text style={styles.statLabel}>Performance</Text>
          </View>
          <View style={[styles.statCard, greenTheme.shadow]}>
            <Text style={styles.statValue}>{stats.totalXP}</Text>
            <Text style={styles.statLabel}>Total XP</Text>
          </View>
        </View>

        {/* Performance Trend Chart */}
        <View style={[styles.chartCard, greenTheme.shadow]}>
          <Text style={styles.cardTitle}>Performance Trend</Text>
          {loading ? (
            <ActivityIndicator size="large" color={greenTheme.colors.primary} style={{ marginVertical: 40 }} />
          ) : (
            <LineChart
              data={chartData}
              width={Dimensions.get('window').width - greenTheme.spacing.m * 2 - 32}
              height={220}
              withVerticalLines={false}
              withInnerLines={false}
              withShadow={false}
              bezier
              chartConfig={{
                backgroundColor: greenTheme.colors.card,
                backgroundGradientFrom: greenTheme.colors.card,
                backgroundGradientTo: greenTheme.colors.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(107, 122, 139, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(29, 44, 59, ${opacity})`,
                style: { borderRadius: greenTheme.borderRadius.m },
                propsForDots: { r: '6', strokeWidth: '2', stroke: greenTheme.colors.primaryLight }
              }}
              style={styles.chart}
            />
          )}
        </View>
        
        {/* Insights Card */}
        <View style={[styles.insightsCard, greenTheme.shadow]}>
          <Text style={styles.cardTitle}>Insights</Text>
          {insights.map((insightText, idx) => (
            <View key={idx} style={styles.insightRow}>
              <FeatherIcon
                name={idx === 0 ? "check-circle" : (idx === 1 ? "zap" : "trending-up")}
                size={20}
                color={greenTheme.colors.primary}
              />
              <Text style={styles.insightText}>{insightText}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
      
      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, greenTheme.shadow, { paddingBottom: insets.bottom > 0 ? insets.bottom : greenTheme.spacing.m }]}>
        <NavItem icon="home" label="Dashboard" active={isScreenActive('Home') || isScreenActive('HomeScreen')} onPress={() => navigation.navigate('Home')} />
        <NavItem icon="list" label="Tests" active={isScreenActive('Test') || isScreenActive('TestScreen')} onPress={() => navigation.navigate('Test')} />
        <NavItem icon="bar-chart-2" label="Leaderboard" active={isScreenActive('Leaderboard') || isScreenActive('LeaderboardScreen')} onPress={() => navigation.navigate('Leaderboard')} />
        <NavItem icon="user" label="Profile" active={isScreenActive('ProfilePage') || isScreenActive('ProfileScreen')} onPress={() => navigation.navigate('ProfilePage')} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: greenTheme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: greenTheme.spacing.l,
    paddingBottom: greenTheme.spacing.l,
    borderBottomLeftRadius: greenTheme.borderRadius.l,
    borderBottomRightRadius: greenTheme.borderRadius.l,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: greenTheme.colors.white,
  },
  userName: {
    ...greenTheme.typography.h1,
    color: greenTheme.colors.white,
    flex: 1,
    marginLeft: greenTheme.spacing.m,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: greenTheme.colors.white,
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownText: {
    ...greenTheme.typography.body,
    fontWeight: '600',
    color: greenTheme.colors.primary,
    marginRight: greenTheme.spacing.s,
  },
  scrollContent: {
    padding: greenTheme.spacing.m,
    paddingBottom: 150,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: greenTheme.spacing.l,
  },
  statCard: {
    backgroundColor: greenTheme.colors.card,
    width: '31%',
    borderRadius: greenTheme.borderRadius.m,
    padding: greenTheme.spacing.m,
    alignItems: 'center',
  },
  statValue: {
    ...greenTheme.typography.h1,
    color: greenTheme.colors.primary,
  },
  statLabel: {
    ...greenTheme.typography.caption,
    color: greenTheme.colors.textSecondary,
    marginTop: 4,
  },
  chartCard: {
    backgroundColor: greenTheme.colors.card,
    borderRadius: greenTheme.borderRadius.m,
    padding: greenTheme.spacing.m,
    marginBottom: greenTheme.spacing.l,
    alignItems: 'center',
  },
  cardTitle: {
    ...greenTheme.typography.h2,
    color: greenTheme.colors.text,
    alignSelf: 'flex-start',
    marginBottom: greenTheme.spacing.m,
  },
  chart: {
    marginVertical: greenTheme.spacing.s,
    borderRadius: greenTheme.borderRadius.m,
  },
  insightsCard: {
    backgroundColor: greenTheme.colors.card,
    borderRadius: greenTheme.borderRadius.m,
    padding: greenTheme.spacing.l,
  },
  insightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: greenTheme.spacing.m,
  },
  insightText: {
    ...greenTheme.typography.body,
    color: greenTheme.colors.text,
    marginLeft: greenTheme.spacing.m,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: greenTheme.spacing.m,
    backgroundColor: greenTheme.colors.card,
    borderTopLeftRadius: greenTheme.borderRadius.l,
    borderTopRightRadius: greenTheme.borderRadius.l,
  },
  navItem: {
    alignItems: 'center',
    flex: 1,
  },
  navText: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: greenTheme.spacing.s / 2,
  },
});

export default AnalyticsScreen;