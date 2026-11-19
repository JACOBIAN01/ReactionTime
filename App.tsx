import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

type State = 'idle' | 'waiting' | 'go' | 'done' | 'early';

const COLORS = { idle: '#2b6cb0', waiting: '#c53030', go: '#2f855a', done: '#2b6cb0', early: '#dd6b20' };

export default function App() {
  const [state, setState] = useState<State>('idle');
  const [time, setTime] = useState(0);
  const [best, setBest] = useState<number | null>(null);
  const start = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Load best score saved on the device
  useEffect(() => {
    AsyncStorage.getItem('best').then((v) => v && setBest(Number(v)));
  }, []);

  const onPress = () => {
    if (state === 'waiting') {
      clearTimeout(timer.current);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return setState('early');
    }
    if (state === 'go') {
      const ms = Date.now() - start.current;
      setTime(ms);
      setState('done');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      if (best === null || ms < best) {
        setBest(ms);
        AsyncStorage.setItem('best', String(ms));
      }
      return;
    }
    // idle / done / early -> start a new round
    setState('waiting');
    timer.current = setTimeout(() => {
      start.current = Date.now();
      setState('go');
    }, 1500 + Math.random() * 3000);
  };

  const message = {
    idle: 'Tap to start',
    waiting: 'Wait for green...',
    go: 'TAP!',
    done: `${time} ms\n\nTap to try again`,
    early: 'Too soon!\n\nTap to try again',
  }[state];

  return (
    <Pressable style={[styles.container, { backgroundColor: COLORS[state] }]} onPress={onPress}>
      <Text style={styles.title}>⚡ Reaction Time</Text>
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.best}>Best: {best ?? '--'} ms</Text>
      <StatusBar style="light" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { position: 'absolute', top: 80, color: '#fff', fontSize: 24, fontWeight: '600' },
  message: { color: '#fff', fontSize: 40, fontWeight: 'bold', textAlign: 'center' },
  best: { position: 'absolute', bottom: 80, color: '#fff', fontSize: 20 },
});
