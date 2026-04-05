import { literal, minLength, object, optional, pipe, regex, string, union } from 'valibot';

const nameSchema = pipe(string(), minLength(1));
const kanaSchema = pipe(
  string(),
  regex(/^[ァ-ヶー]+$/, 'カタカナで入力してください'),
);

const phoneSchema = pipe(
  string(),
  regex(/^\d{2,4}-\d{2,4}-\d{4}$/, '電話番号の形式が不正です'),
);

export const zipCodeSchema = pipe(
  string(),
  regex(/^\d{3}-\d{4}$/, '郵便番号の形式が不正です'),
);

const dateSchema = pipe(
  string(),
  regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です'),
);

const genderSchema = union([
  literal('male'),
  literal('female'),
  literal('other'),
]);

const studentIdSchema = pipe(
  string(),
  regex(/^[a-z]\d{5}$/, '学籍番号の形式が不正です'),
);

const memberBaseSchema = object({
  lastName: nameSchema,
  firstName: nameSchema,
  lastNameKana: kanaSchema,
  firstNameKana: kanaSchema,
});

const memberSensitiveSchema = object({
  birthday: dateSchema,
  gender: genderSchema,
  phoneNumber: phoneSchema,
  currentZipCode: zipCodeSchema,
  currentAddress: nameSchema,
  parentsZipCode: zipCodeSchema,
  parentsAddress: nameSchema,
});

const memberInternalSchema = object({
  studentId: studentIdSchema,
});

const memberExternalSchema = object({
  schoolName: nameSchema,
  schoolMajor: optional(string()),
  organization: optional(string()),
});

export const internalMemberSchema = object({
  ...memberBaseSchema.entries,
  ...memberSensitiveSchema.entries,
  ...memberInternalSchema.entries,
});

export const externalMemberSchema = object({
  ...memberBaseSchema.entries,
  ...memberSensitiveSchema.entries,
  ...memberExternalSchema.entries,
});

export const memberDetailSchema = union([internalMemberSchema, externalMemberSchema]);
