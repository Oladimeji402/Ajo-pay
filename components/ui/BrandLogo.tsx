import Image from 'next/image';
import Link from 'next/link';

type BrandLogoSize = 'sm' | 'md' | 'lg';

interface BrandLogoProps {
    href?: string;
    size?: BrandLogoSize;
    /** true = light background (navbar scrolled, mobile menu, auth light panel) */
    dark?: boolean;
    className?: string;
}

// Full logo is 280×60 — preserve that ratio across sizes
const sizeMap = {
    sm: { w: 154, h: 33 },
    md: { w: 187, h: 40 },
    lg: { w: 224, h: 48 },
} as const;

export const BrandLogo = ({
    href = '/',
    size = 'md',
    dark = false,
    className = '',
}: BrandLogoProps) => {
    const { w, h } = sizeMap[size];

    return (
        <Link href={href} className={`inline-flex items-center shrink-0 ${className}`}>
            {dark ? (
                // Light background — clip to just the circular icon mark (first h×h pixels)
                // then add the brand name in dark text alongside
                <div className="flex items-center gap-2.5">
                    <div
                        style={{ width: h, height: h, overflow: 'hidden', flexShrink: 0 }}
                    >
                        <Image
                            src="/subtech-ajo-logo.svg"
                            alt="Subtech Ajo Solution mark"
                            width={w}
                            height={h}
                            priority
                            style={{ maxWidth: 'none', display: 'block' }}
                        />
                    </div>
                    <span
                        className="font-bold text-brand-navy leading-none tracking-tight"
                        style={{ fontSize: Math.round(h * 0.38) }}
                    >
                        Subtech Ajo Solution
                    </span>
                </div>
            ) : (
                // Dark background — full SVG lockup (icon + wordmark)
                <Image
                    src="/subtech-ajo-logo.svg"
                    alt="Subtech Ajo Solution"
                    width={w}
                    height={h}
                    priority
                    style={{ display: 'block' }}
                />
            )}
        </Link>
    );
};
