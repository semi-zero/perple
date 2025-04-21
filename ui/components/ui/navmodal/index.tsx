"use client";
import React, { useRef, useEffect } from "react";
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  children: React.ReactNode;
  showCloseButton?: boolean; // New prop to control close button visibility
  isFullscreen?: boolean; // Default to false for backwards compatibility
}

const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    children,
    className,
    showCloseButton = true,
    isFullscreen = false,
  }) => {
    const modalRef = useRef<HTMLDivElement>(null);
    const [mounted, setMounted] = React.useState(false); // ✅ mount 여부
    const modalRoot = typeof window !== "undefined" ? document.getElementById("modal-root") : null;
  
    useEffect(() => {
      setMounted(true);
      return () => setMounted(false);
    }, []);
  
    useEffect(() => {
      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          onClose();
        }
      };
  
      if (isOpen) {
        document.addEventListener("keydown", handleEscape);
      }
  
      return () => {
        document.removeEventListener("keydown", handleEscape);
      };
    }, [isOpen, onClose]);
  
    useEffect(() => {
      document.body.style.overflow = isOpen ? "hidden" : "unset";
      return () => {
        document.body.style.overflow = "unset";
      };
    }, [isOpen]);
  
    if (!mounted || !isOpen || !modalRoot) return null;
  
    const contentClasses = isFullscreen
      ? "w-full h-full"
      : "relative w-full max-w-[540px] rounded-3xl bg-white dark:bg-gray-900";
  
    const handleModalClick = (e: React.MouseEvent) => {
      e.stopPropagation();
    };
  
    return createPortal(
      <div className="fixed inset-0 z-[9999]">
        <div
          className="absolute inset-0 bg-black bg-opacity-50"
          onClick={onClose}
        />
        <div className="relative z-50 flex items-center justify-center min-h-screen">
          <div
            className={`${contentClasses} z-[999] ${className}`}
            ref={modalRef}
            onClick={handleModalClick}
          >
            {showCloseButton && (
              <button
                onClick={onClose}
                className="absolute right-3 top-3 z-[1000] flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-white sm:right-4 sm:top-4 sm:h-10 sm:w-10"
              >
                <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                >
                <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M6.04289 16.5413C5.65237 16.9318 5.65237 17.565 6.04289 17.9555C6.43342 18.346 7.06658 18.346 7.45711 17.9555L11.9987 13.4139L16.5408 17.956C16.9313 18.3466 17.5645 18.3466 17.955 17.956C18.3455 17.5655 18.3455 16.9323 17.955 16.5418L13.4129 11.9997L17.955 7.4576C18.3455 7.06707 18.3455 6.43391 17.955 6.04338C17.5645 5.65286 16.9313 5.65286 16.5408 6.04338L11.9987 10.5855L7.45711 6.0439C7.06658 5.65338 6.43342 5.65338 6.04289 6.0439C5.65237 6.43442 5.65237 7.06759 6.04289 7.45811L10.5845 11.9997L6.04289 16.5413Z"
                    fill="currentColor"
                />
                </svg>
              </button>
            )}
            <div>{children}</div>
          </div>
        </div>
      </div>,
      modalRoot
    );
  };
  

export default Modal;