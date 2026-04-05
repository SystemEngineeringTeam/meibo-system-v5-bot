import { baseCloseSelectFeePayeeMessage, baseSelectFeePayeeStep } from '@slack/flows/shared/select-fee-payee';

export const selectFeePayeeStep = baseSelectFeePayeeStep(3, 'select_continuing_member_fee_payee');
export const closeSelectFeePayeeMessage = baseCloseSelectFeePayeeMessage(3);
