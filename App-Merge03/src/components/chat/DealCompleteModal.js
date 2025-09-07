import React from 'react';

const DealCompleteModal = ({ onClose, onDealComplete }) => {
  const handleYesClick = () => {
    if (onDealComplete) {
      onDealComplete();
    }
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '10px',
          width: '80%',
          maxWidth: '300px'
        }}
      >
        <h2 style={{
          textAlign: 'center',
          marginBottom: '20px'
        }}>
          거래를 완료하시겠습니까?
        </h2>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: '10px'
        }}>
          <button
            onClick={handleYesClick}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '5px',
              backgroundColor: '#E6FAEC',
              cursor: 'pointer'
            }}
          >
            Yes
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px',
              border: 'none',
              borderRadius: '5px',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer'
            }}
          >
            No
          </button>
        </div>
      </div>
    </div>
  );
};

export default DealCompleteModal;
