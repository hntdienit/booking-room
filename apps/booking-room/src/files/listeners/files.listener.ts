import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { removeFileEvent } from '../events/files.event';
import { FileEventEnum } from '../fileEvent.enum';
import { FilesService } from '../files.service';

@Injectable()
export class filesListener {
  private readonly logger = new Logger(filesListener.name);

  constructor(private readonly filesService: FilesService) {}

  @OnEvent(FileEventEnum.removeFileListener)
  async removeFileListener(event: removeFileEvent) {
    try {
      await this.filesService.removeFile({
        folder: event.folder,
        url: event.url,
      });
    } catch (err) {
      this.logger.error(err);
    }
  }
}
