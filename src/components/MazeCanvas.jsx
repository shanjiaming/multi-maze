import React, { useRef, useEffect, useState, useCallback } from 'react';
import { CANVAS_SIZE, TOOLS } from '../constants';

const MazeCanvas = ({ maze }) => {
  const {
    layers,
    layerCanvasesRef,
    drawAt,
    tool,
    brushSize,
    viewOffset,
    setViewOffset,
    zoom,
    setZoom,
    gameState,
    playerPos,
    setPlayerPos,
    createLayer,
  } = maze;

  const containerRef = useRef(null);
  const displayCanvasRef = useRef(null);
  const drawingStatusRef = useRef({ isDrawing: false, lastPos: null });
  const [dragStart, setDragStart] = useState(null);

  // For Block Selection
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);

  const getCanvasCoords = (e) => {
    const canvas = displayCanvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    // Screen to Viewport
    const vx = (clientX - rect.left) / zoom + viewOffset.x;
    const vy = (clientY - rect.top) / zoom + viewOffset.y;
    return { x: vx, y: vy };
  };

  // Rendering Loop
  useEffect(() => {
    const canvas = displayCanvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const render = () => {
      // Resize to container
      const container = containerRef.current;
      if (canvas.width !== container.clientWidth || canvas.height !== container.clientHeight) {
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      ctx.scale(zoom, zoom);
      ctx.translate(-viewOffset.x, -viewOffset.y);

      // Draw Desk/Background (The "Tabletop")
      ctx.fillStyle = '#CBD5E1';
      ctx.fillRect(-5000, -5000, 15000, 15000);

      // Draw Main Canvas area (The Workspace)
      // This helps define the bounds of the "Base Layer" if it's empty
      ctx.fillStyle = '#F8FAFC';
      ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

      // Draw Layers (Bottom-to-Top based on placement order)
      for (const id of maze.placedIds) {
        const layer = layers.find(l => l.id === id);
        if (!layer) continue;

        const layerCanvas = layerCanvasesRef.current[layer.id];
        if (layerCanvas) {
          if (layer.type === 'block') {
            // Draw paper shadow and white background for blocks
            ctx.save();
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 15 / zoom;
            ctx.shadowOffsetY = 5 / zoom;
            ctx.fillStyle = 'white';
            ctx.fillRect(layer.rect.x, layer.rect.y, layer.rect.width, layer.rect.height);
            ctx.restore();

            // Draw a very faint inner border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.lineWidth = 1 / zoom;
            ctx.strokeRect(layer.rect.x, layer.rect.y, layer.rect.width, layer.rect.height);
          } else {
            // For Base Layer, just ensure it has a white surface
            ctx.fillStyle = 'white';
            ctx.fillRect(layer.rect.x, layer.rect.y, layer.rect.width, layer.rect.height);

            // Base Layer border
            ctx.strokeStyle = 'rgba(0, 0, 0, 0.15)';
            ctx.lineWidth = 1 / zoom;
            ctx.strokeRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
          }

          // Draw the actual path/wall content
          ctx.drawImage(layerCanvas, layer.rect.x, layer.rect.y);
        }

        // Draw Active Block Highlight (Interactive feedback)
        if (gameState === 'editing' && layer.type === 'block' && layer.id === maze.activeLayerId) {
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 3 / zoom;
          ctx.strokeRect(layer.rect.x, layer.rect.y, layer.rect.width, layer.rect.height);
        }
      }

      // Draw Selection Rect
      if (tool === TOOLS.BLOCK_RECT && selectionStart && selectionEnd) {
        ctx.strokeStyle = '#6366f1';
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(
          selectionStart.x,
          selectionStart.y,
          selectionEnd.x - selectionStart.x,
          selectionEnd.y - selectionStart.y
        );
        ctx.setLineDash([]);
      }

      // Draw End Point
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(maze.endPos.x, maze.endPos.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 12px Inter';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('E', maze.endPos.x, maze.endPos.y + 4);

      // Draw Start Point (Fixed)
      ctx.fillStyle = '#3b82f6'; // Blue for Start
      ctx.beginPath();
      ctx.arc(maze.startPos.x, maze.startPos.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 12px Inter';
      ctx.fillStyle = 'white';
      ctx.textAlign = 'center';
      ctx.fillText('S', maze.startPos.x, maze.startPos.y + 4);

      // Draw Player (Dynamic) - Only in Play Mode
      if (gameState === 'playing') {
        ctx.fillStyle = '#ef4444'; // Red for Player
        ctx.beginPath();
        ctx.arc(playerPos.x, playerPos.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animationFrameId);
  }, [layers, zoom, viewOffset, gameState, playerPos, tool, selectionStart, selectionEnd, maze.activeLayerId, maze.placedIds, maze.startPos, maze.endPos]);

  // Event Handlers
  const handleMouseDown = (e) => {
    const coords = getCanvasCoords(e);
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+Left for Pan
      setDragStart({ x: e.clientX, y: e.clientY, offset: { ...viewOffset } });
      return;
    }

    if (tool === TOOLS.START) {
      maze.setStartPos(coords);
      return;
    }
    if (tool === TOOLS.END) {
      maze.setEndPos(coords);
      return;
    }

    if (tool === TOOLS.BLOCK_RECT) {
      setSelectionStart(coords);
      setSelectionEnd(coords);
    } else if (tool === TOOLS.PENCIL || tool === TOOLS.ERASER) {
      drawingStatusRef.current = { isDrawing: true, lastPos: coords };
      drawAt(coords.x, coords.y, coords.x, coords.y, tool, brushSize);
    }
  };

  const handleMouseMove = (e) => {
    const coords = getCanvasCoords(e);

    if (dragStart) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;
      setViewOffset({
        x: dragStart.offset.x - dx,
        y: dragStart.offset.y - dy
      });
      return;
    }

    if (gameState === 'playing') return;

    if (drawingStatusRef.current.isDrawing) {
      const { lastPos } = drawingStatusRef.current;
      drawAt(coords.x, coords.y, lastPos.x, lastPos.y, tool, brushSize);
      drawingStatusRef.current.lastPos = coords;
    } else if (selectionStart) {
      setSelectionEnd(coords);
    }
  };

  const handleMouseUp = () => {
    drawingStatusRef.current.isDrawing = false;
    if (selectionStart && selectionEnd) {
      const x = Math.min(selectionStart.x, selectionEnd.x);
      const y = Math.min(selectionStart.y, selectionEnd.y);
      const width = Math.abs(selectionEnd.x - selectionStart.x);
      const height = Math.abs(selectionEnd.y - selectionStart.y);
      if (width > 5 && height > 5) {
        // Prevent creating block over Start or End
        const points = [maze.startPos, maze.endPos];
        let blocked = false;

        // Simple point-in-rect check. Could be expanded to circle-in-rect but point is sufficient
        // Actually, let's include the radius to be safer (radius ~15)
        const safetyMargin = 20;

        for (const p of points) {
          // Check if point is inside or very close to the rect
          if (p.x >= x - safetyMargin && p.x <= x + width + safetyMargin &&
            p.y >= y - safetyMargin && p.y <= y + height + safetyMargin) {
            blocked = true;
            break;
          }
        }

        if (!blocked) {
          createLayer('block', { x, y, width, height });
        } else {
          // Maybe visual feedback? For now just don't create.
          console.log("Cannot create block over Start/End points.");
        }
      }
      setSelectionStart(null);
      setSelectionEnd(null);
    }
    // Removed setIsDrawing(false); as it's not defined in the provided context.
    setDragStart(null);
  };

  const handleWheel = (e) => {
    e.preventDefault();
    const zoomSpeed = 0.001;
    const newZoom = Math.min(Math.max(0.1, zoom - e.deltaY * zoomSpeed), 5);

    // Zoom towards mouse
    const coords = getCanvasCoords(e);
    setZoom(newZoom);
    // Adjust offset to keep mouse position stable
    // (This is a bit tricky, let's keep it simple for now)
  };

  // Keyboard Movement for Play Mode
  useEffect(() => {
    if (gameState !== 'playing') return;

    const moveSpeed = 4; // Slightly slower for better control
    const keys = new Set();
    let animationFrameId;

    const handleKeyDown = (e) => keys.add(e.key);
    const handleKeyUp = (e) => keys.delete(e.key);

    const checkCollision = (x, y) => {
      // Check collision at multiple points around the player circle
      const radius = 9; // Slightly smaller than visual radius (10) for forgiving collision
      // Sample 8 points around the circle + center
      const points = [{ x, y }];
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        points.push({
          x: x + Math.cos(angle) * radius,
          y: y + Math.sin(angle) * radius
        });
      }

      for (const p of points) {
        // Find which layer is effectively at this point
        let topmostLayer = null;

        // Iterate placed blocks from top to bottom
        for (let i = maze.placedIds.length - 1; i >= 0; i--) {
          const id = maze.placedIds[i];
          const layer = layers.find(l => l.id === id);
          if (!layer) continue;

          if (p.x >= layer.rect.x && p.x < layer.rect.x + layer.rect.width &&
            p.y >= layer.rect.y && p.y < layer.rect.y + layer.rect.height) {
            topmostLayer = layer;
            break; // Found the top layer at this pixel
          }
        }

        // If we found a layer, check its alpha at this local coordinate
        if (topmostLayer) {
          const canvas = layerCanvasesRef.current[topmostLayer.id];
          if (!canvas) continue;

          // Optimization: Creating context every frame is bad, providing we used willReadFrequently it's okay but still expensive.
          // Better to keep ctx references if possible, but for now strict checking:
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          const lx = Math.floor(p.x - topmostLayer.rect.x);
          const ly = Math.floor(p.y - topmostLayer.rect.y);

          // Boundary safety check
          if (lx >= 0 && ly >= 0 && lx < canvas.width && ly < canvas.height) {
            const pixel = ctx.getImageData(lx, ly, 1, 1).data;
            // A wall is present if the alpha is high (black line)
            // But wait, our walls are black lines on transparent (or white) background?
            // The brush draws black. 
            // If it's a block, it has white background logic in RENDER loop, but the canvas itself only has the drawn strokes.
            // DRAWING LOGIC: Wall = black stroke.
            // If layer is Block: Canvas has transparent bg + black strokes.
            // But visually we render a white rect under it.
            // So physically:
            // 1. If pixel is black (wall), Collision = TRUE.
            // 2. If pixel is transparent but it's a Block, Collision = FALSE (it's floor).
            // 3. If Base Layer: same.

            // Checking Alpha > 128 catches the black strokes.
            if (pixel[3] > 100) return true;
          }
        }
      }
      return false;
    };

    const updatePosition = () => {
      let dx = 0;
      let dy = 0;
      if (keys.has('w') || keys.has('ArrowUp')) dy -= moveSpeed;
      if (keys.has('s') || keys.has('ArrowDown')) dy += moveSpeed;
      if (keys.has('a') || keys.has('ArrowLeft')) dx -= moveSpeed;
      if (keys.has('d') || keys.has('ArrowRight')) dx += moveSpeed;

      if (dx !== 0 || dy !== 0) {
        // Normalize diagonal movement
        if (dx !== 0 && dy !== 0) {
          const factor = 1 / Math.sqrt(2);
          dx *= factor;
          dy *= factor;
        }

        setPlayerPos(prev => {
          // Try X movement
          let nextX = prev.x + dx;
          let nextY = prev.y;
          if (checkCollision(nextX, nextY)) {
            nextX = prev.x; // Blocked X
          }

          // Try Y movement
          nextY = prev.y + dy;
          if (checkCollision(nextX, nextY)) {
            nextY = prev.y; // Blocked Y
          }

          return { x: nextX, y: nextY };
        });
      }
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    animationFrameId = requestAnimationFrame(updatePosition);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      cancelAnimationFrame(animationFrameId);
    };
  }, [gameState, layers, layerCanvasesRef, maze.placedIds]); // Removed playerPos dependency to avoid reset loop

  return (
    <div className="canvas-wrapper" ref={containerRef}>
      <canvas
        ref={displayCanvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default MazeCanvas;
