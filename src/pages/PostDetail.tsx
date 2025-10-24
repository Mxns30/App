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
import { useAuth } from '../contexts/AuthContext';
import { collection, getDocs, doc, getDoc, collectionGroup, deleteDoc, setDoc, serverTimestamp, query, where, getDocs as getDocsQuery } from 'firebase/firestore';
import { ref, getDownloadURL, listAll, deleteObject } from 'firebase/storage';
import { db, storage } from '../config/firebase';

type Post = {
  id: number | string;
  title: string;
  school: string;
  major: string;
  price: number;
  marketPrice: number;
  isLiked: boolean;
  image?: string;
  images?: string[];
  userId: string;
  authorId?: string;
  desc: string;
  isFirebasePost?: boolean;
  status?: 'completed' | 'active';
};

const PostDetail: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userDisplayName, setUserDisplayName] = useState<string>('');
  const [profileUrl, setProfileUrl] = useState<string | undefined>(undefined);
  
  // 실제 사용자 ID 사용
  const myUid = currentUser?.uid || 'anonymous';
  const [actionSheetOpen, setActionSheetOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const handleMenuOpen = () => setActionSheetOpen(true);
  const handleMenuClose = () => setActionSheetOpen(false);

  // 채팅방 생성 함수
  const createChatRoom = async (postId: string, sellerId: string, buyerId: string) => {
    try {
      // 채팅방 ID 생성 (게시물 ID와 참여자들을 포함)
      const sortedIds = [sellerId, buyerId].sort();
      const roomId = `${postId}_${sortedIds[0]}_${sortedIds[1]}`;
      
      // 이미 존재하는 채팅방인지 확인
      const roomRef = doc(db, 'chatRooms', roomId);
      const roomDoc = await getDoc(roomRef);
      
      if (!roomDoc.exists()) {
        // 새 채팅방 생성
        await setDoc(roomRef, {
          id: roomId,
          postId: postId,
          sellerId: sellerId,
          buyerId: buyerId,
          participants: [sellerId, buyerId],
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          deleted: false,
          lastMessage: null
        });
        console.log('✅ 새 채팅방 생성됨:', roomId);
      } else {
        console.log('ℹ️ 기존 채팅방 사용:', roomId);
      }
      
      return roomId;
    } catch (error) {
      console.error('❌ 채팅방 생성 실패:', error);
      throw error;
    }
  };

  // const handleDeleteClick = () => {
  //   setActionSheetOpen(false);
  //   setTimeout(() => {
  //     setConfirmDeleteOpen(true);
  //   }, 150);
  // };
  const handleDeleteCancel = () => setConfirmDeleteOpen(false);
  const handleDeleteConfirm = async () => {
    setConfirmDeleteOpen(false);
    if (post) {
      try {
        console.log('🗑️ 게시글 삭제 시작:', post.id);
        
        // Firebase 게시글인지 확인
        if (post.isFirebasePost) {
          console.log('🔥 Firebase 게시글 삭제 중...');
          
          // Firebase에서 실제 문서 삭제
          const userId = post.userId;
          const docId = post.id.toString().split('_')[1]; // userId_docId 형식에서 docId 추출
          
          console.log(`🗑️ 삭제할 문서: posts/${userId}/userPosts/${docId}`);
          const postRef = doc(db, 'posts', userId, 'userPosts', docId);
          await deleteDoc(postRef);
          
          // Firebase Storage에서 이미지 삭제
          try {
            const storageRef = ref(storage, `posts/${userId}/${docId}`);
            const result = await listAll(storageRef);
            
            // 모든 이미지 파일 삭제
            const deletePromises = result.items.map(item => deleteObject(item));
            await Promise.all(deletePromises);
            console.log('🖼️ Firebase Storage 이미지 삭제 완료');
          } catch (storageError) {
            console.log('⚠️ Storage 이미지 삭제 실패 (이미지가 없을 수 있음):', storageError);
          }
          
          console.log('✅ Firebase 게시글 삭제 완료');
        } else {
          // 로컬 게시글 삭제
          console.log('📱 로컬 게시글 삭제 중...');
          const updatedPosts = posts.filter(p => p.id !== post.id);
          setPosts(updatedPosts);
          localStorage.setItem('posts', JSON.stringify(updatedPosts));
          console.log('✅ 로컬 게시글 삭제 완료');
        }
        
        navigate('/');
      } catch (error) {
        console.error('❌ 게시글 삭제 실패:', error);
        alert('게시글 삭제에 실패했습니다. 다시 시도해주세요.');
      }
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      console.log('🔍 게시글 상세 정보 가져오기:', postId);
      
      try {
        // 1. 컬렉션 그룹 쿼리로 Firebase에서 게시글 찾기
        console.log('🔍 컬렉션 그룹 쿼리로 게시글 검색 중...');
        const userPostsRef = collectionGroup(db, 'userPosts');
        const userPostsSnapshot = await getDocs(userPostsRef);
        
        console.log(`📝 총 ${userPostsSnapshot.docs.length}개의 게시글 검색 중...`);
        
        for (const docSnapshot of userPostsSnapshot.docs) {
          const userId = docSnapshot.ref.path.split('/')[1]; // posts/{userId}/userPosts/{docId}
          const firebasePostId = `${userId}_${docSnapshot.id}`;
          console.log(`🔍 비교 중: Firebase ID "${firebasePostId}" vs 요청 ID "${postId}"`);
          
          if (firebasePostId === postId) {
            const data = docSnapshot.data();
            console.log('✅ Firebase에서 게시글 발견:', data.title);
            
            // 이미지 URL 가져오기
            let imageUrl: string | undefined = undefined;
            try {
              const storageRef = ref(storage, `posts/${userId}/${docSnapshot.id}`);
              const result = await listAll(storageRef);
              if (result.items.length > 0) {
                imageUrl = await getDownloadURL(result.items[0]);
              }
            } catch (error) {
              console.log('이미지 가져오기 실패:', error);
            }
            
            const firebasePost: Post = {
              id: firebasePostId,
              title: data.title || '제목 없음',
              school: '한양여자대학교',
              major: `${data.category || ''} ${data.type || ''}`.trim() || '기타',
              price: Number(data.price) || 0,
              marketPrice: Number(data.price) || 0,
              isLiked: false,
              image: imageUrl,
              userId: userId,
              authorId: data.authorId || undefined,
              desc: data.description || '',
              isFirebasePost: true,
              status: data.status || undefined,
            };
            
            setPost(firebasePost);
            // 최근 본 게시글 기록 (로그인 + Firebase 게시글)
            try {
              if (currentUser) {
                const likeKey = `${userId}_${docSnapshot.id}`; // sellerId_docId
                const viewedRef = doc(db, 'users', currentUser.uid, 'viewed', likeKey);
                await setDoc(viewedRef, {
                  postId: docSnapshot.id,
                  sellerId: userId,
                  postTitle: data.title || '제목 없음',
                  postPrice: Number(data.price) || 0,
                  postCategory: `${data.category || ''} ${data.type || ''}`.trim() || '기타',
                  viewedAt: serverTimestamp(),
                }, { merge: true });
              }
            } catch (err) {
              console.log('최근 본 게시글 기록 실패(무시 가능):', err);
            }
            // 사용자 표시 이름 설정
            const myDisplayId = (currentUser?.displayName) || (currentUser?.email ? currentUser.email.split('@')[0] : undefined);
            if (userId === myUid) {
              setUserDisplayName(myDisplayId || 'anonymous');
            } else if (data.authorId && typeof data.authorId === 'string') {
              setUserDisplayName(data.authorId);
            } else {
              try {
                const userRef = doc(db, 'users', userId);
                const userSnap = await getDoc(userRef);
                const display = userSnap.exists() ? (userSnap.data() as any).userId : userId;
                setUserDisplayName(display);
              } catch {
                setUserDisplayName(userId);
              }
            }
            return;
          }
        }
        
        // 2. Firebase에서 못 찾으면 샘플 데이터에서 찾기
        console.log('⚠️ Firebase에서 게시글을 찾지 못함, 샘플 데이터 확인 중...');
        
        // 샘플 데이터 (다른 사용자들이 올린 게시글처럼 처리)
        const samplePosts: Post[] = [
          {
            id: 1,
            title: "MacBook Pro 13인치",
            school: "한양여자대학교",
            major: "전자제품 노트북",
            price: 1200000,
            marketPrice: 1500000,
            isLiked: false,
            image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=500",
            userId: "sample_user_1", // 다른 사용자로 변경
            desc: "2023년 모델, 거의 새것입니다. 박스와 충전기 포함.",
          },
          {
            id: 2,
            title: "아이폰 14 Pro",
            school: "한양여자대학교", 
            major: "전자제품 스마트폰",
            price: 800000,
            marketPrice: 1000000,
            isLiked: false,
            image: "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=500",
            userId: "sample_user_2", // 다른 사용자로 변경
            desc: "256GB, 딥퍼플 색상. 케이스와 액세서리 포함.",
          },
          {
            id: 3,
            title: "나이키 에어포스 1",
            school: "한양여자대학교",
            major: "패션 신발",
            price: 80000,
            marketPrice: 120000,
            isLiked: false,
            image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500",
            userId: "sample_user_3", // 다른 사용자로 변경
            desc: "화이트 컬러, 사이즈 250. 한 번만 신었습니다.",
          },
          {
            id: 4,
            title: "무지 후드티",
            school: "한양여자대학교",
            major: "패션 상의",
            price: 15000,
            marketPrice: 25000,
            isLiked: false,
            image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=500",
            userId: "sample_user_4", // 다른 사용자로 변경
            desc: "블랙 컬러, M 사이즈. 깨끗한 상태입니다.",
          },
          {
            id: 5,
            title: "스타벅스 텀블러",
            school: "한양여자대학교",
            major: "생활용품 기타",
            price: 20000,
            marketPrice: 30000,
            isLiked: false,
            image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=500",
            userId: "sample_user_5", // 다른 사용자로 변경
            desc: "500ml 용량, 보온/보냉 가능. 사용감 거의 없음.",
          }
        ];
        
        // 숫자 ID로 샘플 데이터에서 찾기
        const foundSamplePost = samplePosts.find((p: Post) => p.id === Number(postId));
        if (foundSamplePost) {
          console.log('✅ 샘플 데이터에서 게시글 발견:', foundSamplePost.title);
          console.log('📝 샘플 게시글 userId:', foundSamplePost.userId);
          setPost(foundSamplePost);
          // 샘플 데이터 사용자 표시 이름 설정
          setUserDisplayName(foundSamplePost.userId);
          return;
        }
        
        // localStorage에서도 찾기 (혹시 있을 경우)
        const savedPosts = localStorage.getItem('posts');
        const postsData = savedPosts ? JSON.parse(savedPosts) : [];
        setPosts(postsData);
        const foundPost = postsData.find((p: Post) => p.id === Number(postId));
        if (foundPost) {
          console.log('✅ localStorage에서 게시글 발견:', foundPost.title);
          setPost(foundPost);
          // localStorage 사용자 표시 이름 설정
          if (foundPost.userId === myUid) {
            const myDisplayId = (currentUser?.displayName) || (currentUser?.email ? currentUser.email.split('@')[0] : undefined);
            setUserDisplayName(myDisplayId || 'anonymous');
          } else {
            try {
              const userRef = doc(db, 'users', foundPost.userId);
              const userSnap = await getDoc(userRef);
              const display = userSnap.exists() ? (userSnap.data() as any).userId : foundPost.userId;
              setUserDisplayName(display);
            } catch {
              setUserDisplayName(foundPost.userId);
            }
          }
          return;
        }
        
        console.log('❌ 게시글을 찾을 수 없습니다:', postId);
        
      } catch (error) {
        console.error('게시글 가져오기 오류:', error);
      }
    };
    
    if (postId) {
      fetchPost();
    }
  }, [postId]);

  // 작성자 프로필 이미지 로딩
  useEffect(() => {
    const loadProfile = async () => {
      const sellerId = post?.userId;
      if (!sellerId) {
        setProfileUrl(undefined);
        return;
      }
      try {
        // 내 게시물일 경우 Auth photoURL 우선 사용
        if (sellerId === (currentUser?.uid || '')) {
          if (currentUser?.photoURL) {
            setProfileUrl(currentUser.photoURL);
            return;
          }
        }
        const userRef = doc(db, 'users', sellerId);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
          const data = snap.data() as any;
          if (data.photoUrl) {
            setProfileUrl(data.photoUrl);
            return;
          }
        }
        setProfileUrl(undefined);
      } catch {
        setProfileUrl(undefined);
      }
    };
    loadProfile();
  }, [post?.userId, currentUser]);

  const [isLiked, setIsLiked] = useState(false);

  // 찜 여부 초기 로드 (Firebase 게시글만)
  useEffect(() => {
    const loadLikeState = async () => {
      if (!post || !(post as any).isFirebasePost || !currentUser) return;
      try {
        const [sellerId, docId] = post.id.toString().split('_');
        const likeRef = doc(db, 'users', currentUser.uid, 'likes', `${sellerId}_${docId}`);
        const snap = await getDoc(likeRef);
        setIsLiked(snap.exists());
      } catch (e) {
        console.error('찜 상태 조회 실패:', e);
      }
    };
    loadLikeState();
  }, [post, currentUser]);

  const handleToggleLike = async () => {
    if (!post) return;
    // Firebase 게시글: Firestore likes 토글
    if ((post as any).isFirebasePost) {
      if (!currentUser) {
        alert('로그인이 필요합니다.');
        return;
      }
      try {
        const [sellerId, docId] = post.id.toString().split('_');
        const likeRef = doc(db, 'users', currentUser.uid, 'likes', `${sellerId}_${docId}`);
        if (isLiked) {
          await deleteDoc(likeRef);
          setIsLiked(false);
        } else {
          const firstImage = (post as any).image || undefined;
          await setDoc(likeRef, {
            postId: docId,
            sellerId,
            postTitle: post.title,
            postPrice: post.price,
            postCategory: post.major,
            postImage: firstImage,
            createdAt: serverTimestamp(),
          });
          setIsLiked(true);
        }
      } catch (e) {
        console.error('찜 토글 실패:', e);
        alert('찜 처리에 실패했습니다. 다시 시도해주세요.');
      }
      return;
    }

    // 로컬/샘플 게시글: 기존 로컬 토글 유지
    const updatedPosts = posts.map(p =>
      p.id === post.id ? { ...p, isLiked: !(p as any).isLiked } : p
    );
    setPosts(updatedPosts);
    setPost({ ...post, isLiked: !(post as any).isLiked } as any);
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
  // Firebase Storage URL(https://...)과 base64(data:image...) 모두 허용
  const validImages = images.filter(src => typeof src === 'string' && (src.startsWith('data:image') || src.startsWith('http')));

  // 계열/종류 분리
  const [category, type] = post.major.split(' ');

  // 거래완료 표시 여부
  const isCompleted = (post as any).status === 'completed';

  // 게시글이 없을 때 처리
  if (!post) {
    return (
      <Container maxWidth="xs" sx={{ bgcolor: '#fafafa', minHeight: '100vh', pt: 0, pb: 0 }}>
        <Box display="flex" alignItems="center" px={1.5} pt={2} pb={1}>
          <IconButton onClick={() => navigate('/')}> <ArrowBackIcon /> </IconButton>
          <Box flex={1} />
        </Box>
        <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="50vh">
          <Typography variant="h6" color="text.secondary" mb={2}>
            게시글을 찾을 수 없습니다
          </Typography>
          <Button variant="contained" onClick={() => navigate('/')}>
            홈으로 돌아가기
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xs" sx={{ bgcolor: '#fafafa', minHeight: '100vh', pt: 0, pb: 0 }}>
      {/* 헤더 */}
      <Box display="flex" alignItems="center" px={1.5} pt={2} pb={1}>
        <IconButton onClick={() => navigate('/')}> <ArrowBackIcon /> </IconButton>
        <Box flex={1} />
        {(post.userId === myUid || post.userId === 'me') && (
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
          <Avatar src={profileUrl} sx={{ width: 36, height: 36, bgcolor: '#eee', mr: 1 }}>{!profileUrl && '🐾'}</Avatar>
          <Typography fontWeight="bold" fontSize={16}>
            {userDisplayName || '사용자'}
          </Typography>
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
          {post.userId !== myUid && (
            <IconButton size="small" onClick={handleToggleLike}>
              {isLiked || (post as any).isLiked ? (
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
          <Typography fontWeight="bold" fontSize={22}>{typeof post.price === 'number' ? post.price.toLocaleString() + '원' : '가격 없음'}</Typography>
        </Box>
        {/* 상세 설명 */}
        <Divider sx={{ my: 2 }} />
        <Typography fontWeight="bold" fontSize={16} mb={1}>상세 설명</Typography>
        <Typography fontSize={15} mb={2} sx={{ whiteSpace: 'pre-line' }}>{post.desc || '설명 없음'}</Typography>
        {/* 채팅하기 버튼 - 본인 게시물이 아니고, 거래완료가 아닌 경우에만 표시 */}
        {post.userId !== myUid && !isCompleted && (
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
            onClick={async () => {
              try {
                // 채팅방 생성 또는 기존 채팅방 찾기
                const roomId = await createChatRoom(post.id.toString(), post.userId, myUid);
                navigate(`/chat/${roomId}?postId=${post.id}&sellerId=${post.userId}`);
              } catch (error) {
                console.error('채팅방 생성 실패:', error);
                alert('채팅방 생성에 실패했습니다. 다시 시도해주세요.');
              }
            }}
          >
            채팅하기
          </Button>
        )}
        {/* 거래완료 배지 */}
        {isCompleted && (
          <Box sx={{ mt: 1, mb: 2, p: 1, borderRadius: 2, bgcolor: '#f5f5f5', textAlign: 'center', fontWeight: 'bold', color: '#888' }}>
            거래완료된 게시물입니다
          </Box>
        )}
      </Box>
    </Container>
  );
};

export default PostDetail; 