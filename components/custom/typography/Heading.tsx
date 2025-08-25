// components/Headings.js
import React from "react";
import { Text } from "react-native";

/**
 * Base Heading component used by H1–H6.
 *
 * @param {object} props
 * @param {string} props.className - Extra Tailwind classes to override default.
 * @param {React.ReactNode} props.children - Text or elements inside the heading.
 * @param {string} props.defaultStyle - Tailwind classes for default heading style.
 */
const BaseHeading = ({ className = "", children, defaultStyle }) => {
  return <Text className={`${defaultStyle} ${className}`}>{children}</Text>;
};

/**
 * H1 Heading (largest, boldest).
 */
export const H1 = ({ children, className }) => (
  <BaseHeading defaultStyle="text-4xl font-bold" className={className}>
    {children}
  </BaseHeading>
);

/**
 * H2 Heading.
 */
export const H2 = ({ children, className }) => (
  <BaseHeading defaultStyle="text-3xl font-semibold" className={className}>
    {children}
  </BaseHeading>
);

/**
 * H3 Heading.
 */
export const H3 = ({ children, className }) => (
  <BaseHeading defaultStyle="text-2xl font-semibold" className={className}>
    {children}
  </BaseHeading>
);

/**
 * H4 Heading.
 */
export const H4 = ({ children, className }) => (
  <BaseHeading defaultStyle="text-xl font-medium" className={className}>
    {children}
  </BaseHeading>
);

/**
 * H5 Heading.
 */
export const H5 = ({ children, className }) => (
  <BaseHeading defaultStyle="text-lg font-medium" className={className}>
    {children}
  </BaseHeading>
);

/**
 * H6 Heading (smallest).
 */
export const H6 = ({ children, className }) => (
  <BaseHeading defaultStyle="text-base font-normal" className={className}>
    {children}
  </BaseHeading>
);
