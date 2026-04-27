// Utility function for label colors
const colorClasses = {
  red: "bg-red-600",
  orange: "bg-orange-600",
  yellow: "bg-yellow-600",
  green: "bg-green-600",
  blue: "bg-blue-600",
  purple: "bg-purple-600",
  pink: "bg-pink-600",
  gray: "bg-gray-600",
};

export function getLabelColorClass(color: string): string {
  return colorClasses[color as keyof typeof colorClasses] || "bg-gray-600";
}

export const LABEL_COLORS = Object.keys(colorClasses);
