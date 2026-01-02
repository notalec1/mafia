// src/App.jsx
import React, { useState, useEffect } from 'react';
import LandingScreen from './components/LandingScreen';
import HostScreen from './components/HostScreen';
import PlayerScreen from './components/PlayerScreen';

export default function App() {
  const [screen, setScreen] = useState("LANDING"); // LANDING, HOST, PLAYER
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [joinToken, setJoinToken] = useState(null);

  // Check URL for QR Code token on load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get('q');
    if (q) setJoinToken(q);
  }, []);

  if (screen === "HOST") {
    return <HostScreen roomCode={roomCode} />;
  }

  if (screen === "PLAYER") {
    return <PlayerScreen roomCode={roomCode} playerName={playerName} />;
  }

  return (
    <LandingScreen 
      onHost={(code) => {
        setRoomCode(code);
        setScreen("HOST");
      }}
      onJoin={(code, name) => {
        setRoomCode(code);
        setPlayerName(name);
        setScreen("PLAYER");
      }}
      joinToken={joinToken}
    />
  );
}