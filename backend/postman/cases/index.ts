import { Folder } from '../lib/dsl';
import health from './00-health';
import login from './01-dang-nhap';
import auth from './02-auth';
import users from './03-users';
import catalog from './04-catalog';
import promotions from './05-promotions';
import loyalty from './06-loyalty';

// Mỗi chức năng thêm một file trong thư mục này và đăng ký ở đây (theo đúng thứ tự cần chạy)
export const FOLDERS: Folder[] = [health, login, auth, users, catalog, promotions, loyalty];
