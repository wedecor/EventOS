import { apiClient } from '@/shared/api/client';
import {
  findInventoryItemInList,
  parseDamageNote,
  parseInventoryDamageReport,
  parseInventoryDamageReportList,
  parseInventoryItem,
  parseInventoryItemList,
  parseInventoryMovement,
  parseInventoryMovementList,
  parseInventoryReservation,
  parseInventoryReservationList,
  parseInventoryVerification,
  parseInventoryVerificationList,
  type AddDamageNoteRequest,
  type CreateInventoryDamageReportRequest,
  type CreateInventoryItemRequest,
  type CreateInventoryMovementRequest,
  type CreateInventoryReservationRequest,
  type CreateInventoryVerificationRequest,
  type DamageNote,
  type InventoryDamageReport,
  type InventoryItem,
  type InventoryMovement,
  type InventoryReservation,
  type InventoryVerification,
  type ListInventoryItemsQuery,
  type ModifyInventoryReservationRequest,
  type TransitionInventoryMovementRequest,
  type UpdateInventoryItemRequest,
} from '../schemas/inventory.schemas';

function ifMatchHeader(version: number): Record<string, string> {
  return { 'If-Match': `"${version}"` };
}

/**
 * Inventory master + booking-scoped movements + P2-07 ops lifecycle.
 */
export const inventoryApi = {
  async listItems(query: ListInventoryItemsQuery = {}): Promise<InventoryItem[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/inventory/items', {
      params: {
        ...(query.status ? { status: query.status } : {}),
        ...(query.taxonomy ? { taxonomy: query.taxonomy } : {}),
        ...(query.category?.trim() ? { category: query.category.trim() } : {}),
      },
    });
    return parseInventoryItemList(data);
  },

  async getItemById(id: string): Promise<InventoryItem> {
    const items = await inventoryApi.listItems();
    return findInventoryItemInList(items, id);
  },

  async createItem(body: CreateInventoryItemRequest): Promise<InventoryItem> {
    const { data } = await apiClient.post<unknown>(
      '/api/v1/inventory/items',
      body,
    );
    return parseInventoryItem(data);
  },

  async updateItem(
    id: string,
    body: UpdateInventoryItemRequest,
    version: number,
  ): Promise<InventoryItem> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/inventory/items/${id}`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseInventoryItem(data);
  },

  async listAllMovements(): Promise<InventoryMovement[]> {
    const { data } = await apiClient.get<unknown>('/api/v1/inventory/movements');
    return parseInventoryMovementList(data);
  },

  async listMovementsForBooking(bookingId: string): Promise<InventoryMovement[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/bookings/${bookingId}/inventory-movements`,
    );
    return parseInventoryMovementList(data);
  },

  async getMovementById(id: string): Promise<InventoryMovement> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/inventory/movements/${id}`,
    );
    return parseInventoryMovement(data);
  },

  async createMovement(
    body: CreateInventoryMovementRequest,
  ): Promise<InventoryMovement> {
    const { data } = await apiClient.post<unknown>(
      '/api/v1/inventory/movements',
      body,
    );
    return parseInventoryMovement(data);
  },

  async transitionMovement(
    movementId: string,
    body: TransitionInventoryMovementRequest,
    version: number,
  ): Promise<InventoryMovement> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/inventory/movements/${movementId}/transition`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseInventoryMovement(data);
  },

  async addDamageNote(
    movementId: string,
    body: AddDamageNoteRequest,
  ): Promise<DamageNote> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/inventory/movements/${movementId}/damage-notes`,
      body,
    );
    return parseDamageNote(data);
  },

  async listReservationsForBooking(
    bookingId: string,
  ): Promise<InventoryReservation[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/bookings/${bookingId}/inventory-reservations`,
    );
    return parseInventoryReservationList(data);
  },

  async getReservationById(id: string): Promise<InventoryReservation> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/inventory-reservations/${id}`,
    );
    return parseInventoryReservation(data);
  },

  async createReservation(
    body: CreateInventoryReservationRequest,
  ): Promise<InventoryReservation> {
    const { data } = await apiClient.post<unknown>(
      '/api/v1/inventory-reservations',
      body,
    );
    return parseInventoryReservation(data);
  },

  async modifyReservation(
    id: string,
    body: ModifyInventoryReservationRequest,
    version: number,
  ): Promise<InventoryReservation> {
    const { data } = await apiClient.patch<unknown>(
      `/api/v1/inventory-reservations/${id}`,
      body,
      { headers: ifMatchHeader(version) },
    );
    return parseInventoryReservation(data);
  },

  async releaseReservation(
    id: string,
    version: number,
  ): Promise<InventoryReservation> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/inventory-reservations/${id}/release`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseInventoryReservation(data);
  },

  async cancelReservation(
    id: string,
    version: number,
  ): Promise<InventoryReservation> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/inventory-reservations/${id}/cancel`,
      {},
      { headers: ifMatchHeader(version) },
    );
    return parseInventoryReservation(data);
  },

  async listVerificationsForMovement(
    movementId: string,
  ): Promise<InventoryVerification[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/inventory-verification/by-movement/${movementId}`,
    );
    return parseInventoryVerificationList(data);
  },

  async createVerification(
    movementId: string,
    body: CreateInventoryVerificationRequest,
  ): Promise<InventoryVerification> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/inventory-verification/${movementId}`,
      body,
    );
    return parseInventoryVerification(data);
  },

  async listDamageReportsForMovement(
    movementId: string,
  ): Promise<InventoryDamageReport[]> {
    const { data } = await apiClient.get<unknown>(
      `/api/v1/inventory-damage/by-movement/${movementId}`,
    );
    return parseInventoryDamageReportList(data);
  },

  async createDamageReport(
    movementId: string,
    body: CreateInventoryDamageReportRequest,
  ): Promise<InventoryDamageReport> {
    const { data } = await apiClient.post<unknown>(
      `/api/v1/inventory-damage/${movementId}`,
      body,
    );
    return parseInventoryDamageReport(data);
  },
};
