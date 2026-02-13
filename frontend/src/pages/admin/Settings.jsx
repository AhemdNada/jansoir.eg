import React, { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCreditCard, faTruck, faSave, faSync } from '@fortawesome/free-solid-svg-icons';
import { settingsApi } from '../../api/settingsApi';
import { useAuth } from '../../context/AuthContext';

const Settings = () => {
    const { token } = useAuth();
    const [form, setForm] = useState({
        cashOnDeliveryEnabled: true,
        vodafoneCashEnabled: false,
        vodafoneCashNumber: '',
        instapayEnabled: false,
        instapayNumber: ''
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const loadSettings = async () => {
        try {
            setLoading(true);
            setError('');
            const data = await settingsApi.getPaymentShipping();
            setForm({
                cashOnDeliveryEnabled: !!data.cashOnDeliveryEnabled,
                vodafoneCashEnabled: !!data.vodafoneCashEnabled,
                vodafoneCashNumber: data.vodafoneCashNumber || '',
                instapayEnabled: !!data.instapayEnabled,
                instapayNumber: data.instapayNumber || ''
            });
        } catch (err) {
            setError(err.message || 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSettings();
    }, []);

    const updateField = (key, value) => {
        setForm(prev => ({ ...prev, [key]: value }));
    };

    const handleSubmit = async () => {
        try {
            setSaving(true);
            setMessage('');
            setError('');
            await settingsApi.updatePaymentShipping(token, form);
            setMessage('Settings saved successfully');
        } catch (err) {
            setError(err.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6" style={{ backgroundColor: '#000000', minHeight: '100%' }}>
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gold">Payments Settings</h1>
                    <p className="text-beige mt-1">Configure available payment methods.</p>
                </div>
                <button
                    onClick={loadSettings}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-woody bg-dark-light text-beige rounded-lg text-sm hover:bg-dark-base hover:text-gold"
                >
                    <FontAwesomeIcon icon={faSync} className={loading ? 'animate-spin' : ''} />
                    <span>Refresh</span>
                </button>
            </div>

            <div className="bg-dark-light rounded-xl shadow-sm border border-woody p-6 space-y-6">
                {error && <div className="px-4 py-3 rounded-lg bg-woody/30 text-woody-light border border-woody text-sm">{error}</div>}
                {message && <div className="px-4 py-3 rounded-lg bg-gold/20 text-gold border border-gold/30 text-sm">{message}</div>}

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center text-gold border border-gold/30">
                            <FontAwesomeIcon icon={faCreditCard} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gold">Payment Methods</h2>
                            <p className="text-sm text-beige">Enable/disable payment options and edit numbers.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 border border-woody rounded-lg bg-dark-base">
                            <div>
                                <p className="font-semibold text-beige">Cash on Delivery</p>
                                <p className="text-sm text-woody-light">Collect cash upon delivery.</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    className="sr-only peer"
                                    checked={form.cashOnDeliveryEnabled}
                                    onChange={(e) => updateField('cashOnDeliveryEnabled', e.target.checked)}
                                />
                                <div className="w-11 h-6 bg-dark-base border border-woody peer-focus:outline-none rounded-full peer 
                                    peer-checked:after:translate-x-full peer-checked:after:border-gold after:content-[''] 
                                    after:absolute after:top-[2px] after:left-[2px] after:bg-woody after:rounded-full 
                                    after:h-5 after:w-5 after:transition-all peer-checked:bg-gold peer-checked:border-gold peer-checked:after:bg-dark-base"></div>
                            </label>
                        </div>

                        <div className="p-4 border border-woody rounded-lg space-y-3 bg-dark-base">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-beige">Vodafone Cash</p>
                                    <p className="text-sm text-woody-light">Wallet number shown to buyers.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={form.vodafoneCashEnabled}
                                        onChange={(e) => updateField('vodafoneCashEnabled', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-dark-base border border-woody peer-focus:outline-none rounded-full peer 
                                        peer-checked:after:translate-x-full peer-checked:after:border-gold after:content-[''] 
                                        after:absolute after:top-[2px] after:left-[2px] after:bg-woody after:rounded-full 
                                        after:h-5 after:w-5 after:transition-all peer-checked:bg-gold peer-checked:border-gold peer-checked:after:bg-dark-base"></div>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-beige mb-1">Vodafone Cash Number</label>
                                <input
                                    type="text"
                                    value={form.vodafoneCashNumber}
                                    onChange={(e) => updateField('vodafoneCashNumber', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-woody bg-dark-light text-beige placeholder-woody-light focus:outline-none 
                                        focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="e.g., 0100 000 0000"
                                    disabled={!form.vodafoneCashEnabled}
                                />
                            </div>
                        </div>

                        <div className="p-4 border border-woody rounded-lg space-y-3 bg-dark-base">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-semibold text-beige">Instapay</p>
                                    <p className="text-sm text-woody-light">Instapay ID shown to buyers.</p>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={form.instapayEnabled}
                                        onChange={(e) => updateField('instapayEnabled', e.target.checked)}
                                    />
                                    <div className="w-11 h-6 bg-dark-base border border-woody peer-focus:outline-none rounded-full peer 
                                        peer-checked:after:translate-x-full peer-checked:after:border-gold after:content-[''] 
                                        after:absolute after:top-[2px] after:left-[2px] after:bg-woody after:rounded-full 
                                        after:h-5 after:w-5 after:transition-all peer-checked:bg-gold peer-checked:border-gold peer-checked:after:bg-dark-base"></div>
                                </label>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-beige mb-1">Instapay Number</label>
                                <input
                                    type="text"
                                    value={form.instapayNumber}
                                    onChange={(e) => updateField('instapayNumber', e.target.value)}
                                    className="w-full px-4 py-2 rounded-lg border border-woody bg-dark-light text-beige placeholder-woody-light focus:outline-none 
                                        focus:ring-2 focus:ring-gold/20 focus:border-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                    placeholder="Instapay ID"
                                    disabled={!form.instapayEnabled}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-gold/20 flex items-center justify-center text-gold border border-gold/30">
                            <FontAwesomeIcon icon={faTruck} />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-gold">Shipping</h2>
                            <p className="text-sm text-beige">Shipping is managed per-governorate in Admin → Cart.</p>
                        </div>
                    </div>
                    <div className="px-4 py-3 rounded-lg bg-dark-base border border-woody text-sm text-beige">
                        To edit shipping prices by governorate, go to <span className="text-gold font-semibold">Admin → Cart</span>.
                    </div>
                </div>

                <div className="pt-4 border-t border-woody flex justify-end gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={saving || loading}
                        className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-dark-base rounded-lg 
                            hover:bg-gold-dark transition-colors shadow-sm disabled:opacity-50"
                    >
                        <FontAwesomeIcon icon={faSave} />
                        <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Settings;
