/**
 * Tool Output Card — compact collapsed chip showing tool name only.
 * Tool results are consumed by the AI; we surface the action, not the raw data.
 */

import { View, Text } from 'react-native';
import { Image } from 'expo-image';
import { Brand } from '@/constants/BrandColors';

export interface ToolOutput {
  id: string;
  toolName: string;
  output: unknown;
}

interface ToolOutputCardProps {
  toolName: string;
  output: unknown;
}

const TOOL_ICON_MAP: Array<{ match: RegExp; icon: string; verb: string }> = [
  { match: /weather/i, icon: 'cloud.sun.fill', verb: 'Checked weather' },
  { match: /alert/i, icon: 'exclamationmark.triangle.fill', verb: 'Checked alerts' },
  { match: /traffic|road/i, icon: 'car.fill', verb: 'Checked traffic' },
  { match: /river|water/i, icon: 'drop.fill', verb: 'Checked river levels' },
  { match: /air.?quality|air/i, icon: 'leaf.fill', verb: 'Checked air quality' },
  { match: /news/i, icon: 'newspaper.fill', verb: 'Searched news' },
  { match: /gas/i, icon: 'fuelpump.fill', verb: 'Checked gas prices' },
  { match: /flight|aviation/i, icon: 'airplane', verb: 'Checked flights' },
  { match: /transit|bus/i, icon: 'bus.fill', verb: 'Checked transit' },
  { match: /event/i, icon: 'calendar', verb: 'Checked events' },
  { match: /outage|power/i, icon: 'bolt.fill', verb: 'Checked outages' },
  { match: /council|meeting/i, icon: 'building.columns.fill', verb: 'Searched council meetings' },
  { match: /search|knowledge/i, icon: 'magnifyingglass', verb: 'Searched' },
  { match: /system|status/i, icon: 'gearshape.fill', verb: 'Checked status' },
];

function getToolMeta(toolName: string): { icon: string; verb: string } {
  const entry = TOOL_ICON_MAP.find((e) => e.match.test(toolName));
  if (entry) return { icon: entry.icon, verb: entry.verb };

  // Fallback: pretty-print the tool name
  const pretty = toolName
    .replace(/^get/i, '')
    .replace(/([A-Z])/g, ' $1')
    .trim();
  const verb = pretty.length ? `${pretty[0].toUpperCase()}${pretty.slice(1)}` : 'Tool used';
  return { icon: 'sparkles', verb };
}

export function ToolOutputCard({ toolName }: ToolOutputCardProps) {
  const { icon, verb } = getToolMeta(toolName);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: Brand.secondary,
        borderWidth: 0.5,
        borderColor: `${Brand.amber}30`,
      }}
    >
      <Image source={`sf:${icon}`} style={{ width: 12, height: 12 }} tintColor={Brand.amber} />
      <Text style={{ fontSize: 12, color: Brand.muted }}>{verb}</Text>
    </View>
  );
}
