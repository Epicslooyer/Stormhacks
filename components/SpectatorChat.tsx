"use client";

import { useMutation, useQuery } from "convex/react";
import { useState, useRef, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, MessageCircle, Users } from "lucide-react";

interface SpectatorChatProps {
	gameId: Id<"games">;
	className?: string;
}

interface ChatMessage {
	_id: Id<"chats">;
	gameId: Id<"games">;
	authorId: Id<"users"> | null;
	message: string;
	sentAt: number;
	editedAt?: number;
	isSystem?: boolean;
	author: {
		name: string;
		image?: string;
	};
}

export default function SpectatorChat({ gameId, className }: SpectatorChatProps) {
	const [message, setMessage] = useState("");
	const [isExpanded, setIsExpanded] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	const messages = useQuery(api.chats.getRecentMessages, { 
		gameId, 
		limit: 100 
	}) as ChatMessage[] | undefined;

	const sendMessage = useMutation(api.chats.sendMessage);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages]);

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!message.trim()) return;

		try {
			await sendMessage({
				gameId,
				message: message.trim(),
			});
			setMessage("");
		} catch (error) {
			console.error("Failed to send message:", error);
		}
	};

	const formatTime = (timestamp: number) => {
		return new Date(timestamp).toLocaleTimeString([], { 
			hour: '2-digit', 
			minute: '2-digit' 
		});
	};

	const getMessageCount = () => {
		return messages?.length || 0;
	};

	if (!isExpanded) {
		return (
			<Card className={`${className} cursor-pointer transition-all hover:shadow-md`} onClick={() => setIsExpanded(true)}>
				<CardContent className="p-4">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-3">
							<MessageCircle className="h-5 w-5 text-muted-foreground" />
							<div>
								<p className="font-medium">Spectator Chat</p>
								<p className="text-sm text-muted-foreground">
									{getMessageCount()} messages
								</p>
							</div>
						</div>
						<Badge variant="outline" className="flex items-center gap-1">
							<Users className="h-3 w-3" />
							Live
						</Badge>
					</div>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card className={`${className} flex flex-col h-96 max-h-96`}>
			<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 flex-shrink-0">
				<CardTitle className="text-lg font-semibold flex items-center gap-2">
					<MessageCircle className="h-5 w-5" />
					Spectator Chat
				</CardTitle>
				<div className="flex items-center gap-2">
					<Badge variant="outline" className="flex items-center gap-1">
						<Users className="h-3 w-3" />
						{getMessageCount()} messages
					</Badge>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsExpanded(false)}
						className="h-8 w-8 p-0"
					>
						×
					</Button>
				</div>
			</CardHeader>
			<CardContent className="flex-1 flex flex-col p-0 min-h-0">
				<ScrollArea className="flex-1 px-4 min-h-0">
					<div className="space-y-3 pb-4">
						{messages?.length === 0 ? (
							<div className="text-center py-8 text-muted-foreground">
								<MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
								<p>No messages yet. Be the first to chat!</p>
							</div>
						) : (
							messages?.map((msg) => (
								<div
									key={msg._id}
									className={`flex gap-3 ${
										msg.isSystem ? "justify-center" : "justify-start"
									}`}
								>
									{msg.isSystem ? (
										<div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-3 py-1 rounded-full">
											<Badge variant="secondary" className="text-xs">
												System
											</Badge>
											<span>{msg.message}</span>
											<span className="text-xs opacity-70">
												{formatTime(msg.sentAt)}
											</span>
										</div>
									) : (
										<>
											<div className="flex-shrink-0">
												<div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
													{msg.author.name.charAt(0).toUpperCase()}
												</div>
											</div>
											<div className="flex-1 min-w-0">
												<div className="flex items-center gap-2 mb-1">
													<span className="font-medium text-sm text-foreground">
														{msg.author.name}
													</span>
													<span className="text-xs text-muted-foreground">
														{formatTime(msg.sentAt)}
													</span>
												</div>
												<p className="text-sm text-foreground break-words">
													{msg.message}
												</p>
											</div>
										</>
									)}
								</div>
							))
						)}
						<div ref={messagesEndRef} />
					</div>
				</ScrollArea>
				<form onSubmit={handleSendMessage} className="p-4 border-t flex-shrink-0">
					<div className="flex gap-2">
						<Input
							ref={inputRef}
							value={message}
							onChange={(e) => setMessage(e.target.value)}
							placeholder="Type a message..."
							className="flex-1"
							maxLength={500}
						/>
						<Button type="submit" size="sm" disabled={!message.trim()}>
							<Send className="h-4 w-4" />
						</Button>
					</div>
					{message.length > 400 && (
						<p className="text-xs text-muted-foreground mt-1">
							{message.length}/500 characters
						</p>
					)}
				</form>
			</CardContent>
		</Card>
	);
}
