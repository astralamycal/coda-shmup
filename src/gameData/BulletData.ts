export type BulletData = {
    width: number;
    height: number;
    color: string; // "#rrggbb", readable in JSON
    outline?: string; // optional "#rrggbb" border, to make bullets easier to see
    speed: number;
    damage: number;
};
