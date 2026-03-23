import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileUploadService {
  private readonly logger = new Logger(FileUploadService.name);
  private uploadsPath = './uploads';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly ALLOWED_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

  constructor(private readonly configService: ConfigService) {
    // Ensure uploads directory exists
    const fs = require('fs');
    const path = require('path');
    
    if (!fs.existsSync(this.uploadsPath)) {
      fs.mkdirSync(this.uploadsPath, { recursive: true });
    }
  }

  /**
   * Save uploaded file
   */
  async saveFile(file: any, subfolder: string = 'documents'): Promise<{ url: string; filename: string; path: string }> {
    try {
      const fs = require('fs');
      const path = require('path');

      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      const uploadPath = path.join(this.uploadsPath, subfolder);
      
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }

      const filePath = path.join(uploadPath, uniqueFilename);
      fs.writeFileSync(filePath, file.buffer);
      
      this.logger.log(`File saved: ${uniqueFilename}`);

      return {
        url: `/api/files/${subfolder}/${uniqueFilename}`,
        filename: uniqueFilename,
        path: filePath
      };
    } catch (error) {
      this.logger.error(`Error saving file: ${error.message}`, error.stack);
      throw new Error(`Failed to save file: ${error.message}`);
    }
  }

  /**
   * Get file URL
   */
  getFileUrl(subfolder: string, filename: string): string {
    return `${this.configService.get<string>('API_URL') || 'http://localhost:3001'}/api/files/${subfolder}/${filename}`;
  }

  /**
   * Delete file
   */
  async deleteFile(subfolder: string, filename: string): Promise<void> {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(this.uploadsPath, subfolder, filename);

      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        this.logger.log(`File deleted: ${filename}`);
      }
    } catch (error) {
      this.logger.error(`Error deleting file: ${error.message}`, error.stack);
      throw new Error(`Failed to delete file: ${error.message}`);
    }
  }

  /**
   * Validate file
   */
  validateFile(file: any): boolean {
    const size = file.size;
    const type = file.mimetype;

    if (size > this.MAX_FILE_SIZE) {
      this.logger.warn(`File too large: ${size} bytes (max: ${this.MAX_FILE_SIZE})`);
      return false;
    }

    if (!this.ALLOWED_TYPES.includes(type)) {
      this.logger.warn(`Invalid file type: ${type}`);
      return false;
    }

    return true;
  }

  /**
   * Get file info
   */
  async getFileInfo(subfolder: string, filename: string): Promise<{ exists: boolean; url: string; path: string } | null> {
    try {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(this.uploadsPath, subfolder, filename);

      if (fs.existsSync(filePath)) {
        return {
          exists: true,
          url: this.getFileUrl(subfolder, filename),
          path: filePath
        };
      }

      return null;
    } catch (error) {
      this.logger.error(`Error getting file info: ${error.message}`, error.stack);
      throw new Error(`Failed to get file info: ${error.message}`);
    }
  }
}
