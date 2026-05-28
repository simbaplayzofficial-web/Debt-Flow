import React, { useState, useEffect } from 'react';
import { useStore, UserProfile } from '../store';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { MessageSquare, Search, User, Circle } from 'lucide-react';

export const ChatterPanel: React.FC = () => {
  const { users, currentUser, getOrCreateConversation, directConversations } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  const filteredUsers = users.filter(u => 
    u.id !== currentUser?.id && 
    (u.username.toLowerCase().includes(searchTerm.toLowerCase()) || 
     u.role.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="flex h-[600px] bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
      {/* Directory */}
      <div className="w-1/3 border-r border-neutral-800 p-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-3 text-neutral-600" size={16} />
          <input 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search operational units..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-xl py-2 pl-10 pr-4 text-xs text-white"
          />
        </div>
        <div className="space-y-2 overflow-y-auto custom-scrollbar h-[500px]">
          {filteredUsers.map(user => (
            <button
              key={user.uid}
              onClick={() => setSelectedUser(user)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                selectedUser?.uid === user.uid ? 'bg-blue-900/20 border border-blue-500/30' : 'hover:bg-neutral-800'
              }`}
            >
              <div className="relative">
                <User size={32} className="text-neutral-500" />
                <Circle size={10} className="absolute -bottom-1 -right-1 text-green-500 fill-green-500" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold text-neutral-200">{user.username}</p>
                <p className="text-[10px] text-neutral-500 uppercase">{user.role}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
      
      {/* Chat Area */}
      <div className="flex-1 flex flex-col p-4 bg-neutral-950/20">
        {selectedUser ? (
          <ChatterWindow participant={selectedUser} />
        ) : (
          <div className="flex-1 flex items-center justify-center text-neutral-700 italic">
            Select a unit to initiate data transmission.
          </div>
        )}
      </div>
    </div>
  );
};

const ChatterWindow: React.FC<{ participant: UserProfile }> = ({ participant }) => {
  const { currentUser, getOrCreateConversation, sendDirectMessage, directMessages } = useStore();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    getOrCreateConversation(participant.id).then(setConversationId);
  }, [participant.id, getOrCreateConversation]);

  useEffect(() => {
    if (!conversationId) return;
    const q = query(
      collection(db, 'directMessages'),
      where('conversationId', '==', conversationId),
      orderBy('createdAt', 'asc')
    );
    const unsub = onSnapshot(q, snap => {
      setMessages(snap.docs.map(d => d.data()));
    });
    return unsub;
  }, [conversationId]);

  const handleSend = async () => {
    const trimmedMessage = inputText.trim();
    if (!conversationId || !trimmedMessage) return;

    console.log("Sending message...", { conversationId, message: trimmedMessage });
    
    try {
      await sendDirectMessage(conversationId, trimmedMessage);
      setInputText('');
      console.log("Message sent successfully");
    } catch (err: any) {
      console.error("Message send failed:", err);
    }
  };

  return (
    <div className="flex flex-col h-full border border-neutral-800 rounded-2xl bg-neutral-900">
      <div className="p-4 border-b border-neutral-800 font-bold text-xs uppercase text-blue-500">
        CHANNEL: {participant.username}
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.senderUid === currentUser?.id ? 'justify-end' : 'justify-start'}`}>
            <div className={`p-3 rounded-2xl text-xs max-w-[80%] ${m.senderUid === currentUser?.id ? 'bg-blue-600' : 'bg-neutral-800'}`}>
              {m.message}
            </div>
          </div>
        ))}
      </div>
      <div className="p-2 border-t border-neutral-800 flex gap-2">
        <input 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 text-xs"
        />
        <button onClick={handleSend} className="bg-blue-600 p-2 rounded-xl"><MessageSquare size={16}/></button>
      </div>
    </div>
  );
};
