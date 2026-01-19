import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase';
import { shuffleArray } from '../utils';
import { Settings, Users, Shield, Sword, Search, Play, Zap, Scan } from 'lucide-react';

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

  if (!game) return <div className="host-wrapper">Loading...</div>;

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

  if (game.gameState !== "LOBBY") {
    return (
      <div className="ingame-wrapper">
        <h1 className="ingame-message">{game.publicMessage}</h1>
        <div className="player-grid">
          {players.map(p => (
            <div key={p.id} className={`player-card ${!p.isAlive ? 'dead' : ''}`}>
              {p.name}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // --- LOBBY VIEW ---
  return (
    <div className="host-wrapper">
      
      {/* HEADER */}
      <div className="room-header">
        <div className="room-label">Room Code</div>
        <div className="room-code">{roomCode}</div>
      </div>

      <div className="host-grid">
        
        {/* LEFT COLUMN: JOINING INFO */}
        <div className="ui-card">
          <h2 className="card-title">
            <Scan size={24} /> Scan to Join
          </h2>
          
          <div className="qr-container">
            <div className="qr-box">
              <QRCodeSVG value={joinUrl} size={240} />
            </div>
          </div>

          <div className="lobby-status">
            <div className="lobby-header">
              <span style={{display: 'flex', alignItems: 'center', gap: '8px'}}>
                <Users size={18} /> Lobby
              </span>
              <span>{players.length} Connected</span>
            </div>

            {players.length === 0 ? (
              <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                Waiting for players to connect...
              </div>
            ) : (
              <div className="player-pills">
                {players.map(p => (
                  <div key={p.id} className="player-pill">
                    {p.name}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: SETTINGS */}
        <div className="ui-card">
          <h2 className="card-title">
            <Settings size={24} /> Game Config
          </h2>

          <div className="config-list">
            <CounterRow 
              label="Mafia" 
              icon={<Sword size={22} color="var(--danger)" />} 
              value={config.mafia} 
              onChange={(v) => setConfig({...config, mafia: v})} 
            />
            <CounterRow 
              label="Doctor" 
              icon={<Shield size={22} color="var(--success)" />} 
              value={config.doctor} 
              onChange={(v) => setConfig({...config, doctor: v})} 
            />
            <CounterRow 
              label="Detective" 
              icon={<Search size={22} color="var(--primary)" />} 
              value={config.detective} 
              onChange={(v) => setConfig({...config, detective: v})} 
            />

            <div className="config-item" onClick={() => setConfig({...config, peacefulFirstNight: !config.peacefulFirstNight})} style={{cursor: 'pointer'}}>
              <div className="config-label">
                <Zap size={22} color={config.peacefulFirstNight ? "var(--success)" : "var(--text-muted)"} />
                <span style={{ color: config.peacefulFirstNight ? 'var(--success)' : 'var(--text-main)' }}>Peaceful Night 1</span>
              </div>
              <div className={`toggle-switch ${config.peacefulFirstNight ? 'on' : ''}`}>
                <div className="toggle-knob" />
              </div>
            </div>
          </div>

          <button 
            className="btn-start"
            disabled={players.length < 2}
            onClick={startGame}
          >
            <Play size={24} fill="currentColor" />
            {players.length < 2 ? "Need 2+ Players" : "Start Game"}
          </button>
        </div>

      </div>
    </div>
  );
}

// Helper Component for the Counters
function CounterRow({ label, icon, value, onChange }) {
  return (
    <div className="config-item">
      <div className="config-label">
        {icon}
        <span>{label}</span>
      </div>
      <div className="counter-wrap">
        <button onClick={() => onChange(Math.max(0, value - 1))} className="btn-counter">-</button>
        <span className="counter-val">{value}</span>
        <button onClick={() => onChange(value + 1)} className="btn-counter">+</button>
      </div>
    </div>
  );
}