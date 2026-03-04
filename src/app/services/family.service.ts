import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Subscription } from 'rxjs';
import { Person } from '../models/person.model';
import { BRANCHES, BranchKey, BranchInfo } from './seed-data';
import { FirebaseService } from './firebase.service';

@Injectable({ providedIn: 'root' })
export class FamilyService {
  private firebaseService = inject(FirebaseService);
  private people$ = new BehaviorSubject<Person[]>([]);
  private allPeople$ = new BehaviorSubject<Person[]>([]);
  private spouses$ = new BehaviorSubject<Person[]>([]);
  private branchDataMap = new Map<BranchKey, Person[]>();
  private branchSubs = new Map<BranchKey, Subscription>();
  private currentBranch$ = new BehaviorSubject<BranchKey>('chung');
  private peopleSub?: Subscription;
  private spouseSub?: Subscription;
  private seeding = false;

  constructor() {
    console.log('[GP-DEBUG] FamilyService constructor, defaultBranch:', this.currentBranch$.value);
    this.loadAllBranches();
    this.loadBranch(this.currentBranch$.value);
    this.loadSpouses();
  }

  // --- Branch management ---

  getBranches(): BranchInfo[] {
    return BRANCHES;
  }

  getCurrentBranch(): BranchKey {
    return this.currentBranch$.value;
  }

  getCurrentBranchInfo(): BranchInfo {
    return BRANCHES.find(b => b.key === this.currentBranch$.value) || BRANCHES[0];
  }

  getBranchObservable() {
    return this.currentBranch$.asObservable();
  }

  switchBranch(key: BranchKey): void {
    this.currentBranch$.next(key);
    this.loadBranch(key);
  }

  private async loadBranch(key: BranchKey): Promise<void> {
    console.log(`[GP-DEBUG] loadBranch('${key}') START`);
    // Unsubscribe from previous branch
    this.peopleSub?.unsubscribe();

    try {
      // Check if branch needs seeding
      const seeded = await this.firebaseService.isBranchSeeded(key);
      if (!seeded && !this.seeding) {
        console.log(`[GP-DEBUG] loadBranch('${key}') → seeding...`);
        this.seeding = true;
        const branch = BRANCHES.find(b => b.key === key);
        if (branch) {
          await this.firebaseService.seedBranch(key, branch.data);
        }
        this.seeding = false;
      }

      // Subscribe to realtime updates
      this.peopleSub = this.firebaseService.getPeople(key).subscribe({
        next: people => {
          console.log(`[GP-DEBUG] loadBranch('${key}') people$ received ${people.length} people`);
          this.people$.next(people);
        },
        error: (err) => {
          console.error(`[GP-DEBUG] loadBranch('${key}') ERROR:`, err);
          this.loadFromLocal(key);
        },
      });
    } catch (err) {
      console.error(`[GP-DEBUG] loadBranch('${key}') CATCH:`, err);
      this.loadFromLocal(key);
    }
  }

  private loadFromLocal(key: BranchKey): void {
    const branch = BRANCHES.find(b => b.key === key);
    if (branch) {
      this.people$.next(branch.data);
    }
  }

  private loadAllBranches(): void {
    console.log(`[GP-DEBUG] loadAllBranches() subscribing to ${BRANCHES.length} branches:`, BRANCHES.map(b => b.key));
    for (const branch of BRANCHES) {
      try {
        const sub = this.firebaseService.getPeople(branch.key).subscribe({
          next: people => {
            console.log(`[GP-DEBUG] loadAllBranches('${branch.key}') received ${people.length} people`);
            this.branchDataMap.set(branch.key, people);
            this.rebuildAllPeople();
          },
          error: (err) => {
            console.error(`[GP-DEBUG] loadAllBranches('${branch.key}') ERROR:`, err);
            this.branchDataMap.set(branch.key, branch.data);
            this.rebuildAllPeople();
          },
        });
        this.branchSubs.set(branch.key, sub);
      } catch (err) {
        console.error(`[GP-DEBUG] loadAllBranches('${branch.key}') CATCH:`, err);
        this.branchDataMap.set(branch.key, branch.data);
        this.rebuildAllPeople();
      }
    }
  }

  private loadSpouses(): void {
    this.spouseSub = this.firebaseService.getSpouses().subscribe({
      next: spouses => {
        console.log(`[GP-DEBUG] loadSpouses() received ${spouses.length} spouses`);
        this.spouses$.next(spouses);
      },
      error: err => {
        console.error('[GP-DEBUG] loadSpouses() ERROR:', err);
      },
    });
  }

  private rebuildAllPeople(): void {
    // Dùng Map để dedup - khi trùng ID, ưu tiên bản từ đúng branch
    const personMap = new Map<string, Person>();
    const duplicates: string[] = [];

    for (const [branchKey, people] of this.branchDataMap.entries()) {
      for (const p of people) {
        const existing = personMap.get(p.id);
        if (!existing) {
          personMap.set(p.id, p);
        } else {
          duplicates.push(`${p.id}(in ${branchKey})`);
          // Trùng ID → ưu tiên bản từ đúng branch (home branch)
          if (this.isHomeBranch(p.id, branchKey)) {
            personMap.set(p.id, p);
          }
        }
      }
    }

    const allPeople = [...personMap.values()];
    console.log(`[GP-DEBUG] rebuildAllPeople(): ${allPeople.length} unique people from ${this.branchDataMap.size} branches`);
    if (duplicates.length > 0) {
      console.log(`[GP-DEBUG] rebuildAllPeople() duplicates:`, duplicates);
    }
    this.allPeople$.next(allPeople);
  }

  /** Xác định person ID thuộc branch nào dựa trên prefix và seed data */
  private isHomeBranch(personId: string, branchKey: BranchKey): boolean {
    // ID có prefix n2c2- → thuộc nganh2-chi2
    if (personId.startsWith('n2c2-')) return branchKey === 'nganh2-chi2';
    // ID không có prefix → kiểm tra seed data
    const seedBranch = BRANCHES.find(b => b.data.some(p => p.id === personId));
    if (seedBranch) return seedBranch.key === branchKey;
    // ID dynamic (không có trong seed) → chấp nhận bản mới nhất
    return true;
  }

  /** Xóa documents bị duplicate ở sai branch (do bug trước đó) */
  async cleanupDuplicates(): Promise<void> {
    let cleaned = 0;
    for (const [branchKey, people] of this.branchDataMap.entries()) {
      for (const p of people) {
        if (!this.isHomeBranch(p.id, branchKey)) {
          console.log(`[GP-DEBUG] cleanupDuplicates: DELETING ${p.id} from wrong branch '${branchKey}'`);
          await this.firebaseService.deletePerson(branchKey, p.id);
          cleaned++;
        }
      }
    }
    console.log(`[GP-DEBUG] cleanupDuplicates: removed ${cleaned} duplicates`);
  }

  // --- Data access ---

  getAllPeople(): Person[] {
    return this.people$.value;
  }

  getPeopleObservable() {
    return this.people$.asObservable();
  }

  getAllPeopleObservable() {
    return this.allPeople$.asObservable();
  }

  getPersonById(id: string): Person | undefined {
    const fromBranch = this.people$.value.find(p => p.id === id);
    const fromAll = this.allPeople$.value.find(p => p.id === id);
    const result = fromBranch || fromAll;
    if (!result) {
      console.warn(`[GP-DEBUG] getPersonById('${id}') NOT FOUND! people$: ${this.people$.value.length}, allPeople$: ${this.allPeople$.value.length}`);
    }
    return result;
  }

  getPersonByName(name: string): Person | undefined {
    const normalized = name.trim().toLowerCase();
    return this.allPeople$.value.find(
      p => p.hoTen.toLowerCase() === normalized
    );
  }

  searchPeople(query: string): Person[] {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    const results = this.allPeople$.value.filter(
      p =>
        p.hoTen.toLowerCase().includes(normalized) ||
        (p.hoTenVoChong && p.hoTenVoChong.toLowerCase().includes(normalized)) ||
        (p.diaChiHienTai && p.diaChiHienTai.toLowerCase().includes(normalized)) ||
        (p.soDienThoai && p.soDienThoai.includes(normalized)) ||
        (p.doiThu && p.doiThu.toString() === normalized)
    );
    console.log(`[GP-DEBUG] searchPeople('${query}') → ${results.length} results:`, results.map(p => `${p.id}|${p.hoTen}`));
    return results;
  }

  // --- Spouses (vợ/chồng ngoài họ Đỗ) ---

  getSpouses(): Person[] {
    return this.spouses$.value;
  }

  getSpouseById(id: string): Person | undefined {
    return this.spouses$.value.find(p => p.id === id);
  }

  /** Tìm thành viên họ Đỗ có hoTenVoChong khớp */
  getPersonBySpouseName(name: string): Person | undefined {
    const normalized = name.trim().toLowerCase();
    return this.allPeople$.value.find(
      p => p.hoTenVoChong && p.hoTenVoChong.toLowerCase() === normalized
    );
  }

  async saveSpouse(person: Person): Promise<void> {
    await this.firebaseService.saveSpouse(person);
    // Cập nhật local
    const current = this.spouses$.value;
    const idx = current.findIndex(p => p.id === person.id);
    if (idx >= 0) {
      current[idx] = { ...person };
      this.spouses$.next([...current]);
    } else {
      this.spouses$.next([...current, person]);
    }
  }

  /** Xóa tất cả duplicates cùng tên, chỉ giữ lại bản đầu tiên (theo ID ngắn nhất = bản gốc) */
  async cleanupDuplicatesByName(hoTen: string): Promise<number> {
    const matches = this.allPeople$.value.filter(p => p.hoTen === hoTen);
    if (matches.length <= 1) {
      console.log(`[GP-DEBUG] cleanupDuplicatesByName('${hoTen}'): chỉ có ${matches.length}, không cần xóa`);
      return 0;
    }

    // Sắp xếp: ID ngắn nhất (bản gốc) lên đầu
    matches.sort((a, b) => a.id.length - b.id.length || a.id.localeCompare(b.id));
    const keep = matches[0];
    const toDelete = matches.slice(1);

    console.log(`[GP-DEBUG] cleanupDuplicatesByName('${hoTen}'): giữ '${keep.id}', xóa ${toDelete.length}:`, toDelete.map(p => p.id));

    for (const p of toDelete) {
      const branchKey = this.getBranchForPerson(p.id);
      await this.firebaseService.deletePerson(branchKey, p.id);
    }

    return toDelete.length;
  }

  // --- ID generation ---

  private generateChildId(branchKey: BranchKey, doiThu: number, hoTen: string): string {
    const slug = this.slugify(hoTen);
    const prefix = branchKey === 'chung' ? '' : 'n2c2-';
    const baseId = `${prefix}doi${doiThu}-${slug}`;

    // Kiểm tra trùng ID, thêm suffix nếu cần
    const exists = (id: string) =>
      this.allPeople$.value.some(p => p.id === id) ||
      this.people$.value.some(p => p.id === id);

    if (!exists(baseId)) return baseId;

    let counter = 2;
    while (exists(`${baseId}${counter}`)) counter++;
    return `${baseId}${counter}`;
  }

  private slugify(name: string): string {
    const diacriticsMap: Record<string, string> = {
      'à':'a','á':'a','ả':'a','ã':'a','ạ':'a',
      'ă':'a','ằ':'a','ắ':'a','ẳ':'a','ẵ':'a','ặ':'a',
      'â':'a','ầ':'a','ấ':'a','ẩ':'a','ẫ':'a','ậ':'a',
      'đ':'d',
      'è':'e','é':'e','ẻ':'e','ẽ':'e','ẹ':'e',
      'ê':'e','ề':'e','ế':'e','ể':'e','ễ':'e','ệ':'e',
      'ì':'i','í':'i','ỉ':'i','ĩ':'i','ị':'i',
      'ò':'o','ó':'o','ỏ':'o','õ':'o','ọ':'o',
      'ô':'o','ồ':'o','ố':'o','ổ':'o','ỗ':'o','ộ':'o',
      'ơ':'o','ờ':'o','ớ':'o','ở':'o','ỡ':'o','ợ':'o',
      'ù':'u','ú':'u','ủ':'u','ũ':'u','ụ':'u',
      'ư':'u','ừ':'u','ứ':'u','ử':'u','ữ':'u','ự':'u',
      'ỳ':'y','ý':'y','ỷ':'y','ỹ':'y','ỵ':'y',
    };
    return name
      .toLowerCase()
      .split('')
      .map(c => diacriticsMap[c] || c)
      .join('')
      .replace(/[^a-z0-9]/g, '');
  }

  // --- Branch lookup ---

  private getBranchForPerson(personId: string): BranchKey {
    // 1. Tìm trong branchDataMap (live Firestore data)
    for (const [branchKey, people] of this.branchDataMap.entries()) {
      if (people.some(p => p.id === personId)) {
        return branchKey;
      }
    }
    // 2. Fallback: tìm trong local seed data (JSON gốc)
    for (const branch of BRANCHES) {
      if (branch.data.some(p => p.id === personId)) {
        return branch.key;
      }
    }
    // 3. Fallback cuối: branch hiện tại
    return this.currentBranch$.value;
  }

  // --- Local state update (không chờ Firestore subscription) ---

  private updateLocalPerson(person: Person): void {
    // Cập nhật trong people$ (current branch)
    const currentPeople = this.people$.value;
    const idx = currentPeople.findIndex(p => p.id === person.id);
    if (idx >= 0) {
      currentPeople[idx] = { ...person };
      this.people$.next([...currentPeople]);
    }

    // Cập nhật trong branchDataMap
    for (const [key, people] of this.branchDataMap.entries()) {
      const i = people.findIndex(p => p.id === person.id);
      if (i >= 0) {
        people[i] = { ...person };
        this.branchDataMap.set(key, [...people]);
        break;
      }
    }
    this.rebuildAllPeople();
  }

  private addLocalPerson(branchKey: BranchKey, person: Person): void {
    // Thêm vào people$ nếu cùng branch hiện tại
    if (branchKey === this.currentBranch$.value) {
      this.people$.next([...this.people$.value, person]);
    }

    // Thêm vào branchDataMap
    const branchPeople = this.branchDataMap.get(branchKey) || [];
    this.branchDataMap.set(branchKey, [...branchPeople, person]);
    this.rebuildAllPeople();
  }

  // --- CRUD ---

  async savePerson(person: Person): Promise<void> {
    const branchKey = this.getBranchForPerson(person.id);
    console.log(`[GP-DEBUG] savePerson('${person.id}') → branch='${branchKey}'`, person);
    await this.firebaseService.savePerson(branchKey, person);
    console.log(`[GP-DEBUG] savePerson('${person.id}') Firestore OK, updating local...`);
    this.updateLocalPerson(person);
  }

  async addPerson(person: Person): Promise<void> {
    const branchKey = this.getBranchForPerson(person.id);
    await this.firebaseService.addPerson(branchKey, person);
    this.addLocalPerson(branchKey, person);
  }

  async addChild(parentId: string, childData: { hoTen: string; viTri?: string }): Promise<Person> {
    const branchKey = this.getBranchForPerson(parentId);
    console.log(`[GP-DEBUG] addChild() parentId='${parentId}' → branch='${branchKey}'`);
    const parent = this.getPersonById(parentId);
    if (!parent) throw new Error('Không tìm thấy cha/mẹ');

    // Tạo person mới với ID theo convention
    const childId = this.generateChildId(branchKey, parent.doiThu + 1, childData.hoTen);
    console.log(`[GP-DEBUG] addChild() generated childId='${childId}'`);
    const existingSiblingIds = [...(parent.conIds || [])];
    const child: Person = {
      id: childId,
      hoTen: childData.hoTen,
      doiThu: parent.doiThu + 1,
      chaId: parentId,
      conIds: [],
      anhChiEmIds: [...existingSiblingIds],
      nganhId: parent.nganhId,
    };
    if (childData.viTri) {
      child.viTri = childData.viTri;
    }

    // Chuẩn bị batch operations (atomic - tất cả thành công hoặc tất cả thất bại)
    const newParentConIds = [...(parent.conIds || []), childId];
    const operations: { type: 'add' | 'update'; person: Person }[] = [
      { type: 'add', person: child },
      { type: 'update', person: { ...parent, conIds: newParentConIds } },
    ];

    for (const siblingId of existingSiblingIds) {
      const sibling = this.getPersonById(siblingId);
      if (sibling) {
        operations.push({
          type: 'update',
          person: { ...sibling, anhChiEmIds: [...(sibling.anhChiEmIds || []), childId] },
        });
      }
    }

    // Ghi atomic vào Firestore
    console.log(`[GP-DEBUG] addChild() batch ops:`, operations.map(op => `${op.type}:${op.person.id}`));
    await this.firebaseService.batchWritePersons(branchKey, operations);
    console.log(`[GP-DEBUG] addChild() Firestore batch OK, updating local...`);

    // Firestore batch thành công → cập nhật local state
    this.addLocalPerson(branchKey, child);
    this.updateLocalPerson({ ...parent, conIds: newParentConIds });

    for (const siblingId of existingSiblingIds) {
      const sibling = this.getPersonById(siblingId);
      if (sibling) {
        this.updateLocalPerson({ ...sibling, anhChiEmIds: [...(sibling.anhChiEmIds || []), childId] });
      }
    }

    return child;
  }

  async deletePerson(personId: string): Promise<void> {
    const branchKey = this.getBranchForPerson(personId);
    const person = this.getPersonById(personId);
    if (!person) return;

    // Xóa khỏi conIds của cha
    if (person.chaId) {
      const father = this.getPersonById(person.chaId);
      if (father) {
        await this.firebaseService.updatePersonField(branchKey, person.chaId, {
          conIds: father.conIds.filter(id => id !== personId),
        });
      }
    }

    // Xóa khỏi anhChiEmIds của anh chị em
    for (const siblingId of person.anhChiEmIds) {
      const sibling = this.getPersonById(siblingId);
      if (sibling) {
        await this.firebaseService.updatePersonField(branchKey, siblingId, {
          anhChiEmIds: sibling.anhChiEmIds.filter(id => id !== personId),
        });
      }
    }

    // Xóa document
    await this.firebaseService.deletePerson(branchKey, personId);
  }

  // --- Relations ---

  getChildren(personId: string): Person[] {
    const person = this.getPersonById(personId);
    if (!person) return [];
    return person.conIds
      .map(id => this.getPersonById(id))
      .filter((p): p is Person => !!p);
  }

  getSiblings(personId: string): Person[] {
    const person = this.getPersonById(personId);
    if (!person) return [];
    return person.anhChiEmIds
      .map(id => this.getPersonById(id))
      .filter((p): p is Person => !!p);
  }

  getFather(personId: string): Person | undefined {
    const person = this.getPersonById(personId);
    if (!person || !person.chaId) return undefined;
    return this.getPersonById(person.chaId);
  }

  getMother(personId: string): Person | undefined {
    const person = this.getPersonById(personId);
    if (!person || !person.meId) return undefined;
    return this.getPersonById(person.meId);
  }
}
