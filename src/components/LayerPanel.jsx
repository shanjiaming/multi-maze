import React from 'react';

const LayerPanel = ({ maze }) => {
  const {
    layers,
    placedIds,
    activeLayerId,
    setActiveLayerId,
    liftBlock,
    placeBlock,
    deleteLayer,
    gameState,
    playerPos
  } = maze;

  const getTopmostLayerAtPlayer = () => {
    for (let i = placedIds.length - 1; i >= 0; i--) {
      const id = placedIds[i];
      const layer = layers.find(l => l.id === id);
      if (!layer) continue;
      const { x, y, width, height } = layer.rect;
      if (playerPos.x >= x && playerPos.x < x + width && playerPos.y >= y && playerPos.y < y + height) {
        return layer;
      }
    }
    return null;
  };

  const isLayerLockedByPlayer = (layerId) => {
    if (gameState !== 'playing') return false;
    const top = getTopmostLayerAtPlayer();
    if (!top) return false;

    // Logic: If player is on or below top, locked.
    const topIdx = placedIds.indexOf(top.id);
    const targetIdx = placedIds.indexOf(layerId);
    return targetIdx !== -1 && targetIdx <= topIdx;
  };

  const isLayerCovered = (layerId) => {
    const idx = placedIds.indexOf(layerId);
    if (idx === -1) return false;

    // Check all blocks above it in the stack
    const targetLayer = layers.find(l => l.id === layerId);
    if (!targetLayer) return false;

    for (let i = idx + 1; i < placedIds.length; i++) {
      const topId = placedIds[i];
      const topLayer = layers.find(l => l.id === topId);
      if (!topLayer) continue;

      // Rect overlap?
      const r1 = targetLayer.rect;
      const r2 = topLayer.rect;
      const overlap = !(r1.x + r1.width <= r2.x || r1.x >= r2.x + r2.width || r1.y + r1.height <= r2.y || r1.y >= r2.y + r2.height);
      if (overlap) return true;
    }
    return false;
  };

  const placedLayers = placedIds.map(id => layers.find(l => l.id === id)).reverse();
  const unplacedLayers = layers.filter(l => !placedIds.includes(l.id));

  const renderLayer = (layer, isPlaced) => {
    const isBase = layer.type === 'base';
    const locked = isPlaced && isLayerLockedByPlayer(layer.id);
    const covered = isPlaced && isLayerCovered(layer.id);
    const isActive = layer.id === activeLayerId;

    return (
      <div
        key={layer.id}
        onClick={() => gameState === 'editing' && setActiveLayerId(layer.id)}
        className="glass-panel"
        style={{
          padding: '10px',
          border: isActive ? '1px solid var(--primary)' : '1px solid var(--border)',
          background: isActive ? 'rgba(99, 102, 241, 0.1)' : 'var(--glass)',
          cursor: gameState === 'editing' ? 'pointer' : 'default',
          opacity: (locked || (isPlaced && covered)) ? 0.6 : 1,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 500, fontSize: '12px' }}>
            {layer.name} {locked && '🔒'} {covered && ' (Covered)'}
          </span>
          {!isBase && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (isPlaced) liftBlock(layer.id);
                else placeBlock(layer.id);
              }}
              disabled={locked || covered}
              style={{
                backgroundColor: isPlaced ? 'var(--accent-s)' : 'var(--accent-e)',
                padding: '4px 8px',
                borderRadius: '6px',
                fontSize: '10px',
                color: 'white',
                fontWeight: 'bold'
              }}
            >
              {isPlaced ? 'LIFT' : 'PLACE'}
            </button>
          )}
        </div>

        {gameState === 'editing' && !isBase && (
          <button
            onClick={(e) => { e.stopPropagation(); deleteLayer(layer.id); }}
            style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px' }}
          >
            Delete
          </button>
        )}
      </div>
    );
  };

  return (
    <div className="glass-panel layer-panel-container" style={{
      position: 'absolute', right: '20px', top: '120px', width: '280px',
      maxHeight: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column',
      padding: '16px', gap: '16px', pointerEvents: 'auto', zIndex: 90, overflowY: 'auto'
    }}>
      <section>
        <h3 style={headerStyle}>Placed Layers</h3>
        <div style={listStyle}>{placedLayers.map(l => (l ? renderLayer(l, true) : null))}</div>
      </section>

      {unplacedLayers.length > 0 && (
        <section>
          <h3 style={headerStyle}>Lifted (Inventory)</h3>
          <div style={listStyle}>{unplacedLayers.map(l => (l ? renderLayer(l, false) : null))}</div>
        </section>
      )}
    </div>
  );
};

const headerStyle = { fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' };
const listStyle = { display: 'flex', flexDirection: 'column', gap: '8px' };

export default LayerPanel;
