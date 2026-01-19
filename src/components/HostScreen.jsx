import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { ref, onValue, update } from 'firebase/database';
import { db } from '../firebase';
import { shuffleArray } from '../utils';
import { Users, Shield, Sword, Search, Play } from 'lucide-react';

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

  if (!game) return <div className="app-container">Loading...</div>;

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

  // --- LOBBY ---
  if (game.gameState === "LOBBY") {
    return (
      <div className="app-container wide">
        <div style={{textAlign: 'center', marginBottom: '10px'}}>
          <h3>ROOM CODE</h3>
          <div style={{fontSize: '5rem', fontWeight: '900', fontFamily: 'monospace', letterSpacing: '5px', lineHeight: '1'}}>{roomCode}</div>
        </div>

        <div className="host-layout">
          {/* LEFT: QR & PLAYERS */}
          <div className="card">
            <div style={{background: 'white', padding: '15px', borderRadius: '15px'}}>
              <QRCodeSVG value={joinUrl} size={220} />
            </div>
            
            <div className="full-width">
              <div className="row" style={{borderBottom: '1px solid #333', paddingBottom: '10px', marginBottom: '10px'}}>
                <div style={{display: 'flex', gap: '8px', alignItems: 'center', fontWeight: 'bold'}}><Users size={18}/> LOBBY</div>
                <div className="badge">{players.length} READY</div>
              </div>
              <div style={{display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center'}}>
                {players.length === 0 && <span style={{fontStyle: 'italic', color: '#666'}}>Waiting for players...</span>}
                {players.map(p => (
                  <span key={p.id} className="badge" style={{background: '#222', padding: '8px 16px'}}>{p.name}</span>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT: SETTINGS */}
          <div className="card" style={{justifyContent: 'space-between'}}>
            <div className="full-width">
              <h3 style={{marginBottom: '20px', textAlign: 'left'}}>GAME CONFIG</h3>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '15px'}}>
                <div className="row" style={{background: '#1a1a1a', padding: '10px', borderRadius: '12px'}}>
                  <span style={{display: 'flex', gap: '10px', fontWeight: 'bold'}}><Sword size={20} color="#ef4444"/> Mafia</span>
                  <div className="counter">
                    <button onClick={() => setConfig({...config, mafia: Math.max(0, config.mafia-1)})}>-</button>
                    <span>{config.mafia}</span>
                    <button onClick={() => setConfig({...config, mafia: config.mafia+1})}>+</button>
                  </div>
                </div>

                <div className="row" style={{background: '#1a1a1a', padding: '10px', borderRadius: '12px'}}>
                  <span style={{display: 'flex', gap: '10px', fontWeight: 'bold'}}><Shield size={20} color="#22c55e"/> Doctor</span>
                  <div className="counter">
                    <button onClick={() => setConfig({...config, doctor: Math.max(0, config.doctor-1)})}>-</button>
                    <span>{config.doctor}</span>
                    <button onClick={() => setConfig({...config, doctor: config.doctor+1})}>+</button>
                  </div>
                </div>

                <div className="row" style={{background: '#1a1a1a', padding: '10px', borderRadius: '12px'}}>
                  <span style={{display: 'flex', gap: '10px', fontWeight: 'bold'}}><Search size={20} color="#3b82f6"/> Detective</span>
                  <div className="counter">
                    <button onClick={() => setConfig({...config, detective: Math.max(0, config.detective-1)})}>-</button>
                    <span>{config.detective}</span>
                    <button onClick={() => setConfig({...config, detective: config.detective+1})}>+</button>
                  </div>
                </div>

                <div 
                  onClick={() => setConfig({...config, peacefulFirstNight: !config.peacefulFirstNight})}
                  className="row" 
                  style={{background: '#1a1a1a', padding: '10px', borderRadius: '12px', cursor: 'pointer', border: config.peacefulFirstNight ? '1px solid #22c55e' : '1px solid transparent'}}
                >
                   <span style={{fontWeight: 'bold', color: config.peacefulFirstNight ? '#22c55e' : '#888'}}>Peaceful Night 1</span>
                   <div style={{width: '16px', height: '16px', borderRadius: '50%', background: config.peacefulFirstNight ? '#22c55e' : '#333'}}></div>
                </div>
              </div>
            </div>

            <button className="btn" onClick={startGame} disabled={players.length < 2} style={{background: '#22c55e'}}>
              START GAME
            </button>
          </div>
        </div>
      </div>
    );
  }

  // --- GAME IN PROGRESS ---
  return (
    <div className="app-container wide">
      <div style={{textAlign: 'center', margin: '40px 0'}}>
        <h3>CURRENT PHASE</h3>
        <h1 style={{fontSize: '4rem', marginTop: '10px'}}>{game.publicMessage}</h1>
      </div>
      
      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '15px', width: '100%'}}>
        {players.map(p => (
           <div key={p.id} style={{
             background: '#1a1a1a',
             padding: '20px',
             borderRadius: '16px',
             textAlign: 'center',
             border: !p.isAlive ? '1px solid #ef4444' : '1px solid #333',
             opacity: p.isAlive ? 1 : 0.5
           }}>
              <div style={{fontSize: '2rem', marginBottom: '10px'}}>{p.isAlive ? '🙂' : '💀'}</div>
              <div style={{fontWeight: 'bold'}}>{p.name}</div>
           </div>
        ))}
      </div>
    </div>
  );
}