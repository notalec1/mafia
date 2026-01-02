import React, { useState, useEffect } from 'react';
import { generateRoomId } from '../utils';
import { ref, set } from 'firebase/database';
import { db } from '../firebase';
import { Play } from 'lucide-react';

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

  // SCREEN 1: JOINING
  if (detectedRoom) {
    return (
      <div className="center-container">
        <div className="game-card pop-in">
          <div className="mb-4">
            <div className="text-xs font-black text-slate-500 uppercase tracking-[0.25em] mb-4">JOINING ROOM</div>
            <div className="text-4xl font-mono font-black text-blue-400 bg-slate-900 px-6 py-2 rounded-xl border border-slate-700">
                {detectedRoom}
            </div>
          </div>

          <div className="w-full flex flex-col gap-6 mt-4">
            <div className="text-left w-full">
                <label className="text-xs font-bold text-slate-400 ml-2 mb-2 block uppercase tracking-wider">Your Nickname</label>
                <input 
                  className="input-field"
                  placeholder="EX. GODFATHER"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                  maxLength={12}
                />
            </div>
            
            <button 
              onClick={() => onJoin(detectedRoom, name)}
              disabled={!name}
              className="btn-primary"
            >
              ENTER GAME
            </button>
          </div>
        </div>
      </div>
    );
  }

  // SCREEN 2: MAIN MENU
  return (
    <div className="center-container">
      <div className="text-center mb-20 pop-in">
        <h1 className="text-9xl font-black tracking-tighter mb-4 text-white drop-shadow-2xl">MAFIA</h1>
        <div className="inline-block bg-blue-600 px-4 py-1 rounded-full text-xs font-bold tracking-[0.3em] uppercase">Party Game</div>
      </div>

      <div className="game-card pop-in">
        <button onClick={handleCreateGame} className="btn-primary btn-red py-8 text-2xl flex items-center justify-center gap-4 mb-8">
          <Play fill="currentColor" size={28} /> HOST NEW GAME
        </button>
        
        <div className="relative w-full text-center">
             <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-700"></div></div>
             <span className="relative bg-[#1e293b] px-4 text-xs font-bold text-slate-500 uppercase tracking-widest">How to Join</span>
        </div>

        <p className="mt-8 text-slate-400 text-base font-medium">
          Scan the Host's QR Code with your camera.
        </p>
      </div>
    </div>
  );
}