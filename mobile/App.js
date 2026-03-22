import React, { useState } from 'react';
import { SafeAreaView, StatusBar } from 'react-native';
import { IntroScreen } from './src/screens/IntroScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { DashboardScreen } from './src/screens/DashboardScreen';

export default function App() {
  const [stage, setStage] = useState('login');
  const [userName, setUserName] = useState('');

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      {stage === 'login' && (
        <LoginScreen
          onNext={(name) => {
            setUserName(name);
            setStage('intro');
          }}
        />
      )}
      {stage === 'intro' && <IntroScreen onNext={() => setStage('dashboard')} />}
      {stage === 'dashboard' && <DashboardScreen userName={userName} />}
    </SafeAreaView>
  );
}
