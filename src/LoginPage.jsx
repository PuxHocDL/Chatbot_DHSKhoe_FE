import { useState } from 'react';import { useAuth } from './AuthContext';
import { apiLogin } from './api';
import { useNavigate, Link } from 'react-router-dom';
import { IconUser, IconLock, IconLogin } from '@tabler/icons-react';
import { EyeOff } from 'lucide-react';
import { Eye } from 'lucide-react';
import './App.css';

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false); 
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

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="auth-page">
      <form onSubmit={handleSubmit} className="auth-form">

        <h1 className="welcome-title">Đăng Nhập </h1>
        

        <h2>Đăng nhập</h2>
        {error && <p className="error-message fade-in">{error}</p>}
        
        <div className="form-group">
          <label htmlFor="username">
            <IconUser size={20} /> Tên đăng nhập
          </label>
          <input
            id="username"
            type="email"
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
          <div className='password-group'>
            <input
              id="password"
              type={showPassword ? "text" : "password"} 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Nhập mật khẩu"
              disabled={isLoading}
            />
            <button 
              type="button" 
              className='hide-btn'
              onClick={togglePasswordVisibility}
              disabled={isLoading}
            >
              {showPassword ? (
                <EyeOff className='hide-icon' style={{color: "#63a264"}} />
              ) : (
                <Eye className='hide-icon' style={{color: "#63a264"}} />
              )}
            </button>
          </div>
        </div>


        <div className="form-options">
          <label className="remember-checkbox">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span className="checkmark"></span>
            Nhớ mật khẩu
          </label>
          <div to="/forgot-password" className="forgot-link">
            Quên mật khẩu
          </div>
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

        <button type="button" className="google-signin-btn">
          <svg className="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Đăng nhập với Google
        </button>

        <div className="auth-switch">
          <p>Không có tài khoản?</p> 
          <Link to="/register"> Đăng ký</Link>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;