import { useState } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { apiLogin } from './api';
import { IconUser, IconLock, IconLogin } from '@tabler/icons-react';
import './App.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const data = await apiLogin(username, password);
      login(data.access_token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng thử lại.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Đăng nhập</h2>
        {error && <p className="error-message fade-in">{error}</p>}
        <div className="form-group">
          <label htmlFor="username">
            <IconUser size={20} /> Tên đăng nhập
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            placeholder="Nhập tên đăng nhập"
            disabled={isLoading}
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">
            <IconLock size={20} /> Mật khẩu
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Nhập mật khẩu"
            disabled={isLoading}
          />
        </div>
        <button type="submit" disabled={isLoading}>
          {isLoading ? (
            <div className="spinner"></div>
          ) : (
            <>
              <IconLogin size={20} /> Đăng nhập
            </>
          )}
        </button>
        <p className="auth-switch">
          Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
        </p>
      </form>
    </div>
  );
}

export default LoginPage;