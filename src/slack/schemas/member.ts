import type { InferInput } from 'valibot';
import type { InferRequestBodyType } from '@/types/openapi';
import dayjs from 'dayjs';
import { check, literal, minLength, object, optional, pipe, regex, string, transform, union } from 'valibot';

const nameSchema = pipe(string(), minLength(1));
const kanaSchema = pipe(
  string(),
  regex(/^[ァ-ヴー]+$/, 'カタカナで入力してください'),
);

const phoneSchema = pipe(
  string(),
  regex(/^\d{2,4}-\d{2,4}-\d{4}$/, '電話番号の形式が不正です'),
);

export const zipCodeSchema = pipe(
  string(),
  regex(/^\d{3}-\d{4}$/, '郵便番号の形式が不正です'),
);

const birthdaySchema = pipe(
  string(),
  regex(/^\d{4}-\d{2}-\d{2}$/, '日付形式が不正です'),
  check((value) => {
    const birth = dayjs(value, 'YYYY-MM-DD');
    if (!birth.isValid()) return false;

    const age = dayjs().diff(birth, 'year');
    return age >= 18 && age <= 30;
  }, '18歳以上30歳以下のみ登録できます'),
);

const sexSchema = union([
  literal('MALE'),
  literal('FEMALE'),
  literal('NOT_KNOWN'),
  literal('NOT_APPLICABLE'),
]);
export type Sex = InferInput<typeof sexSchema>;

const studentIdSchema = pipe(
  string(),
  transform((v) => v.toUpperCase()),
  regex(/^[EVCBMPDSALTHKX]\d{5}$/, '学籍番号の形式が不正です'),
);

const memberBaseSchema = object({
  lastName: nameSchema,
  firstName: nameSchema,
  lastNameKana: kanaSchema,
  firstNameKana: kanaSchema,
});

const memberSensitiveSchema = object({
  birthday: birthdaySchema,
  sex: sexSchema,
  phoneNumber: phoneSchema,
  currentZipCode: zipCodeSchema,
  currentAddress: nameSchema,
  parentsZipCode: zipCodeSchema,
  parentsAddress: nameSchema,
});

export const memberProfileSchema = object({
  ...memberBaseSchema.entries,
  ...memberSensitiveSchema.entries,
});

const gradeSchema = union([
  literal('B1'),
  literal('B2'),
  literal('B3'),
  literal('B4'),
  literal('M1'),
  literal('M2'),
  literal('D1'),
  literal('D2'),
  literal('D3'),
]);
export type Grade = InferInput<typeof gradeSchema>;
const memberActiveSchema = object({
  grade: gradeSchema,
});

const memberInternalSchema = object({
  studentId: studentIdSchema,
  ...memberActiveSchema.entries,
});

const memberExternalSchema = object({
  schoolName: nameSchema,
  schoolMajor: string(),
  organization: optional(string()),
  ...memberActiveSchema.entries,
});

export const internalMemberSchema = object({
  ...memberProfileSchema.entries,
  ...memberInternalSchema.entries,
});

export const externalMemberSchema = object({
  ...memberProfileSchema.entries,
  ...memberExternalSchema.entries,
});

export const inputMemberInfoSchema = union([internalMemberSchema, externalMemberSchema]);
export type InputMemberInfo = InferInput<typeof inputMemberInfoSchema>;

export type ValiedMemberInfo = Omit<InferRequestBodyType<'/members/_rpc/submit-info', 'post'>, 'publicId'>;
export const memberSchema = pipe(
  inputMemberInfoSchema,
  transform<InputMemberInfo, ValiedMemberInfo>((input) => {
    const base: ValiedMemberInfo['profile']['base'] = {
      firstName: input.firstName,
      lastName: input.lastName,
      firstNameKana: input.firstNameKana,
      lastNameKana: input.lastNameKana,
    };

    const sensitive: ValiedMemberInfo['profile']['sensitive'] = {
      birthday: input.birthday,
      sex: input.sex,
      phoneNumber: input.phoneNumber,
      currentZipCode: input.currentZipCode,
      currentAddress: input.currentAddress,
      parentsZipCode: input.parentsZipCode,
      parentsAddress: input.parentsAddress,
    };

    // studentId があれば内部部員、なければ外部部員とみなす
    if ('studentId' in input) {
      const active: ValiedMemberInfo['detail'] = {
        type: 'ACTIVE',
        detail: {
          grade: input.grade,
        },
        active: {
          type: 'INTERNAL',
          detail: {
            studentId: input.studentId,
            role: null, // 登録時は一律で役職なし
          },
        },
      };

      return {
        profile: {
          base,
          sensitive,
        },
        detail: active,
      };
    };

    const active: ValiedMemberInfo['detail'] = {
      type: 'ACTIVE',
      detail: {
        grade: input.grade,
      },
      active: {
        type: 'EXTERNAL',
        detail: {
          schoolName: input.schoolName,
          schoolMajor: input.schoolMajor,
          organization: input.organization ?? null,
        },
      },
    };

    return {
      profile: {
        base,
        sensitive,
      },
      detail: active,
    };
  }),
);
