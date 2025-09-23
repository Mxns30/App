import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  IconButton,
  Divider,
  Avatar,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  MoreVert as MoreVertIcon,
} from '@mui/icons-material';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
// import Slide from '@mui/material/Slide';
// import { TransitionProps } from '@mui/material/transitions';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import EditDeleteActionSheet from './EditDeleteActionSheet';

type Post = {
  id: number;
  title: string;
  school: string;
  major: string;
  price: number;
  marketPrice: number;
  isLiked: boolean;
  image?: string;
  images?: string[];
  userId: string;
  desc: string;
};

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<Post | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const myUid = 'me';
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const handleMenuOpen = () => setActionSheetOpen(true);
  const handleMenuClose = () => setActionSheetOpen(false);

  // const handleDeleteClick = () => {
  //   setActionSheetOpen(false);
  //   setTimeout(() => {
  //     setConfirmDeleteOpen(true);
  //   }, 150);
  // };
  const handleDeleteCancel = () => setConfirmDeleteOpen(false);
  const handleDeleteConfirm = () => {
    setConfirmDeleteOpen(false);
    if (post) {
      const updatedPosts = posts.filter(p => p.id !== post.id);
      setPosts(updatedPosts);
      localStorage.setItem('posts', JSON.stringify(updatedPosts));
      navigate('/');
    }
  };

  useEffect(() => {
    const savedPosts = localStorage.getItem('posts');
    const postsData = savedPosts ? JSON.parse(savedPosts) : [];
    setPosts(postsData);
    const foundPost = postsData.find((p: Post) => p.id === Number(postId));
    setPost(foundPost || null);
  }, [postId]);

  const handleToggleLike = () => {
    if (!post) return;
    const updatedPosts = posts.map(p =>
      p.id === post.id ? { ...p, isLiked: !p.isLiked } : p
    );
    setPosts(updatedPosts);
    setPost({ ...post, isLiked: !post.isLiked });
    localStorage.setItem('posts', JSON.stringify(updatedPosts));
  };

  // const handleDelete = () => {
  //   if (!post) return;
  //   const updatedPosts = posts.filter(p => p.id !== post.id);
  //   setPosts(updatedPosts);
  //   localStorage.setItem('posts', JSON.stringify(updatedPosts));
  //   navigate('/');
  // };

  // const handleEdit = () => {
  //   if (!post) return;
  //   navigate('/post/registration', { state: { editPost: post } });
  // };

  if (!post) {
    return (
      <Container maxWidth="xs" sx={{ bgcolor: '#fafafa', minHeight: '100vh', pt: 8, pb: 8 }}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate('/')}> <ArrowBackIcon /> </IconButton>
          <Typography variant="h6" sx={{ ml: 1 }}>게시글을 찾을 수 없습니다</Typography>
        </Box>
      </Container>
    );
  }

  // 이미지 배열 지원 (기존 image, 새 images)
  const images: string[] = post.images && post.images.length > 0
    ? post.images
    : post.image ? [post.image] : [];
  // base64로 시작하는 값만 필터링
  const validImages = images.filter(src => typeof src === 'string' && src.startsWith('data:image'));

  // 계열/종류 분리
  const [category, type] = post.major.split(' ');

  return (
    <Container maxWidth="xs" sx={{ bgcolor: '#fafafa', minHeight: '100vh', pt: 0, pb: 0 }}>
      {/* 헤더 */}
      <Box display="flex" alignItems="center" px={1.5} pt={2} pb={1}>
        <IconButton onClick={() => navigate('/')}> <ArrowBackIcon /> </IconButton>
        <Box flex={1} />
        {post.userId === myUid && (
          <>
            <IconButton onClick={handleMenuOpen} size="small">
              <MoreVertIcon />
            </IconButton>
            <EditDeleteActionSheet
              open={actionSheetOpen}
              onEdit={() => { navigate(`/post/edit/${post.id}`); setActionSheetOpen(false); }}
              onDelete={() => { setActionSheetOpen(false); setTimeout(() => setConfirmDeleteOpen(true), 150); }}
              onClose={handleMenuClose}
            />
            <Dialog
              open={confirmDeleteOpen}
              onClose={handleDeleteCancel}
              fullWidth
              maxWidth="xs"
              PaperProps={{ sx: { zIndex: 9999 } }}
            >
              <DialogTitle>정말 삭제하시겠습니까?</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  이 게시글은 삭제 후 복구할 수 없습니다.
                </DialogContentText>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleDeleteCancel} sx={{ color: '#888' }}>취소</Button>
                <Button onClick={handleDeleteConfirm} sx={{ color: '#d32f2f', fontWeight: 'bold' }}>삭제</Button>
              </DialogActions>
            </Dialog>
          </>
        )}
      </Box>

      {/* 이미지 캐러셀 */}
      <Box sx={{ width: '100%', height: 220, bgcolor: '#ededed', position: 'relative', mb: 2 }}>
        {validImages.length > 0 ? (
          <Slider
            dots
            infinite={validImages.length > 1}
            speed={500}
            slidesToShow={1}
            slidesToScroll={1}
            arrows={false}
          >
            {validImages.map((src, idx) => (
              <Box key={idx} sx={{ width: '100%', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                <img src={src} alt={`img-${idx}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            ))}
          </Slider>
        ) : (
          <Box sx={{ width: '100%', height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#e0e0e0' }}>
            <Typography color="text.secondary">이미지 없음</Typography>
          </Box>
        )}
      </Box>

      {/* 프로필, 제목, 태그, 즐겨찾기, 가격, 설명, 채팅 버튼 순서로 나열 */}
      <Box px={2}>
        {/* 프로필/닉네임 */}
        <Box display="flex" alignItems="center" mb={1} sx={{ cursor: 'pointer' }} onClick={() => navigate(`/profile/${post.userId}`)}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#eee', mr: 1 }}>🐾</Avatar>
          <Typography fontWeight="bold" fontSize={16}>{post.userId || '사용자'}</Typography>
        </Box>
        {/* 제목 */}
        <Typography fontWeight="bold" fontSize={22} mb={1}>{post.title || '제목 없음'}</Typography>
        {/* 태그 */}
        <Box display="flex" gap={1} mb={2}>
          {category && <Box sx={{ bgcolor: '#e6fff6', color: '#1abc9c', borderRadius: 2, px: 1.2, py: 0.3, fontSize: 13, fontWeight: 'bold' }}>{category}</Box>}
          {type && <Box sx={{ bgcolor: '#e6fff6', color: '#1abc9c', borderRadius: 2, px: 1.2, py: 0.3, fontSize: 13, fontWeight: 'bold' }}>{type}</Box>}
        </Box>
        {/* 즐겨찾기/가격 */}
        <Box display="flex" alignItems="center" gap={1} mb={2}>
          <IconButton size="small" onClick={handleToggleLike}>
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
          <Typography fontWeight="bold" fontSize={22}>{typeof post.price === 'number' ? post.price.toLocaleString() + '원' : '가격 없음'}</Typography>
          <Typography color="text.secondary" fontSize={14}>
            시세: {typeof post.marketPrice === 'number' ? post.marketPrice.toLocaleString() + '원' : '시세 없음'}
          </Typography>
        </Box>
        {/* 상세 설명 */}
        <Divider sx={{ my: 2 }} />
        <Typography fontWeight="bold" fontSize={16} mb={1}>상세 설명</Typography>
        <Typography fontSize={15} mb={2} sx={{ whiteSpace: 'pre-line' }}>{post.desc || '설명 없음'}</Typography>
        {/* 채팅하기 버튼 */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          sx={{
            borderRadius: 3,
            background: 'linear-gradient(135deg, #30D6A3, #5ED381)',
            fontWeight: 'bold',
            fontSize: 18,
            mb: 2,
            '&:hover': { 
              background: 'linear-gradient(135deg, #5ED381, #30D6A3)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(48, 214, 163, 0.4)'
            }
          }}
          onClick={() => {
            // 게시물 기반 채팅방 ID 생성
            const myUid = localStorage.getItem('userId') || `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const sortedIds = [post.userId, myUid].sort();
            const roomId = `${post.id}_${sortedIds[0]}_${sortedIds[1]}`;
            navigate(`/chat/${roomId}?postId=${post.id}&sellerId=${post.userId}`);
          }}
        >
          채팅하기
        </Button>
      </Box>
    </Container>
  );
};

export default PostDetail; 