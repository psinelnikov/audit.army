import { Controller, Post, Get, Delete, UseInterceptors, UploadedFile, HttpStatus, Logger, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { FileUploadService } from './file-upload.service';
import * as path from 'path';

@Controller('api/files')
export class FileUploadController {
  private readonly logger = new Logger(FileUploadController.name);

  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post('upload/document')
  @UseInterceptors(FileInterceptor('document', {
    storage: diskStorage({
      destination: (req: any, file: any, cb: any) => {
        cb(null, path.join('./uploads', 'documents'));
      },
      filename: (req: any, file: any, cb: any) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
      },
    }),
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
      files: 5,
    },
    fileFilter: (req: any, file: any, cb: any) => {
      if (!file.mimetype.match(/^(application\/pdf|image\/jpeg|image\/png|application\/msword|application\/vnd\.openxmlformats-officedocument\.wordprocessingml\.document)$/)) {
        cb(new Error('Invalid file type'), false);
      }
      cb(null, true);
    },
  }))
  async uploadDocument(@UploadedFile() file: any) {
    try {
      this.logger.log(`Uploading document: ${file.originalname}`);

      const isValid = this.fileUploadService.validateFile(file);
      if (!isValid) {
        throw new Error('Invalid file. Please upload PDF, images (JPEG/PNG), or Word documents (max 10MB)');
      }

      const savedFile = await this.fileUploadService.saveFile(file, 'documents');

      return {
        success: true,
        data: {
          filename: savedFile.filename,
          url: savedFile.url,
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
        }
      };
    } catch (error) {
      this.logger.error(`Error uploading file: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message || 'Failed to upload file',
      };
    }
  }

  @Get('documents/:filename')
  async getDocument(@Param('filename') filename: string) {
    try {
      const fileInfo = await this.fileUploadService.getFileInfo('documents', filename);

      if (!fileInfo) {
        return {
          success: false,
          error: 'File not found',
        };
      }

      return {
        success: true,
        data: fileInfo,
      };
    } catch (error) {
      this.logger.error(`Error getting file: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message || 'Failed to get file',
      };
    }
  }

  @Delete('documents/:filename')
  async deleteDocument(@Param('filename') filename: string) {
    try {
      await this.fileUploadService.deleteFile('documents', filename);

      return {
        success: true,
        data: { message: 'File deleted successfully' },
      };
    } catch (error) {
      this.logger.error(`Error deleting file: @filename}: ${error.message}`, error.stack);
      return {
        success: false,
        error: error.message || 'Failed to delete file',
      };
    }
  }
}
