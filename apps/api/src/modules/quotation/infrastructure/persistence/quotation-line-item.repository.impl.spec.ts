import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { ConcurrentModificationError } from '../../../../shared/database';
import { QuotationLineItemRepositoryImpl } from './quotation-line-item.repository.impl';

describe('QuotationLineItemRepositoryImpl', () => {
  const tenantId = 'tenant-1';
  const quotationId = 'quotation-1';
  const itemId = 'item-1';

  const prismaLineItem = {
    id: itemId,
    tenantId,
    quotationId,
    description: 'Stage decoration',
    quantity: 1,
    unitPriceAmount: new Prisma.Decimal(5000),
    currency: 'INR',
    sortOrder: 0,
    createdAt: new Date('2026-07-08T00:00:00.000Z'),
    updatedAt: new Date('2026-07-08T00:00:00.000Z'),
    version: 1,
  };

  let prisma: {
    quotationLineItem: {
      create: jest.Mock;
      findFirst: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      deleteMany: jest.Mock;
      count: jest.Mock;
    };
    quotation: {
      update: jest.Mock;
    };
    $transaction: jest.Mock;
  };
  let repository: QuotationLineItemRepositoryImpl;

  beforeEach(() => {
    prisma = {
      quotationLineItem: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        deleteMany: jest.fn(),
        count: jest.fn(),
      },
      quotation: {
        update: jest.fn(),
      },
      $transaction: jest.fn((callback: (tx: typeof prisma) => unknown) =>
        callback(prisma),
      ),
    };

    repository = new QuotationLineItemRepositoryImpl(
      prisma as unknown as PrismaService,
    );
  });

  describe('createWithQuotationTotals', () => {
    it('creates the line item and updates quotation totals atomically', async () => {
      prisma.quotationLineItem.create.mockResolvedValue(prismaLineItem);
      prisma.quotation.update.mockResolvedValue({});

      const result = await repository.createWithQuotationTotals(
        tenantId,
        {
          quotationId,
          description: 'Stage decoration',
          unitPriceAmount: 5000,
        },
        { subtotalAmount: 5000, totalAmount: 5000 },
        1,
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.quotationLineItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          tenantId,
          quotationId,
          description: 'Stage decoration',
          unitPriceAmount: 5000,
        }),
      });
      expect(prisma.quotation.update).toHaveBeenCalledWith({
        where: { id: quotationId, tenantId, version: 1 },
        data: {
          subtotalAmount: 5000,
          totalAmount: 5000,
          version: { increment: 1 },
        },
      });
      expect(result.id).toBe(itemId);
    });

    it('throws ConcurrentModificationError when the quotation version mismatches', async () => {
      prisma.quotationLineItem.create.mockResolvedValue(prismaLineItem);
      prisma.quotation.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Not found', {
          code: 'P2025',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        repository.createWithQuotationTotals(
          tenantId,
          {
            quotationId,
            description: 'Stage decoration',
            unitPriceAmount: 5000,
          },
          { subtotalAmount: 5000, totalAmount: 5000 },
          99,
        ),
      ).rejects.toBeInstanceOf(ConcurrentModificationError);
    });
  });

  describe('updateWithQuotationTotals', () => {
    it('updates the line item and the quotation totals atomically', async () => {
      prisma.quotationLineItem.update.mockResolvedValue({
        ...prismaLineItem,
        quantity: 3,
        version: 2,
      });
      prisma.quotation.update.mockResolvedValue({});

      const result = await repository.updateWithQuotationTotals(
        tenantId,
        itemId,
        { quantity: 3 },
        1,
        { subtotalAmount: 15000, totalAmount: 15000 },
        1,
      );

      expect(prisma.quotationLineItem.update).toHaveBeenCalledWith({
        where: { id: itemId, tenantId, version: 1 },
        data: {
          description: undefined,
          quantity: 3,
          unitPriceAmount: undefined,
          sortOrder: undefined,
          version: { increment: 1 },
        },
      });
      expect(prisma.quotation.update).toHaveBeenCalledWith({
        where: { id: quotationId, tenantId, version: 1 },
        data: {
          subtotalAmount: 15000,
          totalAmount: 15000,
          version: { increment: 1 },
        },
      });
      expect(result.quantity).toBe(3);
      expect(result.version).toBe(2);
    });

    it('throws ConcurrentModificationError when the line item version mismatches', async () => {
      prisma.quotationLineItem.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Not found', {
          code: 'P2025',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        repository.updateWithQuotationTotals(
          tenantId,
          itemId,
          { quantity: 3 },
          99,
          { subtotalAmount: 15000, totalAmount: 15000 },
          1,
        ),
      ).rejects.toBeInstanceOf(ConcurrentModificationError);
    });

    it('throws ConcurrentModificationError when the quotation version mismatches', async () => {
      prisma.quotationLineItem.update.mockResolvedValue({
        ...prismaLineItem,
        quantity: 3,
        version: 2,
      });
      prisma.quotation.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Not found', {
          code: 'P2025',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        repository.updateWithQuotationTotals(
          tenantId,
          itemId,
          { quantity: 3 },
          1,
          { subtotalAmount: 15000, totalAmount: 15000 },
          99,
        ),
      ).rejects.toBeInstanceOf(ConcurrentModificationError);
    });
  });

  describe('removeWithQuotationTotals', () => {
    it('removes the line item and updates the quotation totals atomically', async () => {
      prisma.quotationLineItem.deleteMany.mockResolvedValue({ count: 1 });
      prisma.quotation.update.mockResolvedValue({});

      await repository.removeWithQuotationTotals(
        tenantId,
        itemId,
        quotationId,
        { subtotalAmount: 0, totalAmount: 0 },
        1,
      );

      expect(prisma.quotationLineItem.deleteMany).toHaveBeenCalledWith({
        where: { id: itemId, tenantId },
      });
      expect(prisma.quotation.update).toHaveBeenCalledWith({
        where: { id: quotationId, tenantId, version: 1 },
        data: {
          subtotalAmount: 0,
          totalAmount: 0,
          version: { increment: 1 },
        },
      });
    });

    it('throws ConcurrentModificationError when the quotation version mismatches', async () => {
      prisma.quotationLineItem.deleteMany.mockResolvedValue({ count: 1 });
      prisma.quotation.update.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Not found', {
          code: 'P2025',
          clientVersion: '7.8.0',
        }),
      );

      await expect(
        repository.removeWithQuotationTotals(
          tenantId,
          itemId,
          quotationId,
          { subtotalAmount: 0, totalAmount: 0 },
          99,
        ),
      ).rejects.toBeInstanceOf(ConcurrentModificationError);
    });
  });
});
