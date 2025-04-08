import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
}

const Modal = ({ children, isOpen, onClose }: ModalProps) => {
  const modalRoot = useRef<Element | null>(null);

  useEffect(() => {
    modalRoot.current = document.getElementById('modal-root');
  }, []);

  if (!isOpen || !modalRoot.current) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999]">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      <div className="relative z-50 flex items-center justify-center min-h-screen">
        {children}
      </div>
    </div>,
    modalRoot.current
  );
};

export default Modal;