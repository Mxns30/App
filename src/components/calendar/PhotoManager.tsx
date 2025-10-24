import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FloatingActionButton from './FloatingActionButton';
import './PhotoManager.css';

const PhotoManager: React.FC = () => {
  const navigate = useNavigate();
  const [savedImage, setSavedImage] = useState<string | null>(null);
  const STORAGE_KEY = 'calendar-pwa-saved-photo';

  useEffect(() => {
    const image = localStorage.getItem(STORAGE_KEY);
    if (image) {
      setSavedImage(image);
    }
  }, []);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageDataUrl = e.target?.result as string;
        localStorage.setItem(STORAGE_KEY, imageDataUrl);
        setSavedImage(imageDataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setSavedImage(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleAddPhotoClick = () => {
    document.getElementById('calendar-pwa-photo-input')?.click();
  };

  return (
    <div className="calendar-pwa-container">
      <img src="/cat.png" alt="인사하는 고양이" className="calendar-pwa-cat-image" />
      
      <div className="calendar-pwa-inner-rectangle">
        <div id="calendar-pwa-image-container" className={savedImage ? 'calendar-pwa-has-image' : ''}>
          {savedImage && (
            <>
              <img src={savedImage} alt="업로드된 사진" />
              <button className="calendar-pwa-delete-photo-btn" onClick={clearImage}>
                &times;
              </button>
            </>
          )}
        </div>
        
        {!savedImage && (
          <button id="calendar-pwa-add-photo-btn" onClick={handleAddPhotoClick}>
            +
          </button>
        )}
        
        <input
          type="file"
          id="calendar-pwa-photo-input"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
      </div>

      <FloatingActionButton 
        text="←"
        onClick={() => navigate('/calendar')}
      />
    </div>
  );
};

export default PhotoManager;
