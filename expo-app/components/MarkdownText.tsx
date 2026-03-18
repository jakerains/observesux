/**
 * MarkdownText - Renders markdown as native Text/View components
 * Handles: paragraphs, bullet lists, numbered lists, headers, **bold**, [text](url)
 */

import { Text, View, Linking } from 'react-native';
import type { TextStyle, StyleProp } from 'react-native';

interface Props {
  children: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

interface InlineSegment {
  text: string;
  bold: boolean;
  url?: string;
}

// ── Inline parser (bold + links) ───────────────────────────────────

function parseInline(raw: string): InlineSegment[] {
  const result: InlineSegment[] = [];

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

// ── Render inline segments as Text children ────────────────────────

function renderInline(
  segments: InlineSegment[],
  baseStyle?: StyleProp<TextStyle>,
) {
  return segments.map((seg, i) => {
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
    if (seg.bold) {
      return (
        <Text key={i} style={{ fontWeight: '700' }}>
          {seg.text}
        </Text>
      );
    }
    return <Text key={i}>{seg.text}</Text>;
  });
}

// ── Block types ────────────────────────────────────────────────────

type Block =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; level: number; text: string }
  | { type: 'bullet'; text: string }
  | { type: 'numbered'; number: string; text: string };

// ── Block parser ───────────────────────────────────────────────────

function parseBlocks(input: string): Block[] {
  const normalized = input.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

  // Split into paragraphs by double newlines
  const rawBlocks = normalized.split(/\n\n/);
  const blocks: Block[] = [];

  for (const rawBlock of rawBlocks) {
    const trimmed = rawBlock.trim();
    if (!trimmed) continue;

    // A single block might contain multiple lines (e.g. consecutive bullets)
    const lines = trimmed.split('\n');

    for (const line of lines) {
      const ln = line.trimStart();

      // Header: # or ## or ###
      const headingMatch = ln.match(/^(#{1,3})\s+(.*)/);
      if (headingMatch) {
        blocks.push({
          type: 'heading',
          level: headingMatch[1].length,
          text: headingMatch[2].trim(),
        });
        continue;
      }

      // Bullet: - item or * item (but not ** which is bold)
      const bulletMatch = ln.match(/^[-*]\s+(.*)/);
      if (bulletMatch && !ln.startsWith('**')) {
        blocks.push({ type: 'bullet', text: bulletMatch[1].trim() });
        continue;
      }

      // Numbered list: 1. item
      const numberedMatch = ln.match(/^(\d+)\.\s+(.*)/);
      if (numberedMatch) {
        blocks.push({
          type: 'numbered',
          number: numberedMatch[1],
          text: numberedMatch[2].trim(),
        });
        continue;
      }

      // Plain paragraph line
      if (ln) {
        // Merge consecutive plain lines within the same block into one paragraph
        const lastBlock = blocks[blocks.length - 1];
        if (lastBlock && lastBlock.type === 'paragraph' && lines.length > 1) {
          lastBlock.text += ' ' + ln;
        } else {
          blocks.push({ type: 'paragraph', text: ln });
        }
      }
    }
  }

  return blocks;
}

// ── Main component ─────────────────────────────────────────────────

export function MarkdownText({ children, style, numberOfLines }: Props) {
  // If numberOfLines is set, fall back to a simple flat rendering so the
  // native line-clamp works (View-based layout can't be line-clamped).
  if (numberOfLines != null) {
    const cleaned = children
      .replace(/^#{1,3}\s+/gm, '')
      .replace(/\n{3,}/g, '\n\n')
      .trim();

    const segments = parseInline(cleaned);

    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {renderInline(segments, style)}
      </Text>
    );
  }

  const blocks = parseBlocks(children);

  return (
    <View>
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'heading': {
            const fontSize = block.level === 1 ? 20 : block.level === 2 ? 17 : 15;
            return (
              <Text
                key={i}
                style={[
                  style,
                  {
                    fontWeight: '700',
                    fontSize,
                    marginTop: i === 0 ? 0 : 12,
                    marginBottom: 4,
                  },
                ]}
              >
                {renderInline(parseInline(block.text), style)}
              </Text>
            );
          }

          case 'bullet': {
            return (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginTop: 2,
                  marginBottom: 2,
                  paddingLeft: 8,
                }}
              >
                <Text style={[style, { marginRight: 6, lineHeight: 20 }]}>
                  {'\u2022'}
                </Text>
                <Text style={[style, { flex: 1, lineHeight: 20 }]}>
                  {renderInline(parseInline(block.text), style)}
                </Text>
              </View>
            );
          }

          case 'numbered': {
            return (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  marginTop: 2,
                  marginBottom: 2,
                  paddingLeft: 8,
                }}
              >
                <Text style={[style, { marginRight: 6, lineHeight: 20 }]}>
                  {block.number}.
                </Text>
                <Text style={[style, { flex: 1, lineHeight: 20 }]}>
                  {renderInline(parseInline(block.text), style)}
                </Text>
              </View>
            );
          }

          case 'paragraph':
          default: {
            return (
              <Text
                key={i}
                style={[
                  style,
                  {
                    marginTop: i === 0 ? 0 : 8,
                    marginBottom: 0,
                  },
                ]}
              >
                {renderInline(parseInline(block.text), style)}
              </Text>
            );
          }
        }
      })}
    </View>
  );
}
