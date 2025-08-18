import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import { useAuth } from './AuthContext';
import { getThreads, getThreadHistory, deleteThread, renameThread, postChatMessage } from './api';
import DocumentViewer from './DocumentViewer'; 
import { IconMessagePlus, IconLogout, IconTrash, IconPencil, IconCheck, IconMenu2, IconX, IconFileText } from '@tabler/icons-react';
import remarkGfm from 'https://esm.sh/remark-gfm@4';
import './App.css';

function ChatPage() {
  const { logout } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threads, setThreads] = useState([]);
  const [currentThreadId, setCurrentThreadId] = useState(null);
  const [editingThreadId, setEditingThreadId] = useState(null);
  const [tempThreadName, setTempThreadName] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false); // Thay đổi từ isSidebarOpen
  const [viewingFileUrl, setViewingFileUrl] = useState(null);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);

  const fetchThreads = async () => {
    try {
      const data = await getThreads();
      setThreads(data);
    } catch (error) {
      console.error("Failed to fetch threads:", error);
      if (error.message.includes("Could not validate credentials")) {
        logout();
      }
    }
  };

  useEffect(() => {
    fetchThreads();
  }, [logout]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input]);

  const loadConversation = async (threadId) => {
    if (isLoading || threadId === currentThreadId) return;
    setIsLoading(true);
    setCurrentThreadId(threadId);
    setMessages([]);
    setViewingFileUrl(null);
    try {
      const data = await getThreadHistory(threadId);
      const formattedMessages = data.messages.map(msg => ({
        sender: msg.type === 'human' ? 'user' : 'ai',
        text: msg.content,
        sources: msg.sources || []
      }));
      setMessages(formattedMessages);
    } catch (error) {
      console.error(`Failed to load conversation ${threadId}:`, error);
      setMessages([{ sender: 'ai', text: 'Không thể tải cuộc trò chuyện này.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const startNewConversation = () => {
    setCurrentThreadId(null);
    setMessages([]);
    setEditingThreadId(null);
    setViewingFileUrl(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { sender: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    const isNewThread = !currentThreadId;
    const threadIdToUse = currentThreadId || crypto.randomUUID();
    
    if (isNewThread) {
      setCurrentThreadId(threadIdToUse);
    }
    
    const messageToSend = input;
    setInput('');

    try {
      const data = await postChatMessage(threadIdToUse, messageToSend);
      const aiMessage = { 
        sender: 'ai', 
        text: data.answer,
        sources: data.sources || [] 
      };
      setMessages(prev => [...prev, aiMessage]);

      if (isNewThread) {
        await fetchThreads();
      }
    } catch (error) {
      console.error("Failed to fetch AI response:", error);
      const errorMessage = { sender: 'ai', text: `Xin lỗi, đã có lỗi xảy ra: ${error.message}` };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteThread = async (threadIdToDelete) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa cuộc trò chuyện này không?`)) return;
    try {
      await deleteThread(threadIdToDelete);
      setThreads(threads.filter((t) => t.thread_id !== threadIdToDelete));
      if (currentThreadId === threadIdToDelete) {
        startNewConversation();
      }
    } catch (error) {
      console.error("Lỗi khi xóa thread:", error);
      alert("Đã có lỗi xảy ra, không thể xóa cuộc trò chuyện.");
    }
  };

  const handleRename = (thread) => {
    setEditingThreadId(thread.thread_id);
    setTempThreadName(thread.name);
  };

  const handleSaveName = async (threadId) => {
    if (!tempThreadName.trim()) return;
    try {
      await renameThread(threadId, tempThreadName);
      setThreads(threads.map((t) =>
        t.thread_id === threadId ? { ...t, name: tempThreadName } : t
      ));
    } catch (error) {
      console.error("Lỗi khi đổi tên:", error);
      alert("Không thể đổi tên cuộc trò chuyện.");
    } finally {
      setEditingThreadId(null);
    }
  };

  const handleViewSource = (sourceUrl) => {
    setViewingFileUrl(sourceUrl);
  };

  return (
    <div className={`app-container ${viewingFileUrl ? 'with-viewer' : ''}`}>
      <div className={`history-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
        <div className="history-header">
          <h2>Lịch sử Chat</h2>
          <button className="toggle-sidebar-btn" onClick={() => setIsSidebarCollapsed(true)}>
            <IconX size={20} />
          </button>
        </div>
        <div className="history-list">
          {threads.map((thread) => (
            <div key={thread.thread_id} className="history-item-container">
              {editingThreadId === thread.thread_id ? (
                <div className="rename-container">
                  <input
                    type="text"
                    value={tempThreadName}
                    onChange={(e) => setTempThreadName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName(thread.thread_id)}
                    autoFocus
                    placeholder="Nhập tên mới"
                  />
                  <button onClick={() => handleSaveName(thread.thread_id)}><IconCheck size={18} /></button>
                </div>
              ) : (
                <>
                  <div
                    className={`history-item ${thread.thread_id === currentThreadId ? 'active' : ''}`}
                    onClick={() => loadConversation(thread.thread_id)}
                    title={thread.name}
                  >
                    <span className="thread-name">{thread.name}</span>
                    <span className="thread-date">{new Date(thread.updated_at).toLocaleString()}</span>
                  </div>
                  <div className="history-item-actions">
                    <button className="rename-thread-btn" onClick={() => handleRename(thread)} title="Đổi tên"><IconPencil size={18} /></button>
                    <button className="delete-thread-btn" onClick={() => handleDeleteThread(thread.thread_id)} title="Xóa"><IconTrash size={18} /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
      <div className="main-content">
        <header className="chat-header">
          <div className="header-left">
            {isSidebarCollapsed && (
              <button className="sidebar-open-btn" onClick={() => setIsSidebarCollapsed(false)}>
                <IconMenu2 size={24} />
              </button>
            )}
            <h1>Chatbot Tư vấn Học vụ</h1>
          </div>
          <div className="header-actions">
            <button onClick={startNewConversation} className="new-chat-btn"><IconMessagePlus size={20} /> Trò chuyện mới</button>
            <button onClick={logout} className="logout-btn"><IconLogout size={20} /> Đăng xuất</button>
          </div>
        </header>
        <main className="chat-messages">
          {messages.length === 0 && !isLoading && (
            <div className="empty-chat-placeholder">
              <h2>Xin chào!</h2>
              <p>Bạn cần hỗ trợ về vấn đề học vụ nào?</p>
            </div>
          )}
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-bubble">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {msg.text}
                </ReactMarkdown>
                {msg.sources && msg.sources.length > 0 && (
                  <div className="message-sources">
                    <strong>Nguồn tham khảo:</strong>
                    <ul>
                      {msg.sources.map((source, idx) => (
                        <li key={idx}>
                          <button onClick={() => handleViewSource(source.url)} className="source-link">
                            <IconFileText size={16} />
                            {source.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message ai">
              <div className="message-bubble loading-bubble"><div className="spinner"></div></div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </main>
        <footer className="chat-input-area">
          <form onSubmit={handleSubmit} className="chat-form">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Nhập câu hỏi về quy chế, lịch thi, cố vấn học tập..."
              disabled={isLoading}
              rows={1}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(e); } }}
            />
            <button type="submit" disabled={isLoading || !input.trim()}>Gửi</button>
          </form>
        </footer>
      </div>
      <DocumentViewer
        fileUrl={viewingFileUrl}
        onClose={() => setViewingFileUrl(null)}
      />
    </div>
  );
}

export default ChatPage;