import React from 'react';
import { TOOLS } from '../constants';

const Toolbar = ({ maze, onHelp, onCommunity }) => {
  const { tool, setTool, brushSize, setBrushSize, gameState, setGameState, playerPos, setPlayerPos, layers, activeLayerId, deleteLayer } = maze;

  const EraserIcon = (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2L22 11L20 20Z"></path>
      <path d="M17 17L7 7"></path>
    </svg>
  );

  const tools = [
    { id: TOOLS.PENCIL, icon: '✎', label: 'Wall' },
    { id: TOOLS.ERASER, icon: EraserIcon, label: 'Eraser' },
    { id: TOOLS.START, icon: '🚩', label: 'Start' },
    { id: TOOLS.END, icon: '🏁', label: 'End' },
    { id: TOOLS.BLOCK_RECT, icon: '□', label: 'Add Block' },
  ];

  return (
    <div className="glass-panel toolbar-container" style={{
      position: 'absolute',
      top: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      padding: '8px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      zIndex: 100
    }}>
      <div style={{ display: 'flex', gap: '8px', borderRight: '1px solid var(--border)', paddingRight: '12px' }}>
        {tools.map(t => (
          <button
            key={t.id}
            onClick={() => setTool(t.id)}
            style={{
              padding: '8px 12px',
              borderRadius: '8px',
              backgroundColor: tool === t.id ? 'var(--primary)' : 'transparent',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontSize: '12px',
              minWidth: '60px'
            }}
          >
            <span style={{ fontSize: '24px', marginBottom: '4px' }}>
              {typeof t.icon === 'string' ? t.icon : t.icon}
            </span>
            {t.label}
          </button>
        ))}

        {/* DELETE ACTIVE BLOCK BUTTON */}
        <button
          onClick={() => {
            if (activeLayerId) {
              const l = layers.find(layer => layer.id === activeLayerId);
              if (l && l.type !== 'base') {
                if (confirm('Delete selected block?')) {
                  deleteLayer(activeLayerId);
                }
              }
            }
          }}
          disabled={!activeLayerId || (layers.find(l => l.id === activeLayerId)?.type === 'base')}
          style={{
            padding: '8px 12px', borderRadius: '8px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', fontSize: '12px',
            color: (!activeLayerId || (layers.find(l => l.id === activeLayerId)?.type === 'base')) ? 'var(--text-muted)' : '#ef4444',
            opacity: (!activeLayerId || (layers.find(l => l.id === activeLayerId)?.type === 'base')) ? 0.5 : 1,
            minWidth: '60px',
            pointerEvents: (!activeLayerId || (layers.find(l => l.id === activeLayerId)?.type === 'base')) ? 'none' : 'auto'
          }}
          title="Delete Active Block"
        >
          <span style={{ fontSize: '24px', marginBottom: '4px' }}>🗑️</span>
          Delete Block
        </button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Size</span>
        <input
          type="range"
          min="1" max="50"
          value={brushSize}
          onChange={(e) => setBrushSize(parseInt(e.target.value))}
          style={{ width: '80px' }}
        />
        <span style={{ fontSize: '12px' }}>{brushSize}</span>
      </div>

      <button
        onClick={onCommunity}
        style={{ fontSize: '18px', padding: '8px', cursor: 'pointer' }}
        title="Community Hub (Demo)"
      >
        🌍
      </button>

      <button
        onClick={onHelp}
        style={{ fontSize: '18px', padding: '8px', cursor: 'pointer' }}
        title="Help & Instructions"
      >
        ❓
      </button>

      <button
        onClick={() => {
          const url = maze.getShareableLink();
          if (url.length > 20000) { // Browser limits vary, 20k is rough safe limit for modern browsers, but some old ones <2k
            alert("Map is too complex/large to share via a simple link (Limit exceeded).\n\nPlease use the 'Save File' button instead!");
          } else {
            navigator.clipboard.writeText(url);
            alert("Link copied to clipboard!");
          }
        }}
        style={{ fontSize: '18px', padding: '8px', cursor: 'pointer' }}
        title="Share Link (for small maps)"
      >
        🔗
      </button>

      <button
        onClick={maze.exportMaze}
        style={{ fontSize: '18px', padding: '8px' }}
        title="Export"
      >
        💾
      </button>

      <label style={{ cursor: 'pointer', fontSize: '18px', padding: '8px' }} title="Import">
        open 📂
        <input
          type="file"
          hidden
          accept=".json"
          onChange={(e) => e.target.files[0] && maze.importMaze(e.target.files[0])}
        />
      </label>

      <button
        onClick={() => setGameState(gameState === 'editing' ? 'playing' : 'editing')}
        style={{
          marginLeft: '12px',
          padding: '8px 20px',
          borderRadius: '20px',
          backgroundColor: gameState === 'playing' ? 'var(--accent-s)' : 'var(--accent-e)',
          fontWeight: 'bold',
          color: 'white'
        }}
      >
        {gameState === 'editing' ? '▶ PLAY' : '⏹ STOP'}
      </button>
    </div>
  );
};

export default Toolbar;
