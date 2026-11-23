import { HttpException } from '@nestjs/common';
import { GUARDS_METADATA } from '@nestjs/common/constants';
import { failure, success } from '../../../shared/application/result';
import { IS_PUBLIC_KEY } from '../../auth/presentation/decorators/public.decorator';
import { PERMISSIONS_KEY } from '../../auth/presentation/decorators/permissions.decorator';
import type { EnquiriesAdminApplicationService } from '../application/services/enquiries-admin.application.service';
import type { EnquiriesSyncApplicationService } from '../application/services/enquiries-sync.application.service';
import type { EnquiriesSyncBody } from './schemas/enquiries-sync.schemas';
import { EnquiriesFeedController } from './enquiries-feed.controller';
import { EnquiriesSignatureGuard } from './guards/enquiries-signature.guard';

describe('EnquiriesFeedController (M5-01)', () => {
  const deliveryId = '5b8f6b44-3c58-4e3d-8c1a-0a6e4f1a2b3c';
  const body = { enquiryId: 'enq-1' } as unknown as EnquiriesSyncBody;

  let syncService: { sync: jest.Mock };
  let adminService: Record<string, jest.Mock>;
  let controller: EnquiriesFeedController;

  beforeEach(() => {
    syncService = { sync: jest.fn() };
    adminService = {
      getStatus: jest.fn(),
      backfillCheck: jest.fn(),
      getSyncedFinancials: jest.fn(),
    };
    controller = new EnquiriesFeedController(
      syncService as unknown as EnquiriesSyncApplicationService,
      adminService as unknown as EnquiriesAdminApplicationService,
    );
  });

  describe('routing metadata', () => {
    it('makes the feed @Public (no JWT) but signature-guarded', () => {
      const handler = EnquiriesFeedController.prototype.sync;

      expect(Reflect.getMetadata(IS_PUBLIC_KEY, handler)).toBe(true);
      expect(Reflect.getMetadata(GUARDS_METADATA, handler)).toContain(
        EnquiriesSignatureGuard,
      );
    });

    it('requires dedicated permissions on the authenticated routes', () => {
      const proto = EnquiriesFeedController.prototype;

      expect(Reflect.getMetadata(PERMISSIONS_KEY, proto.status)).toEqual([
        'integrations:enquiries:manage',
      ]);
      expect(Reflect.getMetadata(PERMISSIONS_KEY, proto.backfillCheck)).toEqual(
        ['integrations:enquiries:manage'],
      );
      expect(Reflect.getMetadata(PERMISSIONS_KEY, proto.financials)).toEqual([
        'integrations:financials:read',
      ]);
      expect(Reflect.getMetadata(IS_PUBLIC_KEY, proto.status)).toBeUndefined();
    });
  });

  describe('sync', () => {
    it('returns the bare machine response (no { data } envelope)', async () => {
      syncService.sync.mockResolvedValue(success({ ok: true, eventId: 'e-1' }));

      const response = await controller.sync(deliveryId, body);

      expect(response).toEqual({ ok: true, eventId: 'e-1' });
      expect(syncService.sync).toHaveBeenCalledWith(deliveryId, body);
    });

    it('passes ignored and duplicate acknowledgements through unchanged', async () => {
      syncService.sync.mockResolvedValueOnce(
        success({ ok: true, ignored: 'stale' }),
      );
      syncService.sync.mockResolvedValueOnce(
        success({ ok: true, duplicate: true }),
      );

      expect(await controller.sync(deliveryId, body)).toEqual({
        ok: true,
        ignored: 'stale',
      });
      expect(await controller.sync(deliveryId, body)).toEqual({
        ok: true,
        duplicate: true,
      });
    });

    it.each([undefined, '', 'short', 'bad id!', 'id/with/slash'])(
      'rejects delivery id %p with 400 VALIDATION_ERROR before processing',
      async (header) => {
        await expect(controller.sync(header, body)).rejects.toMatchObject({
          status: 400,
          response: expect.objectContaining({
            code: 'VALIDATION_ERROR',
            details: expect.objectContaining({
              details: expect.arrayContaining([
                expect.objectContaining({
                  path: 'X-EventOS-Delivery-Id',
                  message: expect.any(String),
                }),
              ]),
            }),
          }),
        });

        expect(syncService.sync).not.toHaveBeenCalled();
      },
    );

    it('accepts a hash-formatted opaque delivery id', async () => {
      syncService.sync.mockResolvedValue(success({ ok: true, eventId: 'e-1' }));
      const hashId = 'a1b2c3d4e5f6789012345678abcdef01';

      await expect(controller.sync(hashId, body)).resolves.toEqual({
        ok: true,
        eventId: 'e-1',
      });
      expect(syncService.sync).toHaveBeenCalledWith(hashId, body);
    });

    it('lets processing failures surface as errors so the sender retries (5xx)', async () => {
      syncService.sync.mockRejectedValue(new Error('db down'));

      await expect(controller.sync(deliveryId, body)).rejects.toThrow(
        'db down',
      );
    });
  });

  describe('admin routes', () => {
    it('wraps results in the standard data envelope', async () => {
      adminService.getStatus.mockResolvedValue(success({ last24h: {} }));
      adminService.backfillCheck.mockResolvedValue(
        success({ missing: [], stale: [], upToDate: 0 }),
      );

      expect(await controller.status()).toEqual({ data: { last24h: {} } });
      expect(await controller.backfillCheck('tenant-1', { items: [] })).toEqual(
        { data: { missing: [], stale: [], upToDate: 0 } },
      );
      expect(adminService.backfillCheck).toHaveBeenCalledWith('tenant-1', []);
    });

    it('maps a missing financial summary to 404', async () => {
      adminService.getSyncedFinancials.mockResolvedValue(
        failure('NOT_FOUND', 'none'),
      );

      await expect(
        controller.financials('tenant-1', 'booking-1'),
      ).rejects.toBeInstanceOf(HttpException);
      await expect(
        controller.financials('tenant-1', 'booking-1'),
      ).rejects.toMatchObject({ status: 404 });
    });
  });
});
