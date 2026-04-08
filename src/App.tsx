import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Button } from './components/ui/button';
import { AuthModal } from './components/AuthModal';
import closedChest from './assets/treasure_closed.png';
import treasureChest from './assets/treasure_opened.png';
import skeletonChest from './assets/treasure_opened_skeleton.png';
import chestOpenSound from './audios/chest_open.mp3';
import evilLaughSound from './audios/chest_open_with_evil_laugh.mp3';
import keyIcon from './assets/key.png';

interface Box {
  id: number;
  isOpen: boolean;
  hasTreasure: boolean;
}

interface User {
  username: string;
  token: string;
}

interface ScoreRecord {
  score: number;
  played_at: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isGuest, setIsGuest] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [userScores, setUserScores] = useState<ScoreRecord[]>([]);

  const [boxes, setBoxes] = useState<Box[]>([]);
  const [score, setScore] = useState(0);
  const [gameEnded, setGameEnded] = useState(false);

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('game_token');
    const username = localStorage.getItem('game_username');
    if (token && username) {
      setUser({ token, username });
      fetchScores(token);
    }
  }, []);

  const fetchScores = async (token: string) => {
    const res = await fetch('/api/scores', { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setUserScores(await res.json());
  };

  const saveScore = async (finalScore: number, token: string) => {
    await fetch('/api/scores', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ score: finalScore }),
    });
    fetchScores(token);
  };

  const handleAuthSuccess = (loggedInUser: User) => {
    setUser(loggedInUser);
    setShowAuth(false);
    fetchScores(loggedInUser.token);
    initializeGame();
  };

  const handleSignOut = () => {
    localStorage.removeItem('game_token');
    localStorage.removeItem('game_username');
    setUser(null);
    setIsGuest(false);
    setUserScores([]);
    setBoxes([]);
    setGameEnded(false);
    setScore(0);
  };

  const handlePlayAsGuest = () => {
    setIsGuest(true);
    initializeGame();
  };

  const initializeGame = () => {
    const treasureBoxIndex = Math.floor(Math.random() * 3);
    const newBoxes: Box[] = Array.from({ length: 3 }, (_, index) => ({
      id: index,
      isOpen: false,
      hasTreasure: index === treasureBoxIndex,
    }));
    setBoxes(newBoxes);
    setScore(0);
    setGameEnded(false);
  };

  const openBox = (boxId: number) => {
    if (gameEnded) return;

    const box = boxes.find(b => b.id === boxId);
    if (!box || box.isOpen) return;

    // Side effects outside setState so they never run twice (React Strict Mode)
    new Audio(box.hasTreasure ? chestOpenSound : evilLaughSound).play();

    const updatedBoxes = boxes.map(b => b.id === boxId ? { ...b, isOpen: true } : b);
    const newScore = score + (box.hasTreasure ? 150 : -50);

    setBoxes(updatedBoxes);
    setScore(newScore);

    const treasureFound = updatedBoxes.some(b => b.isOpen && b.hasTreasure);
    const allOpened = updatedBoxes.every(b => b.isOpen);
    if (treasureFound || allOpened) {
      setGameEnded(true);
      if (user) saveScore(newScore, user.token);
    }
  };

  // Landing screen — shown when neither signed in nor guest
  if (!user && !isGuest) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
        <div className="text-center mb-10">
          <h1 className="text-4xl mb-4 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>
          <p className="text-amber-700">Find the treasure, avoid the skeletons!</p>
        </div>
        <div className="flex flex-col gap-4 w-64">
          <Button
            onClick={() => setShowAuth(true)}
            className="text-lg py-6 bg-amber-600 hover:bg-amber-700 text-white"
          >
            Sign In / Sign Up
          </Button>
          <Button
            onClick={handlePlayAsGuest}
            variant="outline"
            className="text-lg py-6 border-amber-500 text-amber-700 hover:bg-amber-100"
          >
            Play as Guest
          </Button>
        </div>
        <AuthModal open={showAuth} onSuccess={handleAuthSuccess} onClose={() => setShowAuth(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100 flex flex-col items-center justify-center p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl mb-4 text-amber-900">🏴‍☠️ Treasure Hunt Game 🏴‍☠️</h1>
        <p className="text-amber-800 mb-4">
          Click on the treasure chests to discover what's inside!
        </p>
        <p className="text-amber-700 text-sm">
          💰 Treasure: +$150 | 💀 Skeleton: -$50
        </p>
        <div className="mt-3 flex items-center justify-center gap-3 text-sm text-amber-700">
          {user ? (
            <>
              <span>👤 {user.username}</span>
              <button onClick={handleSignOut} className="underline hover:text-amber-900">Sign Out</button>
            </>
          ) : (
            <span>Playing as Guest</span>
          )}
        </div>
      </div>

      {/* Score + Result */}
      <div className="mb-8 flex items-center gap-6">
        <div className="text-2xl text-center p-4 bg-amber-200/80 backdrop-blur-sm rounded-lg shadow-lg border-2 border-amber-400">
          <span className="text-amber-900">Current Score: </span>
          <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            ${score}
          </span>
        </div>
        {gameEnded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className={`text-2xl font-bold p-4 rounded-lg shadow-lg border-2 ${
              score > 0
                ? 'bg-green-100 border-green-400 text-green-700'
                : score === 0
                ? 'bg-yellow-100 border-yellow-400 text-yellow-700'
                : 'bg-red-100 border-red-400 text-red-700'
            }`}
          >
            {score > 0 ? 'Win!' : score === 0 ? 'Tie!' : 'Loss!'}
          </motion.div>
        )}
      </div>

      {/* Chest Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
        {boxes.map((box) => (
          <motion.div
            key={box.id}
            className="flex flex-col items-center cursor-pointer"
            style={!box.isOpen ? { cursor: `url(${keyIcon}) 16 16, pointer` } : {}}
            whileHover={{ scale: box.isOpen ? 1 : 1.05 }}
            whileTap={{ scale: box.isOpen ? 1 : 0.95 }}
            onClick={() => openBox(box.id)}
          >
            <motion.div
              initial={{ rotateY: 0 }}
              animate={{
                rotateY: box.isOpen ? 180 : 0,
                scale: box.isOpen ? 1.1 : 1
              }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="relative"
            >
              <img
                src={box.isOpen ? (box.hasTreasure ? treasureChest : skeletonChest) : closedChest}
                alt={box.isOpen ? (box.hasTreasure ? "Treasure!" : "Skeleton!") : "Treasure Chest"}
                className="w-48 h-48 object-contain drop-shadow-lg"
              />
              {box.isOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.5 }}
                  className="absolute -top-8 left-1/2 transform -translate-x-1/2"
                >
                  {box.hasTreasure ? (
                    <div className="text-2xl animate-bounce">✨💰✨</div>
                  ) : (
                    <div className="text-2xl animate-pulse">💀👻💀</div>
                  )}
                </motion.div>
              )}
            </motion.div>

            <div className="mt-4 text-center">
              {box.isOpen ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4, duration: 0.3 }}
                  className={`text-lg p-2 rounded-lg ${
                    box.hasTreasure
                      ? 'bg-green-100 text-green-800 border border-green-300'
                      : 'bg-red-100 text-red-800 border border-red-300'
                  }`}
                >
                  {box.hasTreasure ? '+$150' : '-$50'}
                </motion.div>
              ) : (
                <div className="text-amber-700 p-2">Click to open!</div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Game Over */}
      {gameEnded && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="mb-4 p-6 bg-amber-200/80 backdrop-blur-sm rounded-xl shadow-lg border-2 border-amber-400">
            <h2 className="text-2xl mb-2 text-amber-900">Game Over!</h2>
            <p className="text-lg text-amber-800">
              Final Score:{' '}
              <span className={`${score >= 0 ? 'text-green-600' : 'text-red-600'}`}>${score}</span>
            </p>
            <p className="text-sm text-amber-600 mt-2">
              {boxes.some(box => box.isOpen && box.hasTreasure)
                ? 'Treasure found! Well done, treasure hunter! 🎉'
                : 'No treasure found this time! Better luck next time! 💀'}
            </p>
          </div>
          <Button
            onClick={initializeGame}
            className="text-lg px-8 py-4 bg-amber-600 hover:bg-amber-700 text-white"
          >
            Play Again
          </Button>
        </motion.div>
      )}

      {/* Score History (signed-in users only) */}
      {user && userScores.length > 0 && (
        <div className="mt-10 w-full max-w-sm">
          <h3 className="text-lg text-amber-900 mb-3 text-center">Your Score History</h3>
          <div className="bg-amber-200/60 rounded-xl border border-amber-300 overflow-hidden">
            {userScores.map((s, i) => (
              <div key={i} className={`flex justify-between px-4 py-2 text-sm ${i % 2 === 0 ? 'bg-amber-100/50' : ''}`}>
                <span className={s.score >= 0 ? 'text-green-700' : 'text-red-700'}>
                  {s.score >= 0 ? '+' : ''}${s.score}
                </span>
                <span className="text-amber-600">{new Date(s.played_at).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
