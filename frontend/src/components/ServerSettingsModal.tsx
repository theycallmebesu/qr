import React, { useState, useEffect } from 'react';
import { X, Database, Globe, CheckCircle2, AlertCircle, RefreshCw, Save } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl, clearLocalCache, api } from '../services/api';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshData: () => void;
}

export const ServerSettingsModal: React.FC<ServerSettingsModalProps> = ({
  isOpen,
  onClose,
  onRefreshData,
}) => {
  const [url, setUrl] = useState('');
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl(getApiBaseUrl());
      setStatus('idle');
      setStatusMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setTesting(true);
    setStatus('idle');
    try {
      setApiBaseUrl(url);
      const res = await api.checkHealth();
      if (res.connected) {
        setStatus('success');
        setStatusMsg('✅ Successfully connected to Render backend & MongoDB Atlas!');
      } else {
        setStatus('error');
        setStatusMsg(`❌ Unable to reach backend: ${res.message || 'Check URL'}`);
      }
    } catch (e: any) {
      setStatus('error');
      setStatusMsg(`❌ Connection failed: ${e.message || 'Check URL'}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSaveAndSync = async () => {
    setApiBaseUrl(url);
    clearLocalCache();
    await onRefreshData();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border-2 border-red-100 overflow-hidden">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 sm:p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/20">
              <Database className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">MongoDB & Server Sync</h2>
              <p className="text-xs text-red-100">Live Database Connection Settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-red-600" />
              <span>Render Backend API URL</span>
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. https://your-backend-service.onrender.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-xs font-mono font-medium outline-none text-gray-800"
            />
            <p className="text-[11px] text-gray-500 mt-1">
              Paste your live Render Web Service URL here to sync directly with MongoDB Atlas.
            </p>
          </div>

          {/* Test connection button */}
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="w-full py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold flex items-center justify-center gap-1.5 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'Testing MongoDB Connection...' : 'Test Live Connection'}</span>
          </button>

          {/* Connection Status Feedback */}
          {statusMsg && (
            <div
              className={`p-3 rounded-xl border flex items-center gap-2 font-semibold ${
                status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              {status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              )}
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndSync}
              className="flex-[2] py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold shadow-md shadow-red-500/25 flex items-center justify-center gap-1.5 transition"
            >
              <Save className="w-4 h-4" />
              <span>Save & Sync Database</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};
