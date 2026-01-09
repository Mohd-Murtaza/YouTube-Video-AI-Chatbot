'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';

export default function MessageFormatter({ content, type }) {
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Fix timestamps: 00:00:12 -> 00:12, 00:01:40 -> 01:40
  const fixTimestamps = (text) => {
    return text.replace(/\b00:(\d{2}:\d{2})\b/g, '$1');
  };

  // Parse message for code blocks, lists, and formatting
  const parseContent = (text) => {
    // Fix timestamps first
    text = fixTimestamps(text);
    
    const parts = [];
    
    // Regex to match code blocks
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    
    let match;
    const codeBlocks = [];
    
    // Find all code blocks
    while ((match = codeBlockRegex.exec(text)) !== null) {
      codeBlocks.push({
        start: match.index,
        end: match.index + match[0].length,
        language: match[1] || 'text',
        code: match[2].trim()
      });
    }
    
    if (codeBlocks.length === 0) {
      // No code blocks, render as formatted text
      return <div className="space-y-2">{renderFormattedText(text)}</div>;
    }
    
    // Render text with code blocks
    const elements = [];
    let textIndex = 0;
    
    codeBlocks.forEach((block, idx) => {
      // Add text before code block
      if (block.start > textIndex) {
        const textBefore = text.substring(textIndex, block.start);
        elements.push(
          <div key={`text-${idx}`} className="space-y-2 mb-3">
            {renderFormattedText(textBefore)}
          </div>
        );
      }
      
      // Add code block with syntax highlighting
      elements.push(
        <div key={`code-${idx}`} className="my-3 rounded-lg overflow-hidden border border-gray-700 bg-gray-900">
          <div className="bg-gray-800 px-3 py-2 flex items-center justify-between border-b border-gray-700">
            <span className="text-xs text-gray-400 font-mono uppercase">{block.language}</span>
            <button
              onClick={() => handleCopy(block.code, idx)}
              className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700"
            >
              {copiedIndex === idx ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 overflow-x-auto">
            <code className="text-sm font-mono leading-relaxed block">
              {highlightCode(block.code, block.language)}
            </code>
          </pre>
        </div>
      );
      
      textIndex = block.end;
    });
    
    // Add remaining text after last code block
    if (textIndex < text.length) {
      const textAfter = text.substring(textIndex);
      elements.push(
        <div key={`text-end`} className="space-y-2">
          {renderFormattedText(textAfter)}
        </div>
      );
    }
    
    return <div>{elements}</div>;
  };

  // Enhanced syntax highlighting with more colors
  const highlightCode = (code, language) => {
    const lines = code.split('\n');
    
    return lines.map((line, lineIdx) => {
      if (!line.trim()) {
        return <div key={lineIdx} className="h-5">&nbsp;</div>;
      }

      const tokens = [];
      let currentPos = 0;
      
      if (language === 'python') {
        // Python syntax patterns
        const patterns = [
          // Keywords (purple)
          { regex: /\b(import|from|def|class|return|if|elif|else|for|while|try|except|finally|with|as|pass|break|continue|async|await|yield|lambda|in|is|not|and|or|True|False|None)\b/g, color: 'text-purple-400' },
          // Built-in functions (cyan)
          { regex: /\b(print|len|range|enumerate|zip|map|filter|str|int|float|list|dict|set|tuple|open|input)\b(?=\()/g, color: 'text-cyan-400' },
          // Class names (yellow)
          { regex: /\b([A-Z][a-zA-Z0-9_]*)\b/g, color: 'text-yellow-400' },
          // Strings (green)
          { regex: /(["'`])((?:\\.|(?!\1).)*?)\1/g, color: 'text-green-400' },
          // Comments (gray)
          { regex: /(#.*$)/g, color: 'text-gray-500' },
          // Numbers (orange)
          { regex: /\b(\d+\.?\d*)\b/g, color: 'text-orange-400' },
          // Function definitions (blue)
          { regex: /\b([a-z_][a-zA-Z0-9_]*)\s*(?=\()/g, color: 'text-blue-400' },
        ];

        let processedLine = line;
        const matches = [];

        // Collect all matches with their positions
        patterns.forEach(pattern => {
          const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
          let match;
          while ((match = regex.exec(line)) !== null) {
            matches.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0],
              color: pattern.color
            });
          }
        });

        // Sort by position and remove overlaps
        matches.sort((a, b) => a.start - b.start);
        const filteredMatches = [];
        let lastEnd = 0;

        matches.forEach(match => {
          if (match.start >= lastEnd) {
            filteredMatches.push(match);
            lastEnd = match.end;
          }
        });

        // Build tokens from matches
        let pos = 0;
        filteredMatches.forEach((match, idx) => {
          // Add text before match
          if (match.start > pos) {
            tokens.push(
              <span key={`text-${lineIdx}-${idx}`} className="text-gray-300">
                {line.substring(pos, match.start)}
              </span>
            );
          }
          // Add colored match
          tokens.push(
            <span key={`match-${lineIdx}-${idx}`} className={match.color}>
              {match.text}
            </span>
          );
          pos = match.end;
        });

        // Add remaining text
        if (pos < line.length) {
          tokens.push(
            <span key={`end-${lineIdx}`} className="text-gray-300">
              {line.substring(pos)}
            </span>
          );
        }

      } else if (language === 'javascript' || language === 'js' || language === 'jsx' || language === 'typescript' || language === 'ts') {
        // JavaScript/TypeScript patterns
        const patterns = [
          // Keywords (purple)
          { regex: /\b(const|let|var|function|async|await|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|class|extends|import|export|from|default|static|public|private|protected|interface|type|enum)\b/g, color: 'text-purple-400' },
          // Built-in objects (yellow)
          { regex: /\b(console|Math|Object|Array|String|Number|Boolean|Date|Promise|JSON|window|document)\b/g, color: 'text-yellow-400' },
          // Strings (green)
          { regex: /(["'`])((?:\\.|(?!\1).)*?)\1/g, color: 'text-green-400' },
          // Comments (gray)
          { regex: /(\/\/.*$|\/\*[\s\S]*?\*\/)/g, color: 'text-gray-500' },
          // Numbers (orange)
          { regex: /\b(\d+\.?\d*)\b/g, color: 'text-orange-400' },
          // Functions (blue)
          { regex: /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*(?=\()/g, color: 'text-blue-400' },
          // Properties (cyan)
          { regex: /\.([a-zA-Z_$][a-zA-Z0-9_$]*)/g, color: 'text-cyan-400' },
        ];

        let pos = 0;
        const matches = [];

        patterns.forEach(pattern => {
          const regex = new RegExp(pattern.regex.source, pattern.regex.flags);
          let match;
          while ((match = regex.exec(line)) !== null) {
            matches.push({
              start: match.index,
              end: match.index + match[0].length,
              text: match[0],
              color: pattern.color
            });
          }
        });

        matches.sort((a, b) => a.start - b.start);
        const filteredMatches = [];
        let lastEnd = 0;

        matches.forEach(match => {
          if (match.start >= lastEnd) {
            filteredMatches.push(match);
            lastEnd = match.end;
          }
        });

        filteredMatches.forEach((match, idx) => {
          if (match.start > pos) {
            tokens.push(
              <span key={`text-${lineIdx}-${idx}`} className="text-gray-300">
                {line.substring(pos, match.start)}
              </span>
            );
          }
          tokens.push(
            <span key={`match-${lineIdx}-${idx}`} className={match.color}>
              {match.text}
            </span>
          );
          pos = match.end;
        });

        if (pos < line.length) {
          tokens.push(
            <span key={`end-${lineIdx}`} className="text-gray-300">
              {line.substring(pos)}
            </span>
          );
        }

      } else {
        // Default: no highlighting
        tokens.push(
          <span key={`line-${lineIdx}`} className="text-gray-300">
            {line}
          </span>
        );
      }

      return (
        <div key={lineIdx} className="leading-relaxed">
          {tokens.length > 0 ? tokens : <span className="text-gray-300">{line}</span>}
        </div>
      );
    });
  };

  const renderFormattedText = (text) => {
    const lines = text.split('\n');
    const elements = [];
    let listItems = [];
    let inList = false;
    let listType = null; // 'numbered' or 'bullet'

    lines.forEach((line, idx) => {
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        // Close list if open
        if (inList) {
          elements.push(
            <ul key={`list-${elements.length}`} className="space-y-1.5 my-2 ml-4">
              {listItems}
            </ul>
          );
          listItems = [];
          inList = false;
          listType = null;
        }
        return;
      }
      
      // Check for numbered list
      const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)/);
      if (numberedMatch) {
        if (!inList || listType !== 'numbered') {
          if (inList) {
            elements.push(
              <ul key={`list-${elements.length}`} className="space-y-1.5 my-2 ml-4">
                {listItems}
              </ul>
            );
          }
          inList = true;
          listType = 'numbered';
          listItems = [];
        }
        listItems.push(
          <li key={`li-${idx}`} className="flex items-start gap-2">
            <span className="text-blue-400 font-semibold shrink-0">{numberedMatch[1]}.</span>
            <span className="leading-snug">{formatInlineElements(numberedMatch[2])}</span>
          </li>
        );
        return;
      }
      
      // Check for bullet points
      const bulletMatch = trimmedLine.match(/^[-•*]\s+(.+)/);
      if (bulletMatch) {
        if (!inList || listType !== 'bullet') {
          if (inList) {
            elements.push(
              <ul key={`list-${elements.length}`} className="space-y-1.5 my-2 ml-4">
                {listItems}
              </ul>
            );
          }
          inList = true;
          listType = 'bullet';
          listItems = [];
        }
        listItems.push(
          <li key={`li-${idx}`} className="flex items-start gap-2">
            <span className="text-blue-400 mt-0.5 shrink-0">•</span>
            <span className="leading-snug">{formatInlineElements(bulletMatch[1])}</span>
          </li>
        );
        return;
      }
      
      // If we were in a list and now we're not, close the list
      if (inList) {
        elements.push(
          <ul key={`list-${elements.length}`} className="space-y-1.5 my-2 ml-4">
            {listItems}
          </ul>
        );
        listItems = [];
        inList = false;
        listType = null;
      }
      
      // Regular paragraph
      elements.push(
        <p key={`p-${idx}`} className="leading-snug">
          {formatInlineElements(trimmedLine)}
        </p>
      );
    });
    
    // Close list if still open
    if (inList && listItems.length > 0) {
      elements.push(
        <ul key={`list-end`} className="space-y-1.5 my-2 ml-4">
          {listItems}
        </ul>
      );
    }
    
    return elements;
  };

  const formatInlineElements = (text) => {
    const parts = [];
    let currentIndex = 0;
    
    // Match inline code and bold text
    const inlineCodeRegex = /`([^`]+)`/g;
    const boldRegex = /\*\*([^*]+)\*\*/g;
    
    // Get all matches
    const allMatches = [];
    
    let match;
    while ((match = inlineCodeRegex.exec(text)) !== null) {
      allMatches.push({ type: 'code', start: match.index, end: match.index + match[0].length, content: match[1] });
    }
    
    while ((match = boldRegex.exec(text)) !== null) {
      allMatches.push({ type: 'bold', start: match.index, end: match.index + match[0].length, content: match[1] });
    }
    
    // Sort by position
    allMatches.sort((a, b) => a.start - b.start);
    
    // Build the result
    allMatches.forEach((match, idx) => {
      // Add text before this match
      if (match.start > currentIndex) {
        parts.push(text.substring(currentIndex, match.start));
      }
      
      // Add the formatted element
      if (match.type === 'code') {
        parts.push(
          <code key={`code-${idx}`} className="px-1.5 py-0.5 bg-gray-800 text-blue-400 rounded text-[0.9em] font-mono">
            {match.content}
          </code>
        );
      } else if (match.type === 'bold') {
        parts.push(
          <strong key={`bold-${idx}`} className="font-semibold text-white">
            {match.content}
          </strong>
        );
      }
      
      currentIndex = match.end;
    });
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(text.substring(currentIndex));
    }
    
    return parts.length > 0 ? parts : text;
  };

  return (
    <div className={`text-sm ${type === 'user' ? 'text-gray-100' : 'text-gray-300'}`}>
      {parseContent(content)}
    </div>
  );
}

