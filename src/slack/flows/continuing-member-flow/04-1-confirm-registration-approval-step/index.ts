import { baseClickedApproveOrRejectButton, baseConfirmRegistrationApprovalStep } from '@slack/flows/shared/confirm-registration-approval';

export const confirmRegistrationApprovalStep = baseConfirmRegistrationApprovalStep('continuing_member_approve', 'continuing_member_reject', '継続部員');
export const clickedApproveOrRejectButton = baseClickedApproveOrRejectButton();
