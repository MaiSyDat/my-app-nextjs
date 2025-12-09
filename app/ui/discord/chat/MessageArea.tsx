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
import { usePathname, useRouter } from "next/navigation";
import { io, Socket } from "socket.io-client";
import dynamic from "next/dynamic";
import ChatHeader from "./ChatHeader";
import UserProfileHeader from "./UserProfileHeader";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import { useFriendsContext } from "@/app/contexts/FriendsContext";
import { useToast } from "@/app/ui/toast";
import { useUnreadMessages } from "@/app/contexts/UnreadMessagesContext";
import { getUserIdFromStorage, getSocketUrl, formatAvatarUrl, formatMessage, markMessagesAsRead, getDisplayName, getInitials } from "@/app/lib/utils";
import { useCurrentUser } from "@/app/hooks/useCurrentUser";
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
  const pathname = usePathname();
  const router = useRouter();
  
  // Ref để scroll đến cuối danh sách tin nhắn
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Lấy activeItem từ URL pathname - memoized để tránh re-compute
  const currentActiveItem = useMemo(() => {
    if (activeItem) return activeItem;
    if (!pathname) return "friends";
    
    if (pathname === "/channels/me") return "friends";
    
    const match = pathname.match(/^\/channels\/me\/([^/]+)$/);
    if (match && match[1]) {
      return `user-${match[1]}`;
    }
    
    return "friends";
  }, [activeItem, pathname]);
  
  // Kiểm tra xem có phải đang chat với user không - memoized
  const isUserChat = useMemo(() => currentActiveItem?.startsWith("user-"), [currentActiveItem]);

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
  
  // State để lưu friendship status từ DB (để disable input khi bị block)
  const [friendshipStatus, setFriendshipStatus] = useState<string | null>(null);
  
  // Ref để lưu currentChatUser cho socket handler
  const currentChatUserRef = useRef(currentChatUser);
  
  // Cập nhật ref khi currentChatUser thay đổi
  useEffect(() => {
    currentChatUserRef.current = currentChatUser;
  }, [currentChatUser]);

  // Sử dụng FriendsContext để quản lý friends state tập trung
  const { friends: friendsList, pendingRequests, fetchFriends, fetchPendingRequests } = useFriendsContext();
  
  // Sử dụng toast để hiển thị thông báo
  const { showError } = useToast();
  
  // Sử dụng useUnreadMessages để reset unread count khi mở chat
  const { resetUnread, setCurrentChatUserId } = useUnreadMessages();

  // Sử dụng useCurrentUser hook để lấy thông tin user hiện tại
  const currentUserData = useCurrentUser();
  const currentUsername = currentUserData ? getDisplayName(currentUserData) : "You";
  const currentUserAvatar = currentUserData?.avatar || null;
  const currentUserId = currentUserData?.id || getUserIdFromStorage();
  const socketRef = useRef<Socket | null>(null);

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

    // Handler nhận tin nhắn từ socket: chỉ thêm nếu đang chat với người gửi, kiểm tra duplicate bằng content + timestamp (2s)
    const handleMessageReceive = (data: any) => {
      const currentChatUser = currentChatUserRef.current;
      
      // Chỉ thêm tin nhắn nếu đang chat với người gửi
      if (!currentChatUser || data.senderId !== currentChatUser.id) {
        return;
      }

      setMessages((prev) => {
        const createdAt = data.createdAt || new Date();
        
        // Kiểm tra duplicate (content giống và timestamp chênh lệch < 2s)
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
          avatar: formatAvatarUrl(currentChatUser.avatar) || getInitials(currentChatUser.name),
          timestamp: new Date(createdAt).toLocaleString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "numeric",
            year: "numeric",
          }),
          content: data.content,
          createdAt: createdAt,
          senderId: data.senderId || currentChatUser.id,
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
   * - Nếu không tìm thấy trong friendsList, fetch từ API (có thể là user từ conversations)
   * - Reset unread count khi mở chat với user
   * - Thông báo cho context biết user nào đang được chat
   */
  useEffect(() => {
    if (isUserChat && currentActiveItem) {
      const friendId = currentActiveItem.replace("user-", "");
      
      // Tránh reset state sau khi user vừa gửi friend request (nếu không button sẽ quay về "Add Friend")
      const currentUserId = getUserIdFromStorage();
      if (currentChatUser && 
          currentChatUser.id === friendId && 
          currentChatUser.friendshipStatus === "pending" && 
          currentChatUser.requestedBy === currentUserId) {
        return;
      }
      
      // So sánh string để đảm bảo chính xác
      const friend = friendsList.find(f => String(f.friend.id) === String(friendId));
      
      if (friend) {
        const displayName = getDisplayName(friend.friend);
        const avatarUrl = formatAvatarUrl(friend.friend.avatar);
        // Xác định ai là người block (requestedBy lưu ID người block khi status = "blocked")
        const blockedBy = friend.status === "blocked" && friend.requestedBy 
          ? friend.requestedBy.id 
          : null;
        // Xác định ai là người gửi request để hiển thị đúng button (mình gửi = "Friend Request Sent", người khác gửi = "Accept/Decline")
        const requestedBy = friend.status === "pending" && friend.requestedBy
          ? friend.requestedBy.id
          : null;
        
        setCurrentChatUser({
          id: friend.friend.id,
          name: displayName,
          avatar: avatarUrl || "", // Chỉ lưu URL, không lưu initial
          tag: friend.friend.email.split("@")[0] || friend.friend.id.slice(-4),
          email: friend.friend.email,
          username: friend.friend.username, // Lưu username
          friendshipStatus: friend.status, // Lưu friendship status
          blockedBy: blockedBy, // Lưu ID người block
          requestedBy: requestedBy, // Lưu ID người gửi request
          friendshipId: friend.friendshipId, // Lưu friendship ID để accept/reject
        });
        // Reset unread count khi mở chat với user này
        resetUnread(friend.friend.id);
        // Thông báo cho context biết user này đang được chat
        setCurrentChatUserId(friend.friend.id);
        
        // Đánh dấu tất cả tin nhắn từ user này là đã đọc (async, không block UI)
        markMessagesAsRead(friend.friend.id).catch(() => {
          // Silent fail
        });
      } else {
        // Nếu không tìm thấy trong friendsList, kiểm tra xem có đang ở trạng thái "pending" do chính user gửi không
        // Nếu có, không fetch lại từ API để tránh reset state
        const currentUserId = getUserIdFromStorage();
        if (currentChatUser && 
            currentChatUser.id === friendId && 
            currentChatUser.friendshipStatus === "pending" && 
            currentChatUser.requestedBy === currentUserId) {
          // Giữ nguyên state, không fetch lại
          return;
        }
        
        // Nếu không tìm thấy trong friendsList, kiểm tra pending requests trước
        (async () => {
          try {
            const userId = getUserIdFromStorage();
            let friendshipStatus: string | undefined = undefined;
            let requestedBy: string | null = null;
            let blockedBy: string | null = null;
            let friendshipId: string | undefined = undefined;
            
            // Kiểm tra pending requests nếu có userId - fetch từ API để đảm bảo có dữ liệu mới nhất
            if (userId) {
              try {
                const pendingResponse = await fetch(`/api/friends?userId=${userId}&status=pending`, {
                  cache: 'no-store',
                });
                if (pendingResponse.ok) {
                  const pendingData = await pendingResponse.json();
                  const userIdStr = String(userId);
                  
                  // Tìm incoming request (người khác gửi cho mình, requestedBy !== currentUserId)
                  const pendingFriendship = pendingData.friends?.find((f: any) => {
                    const fId = f.friend?.id || f.friend?._id || f.friend;
                    if (String(fId) !== String(friendId)) return false;
                    
                    const requestedById = String(
                      f.requestedBy?._id || 
                      f.requestedBy?.id || 
                      f.requestedBy || 
                      ""
                    );
                    return requestedById && requestedById !== userIdStr;
                  });
                  
                  if (pendingFriendship) {
                    friendshipStatus = "pending";
                    const requestedById = pendingFriendship.requestedBy?.id || 
                                         pendingFriendship.requestedBy?._id || 
                                         pendingFriendship.requestedBy || 
                                         null;
                    requestedBy = requestedById ? String(requestedById) : null;
                    friendshipId = pendingFriendship.friendshipId || 
                                   pendingFriendship._id?.toString() || 
                                   undefined;
                  }
                }
              } catch (error) {
                // Silent fail, tiếp tục fetch user
              }
            }
            
            // Fetch user info từ API
            const response = await fetch(`/api/users/${friendId}`);
            if (response.ok) {
              const data = await response.json();
              const user = data.user;
              const displayName = getDisplayName(user);
              const avatarUrl = formatAvatarUrl(user.avatar);
              
              setCurrentChatUser({
                id: user.id,
                name: displayName,
                avatar: avatarUrl || "",
                tag: user.email.split("@")[0] || user.id.slice(-4),
                email: user.email,
                username: user.username, // Lưu username
                friendshipStatus: friendshipStatus, // Sử dụng status từ pending requests nếu có
                requestedBy: requestedBy,
                blockedBy: blockedBy,
                friendshipId: friendshipId, // Lưu friendship ID
              });
              
              // Reset unread count
              resetUnread(user.id);
              setCurrentChatUserId(user.id);
              
              // Đánh dấu tin nhắn đã đọc
              markMessagesAsRead(user.id).catch(() => {
                // Silent fail
              });
            } else {
              // Nếu không tìm thấy user, quay về Friends view
              setCurrentChatUser(null);
              setCurrentChatUserId(null);
              router.push("/channels/me");
            }
          } catch (error) {
            console.error("Error fetching user:", error);
            setCurrentChatUser(null);
            setCurrentChatUserId(null);
            router.push("/channels/me");
          }
        })();
      }
    } else {
      setCurrentChatUser(null);
      setCurrentChatUserId(null);
    }
  }, [currentActiveItem, isUserChat, friendsList, pendingRequests, resetUnread, setCurrentChatUserId, router]);

  const currentUser = currentChatUser;

  /**
   * Lấy danh sách tin nhắn từ API
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
      
      // Không quay về Friends view khi gặp 403, vẫn cho phép xem tin nhắn cũ
      if (response.status === 403) {
        // Vẫn hiển thị tin nhắn rỗng, không quay về Friends view
        setMessages([]);
        setIsLoadingMessages(false);
        return;
      }
      
      if (response.ok) {
        const data = await response.json();
        const formattedMessages: Message[] = data.messages.map((msg: any, index: number) => {
          return formatMessage(
            msg,
            index,
            userId,
            currentUsername,
            currentUserAvatar,
            currentUser
          );
        });
        
        setMessages(formattedMessages);
      } else {
        // Nếu response không ok, chỉ set messages rỗng, không quay về Friends view
        setMessages([]);
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
  }, [currentActiveItem]);

  // Set scroll position ở cuối ngay từ đầu - KHÔNG có hiệu ứng scroll
  useLayoutEffect(() => {
    if (isUserChat && messagesContainerRef.current && messages.length > 0) {
      const container = messagesContainerRef.current;
      container.style.scrollBehavior = 'auto';
      container.scrollTop = container.scrollHeight;
      setIsScrollReady(true);
    }
  }, [currentActiveItem, isUserChat, messages.length]);
  
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
  }, [currentActiveItem, isUserChat, messages.length]);

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
  }, [currentActiveItem, isUserChat, currentUser, fetchMessages]);
  
  /**
   * Xử lý scroll để tải thêm tin nhắn cũ (lazy load)
   */
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    if (!container || !isUserChat || messages.length === 0) return;
    
    // Load thêm tin nhắn cũ khi scroll gần đầu (300px threshold)
    if (container.scrollTop < 300 && displayedCount < messages.length) {
      // Lưu vị trí scroll trước khi load để giữ vị trí sau khi DOM update
      const oldScrollHeight = container.scrollHeight;
      const oldScrollTop = container.scrollTop;
      
      setDisplayedCount(prev => {
        const newCount = Math.min(prev + 20, messages.length);
        // Tính lại scroll position sau khi thêm tin nhắn (scrollDiff = độ tăng scrollHeight)
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
   * Xử lý gửi tin nhắn
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
        const userAvatar = formatAvatarUrl(currentUserAvatar) || getInitials(currentUsername);
        const newMessage = {
          id: messages.length > 0 ? Math.max(...messages.map(m => m.id)) + 1 : 1,
          author: currentUsername,
          avatar: userAvatar,
          timestamp: new Date(savedMessage.createdAt).toLocaleString("vi-VN", {
            hour: "2-digit",
            minute: "2-digit",
            day: "numeric",
            month: "numeric",
            year: "numeric",
          }),
          content: messageContent,
          createdAt: savedMessage.createdAt,
          senderId: currentUserId || "",
        };

        // Tránh duplicate: tin nhắn có thể đến từ socket (nhanh) và API (chậm), kiểm tra bằng content + timestamp (2s tolerance)
        setMessages((prev) => {
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
        showError(errorData.message || "An error occurred while sending message");
        setMessageInput(messageContent);
      }
    } catch (error) {
      showError("An error occurred while sending message");
      setMessageInput(messageContent);
    }
  }, [messageInput, currentUser, currentUserId, currentUsername, messages.length, socketRef, showError]);

  /**
   * Xử lý khi nhấn phím để gửi tin nhắn
   */
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  /**
   * Lấy trạng thái kết bạn từ API
   */
  const fetchFriendshipStatus = useCallback(async () => {
    if (!currentUser || !currentUserId) {
      setFriendshipStatus(null);
      return;
    }

    try {
      const response = await fetch(`/api/friends/status?userId1=${currentUserId}&userId2=${currentUser.id}`, {
        cache: 'no-store',
      });
      if (response.ok) {
        const data = await response.json();
        setFriendshipStatus(data.status);
      }
    } catch (error) {
      console.error("Error fetching friendship status:", error);
    }
  }, [currentUser, currentUserId]);

  // Fetch friendship status từ DB khi currentUser thay đổi
  useEffect(() => {
    fetchFriendshipStatus();
  }, [fetchFriendshipStatus]);

  // Tính toán isBlocked - memoized
  const isBlocked = useMemo(() => friendshipStatus === "blocked", [friendshipStatus]);

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
            friendshipStatus={user.friendshipStatus}
            requestedBy={user.requestedBy}
            blockedBy={user.blockedBy}
            onUnfriend={() => {
              // Quay về Friends view sau khi xóa bạn
              router.push("/channels/me");
            }}
            onBlock={() => {
              // Không quay về Friends view, chỉ cập nhật UI
            }}
          />
        </div>

        {/* Message List - scrollable, chiếm phần còn lại */}
        <div className="flex-1 min-h-0 overflow-hidden relative">
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
                userUsername={user.username}
                userAvatar={user.avatar || undefined}
                friendId={user.id}
                onUnfriend={async () => {
                  // Fetch lại friends list sau khi unfriend
                  await fetchFriends();
                  // Refresh friendship status
                  await fetchFriendshipStatus();
                }}
                onBlock={async () => {
                  // Fetch lại friends list sau khi block
                  await fetchFriends();
                  // Refresh friendship status
                  await fetchFriendshipStatus();
                }}
                onAddFriend={async () => {
                  // Fetch lại friends và pending requests để cập nhật UI
                  await Promise.all([fetchFriends(), fetchPendingRequests()]);
                  // Refresh friendship status
                  await fetchFriendshipStatus();
                }}
              />
            }
          />
        </div>

        {/* Input - cố định ở dưới */}
        <div className="shrink-0">
          <MessageInput
            userName={user.name}
            value={messageInput}
            onChange={setMessageInput}
            onKeyPress={handleKeyPress}
            disabled={isBlocked}
          />
        </div>
      </div>
    );
  }

  // Default Friends view
  return <FriendsView onActiveItemChange={onActiveItemChange} />;
}

