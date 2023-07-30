import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { plainToClass } from 'class-transformer';
import { Observable, of, switchMap, map, firstValueFrom } from 'rxjs';

interface ClassType<T> {
  new (): T;
}

@Injectable()
export class TransformDtoInterceptor<T>
  implements NestInterceptor<Partial<T>, T>
{
  constructor(private readonly classType: ClassType<T>) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<T>> {
    return next.handle().pipe(
      switchMap(async (data) => {
        if (data === undefined) return data;
        if (data.list && data.list.length > 0) {
          data.list = await firstValueFrom(
            of(data.list).pipe(
              map((item) => {
                return plainToClass(this.classType, item);
              }),
            ),
          );
        }
        if (data.item) {
          data.item = plainToClass(this.classType, data.item);
        }
        return data;
      }),
    );
  }
}
