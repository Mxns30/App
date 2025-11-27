import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Typography,
} from '@mui/material';
import BuildOutlinedIcon from '@mui/icons-material/BuildOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LocalLibraryOutlinedIcon from '@mui/icons-material/LocalLibraryOutlined';
import MedicalServicesOutlinedIcon from '@mui/icons-material/MedicalServicesOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import ParkOutlinedIcon from '@mui/icons-material/ParkOutlined';
import BrushOutlinedIcon from '@mui/icons-material/BrushOutlined';
import CheckroomOutlinedIcon from '@mui/icons-material/CheckroomOutlined';
import BookOutlinedIcon from '@mui/icons-material/BookOutlined';
import PrecisionManufacturingOutlinedIcon from '@mui/icons-material/PrecisionManufacturingOutlined';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { ref, listAll, getDownloadURL } from 'firebase/storage';
import BottomNav from '../components/BottomNav';
import { db, storage } from '../config/firebase';
import { useSchool } from '../contexts/SchoolContext';

type PostItem = {
  id: string;
  title: string;
  school: string | null;
  price: number;
  image?: string;
  userId: string;
  desc: string;
  createdAt?: string;
  status?: string;
  category: string;
  type: string;
};

const SERIES = ['공학', '교육', '사회', '예체능', '의약', '인문', '자연'];
const TYPES = ['과잠/학잠', '전공책', '기자재'];
const SERIES_ICONS: Record<string, React.ReactNode> = {
  공학: <BuildOutlinedIcon fontSize="small" />,
  교육: <MenuBookOutlinedIcon fontSize="small" />,
  사회: <GroupsOutlinedIcon fontSize="small" />,
  예체능: <BrushOutlinedIcon fontSize="small" />,
  의약: <MedicalServicesOutlinedIcon fontSize="small" />,
  인문: <LocalLibraryOutlinedIcon fontSize="small" />,
  자연: <ParkOutlinedIcon fontSize="small" />,
};

const TYPE_ICONS: Record<string, React.ReactNode> = {
  '과잠/학잠': <CheckroomOutlinedIcon fontSize="small" />,
  전공책: <BookOutlinedIcon fontSize="small" />,
  기자재: <PrecisionManufacturingOutlinedIcon fontSize="small" />,
};

const CategoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { currentSchool } = useSchool();
  const [selectedSeries, setSelectedSeries] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [firebasePosts, setFirebasePosts] = useState<PostItem[]>([]);
  const [localPosts, setLocalPosts] = useState<PostItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchFirebasePosts = async () => {
      try {
        setIsLoading(true);
        const result: PostItem[] = [];
        const snapshot = await getDocs(collectionGroup(db, 'userPosts'));
        for (const docSnap of snapshot.docs) {
          const data = docSnap.data() as any;
          const userId = docSnap.ref.path.split('/')[1];
          const series = data.category || '';
          const type = data.type || '';
          let imageUrl: string | undefined;
          try {
            const storageRef = ref(storage, `posts/${userId}/${docSnap.id}`);
            const res = await listAll(storageRef);
            if (res.items.length > 0) {
              imageUrl = await getDownloadURL(res.items[0]);
            }
          } catch (_) {
            // ignore
          }
          const schoolFromDoc = data.school || null;
          if (currentSchool && schoolFromDoc && schoolFromDoc !== currentSchool) {
            continue;
          }
          result.push({
            id: `${userId}_${docSnap.id}`,
            title: data.title || '제목 없음',
            school: schoolFromDoc,
            price: Number(data.price) || 0,
            image: imageUrl,
            userId,
            desc: data.description || '',
            createdAt: data.createdAt || new Date().toISOString(),
            status: data.status || undefined,
            category: series,
            type,
          });
        }
        setFirebasePosts(result);
      } catch (error) {
        console.error('카테고리용 Firebase 게시글 로드 실패', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFirebasePosts();
  }, [currentSchool]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem('posts') || '[]');
      const arr = Array.isArray(saved) ? saved : [];
      const normalized = arr
        .filter((post: any) => (currentSchool ? post?.school === currentSchool : true))
        .map((post: any) => {
          const major = typeof post?.major === 'string' ? post.major.split(' ') : [];
          return {
            id: String(post.id ?? ''),
            title: post.title ?? '제목 없음',
            school: post.school ?? null,
            price: Number(post.price) || 0,
            image: post.image,
            userId: post.userId ?? '',
            desc: post.desc ?? '',
            createdAt: post.createdAt ?? new Date().toISOString(),
            status: post.status,
            category: post.category ?? major[0] ?? '',
            type: post.type ?? major[1] ?? '',
          } as PostItem;
        });
      setLocalPosts(normalized);
    } catch (_) {
      setLocalPosts([]);
    }
  }, [currentSchool]);

  const allPosts = useMemo(() => [...firebasePosts, ...localPosts], [firebasePosts, localPosts]);

  const filteredPosts = useMemo(() => {
    return allPosts.filter((post) => {
      if (selectedSeries && post.category !== selectedSeries) {
        return false;
      }
      if (selectedType && post.type !== selectedType) {
        return false;
      }
      return true;
    });
  }, [allPosts, selectedSeries, selectedType]);

  const handleSeriesClick = (series: string) => {
    if (selectedSeries === series) {
      setSelectedSeries('');
      setSelectedType('');
    } else {
      setSelectedSeries(series);
      setSelectedType('');
    }
  };

  const handleTypeClick = (type: string) => {
    setSelectedType((prev) => (prev === type ? '' : type));
  };

  return (
    <Container
      maxWidth="xs"
      sx={{ bgcolor: '#fafafa', minHeight: '100vh', pt: 4, pb: 8, position: 'relative' }}
    >
      <Box sx={{ display: 'flex', gap: 2, height: '100%', pb: 2 }}>
        <Box
          sx={{
            flex: '0 0 92px',
            display: 'flex',
            flexDirection: 'column',
            gap: 1,
            bgcolor: '#fff',
            borderRadius: 3,
            border: '1px solid #ecf2ef',
            p: 1,
            height: 'fit-content',
          }}
        >
          {SERIES.map((series) => {
            const isActive = selectedSeries === series;
            return (
              <Button
                key={series}
                onClick={() => handleSeriesClick(series)}
                sx={{
                  justifyContent: 'flex-start',
                  textAlign: 'left',
                  borderRadius: 2,
                  py: 1,
                  px: 1,
                  color: isActive ? '#1abc9c' : '#555',
                  bgcolor: isActive ? '#e9fbf5' : 'transparent',
                  fontWeight: isActive ? 700 : 500,
                  minWidth: 'unset',
                  fontSize: 14,
                }}
              >
                <Box
                  component="span"
                  sx={{
                    mr: 1,
                    display: 'flex',
                    alignItems: 'center',
                    color: isActive ? '#1abc9c' : '#94a49c',
                  }}
                >
                  {SERIES_ICONS[series] || <FolderOpenIcon fontSize="small" />}
                </Box>
                {series}
              </Button>
            );
          })}
        </Box>

        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <FolderOpenIcon sx={{ color: '#1abc9c' }} />
            <Typography fontWeight="bold" fontSize={18}>
              카테고리
            </Typography>
          </Box>

          {!selectedSeries && (
            <Box
              sx={{
                flex: 1,
                borderRadius: 3,
                border: '1px dashed #d5e2dc',
                bgcolor: '#f7fbf9',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                p: 4,
              }}
            >
              <Typography fontWeight="bold" color="#1a543f" mb={0.5}>
                계열을 선택해주세요
              </Typography>
              <Typography variant="body2" color="text.secondary">
                왼쪽 목록에서 관심 있는 분야를 선택하면
                <br />
                관련 종류가 이곳에 표시됩니다.
              </Typography>
            </Box>
          )}

          {selectedSeries && (
            <Box>
              <Typography fontWeight="bold" fontSize={16} mb={1}>
                {selectedSeries}
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 1.5,
                }}
              >
                {TYPES.map((type) => {
                  const isActive = selectedType === type;
                  return (
                    <Card
                      key={type}
                      onClick={() => handleTypeClick(type)}
                      sx={{
                        cursor: 'pointer',
                        borderRadius: 3,
                        boxShadow: 0,
                        border: isActive ? '2px solid #1abc9c' : '1px solid #ecf2ef',
                        bgcolor: isActive ? '#f0fff7' : '#fff',
                      }}
                    >
                      <CardContent
                        sx={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 1,
                          py: 2,
                        }}
                      >
                        <Avatar
                          sx={{
                            bgcolor: '#fff',
                            color: '#1abc9c',
                            border: '1px solid #e1eee8',
                            width: 44,
                            height: 44,
                          }}
                        >
                          {TYPE_ICONS[type] || <FolderOpenIcon fontSize="small" />}
                        </Avatar>
                        <Typography fontWeight={600} fontSize={14}>
                          {type}
                        </Typography>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          )}

          <Box>
            {isLoading && (
              <Typography color="text.secondary" align="center" mt={4}>
                잠시만 기다려주세요.
              </Typography>
            )}

            {!isLoading && selectedSeries && filteredPosts.length === 0 && (
              <Typography color="text.secondary" align="center" mt={4}>
                선택한 조건에 해당하는 게시물이 없습니다.
              </Typography>
            )}

            {filteredPosts.map((post) => (
              <Card
                key={post.id}
                sx={{
                  display: 'flex',
                  mb: 2,
                  boxShadow: 0,
                  cursor: 'pointer',
                  border: '1px solid #eef3f0',
                  borderRadius: 3,
                }}
                onClick={() => navigate(`/post/${post.id}`, { state: { from: '/category' } })}
              >
                {post.image ? (
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      borderRadius: 2,
                      m: 1,
                      overflow: 'hidden',
                      bgcolor: '#e0e0e0',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <img
                      src={post.image}
                      alt={post.title}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      width: 64,
                      height: 64,
                      bgcolor: '#e0e0e0',
                      borderRadius: 2,
                      m: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ImageOutlinedIcon sx={{ color: '#ccc', fontSize: 32 }} />
                  </Box>
                )}
                <CardContent sx={{ flex: 1, p: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography fontWeight="bold" fontSize={16}>
                      {post.title}
                    </Typography>
                    {post.status === 'completed' && (
                      <Box
                        sx={{
                          bgcolor: '#E0F2F1',
                          color: '#00796B',
                          fontWeight: 'bold',
                          fontSize: 11,
                          px: 0.8,
                          py: 0.2,
                          borderRadius: 1,
                          lineHeight: 1,
                        }}
                      >
                        거래완료
                      </Box>
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {(post.school || '학교 미지정') +
                      (post.category ? ` | ${post.category}` : '') +
                      (post.type ? ` | ${post.type}` : '')}
                  </Typography>
                  <Typography fontWeight="bold" fontSize={16}>
                    {post.price.toLocaleString()}원
                  </Typography>
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      </Box>

      <BottomNav />
    </Container>
  );
};

export default CategoryPage;

