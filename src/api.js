// src/api.js

export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Hàm request chung để gọi API, tự động thêm header Authorization.
 * @param {string} endpoint - Đường dẫn API (ví dụ: '/threads')
 * @param {object} options - Cấu hình cho fetch() (ví dụ: method, body)
 * @returns {Promise<any>}
 */
const request = async (endpoint, options = {}) => {
    const { body, ...customConfig } = options;
    const token = localStorage.getItem("userToken");

    const headers = {
        'Content-Type': 'application/json',
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    // SỬA LỖI TẠI ĐÂY:
    // 1. Ưu tiên method từ customConfig.
    // 2. Nếu không có, mặc định là POST nếu có body, ngược lại là GET.
    const config = {
        method: customConfig.method || (body ? 'POST' : 'GET'),
        ...customConfig,
        headers,
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        // Xử lý các trường hợp không có nội dung trả về (ví dụ: DELETE thành công)
        if (response.status === 204) {
            return;
        }

        const data = await response.json();

        if (!response.ok) {
            // Lấy lỗi chi tiết từ backend FastAPI
            const errorMessage = data.detail || response.statusText;
            throw new Error(errorMessage);
        }

        return data;

    } catch (error) {
        console.error("Lỗi API:", error);
        // Ném lỗi ra ngoài để component có thể bắt và xử lý
        throw error;
    }
};

// --- Các hàm API xác thực (giữ nguyên vì dùng Content-Type khác) ---

export const apiLogin = async (username, password) => {
    const formData = new URLSearchParams({ username, password });
    const response = await fetch(`${API_URL}/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || 'Đăng nhập thất bại.');
    }
    return data;
};

export const apiRegister = async (username, password) => {
    const formData = new URLSearchParams({ username, password });
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.detail || 'Đăng ký thất bại.');
    }
    return data;
};


// --- Các hàm API sử dụng hàm request chung ---

// Lấy danh sách threads
export const getThreads = () => request('/threads/'); // FastAPI router thường yêu cầu dấu / ở cuối

// Lấy lịch sử một thread
export const getThreadHistory = (threadId) => request(`/threads/${threadId}`);

// Xóa một thread
export const deleteThread = (threadId) => request(`/threads/${threadId}`, { method: 'DELETE' });

// Đổi tên một thread
export const renameThread = (threadId, name) => request(`/threads/${threadId}/name`, { method: 'PUT', body: { name } });

// Gửi tin nhắn chat
export const postChatMessage = (thread_id, message) => request('/chat', {
    // method mặc định là POST vì có body
    body: { thread_id, message }
});