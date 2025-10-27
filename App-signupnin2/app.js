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
    
    // QR코드 스캔 페이지로 넘어온 후 자동으로 카메라 시작
    setTimeout(() => {
        startCamera();
    }, 500); // 0.5초 후 카메라 시작 (페이지 전환 애니메이션 완료 후)
}

// 로그아웃
function logout() {
    // 카메라 중지
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
        document.getElementById('video').srcObject = null;
        stopContinuousScanning();
    }
    
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

// QR코드 스캔 관련 변수
let stream = null;
let canvas = document.createElement('canvas');
let ctx = canvas.getContext('2d');
let scanningInterval = null;
let isScanning = false;

// 카메라 시작
async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1280 },
                height: { ideal: 720 }
            } 
        });
        document.getElementById('video').srcObject = stream;
        showMessage('카메라가 시작되었습니다. QR코드를 카메라에 비춰주세요.', 'success');
        
        // 실시간 스캔 시작
        startContinuousScanning();
    } catch (error) {
        showMessage('카메라 접근에 실패했습니다: ' + error.message, 'error');
    }
}

// 연속 스캔 시작
function startContinuousScanning() {
    if (isScanning) return;
    
    isScanning = true;
    scanningInterval = setInterval(() => {
        if (stream && !document.getElementById('scan-result').style.display === 'none') {
            captureAndScan();
        }
    }, 1000); // 1초마다 스캔
}

// 연속 스캔 중지
function stopContinuousScanning() {
    if (scanningInterval) {
        clearInterval(scanningInterval);
        scanningInterval = null;
    }
    isScanning = false;
}

// 이미지 캡처 및 스캔
function captureAndScan() {
    if (!stream) {
        showMessage('먼저 카메라를 시작해주세요.', 'error');
        return;
    }

    const video = document.getElementById('video');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageData = canvas.toDataURL('image/jpeg');
    scanQRCode(imageData);
}

// QR코드 스캔 (클라이언트 사이드)
async function scanQRCode(imageData) {
    try {
        showMessage('QR코드 스캔 중...', 'success');
        
        // 이미지를 Image 객체로 로드
        const img = new Image();
        img.onload = function() {
            // Canvas에 이미지 그리기
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            
            // 이미지 데이터 추출
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // jsQR로 QR코드 인식
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
                inversionAttempts: "dontInvert",
            });
            
            if (code) {
                // QR코드 인식 성공
                displayScanResults([{
                    data: code.data,
                    rect: code.location
                }]);
                showMessage('QR코드를 성공적으로 인식했습니다!', 'success');
            } else {
                // QR코드 인식 실패
                showMessage('QR코드를 찾을 수 없습니다. 다른 이미지를 시도해보세요.', 'error');
                document.getElementById('scan-result').style.display = 'none';
            }
        };
        
        img.src = imageData;
        
    } catch (error) {
        showMessage('스캔 중 오류가 발생했습니다: ' + error.message, 'error');
    }
}

// QR코드 타입 판별
function getQRCodeType(data) {
    if (data.startsWith('http://') || data.startsWith('https://')) {
        return 'URL';
    } else if (data.startsWith('tel:')) {
        return '전화번호';
    } else if (data.startsWith('mailto:')) {
        return '이메일';
    } else if (data.startsWith('BEGIN:VCARD')) {
        return '연락처';
    } else if (data.startsWith('WIFI:')) {
        return 'WiFi';
    } else if (data.match(/^\d{4,}$/)) {
        return '숫자';
    } else {
        return '텍스트';
    }
}

// 스캔 결과 표시
function displayScanResults(results) {
    const resultDiv = document.getElementById('scan-result');
    const contentDiv = document.getElementById('scan-content');
    
    let html = '';
    results.forEach((result, index) => {
        html += `
            <div class="scan-item">
                <strong>데이터:</strong> ${result.data}
            </div>
        `;
    });
    
    contentDiv.innerHTML = html;
    resultDiv.style.display = 'block';
    
    // 스캔 성공 시 연속 스캔 중지
    stopContinuousScanning();
    
    showMessage('QR코드 스캔이 완료되었습니다!', 'success');
}

// 상태 메시지 표시
function showMessage(message, type = 'success') {
    // 기존 메시지 제거
    const existingMessage = document.querySelector('.status-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    const messageDiv = document.createElement('div');
    messageDiv.className = `status-message ${type}`;
    messageDiv.textContent = message;
    
    const homeContent = document.querySelector('.home-content');
    if (homeContent) {
        homeContent.insertBefore(messageDiv, homeContent.firstChild);
        
        // 5초 후 자동 제거
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.remove();
            }
        }, 5000);
    }
} 

// 다시 스캔
function resetScan() {
    // 스캔 결과 숨기기
    document.getElementById('scan-result').style.display = 'none';
    
    // 카메라가 실행 중이면 연속 스캔 재시작
    if (stream) {
        startContinuousScanning();
        showMessage('새로운 QR코드를 스캔할 준비가 되었습니다.', 'success');
    }
} 