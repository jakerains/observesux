/**
 * MarkdownText - Renders inline markdown (bold, italic) as native Text
 * Handles **bold**, *italic*, and strips ## headers for plain display
 */

import { Text } from 'react-native';
import type { TextStyle, StyleProp } from 'react-native';

interface Props {
  children: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

interface Segment {
  text: string;
  bold: boolean;
  italic: boolean;
}

function parseInline(raw: string): Segment[] {
  const segments: Segment[] = [];
  // Match **bold**, *italic* — bold first to avoid ** being caught by *
  const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(raw)) !== null) {
    if (match.index > last) {
      segments.push({ text: raw.slice(last, match.index), bold: false, italic: false });
    }
    if (match[1] !== undefined) {
      segments.push({ text: match[1], bold: true, italic: false });
    } else if (match[2] !== undefined) {
      segments.push({ text: match[2], bold: false, italic: true });
    }
    last = regex.lastIndex;
  }

  if (last < raw.length) {
    segments.push({ text: raw.slice(last), bold: false, italic: false });
  }

  return segments;
}

export function MarkdownText({ children, style, numberOfLines }: Props) {
  // Strip leading ## headers for inline contexts
  const cleaned = children
    .replace(/^#{1,3}\s+/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  const segments = parseInline(cleaned);

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {segments.map((seg, i) => {
        if (!seg.bold && !seg.italic) return seg.text;
        return (
          <Text
            key={i}
            style={{
              fontWeight: seg.bold ? '700' : undefined,
              fontStyle: seg.italic ? 'italic' : undefined,
            }}
          >
            {seg.text}
          </Text>
        );
      })}
    </Text>
  );
}
