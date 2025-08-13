import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage, auth } from '../config/firebase';
import { useNavigate } from 'react-router-dom';

interface PostFormData {
  title: string;
  category: string;
  description: string;
  price: string;
}

const categories = [
  '전자기기',
  '의류',
  '가구',
  '도서',
  '기타',
];

const PostCreate: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<PostFormData>({
    title: '',
    category: '',
    description: '',
    price: '',
  });
  const [images, setImages] = useState<File[]>([]);
  const [errors, setErrors] = useState<Partial<PostFormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>('');

  useEffect(() => {
    // Check if user is authenticated
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        navigate('/login'); // Redirect to login page if not authenticated
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const validateForm = (): boolean => {
    const newErrors: Partial<PostFormData> = {};
    let isValid = true;

    if (!formData.title.trim()) {
      newErrors.title = '제목을 입력해주세요';
      isValid = false;
    }
    if (!formData.category) {
      newErrors.category = '카테고리를 선택해주세요';
      isValid = false;
    }
    if (!formData.description.trim()) {
      newErrors.description = '설명을 입력해주세요';
      isValid = false;
    }
    if (!formData.price.trim()) {
      newErrors.price = '가격을 입력해주세요';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleCategoryChange = (e: SelectChangeEvent<string>) => {
    setFormData(prev => ({
      ...prev,
      category: e.target.value,
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length > 100) {
      alert('이미지는 최대 100장까지만 업로드할 수 있습니다.');
      return;
    }

    setImages(files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setSubmitError('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError('');

    try {
      // Create post document in Firestore with user ID
      const userPostsRef = collection(db, 'posts', user.uid, 'userPosts');
      const postRef = await addDoc(userPostsRef, {
        title: formData.title,
        category: formData.category,
        description: formData.description,
        price: formData.price,
        createdAt: new Date().toISOString(),
        userId: user.uid,
      });

      // Upload images to Firebase Storage
      const uploadPromises = images.map(async (image) => {
        const storageRef = ref(storage, `posts/${user.uid}/${postRef.id}/${image.name}`);
        await uploadBytes(storageRef, image);
        return getDownloadURL(storageRef);
      });

      await Promise.all(uploadPromises);
      
      // Reset form
      setFormData({
        title: '',
        category: '',
        description: '',
        price: '',
      });
      setImages([]);
      alert('게시글이 성공적으로 등록되었습니다.');
      navigate('/'); // Redirect to home page after successful post
    } catch (error) {
      setSubmitError('게시글 등록 중 오류가 발생했습니다.');
      console.error('Error creating post:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        게시글 작성
      </Typography>

      {submitError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {submitError}
        </Alert>
      )}

      <TextField
        fullWidth
        label="제목"
        name="title"
        value={formData.title}
        onChange={handleInputChange}
        error={!!errors.title}
        helperText={errors.title}
        margin="normal"
      />

      <FormControl fullWidth margin="normal" error={!!errors.category}>
        <InputLabel>카테고리</InputLabel>
        <Select
          name="category"
          value={formData.category}
          onChange={handleCategoryChange}
          label="카테고리"
        >
          {categories.map((category) => (
            <MenuItem key={category} value={category}>
              {category}
            </MenuItem>
          ))}
        </Select>
        {errors.category && (
          <Typography color="error" variant="caption">
            {errors.category}
          </Typography>
        )}
      </FormControl>

      <TextField
        fullWidth
        label="설명"
        name="description"
        value={formData.description}
        onChange={handleInputChange}
        error={!!errors.description}
        helperText={errors.description}
        margin="normal"
        multiline
        rows={4}
      />

      <TextField
        fullWidth
        label="가격"
        name="price"
        value={formData.price}
        onChange={handleInputChange}
        error={!!errors.price}
        helperText={errors.price}
        margin="normal"
        type="number"
      />

      <Box sx={{ mt: 2, mb: 2 }}>
        <input
          accept="image/*"
          style={{ display: 'none' }}
          id="image-upload"
          type="file"
          multiple
          onChange={handleImageChange}
        />
        <label htmlFor="image-upload">
          <Button variant="outlined" component="span">
            이미지 업로드 ({images.length}/100)
          </Button>
        </label>
        {images.length > 0 && (
          <Typography variant="body2" sx={{ mt: 1 }}>
            {images.length}개의 이미지가 선택되었습니다.
          </Typography>
        )}
      </Box>

      <Button
        type="submit"
        variant="contained"
        color="primary"
        fullWidth
        disabled={isSubmitting}
        sx={{ mt: 2 }}
      >
        {isSubmitting ? <CircularProgress size={24} /> : '게시글 등록'}
      </Button>
    </Box>
  );
};

export default PostCreate; 