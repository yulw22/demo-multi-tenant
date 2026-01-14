import { BadRequestException, Injectable } from '@nestjs/common';
import * as XLSX from 'xlsx';

type ClassRow = { code?: string; name?: string; description?: string };
type UserRow = {
  email?: string;
  username?: string;
  password?: string;
  fullname?: string;
  role?: string;
  classCode?: string;
};

export type ParsedSchoolConfig = {
  classes: {
    code: string;
    name: string;
    description: string;
  }[];
  users: {
    email: string;
    username: string;
    password: string;
    fullname: string;
    role: string;
    classCode: string;
  }[];
};

@Injectable()
export class ExcelParserService {
  parseSchoolConfig(buffer: Buffer): ParsedSchoolConfig {
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    const classesSheet = workbook.Sheets['Classes'];
    if (!classesSheet) {
      throw new BadRequestException('Sheet "Classes" is missing');
    }
    const usersSheet = workbook.Sheets['Users'];
    if (!usersSheet) {
      throw new BadRequestException('Sheet "Users" is missing');
    }

    const classes = XLSX.utils
      .sheet_to_json<ClassRow>(classesSheet, { defval: '' })
      .map((row) => ({
        code: (row.code ?? '').trim(),
        name: (row.name ?? '').trim(),
        description: (row.description ?? '').trim(),
      }))
      .filter((c) => c.code);

    if (classes.length === 0) {
      throw new BadRequestException('Classes sheet is empty or missing codes');
    }

    const classCodes = new Set(classes.map((c) => c.code));

    const users = XLSX.utils
      .sheet_to_json<UserRow>(usersSheet, { defval: '' })
      .map((row) => {
        const user = {
          email: String(row.email ?? '').trim(),
          username: String(row.username ?? '').trim(),
          password: String(row.password ?? '').trim(),
          fullname: String(row.fullname ?? '').trim(),
          role: String(row.role ?? '').trim(),
          classCode: String(row.classCode ?? '').trim(),
        };
        if (user.classCode && !classCodes.has(user.classCode)) {
          throw new BadRequestException(
            `User ${user.email || user.username} references unknown classCode "${user.classCode}"`,
          );
        }
        return user;
      })
      .filter((u) => u.email || u.username);

    return { classes, users };
  }
}
