import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import api from '../utils/api';

const ChatRoom = () => {
  const { roomId } = useParams();
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({});
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Fetch room details and message history
  useEffect(() => {
    const fetchRoomData = async () => {
      try {
        const roomRes = await api.get(`/rooms`);
        const currentRoom = roomRes.data.find(r => r._id === roomId);
        if (currentRoom) setRoom(currentRoom);
        
        const msgRes = await api.get(`/rooms/${roomId}/messages`);
        setMessages(msgRes.data);
      } catch (err) {
        setError('Failed to load room data');
      }
    };
    fetchRoomData();
  }, [roomId]);

  // Socket setup for this specific room
  useEffect(() => {
    if (!socket) return;

    socket.emit('joinRoom', roomId);

    socket.on('newMessage', (message) => {
      setMessages((prev) => [...prev, message]);
      if (message.senderId._id !== user._id) {
        socket.emit('messageRead', { messageId: message._id, roomId });
      }
    });

    socket.on('systemMessage', (message) => {
      setMessages((prev) => [...prev, message]);
    });

    socket.on('onlineUsers', (users) => setOnlineUsers(users));
    socket.on('userTyping', ({ userId, username }) => setTypingUsers(prev => ({ ...prev, [userId]: username })));
    socket.on('userStoppedTyping', ({ userId }) => setTypingUsers(prev => {
      const newState = { ...prev };
      delete newState[userId];
      return newState;
    }));
    socket.on('messageReadUpdate', ({ messageId, userId }) => {
      setMessages(prev => prev.map(msg => {
        if (msg._id === messageId && !msg.readBy.includes(userId)) {
          return { ...msg, readBy: [...msg.readBy, userId] };
        }
        return msg;
      }));
    });

    return () => {
      socket.emit('leaveRoom', roomId);
      socket.off('newMessage');
      socket.off('systemMessage');
      socket.off('onlineUsers');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
      socket.off('messageReadUpdate');
    };
  }, [socket, roomId, user._id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;
    socket.emit('sendMessage', { roomId, content: newMessage });
    setNewMessage('');
    socket.emit('stopTyping', { roomId });
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    if (socket) {
      socket.emit('typing', { roomId });
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => socket.emit('stopTyping', { roomId }), 2000);
    }
  };

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0B0F19]">
        <div className="glass-panel p-8 rounded-xl text-center">
          <svg className="w-12 h-12 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
          <p className="text-gray-300 font-medium">{error}</p>
          <Link to="/" className="mt-4 inline-block px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors">Return to Dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#0B0F19] text-gray-200 font-sans overflow-hidden">
      
      {/* Sidebar - Online Users */}
      <div className="w-64 glass-panel border-r border-white/5 hidden md:flex flex-col z-20">
        <div className="p-5 border-b border-white/5 flex items-center gap-3">
          <Link to="/" className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </Link>
          <div className="flex-1 overflow-hidden">
            <h2 className="font-bold text-gray-100 truncate text-lg" title={room?.name}>{room?.name || 'Loading...'}</h2>
            {room?.isPrivate && <span className="text-[10px] uppercase tracking-wider text-violet-400 font-semibold">Private Hub</span>}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-5 scrollbar-thin">
          <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-4 flex items-center">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            Live Members
          </h3>
          <ul className="space-y-3">
            {room?.members.map(member => {
              const isOnline = onlineUsers.includes(member);
              return (
                <li key={member} className={`flex items-center p-2 rounded-lg transition-colors ${isOnline ? 'bg-white/5 border border-white/5' : 'opacity-50'}`}>
                  <div className="relative">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-xs font-bold text-white shadow-inner">
                      {/* Placeholder initials */}
                      U
                    </div>
                    <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#111827] ${isOnline ? 'bg-emerald-400' : 'bg-gray-500'}`}></div>
                  </div>
                  <span className="ml-3 text-sm font-medium text-gray-300 truncate">
                    User {member.substring(member.length - 4)}
                    {member === user._id && <span className="ml-2 text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400">You</span>}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col h-full relative z-10">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-1/4 left-1/4 w-[500px] h-[500px] bg-violet-600/5 rounded-full blur-[150px] pointer-events-none"></div>

        {/* Mobile Header */}
        <div className="md:hidden p-4 glass-panel border-b border-white/5 flex items-center z-20">
          <Link to="/" className="p-2 mr-3 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
          </Link>
          <h2 className="font-bold text-gray-100 truncate text-lg">{room?.name}</h2>
        </div>

        {/* Messages list */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scrollbar-thin z-10">
          <div className="flex flex-col space-y-6 max-w-4xl mx-auto">
            {messages.length === 0 && (
              <div className="text-center py-20 text-gray-500 animate-fade-in">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <svg className="w-8 h-8 text-violet-400/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
                </div>
                <p>No messages yet. Say hello!</p>
              </div>
            )}
            
            {messages.map((msg, index) => {
              if (msg.isSystem) {
                return (
                  <div key={msg._id} className="flex justify-center my-2 animate-fade-in">
                    <div className="bg-white/5 border border-white/5 px-4 py-1.5 rounded-full text-xs text-gray-400 font-medium">
                      {msg.content}
                    </div>
                  </div>
                );
              }

              const isMine = msg.senderId._id === user._id;
              const isRead = msg.readBy.length > 1;
              const showAvatar = index === 0 || messages[index - 1].isSystem || messages[index - 1].senderId._id !== msg.senderId._id;
              
              return (
                <div key={msg._id} className={`flex ${isMine ? 'justify-end' : 'justify-start'} animate-slide-up group`} style={{animationDuration: '0.3s'}}>
                  {!isMine && showAvatar && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-lg mr-3 mt-auto mb-1">
                      {msg.senderId.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {!isMine && !showAvatar && <div className="w-8 mr-3"></div>}
                  
                  <div className={`flex flex-col ${isMine ? 'items-end' : 'items-start'} max-w-[75%]`}>
                    {!isMine && showAvatar && (
                      <span className="text-[11px] font-medium text-gray-400 mb-1 ml-1">{msg.senderId.username}</span>
                    )}
                    
                    <div className={`px-5 py-3 shadow-lg relative ${
                      isMine 
                        ? 'bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-2xl rounded-br-sm border border-white/10' 
                        : 'glass-panel text-gray-200 rounded-2xl rounded-bl-sm'
                    }`}>
                      <div className="text-[15px] leading-relaxed break-words">{msg.content}</div>
                      
                      <div className={`text-[10px] mt-1.5 flex justify-end items-center opacity-70 ${isMine ? 'text-indigo-100' : 'text-gray-400'}`}>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        
                        {isMine && (
                          <span className="ml-1.5 flex">
                            <svg className={`w-3.5 h-3.5 ${isRead ? 'text-blue-300' : 'text-indigo-200'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              {isRead ? (
                                <>
                                  <polyline points="20 6 9 17 4 12"></polyline>
                                  <polyline points="16 6 12 10"></polyline>
                                </>
                              ) : (
                                <polyline points="20 6 9 17 4 12"></polyline>
                              )}
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Typing Indicator */}
            {Object.values(typingUsers).length > 0 && (
              <div className="flex justify-start items-end animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-white/5 flex-shrink-0 flex items-center justify-center text-xs font-bold text-gray-400 mr-3 mb-1">?</div>
                <div className="glass-panel rounded-2xl rounded-bl-sm px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
                  <span className="font-medium text-violet-300">{Object.values(typingUsers).join(', ')}</span> 
                  <span>is typing</span>
                  <div className="flex space-x-1 ml-1">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0ms'}}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '150ms'}}></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '300ms'}}></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        </div>

        {/* Message Input Container */}
        <div className="p-4 md:p-6 z-20">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSendMessage} className="relative flex items-center">
              <input
                type="text"
                value={newMessage}
                onChange={handleTyping}
                placeholder="Message the room..."
                className="w-full glass-panel border border-white/10 rounded-full pl-6 pr-16 py-4 text-[15px] focus:outline-none focus:border-violet-500/50 focus:bg-white/5 transition-all shadow-lg"
              />
              <button 
                type="submit"
                disabled={!newMessage.trim()}
                className="absolute right-2 top-2 bottom-2 w-10 h-10 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-full flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:from-violet-500 hover:to-indigo-500 transition-all shadow-md group"
              >
                <svg className="w-4 h-4 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatRoom;
