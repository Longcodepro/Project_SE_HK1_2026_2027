import { toUserView, User, UserView } from '../../users/domain/user';
import { TokenService } from '../domain/token.service';

export interface AuthResult {
  token: string;
  user: UserView;
}

export const buildAuthResult = (tokens: TokenService, user: User): AuthResult => ({
  token: tokens.issue(user).token,
  user: toUserView(user),
});
