import React from 'react';
import { Text, TextProps, StyleProp, TextStyle } from 'react-native';
import { segmentByScript } from '../../utils/language';

type MixedFontTextProps = TextProps & {
  children: React.ReactNode;
  fontSize?: number;
};

export const MixedFontText = ({
  children,
  fontSize = 16,
  style,
  ...props
}: MixedFontTextProps) => {
  if (typeof children !== 'string') {
    return <Text style={style} {...props}>{children}</Text>;
  }

  const segments = segmentByScript(children);

  // Concatenate all segments into a single Text element
  return (
    <Text style={style} {...props}>
      {segments.map(({ segment, isJapanese }, index) => (
        <Text
          key={index.toString()}
          style={[
            { fontSize }, // Default/prop fontSize
            style as StyleProp<TextStyle>, // User-provided styles (can override fontSize)
            { fontFamily: isJapanese ? 'Klee One' : 'SourceSerif4-Regular' }, // Font family override
          ]}
        >
          {segment}
        </Text>
      ))}
    </Text>
  );
};
