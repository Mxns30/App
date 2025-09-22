import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';

const QRScanner = ({ showNotification, onStartAdventure }) => {
  const [stream, setStream] = useState(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [showResult, setShowResult] = useState(false);
  
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const scanningIntervalRef = useRef(null);

  // 카메라 시작
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'user', // 셀카 모드 (전면 카메라)
          width: { ideal: 1280 },
          height: { ideal: 720 }
        } 
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      showNotification('카메라가 시작되었습니다. QR코드를 카메라에 비춰주세요.', 'success');
      
      // 실시간 스캔 시작
      startContinuousScanning();
    } catch (error) {
      showNotification('카메라 접근에 실패했습니다: ' + error.message, 'error');
    }
  };

  // 연속 스캔 시작
  const startContinuousScanning = () => {
    if (isScanning) return;
    
    setIsScanning(true);
    scanningIntervalRef.current = setInterval(() => {
      if (stream && !showResult) {
        captureAndScan();
      }
    }, 1000); // 1초마다 스캔
  };

  // 연속 스캔 중지
  const stopContinuousScanning = () => {
    if (scanningIntervalRef.current) {
      clearInterval(scanningIntervalRef.current);
      scanningIntervalRef.current = null;
    }
    setIsScanning(false);
  };

  // 이미지 캡처 및 스캔
  const captureAndScan = () => {
    if (!stream || !videoRef.current || !canvasRef.current) {
      showNotification('먼저 카메라를 시작해주세요.', 'error');
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    scanQRCode(imageData);
  };

  // QR코드 스캔
  const scanQRCode = (imageData) => {
    try {
      // jsQR로 QR코드 인식
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      
      if (code) {
        // QR코드 인식 성공
        setScanResult({
          data: code.data,
          rect: code.location
        });
        setShowResult(true);
        stopContinuousScanning();
        showNotification('QR코드를 성공적으로 인식했습니다!', 'success');
      }
    } catch (error) {
      showNotification('스캔 중 오류가 발생했습니다: ' + error.message, 'error');
    }
  };

  // QR코드 타입 판별
  const getQRCodeType = (data) => {
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
  };

  // 다시 스캔
  const resetScan = () => {
    setShowResult(false);
    setScanResult(null);
    
    // 카메라가 실행 중이면 연속 스캔 재시작
    if (stream) {
      startContinuousScanning();
      showNotification('새로운 QR코드를 스캔할 준비가 되었습니다.', 'success');
    }
  };

  // 컴포넌트 마운트 시 카메라 시작
  useEffect(() => {
    const timer = setTimeout(() => {
      startCamera();
    }, 500); // 0.5초 후 카메라 시작

    return () => {
      clearTimeout(timer);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      stopContinuousScanning();
    };
  }, []);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      stopContinuousScanning();
    };
  }, [stream]);

  return (
    <div className="qr-scanner-container" style={{
      padding: '20px',
      maxWidth: '414px',
      margin: '0 auto',
      boxSizing: 'border-box',
      minHeight: '100vh',
      backgroundColor: '#fafafa'
    }}>
      <h2 style={{ 
        textAlign: 'center', 
        marginBottom: '10px',
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#333'
      }}>🔍 QR코드 스캐너</h2>
      <p style={{ 
        textAlign: 'center', 
        marginBottom: '20px',
        color: '#666',
        fontSize: '16px'
      }}>카메라로 QR코드를 스캔하세요</p>
      
      <div className="camera-container" style={{
        position: 'relative',
        width: '100%',
        maxWidth: '350px',
        height: '300px',
        margin: '0 auto 20px',
        borderRadius: '12px',
        overflow: 'hidden',
        backgroundColor: '#000',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      }}>
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover'
          }}
        ></video>
        <div className="camera-overlay" style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '200px',
          height: '200px',
          border: '2px solid #1abc9c',
          borderRadius: '12px',
          pointerEvents: 'none',
          boxSizing: 'border-box'
        }}></div>
      </div>
      
      <div className="camera-controls" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <button 
          className="btn btn-primary" 
          onClick={captureAndScan}
          style={{
            backgroundColor: '#1abc9c',
            color: 'white',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 2px 8px rgba(26, 188, 156, 0.3)',
            transition: 'all 0.2s ease'
          }}
          onMouseOver={(e) => {
            e.target.style.backgroundColor = '#16d9b6';
            e.target.style.transform = 'translateY(-2px)';
          }}
          onMouseOut={(e) => {
            e.target.style.backgroundColor = '#1abc9c';
            e.target.style.transform = 'translateY(0)';
          }}
        >스캔하기</button>
      </div>
      
      {showResult && scanResult && (
        <div className="scan-result" style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          marginBottom: '20px'
        }}>
          <h3 style={{ 
            marginBottom: '15px',
            color: '#333',
            fontSize: '18px',
            fontWeight: 'bold'
          }}>스캔 결과:</h3>
          <div className="scan-content" style={{ marginBottom: '20px' }}>
            <div className="scan-item" style={{
              backgroundColor: '#f8f9fa',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <strong style={{ color: '#1abc9c' }}>데이터:</strong> 
              <span style={{ marginLeft: '8px', wordBreak: 'break-all' }}>{scanResult.data}</span>
            </div>
          </div>
          <div className="scan-buttons" style={{ 
            display: 'flex', 
            gap: '10px', 
            justifyContent: 'center',
            flexWrap: 'wrap'
          }}>
            <button 
              className="btn btn-primary" 
              onClick={resetScan}
              style={{
                backgroundColor: '#1abc9c',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(26, 188, 156, 0.3)'
              }}
            >🔄 다시 스캔</button>
          </div>
          <div className="adventure-button" style={{ marginTop: '15px' }}>
            <button 
              className="btn btn-secondary" 
              onClick={onStartAdventure}
              style={{
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(108, 117, 125, 0.3)'
              }}
            >🚀 시작하기</button>
          </div>
        </div>
      )}
      
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
};

export default QRScanner;
