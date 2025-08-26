// src/ProtectedRoute.jsx
import { Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';

// Thêm prop 'adminOnly' để kiểm tra quyền admin
function ProtectedRoute({ children, adminOnly = false }) {
    const { user, isLoading } = useAuth();

    // Trong khi đang kiểm tra token, hiển thị loading để tránh giật trang
    if (isLoading) {
        return <div>Loading authentication...</div>;
    }

    // Nếu không có user (chưa đăng nhập), chuyển về trang login
    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Nếu route này YÊU CẦU quyền admin, nhưng user lại KHÔNG PHẢI admin
    if (adminOnly && user.role !== 'admin') {
        // Chuyển hướng về trang chủ (hoặc trang "Cấm truy cập")
        return <Navigate to="/" replace />;
    }

    // Nếu mọi thứ đều ổn, hiển thị component được bảo vệ
    return children;
}

export default ProtectedRoute;