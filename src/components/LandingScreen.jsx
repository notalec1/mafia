import React, { useState, useEffect } from 'react';
import { generateRoomId } from '../utils';
import { ref, set } from 'firebase/database';
import { db } from '../firebase';
import { Play, LogIn, ArrowRight } from 'lucide-react';

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

  // --- JOIN MODE ---
  if (detectedRoom) {
    return (
      <div className="app-container">
        <div className="card">
          <span className="badge" style={{color: '#4f46e5', background: 'rgba(79, 70, 229, 0.1)'}}>JOINING ROOM</span>
          <div style={{fontSize: '3rem', fontWeight: '900', fontFamily: 'monospace'}}>{detectedRoom}</div>
          
          <div className="full-width">
            <label style={{display: 'block', textAlign: 'left', marginBottom: '8px', color: '#888', fontSize: '0.9rem', fontWeight: 'bold'}}>NICKNAME</label>
            <input 
              className="input-lg"
              placeholder="YOUR NAME"
              value={name}
              onChange={e => setName(e.target.value)}
              maxLength={12}
            />
          </div>

          <button className="btn" onClick={() => onJoin(detectedRoom, name)} disabled={!name}>
            ENTER GAME
          </button>
        </div>
      </div>
    );
  }

  // --- MAIN MENU ---
  return (
    <div className="app-container">
      <div style={{textAlign: 'center', marginBottom: '20px'}}>
        <h1>MAFIA</h1>
        <p style={{fontSize: '1.2rem', marginTop: '10px'}}>The classic party game</p>
      </div>

      <div className="card">
        <button className="btn" onClick={handleCreateGame} style={{display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#ef4444'}}>
          <Play fill="white" size={20} /> HOST NEW GAME
        </button>
        
        <div style={{width: '100%', borderTop: '1px solid #333', margin: '10px 0', position: 'relative'}}>
          <span style={{position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: '#121212', padding: '0 10px', color: '#666', fontSize: '0.8rem', fontWeight: 'bold'}}>OR</span>
        </div>

        <p style={{fontSize: '0.9rem'}}>Scan a Host's QR code to join.</p>
      </div>
    </div>
  );
}