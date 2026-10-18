import { Page, PageRequest } from '../../../shared/domain/page';
import { LoyaltySettings, RewardRule } from './loyalty';

export interface NewRule extends Omit<RewardRule, 'id' | 'isActive'> {}
export type RulePatch = Partial<Omit<RewardRule, 'id' | 'kind' | 'productIds'>>;

export interface UserCounters {
  loyaltyPoints: number;
  totalCups: number;
}

export abstract class LoyaltyRepository {
  abstract getSettings(): Promise<LoyaltySettings>;
  abstract updateSettings(patch: Partial<LoyaltySettings>): Promise<LoyaltySettings>;
  abstract listRules(page: PageRequest): Promise<Page<RewardRule>>;
  abstract listActiveRules(): Promise<RewardRule[]>;
  abstract findRule(id: number): Promise<RewardRule | null>;
  abstract createRule(data: NewRule): Promise<RewardRule>;
  abstract updateRule(id: number, patch: RulePatch): Promise<RewardRule>;
  abstract counters(userId: number): Promise<UserCounters | null>;
  abstract addCounters(userId: number, points: number, cups: number): Promise<UserCounters>;
  // Trừ nhưng không xuống dưới 0 (BR51)
  abstract subtractCounters(userId: number, points: number, cups: number): Promise<void>;
  abstract voucherStats(userId: number, now: Date): Promise<{ granted: number; usable: number }>;
}
