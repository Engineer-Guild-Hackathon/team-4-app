import React from 'react';
import { Text, TextProps } from 'react-native';
import { segmentByScript } from '../../utils/language';

type MixedFontTextProps = TextProps & {
  children: string;
  fontSize?: number;
};

export const MixedFontText = ({ children, fontSize = 16, ...props }: MixedFontTextProps) => {
  if (typeof children !== 'string') {
    return <Text {...props}>{children}</Text>;
  }

  const segments = segmentByScript(children);

  return (
    <Text {...props} style={[{ fontSize }, props.style]}>
      {segments.map(({ segment, isJapanese }, index) => (
        <Text
          key={index}
          style={[
            {
              fontFamily: isJapanese ? 'Klee One' : 'SourceSerif4-Regular',
              fontSize,
            },
            props.style,
          ]}
        >
          {segment}
        </Text>
      ))}
    </Text>
  );
};
