import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface LoginFormProps {
  onLoginSuccess: (name: string) => void;
  onShowSignup: () => void;
  showNotification: (message: string, type?: string) => void;
  showLoading: (show: boolean) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onShowSignup, showNotification, showLoading }) => {
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const togglePassword = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showLoading(true);
    
    try {
      await login(formData.email, formData.password);
      showLoading(false);
      onLoginSuccess(formData.email.split('@')[0]); // 이메일에서 이름 부분 추출
    } catch (error: any) {
      showLoading(false);
      showNotification('이메일 또는 비밀번호가 올바르지 않습니다.', 'error');
    }
  };


  return (
    <div className="form-container" id="loginForm">
      <div className="form-header">
        <p>청춘이 시작되는 곳</p>
        <h1>청춘마켓</h1>
      </div>
      
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="loginEmail">이메일</label>
          <input 
            type="email" 
            id="loginEmail" 
            name="email" 
            value={formData.email}
            onChange={handleInputChange}
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="loginPassword">비밀번호</label>
          <div className="password-input">
            <input 
              type={showPassword ? "text" : "password"} 
              id="loginPassword" 
              name="password" 
              value={formData.password}
              onChange={handleInputChange}
              required 
            />
            <button 
              type="button" 
              className="toggle-password" 
              onClick={togglePassword}
            >
              <span className="eye-icon">👁️</span>
            </button>
          </div>
        </div>
        
        <button type="submit" className="btn btn-primary">로그인</button>
      </form>
      
      
      <div className="form-footer">
        <p>계정이 없으신가요? <a href="#" onClick={(e) => { e.preventDefault(); onShowSignup(); }}>회원가입</a></p>
      </div>
    </div>
  );
};

export default LoginForm;
