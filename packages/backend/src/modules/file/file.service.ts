import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { constant } from 'src/common/constant';
import { File } from 'src/database/models/file.model';
import { Repository } from 'typeorm';

@Injectable()
export class FileService {
  constructor(
    @InjectRepository(File) private fileRepository: Repository<File>,
  ) {}

  public async saveFiles(files: Express.Multer.File[]): Promise<File[]> {
    const prefix = constant.FILE_PATH_PREFIX;
    const newFiles = files.map((file) => {
      const newFile = File.create({
        filename: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
        key: `${prefix}/${file.filename}`,
      });
      return newFile;
    });
    const savedFiles = await this.fileRepository.save(newFiles);

    return savedFiles;
  }
}
