import {BulletData} from './BulletData.ts';
export type WeaponData = {
    bulletCount: number;
    spreadAngle: number;
    fireDelay: number;
    bullet: BulletData;
};
