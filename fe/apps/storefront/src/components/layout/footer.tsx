import { Link } from '@tanstack/react-router'
import { useTranslation } from 'react-i18next'
import { Logo } from './logo'

export function Footer() {
    const { t } = useTranslation()
    const year = new Date().getFullYear()
    return (
        <footer className="mt-12 border-t bg-white">
            <div className="container-page grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-3">
                    <Logo />
                    <p className="text-sm text-gray-500">{t('footer.tagline')}</p>
                </div>
                <nav aria-label={t('footer.support')}>
                    <h2 className="mb-3 text-sm font-semibold text-gray-900 uppercase">{t('footer.support')}</h2>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li>{t('footer.helpCenter')}</li>
                        <li>{t('footer.shippingInfo')}</li>
                        <li>{t('footer.returnPolicy')}</li>
                        <li>{t('footer.contact')}</li>
                    </ul>
                </nav>
                <nav aria-label={t('footer.about')}>
                    <h2 className="mb-3 text-sm font-semibold text-gray-900 uppercase">{t('footer.about')}</h2>
                    <ul className="space-y-2 text-sm text-gray-600">
                        <li>
                            <Link to="/seller/register" className="hover:text-brand-600">
                                {t('footer.sellWithUs')}
                            </Link>
                        </li>
                        <li>
                            <Link to="/shipper/register" className="hover:text-brand-600">
                                {t('footer.becomeShipper')}
                            </Link>
                        </li>
                        <li>{t('footer.terms')}</li>
                        <li>{t('footer.privacy')}</li>
                    </ul>
                </nav>
                <div>
                    <h2 className="mb-3 text-sm font-semibold text-gray-900 uppercase">{t('footer.payment')}</h2>
                    <p className="text-sm text-gray-600">{t('footer.paymentCod')}</p>
                </div>
            </div>
            <div className="border-t py-4 text-center text-xs text-gray-500">{t('footer.copyright', { year })}</div>
        </footer>
    )
}
