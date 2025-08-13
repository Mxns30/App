import React, { useState, useCallback } from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { createTheme } from '@mui/material/styles';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from './cropUtils';
import 'react-easy-crop/react-easy-crop.css';
// Pages
import HomePage from './pages/HomePage';
import MyPage from './pages/MyPage';
import PostDetail from './pages/PostDetail';
import PostRegistration from './pages/PostRegistration';
import ProfilePage from './pages/ProfilePage';
import EditPage from './pages/EditPage';
import SearchPage from './pages/SearchPage';

// Theme
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const App: React.FC = () => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  const onCropComplete = useCallback(
    (_: any, croppedAreaPixels: { x: number; y: number; width: number; height: number }) => {
      setCroppedAreaPixels(croppedAreaPixels);
    },
    []
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => setImageSrc(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleCropSave = async () => {
    if (imageSrc && croppedAreaPixels) {
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      // croppedImage: base64 or blob, 원하는 곳에 저장
      console.log('Cropped Image:', croppedImage);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/my" element={<MyPage />} />
        <Route path="/post/:postId" element={<PostDetail />} />
        <Route path="/post/registration" element={<PostRegistration />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/post/edit/:postId" element={<EditPage />} />
        <Route path="/search" element={<SearchPage />} />
      </Routes>
    </ThemeProvider>
  );
};

export default App; 