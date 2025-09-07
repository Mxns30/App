import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';

interface PostCardProps {
  id: string;
  userId: string;
  title: string;
  price: string;
  category: string;
  imageUrl: string;
  createdAt: string;
}

const PostCard: React.FC<PostCardProps> = ({
  id,
  userId,
  title,
  price,
  category,
  imageUrl,
  createdAt,
}) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/post/${userId}/${id}`);
  };

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        '&:hover': {
          transform: 'scale(1.02)',
          transition: 'transform 0.2s ease-in-out',
        },
      }}
      onClick={handleClick}
    >
      {imageUrl ? (
        <CardMedia
          component="img"
          height="200"
          image={imageUrl}
          alt={title}
          sx={{ objectFit: 'cover' }}
        />
      ) : (
        <Box sx={{ height: 200, bgcolor: '#e0e0e0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ImageOutlinedIcon sx={{ color: '#ccc', fontSize: 48 }} />
        </Box>
      )}
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography gutterBottom variant="h6" component="h2" noWrap>
          {title}
        </Typography>
        <Typography variant="body2" color="text.secondary" noWrap>
          {category}
        </Typography>
        <Typography variant="h6" color="primary" sx={{ mt: 1 }}>
          {Number(price).toLocaleString()}원
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {new Date(createdAt).toLocaleDateString()}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default PostCard; 