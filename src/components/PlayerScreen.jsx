import React, { useState, useEffect } from 'react';
import { ref, onValue, set, onDisconnect } from 'firebase/database';
import { db } from '../firebase';
import { Skull, CheckCircle, Moon, Sun, Search } from 'lucide-react';

export default function PlayerScreen({ roomCode, playerName }) {
  const [me, setMe] = useState(null);
  const [game, setGame] = useState(null);
  const [investigation, setInvestigation] = useState(null);

  useEffect(() => {
    const storageKey = `mafia_id_${roomCode}`;
    let myId = sessionStorage.getItem(storageKey);
    if (!myId) { myId = playerName.replace(/[^a-zA-Z0-9]/g, '') + "_" + Date.now(); sessionStorage.setItem(storageKey, myId); }
    const myRef = ref(db, `rooms/${roomCode}/players/${myId}`);
    onValue(myRef, (snapshot) => { 
        if (!snapshot.exists()) set(myRef, { id: myId, name: playerName, isAlive: true, role: "UNKNOWN", isOnline: true }); 
        else setMe(snapshot.val()); 
    });
    onDisconnect(myRef).update({ isOnline: false });
    const roomRef = ref(db, `rooms/${roomCode}`);
    const unsub = onValue(roomRef, (snapshot) => { 
        const d = snapshot.val(); 
        if(d) { setGame(d); if (d.gameState !== "NIGHT") setInvestigation(null); } 
    });
    return () => unsub();
  }, []);

  if (!me || !game) return <div className="app-container">Loading...</div>;

  const handleAction = (targetId, type) => {
      if (type === "KILL" && game.turnCount === 1 && game.config?.peacefulFirstNight) return;
      if (type === "INVESTIGATE") {
          const t = Object.values(game.players).find(p => p.id === targetId);
          setInvestigation({ name: t.name, role: t.role === "MAFIA" ? "MAFIA" : "INNOCENT" });
      } else {
          set(ref(db, `rooms/${roomCode}/nightActions/${me.id}`), { type, targetId });
      }
  };
  const handleVote = (tid) => set(ref(db, `rooms/${roomCode}/players/${me.id}/voteTarget`), tid);

  const isDead = game.gameState !== "LOBBY" && me.isAlive === false;

  if (isDead) return (
      <div className="app-container" style={{justifyContent: 'center', textAlign: 'center', background: '#2a0a0a', height: '100vh'}}>
          <Skull size={80} color="#ef4444" style={{margin: '0 auto 20px'}} />
          <h1 style={{color: '#ef4444'}}>ELIMINATED</h1>
          <p>You are out of the game.</p>
      </div>
  );

  return (
    <div style={{display: 'flex', flexDirection: 'column', height: '100vh', background: '#050505'}}>
        {/* HEADER */}
        <div style={{padding: '15px 20px', background: '#121212', borderBottom: '1px solid #333', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div style={{fontWeight: 'bold', fontSize: '1.2rem'}}>{playerName}</div>
            {me.role !== "UNKNOWN" && <div className="badge">{me.role}</div>}
        </div>

        {/* CONTENT */}
        <div style={{flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column'}}>
            
            {game.gameState === "LOBBY" && (
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center'}}>
                    <h2>YOU'RE IN</h2>
                    <p>Waiting for the host...</p>
                </div>
            )}

            {(game.gameState === "NIGHT" || game.gameState === "VOTING") && (
                <>
                    <div style={{textAlign: 'center', marginBottom: '20px'}}>
                        {game.gameState === "NIGHT" ? <Moon size={40} color="#4f46e5"/> : <Sun size={40} color="#f59e0b"/>}
                        <h2 style={{marginTop: '10px'}}>{game.gameState}</h2>
                        <p>{game.gameState === "NIGHT" ? (me.role === "VILLAGER" ? "Go to sleep..." : "Select your target") : "Cast your vote"}</p>
                    </div>

                    {investigation && (
                        <div style={{background: '#4f46e5', padding: '15px', borderRadius: '12px', marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center'}}>
                            <Search size={20} />
                            <div>
                                <strong>RESULT:</strong> {investigation.name} is {investigation.role}
                            </div>
                        </div>
                    )}

                    {!(game.gameState==="NIGHT" && me.role==="VILLAGER") && (
                        <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                            {Object.values(game.players).filter(p => p.isAlive && p.id !== me.id).map(p => {
                                 const isSelected = me.voteTarget === p.id;
                                 return (
                                    <button 
                                        key={p.id}
                                        onClick={() => game.gameState === "NIGHT" 
                                            ? handleAction(p.id, me.role === "MAFIA" ? "KILL" : me.role === "DOCTOR" ? "SAVE" : "INVESTIGATE") 
                                            : handleVote(p.id)
                                        }
                                        style={{
                                            padding: '20px',
                                            background: isSelected ? '#4f46e5' : '#1a1a1a',
                                            border: '1px solid #333',
                                            borderRadius: '12px',
                                            color: 'white',
                                            fontSize: '1.2rem',
                                            fontWeight: 'bold',
                                            textAlign: 'left',
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center'
                                        }}
                                    >
                                        {p.name}
                                        {isSelected && <CheckCircle size={24} />}
                                    </button>
                                 )
                            })}
                        </div>
                    )}
                </>
            )}

            {game.gameState === "DAY" && (
                <div style={{flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center'}}>
                    <div style={{fontSize: '4rem', marginBottom: '10px'}}>📺</div>
                    <h2>WATCH SCREEN</h2>
                    <p>Look at the main screen for results.</p>
                </div>
            )}
        </div>
    </div>
  );
}