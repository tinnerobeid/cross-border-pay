import React, { useEffect } from 'react';
import { Tabs } from 'expo-router';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '../../constants/colors';
import { useAuth } from '../../contexts/AuthContext';

export default function TabsLayout() {
  const { token, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !token) {
      router.replace('/');
    }
  }, [token, isLoading]);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: '#98A2B3',
        tabBarStyle: {
          height: 72,
          paddingTop: 8,
          paddingBottom: 8,
          borderTopColor: '#EEF2F6',
          backgroundColor: '#fff',
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="send"
        options={{
          title: 'Send',
          tabBarIcon: ({ color, size }) => <Ionicons name="paper-plane-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="recipients"
        options={{
          title: 'Accounts',
          tabBarIcon: ({ color, size }) => <Ionicons name="card-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size }) => <Ionicons name="time-outline" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}