import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';
import { playKitchenBell, playCashRegister, playSuccessBeep } from '../utils/audioAlerts';

export const SocketContext = createContext();

// Nepali Singing Bowl / Kitchen Chime for Ready Alert
export const playOrderReadyChime = () => {
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic bell chime 1 (High tone)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now);
    osc1.frequency.exponentialRampToValueAtTime(587.33, now + 1.2);
    gain1.gain.setValueAtTime(0.5, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 1.2);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 1.2);

    // Harmonic bell chime 2
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(1174.66, now + 0.15);
    osc2.frequency.exponentialRampToValueAtTime(440, now + 1.4);
    gain2.gain.setValueAtTime(0.4, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 1.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.15);
    osc2.stop(now + 1.4);

    // Vibrate device if mobile browser supports vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([200, 100, 200, 100, 400]);
    }
  } catch (e) {
    console.warn('Audio chime error:', e);
  }
};

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [readyAlert, setReadyAlert] = useState(null); // Full-screen popup for waiter
  const [toastAlert, setToastAlert] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const soundEnabledRef = useRef(soundEnabled);
  soundEnabledRef.current = soundEnabled;

  const userRef = useRef(user);
  userRef.current = user;

  useEffect(() => {
    let socketUrl = 'http://localhost:5000';
    if (import.meta.env.VITE_API_URL) {
      socketUrl = import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
    } else if (typeof window !== 'undefined' && window.location.hostname) {
      socketUrl = `http://${window.location.hostname}:5000`;
    }

    const newSocket = io(socketUrl, {
      transports: ['polling', 'websocket'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      timeout: 10000
    });

    newSocket.on('connect', () => {
      setConnected(true);
      if (userRef.current) {
        if (userRef.current.role) {
          newSocket.emit('join_role', userRef.current.role);
        }
        if (userRef.current.id || userRef.current._id) {
          newSocket.emit('join_user', userRef.current.id || userRef.current._id);
        }
      }
    });

    newSocket.on('disconnect', () => {
      setConnected(false);
    });

    // Real-time listener: Order Ready Alert (specifically targeted to Waiter)
    newSocket.on('order:ready_alert', (data) => {
      const currentUser = userRef.current;
      const currentUserId = currentUser?._id || currentUser?.id;
      const isMyOrder = currentUserId && String(currentUserId) === String(data.waiterId);

      // Trigger full-screen alert if this waiter's order or if logged in as admin/waiter
      if (isMyOrder || currentUser?.role === 'waiter' || currentUser?.role === 'admin') {
        if (soundEnabledRef.current) {
          playOrderReadyChime();
        }
        setReadyAlert({
          ...data,
          receivedAt: new Date()
        });
      }

      setToastAlert({
        id: Date.now(),
        type: 'ready',
        title: `Food is Ready: Table #${data.tableNumber}`,
        message: `Order #${data.orderNumber} is hot and ready for pick-up!`,
        timestamp: new Date()
      });
    });

    // Real-time listener: New Order placed (for Kitchen)
    newSocket.on('order:new', (order) => {
      if (userRef.current?.role === 'kitchen' || userRef.current?.role === 'admin') {
        if (soundEnabledRef.current) {
          playKitchenBell();
        }
      }
      setToastAlert({
        id: Date.now(),
        type: 'new_order',
        title: `New Order: Table #${order.tableNumber}`,
        message: `${order.items?.length || 0} items ordered by ${order.waiterName || 'Staff'}`,
        timestamp: new Date()
      });
    });

    // Real-time listener: Payment completed (for Receptionist & Admin)
    newSocket.on('payment:completed', (payment) => {
      if (userRef.current?.role === 'reception' || userRef.current?.role === 'admin') {
        if (soundEnabledRef.current) {
          playCashRegister();
        }
      }
      setToastAlert({
        id: Date.now(),
        type: 'payment',
        title: `Bill Settled: Table #${payment.tableNumber}`,
        message: `Invoice #${payment.invoiceNumber} paid Rs. ${payment.total}`,
        timestamp: new Date()
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Update rooms whenever logged-in user changes
  useEffect(() => {
    if (socket && connected && user) {
      if (user.role) {
        socket.emit('join_role', user.role);
      }
      if (user.id || user._id) {
        socket.emit('join_user', user.id || user._id);
      }
    }
  }, [user, socket, connected]);

  // Clear toast after 5 seconds
  useEffect(() => {
    if (toastAlert) {
      const timer = setTimeout(() => setToastAlert(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [toastAlert]);

  return (
    <SocketContext.Provider
      value={{
        socket,
        connected,
        readyAlert,
        toastAlert,
        soundEnabled,
        setSoundEnabled,
        dismissReadyAlert: () => setReadyAlert(null),
        clearToastAlert: () => setToastAlert(null),
        playChime: playOrderReadyChime
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
