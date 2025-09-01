import React, { useState, useRef, useEffect } from "react";
import Draggable from "react-draggable";
import { X, Maximize2, Minimize2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface DraggableWindowProps {
  id: string;
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  initialPosition?: { x: number; y: number };
  onClose: (id: string) => void;
  zIndex: number;
  onFocus: (id: string) => void;
}

const DraggableWindow: React.FC<DraggableWindowProps> = ({
  id,
  title,
  icon,
  children,
  initialPosition = { x: 100, y: 100 },
  onClose,
  zIndex,
  onFocus,
}) => {
  // Responsive window sizes based on screen size
  const getInitialSize = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Mobile devices (< 768px)
    if (screenWidth < 768) {
      return { width: screenWidth - 40, height: screenHeight - 200 };
    }

    // Tablets and larger (>= 768px)
    return {
      width: Math.min(720, screenWidth - 100),
      height: Math.min(520, screenHeight - 150),
    };
  };

  const [size, setSize] = useState(getInitialSize());
  const [isMaximized, setIsMaximized] = useState(false);
  const [previousSize, setPreviousSize] = useState(getInitialSize());
  const [previousPosition, setPreviousPosition] = useState(initialPosition);
  const windowRef = useRef<HTMLDivElement>(null);
  const isResizing = useRef(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      const newIsMobile = window.innerWidth < 768;
      setIsMobile(newIsMobile);

      // Auto-maximize on mobile for better UX
      if (newIsMobile && !isMaximized) {
        const newSize = getInitialSize();
        setSize(newSize);
        setPreviousSize(newSize);
        setIsMaximized(true);
      } else if (!newIsMobile && isMaximized) {
        // Restore window on desktop/tablet
        setIsMaximized(false);
        const newSize = getInitialSize();
        setSize(newSize);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMaximized]);

  // Initialize mobile state on mount
  useEffect(() => {
    if (isMobile) {
      setIsMaximized(true);
    }
  }, []);

  // Handle resize functionality
  const handleMouseDown = (e: React.MouseEvent, direction: string) => {
    e.preventDefault();
    e.stopPropagation();

    if (isMaximized) return;

    isResizing.current = true;
    onFocus(id);

    const startX = e.clientX;
    const startY = e.clientY;
    const startWidth = size.width;
    const startHeight = size.height;

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;

      let newWidth = startWidth;
      let newHeight = startHeight;

      if (direction.includes("right")) {
        newWidth = Math.max(
          isMobile ? 320 : 400,
          startWidth + (e.clientX - startX)
        );
      }
      if (direction.includes("bottom")) {
        newHeight = Math.max(
          isMobile ? 200 : 300,
          startHeight + (e.clientY - startY)
        );
      }

      setSize({ width: newWidth, height: newHeight });
    };

    const handleMouseUp = () => {
      isResizing.current = false;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
  };

  const toggleMaximize = () => {
    if (isMobile) return; // Don't allow minimize on mobile

    if (isMaximized) {
      setSize(previousSize);
      setIsMaximized(false);
    } else {
      setPreviousSize(size);
      setPreviousPosition(initialPosition);
      const margin = isMobile ? 20 : 100;
      const topOffset = isMobile ? 80 : 150;
      setSize({
        width: window.innerWidth - margin,
        height: window.innerHeight - topOffset,
      });
      setIsMaximized(true);
    }
  };

  // Define drag boundaries to allow dragging up to header
  const getDragBounds = () => {
    const navigationHeight = 64; // Height of the top navigation bar
    const sidebarWidth =
      window.innerWidth < 768 ? 0 : window.innerWidth < 1280 ? 320 : 384; // 80, 320, 384 from sidebar widths
    const margin = 5; // Small margin from edges

    return {
      left: -(size.width - 100), // Allow partial hiding on the left, but keep 100px visible
      top: navigationHeight + margin, // Allow dragging close to navigation header
      right: window.innerWidth - sidebarWidth - 100, // Allow partial hiding on the right, but keep 100px visible
      bottom: window.innerHeight - 100, // Allow partial hiding at bottom, but keep title bar visible
    };
  };

  return (
    <Draggable
      handle=".drag-handle"
      defaultPosition={initialPosition}
      disabled={isMaximized || isMobile}
      onStart={() => onFocus(id)}
      bounds={getDragBounds()}
    >
      <Card
        ref={windowRef}
        className="absolute glass-effect shadow-window border-border/30 overflow-hidden"
        style={{
          width: size.width,
          height: size.height,
          zIndex,
          ...((isMaximized || isMobile) && {
            top: isMobile ? 70 : 75,
            left: isMobile ? 10 : 50,
            transform: "none",
          }),
        }}
        onClick={() => onFocus(id)}
      >
        {/* Window Header */}
        <div className="drag-handle bg-gradient-primary p-3 flex items-center justify-between border-b border-border/20">
          <div className="flex items-center space-x-2">
            {icon && <span className="text-primary-foreground">{icon}</span>}
            <span className="font-medium text-primary-foreground text-sm">
              {title}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            {!isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-primary-foreground hover:bg-white/10"
                onClick={toggleMaximize}
              >
                {isMaximized ? (
                  <Minimize2 className="h-3 w-3" />
                ) : (
                  <Maximize2 className="h-3 w-3" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-primary-foreground hover:bg-destructive/20"
              onClick={() => onClose(id)}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        {/* Window Content */}
        <div className="p-4 h-full overflow-auto bg-card/95">{children}</div>

        {/* Resize Handles */}
        {!isMaximized && !isMobile && (
          <>
            <div
              className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
              onMouseDown={(e) => handleMouseDown(e, "bottom-right")}
            >
              <div className="absolute bottom-1 right-1 w-2 h-2 border-r-2 border-b-2 border-muted-foreground/50" />
            </div>
            <div
              className="absolute bottom-0 left-0 right-4 h-2 cursor-s-resize"
              onMouseDown={(e) => handleMouseDown(e, "bottom")}
            />
            <div
              className="absolute top-0 bottom-0 right-0 w-2 cursor-e-resize"
              onMouseDown={(e) => handleMouseDown(e, "right")}
            />
          </>
        )}
      </Card>
    </Draggable>
  );
};

export default DraggableWindow;
