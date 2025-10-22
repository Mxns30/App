document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        const splashScreen = document.getElementById('splashScreen');
        const loginForm = document.getElementById('loginForm');

        if (splashScreen) {
            splashScreen.style.opacity = '0';
            setTimeout(() => {
                splashScreen.style.display = 'none';
            }, 500); // Fading out animation
        }
        
        if (loginForm) {
            loginForm.classList.remove('hidden');
        }
    }, 2000); // 2 seconds
});

// 폼 전환
function showSignupForm() {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.remove('hidden');
}
function showLoginForm() {
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
}

// 비밀번호 토글
function togglePassword(id) {
    const input = document.getElementById(id);
    input.type = input.type === 'password' ? 'text' : 'password';
}

// 알림 표시
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification show ${type}`;
    setTimeout(() => {
        notification.className = 'notification';
    }, 2500);
}

// 로딩 스피너
function showLoading(show) {
    document.getElementById('loadingSpinner').classList.toggle('hidden', !show);
}

// 비밀번호 유효성 검사
function validatePassword(password) {
    // 영문 소문자와 숫자만 허용
    if (!/^[a-z0-9]+$/.test(password)) {
        return '비밀번호는 영문 소문자와 숫자만 사용 가능합니다.';
    }
    
    // 최소 10자 이상
    if (password.length < 10) {
        return '비밀번호는 최소 10자 이상이어야 합니다.';
    }
    
    // 영문 소문자 포함
    if (!/[a-z]/.test(password)) {
        return '비밀번호는 영문 소문자를 포함해야 합니다.';
    }
    
    // 숫자 포함
    if (!/[0-9]/.test(password)) {
        return '비밀번호는 숫자를 포함해야 합니다.';
    }
    
    return null;
}

// 아이디 입력 제한 (영문 소문자, 숫자만)
document.getElementById('signupName')?.addEventListener('input', function(e) {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-z0-9]/g, '');
    if (value !== filteredValue) {
        e.target.value = filteredValue;
        showNotification('영문 소문자와 숫자만 입력 가능합니다.', 'warning');
    }
});

// 비밀번호 입력 제한 (영문 소문자, 숫자만)
document.getElementById('signupPassword')?.addEventListener('input', function(e) {
    const value = e.target.value;
    const filteredValue = value.replace(/[^a-z0-9]/g, '');
    if (value !== filteredValue) {
        e.target.value = filteredValue;
        showNotification('비밀번호는 영문 소문자와 숫자만 사용 가능합니다.', 'warning');
    }
});

// 아이디 유효성 검사
function validateUserId(userId) {
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
}

// 회원가입 폼 제출
const signupForm = document.getElementById('signupFormElement');
signupForm?.addEventListener('submit', function(e) {
    e.preventDefault();
    showLoading(true);
    const name = document.getElementById('signupName').value;
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
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
        document.getElementById('password-error-message').textContent = '비밀번호가 일치하지 않습니다.';
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
    showLoginForm();
    document.getElementById('signupFormElement').reset();
});

// 비밀번호 일치 실시간 확인
const passwordInput = document.getElementById('signupPassword');
const confirmPasswordInput = document.getElementById('signupConfirmPassword');
const passwordErrorMessage = document.getElementById('password-error-message');

function validatePasswords() {
    if (passwordInput.value !== confirmPasswordInput.value && confirmPasswordInput.value) {
        passwordErrorMessage.textContent = '비밀번호가 일치하지 않습니다.';
    } else {
        passwordErrorMessage.textContent = '';
    }
}

passwordInput?.addEventListener('input', validatePasswords);
confirmPasswordInput?.addEventListener('input', validatePasswords);

// 홈 화면 표시
function showHomeScreen(userName) {
    document.getElementById('loginForm').classList.add('hidden');
    document.getElementById('signupForm').classList.add('hidden');
    document.getElementById('homeScreen').classList.remove('hidden');
    document.getElementById('userName').textContent = userName;
}

// 로그아웃
function logout() {
    document.getElementById('homeScreen').classList.add('hidden');
    document.getElementById('loginForm').classList.remove('hidden');
    // 폼 초기화
    document.getElementById('loginFormElement').reset();
    document.getElementById('signupFormElement').reset();
}

// 로그인 폼 제출
const loginForm = document.getElementById('loginFormElement');
loginForm?.addEventListener('submit', function(e) {
    e.preventDefault();
    showLoading(true);
    const name = document.getElementById('loginName').value;
    const password = document.getElementById('loginPassword').value;
    
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const user = users.find(u => u.name === name && u.password === password);

    if (user) {
        showLoading(false);
        showHomeScreen(name);
    } else {
        showLoading(false);
        showNotification('이름 또는 비밀번호가 올바르지 않습니다.', 'error');
    }
});

// PWA 서비스워커 등록
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(reg => console.log('Service Worker 등록 성공:', reg.scope))
            .catch(err => console.log('Service Worker 등록 실패:', err));
    });
} 