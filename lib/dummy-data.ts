export interface User {
    id: string;
    name: string;
    email: string;
    phone: string;
    bankAccount: string;
    bankName: string;
    walletBalance: string;
    totalContributed: string;
    totalReceived: string;
    savingsStreak: number;
    kycLevel: 'Level 1' | 'Level 2' | 'Level 3';
    status: 'Active' | 'Suspended';
    joinedAt: string;
}

export interface AjoGroup {
    id: string;
    name: string;
    category: string;
    contributionAmount: string;
    frequency: 'Weekly' | 'Bi-weekly' | 'Monthly';
    maxMembers: number;
    currentCycle: number;
    totalCycles: number;
    startDate: string;
    status: 'Active' | 'Completed' | 'Paused';
    inviteCode: string;
    color: string;
}

export interface GroupMember {
    userId: string;
    groupId: string;
    position: number;
    contributionStatus: 'Paid' | 'Pending' | 'Upcoming';
    payoutStatus: 'Received' | 'Upcoming' | 'Your Turn';
    payoutConfirmedAt?: string;
}

export interface Transaction {
    id: string;
    type: 'contribution' | 'payout';
    userId: string;
    userName: string;
    groupId: string;
    groupName: string;
    amount: string;
    status: 'success' | 'pending' | 'failed';
    method: string;
    reference: string;
    date: string;
}

export interface Payout {
    id: string;
    groupId: string;
    userId: string;
    userName: string;
    amount: string;
    bankAccount: string;
    bankName: string;
    groupName: string;
    status: 'pending' | 'done';
    markedDoneAt?: string;
    cycleNumber: number;
}

export const dummyUsers: User[] = [
    {
        id: '1',
        name: 'Franklyn Okonkwo',
        email: 'franklyn@example.com',
        phone: '+234 801 234 5678',
        bankAccount: '3089123456',
        bankName: 'GTBank',
        walletBalance: '₦1,250,000',
        totalContributed: '₦850,000',
        totalReceived: '₦1,050,000',
        savingsStreak: 6,
        kycLevel: 'Level 3',
        status: 'Active',
        joinedAt: '2023-01-15'
    },
    {
        id: '2',
        name: 'Tunde Adekunle',
        email: 'tunde.a@example.com',
        phone: '+234 703 123 9988',
        bankAccount: '0112233445',
        bankName: 'Zenith Bank',
        walletBalance: '₦450,000',
        totalContributed: '₦2,400,000',
        totalReceived: '₦2,000,000',
        savingsStreak: 12,
        kycLevel: 'Level 3',
        status: 'Active',
        joinedAt: '2022-12-01'
    },
    {
        id: '3',
        name: 'Chioma Okeke',
        email: 'chioma.o@example.com',
        phone: '+234 812 555 6677',
        bankAccount: '2033445566',
        bankName: 'First Bank',
        walletBalance: '₦120,500',
        totalContributed: '₦1,200,000',
        totalReceived: '₦600,000',
        savingsStreak: 4,
        kycLevel: 'Level 2',
        status: 'Active',
        joinedAt: '2023-03-10'
    },
    {
        id: '4',
        name: 'Ibrahim Kasim',
        email: 'ibrahim.k@example.com',
        phone: '+234 905 444 3322',
        bankAccount: '0765544332',
        bankName: 'Access Bank',
        walletBalance: '₦0',
        totalContributed: '₦300,000',
        totalReceived: '₦0',
        savingsStreak: 3,
        kycLevel: 'Level 1',
        status: 'Active',
        joinedAt: '2023-05-20'
    },
    {
        id: '5',
        name: 'Sarah Johnson',
        email: 'sarah.j@example.com',
        phone: '+234 802 111 2233',
        bankAccount: '1122334455',
        bankName: 'UBA',
        walletBalance: '₦50,000',
        totalContributed: '₦150,000',
        totalReceived: '₦0',
        savingsStreak: 3,
        kycLevel: 'Level 2',
        status: 'Suspended',
        joinedAt: '2023-06-01'
    }
];

export const dummyGroups: AjoGroup[] = [
    {
        id: 'g1',
        name: 'Lagos Techies Ajo',
        category: 'Tech Professionals',
        contributionAmount: '₦50,000',
        frequency: 'Monthly',
        maxMembers: 12,
        currentCycle: 4,
        totalCycles: 12,
        startDate: '2023-07-01',
        status: 'Active',
        inviteCode: 'AJO-LT2023X',
        color: '#3B82F6'
    },
    {
        id: 'g2',
        name: 'Family Savings',
        category: 'Family',
        contributionAmount: '₦45,000',
        frequency: 'Monthly',
        maxMembers: 10,
        currentCycle: 7,
        totalCycles: 10,
        startDate: '2023-04-01',
        status: 'Active',
        inviteCode: 'FAM-SAV-001',
        color: '#0F766E'
    },
    {
        id: 'g3',
        name: 'Investment Circle',
        category: 'General',
        contributionAmount: '₦200,000',
        frequency: 'Bi-weekly',
        maxMembers: 5,
        currentCycle: 5,
        totalCycles: 5,
        startDate: '2023-08-01',
        status: 'Completed',
        inviteCode: 'INV-CIR-XP',
        color: '#8B5CF6'
    }
];

export const dummyGroupMembers: GroupMember[] = [
    { userId: '1', groupId: 'g1', position: 4, contributionStatus: 'Pending', payoutStatus: 'Your Turn' },
    { userId: '2', groupId: 'g1', position: 1, contributionStatus: 'Paid', payoutStatus: 'Received', payoutConfirmedAt: '2023-07-15' },
    { userId: '3', groupId: 'g1', position: 2, contributionStatus: 'Paid', payoutStatus: 'Received', payoutConfirmedAt: '2023-08-15' },
    { userId: '4', groupId: 'g1', position: 3, contributionStatus: 'Paid', payoutStatus: 'Received', payoutConfirmedAt: '2023-09-15' },
    { userId: '5', groupId: 'g1', position: 5, contributionStatus: 'Upcoming', payoutStatus: 'Upcoming' },

    { userId: '2', groupId: 'g2', position: 1, contributionStatus: 'Paid', payoutStatus: 'Received', payoutConfirmedAt: '2023-04-20' },
    { userId: '1', groupId: 'g2', position: 7, contributionStatus: 'Paid', payoutStatus: 'Upcoming' }
];

export const dummyTransactions: Transaction[] = [
    {
        id: 't1',
        type: 'contribution',
        userId: '1',
        userName: 'Franklyn Okonkwo',
        groupId: 'g1',
        groupName: 'Lagos Techies Ajo',
        amount: '₦50,000',
        status: 'success',
        method: 'Bank Transfer',
        reference: 'AJ-829301',
        date: 'Oct 12, 2023'
    },
    {
        id: 't2',
        type: 'payout',
        userId: '1',
        userName: 'Franklyn Okonkwo',
        groupId: 'g2',
        groupName: 'Family Savings',
        amount: '₦450,000',
        status: 'success',
        method: 'Wallet Payout',
        reference: 'AJ-772104',
        date: 'Sep 28, 2023'
    }
];

export const dummyPayouts: Payout[] = [
    {
        id: 'p1',
        groupId: 'g1',
        userId: '1',
        userName: 'Franklyn Okonkwo',
        amount: '₦600,000',
        bankAccount: '3089123456',
        bankName: 'GTBank',
        groupName: 'Lagos Techies Ajo',
        status: 'pending',
        cycleNumber: 4
    },
    {
        id: 'p2',
        groupId: 'g2',
        userId: '3',
        userName: 'Chioma Okeke',
        amount: '₦450,000',
        bankAccount: '2033445566',
        bankName: 'First Bank',
        groupName: 'Family Savings',
        status: 'done',
        markedDoneAt: '2023-09-28T14:15:00Z',
        cycleNumber: 6
    }
];

export const adminStats = {
    totalUsers: 1250,
    activeGroups: 48,
    totalVolume: '₦125.4M',
    pendingPayouts: 12,
    pendingKyc: 45,
    newSignupsThisWeek: 84
};
