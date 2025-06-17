import { useState, useEffect } from 'react';
import Chessboard from 'chessboardjsx';
import { io } from 'socket.io-client';

const url = import.meta.env.VITE_SOCKET_URL || 'http://127.0.0.1:5000/'
const socket = io(url);

const App = () => {
  const [position, setPosition] = useState('start');
  const [whiteMode, setWhiteMode] = useState('AlphaBeta');
  const [blackMode, setBlackMode] = useState('Minimax');
  const [whiteDepth, setWhiteDepth] = useState(3);
  const [blackDepth, setBlackDepth] = useState(3);
  const [currentTurn, setCurrentTurn] = useState('white');
  const [gameStarted, setGameStarted] = useState(false);
  const [aiDelay, setAiDelay] = useState(0);
  const [isAiDelay, setIsAiDelay] = useState(false);
  const [announcement, setAnnouncement] = useState(null);
  const [promotionMove, setPromotionMove] = useState(null);
  const [promotionModalVisible, setPromotionModalVisible] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    socket.on('update', (data) => {
      setPosition(data.fen);
      setCurrentTurn(data.turn);
      setMessage(data.message);
      setIsThinking(false);
      setError(null);

      if (data.message) {
        console.log(data.message);
      }
    });

    socket.on('announcement', (data) => {
      setAnnouncement(data.result);
      setGameStarted(false);
      setIsThinking(false);
    });

    socket.on('error', (data) => {
      setError(data.message);
      console.error('Error:', data.message);
      setIsThinking(false);
    });

    socket.emit('reset');

    return () => {
      socket.off('update');
      socket.off('announcement');
      socket.off('error');
    };
  }, []);

  // Kiểm tra có phải nước đi phong cấp tốt không
  const isPawnPromotion = (piece, from, to) => {
    console.log('Checking pawn promotion:', piece, from, to);
    // Tốt trắng lên hàng 8, tốt đen xuống hàng 1
    return (
      (piece === 'wP' && from[1] === '7' && to[1] === '8') ||
      (piece === 'bP' && from[1] === '2' && to[1] === '1')
    );
  };

  const handleMove = ({ sourceSquare, targetSquare, piece }) => {
    if (
      gameStarted &&
      sourceSquare !== targetSquare &&
      ((currentTurn === 'white' && whiteMode === 'Human') ||
        (currentTurn === 'black' && blackMode === 'Human'))
    ) {
      if (isPawnPromotion(piece, sourceSquare, targetSquare)) {
        setPromotionMove({ from: sourceSquare, to: targetSquare });
        setPromotionModalVisible(true);
      } else {
        socket.emit('move', { from: sourceSquare, to: targetSquare, promotion: '' });
      }
    }
  };

  const handlePromotion = (piece) => {
    if (promotionMove) {
      socket.emit('move', {
        from: promotionMove.from,
        to: promotionMove.to,
        promotion: piece
      });
      setPromotionMove(null);
      setPromotionModalVisible(false);
    }
  };

  const handleReset = () => {
    setGameStarted(false);
    setAnnouncement(null);
    socket.emit('reset');
  };

  const requestAIMove = (turn, mode, depth) => {
    setIsAiDelay(true);
    setTimeout(() => {
      setIsAiDelay(false);
      setIsThinking(true);
      if (gameStarted) {
        socket.emit('ai_move', { turn, mode, depth });
      }
    }, aiDelay);
  };

  useEffect(() => {
    if (gameStarted) {
      if (currentTurn === 'white' && whiteMode !== 'Human') {
        requestAIMove('white', whiteMode, whiteDepth);
      } else if (currentTurn === 'black' && blackMode !== 'Human') {
        requestAIMove('black', blackMode, blackDepth);
      }
    }
  }, [currentTurn, whiteMode, blackMode, whiteDepth, blackDepth, gameStarted]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '20px',
      padding: '20px',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <h1 style={{ color: '#2c3e50', marginBottom: '20px' }}>Chess Game</h1>

        <div style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '20px',
          padding: '20px',
          backgroundColor: '#f5f6fa',
          borderRadius: '8px',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ fontWeight: 'bold', color: '#2c3e50' }}>
              White Mode:
              <select
                value={whiteMode}
                onChange={(e) => setWhiteMode(e.target.value)}
                style={{
                  marginLeft: '10px',
                  padding: '5px',
                  borderRadius: '4px'
                }}
              >
                <option value="Human">Human</option>
                <option value="Minimax">Minimax</option>
                <option value="AlphaBeta">Alpha-Beta</option>
                <option value="MCTS">MCTS</option>
                <option value="CNN">CNN</option>
              </select>
            </label>
            <input
              type="number"
              value={whiteDepth}
              onChange={(e) => setWhiteDepth(Number(e.target.value))}
              style={{
                marginLeft: '10px',
                width: '60px',
                padding: '5px',
                borderRadius: '4px'
              }}
              min="1"
            />
          </div>

          <div>
            <label style={{ fontWeight: 'bold', color: '#2c3e50' }}>
              Black Mode:
              <select
                value={blackMode}
                onChange={(e) => setBlackMode(e.target.value)}
                style={{
                  marginLeft: '10px',
                  padding: '5px',
                  borderRadius: '4px'
                }}
              >
                <option value="Human">Human</option>
                <option value="Minimax">Minimax</option>
                <option value="AlphaBeta">Alpha-Beta</option>
                <option value="MCTS">MCTS</option>
                <option value="CNN">CNN</option>
              </select>
            </label>
            <input
              type="number"
              value={blackDepth}
              onChange={(e) => setBlackDepth(Number(e.target.value))}
              style={{
                marginLeft: '10px',
                width: '60px',
                padding: '5px',
                borderRadius: '4px'
              }}
              min="1"
            />
          </div>
        </div>

        <div style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <button
            onClick={() => setGameStarted(true)}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: gameStarted || announcement ? 'not-allowed' : 'pointer',
              opacity: gameStarted || announcement ? 0.7 : 1
            }}
            disabled={gameStarted || announcement}
          >
            Start Game
          </button>

          <button
            onClick={handleReset}
            style={{
              padding: '10px 20px',
              fontSize: '16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Reset Game
          </button>

          <label style={{
            padding: '10px 20px',
            fontSize: '16px',
            display: 'flex',
            alignItems: 'center',
            backgroundColor: '#f5f6fa',
            borderRadius: '4px'
          }}>
            AI Delay (ms):
            <input
              type="number"
              value={aiDelay}
              onChange={(e) => setAiDelay(Number(e.target.value))}
              style={{
                marginLeft: '10px',
                width: '80px',
                padding: '5px',
                borderRadius: '4px'
              }}
              min="0"
            />
          </label>
        </div>

        <div style={{
          display: 'flex',
        }}>
          <Chessboard
            position={position}
            onDrop={handleMove}
            draggable={gameStarted && !isThinking && (
              (currentTurn === 'white' && whiteMode === 'Human') ||
              (currentTurn === 'black' && blackMode === 'Human')
            )}
            pieceTheme={piece => `https://chessboardjs.com/img/chesspieces/wikipedia/${piece}.png`}
            width={480}
          />
          {/* Right Sidebar */}
          <div style={{
            width: '300px',
            backgroundColor: '#f5f6fa',
            padding: '20px',
            borderRadius: '8px',
            height: 'calc(100% - 40px)',
            position: 'sticky',
            top: '20px',
            marginLeft: '20px',
          }}>
            <div style={{
              backgroundColor: '#fff',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '15px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',

            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '10px'
              }}>

                <div>
                  <h3 style={{ margin: '0 0 10px 0', color: '#2c3e50' }}>Current Turn</h3>
                  <div style={{
                    fontWeight: 'bold',
                    color: '#2c3e50',
                    textTransform: 'capitalize'
                  }}>
                    {currentTurn}
                  </div>
                </div>
                <div style={{

                }}>
                  <div style={{
                    height: '30px',
                    width: '30px',
                    backgroundColor: currentTurn === 'white' ? '#fff' : '#000',
                    border: '8px solid #ddd',
                    borderRadius: '50%',
                  }}>

                  </div>
                </div>
              </div>
            </div>


            <div style={{
              backgroundColor: '#e8f5e9',
              padding: '15px',
              borderRadius: '8px',
              marginBottom: '15px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#2e7d32' }}>Status</h3>
              <div style={{ color: '#2e7d32', minHeight: '24px' }}>
                {announcement && <b>{announcement}</b>}
                {currentTurn === 'white' && whiteMode === 'Human' && gameStarted && <div>Waiting for White</div>}
                {currentTurn === 'black' && blackMode === 'Human' && gameStarted && <div>Waiting for Black</div>}
                {isThinking && <div>Thinking...</div>}
                {isAiDelay && <div>Delay</div>}
              </div>
            </div>

            {/* {message !== null &&
              <div style={{
                backgroundColor: '#daf4f1',
                padding: '15px',
                borderRadius: '8px',
                marginBottom: '15px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#01443d' }}>Message</h3>
                <div style={{ color: '#01443d', minHeight: '24px', fontFamily: "monospace" }}>
                  {message}
                </div>
              </div>
            } */}

            {error && (
              <div style={{
                backgroundColor: '#ffebee',
                padding: '15px',
                borderRadius: '8px',
                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}>
                <h3 style={{ margin: '0 0 10px 0', color: '#c62828' }}>Error</h3>
                <div style={{ color: '#c62828' }}>
                  {error}
                  <button
                    onClick={() => setError(null)}
                    style={{
                      marginLeft: '10px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: '#c62828',
                      padding: '0'
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>



      {/* Promotion Modal */}
      {promotionModalVisible && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>Choose Promotion Piece</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              {['q', 'r', 'b', 'n'].map((piece) => (
                <button
                  key={piece}
                  onClick={() => handlePromotion(piece)}
                  style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    cursor: 'pointer',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: '#fff'
                  }}
                >
                  {piece === 'q' ? 'Queen' :
                    piece === 'r' ? 'Rook' :
                      piece === 'b' ? 'Bishop' : 'Knight'}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
