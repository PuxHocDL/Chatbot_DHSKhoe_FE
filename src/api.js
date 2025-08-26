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

/**
 * Tải file tài liệu lên server.
 * @param {FormData} formData - Đối tượng FormData chứa file và collection_name.
 * @returns {Promise<any>}
 */
export const apiUploadDocument = async (formData) => {
    const token = localStorage.getItem("userToken");
    const headers = {};

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }
    
    // Lưu ý: Khi dùng FormData, không cần set 'Content-Type'. 
    // Trình duyệt sẽ tự động làm điều đó với boundary phù hợp.

    try {
        const response = await fetch(`${API_URL}/upload`, {
            method: 'POST',
            headers,
            body: formData,
        });

        const data = await response.json();

        if (!response.ok) {
            const errorMessage = data.detail || response.statusText;
            throw new Error(errorMessage);
        }

        return data;

    } catch (error) {
        console.error("Lỗi API khi upload:", error);
        throw error;
    }
};
export const deleteThreadsBatch = (thread_ids) => 
    request('/threads/delete-batch', { 
        method: 'POST', 
        body: { thread_ids } 
    });

    // Lấy danh sách collections
export const apiGetCollections = () => request('/collections');

// Xóa một collection
export const apiDeleteCollection = (collectionName) => 
    request(`/collections/${collectionName}`, { method: 'DELETE' });

export const apiGetDbStats = () => request('/collections/stats');

export const apiGetCollectionDocuments = (collectionName, limit, offset) => 
    request(`/collections/${collectionName}/documents?limit=${limit}&offset=${offset}`);


export const apiGetResponseStats = () => request('/collections/response-stats');

export const apiGetTokenUsageStats = () => request('/token-usage-stats');