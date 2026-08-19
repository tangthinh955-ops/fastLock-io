import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

// 'roles' là chiếc chìa khóa (key) dùng để cất giữ danh sách các quyền hạn
export const ROLES_KEY = 'roles';

// Đây là một Custom Decorator (như một cái nhãn dán). 
// Khi ta dán @Roles(Role.ADMIN) lên một API, nó sẽ lấy chữ 'ADMIN' cất vào hộp có chìa khóa là 'roles'.
// Sau này thằng RolesGuard sẽ cầm chìa khóa 'roles' ra mở hộp để kiểm tra xem API này đòi hỏi quyền gì.
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
