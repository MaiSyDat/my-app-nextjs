/**
 * Component hiển thị vùng chat hoặc Friends view
 * 
 * Component này xử lý:
 * - Hiển thị danh sách tin nhắn giữa 2 users
 * - Kết nối Socket.io để nhận tin nhắn mới realtime
 * - Gửi tin nhắn mới qua Socket.io và API
 * - Lazy loading tin nhắn cũ khi scroll lên
 * - Auto scroll xuống tin nhắn mới
 * - Reset unread count khi mở chat với user
 * - Đánh dấu tin nhắn đã đọc khi mở chat
 */

"use client";

import { useRef, useEffect, useState, useLayoutEffect, useCallback, useMemo } from "react";
import { io, Socket } from "socket.io-client";
import dynamic from "next/dynamic";
import ChatHeader from "./ChatHeader";
import UserProfileHeader from "./UserProfileHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import LoadingSpinner from "../../common/LoadingSpinner";
import { useFriendsContext } from "@/app/contexts/FriendsContext";
import { useToast } from "@/app/ui/toast";
import { useUnreadMessages } from "@/app/contexts/UnreadMessagesContext";
import { getUserFromStorage, getUserIdFromStorage, getSocketUrl } from "@/app/lib/utils";
import type { Message, ChatUser } from "@/app/types";

// Lazy load FriendsView để tối ưu performance
const FriendsView = dynamic(() => import("../friends/FriendsView"), {
  ssr: false,
});

// Props for MessageArea
interface MessageAreaProps {
  activeItem?: string;
  onActiveItemChange?: (item: string) => void;
}

// Component hiển thị chat hoặc Friends view
export default function MessageArea({ activeItem, onActiveItemChange }: MessageAreaProps) {
  // Ref để scroll đến cuối danh sách tin nhắn
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Kiểm tra xem có phải đang chat với user không (bắt đầu bằng "user-")
  const isUserChat = activeItem?.startsWith("user-");

  // State quản lý messages
  const [messages, setMessages] = useState<Array<{
    id: number;
    messageId?: string; // ID thực từ database
    type?: string;
    date?: string;
    author?: string;
    avatar?: string;
    timestamp?: string;
    content?: string;
    icon?: string;
    createdAt?: Date | string;
    senderId?: string; // ID người gửi để kiểm tra quyền xóa
  }>>([]);
  
  // State quản lý loading messages
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  
  // State quản lý số lượng tin nhắn đang hiển thị (lazy loading)
  const [displayedCount, setDisplayedCount] = useState(20);
  
  // State để ẩn container cho đến khi scroll position được set
  const [isScrollReady, setIsScrollReady] = useState(false);

  // State quản lý input message
  const [messageInput, setMessageInput] = useState("");
  
  // State để lưu thông tin user hiện tại đang chat
  const [currentChatUser, setCurrentChatUser] = useState<ChatUser | null>(null);
  
  // Ref để lưu currentChatUser cho socket handler
  const currentChatUserRef = useRef(currentChatUser);
  
  // Cập nhật ref khi currentChatUser thay đổi
  useEffect(() => {
    currentChatUserRef.current = currentChatUser;
  }, [currentChatUser]);

  // Sử dụng FriendsContext để quản lý friends state tập trung
  const { friends: friendsList, fetchFriends } = useFriendsContext();
  
  // Sử dụng toast để hiển thị thông báo
  const { showError, showSuccess } = useToast();
  
  // Sử dụng useUnreadMessages để reset unread count khi mở chat
  const { resetUnread, setCurrentChatUserId } = useUnreadMessages();

  // Lấy username và userId từ localStorage
  const [currentUsername, setCurrentUsername] = useState("You");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  /**
   * Khởi tạo: Lấy thông tin user từ localStorage
   */
  useEffect(() => {
    const user = getUserFromStorage();
    if (user) {
      setCurrentUsername(user.username || "You");
      setCurrentUserId(user.id || user._id || null);
    }
  }, []);

  /**
   * Kết nối Socket.io cho realtime messaging
   * - Tự động detect hostname để hỗ trợ mạng nội bộ
   * - Lắng nghe tin nhắn mới và cập nhật UI
   */
  useEffect(() => {
    if (!currentUserId) return;

    // Kết nối đến Socket.io server
    const socket = io(getSocketUrl(), {
      transports: ["websocket", "polling"],
    });

    socketRef.current = socket;

    // Khi kết nối thành công, gửi userId lên server
    socket.on("connect", () => {
      socket.emit("user:connect", currentUserId);
    });

    /**
     * Handler nhận tin nhắn mới từ server
     * - Chỉ thêm tin nhắn nếu đang chat với người gửi
     * - Tránh duplicate bằng cách kiểm tra content và timestamp
     */
    const handleMessageReceive = (data: any) => {
      const currentChatUser = currentChatUserRef.current;
      
      // Chỉ thêm tin nhắn nếu đang chat với người gửi
      if (!currentChatUser || data.senderId !== currentChatUser.id) {
        return;
      }

      // Thêm tin nhắn vào danh sách
      setMessages((prev) => {
        const createdAt = data.createdAt || new Date();
        
        // Kiểm tra xem tin nhắn đã có chưa (tránh duplicate)
        const exists = prev.some(
          (msg) => {
            if (!msg.createdAt) return false;
            return (
              msg.content === data.content &&
              Math.abs(
                new Date(msg.createdAt).getTime() - new Date(createdAt).getTime()
              ) < 2000
            );
          }
        );
        if (exists) return prev;
        const newMessage = {
          id: prev.length > 0 ? Math.max(...prev.map(m => m.id)) + 1 : 1,
          author: currentChatUser.name,
          avatar: currentChatUser.name.charAt(0).toUpperCase(),
          timestamp: new Date(createdAt).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "numeric",
            year: "numeric",
          }),
          content: data.content,
          createdAt: createdAt,
        };

        return [...prev, newMessage];
      });

      // Auto scroll xuống tin nhắn mới
      setTimeout(() => {
        if (messagesContainerRef.current) {
          messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
        }
      }, 100);
    };

    socket.on("message:receive", handleMessageReceive);

    socket.on("disconnect", () => {
      // Socket disconnected - sẽ tự động reconnect
    });

    // Cleanup khi component unmount
    return () => {
      socket.off("message:receive", handleMessageReceive);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentUserId]);

  // Friends list được quản lý bởi useFriends hook, không cần fetch ở đây

  /**
   * Lấy thông tin user từ activeItem (user-{friendId})
   * - Parse friendId từ activeItem
   * - Tìm friend trong friendsList và set currentChatUser
   * - Reset unread count khi mở chat với user
   * - Thông báo cho context biết user nào đang được chat
   */
  useEffect(() => {
    if (isUserChat && activeItem) {
      const friendId = activeItem.replace("user-", "");
      // So sánh string để đảm bảo chính xác
      const friend = friendsList.find(f => String(f.friend.id) === String(friendId));
      
      if (friend) {
        setCurrentChatUser({
          id: friend.friend.id,
          name: friend.friend.username,
          avatar: friend.friend.username.charAt(0).toUpperCase(),
          tag: friend.friend.email.split("@")[0] || friend.friend.id.slice(-4),
          email: friend.friend.email,
        });
        // Reset unread count khi mở chat với user này
        resetUnread(friend.friend.id);
        // Thông báo cho context biết user này đang được chat
        setCurrentChatUserId(friend.friend.id);
        
        // Đánh dấu tất cả tin nhắn từ user này là đã đọc (async, không block UI)
        (async () => {
          try {
            const userId = getUserIdFromStorage();
            if (!userId) return;

            const response = await fetch(
              `/api/messengers?senderId=${friend.friend.id}&receiverId=${userId}`
            );
            if (!response.ok) return;
            
            const data = await response.json();
            const unreadMessages = data.messages?.filter((msg: any) => !msg.isRead) || [];
            if (unreadMessages.length === 0) return;
            
            const messageIds = unreadMessages.map((msg: any) => msg._id || msg.id);
            await fetch("/api/messengers/read", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ messageIds, userId }),
            });
          } catch (error) {
            // Silent fail
          }
        })();
      } else {
        // Nếu không tìm thấy friend trong danh sách, quay về Friends view
        setCurrentChatUser(null);
        setCurrentChatUserId(null);
        onActiveItemChange?.("friends");
      }
    } else {
      setCurrentChatUser(null);
      setCurrentChatUserId(null);
    }
  }, [activeItem, isUserChat, friendsList, resetUnread, setCurrentChatUserId, onActiveItemChange]);

  const currentUser = currentChatUser;

  /**
   * Fetch messages từ API
   * - Lấy tất cả tin nhắn giữa currentUser và currentChatUser
   * - Format lại để hiển thị trong UI
   * - Memoized với useCallback
   */
  const fetchMessages = useCallback(async () => {
    if (!currentUser) return;
    
    setIsLoadingMessages(true);
    try {
      const userId = getUserIdFromStorage();
      if (!userId) {
        setIsLoadingMessages(false);
        return;
      }
      
      const response = await fetch(
        `/api/messengers?senderId=${userId}&receiverId=${currentUser.id}`
      );
      
      // Nếu không còn là bạn bè (403), đóng chat và quay về Friends view
      if (response.status === 403) {
        setMessages([]);
        onActiveItemChange?.("friends");
        showError("Bạn không còn là bạn bè với người dùng này");
        setIsLoadingMessages(false);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        const formattedMessages: Message[] = data.messages.map((msg: any, index: number) => {
            // Xử lý senderId - có thể là ObjectId string hoặc object đã populate
            let senderIdStr: string;
            if (typeof msg.senderId === 'object' && msg.senderId !== null) {
              // Nếu đã được populate, lấy _id hoặc id
              senderIdStr = msg.senderId._id?.toString() || msg.senderId.id?.toString() || msg.senderId.toString();
            } else {
              // Nếu là string hoặc ObjectId
              senderIdStr = msg.senderId?.toString() || String(msg.senderId);
            }

            // So sánh với userId hiện tại
            const isFromCurrentUser = senderIdStr === userId;
            
            // Lấy tên người gửi
            let senderName: string;
            if (isFromCurrentUser) {
              // Tin nhắn từ user hiện tại
              senderName = currentUsername;
            } else {
              // Tin nhắn từ người khác - lấy từ populated object hoặc currentUser
              if (typeof msg.senderId === 'object' && msg.senderId?.username) {
                senderName = msg.senderId.username;
              } else {
                senderName = currentUser.name;
              }
            }
          
          const senderAvatar = senderName.charAt(0).toUpperCase();
          
          return {
            id: index + 1,
            messageId: msg._id?.toString() || msg.id?.toString(),
            author: senderName,
            avatar: senderAvatar,
            timestamp: new Date(msg.createdAt).toLocaleString("vi-VN", {
              hour: "2-digit",
              minute: "2-digit",
              day: "numeric",
              month: "numeric",
              year: "numeric",
            }),
            content: msg.content,
            createdAt: msg.createdAt,
            senderId: senderIdStr,
          };
        });
        
        setMessages(formattedMessages);
      } else {
        // Nếu response không ok, kiểm tra status code
        if (response.status === 403) {
          setMessages([]);
          onActiveItemChange?.("friends");
          showError("Bạn không còn là bạn bè với người dùng này");
        } else {
          setMessages([]);
        }
      }
    } catch (error) {
      setMessages([]);
      console.error("Error fetching messages:", error);
    } finally {
      setIsLoadingMessages(false);
    }
  }, [currentUser, currentUserId, onActiveItemChange, showError]);

  // Reset isScrollReady khi chuyển user
  useEffect(() => {
    setIsScrollReady(false);
  }, [activeItem]);

  // Set scroll position ở cuối ngay từ đầu - KHÔNG có hiệu ứng scroll
  useLayoutEffect(() => {
    if (isUserChat && messagesContainerRef.current && messages.length > 0) {
      const container = messagesContainerRef.current;
      container.style.scrollBehavior = 'auto';
      container.scrollTop = container.scrollHeight;
      setIsScrollReady(true);
    }
  }, [activeItem, isUserChat, messages.length]);
  
  // Đảm bảo scroll ở cuối sau khi DOM render xong (backup)
  useEffect(() => {
    if (isUserChat && messagesContainerRef.current && messages.length > 0) {
      const container = messagesContainerRef.current;
      requestAnimationFrame(() => {
        if (container) {
          container.style.scrollBehavior = 'auto';
          container.scrollTop = container.scrollHeight;
          container.style.scrollBehavior = '';
          setIsScrollReady(true);
        }
      });
    }
  }, [activeItem, isUserChat, messages.length]);

  // Reset messages về ban đầu khi chuyển user khác
  useEffect(() => {
    if (isUserChat && currentUser) {
      fetchMessages();
      setMessageInput("");
      setDisplayedCount(20);
      setIsScrollReady(false);
    } else {
      setMessages([]);
      setMessageInput("");
      setDisplayedCount(20);
      setIsScrollReady(false);
    }
  }, [activeItem, isUserChat, currentUser, fetchMessages]);
  
  /**
   * Handler scroll để lazy load tin nhắn cũ
   * - Khi scroll gần đầu (< 300px), load thêm 20 tin nhắn
   * - Giữ vị trí scroll sau khi load để UX mượt mà
   * - Memoized với useCallback
   */
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (!container || !isUserChat || messages.length === 0) return;
    
    // Nếu scroll gần đầu (trong vòng 300px từ đầu) và chưa load hết
    if (container.scrollTop < 300 && displayedCount < messages.length) {
      const oldScrollHeight = container.scrollHeight;
      const oldScrollTop = container.scrollTop;
      
      // Load thêm 20 tin nhắn cũ
      setDisplayedCount(prev => {
        const newCount = Math.min(prev + 20, messages.length);
        // Giữ vị trí scroll sau khi load thêm
        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            const scrollDiff = newScrollHeight - oldScrollHeight;
            container.scrollTop = oldScrollTop + scrollDiff;
          }
        });
        return newCount;
      });
    }
  }, [isUserChat, messages.length, displayedCount]);

  /**
   * Handler gửi tin nhắn
   * - Gửi qua Socket.io để realtime
   * - Lưu vào database qua API
   * - Tránh duplicate bằng cách kiểm tra timestamp
   * - Memoized với useCallback
   */
  const handleSendMessage = useCallback(async () => {
    if (!messageInput.trim() || !currentUser || !currentUserId) return;
    
    const messageContent = messageInput.trim();
    setMessageInput(""); // Clear input ngay lập tức (optimistic update)
    
    try {
      // Gửi tin nhắn qua Socket.io (realtime)
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit("message:send", {
          senderId: currentUserId,
          receiverId: currentUser.id,
          content: messageContent,
          messageType: "text",
        });
      }

      // Lưu tin nhắn vào database qua API
      const response = await fetch("/api/messengers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          senderId: currentUserId,
          receiverId: currentUser.id,
          content: messageContent,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const savedMessage = data.data;
        
        // Format tin nhắn đã lưu để thêm vào danh sách
        const newMessage = {
          id: messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1,
          author: currentUsername,
          avatar: currentUsername.charAt(0).toUpperCase(),
          timestamp: new Date(savedMessage.createdAt).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "numeric",
            year: "numeric",
          }),
          content: messageContent,
          createdAt: savedMessage.createdAt,
        };

        // Thêm tin nhắn vào danh sách (nếu chưa có từ socket)
        setMessages((prev) => {
          // Kiểm tra xem tin nhắn đã có chưa (tránh duplicate với socket)
          const savedCreatedAt = savedMessage.createdAt || new Date();
          const exists = prev.some(
            (msg) => {
              if (!msg.createdAt) return false;
              return (
                msg.content === messageContent &&
                Math.abs(
                  new Date(msg.createdAt).getTime() - new Date(savedCreatedAt).getTime()
                ) < 2000
              );
            }
          );
          if (exists) return prev;
          return [...prev, newMessage];
        });

        // Auto scroll xuống tin nhắn mới
        setTimeout(() => {
          if (messagesContainerRef.current) {
            messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
          }
        }, 100);
      } else {
        const errorData = await response.json();
        showError(errorData.message || "Có lỗi xảy ra khi gửi tin nhắn");
        setMessageInput(messageContent);
      }
    } catch (error) {
      showError("Có lỗi xảy ra khi gửi tin nhắn");
      setMessageInput(messageContent);
    }
  }, [messageInput, currentUser, currentUserId, currentUsername, messages.length, socketRef, showError]);

  /**
   * Handler khi nhấn Enter để gửi tin nhắn
   * - Enter: gửi tin nhắn
   * - Shift + Enter: xuống dòng
   * - Memoized với useCallback
   */
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Nếu đang chat với user, hiển thị giao diện chat
  if (isUserChat && currentUser) {
    const user = currentUser;
    return (
      <div className="h-full flex flex-col bg-linear-to-br from-[#FFFFFF] via-[#F7F8F9] to-[#F2F3F5]">
        {/* Header - cố định ở trên */}
        <div className="shrink-0">
          <ChatHeader 
            userName={user.name} 
            userAvatar={user.avatar}
            friendId={user.id}
            onUnfriend={() => {
              // Quay về Friends view sau khi xóa bạn
              onActiveItemChange?.("friends");
            }}
            onBlock={() => {
              // Quay về Friends view sau khi chặn
              onActiveItemChange?.("friends");
            }}
          />
        </div>

        {/* Message List - scrollable, chiếm phần còn lại */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
          {isLoadingMessages ? (
            <div className="h-full flex items-center justify-center">
              <LoadingSpinner size="lg" text="Đang tải tin nhắn..." />
            </div>
          ) : (
            <MessageList
              messages={messages}
              displayedCount={displayedCount}
              onScroll={handleScroll}
              containerRef={messagesContainerRef}
              userProfileHeader={
                <UserProfileHeader
                  userName={user.name}
                  userEmail={user.email}
                  userTag={user.tag}
                  friendId={user.id}
                  onUnfriend={() => {
                    // Quay về Friends view sau khi xóa bạn
                    onActiveItemChange?.("friends");
                  }}
                  onBlock={() => {
                    // Quay về Friends view sau khi chặn
                    onActiveItemChange?.("friends");
                  }}
                />
              }
              currentUserId={currentUserId}
            />
          )}
        </div>

        {/* Input - cố định ở dưới */}
        <div className="shrink-0">
          <MessageInput
            userName={user.name}
            value={messageInput}
            onChange={setMessageInput}
            onKeyPress={handleKeyPress}
          />
        </div>
      </div>
    );
  }

  // Default Friends view
  return <FriendsView onActiveItemChange={onActiveItemChange} />;
}

