import { BadRequestException, Injectable } from '@nestjs/common';
import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import {
  v2 as cloudinary,
  UploadApiErrorResponse,
  UploadApiResponse,
} from 'cloudinary';

import { MSG_FILE_FORMAT_ALLOWED } from '../constants/message.constant';
import { fileFilter } from '../helpers/file.helper';

@Injectable()
export class FilesService {
  static multerOptions(agrs: { fileSize: number }): MulterOptions {
    return {
      limits: {
        fileSize: agrs.fileSize * Math.pow(1024, 2), //5MB
      },

      fileFilter: this.fileFilter,
    };
  }

  static fileFilter(req: any, file: any, cb: any) {
    const filter = fileFilter({
      originalname: file.originalname,
      mimetype: file.mimetype,
    });

    if (!filter) {
      cb(null, false);
      return cb(new BadRequestException(MSG_FILE_FORMAT_ALLOWED));
    }

    cb(null, true);
  }

  async uploadFile(args: { file: Express.Multer.File; folder: string }) {
    const { buffer } = args.file;

    return new Promise<UploadApiResponse | UploadApiErrorResponse>(
      (resolve, reject) => {
        const uploadStream = cloudinary.uploader
          .upload_stream({ folder: args.folder }, (error, result) => {
            if (error) return reject(error);
            resolve(result);
          })
          .end(buffer);
      },
    );
  }

  async removeFile(args: { folder: string; url: string }) {
    const path = args.url.slice(
      args.url.lastIndexOf(args.folder),
      args.url.lastIndexOf('.'),
    );

    cloudinary.uploader.destroy(path, (error, result) => {
      if (error) {
        throw error;
      }
      return result;
    });
  }
}
