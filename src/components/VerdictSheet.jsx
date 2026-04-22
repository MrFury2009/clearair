const THEMES = {
  'CLEAR': {
    bg: '#14532d',
    text: '#86efac',
    border: '#166534',
    icon: '✓',
  },
  'AUTHORIZATION REQUIRED': {
    bg: '#78350f',
    text: '#fde68a',
    border: '#92400e',
    icon: '⚠',
  },
  'DO NOT FLY': {
    bg: '#7f1d1d',
    text: '#fca5a5',
    border: '#991b1b',
    icon: '✕',
  },
};

export default function VerdictSheet({ verdict, onClose }) {
  const open = !!verdict;
  const theme = verdict ? THEMES[verdict.status] ?? THEMES['CLEAR'] : THEMES['CLEAR'];

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 20,
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        padding: '0 0 env(safe-area-inset-bottom)',
      }}
    >
      <div
        style={{
          background: theme.bg,
          borderTop: `2px solid ${theme.border}`,
          padding: '20px 24px 28px',
          maxWidth: '600px',
          margin: '0 auto',
          borderRadius: '12px 12px 0 0',
          position: 'relative',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 16,
            background: 'transparent',
            border: 'none',
            color: theme.text,
            cursor: 'pointer',
            fontSize: '18px',
            opacity: 0.7,
            fontFamily: 'monospace',
          }}
        >
          ×
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
          <span style={{ fontSize: '28px', color: theme.text, fontFamily: 'monospace', lineHeight: 1 }}>
            {verdict?.icon ?? theme.icon}
          </span>
          <div>
            <p style={{
              fontSize: '11px',
              color: theme.text,
              opacity: 0.7,
              fontFamily: 'monospace',
              letterSpacing: '0.15em',
              marginBottom: '2px',
              textTransform: 'uppercase',
            }}>
              AIRSPACE STATUS
            </p>
            <p style={{
              fontSize: '22px',
              fontWeight: 'bold',
              color: theme.text,
              fontFamily: 'monospace',
              letterSpacing: '0.05em',
            }}>
              {verdict?.status ?? '—'}
            </p>
          </div>
        </div>

        {verdict?.zone && (
          <p style={{
            fontSize: '13px',
            color: theme.text,
            fontFamily: 'monospace',
            opacity: 0.85,
            marginBottom: verdict?.warning ? '6px' : 0,
          }}>
            ZONE: {verdict.zone}
          </p>
        )}

        {verdict?.warning && (
          <p style={{
            fontSize: '12px',
            color: theme.text,
            fontFamily: 'monospace',
            opacity: 0.7,
            marginTop: '4px',
          }}>
            ⚡ {verdict.warning}
          </p>
        )}
      </div>
    </div>
  );
}
