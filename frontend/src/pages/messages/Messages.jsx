import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { fetchInbox, fetchConversation, sendMessage, addSocketMessage } from '../../store/slices/messageSlice';
import socket from '../../api/socket';

const avatarColors = [
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-500',
  'from-red-500 to-orange-400',
  'from-green-500 to-teal-500',
  'from-purple-500 to-indigo-500',
];

function getColor(name) {
  const i = (name?.charCodeAt(0) || 0) % avatarColors.length;
  return avatarColors[i];
}

export default function Messages() {
  const dispatch = useDispatch();
  const [searchParams] = useSearchParams();
  const withUserId = searchParams.get('with');

  const { user } = useSelector((s) => s.auth);
  const { conversations, currentMessages, loading } = useSelector((s) => s.messages);

  const [activeUser, setActiveUser] = useState(null);
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef(null);
  const typingTimeout = useRef(null);

  useEffect(() => {
    if (!user) return;
    dispatch(fetchInbox());
    if (!socket.connected) {
      socket.connect();
      socket.emit('join', user._id);
    }
    socket.on('new_message', (msg) => {
      dispatch(addSocketMessage(msg));
    });
    socket.on('user_typing', () => setIsTyping(true));
    socket.on('user_stop_typing', () => setIsTyping(false));
    return () => {
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('user_stop_typing');
    };
  }, [dispatch, user]);

  useEffect(() => {
    if (withUserId && conversations.length > 0) {
      const conv = conversations.find((c) => c.user._id === withUserId);
      if (conv) openConversation(conv.user);
    }
  }, [withUserId, conversations]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages]);

  useEffect(() => {
    setIsTyping(false);
  }, [activeUser]);

  const openConversation = (otherUser) => {
    setActiveUser(otherUser);
    dispatch(fetchConversation(otherUser._id));
  };

  const handleTextChange = (e) => {
    setText(e.target.value);
    if (!activeUser) return;
    socket.emit('typing', { to: activeUser._id });
    clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      socket.emit('stop_typing', { to: activeUser._id });
    }, 1500);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() || !activeUser) return;
    socket.emit('stop_typing', { to: activeUser._id });
    clearTimeout(typingTimeout.current);
    await dispatch(sendMessage({ receiverId: activeUser._id, text }));
    setText('');
  };

  return (
    <div className="flex h-[calc(100vh-56px)]" style={{ background: '#FFFBF5' }}>

      {/* Sidebar */}
      <div className="w-72 flex flex-col border-r" style={{ background: '#ffffff', borderColor: '#fed7aa' }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: '#fed7aa' }}>
          <h2 className="font-bold text-lg tracking-wide" style={{ color: '#0f172a' }}>Messages</h2>
          <p className="text-xs mt-0.5" style={{ color: '#64748b' }}>Your conversations</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center mt-12 px-4">
              <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-2xl font-bold"
                style={{ background: '#ffedd5', color: '#ea580c' }}>~</div>
              <p className="text-sm" style={{ color: '#94a3b8' }}>No conversations yet</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.user._id}
                onClick={() => openConversation(conv.user)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left transition-all"
                style={{ background: activeUser?._id === conv.user._id ? '#fff7ed' : 'transparent', borderBottom: '1px solid #fff7ed' }}
              >
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getColor(conv.user.name)} flex items-center justify-center text-white font-bold flex-shrink-0 shadow-md`}>
                  {conv.user.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate" style={{ color: '#0f172a' }}>{conv.user.name}</p>
                  <p className="text-xs truncate" style={{ color: '#64748b' }}>{conv.lastMessage.text}</p>
                </div>
                {conv.unread > 0 && (
                  <span className="text-white text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0 shadow"
                    style={{ background: '#ea580c' }}>{conv.unread}</span>
                )}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col">
        {!activeUser ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center rounded-3xl px-12 py-12 shadow-lg" style={{ background: '#ffffff', border: '1px solid #fed7aa' }}>
              <div className="w-20 h-20 rounded-full mx-auto mb-5 flex items-center justify-center text-3xl font-bold"
                style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#fff' }}>SS</div>
              <p className="font-semibold text-lg" style={{ color: '#0f172a' }}>Start a Conversation</p>
              <p className="text-sm mt-2" style={{ color: '#64748b' }}>Select someone from the left to chat</p>
              <div className="flex justify-center gap-2 mt-5">
                <span className="w-2 h-2 rounded-full" style={{ background: '#ea580c' }}></span>
                <span className="w-2 h-2 rounded-full" style={{ background: '#f97316' }}></span>
                <span className="w-2 h-2 rounded-full bg-slate-300"></span>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="px-6 py-3 flex items-center gap-3 shadow-sm" style={{ background: '#ffffff', borderBottom: '1px solid #fed7aa' }}>
              <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getColor(activeUser.name)} flex items-center justify-center text-white font-bold shadow-md`}>
                {activeUser.name?.[0]?.toUpperCase()}
              </div>
              <div>
                <p className="font-semibold" style={{ color: '#0f172a' }}>{activeUser.name}</p>
                <p className="text-xs" style={{ color: isTyping ? '#ea580c' : '#059669', transition: 'color 0.2s' }}>
                  {isTyping ? 'typing...' : 'Online'}
                </p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
              {loading ? (
                <p className="text-center" style={{ color: '#94a3b8' }}>Loading...</p>
              ) : (
                currentMessages.map((msg, i) => {
                  const isMine = msg.sender._id === user._id || msg.sender === user._id;
                  return (
                    <div key={i} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-xs lg:max-w-md px-4 py-2.5 rounded-2xl text-sm shadow-md"
                        style={isMine
                          ? { background: 'linear-gradient(135deg,#ea580c,#f97316)', color: '#fff' }
                          : { background: '#ffffff', color: '#1e293b', border: '1px solid #fed7aa' }
                        }>
                        {msg.text}
                      </div>
                    </div>
                  );
                })
              )}
              {/* Typing bubble */}
              {isTyping && (
                <div className="flex justify-start">
                  <div style={{ background: '#ffffff', border: '1px solid #fed7aa', borderRadius: '1.25rem', padding: '0.6rem 1rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {[0, 1, 2].map((i) => (
                      <span key={i} style={{
                        width: '7px', height: '7px', borderRadius: '50%', background: '#ea580c',
                        display: 'inline-block',
                        animation: `typingDot 1.2s ${i * 0.2}s infinite ease-in-out`,
                      }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="px-4 py-3 flex gap-3 items-center" style={{ background: '#ffffff', borderTop: '1px solid #fed7aa' }}>
              <input
                value={text}
                onChange={handleTextChange}
                placeholder="Type a message..."
                className="flex-1 rounded-full px-5 py-2.5 text-sm focus:outline-none"
                style={{ background: '#fffbf5', border: '1px solid #fed7aa', color: '#1e293b' }}
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="px-5 py-2.5 rounded-full text-sm font-semibold text-white shadow transition-all disabled:opacity-40"
                style={{ background: 'linear-gradient(135deg,#ea580c,#f97316)' }}
              >
                Send
              </button>
            </form>
          </>
        )}
      </div>

      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.5; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
