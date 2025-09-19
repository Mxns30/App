import React, { useState, useEffect } from 'react';
import {
  Box, Container, Typography, TextField, InputAdornment, IconButton, MenuItem, Button, Card, CardContent
} from '@mui/material';
import { collection, addDoc, getDocs, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase.ts';
import SearchIcon from '@mui/icons-material/Search';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import Avatar from '@mui/material/Avatar';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PetsIcon from '@mui/icons-material/Pets';
import MenuIcon from '@mui/icons-material/Menu';
import Menu from '@mui/material/Menu';
import { useNavigate } from 'react-router-dom';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';

type Post = {
  id: string;
  title: string;
  school: string;
  major: string;
  price: number;
  marketPrice: number;
  isLiked: boolean;
  image?: string;
  userId: string;
  desc: string;
  createdAt?: Date;
  updatedAt?: Date;
};

// 실제 사용자 ID는 auth.currentUser?.uid로 가져옴
const initialPosts: Post[] = [
  {
    id: '1',
    title: '혼자 공부하는 C언어',
    school: '한양여자대학교',
    major: '시행학과',
    price: 10000,
    marketPrice: 8000,
    isLiked: false,
    image: undefined,
    userId: 'user1',
    desc: '설명 예시',
  },
  {
    id: '2',
    title: '데이터베이스 개론과 실습',
    school: '한양여자대학교',
    major: '스마트IT과',
    price: 9000,
    marketPrice: 10000,
    isLiked: true,
    image: undefined,
    userId: 'user2',
    desc: '1:1 최적화도 배우는 C 프로그래밍 지침서. 이 책은 독학으로 C 언어를 배우는 입문자가 꼭 필요한 내용을 제대로 학습할 수 있도록 구성했다. 우왕~ 이렇게 설명이 들어가요.',
  },
  {
    id: '3',
    title: '인간관계 심리학',
    school: '한양여자대학교',
    major: '사회복지과',
    price: 11000,
    marketPrice: 7000,
    isLiked: false,
    image: undefined,
    userId: 'user3',
    desc: '1:1 최적화도 배우는 C 프로그래밍 지침서. 이 책은 독학으로 C 언어를 배우는 입문자가 꼭 필요한 내용을 제대로 학습할 수 있도록 구성했다. 우왕~ 이렇게 설명이 들어가요.',
  },
  {
    id: '4',
    title: '관광마케팅',
    school: '한양여자대학교',
    major: '호텔관광과',
    price: 11500,
    marketPrice: 12000,
    isLiked: false,
    image: undefined,
    userId: 'user4',
    desc: '1:1 최적화도 배우는 C 프로그래밍 지침서. 이 책은 독학으로 C 언어를 배우는 입문자가 꼭 필요한 내용을 제대로 학습할 수 있도록 구성했다. 우왕~ 이렇게 설명이 들어가요.',
  },
  {
    id: '5',
    title: '항공운임 발권실무',
    school: '한양여자대학교',
    major: '항공과',
    price: 10000,
    marketPrice: 10000,
    isLiked: false,
    image: undefined,
    userId: 'user5',
    desc: '1:1 최적화도 배우는 C 프로그래밍 지침서. 이 책은 독학으로 C 언어를 배우는 입문자가 꼭 필요한 내용을 제대로 학습할 수 있도록 구성했다. 우왕~ 이렇게 설명이 들어가요.',
  },
];

const categories = ['공학', '교육', '사회', '예체능', '의약', '인문', '자연'];
const types = ['과잠/학잠', '전공책', '기자재'];

const HomePage: React.FC = () => {
  const [open, setOpen] = React.useState(false);
  const [posts, setPosts] = React.useState<Post[]>([]);
  const [loading, setLoading] = React.useState(true);

  // Firebase에서 게시글 실시간 가져오기
  React.useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);
  const [selectedCategory, setSelectedCategory] = React.useState('');
  const [selectedType, setSelectedType] = React.useState('');
  const [title, setTitle] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [images, setImages] = React.useState<File[]>([]);
  const [previews, setPreviews] = React.useState<string[]>([]);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [selectedPost, setSelectedPost] = React.useState<Post | null>(null);
  const [estimate] = React.useState<number | null>(null);
  const [editPostId, setEditPostId] = React.useState<string | null>(null);
  const [profileOpen, setProfileOpen] = React.useState(false);
  const [profileUser, setProfileUser] = React.useState<{ nickname: string; photoUrl?: string } | null>(null);
  const [menuAnchorEl, setMenuAnchorEl] = React.useState<null | HTMLElement>(null);
  const [menuPostId, setMenuPostId] = React.useState<string | null>(null);
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [deleteTargetId, setDeleteTargetId] = React.useState<string | null>(null);

  // 이미지 업로드 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files).slice(0, 100);
    setImages(files);
    // 미리보기 생성
    const fileReaders = files.map(file => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
    });
    Promise.all(fileReaders).then(setPreviews);
  };

  // 파일 input ref
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // 필수 입력 체크
  const isTitleValid = title.trim().length > 0;
  const isDescValid = desc.trim().length > 0;
  const isPriceValid = price.trim().length > 0;
  const isImagesValid = images.length > 0;
  const isFormValid = isTitleValid && isDescValid && isPriceValid && (editPostId ? true : isImagesValid);

  // 수정 모드: 입력값이 기존 게시글과 다를 때만 수정 완료 버튼 활성화
  let isEditChanged = false;
  if (editPostId) {
    const origin = posts.find(p => p.id === editPostId);
    if (origin) {
      isEditChanged =
        origin.title.trim() !== title.trim() ||
        origin.desc.trim() !== desc.trim() ||
        origin.price !== Number(price) ||
        origin.major.trim() !== (selectedCategory + ' ' + selectedType).trim();
    }
  } else {
    isEditChanged = true;
  }

  // 등록 처리
  const handleRegister = async () => {
    if (!isFormValid) return;
    
    try {
      if (editPostId) {
        // 수정 모드: Firebase에서 해당 게시글 업데이트
        const postRef = doc(db, 'posts', editPostId);
        await updateDoc(postRef, {
          title,
          major: selectedCategory + ' ' + selectedType,
          price: Number(price),
          image: previews[0],
          desc,
          updatedAt: new Date()
        });
      } else {
        // 새 게시물 등록 - Firebase에 저장
        await addDoc(collection(db, 'posts'), {
          title,
          school: '한양여자대학교',
          major: selectedCategory + ' ' + selectedType,
          price: Number(price),
          marketPrice: 0,
          isLiked: false,
          image: previews[0],
          userId: auth.currentUser?.uid || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          desc: desc,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
      
      // 폼 초기화
      setTitle('');
      setDesc('');
      setPrice('');
      setImages([]);
      setPreviews([]);
      setEditPostId(null);
      setOpen(false);
    } catch (error) {
      console.error('게시글 등록/수정 오류:', error);
      alert('게시글 등록 중 오류가 발생했습니다.');
    }
  };

  // 게시물 삭제
  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'posts', id));
    } catch (error) {
      console.error('게시글 삭제 오류:', error);
      alert('게시글 삭제 중 오류가 발생했습니다.');
    }
  };

  // 게시물 상세 열기 (사용하지 않음)
  // const handleCardClick = (post: Post) => {
  //   setSelectedPost(post);
  //   setDetailOpen(true);
  // };

  // 상세 닫기
  const handleDetailClose = () => {
    setDetailOpen(false);
    setSelectedPost(null);
  };

  // 게시물 수정 버튼 클릭
  const handleEdit = (post: Post) => {
    setTitle(post.title);
    setDesc(post.desc);
    setPrice(post.price.toString());
    setSelectedCategory(post.major.split(' ')[0]);
    setSelectedType(post.major.split(' ')[1] || types[0]);
    setPreviews(post.image ? [post.image] : []);
    setImages([]); // 실제 파일은 불러올 수 없음
    setEditPostId(post.id);
    setOpen(true);
  };

  // 상세에서 프로필 클릭
  const handleProfileClick = (user: { nickname: string; photoUrl?: string }) => {
    setProfileUser(user);
    setDetailOpen(false);
    setProfileOpen(true);
  };

  const handleProfileClose = () => {
    setProfileOpen(false);
    setDetailOpen(true);
  };

  // 찜(별) 토글 핸들러
  const handleToggleLike = async (id: string) => {
    try {
      const postRef = doc(db, 'posts', id);
      const post = posts.find(p => p.id === id);
      if (post) {
        await updateDoc(postRef, {
          isLiked: !post.isLiked
        });
      }
    } catch (error) {
      console.error('찜하기 오류:', error);
    }
  };

  // 메뉴(햄버거) 상태 (사용하지 않음)
  // const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, postId: number) => {
  //   const post = posts.find(p => p.id === postId);
  //   if (post?.userId !== myUid) return; // 내 글이 아니면 메뉴 안 띄움
  //   setMenuAnchorEl(event.currentTarget);
  //   setMenuPostId(postId);
  // };

  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setMenuPostId(null);
  };

  // 삭제 다이얼로그 열릴 때 상세/프로필 다이얼로그 닫기
  React.useEffect(() => {
    if (deleteDialogOpen) {
      setDetailOpen(false);
      setProfileOpen(false);
    }
  }, [deleteDialogOpen]);

  return (
    <Container maxWidth="xs" sx={{ bgcolor: '#fafafa', minHeight: '100vh', pt: 0, pb: 0, width: '100%', maxWidth: '414px', overflowY: 'auto' }}>
      {/* 상단 */}
      <Box display="flex" alignItems="center" mb={2} gap={1}>
        <TextField
          select
          value="한양여자대학교"
          size="small"
          variant="standard"
          sx={{ minWidth: 120, bgcolor: 'transparent', border: 'none', fontWeight: 'bold', fontSize: 18, mr: 0, pl: 0, '& .MuiInputBase-root': { bgcolor: 'transparent', fontWeight: 'bold', fontSize: 18 }, '& fieldset': { border: 'none' } }}
          InputProps={{ disableUnderline: true }}
        >
          <MenuItem value="한양여자대학교">한양여자대학교</MenuItem>
        </TextField>
        <Box flex={1} />
        <IconButton
          sx={{
            bgcolor: '#fff',
            color: '#1abc9c',
            borderRadius: '999px',
            width: 56,
            height: 32,
            boxShadow: 1,
            border: '1px solid #e0e0e0',
            '&:hover': { bgcolor: '#f0fdfa' }
          }}
          onClick={() => navigate('/search')}
        >
          <SearchIcon />
        </IconButton>
      </Box>

      {/* 게시물 리스트 */}
      <Box>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" py={4}>
            <Typography>게시글을 불러오는 중...</Typography>
          </Box>
        ) : (
          posts
            .map((post) => (
            <Card key={post.id} sx={{ display: 'flex', mb: 2, boxShadow: 0, cursor: 'pointer' }} onClick={() => navigate(`/post/${post.id}`)}>
              {post.image ? (
                <Box sx={{ width: 120, height: 120, borderRadius: 2, m: 1, overflow: 'hidden', bgcolor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </Box>
              ) : (
                <Box sx={{ width: 120, height: 120, bgcolor: '#e0e0e0', borderRadius: 2, m: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ImageOutlinedIcon sx={{ color: '#ccc', fontSize: 48 }} />
                </Box>
              )}
              <CardContent sx={{ flex: 1, p: 1 }}>
                <Typography fontWeight="bold" fontSize={16}>{post.title}</Typography>
                <Typography variant="body2" color="text.secondary">
                  {(() => {
                    const [category, type] = post.major.split(' ');
                    if (category && type) {
                      return `${post.school} | ${category} | ${type}`;
                    } else if (category) {
                      return `${post.school} | ${category}`;
                    } else if (type) {
                      return `${post.school} | ${type}`;
                    } else {
                      return post.school;
                    }
                  })()}
                </Typography>
                <Typography variant="body2" color="success.main">
                  시세: {post.marketPrice?.toLocaleString()}원
                </Typography>
                <Typography fontWeight="bold" fontSize={16}>
                  {post.price.toLocaleString()}원
                </Typography>
              </CardContent>
              <Box display="flex" flexDirection="column" justifyContent="space-between" alignItems="center" p={1}>
                {post.userId === auth.currentUser?.uid && (
                  <IconButton size="small" /* onClick 제거: UX만 남김 */>
                    <MenuIcon />
                  </IconButton>
                )}
                {post.userId !== auth.currentUser?.uid && (
                  <IconButton size="small" color={post.isLiked ? 'warning' : 'default'} onClick={e => { e.stopPropagation(); handleToggleLike(post.id); }}>
                    {post.isLiked ? (
                      <StarIcon 
                        sx={{ 
                          bgcolor: '#FDA97B', 
                          borderRadius: '50%', 
                          p: 0.5,
                          color: '#fff',
                          fontSize: 20
                        }} 
                      />
                    ) : (
                      <StarBorderIcon 
                        sx={{ 
                          bgcolor: '#f0f0f0', 
                          borderRadius: '50%', 
                          p: 0.5,
                          color: '#666',
                          fontSize: 20
                        }} 
                      />
                    )}
                  </IconButton>
                )}
              </Box>
            </Card>
          ))
        )}
      </Box>

      {/* + Posting 버튼 */}
      <Button
        variant="contained"
        sx={{
          position: 'fixed',
          bottom: 80,
          right: 24,
          borderRadius: 8,
          background: 'linear-gradient(135deg, #30D6A3, #5ED381)',
          color: '#fff',
          fontWeight: 'bold',
          boxShadow: '0 4px 12px rgba(48, 214, 163, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #5ED381, #30D6A3)',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 16px rgba(48, 214, 163, 0.4)'
          }
        }}
        onClick={() => navigate('/post/registration')}
      >
        {editPostId ? '수정하기' : '+ Posting'}
      </Button>

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
        <IconButton
          sx={{ color: '#1abc9c' }}
          onClick={() => navigate('/')}
        >
          <HomeOutlinedIcon />
        </IconButton>
        <IconButton
          sx={{ color: '#666' }}
          onClick={() => navigate('/search')}
        >
          <TravelExploreIcon />
        </IconButton>
        <IconButton
          sx={{ color: '#666' }}
          onClick={() => navigate('/chat')}
        >
          <ChatBubbleOutlineIcon />
        </IconButton>
        <IconButton
          sx={{ color: '#666' }}
          onClick={() => navigate('/calendar')}
        >
          <CalendarTodayIcon />
        </IconButton>
        <IconButton
          sx={{ color: '#666' }}
          onClick={() => navigate('/my')}
        >
          <PersonOutlineIcon />
        </IconButton>
      </Box>

      {/* 게시글 등록 Dialog */}
      <Dialog 
        open={open} 
        onClose={() => setOpen(false)} 
        fullWidth 
        maxWidth="xs" 
        PaperProps={{ 
          sx: { 
            borderRadius: 4,
            maxWidth: '414px',
            width: '100%',
            margin: '0 auto'
          } 
        }}
      >
        <DialogContent sx={{ p: 0 }}>
          <Box sx={{ p: 3, pt: 2, position: 'relative' }}>
            <IconButton sx={{ position: 'absolute', left: 8, top: 8 }} onClick={() => setOpen(false)}>
              <CloseIcon />
            </IconButton>
            {/* 이미지 placeholder & 업로드 */}
            <Box
              sx={{
                width: '100%',
                height: 140,
                bgcolor: '#f5f5f5',
                borderRadius: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: previews.length === 0 ? 'center' : 'flex-start',
                mb: 2,
                mt: 4,
                overflowX: 'auto',
                cursor: 'pointer',
                px: 1,
              }}
              onClick={() => fileInputRef.current?.click()}
            >
              {previews.length === 0 ? (
                <Box sx={{ width: 40, height: 40, bgcolor: '#e0e0e0', borderRadius: 2 }} />
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {previews.map((src, idx) => (
                    <Box key={idx} sx={{ width: 56, height: 56, borderRadius: 2, overflow: 'hidden', bgcolor: '#eee', border: '1px solid #ddd', mr: 1 }}>
                      <img src={src} alt={`preview-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </Box>
                  ))}
                </Box>
              )}
              <input
                type="file"
                accept="image/*"
                multiple
                hidden
                ref={fileInputRef}
                onChange={handleImageChange}
              />
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
              InputProps={{
                endAdornment: estimate && (
                  <InputAdornment position="end">
                    <span style={{ color: '#1abc9c', fontWeight: 'bold' }}>
                      시세: {estimate.toLocaleString()}원
                    </span>
                  </InputAdornment>
                ),
              }}
            />
            {!isPriceValid && <Typography color="error" fontSize={13} mb={1}>필수 입력입니다</Typography>}
            {/* 이미지 필수 안내 (등록 모드에서만) */}
            {!isImagesValid && !editPostId && <Typography color="error" fontSize={13} mb={1}>사진을 1장 이상 등록해 주세요</Typography>}
            {/* 등록하기 버튼 */}
            <Button
              fullWidth
              variant="contained"
              sx={{
                background: isFormValid && (!editPostId || isEditChanged) ? 'linear-gradient(135deg, #30D6A3, #5ED381)' : '#eee',
                color: isFormValid && (!editPostId || isEditChanged) ? '#fff' : '#aaa',
                fontWeight: 'bold',
                borderRadius: 2,
                py: 1.2,
                fontSize: 18,
                mb: 1,
                mt: 1,
                boxShadow: isFormValid && (!editPostId || isEditChanged) ? '0 4px 12px rgba(48, 214, 163, 0.3)' : 'none',
                '&:hover': {
                  background: isFormValid && (!editPostId || isEditChanged) ? 'linear-gradient(135deg, #5ED381, #30D6A3)' : '#eee',
                  transform: isFormValid && (!editPostId || isEditChanged) ? 'translateY(-2px)' : 'none',
                  boxShadow: isFormValid && (!editPostId || isEditChanged) ? '0 6px 16px rgba(48, 214, 163, 0.4)' : 'none',
                },
              }}
              disabled={!isFormValid || (editPostId ? !isEditChanged : false)}
              onClick={handleRegister}
            >
              {editPostId ? '수정 완료' : '등록하기 🐾'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* 게시물 상세 Dialog */}
      <Dialog 
        open={detailOpen} 
        onClose={handleDetailClose} 
        fullWidth 
        maxWidth="xs" 
        PaperProps={{ 
          sx: { 
            borderRadius: 4,
            maxWidth: '414px',
            width: '100%',
            margin: '0 auto'
          } 
        }}
      >
        {selectedPost && (
          <Box>
            {/* 상단 이미지 */}
            <Box sx={{ width: '100%', height: 180, bgcolor: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
              <IconButton sx={{ position: 'absolute', left: 8, top: 8, bgcolor: '#fff', zIndex: 1 }} onClick={handleDetailClose}>
                <ArrowBackIosNewIcon />
              </IconButton>
              {selectedPost.image ? (
                <img src={selectedPost.image} alt={selectedPost.title} style={{ width: '100%', height: '100%', objectFit: 'contain', maxHeight: 180 }} />
              ) : (
                <Box sx={{ width: 56, height: 56, bgcolor: '#e0e0e0', borderRadius: 2 }} />
              )}
            </Box>
            {/* 본문 */}
            <Box sx={{ p: 3, pt: 2 }}>
              <Box display="flex" alignItems="center" mb={1} sx={{ cursor: 'pointer' }} onClick={() => handleProfileClick({ nickname: selectedPost.userId || 'cloud1234', photoUrl: undefined })}>
                <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: '#eee' }}>
                  <PetsIcon sx={{ fontSize: 28, color: '#bbb' }} />
                </Avatar>
                <Typography fontWeight="bold" fontSize={16} mr={1}>{selectedPost.userId || 'cloud1234'}</Typography>
              </Box>
              <Typography fontWeight="bold" fontSize={20} mb={1}>{selectedPost.title}</Typography>
              <Box display="flex" gap={1} mb={1}>
                <Box sx={{ bgcolor: '#e6fff6', color: '#1abc9c', borderRadius: 2, px: 1.2, py: 0.3, fontSize: 13, fontWeight: 'bold' }}>{selectedPost.major}</Box>
              </Box>
              <Typography color="text.secondary" fontSize={15} mb={2}>
                {selectedPost.desc}
              </Typography>
              <Box display="flex" alignItems="center" gap={2} mb={2}>
                <StarBorderIcon sx={{ color: '#aaa' }} />
                <Typography fontWeight="bold" fontSize={20}>{selectedPost.price.toLocaleString()}원</Typography>
                <Typography color="text.secondary" fontSize={14}>
                  시세: {selectedPost.marketPrice?.toLocaleString()}원
                </Typography>
              </Box>
                              {selectedPost.userId !== auth.currentUser?.uid && (
                  <Button
                    fullWidth
                    variant="contained"
                    sx={{ bgcolor: '#1abc9c', color: '#fff', fontWeight: 'bold', borderRadius: 2, py: 1.2, fontSize: 18 }}
                    onClick={() => {
                      // 게시물 기반 채팅방 ID 생성
                      const currentUserId = auth.currentUser?.uid || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                      const sortedIds = [selectedPost.userId, currentUserId].sort();
                      const roomId = `${selectedPost.id}_${sortedIds[0]}_${sortedIds[1]}`;
                      navigate(`/chat/${roomId}?postId=${selectedPost.id}&sellerId=${selectedPost.userId}`);
                    }}
                  >
                    채팅하기
                  </Button>
                )}
            </Box>
          </Box>
        )}
      </Dialog>

      {/* 상대 프로필 Dialog */}
      <Dialog open={profileOpen} onClose={handleProfileClose} fullWidth maxWidth="xs" PaperProps={{ sx: { borderRadius: 4 } }}>
        <Box sx={{ position: 'relative', minHeight: 400, bgcolor: '#fff', overflow: 'hidden' }}>
          <IconButton sx={{ position: 'absolute', left: 8, top: 8, zIndex: 1 }} onClick={handleProfileClose}>
            <ArrowBackIosNewIcon />
          </IconButton>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 400 }}>
            <Avatar sx={{ width: 96, height: 96, bgcolor: '#eee', mb: 2 }}>
              {profileUser?.photoUrl ? (
                <img src={profileUser.photoUrl} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <PetsIcon sx={{ fontSize: 64, color: '#bbb' }} />
              )}
            </Avatar>
            <Typography fontWeight="bold" fontSize={22} color="#333">
              {profileUser?.nickname || 'cloud1234'}
            </Typography>
          </Box>
          {/* 하단 연한 원 배경 */}
          <Box sx={{ position: 'absolute', left: -80, bottom: -40, width: 200, height: 200, bgcolor: '#fffde7', borderRadius: '50%', zIndex: 0, opacity: 0.5 }} />
          <Box sx={{ position: 'absolute', right: -60, bottom: -60, width: 220, height: 220, bgcolor: '#ffebee', borderRadius: '50%', zIndex: 0, opacity: 0.5 }} />
        </Box>
      </Dialog>

      {/* 햄버거 메뉴 */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {menuPostId && posts.find(p => p.id === menuPostId)?.userId === auth.currentUser?.uid && (
          <MenuItem onClick={() => { handleEdit(posts.find(p => p.id === menuPostId)!); handleMenuClose(); }}>
            <span style={{ color: '#1976d2', fontWeight: 'bold' }}>수정</span>
          </MenuItem>
        )}
        {menuPostId && posts.find(p => p.id === menuPostId)?.userId === auth.currentUser?.uid && (
          <MenuItem
            onClick={() => {
              handleMenuClose();
              setTimeout(() => {
                setDeleteTargetId(menuPostId);
                setDeleteDialogOpen(true);
              }, 100);
            }}
          >
            <span style={{ color: '#d32f2f', fontWeight: 'bold' }}>삭제</span>
          </MenuItem>
        )}
      </Menu>

      {/* 삭제 확인 다이얼로그 */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => { setDeleteDialogOpen(false); setDeleteTargetId(null); }}
        PaperProps={{ sx: { zIndex: 2000, pointerEvents: 'auto' } }}
      >
        <Box sx={{ p: 3, minWidth: 300 }}>
          <Typography fontWeight="bold" fontSize={20} mb={2}>정말 삭제하시겠습니까?</Typography>
          <Typography color="text.secondary" mb={3}>이 게시글은 삭제 후 복구할 수 없습니다.</Typography>
          <Box display="flex" justifyContent="flex-end" gap={2}>
            <Button
              onClick={() => {
                setDeleteDialogOpen(false);
                setDeleteTargetId(null);
              }}
              sx={{ color: '#888', pointerEvents: 'auto' }}
            >
              취소
            </Button>
            <Button
              onClick={() => {
                if (deleteTargetId !== null) {
                  handleDelete(deleteTargetId);
                  setDeleteTargetId(null);
                  setDeleteDialogOpen(false);
                  navigate(-1); // 이전 화면으로 이동
                }
              }}
              sx={{ color: '#d32f2f', fontWeight: 'bold', pointerEvents: 'auto' }}
            >
              삭제
            </Button>
          </Box>
        </Box>
      </Dialog>
    </Container>
  );
};

export default HomePage;
