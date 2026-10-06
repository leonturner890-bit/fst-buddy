import React from 'react';
import { api } from '../lib/api.js';

// DEV/DEMO REWARDED AD PLAYER
// ----------------------------------------------------------------------
// This plays a fake 6-second "ad" locally so the unlock flow can be tried
// end to end without a real ad network account. For a real deployment,
// replace the body of this component with your ad SDK's rewarded-ad
// widget (e.g. Google's IMA SDK for an HTML5/webview rewarded unit, or
// the AdMob/ironSource/AppLovin MAX web SDK), and call it with provider
// set to the matching string ('admob' | 'ironsource' | 'applovin') so the
// server verifies it against that network's real SSV callback instead of
// the 'dev-simulated' path (server/src/services/adVerification.js).
// A real ad network won't hand you a transactionId client-side to trust —
// it calls your server directly once the view is confirmed. This stub's
// simplicity is specifically what real integration replaces.

const AD_DURATION_MS = 6000;

export default function RewardedAdPlayer({ onClose, onCredited }) {
  const [progress, setProgress] = React.useState(0);
  const [phase, setPhase] = React.useState('playing'); // playing | verifying | error
  const [errorMsg, setErrorMsg] = React.useState(null);

  React.useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - start) / AD_DURATION_MS) * 100);
      setProgress(pct);
      if (pct >= 100) {
        clearInterval(timer);
        submitReward();
      }
    }, 100);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function submitReward() {
    setPhase('verifying');
    try {
      const result = await api.requestAdReward({
        provider: 'dev-simulated',
        transactionId: crypto.randomUUID(),
        payload: {},
      });
      onCredited(result);
    } catch (err) {
      setPhase('error');
      setErrorMsg(err.message);
    }
  }

  return (
    <div className="ad-overlay">
      <div className="ad-card">
        <div className="ad-screen">
          <div className="ad-progress" style={{ width: `${progress}%` }} />
          {phase === 'playing' && <span>Simulated ad — {Math.ceil((100 - progress) / (100 / (AD_DURATION_MS / 1000)))}s</span>}
          {phase === 'verifying' && <span>Verifying with server…</span>}
          {phase === 'error' && <span style={{ color: 'var(--warn)' }}>Couldn't verify</span>}
        </div>
        {phase === 'error' ? (
          <>
            <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 14 }}>{errorMsg}</p>
            <button className="btn-secondary" onClick={onClose}>Close</button>
          </>
        ) : (
          <p style={{ color: 'var(--text-faint)', fontSize: 12 }}>
            This is a development stand-in for a real rewarded-video ad.
          </p>
        )}
      </div>
    </div>
  );
}
