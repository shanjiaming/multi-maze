import { useState, useCallback, useRef, useEffect } from 'react';
import { CANVAS_SIZE, LAYER_TYPES } from '../constants';
import LZString from 'lz-string';

export const useMaze = () => {
  const [layers, setLayers] = useState([]); // All existing blocks
  const [placedIds, setPlacedIds] = useState([]); // Ordered list of blocks currently in the world (bottom to top)
  const [activeLayerId, setActiveLayerId] = useState(null);
  const [tool, setTool] = useState('pencil');
  const [brushSize, setBrushSize] = useState(5);
  const [gameState, setGameState] = useState('editing');
  const [startPos, setStartPos] = useState({ x: 2000, y: 2500 });
  const [playerPos, setPlayerPos] = useState({ x: 2000, y: 2500 });
  const [endPos, setEndPos] = useState({ x: 3000, y: 2500 });
  const [viewOffset, setViewOffset] = useState({ x: 1500, y: 2000 });
  const [zoom, setZoom] = useState(0.5);
  const layerCanvasesRef = useRef({});

  const createLayer = useCallback((type, rect = null, name = null) => {
    const id = crypto.randomUUID();
    const isBase = type === LAYER_TYPES.BASE;
    const newLayer = {
      id,
      name: name || (isBase ? 'Base Layer' : `Block ${layers.length}`),
      type,
      rect: rect || { x: 0, y: 0, width: CANVAS_SIZE, height: CANVAS_SIZE },
    };

    const canvas = document.createElement('canvas');
    canvas.width = newLayer.rect.width;
    canvas.height = newLayer.rect.height;

    layerCanvasesRef.current[id] = canvas;

    setLayers(prev => [...prev, newLayer]);
    setPlacedIds(prev => [...prev, id]);
    setActiveLayerId(id);
    return id;
  }, [layers.length]);

  // Ensure single base layer initialization
  const initialized = useRef(false);
  useEffect(() => {
    if (!initialized.current) {
      initialized.current = true;
      createLayer(LAYER_TYPES.BASE);
    }
  }, [createLayer]);

  const getTopmostLayerAt = useCallback((x, y) => {
    // Traverse placedIds from end to start (top to bottom)
    for (let i = placedIds.length - 1; i >= 0; i--) {
      const id = placedIds[i];
      const layer = layers.find(l => l.id === id);
      if (!layer) continue;
      const { x: lx, y: ly, width: lw, height: lh } = layer.rect;
      if (x >= lx && x < lx + lw && y >= ly && y < ly + lh) {
        return layer;
      }
    }
    return null;
  }, [layers, placedIds]);

  const drawAt = useCallback((x, y, prevX, prevY, currentTool, size) => {
    // Interpolate between prev and current to ensure continuity across layers
    const dist = Math.hypot(x - prevX, y - prevY);
    // Use a step size that ensures overlap (half the brush size)
    const stepSize = Math.max(1, size / 3);
    const steps = Math.max(1, Math.ceil(dist / stepSize));

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const curX = prevX + (x - prevX) * t;
      const curY = prevY + (y - prevY) * t;

      const targetLayer = getTopmostLayerAt(curX, curY);
      if (!targetLayer) continue;

      const canvas = layerCanvasesRef.current[targetLayer.id];
      if (!canvas) continue;
      const ctx = canvas.getContext('2d');

      ctx.save();
      if (currentTool === 'eraser') {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.fillStyle = 'black'; // Color doesn't matter for destination-out
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = 'black';
      }

      ctx.beginPath();
      ctx.arc(curX - targetLayer.rect.x, curY - targetLayer.rect.y, size / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }, [getTopmostLayerAt]);

  const liftBlock = useCallback((id) => {
    // Cannot lift if block is covered by another block
    const idx = placedIds.indexOf(id);
    if (idx === -1) return false;

    // Check overlap with any block ABOVE it
    const layer = layers.find(l => l.id === id);
    if (!layer) return false;

    for (let i = idx + 1; i < placedIds.length; i++) {
      const topId = placedIds[i];
      const topLayer = layers.find(l => l.id === topId);
      if (!topLayer) continue;

      // Rect overlap check
      const r1 = layer.rect;
      const r2 = topLayer.rect;
      const overlap = !(r1.x + r1.width <= r2.x || r1.x >= r2.x + r2.width || r1.y + r1.height <= r2.y || r1.y >= r2.y + r2.height);

      if (overlap) {
        // Blocked by top layer
        return false;
      }
    }

    // Also check if player is standing on it (Locking logic)
    if (gameState === 'playing') {
      if (playerPos.x >= layer.rect.x && playerPos.x < layer.rect.x + layer.rect.width &&
        playerPos.y >= layer.rect.y && playerPos.y < layer.rect.y + layer.rect.height) {
        // Player is standing on this block. Weight prevents lifting.
        // AND check if player is on a block ABOVE this one?
        // Actually, if a block is above this one, we already returned false.
        // So if we are here, this block is EXPOSED.
        // And if player is on it, it's locked.
        return false;
      }
    }

    setPlacedIds(prev => prev.filter(pid => pid !== id));
    return true;
  }, [placedIds, layers, gameState, playerPos]);

  const placeBlock = useCallback((id) => {
    // Check if placing it would trap the player (if wall at playerPos)
    // OR if simply placing the block at all would crush the player (block rect covers player)
    if (gameState === 'playing') {
      const layer = layers.find(l => l.id === id);
      if (!layer) return false;

      // 1. Check if Block covers Player (Crushing prevention)
      // Player is a physical object. You cannot place a solid paper on top of him.
      if (playerPos.x >= layer.rect.x && playerPos.x < layer.rect.x + layer.rect.width &&
        playerPos.y >= layer.rect.y && playerPos.y < layer.rect.y + layer.rect.height) {
        return false;
      }
    }

    // 2. No Start/End check needed as per new physics rules

    setPlacedIds(prev => [...prev.filter(pid => pid !== id), id]);
    return true;
  }, [layers, gameState, playerPos]);

  const deleteLayer = useCallback((id) => {
    setLayers(prev => prev.filter(l => l.id !== id));
    setPlacedIds(prev => prev.filter(pid => pid !== id));
    delete layerCanvasesRef.current[id];
  }, []);

  const loadMapData = useCallback((data) => {
    // Support legacy saves where playerPos was the start
    setStartPos(data.startPos || data.playerPos);
    setEndPos(data.endPos);
    setPlacedIds(data.placedIds || []);

    // Clear existing canvases
    Object.keys(layerCanvasesRef.current).forEach(id => {
      delete layerCanvasesRef.current[id];
    });

    const newLayers = data.layers.map(l => {
      const img = new Image();
      img.src = l.dataUrl;
      const canvas = document.createElement('canvas');
      canvas.width = l.rect.width;
      canvas.height = l.rect.height;
      const ctx = canvas.getContext('2d');
      img.onload = () => ctx.drawImage(img, 0, 0);
      layerCanvasesRef.current[l.id] = canvas;
      return {
        id: l.id,
        name: l.name,
        type: l.type,
        rect: l.rect,
      };
    });
    setLayers(newLayers);
    return true; // Indicate success
  }, [setStartPos, setEndPos, setPlacedIds, setLayers]);

  const exportMaze = useCallback(() => {
    const data = {
      startPos,
      endPos,
      layers: layers.map(l => ({
        ...l,
        dataUrl: layerCanvasesRef.current[l.id].toDataURL()
      })),
      placedIds
    };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'maze.json';
    a.click();
  }, [layers, startPos, endPos, placedIds]);

  const importMaze = useCallback((file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result);
        loadMapData(data);
      } catch (e) {
        console.error("Error parsing imported file:", e);
      }
    };
    reader.readAsText(file);
  }, [loadMapData]);

  // --- Share via URL ---
  const getShareableLink = useCallback(() => {
    const data = {
      layers: layers.map(l => ({
        ...l,
        dataUrl: layerCanvasesRef.current[l.id].toDataURL()
      })),
      placedIds,
      startPos,
      endPos,
      // We don't save playerPos (reset to start), tool, zoom, etc.
    };
    const jsonString = JSON.stringify(data);
    const compressed = LZString.compressToEncodedURIComponent(jsonString);
    const url = `${window.location.origin}${window.location.pathname}?map=${compressed}`;
    return url;
  }, [layers, placedIds, startPos, endPos]);

  const importMazeFromUrl = useCallback((compressed) => {
    try {
      const jsonString = LZString.decompressFromEncodedURIComponent(compressed);
      if (!jsonString) {
        console.error("Failed to decompress map data");
        return false;
      }
      const data = JSON.parse(jsonString);
      return loadMapData(data); // Returns true/false
    } catch (e) {
      console.error("Error parsing map from URL:", e);
      return false;
    }
  }, [loadMapData]);

  return {
    layers,
    activeLayerId,
    setActiveLayerId,
    tool,
    setTool,
    brushSize,
    setBrushSize,
    layerCanvasesRef,
    createLayer,
    drawAt,
    deleteLayer,
    gameState,
    setGameState,
    startPos,
    setStartPos,
    playerPos,
    setPlayerPos,
    endPos,
    setEndPos,
    viewOffset,
    setViewOffset,
    zoom,
    setZoom,
    setLayers,
    placedIds,
    liftBlock,
    placeBlock,
    exportMaze,
    importMaze,
    getShareableLink,
    importMazeFromUrl,
    loadMapData,
    setPlacedIds,
  };
};
