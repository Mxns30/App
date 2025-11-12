import React from 'react';
import { Dialog, DialogActions, Button } from '@mui/material';

interface EditDeleteActionSheetProps {
  open: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

const EditDeleteActionSheet: React.FC<EditDeleteActionSheetProps> = ({ open, onEdit, onDelete, onClose }) => (
  <Dialog open={open} onClose={onClose} fullWidth PaperProps={{ sx: { position: 'fixed', bottom: 0, m: 0, borderRadius: '16px 16px 0 0', boxShadow: 3, p: 0, width: '100%', maxWidth: 400, zIndex: 1301 } }}>
    <DialogActions sx={{ flexDirection: 'column', p: 0 }}>
      <Button fullWidth onClick={onEdit} sx={{ color: '#1976d2', fontWeight: 'bold', fontSize: 18, py: 2, borderBottom: '1px solid #eee' }}>
        게시글 수정
      </Button>
      <Button fullWidth onClick={onDelete} sx={{ color: '#d32f2f', fontWeight: 'bold', fontSize: 18, py: 2, borderBottom: '1px solid #eee' }}>
        삭제
      </Button>
      <Button fullWidth onClick={onClose} sx={{ color: '#888', fontWeight: 'bold', fontSize: 18, py: 2 }}>
        취소
      </Button>
    </DialogActions>
  </Dialog>
);

export default EditDeleteActionSheet; 