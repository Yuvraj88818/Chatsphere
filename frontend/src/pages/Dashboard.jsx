import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';

const Dashboard = () => {
  const [rooms, setRooms] = useState([]);
  const [newRoomName, setNewRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const { data } = await api.get('/rooms');
      setRooms(data);
    } catch (err) {
      console.error('Failed to fetch rooms', err);
    }
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/rooms', { name: newRoomName, isPrivate });
      setRooms([data, ...rooms]);
      setNewRoomName('');
      setIsPrivate(false);
      navigate(`/room/${data._id}`);
    } catch (err) {
      setError('Failed to create room');
    }
  };

  const handleJoinRoom = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const { data } = await api.post('/rooms/join', { inviteCode });
      navigate(`/room/${data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join room');
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] flex text-gray-200">
      {/* Sidebar */}
      <div className="w-64 glass-panel border-r border-white/5 hidden md:flex flex-col">
        <div className="p-6 border-b border-white/5">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">ChatSphere</h1>
        </div>
        <div className="p-6 flex-1">
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Profile</h3>
            <div className="flex items-center space-x-3 p-3 rounded-xl bg-white/5 border border-white/5">
              <div className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg">
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <p className="font-medium text-gray-200 truncate">{user?.username}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 border-t border-white/5">
          <button 
            onClick={logout}
            className="w-full text-left text-gray-400 hover:text-red-400 font-medium transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="md:hidden p-4 glass-panel border-b border-white/5 flex justify-between items-center z-10">
          <h1 className="text-xl font-bold bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">ChatSphere</h1>
          <button onClick={logout} className="text-sm text-gray-400 hover:text-red-400">Sign Out</button>
        </div>
        
        <div className="p-6 md:p-10 max-w-5xl mx-auto w-full z-10 animate-fade-in overflow-y-auto">
          {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-6 text-sm">{error}</div>}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            {/* Create Room */}
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <h2 className="text-lg font-semibold mb-5 text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path></svg>
                Create a New Room
              </h2>
              <form onSubmit={handleCreateRoom} className="relative z-10">
                <div className="mb-4">
                  <input 
                    type="text" 
                    placeholder="Enter room name..."
                    value={newRoomName}
                    onChange={(e) => setNewRoomName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input transition-all duration-200 outline-none text-sm"
                    required
                  />
                </div>
                <div className="mb-5 flex items-center cursor-pointer">
                  <div className="relative flex items-center">
                    <input 
                      type="checkbox" 
                      id="private"
                      checked={isPrivate}
                      onChange={(e) => setIsPrivate(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-violet-500"></div>
                  </div>
                  <label htmlFor="private" className="ml-3 text-sm font-medium text-gray-400 cursor-pointer">Make it private (requires invite code)</label>
                </div>
                <button type="submit" className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full sm:w-auto border border-white/5 shadow-sm">
                  Create Room
                </button>
              </form>
            </div>

            {/* Join Room */}
            <div className="glass-panel p-6 rounded-2xl relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <h2 className="text-lg font-semibold mb-5 text-white flex items-center">
                <svg className="w-5 h-5 mr-2 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path></svg>
                Join Private Room
              </h2>
              <form onSubmit={handleJoinRoom} className="relative z-10 flex flex-col h-[calc(100%-2.5rem)]">
                <div className="mb-auto">
                  <input 
                    type="text" 
                    placeholder="Enter 6-character Invite Code..."
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl glass-input transition-all duration-200 outline-none text-sm uppercase tracking-widest font-mono"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-3">Ask the room creator for their specific invite code.</p>
                </div>
                <button type="submit" className="bg-white/10 hover:bg-white/20 text-white px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 w-full sm:w-auto mt-5 sm:mt-0 self-start border border-white/5 shadow-sm">
                  Join Room
                </button>
              </form>
            </div>
          </div>

          {/* Room List */}
          <div>
            <h2 className="text-xl font-semibold text-white mb-5 flex items-center">
              <svg className="w-5 h-5 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              Your Hubs
            </h2>
            <div className="glass-panel rounded-2xl overflow-hidden">
              {rooms.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                  </div>
                  <p className="text-lg">No active rooms found.</p>
                  <p className="text-sm mt-1">Create one above to start chatting!</p>
                </div>
              ) : (
                <ul className="divide-y divide-white/5">
                  {rooms.map(room => (
                    <li key={room._id} className="p-5 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center">
                          <h3 className="font-semibold text-gray-200 text-lg">{room.name}</h3>
                          {room.isPrivate ? (
                            <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">Private</span>
                          ) : (
                            <span className="ml-3 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Public</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center text-xs text-gray-500 mt-2 gap-3">
                          <span className="flex items-center">
                            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path></svg>
                            {room.members.length} member{room.members.length !== 1 && 's'}
                          </span>
                          <span>•</span>
                          <span>Created by {room.createdBy.username === user.username ? 'you' : room.createdBy.username}</span>
                        </div>
                        
                        {room.isPrivate && room.createdBy._id === user._id && (
                          <div className="mt-3 inline-flex items-center px-3 py-1.5 rounded-lg bg-black/30 border border-white/5">
                            <span className="text-xs text-gray-400 mr-2">Invite Code:</span>
                            <span className="text-sm text-violet-300 font-mono tracking-widest font-bold">{room.inviteCode}</span>
                          </div>
                        )}
                      </div>
                      <Link 
                        to={`/room/${room._id}`}
                        className="w-full sm:w-auto text-center bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 shadow-lg shadow-violet-900/20"
                      >
                        Enter Chat
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
