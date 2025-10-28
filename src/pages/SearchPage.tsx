import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Container, TextField, IconButton, Card, CardContent, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import BottomNav from '../components/BottomNav';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../config/firebase';
import { useSchool } from '../contexts/SchoolContext';

const categories = ['공학', '교육', '사회', '예체능', '의약', '인문', '자연'];

export default function SearchPage() {
  const navigate = useNavigate();
  const { currentSchool } = useSchool();
  const [searchTerm, setSearchTerm] = useState('');
  // 상단 학교 선택 UI 제거, 필터는 currentSchool 사용
  const [firebasePosts, setFirebasePosts] = useState<any[]>([]);
  const [localPosts, setLocalPosts] = useState<any[]>([]);

  // Firebase에서 게시글 로드 (HomePage와 동일한 로직을 간략화하여 사용)
  useEffect(() => {
    const fetchFirebasePosts = async () => {
      try {
        const all: any[] = [];
        const userPostsRef = collectionGroup(db, 'userPosts');
        const snap = await getDocs(userPostsRef);
        for (const docSnap of snap.docs) {
          const data: any = docSnap.data();
          const userId = docSnap.ref.path.split('/')[1]; // posts/{userId}/userPosts/{docId}
          let imageUrl: string | undefined;
          try {
            const storageRef = ref(storage, `posts/${userId}/${docSnap.id}`);
            const res = await listAll(storageRef);
            if (res.items.length > 0) {
              imageUrl = await getDownloadURL(res.items[0]);
            }
          } catch (_) {
            // ignore image errors
          }
          const schoolFromDoc = (data as any).school || null;
          all.push({
            id: `${userId}_${docSnap.id}`,
            title: data.title || '제목 없음',
            school: schoolFromDoc || null,
            major: `${data.category || ''} ${data.type || ''}`.trim() || '기타',
            price: Number(data.price) || 0,
            image: imageUrl,
            userId,
            desc: data.description || '',
            createdAt: data.createdAt || new Date().toISOString(),
            isFirebasePost: true,
            status: data.status || undefined,
          });
        }
        const filtered = currentSchool ? all.filter(p => p.school === currentSchool) : all;
        setFirebasePosts(filtered);
      } catch (e) {
        console.error('검색용 Firebase 게시글 로드 실패', e);
      }
    };
    fetchFirebasePosts();
  }, [currentSchool]);

  // localStorage에 저장된 게시글도 포함 (있다면)
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('posts') || '[]');
      const arr = Array.isArray(saved) ? saved : [];
      const filtered = currentSchool ? arr.filter((p: any) => p && p.school === currentSchool) : arr;
      setLocalPosts(filtered);
    } catch {
      setLocalPosts([]);
    }
  }, [currentSchool]);

  const allPosts = useMemo(() => {
    // Firebase 먼저, 그다음 로컬
    const combined = [...firebasePosts, ...localPosts];
    return combined;
  }, [firebasePosts, localPosts]);

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return allPosts.filter((post: any) => {
      const inSchool = currentSchool ? post.school === currentSchool : true;
      const title = (post.title || '').toLowerCase();
      const desc = (post.desc || '').toLowerCase();
      const matches = term.length === 0 ? true : (title.includes(term) || desc.includes(term));
      return inSchool && matches;
    });
  }, [allPosts, currentSchool, searchTerm]);

  return (
    <Container maxWidth="xs" sx={{ bgcolor: '#fafafa', minHeight: '100vh', pt: 0, pb: 8, position: 'relative' }}>
      <Box display="flex" alignItems="center" pt={3} pb={2} gap={1}>
      </Box>
      {/* 검색창 */}
      <Box display="flex" alignItems="center" gap={1} mb={2}>
        <TextField
          size="small"
          placeholder="검색어를 입력하세요"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          sx={{ flex: 1, borderRadius: 999, bgcolor: '#fff', border: '1px solid #e0e0e0', '& .MuiOutlinedInput-root': { borderRadius: 999, bgcolor: '#fff', px: 2, py: 0.5 } }}
          InputProps={{ style: { borderRadius: 999, background: '#fff' } }}
        />
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
        >
          <SearchIcon />
        </IconButton>
      </Box>
      {/* 결과 리스트 */}
      <Box>
        {filtered.length === 0 && (
          <Typography color="text.secondary" align="center" mt={4}>검색 결과가 없습니다.</Typography>
        )}
        {filtered.map((post: any) => (
          <Card key={post.id} sx={{ display: 'flex', mb: 2, boxShadow: 0, cursor: 'pointer' }} onClick={() => navigate(`/post/${post.id}`)}>
            {post.image ? (
              <Box sx={{ width: 64, height: 64, borderRadius: 2, m: 1, overflow: 'hidden', bgcolor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src={post.image} alt={post.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </Box>
            ) : (
              <Box sx={{ width: 64, height: 64, bgcolor: '#e0e0e0', borderRadius: 2, m: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageOutlinedIcon sx={{ color: '#ccc', fontSize: 32 }} />
              </Box>
            )}
            <CardContent sx={{ flex: 1, p: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography fontWeight="bold" fontSize={16}>{post.title}</Typography>
                {post.status === 'completed' && (
                  <Box sx={{ bgcolor: '#E0F2F1', color: '#00796B', fontWeight: 'bold', fontSize: 11, px: 0.8, py: 0.2, borderRadius: 1, lineHeight: 1 }}>
                    거래완료
                  </Box>
                )}
              </Box>
              <Typography variant="body2" color="text.secondary">
                {post.school} | {post.major}
              </Typography>
              <Typography fontWeight="bold" fontSize={16}>{post.price?.toLocaleString()}원</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
      
      <BottomNav />
    </Container>
  );
} 