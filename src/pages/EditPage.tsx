import React, { useEffect, useState, useRef, useMemo } from 'react';
import { db, storage } from '../config/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Container, Typography, TextField, IconButton, Button, Dialog, DialogContent } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../cropUtils';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';

const categories = ['공학', '교육', '사회', '예체능', '의약', '인문', '자연'];
const types = ['과잠/학잠', '전공책', '기자재'];

// Post 타입 정의
interface Post {
  id: number | string;
  title: string;
  desc: string;
  major: string;
  price: number;
  images?: string[];
  image?: string;
}

export default function EditPage() {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [price, setPrice] = useState('');
  const [previews, setPreviews] = useState<string[]>([]);
  const [croppedImages, setCroppedImages] = useState<string[]>([]);
  const [cropDialogOpen, setCropDialogOpen] = useState(false);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [cropQueue, setCropQueue] = useState<string[]>([]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadPost = async () => {
      // 1) 로컬 게시글에서 찾기
      const local: Post[] = JSON.parse(localStorage.getItem('posts') || '[]');
      const foundLocal = local.find(p => String(p.id) === String(postId));
      if (foundLocal) {
        setPost(foundLocal);
        setTitle(foundLocal.title);
        setDesc(foundLocal.desc);
        setPrice(foundLocal.price.toString());
        setSelectedCategory(foundLocal.major.split(' ')[0]);
        setSelectedType(foundLocal.major.split(' ')[1] || types[0]);
        const imgs = (foundLocal.images && foundLocal.images.length > 0) ? foundLocal.images : (foundLocal.image ? [foundLocal.image] : []);
        setPreviews(imgs);
        setCroppedImages(imgs);
        return;
      }

      // 2) Firebase 게시글 로드 (sellerId_docId)
      if (postId && String(postId).includes('_')) {
        try {
          const [sellerId, docId] = String(postId).split('_');
          const postRef = doc(db, 'posts', sellerId, 'userPosts', docId);
          const snap = await getDoc(postRef);
          if (snap.exists()) {
            const data: any = snap.data();
            const majorText = `${data.category || ''} ${data.type || ''}`.trim();
            setPost({
              id: String(postId),
              title: data.title || '',
              desc: data.description || '',
              major: majorText,
              price: Number(data.price) || 0,
            });
            setTitle(data.title || '');
            setDesc(data.description || '');
            setPrice(String(Number(data.price) || ''));
            setSelectedCategory((data.category || '').trim());
            setSelectedType((data.type || '').trim());

            // 이미지 목록
            try {
              const folderRef = ref(storage, `posts/${sellerId}/${docId}`);
              const list = await listAll(folderRef);
              const urls = await Promise.all(list.items.map(i => getDownloadURL(i)));
              setPreviews(urls);
              setCroppedImages(urls);
            } catch {}
          }
        } catch (e) {
          // ignore
        }
      }
    };
    loadPost();
  }, [postId]);

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
    setCroppedImages(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  // 필수 입력 체크
  const isTitleValid = title.trim().length > 0;
  const isDescValid = desc.trim().length > 0;
  const isPriceValid = price.trim().length > 0;
  // 수정 화면에서는 이미지가 없어도 저장 가능. 있으면 형식만 검증
  const isImagesValid = croppedImages.length === 0 || croppedImages.every(src => typeof src === 'string' && (src.startsWith('data:image') || src.startsWith('http')));
  const isFormValid = isTitleValid && isDescValid && isPriceValid && isImagesValid;

  // 변경 여부 판단
  const isChanged = useMemo(() => {
    if (!post) return false;
    const originalMajor = post.major || '';
    const currentMajor = `${selectedCategory} ${selectedType}`.trim();
    const titleChanged = post.title.trim() !== title.trim();
    const descChanged = post.desc.trim() !== desc.trim();
    const priceChanged = Number(price) !== Number(post.price);
    const majorChanged = originalMajor.trim() !== currentMajor.trim();
    
    // 이미지 변경 체크 개선
    const originalImages = (post.images && post.images.length > 0) ? post.images : (post.image ? [post.image] : []);
    let imagesChanged = false;
    
    // 이미지 개수가 다르면 변경됨
    if (originalImages.length !== croppedImages.length) {
      imagesChanged = true;
    } else {
      // 이미지 개수가 같으면 각 이미지를 비교
      imagesChanged = originalImages.some((src, i) => src !== croppedImages[i]);
    }
    
    // 디버깅을 위한 로그 (개발 시에만)
    if (process.env.NODE_ENV === 'development') {
      console.log('EditPage 변경 체크:', {
        titleChanged,
        descChanged, 
        priceChanged,
        majorChanged,
        imagesChanged,
        originalImages: originalImages.length,
        croppedImages: croppedImages.length,
        isChanged: titleChanged || descChanged || priceChanged || majorChanged || imagesChanged
      });
    }
    
    return titleChanged || descChanged || priceChanged || majorChanged || imagesChanged;
  }, [post, title, desc, price, selectedCategory, selectedType, croppedImages]);

  // 저장 처리
  const handleSave = async () => {
    if (!isFormValid || !post) return;
    
    try {
      // Firebase 게시글인지 확인
      if (postId && String(postId).includes('_')) {
        // Firebase 게시글 업데이트
        const [sellerId, docId] = String(postId).split('_');
        const postRef = doc(db, 'posts', sellerId, 'userPosts', docId);
        
        await updateDoc(postRef, {
          title,
          description: desc,
          category: selectedCategory,
          type: selectedType,
          price: Number(price),
          updatedAt: new Date()
        });
        
        console.log('✅ Firebase 게시글 수정 완료');
      } else {
        // 로컬 게시글 업데이트
        const posts: Post[] = JSON.parse(localStorage.getItem('posts') || '[]');
        const updated = posts.map(p => p.id === post.id ? {
          ...p,
          title,
          desc,
          major: selectedCategory + ' ' + selectedType,
          price: Number(price),
          images: croppedImages,
          image: croppedImages[0],
        } : p);
        localStorage.setItem('posts', JSON.stringify(updated));
        console.log('✅ 로컬 게시글 수정 완료');
      }
      
      navigate('/');
    } catch (error) {
      console.error('❌ 게시글 수정 실패:', error);
      alert('게시글 수정에 실패했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <Container maxWidth="xs" sx={{ bgcolor: '#fafafa', minHeight: '100vh', pt: 8, pb: 8 }}>
      <Box sx={{ p: 3, pt: 2, position: 'relative' }}>
        <IconButton sx={{ position: 'absolute', left: 8, top: 8 }} onClick={() => navigate(-1)}>
          <CloseIcon />
        </IconButton>
        {/* 사진 placeholder & 업로드 */}
        <Box
          sx={{
            width: '100%',
            minHeight: 140,
            bgcolor: '#f5f5f5',
            borderRadius: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mb: 2,
            mt: 4,
            overflowX: 'auto',
            px: 1,
            flexDirection: 'column',
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
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Box sx={{ display: 'flex', gap: 1, flex: 1, overflowX: 'auto' }}>
                {previews.map((src, idx) => (
                  <Box key={idx} sx={{ width: 80, height: 80, borderRadius: 2, overflow: 'hidden', bgcolor: '#eee', border: '1px solid #ddd', position: 'relative', flex: '0 0 auto' }}>
                    <img src={src} alt={`preview-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <IconButton size="small" sx={{ position: 'absolute', top: 2, right: 2, bgcolor: '#fff', p: 0.5 }} onClick={e => { e.stopPropagation(); handleRemoveImage(idx); }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Box>
                ))}
                {/* 사진 추가 카드 */}
                <Box
                  sx={{ width: 80, height: 80, borderRadius: 2, border: '2px dashed #bbb', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', color: '#bbb', cursor: 'pointer', flex: '0 0 auto' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <ImageOutlinedIcon sx={{ fontSize: 32, mb: 0.5 }} />
                  <Typography fontSize={14}>사진 추가</Typography>
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
            </Box>
          )}
          {/* 안내문구 */}
          <Typography color="#bbb" fontSize={13} mt={2} textAlign="center">
            여러 장의 사진을 등록하면 이곳에서 스와이프할 수 있습니다
          </Typography>
        </Box>
        {/* 제목 */}
        <Typography fontWeight="bold" fontSize={16} mb={0.5}>제목 <span style={{ color: '#ff6b6b', fontSize: 13 }}>(필수)</span></Typography>
        <TextField fullWidth size="small" placeholder="" value={title} onChange={e => setTitle(e.target.value)} sx={{ mb: 0.5 }} />
        {!isTitleValid && <Typography color="error" fontSize={13} mb={1}>필수 입력입니다</Typography>}
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
        {!isDescValid && <Typography color="error" fontSize={13} mb={1}>필수 입력입니다</Typography>}
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
        {!isPriceValid && <Typography color="error" fontSize={13} mb={1}>필수 입력입니다</Typography>}
        {/* 이미지 필수 안내 */}
        {!isImagesValid && <Typography color="error" fontSize={13} mb={1}>사진을 1장 이상 등록해 주세요</Typography>}
        {/* 수정완료 버튼 */}
        <Button
          fullWidth
          variant="contained"
          sx={{
            background: isFormValid && isChanged ? 'linear-gradient(135deg, #30D6A3, #5ED381)' : '#eee',
            color: isFormValid && isChanged ? '#fff' : '#aaa',
            fontWeight: 'bold',
            borderRadius: 2,
            py: 1.2,
            fontSize: 18,
            mb: 1,
            mt: 1,
            boxShadow: isFormValid && isChanged ? '0 4px 12px rgba(48, 214, 163, 0.3)' : 'none',
            '&:hover': {
              background: isFormValid && isChanged ? 'linear-gradient(135deg, #5ED381, #30D6A3)' : '#eee',
              transform: isFormValid && isChanged ? 'translateY(-2px)' : 'none',
              boxShadow: isFormValid && isChanged ? '0 6px 16px rgba(48, 214, 163, 0.4)' : 'none',
            },
          }}
          disabled={!isFormValid || !isChanged}
          onClick={handleSave}
        >
          {isChanged ? '수정완료' : '변경사항 없음'} <span style={{ marginLeft: 6 }}>🐾</span>
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
              />
            ) : null}
          </Box>
          <Box sx={{ px: 2, py: 1 }}>
            <Box display="flex" justifyContent="flex-end" gap={1} mt={2}>
              <Button onClick={handleCropCancel}>취소</Button>
              <Button variant="contained" onClick={handleCropSave}>자르기</Button>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </Container>
  );
} 