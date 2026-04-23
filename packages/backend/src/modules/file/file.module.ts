import { DynamicModule, Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import path from 'path';
import { constant } from 'src/common/constant';
import { File } from 'src/database/models/file.model';
import { FileController } from './file.controller';
import { FileService } from './file.service';

@Module({
  imports: [
    MulterModule.register({
      storage: diskStorage({
        destination: function (req, file, cb) {
          const uploadDir = path.join(process.cwd(), constant.FILE_PATH_PREFIX);
          if (!existsSync(uploadDir)) mkdirSync(uploadDir, { recursive: true });
          cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = file.originalname.split('.').pop();
          cb(null, `${file.fieldname}-${uniqueSuffix}.${ext}`);
        },
      }),
    }),
    TypeOrmModule.forFeature([File]),
  ],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {
  static http(): DynamicModule {
    return {
      module: FileModule,
      controllers: [FileController],
    };
  }
}
