import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Stack, useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type StatCardProps = {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
};

type StatType = {
  title: string;
  value: string | number;
  icon: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
};

const StatCard = ({ title, value, icon }: StatCardProps) => (
  <View style={styles.statCard}>
    <View style={styles.statIconContainer}>
      <Ionicons name={icon} size={24} color="#4F46E5" />
    </View>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statTitle}>{title}</Text>
  </View>
);

const AdminPanel = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<StatType[]>([
    { title: 'Total Users', value: 'Loading...', icon: 'people', loading: true },
    { title: 'Active Today', value: 'Loading...', icon: 'pulse', loading: true },
    { title: 'New This Week', value: 'Loading...', icon: 'trending-up', loading: true },
    { title: 'Active Sessions', value: 'Loading...', icon: 'people-circle', loading: true },
  ]);
  const [recentActivities, setRecentActivities] = useState<{id: number, action: string, time: string}[]>([]);

  const checkAdminStatus = async () => {
    if (!user) return false;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();
        
      if (error) throw error;
      return data?.is_admin || false;
    } catch (error) {
      console.error('Error checking admin status:', error);
      return false;
    }
  };

  const fetchStats = async () => {
    try {
      // Fetch total users
      const { count: totalUsers } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

      // Fetch active users today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: activeToday } = await supabase
        .from('sessions')
        .select('user_id', { count: 'exact' })
        .gte('created_at', today.toISOString())
        .not('user_id', 'is', null);

      // Fetch new users this week
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { count: newThisWeek } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', weekAgo.toISOString());

      // Get active sessions count
      const { count: activeSessions } = await supabase
        .from('sessions')
        .select('*', { count: 'exact', head: true })
        .gte('expires_at', new Date().toISOString());

      setStats([
        { title: 'Total Users', value: totalUsers?.toLocaleString() || '0', icon: 'people' },
        { title: 'Active Today', value: activeToday?.toLocaleString() || '0', icon: 'pulse' },
        { title: 'New This Week', value: newThisWeek?.toLocaleString() || '0', icon: 'trending-up' },
        { title: 'Active Sessions', value: activeSessions?.toLocaleString() || '0', icon: 'people-circle' },
      ]);

      // Fetch recent activities
      const { data: activities } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);

      if (activities) {
        setRecentActivities(activities.map(activity => ({
          id: activity.id,
          action: activity.action,
          time: formatTimeAgo(activity.created_at)
        })));
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      Alert.alert('Error', 'Failed to load admin data');
    } finally {
      setIsLoading(false);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    return `${Math.floor(diffInSeconds / 86400)}d ago`;
  };

  useFocusEffect(
    useCallback(() => {
      const loadAdminData = async () => {
        try {
          const adminStatus = await checkAdminStatus();
          if (!adminStatus) {
            Alert.alert('Access Denied', 'You do not have permission to access this page');
            router.back();
            return;
          }
          
          setIsAdmin(true);
          await fetchStats();
          
          // Set up real-time subscription for user activities
          const subscription = supabase
            .channel('admin-dashboard')
            .on('postgres_changes', 
              { event: '*', schema: 'public', table: 'audit_logs' },
              () => fetchStats()
            )
            .subscribe();

          return () => {
            subscription.unsubscribe();
          };
        } catch (error) {
          console.error('Error in admin check:', error);
          Alert.alert('Error', 'Failed to verify admin status');
          router.back();
        }
      };

      loadAdminData();
    }, [user])
  );

  if (!isAdmin) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Verifying admin access...</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading admin dashboard...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Admin Dashboard',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: 16 }}>
              <Ionicons name="arrow-back" size={24} color="#4F46E5" />
            </TouchableOpacity>
          ),
        }} 
      />
      
      <ScrollView style={styles.scrollView}>
        <Text style={styles.header}>Dashboard</Text>
        
        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          {stats.map((stat, index) => (
            <View key={index} style={styles.statCardContainer}>
              <StatCard 
                title={stat.title}
                value={stat.loading ? '...' : stat.value}
                icon={stat.icon as any}
              />
              {stat.loading && (
                <View style={styles.statLoadingOverlay}>
                  <ActivityIndicator size="small" color="#4F46E5" />
                </View>
              )}
            </View>
          ))}
        </View>

        {/* Recent Activity */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            {recentActivities.map((activity) => (
              <View key={activity.id} style={styles.activityItem}>
                <View style={styles.activityDot} />
                <View style={styles.activityContent}>
                  <Text style={styles.activityText}>{activity.action}</Text>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* System Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>System Status</Text>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.statusText}>All systems operational</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.statusText}>Database: Online</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.statusText}>API: Responding</Text>
          </View>
        </View>

        {/* Empty space at the bottom */}
        <View style={{ height: 50 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#4B5563',
    fontSize: 16,
  },
  statCardContainer: {
    position: 'relative',
    width: '48%',
    marginBottom: 16,
  },
  statLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    color: '#4B5563',
    fontSize: 16,
  },
  statCardContainer: {
    position: 'relative',
    width: '48%',
    marginBottom: 16,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 24,
    color: '#111827',
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    marginBottom: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  activityList: {
    gap: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4F46E5',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityText: {
    fontSize: 14,
    color: '#111827',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  statusText: {
    fontSize: 14,
    color: '#4B5563',
  },
});

export default AdminPanel;
