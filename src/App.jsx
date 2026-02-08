import React, { useState } from 'react';
import { useMaze } from './hooks/useMaze';
import MazeCanvas from './components/MazeCanvas';
import Toolbar from './components/Toolbar';
import LayerPanel from './components/LayerPanel';
import HelpModal from './components/HelpModal';
import CommunityModal from './components/CommunityModal';
import './index.css';

function App() {
  const maze = useMaze();
  const { gameState, setGameState, startPos, setPlayerPos } = maze;
  const [showWin, setShowWin] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [showCommunity, setShowCommunity] = useState(false);
  const [toast, setToast] = useState(null); // { text, type: 'success' | 'error' }

  // Auto-dismiss toast
  React.useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 2000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Check for shared map in URL on load
  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mapData = params.get('map');
    if (mapData) {
      console.log("Found map data in URL, attempting to load...");
      setTimeout(() => {
        const success = maze.importMazeFromUrl(mapData);
        if (success) {
          setToast({ text: "Map Loaded from Link!", type: 'success' });
          // Clean URL
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          setToast({ text: "Failed to load shared map.", type: 'error' });
        }
      }, 500);
    }
  }, []);

  const mobileBtnStyle = {
    width: '50px',
    height: '50px',
    background: 'var(--bg-card)',
    backdropFilter: 'blur(5px)',
    border: '1px solid var(--border)',
    borderRadius: '12px',
    color: 'white',
    fontSize: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  // Win condition check and Play Mode Reset
  React.useEffect(() => {
    if (maze.gameState === 'playing') {
      const dist = Math.hypot(maze.playerPos.x - maze.endPos.x, maze.playerPos.y - maze.endPos.y);
      if (dist < 20) {
        setShowWin(true);
        maze.setGameState('editing');
      }
    }
  }, [maze.playerPos, maze.endPos, maze.gameState, maze.setGameState]);

  // Keyboard shortcut for toggling blocks (1-9)
  // FIX: Use ref to avoid re-binding listener on every render (which happens 60fps due to playerPos)
  const mazeRef = React.useRef(maze);
  mazeRef.current = maze;

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      // Access the LATEST state via ref
      const currentMaze = mazeRef.current;

      // Ignore if typing in inputs (relaxed check to allow shortcuts when unrelated inputs are focused, if any)
      if (e.target.tagName === 'TEXTAREA' || (e.target.tagName === 'INPUT' && (e.target.type === 'text' || e.target.type === 'number' || e.target.type === 'password'))) {
        return;
      }

      let num = parseInt(e.key);
      if (isNaN(num) && e.code.startsWith('Digit')) {
        num = parseInt(e.code.replace('Digit', ''));
      }

      if (!isNaN(num) && num >= 1 && num <= 9) {
        const blocks = currentMaze.layers.filter(l => l.type === 'block');

        if (num <= blocks.length) {
          const targetBlock = blocks[num - 1];
          const isPlaced = currentMaze.placedIds.includes(targetBlock.id);

          let success = false;

          // Note: We're calling methods from currentMaze, ensuring we use the latest closures too
          if (isPlaced) {
            success = currentMaze.liftBlock(targetBlock.id);
            if (!success) {
              setToast({ text: `Cannot Lift Block ${num}: Locked!`, type: 'error' });
            } else {
              setToast({ text: `Block ${num} Lifted`, type: 'success' });
            }
          } else {
            success = currentMaze.placeBlock(targetBlock.id);
            if (!success) {
              setToast({ text: `Cannot Place Block ${num}: Something in the way!`, type: 'error' });
            } else {
              setToast({ text: `Block ${num} Placed`, type: 'success' });
            }
          }
        }
      }
    };

    // Bind strictly once
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array = stable listener

  return (
    <div className="app-container">
      <div className="main-content">
        <MazeCanvas maze={maze} />

        <div className="ui-overlay">
          <Toolbar maze={maze} onHelp={() => setShowHelp(true)} onCommunity={() => setShowCommunity(true)} />
          <LayerPanel maze={maze} />

          {/* Logo / Header */}
          <div className="app-header" style={{ position: 'absolute', top: '24px', left: '24px', pointerEvents: 'none' }}>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', background: 'linear-gradient(to right, #6366f1, #a855f7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              STACKMAZE
            </h1>
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>LAYERED PUZZLE BUILDER</p>
          </div>

          {/* Toast Message */}
          {toast && (
            <div style={{
              position: 'absolute', top: '100px', left: '50%', transform: 'translateX(-50%)',
              background: toast.type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 'rgba(34, 197, 94, 0.9)',
              color: 'white', padding: '12px 24px', borderRadius: '30px',
              fontWeight: '600', backdropFilter: 'blur(4px)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              pointerEvents: 'none',
              animation: 'fadeIn 0.2s ease-out',
              zIndex: 9999
            }}>
              {toast.text}
            </div>
          )}

        </div>

        {/* Help Modal */}
        {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

        {/* Community Modal */}
        {showCommunity && (
          <CommunityModal
            onClose={() => setShowCommunity(false)}
            maze={maze}
            onImport={(data) => {
              const success = maze.loadMapData(data);
              if (success) {
                setShowCommunity(false);
                setToast({ text: "Map Loaded from Community!", type: 'success' });
              } else {
                setToast({ text: "Failed to load map.", type: 'error' });
              }
            }}
          />
        )}

        {/* Win Modal */}
        {showWin && (
          <div className="flex-center" style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)'
          }}>
            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', maxWidth: '400px' }}>
              <h2 style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🎉 WINNER!</h2>
              <p style={{ marginBottom: '24px', color: 'var(--text-muted)' }}>You successfully navigated the multi-layer maze.</p>
              <button
                onClick={() => setShowWin(false)}
                style={{ background: 'var(--primary)', color: 'white', padding: '12px 32px', borderRadius: '12px', fontSize: '1rem', fontWeight: 'bold' }}
              >
                KEEP EDITING
              </button>
            </div>
          </div>
        )}

        {/* Mobile Controls */}
        {maze.gameState === 'playing' && (
          <div style={{ position: 'absolute', bottom: '140px', right: '40px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', pointerEvents: 'auto' }}>
            <div />
            <button onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'w' }))} onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'w' }))} style={mobileBtnStyle}>↑</button>
            <div />
            <button onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'a' }))} onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }))} style={mobileBtnStyle}>←</button>
            <button onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 's' }))} onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }))} style={mobileBtnStyle}>↓</button>
            <button onTouchStart={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'd' }))} onTouchEnd={() => window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }))} style={mobileBtnStyle}>→</button>
          </div>
        )}

        <div className="helper-text" style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', textAlign: 'center' }}>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {maze.gameState === 'editing'
              ? '✎ Draw | □ Selection | 🖱 Middle Move | ⇳ Scroll Zoom'
              : 'WASD to Move | Toggle layers on the right panel'
            }
          </p>
        </div>
      </div>
    </div>
  );
}

export default App;
