'use client';

import React, { useState } from 'react';
import {
  Shield,
  UserCog,
  Lock,
  Unlock,
  Key,
  LogOut,
  Wallet,
  MessageSquare,
  Flag,
  Ban,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { notifyError, notifySuccess } from '@/lib/toast';
import { AdminActionModal, InputField } from './AdminActionModal';
import { AdminActionButton } from './AdminActionButton';
import { AdminInfoCard } from './AdminInfoCard';
import { UserFlagBadge, FlagType } from './UserFlagBadge';

type UserStatus = 'active' | 'suspended';

interface UserAccountActionsProps {
  userId: string;
  userName: string;
  userStatus: UserStatus;
  userEmail: string;
  walletBalance: number;
  isAccountLocked: boolean;
  activeFlags: Array<{ id: string; flagType: FlagType; flagLabel?: string }>;
  onActionComplete?: () => void;
}

type ModalState =
  | { type: 'none' }
  | { type: 'suspend' }
  | { type: 'unsuspend' }
  | { type: 'close_account' }
  | { type: 'force_password_reset' }
  | { type: 'revoke_sessions' }
  | { type: 'unlock_account' }
  | { type: 'wallet_credit' }
  | { type: 'wallet_debit' }
  | { type: 'add_flag' }
  | { type: 'remove_flag'; flagId: string; flagType: string };

export function UserAccountActions({
  userId,
  userName,
  userStatus,
  userEmail,
  walletBalance,
  isAccountLocked,
  activeFlags,
  onActionComplete,
}: UserAccountActionsProps) {
  const { showToast } = useToast();
  const [modalState, setModalState] = useState<ModalState>({ type: 'none' });
  const [isLoading, setIsLoading] = useState(false);

  const closeModal = () => setModalState({ type: 'none' });

  const handleAction = async (endpoint: string, body: Record<string, unknown>) => {
    setIsLoading(true);
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Action failed');
      }

      notifySuccess(showToast, data.message || 'Action completed successfully');
      closeModal();
      onActionComplete?.();
    } catch (error) {
      notifyError(showToast, error, 'Failed to complete action');
    } finally {
      setIsLoading(false);
    }
  };

  const renderModal = () => {
    switch (modalState.type) {
      case 'suspend':
        return (
          <AdminActionModal
            isOpen
            onClose={closeModal}
            onConfirm={async (formData) => {
              if (!formData) return;
              await handleAction(`/api/admin/users/${userId}/status`, {
                action: 'suspend',
                reason: formData.reason,
                notifyUser: true,
              });
            }}
            title="Suspend User Account"
            description={`Are you sure you want to suspend ${userName}'s account? They will be logged out immediately and won't be able to access the platform.`}
            confirmLabel="Suspend Account"
            severity="danger"
            icon={Ban}
            isLoading={isLoading}
            requiresInput={[
              {
                name: 'reason',
                label: 'Suspension Reason',
                type: 'textarea',
                placeholder: 'Enter detailed reason for suspension...',
                required: true,
                maxLength: 500,
                rows: 4,
              },
            ]}
          />
        );

      case 'unsuspend':
        return (
          <AdminActionModal
            isOpen
            onClose={closeModal}
            onConfirm={async (formData) => {
              await handleAction(`/api/admin/users/${userId}/status`, {
                action: 'unsuspend',
                reason: formData?.reason || 'Account reactivated by admin',
                notifyUser: true,
              });
            }}
            title="Reactivate User Account"
            description={`Reactivate ${userName}'s account? They will regain full access to the platform.`}
            confirmLabel="Reactivate Account"
            severity="success"
            icon={CheckCircle2}
            isLoading={isLoading}
            requiresInput={[
              {
                name: 'reason',
                label: 'Reactivation Note (Optional)',
                type: 'textarea',
                placeholder: 'Add any notes about the reactivation...',
                required: false,
                maxLength: 300,
              },
            ]}
          />
        );

      case 'close_account':
        return (
          <AdminActionModal
            isOpen
            onClose={closeModal}
            onConfirm={async (formData) => {
              if (!formData) return;
              await handleAction(`/api/admin/users/${userId}/status`, {
                action: 'close',
                reason: formData.reason,
                notifyUser: true,
              });
            }}
            title="Permanently Close Account"
            description={`⚠️ PERMANENT ACTION: This will permanently close ${userName}'s account. Ensure all savings are withdrawn and wallet is empty. This cannot be undone.`}
            confirmLabel="Close Account Permanently"
            severity="danger"
            icon={XCircle}
            isLoading={isLoading}
            requiresInput={[
              {
                name: 'reason',
                label: 'Closure Reason',
                type: 'textarea',
                placeholder: 'Enter detailed reason for account closure...',
                required: true,
                maxLength: 500,
                rows: 4,
              },
            ]}
          />
        );

      case 'force_password_reset':
        return (
          <AdminActionModal
            isOpen
            onClose={closeModal}
            onConfirm={async (formData) => {
              await handleAction(`/api/admin/users/${userId}/security`, {
                action: 'force_password_reset',
                reason: formData?.reason || 'Security measure',
                notifyUser: true,
              });
            }}
            title="Force Password Reset"
            description={`Send a password reset link to ${userEmail}? They will receive an email with instructions to set a new password.`}
            confirmLabel="Send Reset Link"
            severity="warning"
            icon={Key}
            isLoading={isLoading}
            requiresInput={[
              {
                name: 'reason',
                label: 'Reason (Optional)',
                type: 'text',
                placeholder: 'E.g., Security concern, user request...',
                required: false,
                maxLength: 200,
              },
            ]}
          />
        );

      case 'revoke_sessions':
        return (
          <AdminActionModal
            isOpen
            onClose={closeModal}
            onConfirm={async (formData) => {
              await handleAction(`/api/admin/users/${userId}/security`, {
                action: 'revoke_sessions',
                reason: formData?.reason || 'Admin action',
                notifyUser: true,
              });
            }}
            title="Revoke All Sessions"
            description={`Force logout ${userName} from all devices? They will need to log in again to access their account.`}
            confirmLabel="Revoke Sessions"
            severity="warning"
            icon={LogOut}
            isLoading={isLoading}
            requiresInput={[
              {
                name: 'reason',
                label: 'Reason',
                type: 'text',
                placeholder: 'E.g., Security concern, suspicious activity...',
                required: true,
                maxLength: 200,
              },
            ]}
          />
        );

      case 'unlock_account':
        return (
          <AdminActionModal
            isOpen
            onClose={closeModal}
            onConfirm={async (formData) => {
              await handleAction(`/api/admin/users/${userId}/security`, {
                action: 'unlock_account',
                reason: formData?.reason || 'Unlocked by admin',
                notifyUser: true,
              });
            }}
            title="Unlock Account"
            description={`Unlock ${userName}'s account? This will reset failed login attempts and allow them to log in again.`}
            confirmLabel="Unlock Account"
            severity="success"
            icon={Unlock}
            isLoading={isLoading}
            requiresInput={[
              {
                name: 'reason',
                label: 'Note (Optional)',
                type: 'text',
                placeholder: 'Add any notes...',
                required: false,
                maxLength: 200,
              },
            ]}
          />
        );

      case 'wallet_credit':
        return (
          <AdminActionModal
            isOpen
            onClose={closeModal}
            onConfirm={async (formData) => {
              if (!formData) return;
              await handleAction(`/api/admin/users/${userId}/wallet`, {
                action: 'credit',
                amount: formData.amount,
                reason: formData.reason,
                notifyUser: true,
              });
            }}
            title="Credit User Wallet"
            description={`Add funds to ${userName}'s wallet. Current balance: ₦${walletBalance.toLocaleString('en-NG')}`}
            confirmLabel="Credit Wallet"
            severity="success"
            icon={Wallet}
            isLoading={isLoading}
            requiresInput={[
              {
                name: 'amount',
                label: 'Amount (₦)',
                type: 'number',
                placeholder: '0.00',
                required: true,
              },
              {
                name: 'reason',
                label: 'Justification',
                type: 'textarea',
                placeholder: 'Enter detailed justification for this credit (e.g., refund, compensation)...',
                required: true,
                maxLength: 500,
                rows: 3,
              },
            ]}
          />
        );

      case 'wallet_debit':
        return (
          <AdminActionModal
            isOpen
            onClose={closeModal}
            onConfirm={async (formData) => {
              if (!formData) return;
              await handleAction(`/api/admin/users/${userId}/wallet`, {
                action: 'debit',
                amount: formData.amount,
                reason: formData.reason,
                notifyUser: true,
              });
            }}
            title="Debit User Wallet"
            description={`Remove funds from ${userName}'s wallet. Current balance: ₦${walletBalance.toLocaleString('en-NG')}`}
            confirmLabel="Debit Wallet"
            severity="danger"
            icon={Wallet}
            isLoading={isLoading}
            requiresInput={[
              {
                name: 'amount',
                label: 'Amount (₦)',
                type: 'number',
                placeholder: '0.00',
                required: true,
              },
              {
                name: 'reason',
                label: 'Justification',
                type: 'textarea',
                placeholder: 'Enter detailed justification for this debit (e.g., correction, chargeback)...',
                required: true,
                maxLength: 500,
                rows: 3,
              },
            ]}
          />
        );

      case 'add_flag':
        return (
          <AdminActionModal
            isOpen
            onClose={closeModal}
            onConfirm={async (formData) => {
              if (!formData) return;
              await handleAction(`/api/admin/users/${userId}/flags`, {
                flagType: formData.flagType,
                flagLabel: formData.flagLabel || undefined,
                reason: formData.reason,
              });
            }}
            title="Add User Flag"
            description={`Tag ${userName} with a flag for tracking and monitoring purposes.`}
            confirmLabel="Add Flag"
            severity="warning"
            icon={Flag}
            isLoading={isLoading}
            requiresInput={[
              {
                name: 'flagType',
                label: 'Flag Type',
                type: 'select',
                required: true,
                options: [
                  { value: 'high_value', label: 'High Value' },
                  { value: 'high_risk', label: 'High Risk' },
                  { value: 'vip', label: 'VIP' },
                  { value: 'suspicious', label: 'Suspicious' },
                  { value: 'verified', label: 'Verified' },
                  { value: 'trusted', label: 'Trusted' },
                  { value: 'watch_list', label: 'Watch List' },
                  { value: 'fraud_alert', label: 'Fraud Alert' },
                  { value: 'compliance_review', label: 'Compliance Review' },
                  { value: 'kyc_pending', label: 'KYC Pending' },
                  { value: 'custom', label: 'Custom' },
                ],
              },
              {
                name: 'flagLabel',
                label: 'Custom Label (Optional)',
                type: 'text',
                placeholder: 'Enter custom label...',
                required: false,
                maxLength: 100,
              },
              {
                name: 'reason',
                label: 'Reason',
                type: 'textarea',
                placeholder: 'Why are you adding this flag?',
                required: true,
                maxLength: 300,
                rows: 3,
              },
            ]}
          />
        );

      case 'remove_flag':
        return (
          <AdminActionModal
            isOpen
            onClose={closeModal}
            onConfirm={async () => {
              const response = await fetch(`/api/admin/users/${userId}/flags/${modalState.flagId}`, {
                method: 'DELETE',
              });
              const data = await response.json();
              if (!response.ok) throw new Error(data.error);
              notifySuccess(showToast, data.message);
              closeModal();
              onActionComplete?.();
            }}
            title="Remove Flag"
            description={`Remove the "${modalState.flagType}" flag from ${userName}?`}
            confirmLabel="Remove Flag"
            severity="warning"
            icon={Flag}
            isLoading={isLoading}
          />
        );

      default:
        return null;
    }
  };

  return (
    <>
      <AdminInfoCard title="Account Actions" icon={UserCog} variant="default">
        <div className="space-y-3">
          {/* Status Actions */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Account Status
            </p>
            <div className="flex flex-wrap gap-2">
              {userStatus === 'active' ? (
                <AdminActionButton
                  onClick={() => setModalState({ type: 'suspend' })}
                  icon={Ban}
                  variant="danger"
                  size="sm"
                >
                  Suspend Account
                </AdminActionButton>
              ) : (
                <AdminActionButton
                  onClick={() => setModalState({ type: 'unsuspend' })}
                  icon={CheckCircle2}
                  variant="success"
                  size="sm"
                >
                  Reactivate Account
                </AdminActionButton>
              )}
              <AdminActionButton
                onClick={() => setModalState({ type: 'close_account' })}
                icon={XCircle}
                variant="danger"
                size="sm"
              >
                Close Account
              </AdminActionButton>
            </div>
          </div>

          {/* Security Actions */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Security
            </p>
            <div className="flex flex-wrap gap-2">
              <AdminActionButton
                onClick={() => setModalState({ type: 'force_password_reset' })}
                icon={Key}
                variant="warning"
                size="sm"
              >
                Reset Password
              </AdminActionButton>
              <AdminActionButton
                onClick={() => setModalState({ type: 'revoke_sessions' })}
                icon={LogOut}
                variant="warning"
                size="sm"
              >
                Revoke Sessions
              </AdminActionButton>
              {isAccountLocked && (
                <AdminActionButton
                  onClick={() => setModalState({ type: 'unlock_account' })}
                  icon={Unlock}
                  variant="success"
                  size="sm"
                >
                  Unlock Account
                </AdminActionButton>
              )}
            </div>
          </div>

          {/* Wallet Actions */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Wallet
            </p>
            <div className="flex flex-wrap gap-2">
              <AdminActionButton
                onClick={() => setModalState({ type: 'wallet_credit' })}
                icon={Wallet}
                variant="success"
                size="sm"
              >
                Credit Wallet
              </AdminActionButton>
              <AdminActionButton
                onClick={() => setModalState({ type: 'wallet_debit' })}
                icon={Wallet}
                variant="danger"
                size="sm"
              >
                Debit Wallet
              </AdminActionButton>
            </div>
          </div>

          {/* Flag Actions */}
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              User Flags
            </p>
            <div className="space-y-2">
              {activeFlags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {activeFlags.map((flag) => (
                    <button
                      key={flag.id}
                      type="button"
                      onClick={() =>
                        setModalState({
                          type: 'remove_flag',
                          flagId: flag.id,
                          flagType: flag.flagLabel || flag.flagType,
                        })
                      }
                      className="group"
                      title="Click to remove"
                    >
                      <UserFlagBadge
                        flagType={flag.flagType}
                        label={flag.flagLabel}
                        size="sm"
                      />
                    </button>
                  ))}
                </div>
              )}
              <AdminActionButton
                onClick={() => setModalState({ type: 'add_flag' })}
                icon={Flag}
                variant="secondary"
                size="sm"
              >
                Add Flag
              </AdminActionButton>
            </div>
          </div>
        </div>
      </AdminInfoCard>

      {renderModal()}
    </>
  );
}
