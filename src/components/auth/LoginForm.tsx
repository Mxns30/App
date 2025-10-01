import React, { useState } from 'react';

interface LoginFormProps {
  onLoginSuccess: (name: string) => void;
  onShowSignup: () => void;
  showNotification: (message: string, type?: string) => void;
  showLoading: (show: boolean) => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onLoginSuccess, onShowSignup, showNotification, showLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    showLoading(true);
    
    const { name, password } = formData;
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find((u: any) => u.name === name && u.password === password);

    if (user) {
      showLoading(false);
      onLoginSuccess(name);
    } else {
      showLoading(false);
      showNotification('이름 또는 비밀번호가 올바르지 않습니다.', 'error');
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
          <label htmlFor="loginName">아이디</label>
          <input 
            type="text" 
            id="loginName" 
            name="name" 
            value={formData.name}
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
