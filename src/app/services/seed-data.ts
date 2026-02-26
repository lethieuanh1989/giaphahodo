import { Person } from '../models/person.model';
import chungData from '../../assets/data/gia-pha-goc-chung.json';
import nganh2Chi2Data from '../../assets/data/gia-pha-nganh-2-chi-2.json';

export const SEED_DATA_CHUNG: Person[] = chungData as Person[];
export const SEED_DATA_NGANH2_CHI2: Person[] = nganh2Chi2Data as Person[];

export type BranchKey = 'chung' | 'nganh2-chi2';

export interface BranchInfo {
  key: BranchKey;
  label: string;
  data: Person[];
  treeImage: string; // path to static image in assets
}

export const BRANCHES: BranchInfo[] = [
  {
    key: 'chung',
    label: 'Chung',
    data: SEED_DATA_CHUNG,
    treeImage: 'assets/images/gia-pha-chung.jpg',
  },
  {
    key: 'nganh2-chi2',
    label: 'Ngành 2 - Chi 2',
    data: SEED_DATA_NGANH2_CHI2,
    treeImage: 'assets/images/gia-pha-nganh2-chi2.jpg',
  },
];
