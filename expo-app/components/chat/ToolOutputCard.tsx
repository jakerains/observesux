import { View, Text, PlatformColor } from 'react-native';
import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { getToolCardComponent } from '@/components/chat/tool-cards';

export interface ToolOutput {
  id: string;
  toolName: string;
  output: unknown;
}

interface ToolOutputCardProps {
  toolName: string;
  output: unknown;
}

const TOOL_ICON_MAP: Array<{ match: RegExp; icon: SymbolViewProps['name'] }> = [
  { match: /weather/i, icon: 'cloud.sun.fill' },
  { match: /alert/i, icon: 'exclamationmark.triangle.fill' },
  { match: /traffic|road/i, icon: 'car.fill' },
  { match: /river|water/i, icon: 'drop.fill' },
  { match: /air quality|air/i, icon: 'leaf.fill' },
  { match: /news/i, icon: 'newspaper.fill' },
  { match: /gas/i, icon: 'fuelpump.fill' },
  { match: /flight|aviation/i, icon: 'airplane' },
  { match: /transit|bus/i, icon: 'bus.fill' },
  { match: /event/i, icon: 'calendar' },
  { match: /outage|power/i, icon: 'bolt.fill' },
  { match: /system|status/i, icon: 'gearshape.fill' },
  { match: /search|knowledge/i, icon: 'magnifyingglass' },
];

function formatToolName(name: string) {
  const withoutPrefix = name.replace(/^get/i, '');
  const withSpaces = withoutPrefix.replace(/([A-Z])/g, ' $1').trim();
  return withSpaces.length ? withSpaces[0].toUpperCase() + withSpaces.slice(1) : 'Tool Result';
}

function getToolIcon(toolName: string): SymbolViewProps['name'] {
  const match = TOOL_ICON_MAP.find((entry) => entry.match.test(toolName));
  return match?.icon || 'sparkles';
}

function pickLabel(item: Record<string, unknown>) {
  const candidates = ['title', 'headline', 'name', 'event', 'description', 'stationName', 'roadway'];
  for (const key of candidates) {
    const value = item[key];
    if (typeof value === 'string' && value.trim().length > 0) return value;
  }
  return null;
}

function summarizeOutput(output: unknown) {
  const lines: string[] = [];
  let list: string[] | null = null;

  if (output == null) {
    return { lines: ['No data returned.'] };
  }

  if (typeof output === 'string') {
    return { lines: [output] };
  }

  if (Array.isArray(output)) {
    list = output
      .slice(0, 3)
      .map((item) => (typeof item === 'string' ? item : pickLabel(item as Record<string, unknown>)))
      .filter((value): value is string => Boolean(value));
    return { lines: [`${output.length} item${output.length === 1 ? '' : 's'} returned.`], list };
  }

  const data = output as Record<string, unknown>;
  if (typeof data.error === 'string') {
    return { lines: [data.error] };
  }
  if (typeof data.message === 'string') {
    return { lines: [data.message] };
  }

  if (typeof data.narrative_summary === 'string') {
    lines.push(data.narrative_summary);
  }

  const weather = (data.weather as Record<string, unknown>)?.current as Record<string, unknown> | undefined;
  const current = (data.current as Record<string, unknown> | undefined) || weather;
  const temp = current?.temperature as number | undefined;
  if (typeof temp === 'number') {
    const unit = typeof current?.temperatureUnit === 'string' ? current.temperatureUnit : '';
    const conditions = typeof current?.conditions === 'string' ? current.conditions : '';
    lines.push(`Temp ${Math.round(temp)}°${unit}${conditions ? ` · ${conditions}` : ''}`);
  }

  const airQuality = (data.airQuality as Record<string, unknown>)?.current as Record<string, unknown> | undefined;
  if (typeof airQuality?.aqi === 'number') {
    const category = typeof airQuality?.category === 'string' ? airQuality.category : 'AQI';
    lines.push(`AQI ${airQuality.aqi} (${category})`);
  }

  const traffic = (data.traffic as Record<string, unknown>)?.incidents as unknown[] | undefined;
  if (Array.isArray(traffic)) {
    lines.push(`${traffic.length} traffic item${traffic.length === 1 ? '' : 's'}`);
  }

  const rivers = (data.rivers as Record<string, unknown>)?.readings as unknown[] | undefined;
  if (Array.isArray(rivers)) {
    lines.push(`River gauges: ${rivers.length}`);
  }

  const alerts = data.alerts as unknown[] | undefined;
  if (Array.isArray(alerts)) {
    lines.push(`${alerts.length} alert${alerts.length === 1 ? '' : 's'}`);
  }

  const listKeys = ['results', 'events', 'incidents', 'alerts', 'articles', 'items', 'readings'];
  for (const key of listKeys) {
    const value = data[key];
    if (Array.isArray(value)) {
      list = value
        .slice(0, 3)
        .map((item) => (typeof item === 'string' ? item : pickLabel(item as Record<string, unknown>)))
        .filter((item): item is string => Boolean(item));
      break;
    }
  }

  if (lines.length === 0 && list && list.length === 0) {
    const preview = JSON.stringify(output);
    lines.push(preview.length > 240 ? `${preview.slice(0, 240)}…` : preview);
  }

  if (lines.length === 0 && list && list.length > 0) {
    lines.push('Details:');
  }

  if (lines.length === 0) {
    lines.push('Response received.');
  }

  return { lines, list };
}

export function ToolOutputCard({ toolName, output }: ToolOutputCardProps) {
  const Card = getToolCardComponent(toolName)
  if (Card) {
    return <Card output={output} />
  }

  const title = formatToolName(toolName);
  const icon = getToolIcon(toolName);
  const { lines, list } = summarizeOutput(output);

  return (
    <View
      style={{
        borderRadius: 12,
        borderCurve: 'continuous',
        padding: 12,
        backgroundColor: PlatformColor('secondarySystemBackground'),
        borderWidth: 0.5,
        borderColor: PlatformColor('separator'),
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <SymbolView name={icon} tintColor={PlatformColor('systemBlue')} size={18} />
        <Text style={{ fontSize: 13, fontWeight: '600', color: PlatformColor('label') }}>{title}</Text>
      </View>
      <View style={{ gap: 6 }}>
        {lines.map((line, index) => (
          <Text
            key={`${title}-line-${index}`}
            selectable
            style={{ fontSize: 13, color: PlatformColor('secondaryLabel'), lineHeight: 18 }}
          >
            {line}
          </Text>
        ))}
        {list && list.length > 0 && (
          <View style={{ gap: 4, marginTop: 2 }}>
            {list.map((item, index) => (
              <Text
                key={`${title}-item-${index}`}
                selectable
                style={{ fontSize: 12, color: PlatformColor('tertiaryLabel') }}
              >
                • {item}
              </Text>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}
