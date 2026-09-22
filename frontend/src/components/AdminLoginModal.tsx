import React, { useState } from 'react';
import { Shield, X, Lock, KeyRound, AlertCircle } from 'lucide-react';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string) => void;
  onLoginApi: (pin: string) => Promise<{ success: boolean; token?: string }>;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
  isOpen,
  onClose,
  onLoginSuccess,
  onLoginApi,
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setError('Please enter the 4-digit PIN');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const res = await onLoginApi(pin);
      if (res.success && res.token) {
        onLoginSuccess(res.token);
        onClose();
        setPin('');
      } else {
        setError('Incorrect PIN. Default is 0000');
      }
    } catch (err: any) {
      setError(err.message || 'Invalid PIN. Default is 0000');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDigitClick = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit;
      setPin(newPin);
      setError('');
      if (newPin.length === 4) {
        // Auto-attempt when 4 digits reached
        setTimeout(() => {
          onLoginApi(newPin)
            .then((res) => {
              if (res.success && res.token) {
                onLoginSuccess(res.token);
                onClose();
                setPin('');
              } else {
                setError('Incorrect PIN (Default: 0000)');
              }
            })
            .catch(() => setError('Incorrect PIN (Default: 0000)'));
        }, 100);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl border-2 border-red-100 overflow-hidden">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-5 text-white text-center relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="w-12 h-12 rounded-2xl bg-white text-red-600 mx-auto flex items-center justify-center shadow-lg mb-2">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-extrabold tracking-tight">Admin Authentication</h2>
          <p className="text-xs text-red-100">
            Shree Pashupatinath Hardware Panel
          </p>
        </div>

        {/* Form Body */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* PIN Display Dots */}
            <div className="flex justify-center items-center gap-3 my-2">
              {[0, 1, 2, 3].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 transition-all duration-200 ${
                    pin.length > index
                      ? 'bg-red-600 border-red-600 scale-110 shadow-sm'
                      : 'border-gray-300 bg-gray-100'
                  }`}
                />
              ))}
            </div>

            {/* Input Field (Optional keyboard typing) */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                <KeyRound className="w-4 h-4 text-red-500" />
              </div>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value);
                  setError('');
                }}
                placeholder="Enter 4-digit PIN"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-red-500 focus:ring-2 focus:ring-red-100 outline-none text-center font-mono font-bold tracking-widest text-lg"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs font-semibold border border-red-200 animate-shake">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Numeric Keypad for Mobile App Experience */}
            <div className="grid grid-cols-3 gap-2 pt-2">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  type="button"
                  key={digit}
                  onClick={() => handleDigitClick(digit)}
                  className="py-3 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-700 active:bg-red-100 text-base font-bold text-gray-800 transition shadow-xs border border-gray-100"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setPin('')}
                className="py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-600 transition"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => handleDigitClick('0')}
                className="py-3 rounded-xl bg-gray-50 hover:bg-red-50 hover:text-red-700 active:bg-red-100 text-base font-bold text-gray-800 transition shadow-xs border border-gray-100"
              >
                0
              </button>
              <button
                type="button"
                onClick={handleBackspace}
                className="py-3 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-600 transition"
              >
                ⌫
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || pin.length === 0}
              className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-bold text-sm shadow-md shadow-red-500/30 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{isLoading ? 'Verifying PIN...' : 'Login as Admin'}</span>
            </button>

            {/* Hint Notice */}
            <div className="text-center">
              <span className="text-[11px] text-gray-400">
                Default PIN: <strong className="text-red-600">0000</strong>
              </span>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};
