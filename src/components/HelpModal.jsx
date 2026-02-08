import React from 'react';

const HelpModal = ({ onClose }) => {
  return (
    <div className="flex-center" style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)'
    }} onClick={onClose}>
      <div
        className="glass-panel"
        style={{
          width: '90%', maxWidth: '600px', maxHeight: '85vh',
          overflowY: 'auto', padding: '32px', position: 'relative',
          color: 'var(--text-main)'
        }}
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '16px', right: '16px',
            fontSize: '24px', opacity: 0.7
          }}
        >
          &times;
        </button>

        <h2 style={{ marginBottom: '24px', fontSize: '2rem', textAlign: 'center' }}>How to Play & Create</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <section>
            <h3 style={{ color: 'var(--primary)', marginBottom: '8px' }}>🎨 Creating a Maze</h3>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
              <li><strong>Wall Tool (✎)</strong>: Draw solid walls on the Base Layer or on Blocks.</li>
              <li><strong>Add Block (□)</strong>: Create a new transparent "paper" layer. You can draw unique walls on each block!</li>
              <li><strong>Layer Panel</strong>: Manage your blocks on the right. Stack them to create 3D-like puzzles.</li>
              <li><strong>Delete Block</strong>: Remove a selected block layer if you made a mistake.</li>
            </ul>
          </section>

          <section>
            <h3 style={{ color: 'var(--accent-e)', marginBottom: '8px' }}>🎮 Playing</h3>
            <ul style={{ paddingLeft: '20px', lineHeight: '1.6', color: 'var(--text-muted)' }}>
              <li>Click <strong>PLAY</strong> to start.</li>
              <li>Use <strong>WASD</strong> or Arrow Keys to move the red player ball.</li>
              <li><strong>Goal</strong>: Move from the Blue Start (S) to the Green End (E).</li>
              <li><strong>Mechanic</strong>: Press number keys <strong>1-9</strong> to LIFT or PLACE blocks!</li>
              <li><i>Tip: You cannot lift a block if you are standing on it or if another block is on top of it.</i></li>
            </ul>
          </section>

          <section>
            <h3 style={{ color: '#fbbf24', marginBottom: '8px' }}>💾 Sharing</h3>
            <p style={{ lineHeight: '1.6', color: 'var(--text-muted)' }}>
              Want to share your masterpiece?
              <br />
              1. Click the <strong>Save/Export (💾)</strong> button in the toolbar to download a <code>.json</code> file.
              <br />
              2. Send this file to your friends.
              <br />
              3. They can use the <strong>Open (📂)</strong> button to load your maze and play it!
            </p>
          </section>

        </div>

        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button
            onClick={onClose}
            style={{
              background: 'var(--primary)', color: 'white',
              padding: '12px 32px', borderRadius: '12px',
              fontSize: '1rem', fontWeight: 'bold'
            }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpModal;
