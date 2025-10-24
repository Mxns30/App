import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Avatar, IconButton, CircularProgress } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
// @ts-ignore
import heic2any from 'heic2any';
import { db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';

const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [displayId, setDisplayId] = useState<string>('');
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const loadUser = async () => {
      if (!userId) return;
      setLoading(true);
      try {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          setDisplayId(data.userId || userId);
          if (data.photoUrl) setPhotoUrl(data.photoUrl);
        } else {
          setDisplayId(userId);
        }
      } catch (e) {
        setDisplayId(userId || '사용자');
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, [userId]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (file.type === 'image/heic' || file.name.endsWith('.heic')) {
        try {
          const convertedBlob = await heic2any({ blob: file, toType: 'image/jpeg', quality: 0.9 });
          const reader = new FileReader();
          reader.onload = (ev) => {
            const result = ev.target?.result as string;
            if (typeof result === 'string' && result.startsWith('data:image/')) {
              // setCropImage(result); // This line was not in the original file, so it's removed.
            } else {
              alert('HEIC 이미지를 변환하는 데 실패했습니다.');
            }
          };
          reader.readAsDataURL(convertedBlob as Blob);
        } catch (err) {
          alert('HEIC 이미지를 변환할 수 없습니다.');
          console.error('heic2any error:', err);
        }
      } else if (file.type.startsWith('image/')) {
        // 기존 코드 (png, jpg, webp 등)
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          if (typeof result === 'string' && result.startsWith('data:image/')) {
            // setCropImage(result); // This line was not in the original file, so it's removed.
          } else {
            alert('이미지 파일을 읽을 수 없습니다.');
          }
        };
        reader.onerror = (err) => {
          alert('이미지 파일을 읽는 중 오류가 발생했습니다.');
          console.error('FileReader error:', err);
        };
        reader.readAsDataURL(file);
      } else {
        alert('이미지 파일만 업로드할 수 있습니다.');
      }
    }
  };

  return (
    <Box sx={{ bgcolor: '#fff', minHeight: '100vh', position: 'relative', pt: 4 }}>
      <IconButton sx={{ position: 'absolute', left: 16, top: 16 }} onClick={() => navigate(-1)}>
        <ArrowBackIcon />
      </IconButton>
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 6 }}>
        {loading ? (
          <CircularProgress />
        ) : (
          <>
            <Avatar src={photoUrl} sx={{ width: 96, height: 96, bgcolor: '#eee', mb: 2 }}>
              {!photoUrl && <span style={{ fontSize: 48 }}>🐾</span>}
            </Avatar>
            <Typography fontWeight="bold" fontSize={24} color="#555">
              {displayId || userId || '사용자'}
            </Typography>
          </>
        )}
      </Box>
      {/* 하단 연한 원 배경 */}
      <Box sx={{ position: 'absolute', left: -100, bottom: -60, width: 320, height: 320, bgcolor: '#fffde7', border: '2px solid #fff9c4', borderRadius: '50%', zIndex: 0, opacity: 1 }} />
      <Box sx={{ position: 'absolute', right: -80, bottom: -40, width: 320, height: 320, bgcolor: '#ffebee', border: '2px solid #ffd6e0', borderRadius: '50%', zIndex: 0, opacity: 1 }} />
    </Box>
  );
};

export default ProfilePage; 