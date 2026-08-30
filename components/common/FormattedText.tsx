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

  if (paragraphs.length <= 1) {
    return <div className={`whitespace-pre-line ${className}`}>{text}</div>;
  }

  return (
    <div className="space-y-4">
      {paragraphs.map((para, idx) => (
        <div key={idx} className={`whitespace-pre-line ${className}`}>
          {para}
        </div>
      ))}
    </div>
  );
}
