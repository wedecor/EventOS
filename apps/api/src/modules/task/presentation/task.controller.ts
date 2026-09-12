import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { failure } from '../../../shared/application/result';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import { resultToResponse } from '../../../shared/presentation/result-to-response.helper';
import { TenantId } from '../../../shared/presentation/tenant-context.decorator';
import { ChecklistItemApplicationService } from '../application/services/checklist-item.application.service';
import { TaskApplicationService } from '../application/services/task.application.service';
import {
  addChecklistItemSchema,
  createTaskSchema,
  updateChecklistItemSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  type AddChecklistItemBody,
  type CreateTaskBody,
  type UpdateChecklistItemBody,
  type UpdateTaskBody,
  type UpdateTaskStatusBody,
} from './schemas/task.schemas';

@ApiTags('Tasks')
@ApiBearerAuth()
@Controller('tasks')
export class TaskController {
  constructor(
    private readonly taskService: TaskApplicationService,
    private readonly checklistItemService: ChecklistItemApplicationService,
  ) {}

  // EP1-OPS-003 — List tasks (and owned checklist items) for a booking
  @Get()
  @ApiOperation({ summary: 'List tasks for a booking' })
  async listTasks(
    @TenantId() tenantId: string,
    @Query('bookingId') bookingId: string | undefined,
  ) {
    if (!bookingId) {
      return resultToResponse(
        failure('VALIDATION_ERROR', 'bookingId query parameter is required.'),
      );
    }

    const result = await this.taskService.listTasksForBooking(
      tenantId,
      bookingId,
    );
    return resultToResponse(result);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a task by ID' })
  async retrieveTask(@TenantId() tenantId: string, @Param('id') id: string) {
    const result = await this.taskService.getTaskById(tenantId, id);
    return resultToResponse(result);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a task' })
  async createTask(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createTaskSchema)) body: CreateTaskBody,
  ) {
    const result = await this.taskService.createTask(tenantId, {
      bookingId: body.bookingId,
      title: body.title,
      description: body.description,
      assignedTo: body.assignedTo,
      dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
    });

    return resultToResponse(result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a task' })
  async updateTask(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateTaskSchema)) body: UpdateTaskBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.taskService.updateTask(
      tenantId,
      id,
      {
        title: body.title,
        description: body.description,
        assignedTo: body.assignedTo,
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
      },
      version,
    );

    return resultToResponse(result);
  }

  // EP1-OPS-003, EP1-OPS-004 — Update task status (lifecycle transition)
  @Patch(':id/status')
  @ApiOperation({ summary: 'Update task status' })
  async updateTaskStatus(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateTaskStatusSchema))
    body: UpdateTaskStatusBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.taskService.updateTaskStatus(
      tenantId,
      id,
      { status: body.status },
      version,
    );

    return resultToResponse(result);
  }

  @Post(':id/checklist-items')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a checklist item to a task' })
  async addChecklistItem(
    @TenantId() tenantId: string,
    @Param('id') taskId: string,
    @Body(new ZodValidationPipe(addChecklistItemSchema))
    body: AddChecklistItemBody,
  ) {
    const result = await this.checklistItemService.addChecklistItem(
      tenantId,
      taskId,
      { description: body.description, sortOrder: body.sortOrder },
    );

    return resultToResponse(result);
  }

  @Patch(':id/checklist-items/:itemId')
  @ApiOperation({ summary: 'Update a checklist item' })
  async updateChecklistItem(
    @TenantId() tenantId: string,
    @Param('id') taskId: string,
    @Param('itemId') itemId: string,
    @IfMatchVersion() version: number | undefined,
    @Body(new ZodValidationPipe(updateChecklistItemSchema))
    body: UpdateChecklistItemBody,
  ) {
    if (version === undefined) {
      return resultToResponse(
        failure(
          'VALIDATION_ERROR',
          'If-Match header with version is required.',
        ),
      );
    }

    const result = await this.checklistItemService.updateChecklistItem(
      tenantId,
      taskId,
      itemId,
      {
        description: body.description,
        isCompleted: body.isCompleted,
        sortOrder: body.sortOrder,
      },
      version,
    );

    return resultToResponse(result);
  }

  @Delete(':id/checklist-items/:itemId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a checklist item from a task' })
  async removeChecklistItem(
    @TenantId() tenantId: string,
    @Param('id') taskId: string,
    @Param('itemId') itemId: string,
  ) {
    const result = await this.checklistItemService.removeChecklistItem(
      tenantId,
      taskId,
      itemId,
    );

    if (!result.ok) {
      resultToResponse(result);
    }
  }
}
