export type BadgeVariant = 'default' | 'rating' | 'hd' | 'accent';

export interface IBadgeGlobalProps {
  text: string;
  variant?: BadgeVariant;
  testID?: string;
}
