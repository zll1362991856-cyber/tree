export interface WishState {
  text: string;
  loading: boolean;
  error: string | null;
}

export interface TreeConfig {
  particleCount: number;
  height: number;
  radius: number;
  spinSpeed: number;
}
