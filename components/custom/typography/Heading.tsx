// components/Headings.tsx
import React, { FC } from "react";
import { Text, TextProps } from "react-native";

/**
 * NOTE
 * - This keeps `className?: string` for projects using nativewind/tailwind.
 * - If you don't use nativewind, just pass `style` as usual; `className` will be ignored.
 */

/** Base props: extend native TextProps so you can pass numberOfLines, onPress, style, etc. */
export interface BaseHeadingProps extends TextProps {
  /** Tailwind / nativewind className (optional) */
  className?: string;
  /** Default tailwind classes for the heading (required for BaseHeading) */
  defaultStyle: string;
  children?: React.ReactNode;
}

/** Helper: cast RN Text to `any` so we can supply `className` without TS errors in projects lacking nativewind typings. */
const RNText: any = Text;

/** BaseHeading — used by H1..H6 */
export const BaseHeading: FC<BaseHeadingProps> = ({
  className = "",
  children,
  defaultStyle,
  ...rest
}) => {
  // Merge the default className with any overrides the consumer passes.
  // If your project doesn't use nativewind, consumers should pass `style` instead of `className`.
  const finalClassName = `${defaultStyle} ${className}`.trim();

  return (
    // RNText is `Text as any` — allows className prop if nativewind is present; otherwise it's ignored at runtime.
    <RNText {...rest} className={finalClassName}>
      {children}
    </RNText>
  );
};

/** Heading props consumers normally use (allow passing TextProps like numberOfLines, style, etc.) */
export interface HeadingProps extends Omit<TextProps, "children"> {
  children?: React.ReactNode;
  className?: string;
}

/** H1 - H6 components with typed props */
export const H1: FC<HeadingProps> = ({ children, className, ...rest }) => (
  <BaseHeading
    defaultStyle="text-4xl font-bold"
    className={className}
    {...rest}
  >
    {children}
  </BaseHeading>
);

export const H2: FC<HeadingProps> = ({ children, className, ...rest }) => (
  <BaseHeading
    defaultStyle="text-3xl font-semibold"
    className={className}
    {...rest}
  >
    {children}
  </BaseHeading>
);

export const H3: FC<HeadingProps> = ({ children, className, ...rest }) => (
  <BaseHeading
    defaultStyle="text-2xl font-semibold"
    className={className}
    {...rest}
  >
    {children}
  </BaseHeading>
);

export const H4: FC<HeadingProps> = ({ children, className, ...rest }) => (
  <BaseHeading
    defaultStyle="text-xl font-medium"
    className={className}
    {...rest}
  >
    {children}
  </BaseHeading>
);

export const H5: FC<HeadingProps> = ({ children, className, ...rest }) => (
  <BaseHeading
    defaultStyle="text-lg font-medium"
    className={className}
    {...rest}
  >
    {children}
  </BaseHeading>
);

export const H6: FC<HeadingProps> = ({ children, className, ...rest }) => (
  <BaseHeading
    defaultStyle="text-base font-normal"
    className={className}
    {...rest}
  >
    {children}
  </BaseHeading>
);
