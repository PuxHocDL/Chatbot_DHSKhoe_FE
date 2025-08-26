import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import MessageList from './MessageList';
import { useAuth } from './AuthContext';
import { getThreads, getThreadHistory, deleteThread, renameThread, postChatMessage, deleteThreadsBatch } from './api';
import DocumentViewer from './DocumentViewer';
import { 
    IconMessagePlus, 
    IconLogout, 
    IconTrash, 
    IconEdit, 
    IconCheck, 
    IconMenu2, 
    IconX, 
    IconSettings,
    IconSelector,
    IconTrashX,
    IconChevronLeft,
    IconChevronRight
} from '@tabler/icons-react';
import './App.css';

function ChatPage() {
    const { user, logout } = useAuth();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [threads, setThreads] = useState([]);
    const [currentThreadId, setCurrentThreadId] = useState(null);
    const [editingThreadId, setEditingThreadId] = useState(null);
    const [tempThreadName, setTempThreadName] = useState('');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [viewingFileUrl, setViewingFileUrl] = useState(null);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedThreads, setSelectedThreads] = useState(new Set());

    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);

    const fetchThreads = async () => {
        try {
            const data = await getThreads();
            setThreads(data);
        } catch (error) {
            console.error("Failed to fetch threads:", error);
        }
    };

    useEffect(() => {
        fetchThreads();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [input]);

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedThreads(new Set());
    };

    const handleThreadSelect = (threadId) => {
        const newSelection = new Set(selectedThreads);
        if (newSelection.has(threadId)) {
            newSelection.delete(threadId);
        } else {
            newSelection.add(threadId);
        }
        setSelectedThreads(newSelection);
    };

    const handleDeleteSelected = async () => {
        if (selectedThreads.size === 0) return;
        const threadsToDelete = Array.from(selectedThreads);
        if (window.confirm(`Bạn có chắc muốn xóa ${threadsToDelete.length} cuộc trò chuyện đã chọn?`)) {
            try {
                await deleteThreadsBatch(threadsToDelete);
                setThreads(threads.filter(t => !threadsToDelete.includes(t.thread_id)));
                if (threadsToDelete.includes(currentThreadId)) {
                    startNewConversation();
                }
                toggleSelectionMode();
            } catch (error) {
                alert("Lỗi khi xóa các cuộc trò chuyện.");
            }
        }
    };

    const handleDeleteAll = async () => {
        if (window.confirm("BẠN CÓ CHẮC CHẮN MUỐN XÓA TẤT CẢ LỊCH SỬ TRÒ CHUYỆN KHÔNG? Hành động này không thể hoàn tác.")) {
            try {
                const allThreadIds = threads.map(t => t.thread_id);
                if (allThreadIds.length > 0) {
                    await deleteThreadsBatch(allThreadIds);
                }
                setThreads([]);
                startNewConversation();
            } catch (error) {
                alert("Lỗi khi xóa tất cả các cuộc trò chuyện.");
            }
        }
    };

    const startNewConversation = () => {
        setCurrentThreadId(null);
        setMessages([]);
        setEditingThreadId(null);
        setViewingFileUrl(null);
    };

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
                sources: msg.sources || [],
                responseTime: msg.response_time_seconds
            }));
            setMessages(formattedMessages);
        } catch (error) {
            console.error(`Failed to load conversation ${threadId}:`, error);
            setMessages([{ sender: 'ai', text: 'Không thể tải cuộc trò chuyện này.' }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!input.trim() || isLoading) return;
        const userMessage = { sender: 'user', text: input };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);
        const isNewThread = !currentThreadId;
        const threadIdToUse = currentThreadId || `thread-${Date.now()}`;
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
                sources: data.sources || [],
                responseTime: data.response_time_seconds
            };
            setMessages(prev => [...prev, aiMessage]);
            if (isNewThread && data.new_thread_info) {
                setThreads(prevThreads => [data.new_thread_info, ...prevThreads]);
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

    const handleViewSource = useCallback((sourceUrl) => {
        setViewingFileUrl(sourceUrl);
    }, []);

    return (
        <div className={`app-container ${viewingFileUrl ? 'with-viewer' : ''}`}>
            {/* SIDEBAR - Cải thiện layout icon */}
            <div className={`history-sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="history-header">
                    {!isSidebarCollapsed && (
                        <>
                            <div className="sidebar-title">
                                <h2>History</h2>
                            </div>
                            <div className="sidebar-controls">
                                {/* Nhóm các nút chức năng chính */}
                                <div className="sidebar-primary-actions">
                                    <button 
                                        onClick={toggleSelectionMode} 
                                        className={`control-btn ${isSelectionMode ? 'active' : ''}`}
                                        title={isSelectionMode ? 'Thoát chế độ chọn' : 'Chế độ chọn nhiều'}
                                    >
                                        <IconSelector size={18} />
                                        {isSelectionMode ? 'Thoát' : 'Chọn'}
                                    </button>
                                    <button 
                                        onClick={handleDeleteAll} 
                                        className="control-btn delete-all" 
                                        title="Xóa tất cả lịch sử"
                                    >
                                        <IconTrashX size={18} />
                                    </button>
                                </div>
                                {/* Nút thu gọn sidebar */}
                                <button 
                                    className="sidebar-toggle-btn" 
                                    onClick={() => setIsSidebarCollapsed(true)}
                                    title="Thu gọn sidebar"
                                >
                                    <IconChevronLeft size={20} />
                                </button>
                            </div>
                        </>
                    )}
                    
                    {/* Khi sidebar collapsed - chỉ hiện nút mở rộng */}
                    {isSidebarCollapsed && (
                        <div className="sidebar-collapsed-header">
                            <button 
                                className="sidebar-expand-btn" 
                                onClick={() => setIsSidebarCollapsed(false)}
                                title="Mở rộng sidebar"
                            >
                                <IconChevronRight size={20} />
                            </button>
                        </div>
                    )}
                </div>

                {!isSidebarCollapsed && (
                    <>
                        <div className="history-list">
                            {threads.map((thread) => (
                                <div key={thread.thread_id} className="history-item-container">
                                    {/* Checkbox chỉ hiện khi ở chế độ chọn */}
                                    {isSelectionMode && (
                                        <div className="thread-selector">
                                            <input
                                                type="checkbox"
                                                className="thread-checkbox"
                                                checked={selectedThreads.has(thread.thread_id)}
                                                onChange={() => handleThreadSelect(thread.thread_id)}
                                            />
                                        </div>
                                    )}
                                    
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
                                            <div className="rename-actions">
                                                <button 
                                                    onClick={() => handleSaveName(thread.thread_id)}
                                                    className="save-btn"
                                                    title="Lưu tên"
                                                >
                                                    <IconCheck size={16} />
                                                </button>
                                                <button 
                                                    onClick={() => setEditingThreadId(null)}
                                                    className="cancel-btn"
                                                    title="Hủy"
                                                >
                                                    <IconX size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <div
                                                className={`history-item ${thread.thread_id === currentThreadId ? 'active' : ''}`}
                                                onClick={isSelectionMode ? () => handleThreadSelect(thread.thread_id) : () => loadConversation(thread.thread_id)}
                                                title={thread.name}
                                            >
                                                <span className="thread-name">{thread.name}</span>
                                                <span className="thread-date">{new Date(thread.updated_at).toLocaleString()}</span>
                                            </div>
                                            
                                            {/* Actions chỉ hiện khi không ở chế độ chọn */}
                                            {!isSelectionMode && (
                                                <div className="history-item-actions">
                                                    <button 
                                                        className="action-btn edit-btn" 
                                                        onClick={() => handleRename(thread)} 
                                                        title="Đổi tên"
                                                    >
                                                        <IconEdit size={16} />
                                                    </button>
                                                    <button 
                                                        className="action-btn delete-btn" 
                                                        onClick={() => handleDeleteThread(thread.thread_id)} 
                                                        title="Xóa"
                                                    >
                                                        <IconTrash size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Thanh hành động chế độ chọn */}
                        {isSelectionMode && (
                            <div className="selection-footer">
                                <div className="selection-info">
                                    <span>Đã chọn: {selectedThreads.size}</span>
                                </div>
                                <button 
                                    onClick={handleDeleteSelected} 
                                    disabled={selectedThreads.size === 0}
                                    className="delete-selected-btn"
                                >
                                    <IconTrash size={16} />
                                    Xóa đã chọn
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
            
            {/* MAIN CONTENT - Cải thiện header */}
            <div className="main-content">
                <header className="chat-header">
                    <div className="header-left">
                        <h1>Chatbot Tư vấn Học vụ</h1>
                    </div>
                    
                    <div className="header-actions">
                        {/* Nút tạo chat mới - đưa lên đầu */}
                        <button onClick={startNewConversation} className="new-chat-btn">
                            <IconMessagePlus size={18} />
                            <span>Chat mới</span>
                        </button>
                        
                        {/* Nút Admin - chỉ hiện với admin */}
                        {user && user.role === 'admin' && (
                            <Link to="/admin" className="admin-link-btn">
                                <IconSettings size={18} />
                                <span>Admin</span>
                            </Link>
                        )}
                        
                        {/* Nút đăng xuất - để cuối */}
                        <button onClick={logout} className="logout-btn">
                            <IconLogout size={18} />
                            <span>Đăng xuất</span>
                        </button>
                    </div>
                </header>
                
                <main className="chat-messages">
                    {messages.length === 0 && !isLoading && (
                        <div className="empty-chat-placeholder">
                            <h2>Xin chào!</h2>
                            <p>Bạn cần hỗ trợ về vấn đề học vụ nào?</p>
                        </div>
                    )}
                    <MessageList
                        messages={messages}
                        isLoading={isLoading}
                        handleViewSource={handleViewSource}
                    />
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
                        <button type="submit" disabled={isLoading || !input.trim()}>
                            Gửi
                        </button>
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