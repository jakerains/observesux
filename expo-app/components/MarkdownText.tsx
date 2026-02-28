/**
 * MarkdownText - Renders inline markdown as native Text
 * Handles **bold**, [text](url) links
 * Uses split('**') for bold — more reliable than regex for arbitrary content
 */

import { Text, Linking } from 'react-native';
import type { TextStyle, StyleProp } from 'react-native';

interface Props {
  children: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

interface Segment {
  text: string;
  bold: boolean;
  url?: string;
}

function parseInline(raw: string): Segment[] {
  const result: Segment[] = [];

  // Step 1: Extract [text](url) links, preserve surrounding text
  const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
  const textParts: Array<{ text: string; url?: string }> = [];
  let last = 0;
  let m: RegExpExecArray | null;

  while ((m = linkRegex.exec(raw)) !== null) {
    if (m.index > last) {
      textParts.push({ text: raw.slice(last, m.index) });
    }
    textParts.push({ text: m[1], url: m[2] });
    last = linkRegex.lastIndex;
  }
  if (last < raw.length) {
    textParts.push({ text: raw.slice(last) });
  }

  // Step 2: For plain text, split on ** to detect bold spans
  // Odd-indexed chunks (0-based) are inside **...**
  for (const part of textParts) {
    if (part.url) {
      result.push({ text: part.text, bold: false, url: part.url });
    } else {
      const chunks = part.text.split('**');
      for (let i = 0; i < chunks.length; i++) {
        if (chunks[i]) {
          result.push({ text: chunks[i], bold: i % 2 === 1 });
        }
      }
    }
  }

  return result;
}

export function MarkdownText({ children, style, numberOfLines }: Props) {
  // Strip leading # headers for inline contexts, normalize whitespace
  const cleaned = children
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const segments = parseInline(cleaned);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segments.map((seg, i) => {
        if (seg.url) {
          return (
            <Text
              key={i}
              style={{ color: '#e69c3a', textDecorationLine: 'underline' }}
              onPress={() => Linking.openURL(seg.url!)}
            >
              {seg.text}
            </Text>
          );
        }
        if (!seg.bold) return seg.text;
        return (
          <Text key={i} style={{ fontWeight: '700' }}>
            {seg.text}
          </Text>
        );
      })}
    </Text>
  );
}
