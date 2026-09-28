import { NextRequest, NextResponse } from 'next/server';
import { satNavWallet } from '@/lib/nwc';
import { InvoiceDecoder } from '@/lib/invoice';
import { paymentGuard } from '@/lib/payment-guard';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const isConnected = satNavWallet.isConnected();
    if (!isConnected) {
      return NextResponse.json({
        success: true,
        connected: false,
        guard_config: paymentGuard.getConfig(),
      });
    }

    const info = await satNavWallet.getWalletInfo();
    const balance = await satNavWallet.getWalletBalance();

    return NextResponse.json({
      success: true,
      connected: true,
      info,
      balance,
      guard_config: paymentGuard.getConfig(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, connected: false, error: err.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'connect') {
      const { nwc_uri } = body;
      if (!nwc_uri) {
        return NextResponse.json({ success: false, error: 'nwc_uri is required' }, { status: 400 });
      }
      satNavWallet.connect(nwc_uri);
      const info = await satNavWallet.getWalletInfo();
      const balance = await satNavWallet.getWalletBalance();

      return NextResponse.json({
        success: true,
        connected: true,
        info,
        balance,
      });
    }

    if (action === 'disconnect') {
      satNavWallet.disconnect();
      return NextResponse.json({ success: true, connected: false });
    }

    if (action === 'decode') {
      const { invoice } = body;
      if (!invoice) {
        return NextResponse.json({ success: false, error: 'invoice string required' }, { status: 400 });
      }
      const decoded = InvoiceDecoder.decode(invoice);
      return NextResponse.json({ success: true, decoded });
    }

    if (action === 'pay') {
      const { invoice, max_fee_sats } = body;
      if (!invoice) {
        return NextResponse.json({ success: false, error: 'invoice string required' }, { status: 400 });
      }
      const result = await satNavWallet.payInvoiceGuarded(invoice, max_fee_sats);
      return NextResponse.json(result);
    }

    if (action === 'update_guard') {
      const { config } = body;
      if (config) {
        paymentGuard.updateConfig(config);
      }
      return NextResponse.json({ success: true, guard_config: paymentGuard.getConfig() });
    }

    return NextResponse.json({ success: false, error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err: any) {
    console.error('Wallet API error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Wallet operation failed' },
      { status: 500 }
    );
  }
}
