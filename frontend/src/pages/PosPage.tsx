import React, { useEffect, useState } from 'react';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  QrCode,
  CheckCircle,
  XCircle,
  User,
  ShoppingBag,
  Percent,
  IndianRupee,
  AlertCircle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Package,
} from 'lucide-react';
import { api } from '../api/client';
import { Product, Customer, CartItem, CartDiscount, CartValidation, DemoQRPaymentResponse } from '../types/api';
import { useLanguage } from '../i18n/LanguageContext';
import { useSoundbox } from '../components/layout/MainLayout';
import { DemoBadge } from '../components/common/DemoBadge';

export const PosPage: React.FC = () => {
  const { t } = useLanguage();
  const { playAnnouncement } = useSoundbox();

  // Catalogue & Customer state
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Cart & Discount state
  const [cart, setCart] = useState<{ [productId: number]: number }>({});
  const [discountType, setDiscountType] = useState<'NONE' | 'FIXED' | 'PERCENT'>('NONE');
  const [discountValue, setDiscountValue] = useState<number>(0);
  const [cartValidation, setCartValidation] = useState<CartValidation | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Payment / QR Modal state
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [qrData, setQrData] = useState<DemoQRPaymentResponse | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<number | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simulationResult, setSimulationResult] = useState<string | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodList, custList] = await Promise.all([
        api.getProducts(),
        api.getCustomers(),
      ]);
      setProducts(prodList);
      setCustomers(custList);
    } catch (err) {
      console.error('Failed to load POS data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Listen to Mitra Voice Assistant POS events
  useEffect(() => {
    const handleVoiceEvent = (e: any) => {
      const detail = e.detail;
      if (!detail) return;

      if (detail.action === 'ADD_ITEM' && detail.productId) {
        const prod = products.find((p) => p.id === detail.productId);
        const qtyToAdd = detail.quantity || 1;
        setCart((prev) => {
          const currentQty = prev[detail.productId] || 0;
          const maxStock = prod ? prod.current_stock : 999;
          const targetQty = Math.min(currentQty + qtyToAdd, maxStock);
          return {
            ...prev,
            [detail.productId]: targetQty,
          };
        });
      } else if (detail.action === 'CLEAR_CART') {
        clearCart();
      } else if (detail.action === 'APPLY_DISCOUNT') {
        setDiscountType(detail.discountType || 'NONE');
        setDiscountValue(detail.discountValue || 0);
      } else if (detail.action === 'GENERATE_QR') {
        handleGenerateQR();
      }
    };

    window.addEventListener('mitra-pos-voice-event', handleVoiceEvent);
    return () => window.removeEventListener('mitra-pos-voice-event', handleVoiceEvent);
  }, [products, cart, discountType, discountValue, selectedCustomerId]);

  // Sync cart validation with backend whenever cart or discount changes
  useEffect(() => {
    const cartItems: CartItem[] = Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([idStr, qty]) => ({
        product_id: Number(idStr),
        quantity: qty,
      }));

    if (cartItems.length === 0) {
      setCartValidation(null);
      setValidationError(null);
      return;
    }

    const discountPayload: CartDiscount = {
      discount_type: discountType,
      discount_value: discountValue,
    };

    api
      .validateCart(cartItems, discountPayload)
      .then((res) => {
        if (res.is_valid) {
          setCartValidation(res);
          setValidationError(null);
        } else {
          setValidationError(res.error_message || 'Invalid cart');
        }
      })
      .catch((err) => {
        setValidationError(err.message);
      });
  }, [cart, discountType, discountValue]);

  // Cart operations
  const addToCart = (product: Product) => {
    const currentQty = cart[product.id] || 0;
    if (currentQty >= product.current_stock) {
      alert(`Cannot add more than available stock (${product.current_stock} available).`);
      return;
    }
    setCart((prev) => ({
      ...prev,
      [product.id]: currentQty + 1,
    }));
  };

  const updateQuantity = (productId: number, delta: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;

    const currentQty = cart[productId] || 0;
    const newQty = currentQty + delta;

    if (newQty <= 0) {
      const next = { ...cart };
      delete next[productId];
      setCart(next);
      return;
    }

    if (newQty > product.current_stock) {
      alert(`Insufficient stock. Only ${product.current_stock} available.`);
      return;
    }

    setCart((prev) => ({
      ...prev,
      [productId]: newQty,
    }));
  };

  const removeFromCart = (productId: number) => {
    const next = { ...cart };
    delete next[productId];
    setCart(next);
  };

  const clearCart = () => {
    setCart({});
    setDiscountType('NONE');
    setDiscountValue(0);
    setCartValidation(null);
    setValidationError(null);
  };

  // Generate Demo UPI QR
  const handleGenerateQR = async () => {
    const cartItems: CartItem[] = Object.entries(cart)
      .filter(([_, qty]) => qty > 0)
      .map(([idStr, qty]) => ({
        product_id: Number(idStr),
        quantity: qty,
      }));

    if (cartItems.length === 0) return;

    try {
      setSimulating(true);
      const order = await api.createOrder({
        items: cartItems,
        discount: {
          discount_type: discountType,
          discount_value: discountValue,
        },
        customer_id: selectedCustomerId,
      });

      setCurrentOrderId(order.id);

      const qrResponse = await api.generateDemoQR(order.id);
      setQrData(qrResponse);
      setIsQrModalOpen(true);
    } catch (err: any) {
      alert(err.message || 'Failed to generate payment QR');
    } finally {
      setSimulating(false);
    }
  };

  // Payment Simulation Handler
  const handleSimulatePayment = async (action: 'SUCCESS' | 'FAILED' | 'CANCELLED') => {
    if (!currentOrderId || !qrData) return;

    try {
      setSimulating(true);
      const res = await api.simulatePayment(currentOrderId, qrData.transaction_reference, action);

      if (action === 'SUCCESS' && res.success) {
        setIsQrModalOpen(false);
        clearCart();
        loadData();

        if (res.soundbox) {
          playAnnouncement(res.soundbox);
        }
      } else if (action === 'FAILED') {
        setSimulationResult('Payment simulation failed. Inventory was not deducted.');
      } else {
        setIsQrModalOpen(false);
        clearCart();
      }
    } catch (err: any) {
      alert(err.message || 'Simulation error');
    } finally {
      setSimulating(false);
    }
  };

  // Filtered catalogue
  const categories = ['ALL', ...Array.from(new Set(products.map((p) => p.category)))];
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
    const matchesSearch =
      searchQuery === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const cartItemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20 lg:pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t.pos.title}
            </h1>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-teal-50 text-teal-800 border border-teal-200">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
              Counter Active
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">{t.pos.subtitle}</p>
        </div>

        <DemoBadge />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Product Catalogue (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Category Filter */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder={t.pos.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-2xs font-bold tracking-tight shrink-0 transition-all ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                  }`}
                >
                  {cat === 'ALL' ? t.pos.allCategories : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-40 rounded-2xl bg-slate-100 animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400 space-y-2">
              <Package className="w-10 h-10 mx-auto text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No products found</p>
              <p className="text-xs text-slate-400">Try adjusting your search query or category filter</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredProducts.map((p) => {
                const inCart = cart[p.id] || 0;
                const isOutOfStock = p.current_stock <= 0;
                const isLowStock = p.current_stock > 0 && p.current_stock <= p.reorder_threshold;

                return (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border transition-all text-left relative flex flex-col justify-between group ${
                      isOutOfStock
                        ? 'bg-slate-50 border-slate-200 opacity-60 cursor-not-allowed'
                        : inCart > 0
                        ? 'bg-teal-50/30 border-teal-500 shadow-2xs'
                        : 'bg-white border-slate-200/80 hover:border-teal-500 hover:shadow-xs cursor-pointer'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1 mb-2">
                        <span className="text-3xs uppercase font-extrabold text-slate-400 tracking-wider">
                          {p.category}
                        </span>
                        <span
                          className={`text-3xs font-extrabold px-1.5 py-0.5 rounded-md ${
                            isOutOfStock
                              ? 'bg-rose-100 text-rose-800'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200/60'
                          }`}
                        >
                          {isOutOfStock ? 'Out of stock' : `${p.current_stock} left`}
                        </span>
                      </div>

                      <h4 className="text-xs font-bold text-slate-900 line-clamp-2 leading-snug">
                        {p.name}
                      </h4>
                      <span className="text-3xs text-slate-400 font-mono mt-0.5 block">
                        {p.sku}
                      </span>
                    </div>

                    <div className="mt-4 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-sm sm:text-base font-black text-slate-900 tabular-nums">
                        ₹{p.selling_price}
                      </span>

                      {inCart > 0 ? (
                        <div className="flex items-center gap-1.5 bg-teal-600 text-white rounded-lg p-0.5 shadow-2xs">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(p.id, -1);
                            }}
                            className="p-1 hover:bg-teal-700 rounded transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="font-extrabold text-xs px-1 tabular-nums">{inCart}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateQuantity(p.id, 1);
                            }}
                            className="p-1 hover:bg-teal-700 rounded transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={isOutOfStock}
                          onClick={() => addToCart(p)}
                          className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-teal-600 hover:text-white text-slate-700 flex items-center justify-center transition-all disabled:opacity-40"
                          title="Add to cart"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Cart & Billing Summary (5 cols) */}
        <div
          id="pos-cart-panel"
          className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 space-y-4 lg:sticky lg:top-20"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-teal-600" />
              <h3 className="text-sm font-extrabold text-slate-900">{t.pos.cartTitle}</h3>
              <span className="text-2xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">
                {cartItemCount} items
              </span>
            </div>

            {cartItemCount > 0 && (
              <button
                onClick={clearCart}
                className="text-2xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                {t.pos.clearCart}
              </button>
            )}
          </div>

          {/* Customer Selection */}
          <div>
            <label className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider block mb-1.5">
              {t.pos.selectCustomer}
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : null)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">{t.pos.anonymousCustomer}</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.display_name} ({c.phone || 'No phone'}) — {c.segment}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Cart Items List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 pr-1">
            {cartItemCount === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                <ShoppingBag className="w-8 h-8 mx-auto text-slate-300" />
                <p className="font-semibold text-slate-500">{t.pos.emptyCart}</p>
                <p className="text-3xs text-slate-400">Click products from the catalogue to add them to this bill</p>
              </div>
            ) : (
              Object.entries(cart)
                .filter(([_, qty]) => qty > 0)
                .map(([idStr, qty]) => {
                  const p = products.find((prod) => prod.id === Number(idStr));
                  if (!p) return null;
                  const itemTotal = (Number(p.selling_price) * qty).toFixed(2);

                  return (
                    <div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
                      <div className="max-w-[160px]">
                        <span className="font-bold text-slate-900 block truncate">
                          {p.name}
                        </span>
                        <span className="text-3xs text-slate-400 font-medium tabular-nums">
                          ₹{p.selling_price} × {qty}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Quantity Stepper */}
                        <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                          <button
                            onClick={() => updateQuantity(p.id, -1)}
                            className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2 font-bold text-slate-900 text-2xs tabular-nums">{qty}</span>
                          <button
                            onClick={() => updateQuantity(p.id, 1)}
                            className="p-1 hover:bg-slate-200 text-slate-600 transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="font-black text-slate-900 w-16 text-right tabular-nums">
                          ₹{itemTotal}
                        </span>

                        <button
                          onClick={() => removeFromCart(p.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })
            )}
          </div>

          {/* Discount Selector */}
          {cartItemCount > 0 && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-3xs font-extrabold uppercase text-slate-400 tracking-wider block">
                  {t.pos.discount}
                </span>
                <span className="text-3xs text-slate-400">Merchant funded</span>
              </div>

              {/* Segmented control */}
              <div className="grid grid-cols-3 gap-1 bg-slate-200/60 p-1 rounded-lg text-2xs font-bold text-center">
                <button
                  onClick={() => {
                    setDiscountType('NONE');
                    setDiscountValue(0);
                  }}
                  className={`py-1 rounded-md transition-all ${
                    discountType === 'NONE'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  None
                </button>
                <button
                  onClick={() => setDiscountType('FIXED')}
                  className={`py-1 rounded-md transition-all ${
                    discountType === 'FIXED'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Fixed ₹
                </button>
                <button
                  onClick={() => setDiscountType('PERCENT')}
                  className={`py-1 rounded-md transition-all ${
                    discountType === 'PERCENT'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Percent %
                </button>
              </div>

              {discountType !== 'NONE' && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="number"
                    min="0"
                    placeholder="Enter value"
                    value={discountValue || ''}
                    onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                    className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 tabular-nums"
                  />

                  {/* 1-Click Quick Presets */}
                  <div className="flex items-center gap-1">
                    {discountType === 'FIXED' ? (
                      [10, 20, 50].map((amt) => (
                        <button
                          key={amt}
                          onClick={() => setDiscountValue(amt)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-3xs font-extrabold text-slate-700"
                        >
                          ₹{amt}
                        </button>
                      ))
                    ) : (
                      [5, 10, 15].map((pct) => (
                        <button
                          key={pct}
                          onClick={() => setDiscountValue(pct)}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-md text-3xs font-extrabold text-slate-700"
                        >
                          {pct}%
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Validation Error Message */}
          {validationError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{validationError}</span>
            </div>
          )}

          {/* Totals Breakdown */}
          {cartValidation && (
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs text-slate-600">
              <div className="flex items-center justify-between">
                <span>{t.pos.subtotal}</span>
                <span className="font-bold text-slate-800 tabular-nums">₹{cartValidation.subtotal}</span>
              </div>
              {Number(cartValidation.discount_amount) > 0 && (
                <div className="flex items-center justify-between text-rose-600">
                  <span>{t.pos.discount}</span>
                  <span className="font-bold tabular-nums">− ₹{cartValidation.discount_amount}</span>
                </div>
              )}
              <div className="flex items-center justify-between text-slate-400">
                <span>Tax (GST)</span>
                <span className="tabular-nums">₹0.00</span>
              </div>

              <div className="flex items-center justify-between pt-2.5 border-t border-slate-200 text-sm">
                <span className="font-extrabold text-slate-900">{t.pos.finalAmount}</span>
                <span className="text-2xl font-black text-emerald-600 tabular-nums">
                  ₹{cartValidation.final_amount}
                </span>
              </div>

              <div className="flex items-center justify-between text-3xs text-slate-400 font-medium">
                <span>Estimated Gross Margin</span>
                <span className="text-teal-700 font-bold tabular-nums">
                  +₹{cartValidation.estimated_gross_profit} gross profit
                </span>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="pt-2">
            <button
              disabled={cartItemCount === 0 || !!validationError || simulating}
              onClick={handleGenerateQR}
              className="w-full py-3.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:from-slate-200 disabled:to-slate-200 disabled:text-slate-400 text-white rounded-xl text-sm font-black shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed active:scale-98"
            >
              <QrCode className="w-5 h-5" />
              <span>{t.pos.generateQR}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Floating Action Pill on Mobile when Cart has items */}
      {cartItemCount > 0 && cartValidation && (
        <div className="fixed bottom-3 inset-x-3 bg-slate-900/95 backdrop-blur-md text-white p-3.5 rounded-2xl shadow-2xl flex items-center justify-between z-40 lg:hidden border border-slate-700">
          <div>
            <div className="text-3xs font-extrabold uppercase text-teal-400 tracking-wider">
              {cartItemCount} items selected
            </div>
            <div className="text-xl font-black tabular-nums text-white">
              ₹{cartValidation.final_amount}
            </div>
          </div>

          <button
            onClick={() => {
              const el = document.getElementById('pos-cart-panel');
              el?.scrollIntoView({ behavior: 'smooth' });
            }}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <span>Proceed</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Demo UPI QR Payment Modal */}
      {isQrModalOpen && qrData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-center">
            {/* Header */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 p-5 text-white">
              <h3 className="text-base font-extrabold tracking-tight">{t.pos.demoQRTitle}</h3>
              <p className="text-xs text-slate-300 mt-0.5 font-medium">
                Scan with any UPI App or use simulation buttons below
              </p>
            </div>

            {/* Disclaimer Banner */}
            <div className="bg-amber-50 p-2.5 border-b border-amber-200 text-amber-900 text-3xs font-extrabold uppercase tracking-wider flex items-center justify-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{qrData.disclaimer}</span>
            </div>

            {/* QR Code and Payment Info */}
            <div className="p-6 space-y-4">
              <div className="inline-block p-4 bg-white border-2 border-slate-900 rounded-2xl shadow-sm">
                <img
                  src={qrData.qr_code_base64}
                  alt="UPI QR Code"
                  className="w-48 h-48 mx-auto"
                />
              </div>

              <div>
                <span className="text-3xs text-slate-400 font-extrabold uppercase tracking-wider block">
                  Amount Payable
                </span>
                <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight tabular-nums">
                  ₹{qrData.amount}
                </span>
                <span className="text-xs text-slate-600 block mt-1 font-medium">
                  Pay to: <strong className="text-slate-900">{qrData.merchant_name}</strong> ({qrData.vpa})
                </span>
                <span className="text-3xs text-slate-400 font-mono block mt-0.5">
                  Ref: {qrData.transaction_reference}
                </span>
              </div>

              {simulationResult && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                  {simulationResult}
                </div>
              )}

              {/* Simulation Buttons */}
              <div className="space-y-2 pt-2">
                <button
                  disabled={simulating}
                  onClick={() => handleSimulatePayment('SUCCESS')}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-extrabold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>{t.pos.simulateSuccess}</span>
                </button>

                <button
                  disabled={simulating}
                  onClick={() => handleSimulatePayment('FAILED')}
                  className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  <span>{t.pos.simulateFail}</span>
                </button>

                <button
                  onClick={() => handleSimulatePayment('CANCELLED')}
                  className="w-full py-2 text-slate-500 hover:text-slate-800 text-xs font-semibold"
                >
                  {t.pos.cancelPayment}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};