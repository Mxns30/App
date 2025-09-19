import React from 'react';
import {
  Box, Container, Typography, TextField, IconButton, Button, Dialog, DialogContent, Slider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import Cropper from 'react-easy-crop';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

const categories = ['공학', '교육', '사회', '예체능', '의약', '인문', '자연'];
const types = ['과잠/학잠', '전공책', '기자재'];
const myUid = 'me';
const MAX_IMAGES = 10;

function getCroppedImg(imageSrc: string, crop: any, zoom: any, aspect = 1): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.src = imageSrc;
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const scale = image.naturalWidth / image.width;
      const cropX = crop.x * scale;
      const cropY = crop.y * scale;
      const cropWidth = crop.width * scale;
      const cropHeight = crop.height * scale;
      canvas.width = cropWidth;
      canvas.height = cropHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context is null'));
        return;
      }
      // 흰색 배경으로 채우기
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        cropWidth,
        cropHeight
      );
      // base64로 반환
      const base64 = canvas.toDataURL('image/jpeg');
      resolve(base64);
    };
    image.onerror = (err) => {
      console.error('Image loading failed:', err);
      alert('이미지를 불러올 수 없습니다.');
      reject(err);
    };
  });
}

const PostRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [title, setTitle] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('');
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [croppedImages, setCroppedImages] = React.useState<string[]>([]);
  const [cropDialogOpen, setCropDialogOpen] = React.useState(false);
  const [cropImage, setCropImage] = React.useState<string | null>(null);
  const [cropQueue, setCropQueue] = React.useState<string[]>([]); // 크롭 대기열
  const [crop, setCrop] = React.useState({ x: 0, y: 0 });
  const [zoom, setZoom] = React.useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = React.useState<any>(null);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [formSubmitted, setFormSubmitted] = React.useState(false);
  const [showImageError, setShowImageError] = React.useState(false);

  // 이미지 업로드 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const readers = files.map(file => {
      if (!file.type.startsWith('image/')) {
        alert('이미지 파일만 업로드할 수 있습니다.');
        return Promise.resolve('');
      }
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => {
          const result = ev.target?.result as string;
          if (typeof result === 'string' && result.startsWith('data:image/')) {
            resolve(result);
          } else {
            alert('이미지 파일을 읽을 수 없습니다.');
            resolve('');
          }
        };
        reader.onerror = (err) => {
          alert('이미지 파일을 읽는 중 오류가 발생했습니다.');
          console.error('FileReader error:', err);
          resolve('');
        };
        reader.readAsDataURL(file);
      });
    });
    Promise.all(readers).then((base64s) => {
      const validBase64s = base64s.filter(src => typeof src === 'string' && src.startsWith('data:image/'));
      setCropQueue(prev => [...prev, ...validBase64s]);
      if (!cropDialogOpen && validBase64s.length > 0) {
        setCropImage(validBase64s[0]);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCropDialogOpen(true);
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    });
  };

  // 크롭 완료 핸들러
  const handleCropComplete = React.useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // 크롭 다이얼로그 완전 닫기 핸들러
  const handleCropDialogClose = () => {
    setCropDialogOpen(false);
    setCropImage(null);
    setCropQueue([]);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // 크롭 저장 후 다음 이미지로 넘어가기
  const handleCropSave = async () => {
    if (!cropImage || !croppedAreaPixels) return;
    const croppedUrl = await getCroppedImg(cropImage, croppedAreaPixels, zoom);
    setCroppedImages(prev => [...prev, croppedUrl as string]);
    setPreviews(prev => [...prev, croppedUrl as string]);
    // 다음 이미지가 있으면 크롭, 없으면 닫기
    setCropQueue(prev => {
      const nextQueue = prev.slice(1);
      if (nextQueue.length > 0) {
        setCropImage(nextQueue[0]);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCropDialogOpen(true);
      } else {
        handleCropDialogClose();
      }
      return nextQueue;
    });
  };

  // 크롭 취소 시 다음 이미지로 넘어가기
  const handleCropCancel = () => {
    setCropQueue(prev => {
      const nextQueue = prev.slice(1);
      if (nextQueue.length > 0) {
        setCropImage(nextQueue[0]);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCropDialogOpen(true);
      } else {
        handleCropDialogClose();
      }
      return nextQueue;
    });
  };

  // 이미지 삭제 핸들러
  const handleRemoveImage = (idx: number) => {
    setCroppedImages(prev => prev.filter((src, i) => i !== idx && typeof src === 'string' && src.startsWith('data:image')));
    setPreviews(prev => prev.filter((src, i) => i !== idx && typeof src === 'string' && src.startsWith('data:image')));
  };

  // 필수 입력 체크
  const isTitleValid = title.trim().length > 0;
  const isDescValid = desc.trim().length > 0;
  const isPriceValid = price.trim().length > 0;
  const isImagesValid = croppedImages.length > 0 && croppedImages.every(src => typeof src === 'string' && src.startsWith('data:image'));
  const isFormValid = isTitleValid && isDescValid && isPriceValid && isImagesValid;

  // 등록 처리
  const handleRegister = () => {
    setFormSubmitted(true);
    // 필수 입력란(제목, 설명, 가격) 모두 채웠는지 확인
    const isFieldsValid = isTitleValid && isDescValid && isPriceValid;
    if (!isFieldsValid) {
      setShowImageError(false); // 텍스트 입력란이 비어있으면 사진 에러는 절대 안 뜸
      return;
    }
    if (!isImagesValid) {
      setShowImageError(true); // 텍스트 입력란은 다 채웠고 사진만 없을 때만 사진 에러
      return;
    } else {
      setShowImageError(false);
    }
    // base64가 아닌 값이 있으면 등록 자체를 막음
    const validImages = croppedImages.filter(src => typeof src === 'string' && src.startsWith('data:image'));
    const saved = localStorage.getItem('posts');
    const posts = saved ? JSON.parse(saved) : [];
    const newPost = {
      id: Date.now(),
      title,
      school: '한양여자대학교',
      major: selectedCategory + ' ' + selectedType,
      price: Number(price),
      marketPrice: 0,
      isLiked: false,
      images: validImages, // 여러 장 저장
      image: validImages[0], // 첫 번째 이미지는 호환성 위해 남김
      userId: myUid,
      desc,
    };
    console.log('등록되는 게시글:', newPost);
    localStorage.setItem('posts', JSON.stringify([newPost, ...posts]));
    navigate('/');
  };

  return (
    <Container maxWidth="xs" sx={{ bgcolor: '#fafafa', minHeight: '100vh', pt: 8, pb: 8, width: '100%', maxWidth: '414px' }}>
      <Box sx={{ p: 3, pt: 2, position: 'relative' }}>
        <IconButton sx={{ position: 'absolute', left: 8, top: 8 }} onClick={() => navigate(-1)}>
          <CloseIcon />
        </IconButton>
        {/* 사진 placeholder & 업로드 */}
        <Box
          sx={{
            width: '100%',
            minHeight: 180,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            mt: 4,
            px: 1,
          }}
        >
          {previews.length === 0 ? (
            <Box
              sx={{
                width: '100%',
                height: 200,
                border: '2px dashed #d3d7de',
                borderRadius: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#b0b8c1',
                cursor: 'pointer',
                transition: 'border 0.2s',
                boxSizing: 'border-box',
                maxWidth: '100%',
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageOutlinedIcon sx={{ fontSize: 48, mb: 1 }} />
              <Typography fontWeight="bold" fontSize={20} mb={0.5} color="#7b8691">사진 추가</Typography>
              <Typography fontSize={15} color="#b0b8c1">여기에 사진을 등록하세요</Typography>
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                ref={fileInputRef}
                onChange={handleImageChange}
              />
            </Box>
          ) : (
            <Box
              sx={{
                width: '100%',
                minHeight: 140,
                bgcolor: '#eafff6', // 연한 초록 배경
                border: '2px dashed #1abc9c', // 초록 점선 테두리
                borderRadius: 4,
                display: 'flex',
                alignItems: 'center',
                px: 2,
                py: 2,
                gap: 2,
                overflowX: 'auto',
                boxSizing: 'border-box',
              }}
            >
              {previews.map((src, idx) => (
                <Box
                  key={idx}
                  sx={{
                    width: 100,
                    height: 100,
                    borderRadius: 3,
                    overflow: 'hidden',
                    bgcolor: '#fff',
                    boxShadow: '0 2px 8px 0 rgba(0,0,0,0.07)',
                    border: '1.5px solid #e0e0e0',
                    position: 'relative',
                    flex: '0 0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <img src={src} alt={`preview-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <IconButton
                    size="small"
                    sx={{
                      position: 'absolute',
                      top: 6,
                      right: 6,
                      bgcolor: '#fff',
                      p: 0.5,
                      boxShadow: '0 1px 4px 0 rgba(0,0,0,0.08)',
                      '&:hover': { bgcolor: '#ffebee' },
                    }}
                    onClick={e => { e.stopPropagation(); handleRemoveImage(idx); }}
                  >
                    <CloseIcon fontSize="small" sx={{ color: '#e74c3c' }} />
                  </IconButton>
                </Box>
              ))}
              {/* 사진 추가 카드 */}
              <Box
                sx={{
                  width: 100,
                  height: 100,
                  borderRadius: 3,
                  border: '2px dashed #1abc9c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  color: '#1abc9c',
                  cursor: 'pointer',
                  flex: '0 0 auto',
                  bgcolor: '#f8fffc',
                  transition: 'border 0.2s',
                  '&:hover': { border: '2px solid #16d9b6', bgcolor: '#e0fff3' },
                }}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageOutlinedIcon sx={{ fontSize: 32, mb: 0.5 }} />
                <Typography fontSize={15} fontWeight="bold">사진 추가</Typography>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  ref={fileInputRef}
                  onChange={handleImageChange}
                />
              </Box>
            </Box>
          )}
        </Box>
        {imageError && <Typography color="error" fontSize={13} mb={1}>{imageError}</Typography>}
        {/* 제목 */}
        <Typography fontWeight="bold" fontSize={16} mb={0.5}>제목 <span style={{ color: '#ff6b6b', fontSize: 13 }}>(필수)</span></Typography>
        <TextField fullWidth size="small" placeholder="" value={title} onChange={e => setTitle(e.target.value)} sx={{ mb: 0.5 }} />
        {formSubmitted && !isTitleValid && <Typography color="error" fontSize={13} mb={1}>필수 입력입니다</Typography>}
        {/* 계열 */}
        <Typography fontWeight="bold" fontSize={16} mb={0.5}>계열</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {categories.map((cat) => (
            <Button
              key={cat}
              variant={selectedCategory === cat ? 'contained' : 'outlined'}
              size="small"
              sx={{
                bgcolor: selectedCategory === cat ? '#e6fff6' : '#f5f5f5',
                color: selectedCategory === cat ? '#1abc9c' : '#333',
                border: 'none',
                fontWeight: selectedCategory === cat ? 'bold' : 'normal',
              }}
              onClick={() => setSelectedCategory(selectedCategory === cat ? '' : cat)}
            >
              {cat}
            </Button>
          ))}
        </Box>
        {/* 종류 */}
        <Typography fontWeight="bold" fontSize={16} mb={0.5}>종류</Typography>
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          {types.map((type) => (
            <Button
              key={type}
              variant={selectedType === type ? 'contained' : 'outlined'}
              size="small"
              sx={{
                bgcolor: selectedType === type ? '#e6fff6' : '#f5f5f5',
                color: selectedType === type ? '#1abc9c' : '#333',
                border: 'none',
                fontWeight: selectedType === type ? 'bold' : 'normal',
              }}
              onClick={() => setSelectedType(selectedType === type ? '' : type)}
            >
              {type}
            </Button>
          ))}
        </Box>
        {/* 설명 */}
        <Typography fontWeight="bold" fontSize={16} mb={0.5}>설명 <span style={{ color: '#ff6b6b', fontSize: 13 }}>(필수)</span></Typography>
        <TextField
          fullWidth
          size="small"
          multiline
          minRows={3}
          placeholder="구매 시기, 하자 유무 등 상품 정보를 최대한 자세히 적어주세요."
          value={desc}
          onChange={e => setDesc(e.target.value)}
          sx={{ mb: 0.5 }}
        />
        {formSubmitted && !isDescValid && <Typography color="error" fontSize={13} mb={1}>필수 입력입니다</Typography>}
        {/* 가격 */}
        <Typography fontWeight="bold" fontSize={16} mb={0.5}>가격 <span style={{ color: '#ff6b6b', fontSize: 13 }}>(필수)</span></Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="₩"
          value={price}
          onChange={e => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
          sx={{ mb: 0.5 }}
        />
        {formSubmitted && !isPriceValid && <Typography color="error" fontSize={13} mb={1}>필수 입력입니다</Typography>}
        {/* 이미지 필수 안내 */}
        {showImageError && <Typography color="error" fontSize={13} mb={1}>사진을 1장 이상 등록해 주세요</Typography>}
        {/* 등록하기 버튼 */}
        <Button
          fullWidth
          variant="contained"
          sx={{
            background: isFormValid ? 'linear-gradient(135deg, #30D6A3, #5ED381)' : '#eee',
            color: isFormValid ? '#fff' : '#aaa',
            fontWeight: 'bold',
            borderRadius: 2,
            py: 1.2,
            fontSize: 18,
            mb: 1,
            mt: 1,
            boxShadow: isFormValid ? '0 4px 12px rgba(48, 214, 163, 0.3)' : 'none',
            '&:hover': {
              background: isFormValid ? 'linear-gradient(135deg, #5ED381, #30D6A3)' : '#eee',
              transform: isFormValid ? 'translateY(-2px)' : 'none',
              boxShadow: isFormValid ? '0 6px 16px rgba(48, 214, 163, 0.4)' : 'none',
            },
            cursor: 'pointer',
            opacity: isFormValid ? 1 : 0.7,
          }}
          disabled={false}
          onClick={handleRegister}
        >
          등록하기 <span style={{ marginLeft: 6 }}>🐾</span>
        </Button>
      </Box>
      {/* 이미지 크롭 다이얼로그 */}
      <Dialog open={cropDialogOpen} onClose={handleCropCancel} maxWidth="xs" fullWidth>
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ position: 'relative', width: '100%', height: 300, bgcolor: '#222' }}>
            {cropImage ? (
              <Cropper
                image={cropImage}
                crop={crop}
                zoom={zoom}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={handleCropComplete}
                // aspect prop 완전히 제거 (자유 비율)
              />
            ) : null}
          </Box>
          <Box sx={{ px: 2, py: 1 }}>
            {/* Slider(확대/축소) UI 제거 */}
            <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
              <Button onClick={handleCropCancel}>취소</Button>
              <Button variant="contained" onClick={handleCropSave}>자르기</Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
      
      {/* 하단 네비게이션 */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: '50%',
          transform: 'translateX(-50%)',
          width: '414px',
          height: 80,
          bgcolor: '#fff',
          borderTop: '1px solid #e0e0e0',
          borderLeft: '1px solid #e0e0e0',
          borderRight: '1px solid #e0e0e0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          zIndex: 1000,
        }}
      >
        <IconButton onClick={() => navigate('/')}>
          <HomeOutlinedIcon />
        </IconButton>
        <IconButton onClick={() => navigate('/search')}>
          <TravelExploreIcon />
        </IconButton>
        <IconButton onClick={() => navigate('/chat')}>
          <ChatBubbleOutlineIcon />
        </IconButton>
        <IconButton onClick={() => navigate('/calendar')}>
          <CalendarTodayIcon />
        </IconButton>
        <IconButton onClick={() => navigate('/my')}>
          <PersonOutlineIcon />
        </IconButton>
      </Box>
    </Container>
  );
};

export default PostRegistration;
