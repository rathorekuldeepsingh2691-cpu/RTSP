import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, Plus, Trash2, Save, X } from 'lucide-react';
import './App.css';

const API_BASE = 'http://localhost:5000/api';

function App() {
  // Video state
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [rtspUrl, setRtspUrl] = useState('');
  
  // Overlay state
  const [overlays, setOverlays] = useState([]);
  const [selectedOverlay, setSelectedOverlay] = useState(null);
  const [showAddOverlay, setShowAddOverlay] = useState(false);
  
  // Drag state
  const [draggedOverlay, setDraggedOverlay] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Refs
  const videoRef = useRef(null);
  const containerRef = useRef(null);
  
  // New overlay form state
  const [newOverlay, setNewOverlay] = useState({
    type: 'text',
    content: '',
    position: { x: 50, y: 50 },
    size: { width: 200, height: 50 }
  });

  // Load settings and overlays on mount
  useEffect(() => {
    loadSettings();
    fetchOverlays();
  }, []);

  // ==================== API CALLS ====================

  const loadSettings = async () => {
    try {
      const response = await fetch(`${API_BASE}/settings`);
      const data = await response.json();
      if (data.rtsp_url) {
        setRtspUrl(data.rtsp_url);
      } else {
        setRtspUrl('rtsp://rtsp.stream/pattern');
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setRtspUrl('rtsp://rtsp.stream/pattern');
    }
  };

  const fetchOverlays = async () => {
    try {
      const response = await fetch(`${API_BASE}/overlays`);
      if (!response.ok) throw new Error('Failed to fetch overlays');
      const data = await response.json();
      setOverlays(data);
      console.log('✅ Loaded overlays:', data.length);
    } catch (error) {
      console.error('❌ Error fetching overlays:', error);
    }
  };

  const createOverlay = async () => {
    try {
      if (!newOverlay.content.trim()) {
        alert('Please enter content for the overlay');
        return;
      }

      const response = await fetch(`${API_BASE}/overlays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOverlay)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create overlay');
      }

      const data = await response.json();
      setOverlays([...overlays, data]);
      setShowAddOverlay(false);
      setNewOverlay({
        type: 'text',
        content: '',
        position: { x: 50, y: 50 },
        size: { width: 200, height: 50 }
      });
      console.log('✅ Created overlay:', data._id);
    } catch (error) {
      console.error('❌ Error creating overlay:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const updateOverlay = async (id, updates) => {
    try {
      const response = await fetch(`${API_BASE}/overlays/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update overlay');

      const data = await response.json();
      setOverlays(overlays.map(o => o._id === id ? data : o));
    } catch (error) {
      console.error('❌ Error updating overlay:', error);
    }
  };

  const deleteOverlay = async (id) => {
    try {
      const response = await fetch(`${API_BASE}/overlays/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete overlay');

      setOverlays(overlays.filter(o => o._id !== id));
      if (selectedOverlay === id) {
        setSelectedOverlay(null);
      }
      console.log('✅ Deleted overlay:', id);
    } catch (error) {
      console.error('❌ Error deleting overlay:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // ==================== VIDEO CONTROLS ====================

  const handlePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (videoRef.current) {
      videoRef.current.volume = newVolume;
    }
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    if (videoRef.current) {
      const newMuted = !isMuted;
      videoRef.current.muted = newMuted;
      setIsMuted(newMuted);
      if (newMuted) {
        setVolume(0);
      } else {
        setVolume(0.5);
        videoRef.current.volume = 0.5;
      }
    }
  };

  // ==================== DRAG AND DROP ====================

  const handleMouseDown = (e, overlay) => {
    e.preventDefault();
    e.stopPropagation();
    
    const rect = containerRef.current.getBoundingClientRect();
    setDraggedOverlay(overlay._id);
    setSelectedOverlay(overlay._id);
    setDragOffset({
      x: e.clientX - rect.left - overlay.position.x,
      y: e.clientY - rect.top - overlay.position.y
    });
  };

  const handleMouseMove = (e) => {
    if (draggedOverlay && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left - dragOffset.x, rect.width - 100));
      const y = Math.max(0, Math.min(e.clientY - rect.top - dragOffset.y, rect.height - 50));
      
      const overlay = overlays.find(o => o._id === draggedOverlay);
      if (overlay) {
        setOverlays(overlays.map(o => 
          o._id === draggedOverlay 
            ? { ...o, position: { x, y } }
            : o
        ));
        
        updateOverlay(draggedOverlay, {
          ...overlay,
          position: { x, y }
        });
      }
    }
  };

  const handleMouseUp = () => {
    setDraggedOverlay(null);
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-8">
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            RTSP Livestream Overlay Application
          </h1>
          <p className="text-center text-gray-400 mt-2">
            Professional overlay management for live video streams
          </p>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Video Player Section */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
              
              {/* RTSP URL Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 text-gray-300">
                  📡 RTSP Stream URL
                </label>
                <input
                  type="text"
                  value={rtspUrl}
                  onChange={(e) => setRtspUrl(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none transition"
                  placeholder="rtsp://example.com/stream"
                />
                <p className="text-xs text-gray-400 mt-1">
                  ℹ️ Demo video used. For RTSP streams, backend conversion to HLS/WebRTC required.
                </p>
              </div>

              {/* Video Container */}
              <div 
                ref={containerRef}
                className="relative bg-black rounded-lg overflow-hidden aspect-video cursor-crosshair shadow-2xl"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {/* Video Element */}
                <video
                  ref={videoRef}
                  className="w-full h-full"
                  src="https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"
                  loop
                >
                  Your browser does not support the video tag.
                </video>

                {/* Overlays */}
                {overlays.map(overlay => (
                  <div
                    key={overlay._id}
                    style={{
                      position: 'absolute',
                      left: `${overlay.position.x}px`,
                      top: `${overlay.position.y}px`,
                      width: `${overlay.size.width}px`,
                      height: overlay.type === 'text' ? 'auto' : `${overlay.size.height}px`,
                      cursor: 'move',
                      zIndex: 10,
                      userSelect: 'none'
                    }}
                    onMouseDown={(e) => handleMouseDown(e, overlay)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOverlay(overlay._id);
                    }}
                    className={`overlay-element ${selectedOverlay === overlay._id ? 'ring-2 ring-blue-500' : ''} transition-all`}
                  >
                    {overlay.type === 'text' ? (
                      <div className="bg-black bg-opacity-70 text-white px-4 py-2 rounded font-bold text-xl backdrop-blur-sm">
                        {overlay.content}
                      </div>
                    ) : (
                      <img 
                        src={overlay.content} 
                        alt="Overlay"
                        className="w-full h-full object-contain"
                        draggable="false"
                      />
                    )}
                  </div>
                ))}

                {/* No Overlays Message */}
                {overlays.length === 0 && !isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
                    <div className="text-center text-gray-400">
                      <p className="text-lg">No overlays yet</p>
                      <p className="text-sm">Click + to add your first overlay</p>
                    </div>
                  </div>
                )}

                {/* Controls Overlay */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/80 to-transparent p-4">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={handlePlay}
                      className="bg-blue-600 hover:bg-blue-700 p-3 rounded-full transition transform hover:scale-110 shadow-lg"
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                    </button>

                    <button
                      onClick={toggleMute}
                      className="bg-gray-700 hover:bg-gray-600 p-2 rounded transition"
                      title={isMuted ? 'Unmute' : 'Mute'}
                    >
                      {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                    </button>

                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={handleVolumeChange}
                      className="w-24 accent-blue-600"
                      title="Volume"
                    />

                    <div className="ml-auto text-sm text-gray-300 bg-gray-800 px-3 py-1 rounded">
                      📊 {overlays.length} overlay{overlays.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>

              {/* Stream Info */}
              <div className="mt-4 p-3 bg-gray-700 rounded text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-300">Status:</span>
                  <span className={`font-bold ${isPlaying ? 'text-green-400' : 'text-yellow-400'}`}>
                    {isPlaying ? '🔴 LIVE' : '⏸️ PAUSED'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Overlay Management Panel */}
          <div className="lg:col-span-1">
            <div className="bg-gray-800 rounded-lg p-6 shadow-xl sticky top-8">
              
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">🎨 Overlays</h2>
                <button
                  onClick={() => setShowAddOverlay(true)}
                  className="bg-blue-600 hover:bg-blue-700 p-2 rounded transition transform hover:scale-110 shadow-lg"
                  title="Add Overlay"
                >
                  <Plus size={20} />
                </button>
              </div>

              {/* Add Overlay Form */}
              {showAddOverlay && (
                <div className="mb-4 p-4 bg-gray-700 rounded-lg shadow-lg border border-gray-600">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-lg">➕ New Overlay</h3>
                    <button 
                      onClick={() => setShowAddOverlay(false)}
                      className="hover:bg-gray-600 p-1 rounded transition"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm mb-1 text-gray-300">Type</label>
                      <select
                        value={newOverlay.type}
                        onChange={(e) => setNewOverlay({...newOverlay, type: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                      >
                        <option value="text">📝 Text</option>
                        <option value="image">🖼️ Image</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm mb-1 text-gray-300">
                        {newOverlay.type === 'text' ? 'Text Content' : 'Image URL'}
                      </label>
                      <input
                        type="text"
                        value={newOverlay.content}
                        onChange={(e) => setNewOverlay({...newOverlay, content: e.target.value})}
                        className="w-full px-3 py-2 bg-gray-600 text-white rounded border border-gray-500 focus:border-blue-500 focus:outline-none"
                        placeholder={newOverlay.type === 'text' ? 'Enter text...' : 'https://example.com/image.png'}
                      />
                    </div>

                    <button
                      onClick={createOverlay}
                      className="w-full bg-green-600 hover:bg-green-700 py-2 rounded transition flex items-center justify-center gap-2 font-bold shadow-lg"
                    >
                      <Save size={16} />
                      Create Overlay
                    </button>
                  </div>
                </div>
              )}

              {/* Overlay List */}
              <div className="space-y-2 max-h-[500px] overflow-y-auto">
                {overlays.map(overlay => (
                  <div
                    key={overlay._id}
                    className={`p-3 rounded cursor-pointer transition transform hover:scale-[1.02] ${
                      selectedOverlay === overlay._id 
                        ? 'bg-blue-600 shadow-lg' 
                        : 'bg-gray-700 hover:bg-gray-600'
                    }`}
                    onClick={() => setSelectedOverlay(overlay._id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="font-medium flex items-center gap-2">
                          <span>{overlay.type === 'text' ? '📝' : '🖼️'}</span>
                          <span className="capitalize">{overlay.type}</span>
                        </div>
                        <div className="text-xs text-gray-300 truncate mt-1">
                          {overlay.content.substring(0, 30)}{overlay.content.length > 30 ? '...' : ''}
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Position: ({Math.round(overlay.position.x)}, {Math.round(overlay.position.y)})
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Delete this overlay?')) {
                            deleteOverlay(overlay._id);
                          }
                        }}
                        className="bg-red-600 hover:bg-red-700 p-2 rounded transition ml-2 flex-shrink-0"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}

                {overlays.length === 0 && (
                  <div className="text-center py-12 text-gray-400">
                    <div className="text-4xl mb-4">📭</div>
                    <p className="font-medium">No overlays yet</p>
                    <p className="text-sm mt-2">Click the + button to add your first overlay</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Instructions Section */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 shadow-xl">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            📖 Quick Guide
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300">
            <div>
              <h4 className="font-bold text-white mb-2">🎬 Playback</h4>
              <ul className="space-y-1">
                <li>• Click <strong>Play</strong> to start the stream</li>
                <li>• Use <strong>volume slider</strong> to adjust audio</li>
                <li>• Click <strong>speaker icon</strong> to mute/unmute</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">🎨 Overlays</h4>
              <ul className="space-y-1">
                <li>• Click <strong>+</strong> to add overlay</li>
                <li>• <strong>Drag</strong> overlays to reposition</li>
                <li>• Click overlay to select it</li>
                <li>• Click <strong>trash icon</strong> to delete</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">📝 Text Overlays</h4>
              <ul className="space-y-1">
                <li>• Perfect for titles and announcements</li>
                <li>• Black semi-transparent background</li>
                <li>• Bold white text for readability</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-2">🖼️ Image Overlays</h4>
              <ul className="space-y-1">
                <li>• Use for logos and graphics</li>
                <li>• Supports JPG, PNG, GIF, WebP</li>
                <li>• Transparent PNGs work great</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-900 bg-opacity-30 rounded border border-blue-700">
            <p className="text-sm text-blue-200">
              💡 <strong>Pro Tip:</strong> All changes are automatically saved to MongoDB. Refresh the page to verify persistence!
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-8 text-center text-gray-400 text-sm">
          <p>RTSP Livestream Overlay Application © 2024</p>
          <p className="mt-1">Built with React, Flask & MongoDB</p>
        </div>
      </footer>
    </div>
  );
}

export default App;