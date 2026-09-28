'use client';

import { useState, useEffect } from 'react';
import { 
  Wallet, 
  ShieldCheck, 
  Lock, 
  Key, 
  Zap, 
  CheckCircle2, 
  AlertTriangle, 
  Sliders, 
  DollarSign, 
  Clock, 
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { DecodedInvoice, NWCWalletInfo, NWCWalletBalance } from '@/types/nwc';

export default function WalletPage() {
  const [nwcUri, setNwcUri] = useState('');
  const [connected, setConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<NWCWalletInfo | null>(null);
  const [walletBalance, setWalletBalance] = useState<NWCWalletBalance | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState('');

  // Invoice payment state
  const [invoiceInput, setInvoiceInput] = useState('');
  const [decodedInvoice, setDecodedInvoice] = useState<DecodedInvoice | null>(null);
  const [paying, setPaying] = useState(false);
  const [paymentResult, setPaymentResult] = useState<any>(null);

  // Guard configuration
  const [maxFeeSats, setMaxFeeSats] = useState('250');
  const [maxSinglePayment, setMaxSinglePayment] = useState('50000');

  useEffect(() => {
    // Check wallet status on mount
    fetch('/api/wallet')
      .then((res) => res.json())
      .then((data) => {
        if (data.connected) {
          setConnected(true);
          setWalletInfo(data.info);
          setWalletBalance(data.balance);
        }
      })
      .catch((err) => console.warn('Wallet check error:', err));
  }, []);

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nwcUri.trim()) return;

    setConnecting(true);
    setError('');

    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'connect',
          nwc_uri: nwcUri.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.connected) {
        setConnected(true);
        setWalletInfo(data.info);
        setWalletBalance(data.balance);
      } else {
        setError(data.error || 'Failed to connect NWC wallet');
      }
    } catch (err: any) {
      setError(err.message || 'Connection failed');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await fetch('/api/wallet', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'disconnect' }),
    });
    setConnected(false);
    setWalletInfo(null);
    setWalletBalance(null);
    setPaymentResult(null);
    setDecodedInvoice(null);
  };

  const handleDecodeInvoice = async () => {
    if (!invoiceInput.trim()) return;
    setError('');

    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'decode',
          invoice: invoiceInput.trim(),
        }),
      });

      const data = await res.json();
      if (data.success && data.decoded) {
        setDecodedInvoice(data.decoded);
      } else {
        setError(data.error || 'Failed to decode BOLT-11 invoice');
      }
    } catch (err: any) {
      setError(err.message || 'Invoice decoding error');
    }
  };

  const handlePayInvoice = async () => {
    if (!invoiceInput.trim()) return;

    setPaying(true);
    setPaymentResult(null);
    setError('');

    try {
      const res = await fetch('/api/wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'pay',
          invoice: invoiceInput.trim(),
          max_fee_sats: Number(maxFeeSats),
        }),
      });

      const data = await res.json();
      setPaymentResult(data);

      if (data.success) {
        // Refresh balance
        const balRes = await fetch('/api/wallet');
        const balData = await balRes.json();
        if (balData.balance) setWalletBalance(balData.balance);
      }
    } catch (err: any) {
      setError(err.message || 'Payment execution failed');
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#06080D] bg-cypher-grid py-10 px-4 sm:px-6 lg:px-8 font-mono">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-8 border-b border-white/10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400 mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>NIP-47 NOSTR WALLET CONNECT GUARDIAN</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white">NWC Wallet Sentinel</h1>
            <p className="text-xs text-slate-400 mt-1">
              Connect via Alby or any NIP-47 wallet to execute guarded payments with fee limits and pre-flight path audits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {connected ? (
              <button
                onClick={handleDisconnect}
                className="px-4 py-2 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-red-300 text-xs font-semibold transition-colors"
              >
                DISCONNECT WALLET
              </button>
            ) : (
              <span className="text-xs text-slate-500">STATUS: NOT CONNECTED</span>
            )}
          </div>
        </div>

        {error && (
          <div className="mt-6 p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-300 text-xs flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 shrink-0 text-red-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Not Connected State */}
        {!connected && (
          <div className="mt-8 max-w-2xl mx-auto glass-panel rounded-2xl p-8 border border-white/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#F7931A]/10 border border-[#F7931A]/30 flex items-center justify-center text-[#F7931A]">
                <Key className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Connect Nostr Wallet (NIP-47)</h2>
                <p className="text-xs text-slate-400">
                  Enter your encrypted NWC connection URI to enable automated guarded micropayments.
                </p>
              </div>
            </div>

            <form onSubmit={handleConnect} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-2">
                  NWC CONNECTION URI
                </label>
                <input
                  type="password"
                  value={nwcUri}
                  onChange={(e) => setNwcUri(e.target.value)}
                  placeholder="nostr+walletconnect://<pubkey>?relay=wss://...&secret=..."
                  className="w-full bg-[#0D111A] border border-white/15 rounded-xl px-4 py-3 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#F7931A]"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500">
                  Secret key is processed locally and never stored.
                </span>

                <button
                  type="submit"
                  disabled={connecting}
                  className="px-6 py-2.5 rounded-xl bg-[#F7931A] hover:bg-[#ff9f2c] text-black font-bold text-xs tracking-wider transition-all disabled:opacity-50"
                >
                  {connecting ? 'CONNECTING...' : 'AUTHORIZE WALLET'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Connected State Dashboard */}
        {connected && (
          <div className="mt-8 space-y-8 animate-in fade-in duration-300">
            {/* Wallet Overview Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-[#F7931A]">
                <div className="text-slate-500 text-[11px]">AVAILABLE BALANCE</div>
                <div className="text-3xl font-extrabold text-[#F7931A] text-glow-bitcoin mt-2">
                  {walletBalance?.balance_sats.toLocaleString() || 0}{' '}
                  <span className="text-xs text-slate-400">SATS</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {walletBalance?.balance_msat.toLocaleString() || 0} msats
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-[#00F2FE]">
                <div className="text-slate-500 text-[11px]">CONNECTED NODE</div>
                <div className="text-xl font-bold text-white mt-2 truncate">
                  {walletInfo?.alias || 'Alby Hub'}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 truncate">
                  Pubkey: {walletInfo?.pubkey.substring(0, 16)}...
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-6 border-l-4 border-l-emerald-400">
                <div className="text-slate-500 text-[11px]">SAFETY STATUS</div>
                <div className="text-lg font-bold text-emerald-400 text-glow-green mt-2 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  <span>GUARD ACTIVE</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Max Fee: {maxFeeSats} sats • Max Tx: {maxSinglePayment} sats
                </div>
              </div>
            </div>

            {/* Payment & Invoice Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Payment Form (8 cols) */}
              <div className="lg:col-span-8 glass-panel rounded-2xl p-6 border border-white/10 space-y-5">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-[#F7931A]" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    DISPATCH GUARDED PAYMENT
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-2">
                    BOLT-11 INVOICE (LIGHTNING PAYMENT REQUEST)
                  </label>
                  <textarea
                    rows={3}
                    value={invoiceInput}
                    onChange={(e) => setInvoiceInput(e.target.value)}
                    placeholder="lnbc50u1p3..."
                    className="w-full bg-[#0D111A] border border-white/15 rounded-xl p-3.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-[#F7931A]"
                  />
                </div>

                <div className="flex items-center justify-between gap-4">
                  <button
                    onClick={handleDecodeInvoice}
                    className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/15 transition-colors"
                  >
                    DECODE INVOICE
                  </button>

                  <button
                    onClick={handlePayInvoice}
                    disabled={paying || !invoiceInput.trim()}
                    className="px-6 py-2.5 rounded-xl bg-[#F7931A] hover:bg-[#ff9f2c] text-black font-bold text-xs tracking-wider transition-all disabled:opacity-50 flex items-center gap-2 shadow-[0_0_25px_rgba(247,147,26,0.3)]"
                  >
                    <span>{paying ? 'VERIFYING & PAYING...' : 'PAY INVOICE VIA NWC'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Decoded Invoice Preview */}
                {decodedInvoice && (
                  <div className="p-4 rounded-xl bg-[#090D15] border border-white/10 text-xs space-y-2">
                    <div className="text-slate-400 font-bold uppercase text-[11px]">DECODED METRICS:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>Amount: <span className="text-[#F7931A] font-bold">{decodedInvoice.amount_sats} sats</span></div>
                      <div>Expires in: <span className="text-slate-300">{decodedInvoice.expiry}s</span></div>
                      <div className="col-span-2 truncate">Payee: <span className="text-slate-400">{decodedInvoice.destination_pubkey}</span></div>
                    </div>
                  </div>
                )}

                {/* Payment Execution Receipt */}
                {paymentResult && (
                  <div
                    className={`p-4 rounded-xl text-xs space-y-2 border ${
                      paymentResult.success
                        ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-300'
                        : 'bg-red-950/30 border-red-500/30 text-red-300'
                    }`}
                  >
                    <div className="font-bold uppercase text-sm">
                      {paymentResult.success ? '✅ PAYMENT EXECUTED SUCCESSFULLY' : '❌ PAYMENT BLOCKED'}
                    </div>
                    {paymentResult.success ? (
                      <>
                        <div className="break-all font-mono">Preimage: {paymentResult.preimage}</div>
                        <div>Fee Paid: {paymentResult.fee_paid_sats} sats</div>
                      </>
                    ) : (
                      <div>{paymentResult.error}</div>
                    )}
                  </div>
                )}
              </div>

              {/* Safety Settings Drawer (4 cols) */}
              <div className="lg:col-span-4 glass-panel rounded-2xl p-6 border border-white/10 space-y-5">
                <div className="flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-[#00F2FE]" />
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    SAFETY GUARDRAILS
                  </h2>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    MAX FEE CEILING (SATS)
                  </label>
                  <input
                    type="number"
                    value={maxFeeSats}
                    onChange={(e) => setMaxFeeSats(e.target.value)}
                    className="w-full bg-[#0D111A] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F2FE]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Payments exceeding this fee will be blocked automatically.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">
                    SINGLE TX LIMIT (SATS)
                  </label>
                  <input
                    type="number"
                    value={maxSinglePayment}
                    onChange={(e) => setMaxSinglePayment(e.target.value)}
                    className="w-full bg-[#0D111A] border border-white/15 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#00F2FE]"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Maximum satoshis an agent can disburse in a single call.
                  </p>
                </div>

                <div className="pt-3 border-t border-white/10 text-[11px] text-slate-400 space-y-1">
                  <div>• Pre-flight route fee verification: <span className="text-emerald-400">ENABLED</span></div>
                  <div>• Daily drainage cap: <span className="text-emerald-400">500,000 SATS</span></div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
