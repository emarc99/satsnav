import { NextRequest, NextResponse } from 'next/server';
import { nostrSentinel, NostrThreatAlert } from '@/lib/nostr-sentinel';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const identity = nostrSentinel.getIdentity();
    const recentAlerts = nostrSentinel.getRecentAlerts();

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      identity,
      recentAlerts,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to retrieve Nostr Sentinel state' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodePubkey, alias, ppm, medianPpm, multiplierVsMedian, severity, recommendation } = body;

    if (!nodePubkey || !ppm || !severity) {
      return NextResponse.json(
        { success: false, error: 'Missing required threat parameters (nodePubkey, ppm, severity)' },
        { status: 400 }
      );
    }

    const threatAlert: NostrThreatAlert = {
      nodePubkey,
      alias: alias || nodePubkey.substring(0, 10),
      ppm: Number(ppm),
      medianPpm: Number(medianPpm) || 100,
      multiplierVsMedian: Number(multiplierVsMedian) || Number((Number(ppm) / (Number(medianPpm) || 100)).toFixed(1)),
      severity: severity || 'predatory',
      recommendation: recommendation || `Predatory fee rate (${ppm} ppm) detected. Avoid routing via this channel.`,
    };

    const broadcastRecord = await nostrSentinel.broadcastThreatAlert(threatAlert);

    return NextResponse.json({
      success: true,
      timestamp: Date.now(),
      event: broadcastRecord,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to broadcast threat alert to Nostr' },
      { status: 500 }
    );
  }
}
