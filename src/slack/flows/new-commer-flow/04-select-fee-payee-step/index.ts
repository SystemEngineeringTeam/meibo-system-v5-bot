import { baseCloseSelectFeePayeeMessage, baseSelectFeePayeeStep } from '@slack/flows/shared/select-fee-payee';

export const selectFeePayeeStep = baseSelectFeePayeeStep(4, 'select_newcommer_fee_payee');
export const closeSelectFeePayeeMessage = baseCloseSelectFeePayeeMessage(4);
