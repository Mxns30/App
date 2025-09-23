import React, { useState } from 'react';

const SignupForm = ({ onShowLogin, showNotification, showLoading }) => {
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // 아이디와 비밀번호 입력 제한 (영문 소문자, 숫자만)
    if (name === 'name' || name === 'password') {
      const filteredValue = value.replace(/[^a-z0-9]/g, '');
      if (value !== filteredValue) {
        showNotification('영문 소문자와 숫자만 입력 가능합니다.', 'warning');
        setFormData(prev => ({
          ...prev,
          [name]: filteredValue
        }));
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // 비밀번호 일치 실시간 확인
    if (name === 'confirmPassword' || name === 'password') {
      validatePasswords();
    }
  };

  const validatePasswords = () => {
    if (formData.password !== formData.confirmPassword && formData.confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
    } else {
      setPasswordError('');
    }
  };

  const validateUserId = (userId) => {
    const pattern = /^[a-z0-9]+$/;
    if (!pattern.test(userId)) {
      return '아이디는 영문 소문자와 숫자만 사용 가능합니다.';
    }
    if (userId.length < 3) {
      return '아이디는 최소 3자 이상이어야 합니다.';
    }
    if (userId.length > 20) {
      return '아이디는 최대 20자까지 가능합니다.';
    }
    return null;
  };

  const validatePassword = (password) => {
    if (!/^[a-z0-9]+$/.test(password)) {
      return '비밀번호는 영문 소문자와 숫자만 사용 가능합니다.';
    }
    if (password.length < 10) {
      return '비밀번호는 최소 10자 이상이어야 합니다.';
    }
    if (!/[a-z]/.test(password)) {
      return '비밀번호는 영문 소문자를 포함해야 합니다.';
    }
    if (!/[0-9]/.test(password)) {
      return '비밀번호는 숫자를 포함해야 합니다.';
    }
    return null;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    showLoading(true);
    
    const { name, password, confirmPassword } = formData;
    
    // 아이디 유효성 검사
    const userIdError = validateUserId(name);
    if (userIdError) {
      showLoading(false);
      showNotification(userIdError, 'error');
      return;
    }
    
    // 비밀번호 유효성 검사
    const passwordError = validatePassword(password);
    if (passwordError) {
      showLoading(false);
      showNotification(passwordError, 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showLoading(false);
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }

    // 로컬스토리지에서 사용자 목록 가져오기
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    // 아이디 중복 확인
    if (users.some(user => user.name === name)) {
      showLoading(false);
      showNotification('이미 사용 중인 아이디입니다.', 'error');
      return;
    }

    // 새 사용자 추가 후 로컬스토리지에 저장
    users.push({ name, password });
    localStorage.setItem('users', JSON.stringify(users));

    showLoading(false);
    showNotification('회원가입이 완료되었습니다! 로그인 해주세요.', 'success');
    onShowLogin();
    setFormData({ name: '', password: '', confirmPassword: '' });
  };

  return (
    <div className="form-container" id="signupForm">
      <div className="form-header">
        <h1>청춘마켓</h1>
        <p>새 계정을 만드세요</p>
      </div>
      
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="signupName">아이디</label>
          <input 
            type="text" 
            id="signupName" 
            name="name" 
            value={formData.name}
            onChange={handleInputChange}
            pattern="[a-z0-9]+" 
            placeholder="영문 소문자, 숫자만 입력 가능" 
            required 
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="signupPassword">비밀번호</label>
          <div className="password-input">
            <input 
              type={showPassword ? "text" : "password"} 
              id="signupPassword" 
              name="password" 
              value={formData.password}
              onChange={handleInputChange}
              pattern="^(?=.*[a-z])(?=.*[0-9])[a-z0-9]{10,}$" 
              placeholder="영문 소문자, 숫자 조합 최소 10자 이상" 
              required 
            />
            <button 
              type="button" 
              className="toggle-password" 
              onClick={() => setShowPassword(!showPassword)}
            >
              <span className="eye-icon">👁️</span>
            </button>
          </div>
        </div>
        
        <div className="form-group">
          <label htmlFor="signupConfirmPassword">비밀번호 확인</label>
          <div className="password-input">
            <input 
              type={showConfirmPassword ? "text" : "password"} 
              id="signupConfirmPassword" 
              name="confirmPassword" 
              value={formData.confirmPassword}
              onChange={handleInputChange}
              required 
            />
            <button 
              type="button" 
              className="toggle-password" 
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              <span className="eye-icon">👁️</span>
            </button>
          </div>
          {passwordError && <p className="error-message">{passwordError}</p>}
        </div>
        
        <button type="submit" className="btn btn-primary">회원가입</button>
      </form>
      
      <div className="form-footer">
        <p>이미 계정이 있으신가요? <a href="#" onClick={(e) => { e.preventDefault(); onShowLogin(); }}>로그인</a></p>
      </div>
    </div>
  );
};

export default SignupForm;
