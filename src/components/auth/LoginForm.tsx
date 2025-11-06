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
    userId: '',
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
      // ID를 이메일 형식으로 변환하여 Firebase 인증 사용
      const emailFormat = `${formData.userId}@chungchunmarket.com`;
      await login(emailFormat, formData.password);
      showLoading(false);
      onLoginSuccess(formData.userId); // 사용자 ID 전달
    } catch (error: any) {
      showLoading(false);
      showNotification('로그인에 실패했습니다. ID와 비밀번호를 확인해주세요.', 'error');
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
          <label htmlFor="loginUserId">사용자 ID</label>
          <input 
            type="text" 
            id="loginUserId" 
            name="userId" 
            value={formData.userId}
            onChange={handleInputChange}
            placeholder="영문, 숫자 조합"
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
