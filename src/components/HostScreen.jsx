import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase';
import { shuffleArray } from '../utils';
import { Users, Shield, Sword, Search, Zap } from 'lucide-react';

export default function HostScreen({ roomCode }) {
  const [game, setGame] = useState(null);
  const [config, setConfig] = useState({ mafia: 1, doctor: 1, detective: 1, peacefulFirstNight: false });

  useEffect(() => {
    const roomRef = ref(db, `rooms/${roomCode}`);
    return onValue(roomRef, (snapshot) => { if (snapshot.exists()) setGame(snapshot.val()); });
  }, [roomCode]);

  useEffect(() => {
    if (game?.gameState === "LOBBY") {
      const pCount = game.players ? Object.keys(game.players).length : 0;
      setConfig(prev => ({
        ...prev,
        mafia: Math.max(1, Math.floor(pCount / 4)),
        doctor: pCount > 2 ? 1 : 0,
        detective: pCount > 4 ? 1 : 0,
        peacefulFirstNight: pCount <= 4
      }));
    }
  }, [game?.players]);

  if (!game) return <div className="container">Loading...</div>;

  const players = game.players ? Object.values(game.players) : [];
  const joinUrl = window.location.href.split('?')[0] + `?q=${btoa(JSON.stringify({r: roomCode}))}`;

  const startGame = () => {
    const roles = [];
    for(let i=0; i<config.mafia; i++) roles.push("MAFIA");
    for(let i=0; i<config.doctor; i++) roles.push("DOCTOR");
    for(let i=0; i<config.detective; i++) roles.push("DETECTIVE");
    while(roles.length < players.length) roles.push("VILLAGER");
    
    const shuffled = shuffleArray(roles).slice(0, players.length);
    const updates = {};
    players.forEach((p, i) => {
      updates[`rooms/${roomCode}/players/${p.id}/role`] = shuffled[i] || "VILLAGER";
      updates[`rooms/${roomCode}/players/${p.id}/isAlive`] = true;
      updates[`rooms/${roomCode}/players/${p.id}/voteTarget`] = null;
    });
    updates[`rooms/${roomCode}/config`] = config;
    updates[`rooms/${roomCode}/gameState`] = "NIGHT";
    updates[`rooms/${roomCode}/turnCount`] = 1;
    updates[`rooms/${roomCode}/publicMessage`] = "NIGHT HAS FALLEN";
    updates[`rooms/${roomCode}/nightActions`] = null;
    update(ref(db), updates);
  };

  // --- LOBBY VIEW ---
  if (game.gameState === "LOBBY") {
    return (
      <div className="container" style={{ justifyContent: 'flex-start', paddingTop: '4rem' }}>
        
        {/* BIG ROOM CODE HEADER */}
        <div className="room-code-display">
          <span style={{ color: '#888', letterSpacing: '4px', marginBottom: '10px' }}>ROOM CODE</span>
          <div className="code-box">{roomCode}</div>
        </div>

        <div className="host-grid">
          {/* LEFT: QR & PLAYERS */}
          <div className="card">
            <div style={{ background: 'white', padding: '1rem', borderRadius: '12px', alignSelf: 'center' }}>
              <QRCodeSVG value={joinUrl} size={200} />
            </div>
            
            <div style={{ marginTop: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderBottom: '1px solid #333', paddingBottom: '10px' }}>
                <Users size={20} color="#888" />
                <span style={{ fontWeight: 'bold' }}>PLAYERS ({players.length})</span>
              </div>
              <div className="player-list">
                {players.length === 0 && <span style={{ color: '#555', fontStyle: 'italic' }}>Waiting for players...</span>}
                {players.map(p => (
                  <div key={p.id} className="player-tag">{p.name}</div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: SETTINGS */}
          <div className="card" style={{ justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ marginTop: 0 }}>GAME SETTINGS</h3>
              
              <div className="setting-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Sword size={18} color="#ef4444" /> Mafia
                </span>
                <div className="counter-controls">
                  <button className="counter-btn" onClick={() => setConfig({...config, mafia: Math.max(0, config.mafia-1)})}>-</button>
                  <span>{config.mafia}</span>
                  <button className="counter-btn" onClick={() => setConfig({...config, mafia: config.mafia+1})}>+</button>
                </div>
              </div>

              <div className="setting-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Shield size={18} color="#22c55e" /> Doctor
                </span>
                <div className="counter-controls">
                  <button className="counter-btn" onClick={() => setConfig({...config, doctor: Math.max(0, config.doctor-1)})}>-</button>
                  <span>{config.doctor}</span>
                  <button className="counter-btn" onClick={() => setConfig({...config, doctor: config.doctor+1})}>+</button>
                </div>
              </div>

              <div className="setting-row">
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Search size={18} color="#3b82f6" /> Detective
                </span>
                <div className="counter-controls">
                  <button className="counter-btn" onClick={() => setConfig({...config, detective: Math.max(0, config.detective-1)})}>-</button>
                  <span>{config.detective}</span>
                  <button className="counter-btn" onClick={() => setConfig({...config, detective: config.detective+1})}>+</button>
                </div>
              </div>

              <div className="setting-row" onClick={() => setConfig({...config, peacefulFirstNight: !config.peacefulFirstNight})} style={{ cursor: 'pointer', border: config.peacefulFirstNight ? '1px solid #22c55e' : '1px solid transparent' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Zap size={18} color={config.peacefulFirstNight ? "#22c55e" : "#666"} /> Peaceful Night 1
                </span>
                <div style={{ width: '20px', height: '20px', borderRadius: '50%', background: config.peacefulFirstNight ? '#22c55e' : '#333' }}></div>
              </div>
            </div>

            <button className="btn" onClick={startGame} disabled={players.length < 2}>
              START GAME
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- GAME IN PROGRESS VIEW ---
  return (
    <div className="container">
      <div style={{ textAlign: 'center' }}>
        <h2 style={{ color: '#888', letterSpacing: '4px', marginBottom: '20px' }}>CURRENT PHASE</h2>
        <h1 style={{ fontSize: '5rem', fontWeight: '900', lineHeight: '1' }}>{game.publicMessage}</h1>
      </div>
      
      {/* Visual Grid of players for TV */}
      <div className="host-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', width: '100%' }}>
        {players.map(p => (
           <div key={p.id} style={{ 
              background: '#222', 
              padding: '1rem', 
              borderRadius: '12px', 
              textAlign: 'center',
              opacity: p.isAlive ? 1 : 0.5,
              border: !p.isAlive ? '1px solid #ef4444' : '1px solid #333'
           }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{p.isAlive ? '🙂' : '💀'}</div>
              <div style={{ fontWeight: 'bold' }}>{p.name}</div>
           </div>
        ))}
      </div>
    </div>
  );
}