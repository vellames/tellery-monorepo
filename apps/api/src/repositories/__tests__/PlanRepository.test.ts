import { PrismaClient, Plan } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';
import { PlanRepository } from '../PlanRepository';

const mockPlan = (overrides: Partial<Plan> = {}): Plan => ({
  id: 'plan-1',
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-01'),
  deletedAt: null,
  stripePriceId: 'price_1',
  name: 'Mensal',
  creditsPerCycle: 20,
  interval: 'month',
  active: true,
  ...overrides,
});

describe('PlanRepository', () => {
  let prisma: DeepMockProxy<PrismaClient>;
  let repo: PlanRepository;

  beforeEach(() => {
    prisma = mockDeep<PrismaClient>();
    repo = new PlanRepository(prisma);
  });

  afterEach(() => {
    mockReset(prisma);
  });

  describe('findByStripePriceId', () => {
    it('should find a non-deleted plan by its stripe price id', async () => {
      const plan = mockPlan();
      prisma.plan.findFirst.mockResolvedValue(plan);

      const result = await repo.findByStripePriceId('price_1');

      expect(result).toEqual(plan);
      expect(prisma.plan.findFirst).toHaveBeenCalledWith({
        where: { stripePriceId: 'price_1', deletedAt: null },
      });
    });

    it('should return null when no plan matches', async () => {
      prisma.plan.findFirst.mockResolvedValue(null);
      expect(await repo.findByStripePriceId('nope')).toBeNull();
    });
  });

  describe('findActive', () => {
    it('should return the first active plan ordered by createdAt asc', async () => {
      const plan = mockPlan();
      prisma.plan.findFirst.mockResolvedValue(plan);

      const result = await repo.findActive();

      expect(result).toEqual(plan);
      expect(prisma.plan.findFirst).toHaveBeenCalledWith({
        where: { active: true, deletedAt: null },
        orderBy: { createdAt: 'asc' },
      });
    });

    it('should return null when no active plan exists', async () => {
      prisma.plan.findFirst.mockResolvedValue(null);
      expect(await repo.findActive()).toBeNull();
    });
  });
});
