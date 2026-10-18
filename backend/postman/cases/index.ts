import { Folder } from '../lib/dsl';
import health from './00-health';

// Mỗi chức năng thêm một file trong thư mục này và đăng ký ở đây (theo đúng thứ tự cần chạy)
export const FOLDERS: Folder[] = [health];
