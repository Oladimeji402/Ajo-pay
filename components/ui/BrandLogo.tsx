import Image from 'next/image';
import Link from 'next/link';

type BrandLogoSize = 'sm' | 'md' | 'lg';

interface BrandLogoProps {
    href?: string;
    size?: BrandLogoSize;
    dark?: boolean;
    showWordmark?: boolean;
    className?: string;
}

const sizeMap = {
    sm: { mark: 28, text: 'text-base' },
    md: { mark: 36, text: 'text-xl' },
    lg: { mark: 40, text: 'text-2xl' },
} as const;

export const BrandLogo = ({
    href = '/',
    size = 'md',
    dark = false,
    showWordmark = true,
    className = '',
}: BrandLogoProps) => {
    const styles = sizeMap[size];
    const textColor = dark ? 'text-brand-navy' : 'text-white';

    return (
        <Link href={href} className={`inline-flex items-center gap-2.5 ${className}`}>
            <Image
                src="/ajopay-mark.svg"
                alt="Ajopay logo"
                width={styles.mark}
                height={styles.mark}
                priority
            />
            {showWordmark ? (
                <span className={`${styles.text} ${textColor} font-bold tracking-tight`}>Ajopay</span>
            ) : null}
        </Link>
    );
};
