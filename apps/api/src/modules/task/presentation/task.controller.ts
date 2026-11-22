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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Permissions } from '../../auth';
import { ZodValidationPipe } from '../../../common/pipes/zod-validation.pipe';
import { failure } from '../../../shared/application/result';
import { IfMatchVersion } from '../../../shared/presentation/if-match.decorator';
import {
  ApiDataResponse,
  ApiIfMatchHeader,
  ApiStandardErrors,
  ApiUuidParam,
  ApiZodBody,
} from '../../../shared/presentation/openapi.helpers';
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
  @Permissions('tasks:read')
  @ApiOperation({ summary: 'List tasks for a booking' })
  @ApiQuery({
    name: 'bookingId',
    required: true,
    schema: { type: 'string', format: 'uuid' },
  })
  @ApiDataResponse(200, 'Tasks listed')
  @ApiStandardErrors()
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
  @Permissions('tasks:read')
  @ApiOperation({ summary: 'Retrieve a task by ID' })
  @ApiUuidParam('id')
  @ApiDataResponse(200, 'Task retrieved')
  @ApiStandardErrors()
  async retrieveTask(@TenantId() tenantId: string, @Param('id') id: string) {
    const result = await this.taskService.getTaskById(tenantId, id);
    return resultToResponse(result);
  }

  @Post()
  @Permissions('tasks:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a task' })
  @ApiZodBody(createTaskSchema)
  @ApiDataResponse(201, 'Task created')
  @ApiStandardErrors()
  async createTask(
    @TenantId() tenantId: string,
    @Body(new ZodValidationPipe(createTaskSchema)) body: CreateTaskBody,
  ) {
    const result = await this.taskService.createTask(tenantId, {
      bookingId: body.bookingId,
      title: body.title,
      description: body.description,
      category: body.category,
      priority: body.priority,
      assignedTo: body.assignedTo,
      dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
    });

    return resultToResponse(result);
  }

  @Patch(':id')
  @Permissions('tasks:write')
  @ApiOperation({ summary: 'Update a task' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(updateTaskSchema)
  @ApiDataResponse(200, 'Task updated')
  @ApiStandardErrors()
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
        category: body.category,
        priority: body.priority,
        assignedTo: body.assignedTo,
        dueAt: body.dueAt ? new Date(body.dueAt) : undefined,
      },
      version,
    );

    return resultToResponse(result);
  }

  // EP1-OPS-003, EP1-OPS-004 — Update task status (lifecycle transition)
  @Patch(':id/status')
  @Permissions('tasks:status:update')
  @ApiOperation({ summary: 'Update task status' })
  @ApiUuidParam('id')
  @ApiIfMatchHeader(true)
  @ApiZodBody(updateTaskStatusSchema)
  @ApiDataResponse(200, 'Task status updated')
  @ApiStandardErrors()
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
      { status: body.status, completionNotes: body.completionNotes },
      version,
    );

    return resultToResponse(result);
  }

  @Post(':id/checklist-items')
  @Permissions('tasks:write')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a checklist item to a task' })
  @ApiUuidParam('id')
  @ApiZodBody(addChecklistItemSchema)
  @ApiDataResponse(201, 'Checklist item added')
  @ApiStandardErrors()
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
  @Permissions('tasks:write')
  @ApiOperation({ summary: 'Update a checklist item' })
  @ApiUuidParam('id')
  @ApiUuidParam('itemId')
  @ApiIfMatchHeader(true)
  @ApiZodBody(updateChecklistItemSchema)
  @ApiDataResponse(200, 'Checklist item updated')
  @ApiStandardErrors()
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
  @Permissions('tasks:write')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a checklist item from a task' })
  @ApiUuidParam('id')
  @ApiUuidParam('itemId')
  @ApiDataResponse(204, 'Checklist item removed')
  @ApiStandardErrors()
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
