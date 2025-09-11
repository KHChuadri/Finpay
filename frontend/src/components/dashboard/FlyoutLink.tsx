import React, { useState, useEffect, useRef } from "react";

interface Props {
  children: React.ReactNode;
  FlyoutContent: React.ReactNode;
  mobile?: boolean;
}

function FlyoutLink({ children, FlyoutContent, mobile }: Props) {
  const [open, setOpen] = useState(false);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };

  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div
      ref={flyoutRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="relative inline-block"
    >
      {children}

      <div
        className={`
          ${mobile ? 
            'absolute top-1/2 right-27.5 -translate-y-1/3 z-50 transition-all ease-in-out' 
            : 'absolute left-1/2 top-10 -translate-x-1/2 z-50 transition-all ease-in-out'}
          ${open ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'}
        `}
      >
        {FlyoutContent}
      </div>
    </div>
  );
}

export default FlyoutLink;
