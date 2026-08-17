import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Share2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import api from '../api';

const BankQR = () => {
  const { id } = useParams();
  const [bank, setBank] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBank = async () => {
      try {
        const res = await api.get(`/banks/${id}`);
        setBank(res.data);
      } catch (err) {
        console.error('Error fetching bank', err);
      } finally {
        setLoading(false);
      }
    };
    fetchBank();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!bank) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center p-4 text-center">
        <h2 className="text-2xl font-bold mb-4">Bank Not Found</h2>
        <button onClick={() => navigate('/banks')} className="btn-primary w-auto inline-block">
          Go Back
        </button>
      </div>
    );
  }

  // Dynamically generate QR code payload from bank details
  const qrData = `payment://${bank.name.toLowerCase().replace(/\s+/g, '')}?acc=${encodeURIComponent(bank.accountNumber || '')}&name=${encodeURIComponent(bank.accountName || '')}`;

  return (
    <div className="min-h-screen flex flex-col">
      <div className="p-4 sm:p-8 flex items-center justify-between max-w-md mx-auto w-full">
        <button onClick={() => navigate('/banks')} className="p-2 -ml-2 rounded-full hover:bg-surface transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-semibold">Scan to Pay</h1>
        <button className="p-2 rounded-full hover:bg-surface text-primary transition-colors">
          <Share2 size={20} />
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-md mx-auto w-full">
        <div className="glass-panel w-full rounded-[2rem] p-8 flex flex-col items-center relative overflow-hidden">
          {/* Accent glow behind QR */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-primary/20 rounded-full blur-3xl -z-10"></div>
          
          <div className="bg-white p-4 rounded-3xl shadow-xl mb-8 transform hover:scale-105 transition-transform duration-500 flex items-center justify-center min-w-[260px] min-h-[260px]">
            {bank.qrCodeImage ? (
              <img
                src={bank.qrCodeImage}
                alt={`${bank.name} QR Code`}
                className="w-60 h-60 object-contain rounded-2xl"
              />
            ) : (
              <QRCodeSVG 
                value={qrData} 
                size={240}
                bgColor={"#ffffff"}
                fgColor={"#0F172A"}
                level={"Q"}
                includeMargin={true}
                imageSettings={
                  bank.logoUrl ? {
                    src: bank.logoUrl,
                    x: undefined,
                    y: undefined,
                    height: 40,
                    width: 40,
                    excavate: true,
                  } : undefined
                }
              />
            )}
          </div>

          <div className="text-center w-full">
            <h2 className="text-2xl font-bold text-white mb-2">{bank.name}</h2>
            
            <div className="bg-surface/50 rounded-xl p-4 mt-6 border border-white/5 space-y-3">
              {bank.accountName && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-textSecondary">Account Name</span>
                  <span className="font-medium text-white">{bank.accountName}</span>
                </div>
              )}
              {bank.accountNumber && (
                <div className="flex justify-between items-center text-sm">
                  <span className="text-textSecondary">Account Number</span>
                  <span className="font-medium text-white font-mono tracking-wider">{bank.accountNumber}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BankQR;
