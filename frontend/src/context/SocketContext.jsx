import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const { user } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const [liveAlert, setLiveAlert] = useState(null);

  // Play pleasant notification sound using Web Audio API
  const playAlertSound = (type = 'success') => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      if (type === 'ready') {
        // High upbeat 2-tone chime
        osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio context might be blocked prior to user interaction
    }
  };

  useEffect(() => {
    // Extract socket URL from API URL or default to port 5000
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socketUrl = rawApiUrl.replace(/\/api\/?$/, '');

    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 1500
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to server, ID:', newSocket.id);
      setConnected(true);
      if (user?.role) {
        newSocket.emit('join_role', user.role);
      }
    });

    newSocket.on('disconnect', () => {
      console.log('[Socket] Disconnected from server');
      setConnected(false);
    });

    // Global listener for order status notifications
    newSocket.on('order:status_update', (order) => {
      if (order.status === 'Ready') {
        playAlertSound('ready');
        setLiveAlert({
          id: Date.now(),
          type: 'ready',
          title: `Table #${order.tableNumber} Food is READY!`,
          message: `Order #${order.orderNumber} is prepared and ready for pick-up.`,
          timestamp: new Date()
        });
      } else if (order.status === 'Cancelled') {
        setLiveAlert({
          id: Date.now(),
          type: 'warning',
          title: `Order #${order.orderNumber} Cancelled`,
          message: `Order on Table #${order.tableNumber} was cancelled.`,
          timestamp: new Date()
        });
      }
    });

    newSocket.on('order:new', (order) => {
      playAlertSound('new');
      setLiveAlert({
        id: Date.now(),
        type: 'info',
        title: `New Order: Table #${order.tableNumber}`,
        message: `${order.items.length} item(s) • Total: $${order.totalPrice?.toFixed(2)}`,
        timestamp: new Date()
      });
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Update room when user changes
  useEffect(() => {
    if (socket && connected && user?.role) {
      socket.emit('join_role', user.role);
    }
  }, [user, socket, connected]);

  // Auto clear alert after 6 seconds
  useEffect(() => {
    if (liveAlert) {
      const timer = setTimeout(() => setLiveAlert(null), 6000);
      return () => clearTimeout(timer);
    }
  }, [liveAlert]);

  return (
    <SocketContext.Provider value={{ socket, connected, liveAlert, clearAlert: () => setLiveAlert(null) }}>
      {children}
    </SocketContext.Provider>
  );
};
