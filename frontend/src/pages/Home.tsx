import { useNavigate } from 'react-router-dom';

function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-red-600 bg-clip-text text-transparent">
            Electoral Strategy
          </h1>
          <p className="text-xl text-gray-600">
            Campaign for the presidency in this multiplayer strategy game
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <button
            onClick={() => navigate('/create')}
            className="group relative overflow-hidden bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-8 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="relative z-10">
              <div className="text-5xl mb-4">🎮</div>
              <h2 className="text-2xl font-bold mb-2">Create Game</h2>
              <p className="text-blue-100">
                Start a new game and invite friends with a game code
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-blue-400 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>

          <button
            onClick={() => navigate('/join')}
            className="group relative overflow-hidden bg-red-600 hover:bg-red-700 text-white rounded-xl p-8 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
          >
            <div className="relative z-10">
              <div className="text-5xl mb-4">🔗</div>
              <h2 className="text-2xl font-bold mb-2">Join Game</h2>
              <p className="text-red-100">
                Enter a game code to join an existing game
              </p>
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-red-400 to-red-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </button>
        </div>

        <div className="mt-12 text-center text-gray-500 text-sm">
          <p className="mb-2">How to play:</p>
          <p>Race to 270 electoral votes by playing cards to influence state lean</p>
          <p>2-4 players • Real-time multiplayer • 30-60 minutes</p>
        </div>
      </div>
    </div>
  );
}

export default Home;
