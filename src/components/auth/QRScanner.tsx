import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { useSchool } from '../../contexts/SchoolContext';

interface QRScannerProps {
  showNotification: (message: string, type?: string) => void;
  onStartAdventure: () => void;
}

const QRScanner: React.FC<QRScannerProps> = ({ showNotification, onStartAdventure }) => {
  const { setSchool } = useSchool();
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const [showResult, setShowResult] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanningIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 카메라 시작
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          facingMode: 'environment',
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
    } catch (error: any) {
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
    
    if (!ctx) return;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    scanQRCode(imageData);
  };

  // QR코드 스캔
  const scanQRCode = (imageData: ImageData) => {
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

        // 스캔된 데이터를 학교명으로 설정
        const scanned = (code.data || '').trim();
        if (scanned) {
          setSchool(scanned);
          try {
            localStorage.setItem('currentSchool', scanned);
          } catch {}
        }
      }
    } catch (error: any) {
      showNotification('스캔 중 오류가 발생했습니다: ' + error.message, 'error');
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
    <div className="qr-scanner-container">
      <h2>🔍 QR코드 스캐너</h2>
      <p>카메라로 QR코드를 스캔하세요</p>
      
      <div className="camera-container">
        <video ref={videoRef} autoPlay playsInline></video>
        <div className="camera-overlay"></div>
      </div>
      
      <div className="camera-controls">
        <button className="btn btn-primary" onClick={captureAndScan}>스캔하기</button>
      </div>
      
      {showResult && scanResult && (
        <div className="scan-result">
          <h3>✅ QR코드 인증 성공!</h3>
          <div className="scan-content">
            <div className="scan-item">
              <strong>데이터:</strong> {scanResult.data}
            </div>
          </div>
          <div className="scan-buttons">
            <button className="btn btn-primary" onClick={resetScan}>🔄 다시 스캔</button>
          </div>
          <div className="adventure-button">
            <button className="btn btn-secondary" onClick={() => {
              console.log('시작하기 버튼 클릭됨');
              onStartAdventure();
            }}>🚀 시작하기</button>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '10px' }}>
              QR코드 인증이 완료되었습니다. 이제 앱을 사용할 수 있습니다.
            </p>
          </div>
        </div>
      )}
      
      <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
    </div>
  );
};

export default QRScanner;
