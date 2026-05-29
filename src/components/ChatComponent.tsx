/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { supabaseService } from '../lib/supabase';
import { Profile, RideMessage } from '../types';
import { Send, MessageSquare, Loader } from 'lucide-react';

interface ChatProps {
  rideId: string;
  currentUser: Profile;
}

export function ChatComponent({ rideId, currentUser }: ChatProps) {
  const [messages, setMessages] = useState<RideMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Carregar mensagens iniciais
  useEffect(() => {
    let active = true;

    async function loadMessages() {
      setLoading(true);
      const data = await supabaseService.getMessages(rideId);
      if (active) {
        setMessages(data);
        setLoading(false);
        // Rolar para o final após carregamento
        setTimeout(scrollToBottom, 80);
      }
    }

    loadMessages();

    // Inscrever no Realtime de novas mensagens
    const unsubscribe = supabaseService.subscribeToMessages(rideId, (newMsg) => {
      if (active) {
        setMessages(prev => {
          // Evitar mensagens duplicadas
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        setTimeout(scrollToBottom, 50);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [rideId]);

  const scrollToBottom = () => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || sending) return;

    const messageToSend = inputText.trim();
    setInputText('');
    setSending(true);

    try {
      const response = await supabaseService.sendMessage(rideId, currentUser.id, messageToSend);
      if (response) {
        // Se estiver em modo real, a inscrição no Realtime adicionará a mensagem.
        // Se por algum motivo estiver atrasado ou em demo, adicionamos localmente de forma segura se não estiver lá
        setMessages(prev => {
          if (prev.some(m => m.id === response.id)) return prev;
          // Anexar profile temporário para o próprio usuário enviar de forma instantânea na UI
          const messageWithProfile: RideMessage = {
            ...response,
            profiles: currentUser
          };
          return [...prev, messageWithProfile];
        });
        setTimeout(scrollToBottom, 50);
      }
    } catch (e) {
      console.error('Erro ao enviar mensagem', e);
    } finally {
      setSending(false);
    }
  };

  // Formatar hora legível (HH:MM)
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="bg-roxou-card border border-slate-800/80 rounded-2xl flex flex-col h-[450px] overflow-hidden">
      {/* Header do Chat */}
      <div className="bg-slate-900/60 px-5 py-3 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-roxou-purple" />
          <h3 className="font-display font-semibold text-sm text-slate-200">Chat Interno da Corrida</h3>
        </div>
        <span className="text-[10px] bg-roxou-purple/20 text-roxou-neon border border-roxou-purple/30 px-2 py-0.5 rounded font-mono font-medium">
          MOTORISTA &amp; PASSAGEIRO
        </span>
      </div>

      {/* Caixa de Mensagens */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#0e0c16]/50">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
            <Loader className="w-6 h-6 animate-spin text-roxou-purple" />
            <p className="text-xs">Carregando conversa...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500 space-y-2">
            <div className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400">
              💬
            </div>
            <p className="text-sm font-medium text-slate-400">Nenhuma mensagem ainda</p>
            <p className="text-xs text-slate-500 max-w-[240px]">
              Tire dúvidas sobre trajetos, bagagens, atrasos do voo ou instrução de embarque aqui.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === currentUser.id;
            const senderName = msg.profiles?.full_name || (msg.profiles?.role === 'admin' ? 'Motorista (Admin)' : 'Passageiro');
            
            return (
              <div
                key={msg.id}
                className={`flex flex-col max-w-[85%] ${isMe ? 'ml-auto items-end' : 'mr-auto items-start'}`}
              >
                {/* Nome do remetente */}
                <span className="text-[10px] text-slate-505 mb-1 font-semibold px-1 text-slate-400">
                  {isMe ? 'Você' : senderName}
                </span>

                {/* Balão */}
                <div
                  className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    isMe
                      ? 'bg-roxou-purple text-white rounded-tr-none shadow-neon-purple/10'
                      : 'bg-slate-900 text-slate-200 border border-slate-800/80 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap break-all text-left">{msg.message}</p>
                  
                  {/* Horário */}
                  <span className="block text-[8px] text-left text-white/50 text-right mt-1 font-mono">
                    {formatTime(msg.created_at)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Formulário de Envio */}
      <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800/80 bg-slate-950/80 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Escreva sua mensagem..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-roxou-purple transition-colors"
          disabled={sending}
        />
        <button
          type="submit"
          className="bg-roxou-purple hover:bg-roxou-neon disabled:bg-slate-800 text-white p-2.5 px-4 rounded-xl flex items-center justify-center transition-colors shadow-lg active:scale-95 duration-100 cursor-pointer"
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <Loader className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </form>
    </div>
  );
}
export default ChatComponent;
