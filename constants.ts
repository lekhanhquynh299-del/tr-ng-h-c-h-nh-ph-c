import { Student, Teacher } from './types';

export const ADMIN_PASSWORD = '@123@456@bato';

// Chỉ giữ đúng 2 giáo viên tư vấn để liên hệ
export const TEACHERS: Teacher[] = [
  { name: 'Cô Phương (HT)', phone: '0979458347', email: 'tuvan1.trunghoccosobato@gmail.com' },
  { name: 'Cô Hiên (PHT)', phone: '0982330983', email: 'tuvan2.trunghoccosobato@gmail.com' },
];

// Danh sách 30 học sinh chính xác từ yêu cầu
export const STUDENTS: Student[] = [
  { name: 'Oanh', id: '5140821837', class: '8A2' },
  { name: 'Ái Nhi', id: '5169641225', class: '9A2' },
  { name: 'Thanh Ngân', id: '5184197132', class: '7A2' },
  { name: 'Trần Lê Anh Thư', id: '5121831273', class: '8A1' },
  { name: 'Đinh Nguyễn Anh Khôi', id: '5179639553', class: '8A1' },
  { name: 'Đặng Thị Thanh Hoài', id: '5179639540', class: '8A1' },
  { name: 'Cát Tường', id: '5169641197', class: '9A1' },
  { name: 'Khang', id: '5169641165', class: '9A1' },
  { name: 'Trâm', id: '5184197203', class: '7A3' },
  { name: 'Bảo Nhi', id: '5184197066', class: '7A1' },
  { name: 'Mai Linh', id: '5184197057', class: '7A1' },
  { name: 'Phúc', id: '5179639866', class: '8A4' },
  { name: 'Na', id: '5179639647', class: '8A2' },
  { name: 'Trang', id: '5179639798', class: '8A3' },
  { name: 'Khánh Vy', id: '5179639810', class: '8A3' },
  { name: 'Trọng', id: '5179639800', class: '8A3' },
  { name: 'Nhi', id: '5169641267', class: '9A3' },
  { name: 'My', id: '5169641310', class: '9A4' },
  { name: 'Châu', id: '5184197159', class: '7A3' },
  { name: 'Châu', id: '5184197095', class: '7A2' },
  { name: 'Thảo Nguyên', id: '5184197238', class: '7A4' },
  { name: 'Ngân', id: '5179639565', class: '8A1' },
  { name: 'Quang Trường', id: '5191725338', class: '6A3' },
  { name: 'Yến', id: '5191725339', class: '6A3' },
  { name: 'Hà Linh', id: '5190509312', class: '6A1' },
  { name: 'Thảo Nguyên', id: '5169641173', class: '9A1' },
  { name: 'Luân', id: '5169641170', class: '9A1' },
  { name: 'Thuyền', id: '5169641189', class: '9A1' },
  { name: 'Ly', id: '5169641171', class: '9A1' },
  { name: 'Trâm', id: '5169641193', class: '9A1' },
];

export const DEFAULT_STUDENT_PASSWORD = '123';