import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';

@Injectable()
export class ExcelParserService {
  private readonly logger = new Logger(ExcelParserService.name);

  parseSchoolConfig(buffer: Buffer): any {
    this.logger.log('📂 Parsing Excel Config...');
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // 1. Parse Classes (Teams)
    const classesSheet = workbook.Sheets['Classes'];
    const classes = classesSheet ? XLSX.utils.sheet_to_json(classesSheet) : [];

    // 2. Parse Subjects (Channels)
    const subjectsSheet = workbook.Sheets['Subjects'];
    const subjects = subjectsSheet
      ? XLSX.utils.sheet_to_json(subjectsSheet)
      : [];

    // 3. Parse Users
    const usersSheet = workbook.Sheets['Users'];
    const users = usersSheet ? XLSX.utils.sheet_to_json(usersSheet) : [];

    this.logger.log(
      `✅ Parsed: ${classes.length} classes, ${subjects.length} subjects, ${users.length} users.`,
    );

    return {
      teams: classes, // Maps to Mattermost Teams
      channels: subjects, // Maps to Mattermost Channels (per Team)
      users: users, // Maps to Mattermost Users
    };
  }
}
