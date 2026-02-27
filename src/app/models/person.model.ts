export interface Person {
  id: string;
  hoTen: string;
  doiThu: number; // Đời thứ mấy
  ngaySinh?: string;
  ngayMat?: string;
  viTri?: string; // Con cả, con thứ 2, 3...
  diaChiHienTai?: string;
  soDienThoai?: string;
  facebook?: string;
  zalo?: string;
  khac?: string;
  hinhAnh?: string; // base64 image
  // Family relationships (store IDs)
  chaId?: string;
  meId?: string;
  voChongId?: string; // ID vợ/chồng
  hoTenVoChong?: string; // Tên vợ/chồng (có thể không có trong hệ thống)
  conIds: string[]; // danh sách ID con
  anhChiEmIds: string[]; // danh sách ID anh chị em
  nganhId?: number; // Ngành (branch) in family tree
  ghiChu?: string;
  checkInImages?: string[]; // danh sách ảnh check-in base64 (tối đa 5)
  checkInDates?: string[]; // ngày check-in tương ứng
  createdAt?: string;
  updatedAt?: string;
}

export function createEmptyPerson(id?: string): Person {
  return {
    id: id || generateId(),
    hoTen: '',
    doiThu: 1,
    conIds: [],
    anhChiEmIds: [],
  };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}
