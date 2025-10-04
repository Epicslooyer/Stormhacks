import React, { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

const ChatBox: React.FC = () => {
  const [message, setMessage] = useState("");
  const messages = useQuery(api.chats.getMessages) || [];
  const sendMessage = useMutation(api.chats.sendMessage);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      await sendMessage({ text: message });
      setMessage("");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 w-full h-1/4 bg-white border-t border-gray-300 shadow-lg flex flex-col z-50">
      <div className="flex-1 overflow-y-auto p-2">
        {messages.map((msg: any) => (
          <div key={msg._id} className="mb-1 text-sm">
            <span className="font-semibold">{msg.user || "Anon"}:</span> {msg.text}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <form onSubmit={handleSend} className="flex p-2 border-t border-gray-200">
        <input
          className="flex-1 border rounded px-2 py-1 mr-2 focus:outline-none"
          value={message}
          onChange={e => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-1 rounded hover:bg-blue-600"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default ChatBox;
