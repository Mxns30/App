import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface SignupFormProps {
  onShowLogin: () => void;
  showNotification: (message: string, type?: string) => void;
  showLoading: (show: boolean) => void;
}

const SignupForm: React.FC<SignupFormProps> = ({ onShowLogin, showNotification, showLoading }) => {
  const { signup } = useAuth();
  const [formData, setFormData] = useState({
    userId: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // 아이디와 비밀번호 입력 제한 (영문 소문자, 숫자만) - 이제 사용하지 않음
    // if (name === 'name' || name === 'password') {
    //   const filteredValue = value.replace(/[^a-z0-9]/g, '');
    //   if (value !== filteredValue) {
    //     showNotification('영문 소문자와 숫자만 입력 가능합니다.', 'warning');
    //     setFormData(prev => ({
    //       ...prev,
    //       [name]: filteredValue
    //     }));
    //     return;
    //   }
    // }
    
    const newFormData = {
      ...formData,
      [name]: value
    };
    
    setFormData(newFormData);

    // 비밀번호 일치 실시간 확인 - 새로운 값으로 검증
    if (name === 'confirmPassword' || name === 'password') {
      validatePasswords(newFormData);
    }
  };

  const validatePasswords = (data = formData) => {
    // 비밀번호 확인 필드가 비어있으면 에러 없음
    if (data.confirmPassword.length === 0) {
      setPasswordError('');
      return;
    }
    
    // 비밀번호가 일치하지 않으면 에러 표시
    if (data.password !== data.confirmPassword) {
      setPasswordError('비밀번호가 일치하지 않습니다.');
    } else {
      setPasswordError('');
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    showLoading(true);
    
    const { userId, password, confirmPassword } = formData;
    
    // 사용자 ID 유효성 검사
    if (userId.length < 3) {
      showLoading(false);
      showNotification('사용자 ID는 최소 3자 이상이어야 합니다.', 'error');
      return;
    }
    
    // 영문, 숫자만 허용
    if (!/^[a-zA-Z0-9]+$/.test(userId)) {
      showLoading(false);
      showNotification('사용자 ID는 영문과 숫자만 사용할 수 있습니다.', 'error');
      return;
    }
    
    // 비밀번호 유효성 검사
    if (password.length < 6) {
      showLoading(false);
      showNotification('비밀번호는 최소 6자 이상이어야 합니다.', 'error');
      return;
    }
    
    if (password !== confirmPassword) {
      showLoading(false);
      setPasswordError('비밀번호가 일치하지 않습니다.');
      return;
    }

    try {
      console.log('=== SignupForm 회원가입 시도 ===');
      console.log('사용자 ID:', userId);
      console.log('비밀번호 길이:', password.length);
      
      // ID를 이메일 형식으로 변환하여 Firebase 인증 사용
      const emailFormat = `${userId}@chungchunmarket.com`;
      const result = await signup(emailFormat, password);
      console.log('=== SignupForm 회원가입 성공 ===');
      console.log('결과:', result);
      
      showLoading(false);
      showNotification('회원가입이 완료되었습니다! 로그인 해주세요.', 'success');
      onShowLogin();
      setFormData({ userId: '', password: '', confirmPassword: '' });
    } catch (error: any) {
      console.error('=== SignupForm 회원가입 실패 ===');
      console.error('오류 객체:', error);
      console.error('오류 코드:', error.code);
      console.error('오류 메시지:', error.message);
      console.error('오류 스택:', error.stack);
      
      showLoading(false);
      
      let errorMessage = '회원가입에 실패했습니다.';
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = '이미 사용 중인 사용자 ID입니다.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = '비밀번호가 너무 약합니다. 6자 이상 입력해주세요.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = '올바른 사용자 ID를 입력해주세요.';
      } else if (error.code === 'auth/operation-not-allowed') {
        errorMessage = '계정 생성이 비활성화되어 있습니다. 관리자에게 문의하세요.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = '네트워크 연결을 확인해주세요.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = '너무 많은 요청이 발생했습니다. 잠시 후 다시 시도해주세요.';
      } else {
        errorMessage = `회원가입에 실패했습니다: ${error.message}`;
      }
      
      showNotification(errorMessage, 'error');
    }
  };

  return (
    <div className="form-container" id="signupForm">
      <div className="form-header">
        <h1>청춘마켓</h1>
        <p>새 계정을 만드세요</p>
      </div>
      
      <form className="form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="signupUserId">사용자 ID</label>
          <input 
            type="text" 
            id="signupUserId" 
            name="userId" 
            value={formData.userId}
            onChange={handleInputChange}
            placeholder="영문, 숫자 조합 (3자 이상)" 
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
              placeholder="최소 6자 이상" 
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
        <p>이미 계정이 있으신가요? <button type="button" onClick={onShowLogin} style={{ background: 'none', border: 'none', color: 'inherit', textDecoration: 'underline', cursor: 'pointer' }}>로그인</button></p>
      </div>
    </div>
  );
};

export default SignupForm;
