'use client';

import React, { useState, useEffect, useRef } from 'react';

export default function InlineText({ 
  value, 
  onChange, 
  className = '', 
  type = 'input' 
}: { 
  value: string; 
  onChange: (v: string) => void; 
  className?: string; 
  type?: 'input' | 'textarea' 
}) {
  const [editing, setEditing] = useState(false);
  const [localVal, setLocalVal] = useState(value);
  const inputRef = useRef<any>(null);

  useEffect(() => {
    setLocalVal(value);
  }, [value]);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  if (!editing) {
    return (
      <span 
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }} 
        className={`${className} cursor-pointer hover:outline hover:outline-dashed hover:outline-accent/60 hover:outline-1 px-1 transition-all rounded inline-block whitespace-pre-line`}
        title="Click to edit text visually"
      >
        {value || <span className="text-zinc-600 italic select-none">(Empty Field)</span>}
      </span>
    );
  }

  const handleBlur = () => {
    setEditing(false);
    if (localVal !== value) {
      onChange(localVal);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && type === 'input') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setLocalVal(value);
      setEditing(false);
    }
  };

  if (type === 'textarea') {
    return (
      <textarea
        ref={inputRef}
        value={localVal}
        onChange={(e) => setLocalVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="w-full bg-[#121214] border border-accent text-foreground text-xs p-2 rounded focus:outline-none font-sans leading-relaxed min-h-[100px]"
        rows={5}
      />
    );
  }

  return (
    <input
      ref={inputRef}
      type="text"
      value={localVal}
      onChange={(e) => setLocalVal(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-full bg-[#121214] border border-accent text-foreground text-xs px-2 py-1 rounded focus:outline-none font-display"
    />
  );
}
