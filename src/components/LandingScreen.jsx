import React, { useState, useEffect } from 'react';
import { generateRoomId } from '../utils';
import { ref, set } from 'firebase/database';
import { db } from '../firebase';
import { Play, LogIn } from 'lucide-react';

export default function LandingScreen({ onHost, onJoin, joinToken }) {
  const [name, setName] = useState("");
  const [detectedRoom, setDetectedRoom] = useState(null);

  useEffect(() => {
    if (joinToken) {
      try {
        const data = JSON.parse(atob(joinToken));
        if (data.r) setDetectedRoom(data.r);
      } catch (e) { console.error("Invalid QR"); }
    }
  }, [joinToken]);

  const handleCreateGame = async () => {
    const newCode = generateRoomId();
    await set(ref(db, `rooms/${newCode}`), {
      gameState: "LOBBY",
      createdAt: Date.now(),
      players: {},
      config: { mafia: 1, doctor: 1, detective: 1, peacefulFirstNight: false }
    });
    onHost(newCode);
  };

  // --- JOIN MODE (QR SCANNED) ---
  if (detectedRoom) {
    return (
      <div className="container">
        <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '0' }}>JOINING ROOM</h2>
          <div style={{ textAlign: 'center', fontSize: '2rem', fontWeight: 'bold', color: '#4f46e5' }}>
            {detectedRoom}
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: '10px', color: '#888' }}>YOUR NAME</label>
            <input 
              className="large-input"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="NICKNAME"
              maxLength={12}
              autoFocus
            />
          </div>

          <button className="btn" onClick={() => onJoin(detectedRoom, name)} disabled={!name}>
            ENTER LOBBY
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN MENU ---
  return (
    <div className="container">
      <h1 className="title">MAFIA</h1>
      <p className="subtitle">The classic party game, reimagined.</p>

      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <button className="btn" onClick={handleCreateGame} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
          <Play size={20} /> HOST GAME
        </button>
        
        <div style={{ textAlign: 'center', color: '#444', fontWeight: 'bold' }}>— OR —</div>

        <div style={{ textAlign: 'center', color: '#888' }}>
          Scan a host's QR code to join.
        </div>
      </div>
    </div>
  );
}