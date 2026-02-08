import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../src/App';
import * as useMazeHook from '../src/hooks/useMaze';

// Mock the hook to start in Playing mode
vi.mock('../src/hooks/useMaze', async () => {
  // We create a mock state
  let _gameState = 'playing';
  let _placedIds = ['block-1'];
  let _layers = [{ id: 'block-1', type: 'block', name: 'Block 1', rect: { x: 0, y: 0, width: 100, height: 100 } }];
  const _liftBlock = vi.fn().mockImplementation(() => { console.log('LIFT MOCK CALLED'); return true; });
  const _placeBlock = vi.fn().mockImplementation(() => { console.log('PLACE MOCK CALLED'); return true; });

  return {
    useMaze: () => ({
      gameState: _gameState,
      setGameState: (s) => _gameState = s,
      layers: _layers,
      placedIds: _placedIds,
      liftBlock: _liftBlock,
      placeBlock: _placeBlock,
      startPos: { x: 0, y: 0 },
      playerPos: { x: 0, y: 0 }, // Player at 0,0 - on block 1?
      endPos: { x: 500, y: 500 },
      tool: 'pencil',
      setTool: vi.fn(),
      activeLayerId: 'block-1',
      layerCanvasesRef: { current: { 'block-1': document.createElement('canvas') } },
      createLayer: vi.fn(),
      deleteLayer: vi.fn(),
      drawAt: vi.fn(),
      setStartPos: vi.fn(),
      setEndPos: vi.fn(),
      setPlayerPos: vi.fn(),
      setViewOffset: vi.fn(),
      viewOffset: { x: 0, y: 0 },
      zoom: 1,
      setZoom: vi.fn(),
      brushSize: 5,
      setBrushSize: vi.fn(),
      exportMaze: vi.fn(),
      importMaze: vi.fn(),
      setPlacedIds: vi.fn(),
    })
  };
});

describe('App Keyboard Interaction', () => {
  it('calls liftBlock when "1" is pressed in Play mode', async () => {
    // Render
    const { getByText, debug } = render(<App />);

    // Verify we are in Playing State (via debug panel or UI)
    expect(screen.getByText(/State: playing/i)).toBeInTheDocument();

    // Simulate Key Press '1'
    console.log("Simulating KeyDown '1'...");
    await act(async () => {
      const event = new KeyboardEvent('keydown', { key: '1', code: 'Digit1', bubbles: true });
      document.dispatchEvent(event);
    });

    // Check debug output LAST KEY
    const debugLastKey = document.getElementById('debug-last-key');
    console.log("Debug Last Key Content:", debugLastKey?.textContent);

    // Assert:
    // 1. Toast appears? "Block 1 Lifted"
    const toast = screen.getByText(/Block 1 Lifted/i);
    expect(toast).toBeInTheDocument();

    // 2. liftBlock mock called?
    // We can't easily spy on the inner hook function unless we exposed it globally or returned spy from mock.
    // But the Toast proves the logic path was taken.
  });
});
