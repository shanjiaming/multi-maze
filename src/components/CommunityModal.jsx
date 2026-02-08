import React, { useState, useEffect } from 'react';
import { supabase, isBackendReady } from '../supabaseClient';

// MOCK DATA for demonstration (Fallback)
const MOCK_COMMUNITY_MAPS = [
  { id: '1', name: 'The Spiral (Demo)', author: 'DevTeam', likes: 42, date: '2023-10-01', description: 'A classic spiral maze.' },
  { id: '2', name: 'Impossible Box (Demo)', author: 'SpeedRunner', likes: 120, date: '2023-10-05', description: 'Can you solve it?' },
];

const CommunityModal = ({ onClose, onImport, maze }) => {
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('browse'); // 'browse' | 'upload'
  const [connected, setConnected] = useState(false);

  // Upload Form State
  const [uploadName, setUploadName] = useState('');
  const [uploadAuthor, setUploadAuthor] = useState('');

  useEffect(() => {
    setConnected(isBackendReady());
    if (isBackendReady()) {
      fetchMaps();
    } else {
      setMaps(MOCK_COMMUNITY_MAPS);
    }
  }, []);

  const fetchMaps = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('maps')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Error fetching maps:', error);
    } else {
      setMaps(data || []);
    }
    setLoading(false);
  };

  const handleUpload = async () => {
    if (!uploadName || !uploadAuthor) return alert("Please fill in all fields");

    // Generate Map JSON
    // accessing maze ref/state? maze object is passed as prop
    // We need to use `maze.getShareableLink` logic but get the JSON object instead.
    // Let's manually construct the data similar to exportMaze
    const mapData = {
      startPos: maze.startPos,
      endPos: maze.endPos,
      layers: maze.layers.map(l => ({
        ...l,
        dataUrl: maze.layerCanvasesRef.current[l.id]?.toDataURL()
      })),
      placedIds: maze.placedIds
    };

    try {
      // Validation: Ensure data URLs are generated
      // (Optional: check if any layer failed)
    } catch (e) {
      console.error("Error preparing map data", e);
      alert("Error preparing map data: " + e.message);
      return;
    }

    // Check size - simplistic check
    const jsonStr = JSON.stringify(mapData);
    if (jsonStr.length > 5000000) { // 5MB limit
      if (!confirm("Map is very large (>5MB). Upload might be slow. Continue?")) return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('maps')
      .insert([
        {
          name: uploadName,
          author: uploadAuthor,
          data: mapData,
          likes: 0
        },
      ]);

    if (error) {
      alert("Upload failed: " + error.message);
    } else {
      alert("Upload Successful!");
      setUploadName('');
      setActiveTab('browse');
      fetchMaps();
    }
    setLoading(false);
  };

  return (
    <div className="flex-center" style={{
      position: 'fixed', inset: 0, zIndex: 2000,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(5px)'
    }} onClick={onClose}>
      <div
        className="glass-panel"
        style={{
          width: '90%', maxWidth: '800px', height: '80vh',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
          padding: 0, color: 'var(--text-main)'
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '20px', borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: 'rgba(255,255,255,0.05)'
        }}>
          <h2 style={{ fontSize: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
            🌍 Community Hub
            {!connected && <span style={{ fontSize: '0.6em', background: 'var(--primary)', padding: '2px 8px', borderRadius: '10px' }}>DEMO MODE</span>}
          </h2>
          <button onClick={onClose} style={{ fontSize: '24px', opacity: 0.7 }}>&times;</button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
          <button
            onClick={() => setActiveTab('browse')}
            style={{
              flex: 1, padding: '16px', fontWeight: 'bold',
              background: activeTab === 'browse' ? 'var(--glass)' : 'transparent',
              borderBottom: activeTab === 'browse' ? '2px solid var(--primary)' : 'none'
            }}
          >
            Browse Maps
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            style={{
              flex: 1, padding: '16px', fontWeight: 'bold',
              background: activeTab === 'upload' ? 'var(--glass)' : 'transparent',
              borderBottom: activeTab === 'upload' ? '2px solid var(--primary)' : 'none'
            }}
          >
            Upload My Map
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>

          {activeTab === 'browse' && (
            <>
              {!connected && (
                <div style={{ background: 'rgba(239, 68, 68, 0.2)', padding: '10px', borderRadius: '8px', marginBottom: '20px', fontSize: '0.9rem', border: '1px solid rgba(239,68,68,0.5)' }}>
                  <strong>Note:</strong> You are viewing demo data. To connect to real community maps, configure Supabase credentials in code.
                </div>
              )}

              {loading ? <p>Loading...</p> : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
                  {maps.map(map => (
                    <div key={map.id} className="glass-panel" style={{ padding: '16px', transition: 'transform 0.2s', cursor: 'pointer' }}>
                      <div style={{ height: '120px', background: '#334155', borderRadius: '8px', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                        Map Preview
                      </div>
                      <h3 style={{ fontWeight: 'bold', marginBottom: '4px' }}>{map.name}</h3>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>by {map.author}</p>
                      <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.8rem' }}>❤️ {map.likes || 0}</span>
                        <button
                          onClick={() => {
                            if (!connected) return alert("Demo Mode: Cannot actually load this map!");
                            if (map.data) {
                              // We need a way to import raw JSON data
                              // hooks/useMaze has _processImportedMazeData but it's internal.
                              // We need to expose a method or passing logic.
                              // Passed prop 'onImport' from App can be used?
                              // App needs to define handleImport.
                              onImport(map.data);
                              onClose();
                            }
                          }}
                          style={{ background: 'var(--primary)', padding: '4px 12px', borderRadius: '6px', fontSize: '0.8rem' }}
                        >
                          Play
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {activeTab === 'upload' && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              {!connected ? (
                <>
                  <div style={{ fontSize: '48px', marginBottom: '20px' }}>☁️</div>
                  <h3 style={{ fontSize: '1.2rem', marginBottom: '10px' }}>Backend Not Connected</h3>
                  <p style={{ color: 'var(--text-muted)', maxWidth: '400px', margin: '0 auto 20px' }}>
                    To enable uploading, you need to set up a Supabase project and add the API keys to your environment.
                  </p>
                </>
              ) : (
                <div style={{ maxWidth: '400px', margin: '0 auto', textAlign: 'left' }}>
                  <h3 style={{ marginBottom: '20px' }}>Upload Current Map</h3>

                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Map Name</label>
                  <input
                    type="text"
                    value={uploadName}
                    onChange={e => setUploadName(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'white', marginBottom: '16px' }}
                  />

                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.9rem' }}>Author Name</label>
                  <input
                    type="text"
                    value={uploadAuthor}
                    onChange={e => setUploadAuthor(e.target.value)}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'rgba(0,0,0,0.3)', color: 'white', marginBottom: '24px' }}
                  />

                  <button
                    onClick={handleUpload}
                    disabled={loading}
                    style={{ width: '100%', padding: '12px', background: 'var(--primary)', borderRadius: '8px', fontWeight: 'bold', opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? 'Uploading...' : 'Publish to Community'}
                  </button>
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default CommunityModal;
