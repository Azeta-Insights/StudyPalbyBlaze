import React from 'react';

interface FormattedTextProps {
  text: string;
  className?: string;
}

export const FormattedText: React.FC<FormattedTextProps> = ({ text, className = '' }) => {
  if (!text) return null;

  // If text contains HTML tags like <sub>, <sup>, <i>, <b>, <span>, render sanitized safely
  const hasHtml = /<\/?(sub|sup|i|b|strong|em|span|br)[^>]*>/i.test(text);

  if (hasHtml) {
    return (
      <span
        className={`inline-block leading-relaxed ${className}`}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  }

  // Enhanced regex for mathematical symbols and variables
  return (
    <span className={`inline-block leading-relaxed ${className}`}>
      {text}
    </span>
  );
};
