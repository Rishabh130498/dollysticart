import React from 'react';

export default function FormattedText({ 
  text, 
  className = '' 
}: { 
  text?: string | null; 
  className?: string; 
}) {
  if (!text) return null;

  // Split text by double newlines (\n\n) or blank lines into separate paragraph blocks
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);

  if (paragraphs.length === 0) return null;

  return (
    <div className="space-y-4">
      {paragraphs.map((para, idx) => (
        <p key={idx} className={`whitespace-pre-line ${className}`}>
          {para}
        </p>
      ))}
    </div>
  );
}
