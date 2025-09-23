import React from 'react';
import { clsx } from 'clsx';
import { Typography } from '../ui';

interface FooterProps {
  className?: string;
  showCopyright?: boolean;
  links?: Array<{
    label: string;
    href: string;
  }>;
}

const Footer: React.FC<FooterProps> = ({
  className,
  showCopyright = true,
  links = [],
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={clsx('bg-gray-50 border-t border-gray-200', className)}>
      <div className="container-responsive py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          {/* Links */}
          {links.length > 0 && (
            <div className="flex flex-wrap gap-6 mb-4 md:mb-0">
              {links.map((link, index) => (
                <a
                  key={`${link.href}-${index}`}
                  href={link.href}
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
                >
                  {link.label}
                </a>
              ))}
            </div>
          )}

          {/* Copyright */}
          {showCopyright && (
            <Typography variant="body2" color="gray">
              © {currentYear} Organization Survey Tool. All rights reserved.
            </Typography>
          )}
        </div>

        {/* Additional info */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Typography variant="caption" color="gray">
            従業員エンゲージメント向上を目的とした組織改善ツール
          </Typography>
        </div>
      </div>
    </footer>
  );
};

export default Footer;