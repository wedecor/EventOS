import { Injectable } from '@nestjs/common';
import { EventFunctionUsageQuery } from './event-function-usage.query';

/** Default: no entity references event functions yet (see P3-01). */
@Injectable()
export class NoReferencesEventFunctionUsageQuery extends EventFunctionUsageQuery {
  findInUseFunctionIds(): Promise<ReadonlySet<string>> {
    return Promise.resolve(new Set<string>());
  }
}
