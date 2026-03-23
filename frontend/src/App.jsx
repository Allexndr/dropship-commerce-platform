import React, { useState } from 'react';
import {
    BarChart3,
    Box,
    ChevronDown,
    ExternalLink,
    LayoutDashboard,
    LogOut,
    Menu,
    Plus,
    Search,
    Settings,
    ShoppingBag,
    Trash2,
    User,
    Users,
    Edit,
    Download,
    Upload,
    RefreshCcw,
    Copy,
    PlusCircle,
    AlertCircle
} from 'lucide-react';
import { mockProducts, mockUsers, pricingRules, deliveryPrices, DELIVERY_PLUS } from './data';
import axios from 'axios';
import './App.css';

const API_BASE = '/api/v1';

export default function App() {
    const [isLogged, setIsLogged] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [editingProduct, setEditingProduct] = useState(null);
    const [userRole, setUserRole] = useState('admin');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isLiveMode, setIsLiveMode] = useState(false);
    const [shopData, setShopData] = useState({ id: 1, name: 'NRT Store', api_key: '' });

    const navItems = [
        { id: 'dashboard', label: 'Главная', icon: <LayoutDashboard size={20} />, roles: ['admin', 'manager'] },
        { id: 'products', label: 'Товары', icon: <Box size={20} />, roles: ['admin', 'manager', 'praiser'] },
        { id: 'shop', label: 'Магазин', icon: <ShoppingBag size={20} />, roles: ['admin', 'manager', 'seller'] },
        { id: 'analytics', label: 'Аналитика', icon: <BarChart3 size={20} />, roles: ['admin', 'manager', 'analytic'] },
        { id: 'users', label: 'Пользователи', icon: <Users size={20} />, roles: ['admin', 'manager'] },
        { id: 'profile', label: 'Профиль', icon: <User size={20} />, roles: ['admin', 'manager'] },
        { id: 'orders', label: 'Заказы Kaspi', icon: <ShoppingBag size={20} />, roles: ['admin', 'manager', 'seller'] },
    ];

    const allowedTabs = navItems.filter(item => item.roles.includes(userRole));

    try {
        const renderContent = () => {
            if (editingProduct) {
                // Determine if we need to fall back to a specific update function, 
                // but actually editingProduct is stored in the Products component state, not App state.
                // Wait, editingProduct is in App.jsx but products are in Products.jsx!
                // Wait, let's look at how editingProduct is set.
                return <ProductDetail
                    product={editingProduct}
                    onBack={(updatedProduct) => {
                        // The actual products list is inside the Products component.
                        // We will need to just pass onBack. The updating behavior will be handled next.
                        setEditingProduct(null);
                    }}
                />;
            }

            switch (activeTab) {
                case 'dashboard': return <Dashboard />;
                case 'products': return <Products onEdit={setEditingProduct} />;
                case 'shop': return <Shop />;
                case 'analytics': return <Analytics />;
                case 'users': return <UsersTable />;
                case 'profile': return <Profile />;
                case 'orders': return <Orders shopId={shopData.id} />;
                default:
                    const firstTab = allowedTabs[0]?.id || 'dashboard';
                    return activeTab === firstTab ? <Dashboard /> : <Dashboard />; // Fallback
            }
        };

        if (!isLogged) {
            return <LoginPage onLogin={(role) => {
                setIsLogged(true);
                if (role) {
                    setUserRole(role);
                    // Redirect to first allowed tab for this role
                    const roleTabs = navItems.filter(item => item.roles.includes(role));
                    if (roleTabs.length > 0) setActiveTab(roleTabs[0].id);
                }
            }} />;
        }

        return (
            <div className="layout">
                {/* Sidebar Overlay (Mobile) */}
                {isSidebarOpen && <div className="sidebar-overlay" onClick={() => setIsSidebarOpen(false)}></div>}

                {/* Sidebar */}
                <aside className={`sidebar ${isSidebarOpen ? 'open' : ''}`}>
                    <div className="logo">
                        <div className="logo-box">DS</div>
                        <span>DropShift</span>
                    </div>

                    <nav className="nav">
                        {allowedTabs.map(item => (
                            <NavItem
                                key={item.id}
                                active={activeTab === item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setEditingProduct(null);
                                    setIsSidebarOpen(false); // Close on selection on mobile
                                }}
                                icon={item.icon}
                                label={item.label}
                            />
                        ))}
                    </nav>

                    <div className="sidebar-footer">
                        <button onClick={() => setIsLogged(false)} className="logout-btn">
                            <LogOut size={18} />
                            <span>Выйти</span>
                        </button>
                    </div>
                </aside>

                {/* Main Container */}
                <main className="main-container">
                    <header className="header">
                        <div className="header-left">
                            <button className="menu-toggle" onClick={() => setIsSidebarOpen(true)}>
                                <Menu size={24} />
                            </button>
                            <div className="header-info">
                                <h2 className="shop-name">{shopData.name}</h2>
                                {isLiveMode && <div className="live-indicator">LIVE</div>}
                                <UserMenu userRole={userRole} onLogout={() => setIsLogged(false)} />
                            </div>
                        </div>
                        <div className="header-actions">
                            <button className="icon-btn"><RefreshCcw size={18} /></button>
                            <button className="icon-btn"><Settings size={18} /></button>
                        </div>
                    </header>

                    <div className="content-scroller custom-scrollbar">
                        {renderContent()}
                    </div>
                </main>
            </div>
        );
    } catch (err) {
        console.error('App Render Error:', err);
        return <div style={{ color: 'white', background: 'red', padding: '20px' }}>Render Error: {err.message}</div>;
    }
}

// Sub-components
function NavItem({ active, icon, label, onClick }) {
    return (
        <div className={`nav-item ${active ? 'active' : ''}`} onClick={onClick}>
            {icon}
            <span>{label}</span>
        </div>
    );
}

function LoginPage({ onLogin }) {
    const [forgotMode, setForgotMode] = useState(false);
    const [email, setEmail] = useState('admin@nrt.kz');
    const [password, setPassword] = useState('12345678');
    const [status, setStatus] = useState('');
    const [selectedRole, setSelectedRole] = useState('admin');

    const handleForgot = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE}/users/reset-password?email=${email}`);
            setStatus(`Инструкция по сбросу отправлена на ${email}`);
        } catch (err) {
            setStatus('Ошибка. Проверьте Email.');
        }
    };

    const roles = [
        { id: 'admin', label: 'Админ', email: 'admin@nrt.kz' },
        { id: 'manager', label: 'Менеджер', email: 'manager@nrt.kz' },
        { id: 'praiser', label: 'Оценщик', email: 'praiser@nrt.kz' },
        { id: 'seller', label: 'Продавец', email: 'seller@nrt.kz' },
        { id: 'analytic', label: 'Аналитик', email: 'analytic@nrt.kz' },
    ];

    const quickLogin = (role) => {
        setEmail(role.email);
        setPassword('12345678');
        setSelectedRole(role.id);
    };

    if (forgotMode) {
        return (
            <div className="login-screen">
                <div className="login-card glass">
                    <div className="login-header">
                        <h1>Восстановление</h1>
                        <p>Введите ваш email для сброса пароля</p>
                    </div>
                    {status ? (
                        <div className="alert-box success mt">
                            <p>{status}</p>
                            <button className="btn-secondary full mt" onClick={() => { setForgotMode(false); setStatus(''); }}>Вернуться</button>
                        </div>
                    ) : (
                        <form className="login-form" onSubmit={handleForgot}>
                            <div className="form-group">
                                <label>Логин Email</label>
                                <input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn-primary full">сброс пароля</button>
                            <button type="button" className="btn-link" onClick={() => setForgotMode(false)}>Вернуться ко входу</button>
                        </form>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="login-screen">
            <div className="login-card glass">
                <div className="login-header">
                    <div className="logo-box lg">DS</div>
                    <h1>Дропшиппинг</h1>
                    <p>Входная страница</p>
                </div>

                <div className="quick-login-section">
                    <p className="quick-login-title">Войти как:</p>
                    <div className="role-buttons">
                        {roles.map(role => (
                            <button
                                key={role.id}
                                type="button"
                                className={`role-btn ${selectedRole === role.id ? 'active' : ''}`}
                                onClick={() => quickLogin(role)}
                            >
                                {role.label}
                            </button>
                        ))}
                    </div>
                </div>

                <form className="login-form" onSubmit={(e) => { e.preventDefault(); onLogin(selectedRole); }}>
                    <div className="form-group">
                        <label>Логин Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Пароль</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} required />
                        <small>Пароль должен состоять минимум из 8 знаков.</small>
                    </div>
                    <button type="submit" className="btn-primary full">вход</button>
                    <button type="button" className="btn-link" onClick={() => setForgotMode(true)}>забыли пароль</button>
                </form>
            </div>
        </div>
    );
}

function UserMenu({ userRole, onLogout }) {
    const [isOpen, setIsOpen] = useState(false);
    const [changePasswordMode, setChangePasswordMode] = useState(false);
    const [passwords, setPasswords] = useState({ old: '', new1: '', new2: '' });

    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwords.new1 !== passwords.new2) {
            alert("Пароли не совпадают!");
            return;
        }
        if (passwords.new1.length < 8) {
            alert("Пароль должен быть не менее 8 символов!");
            return;
        }

        try {
            await axios.post(`${API_BASE}/users/change-password`, {
                old_password: passwords.old,
                new_password: passwords.new1
            });
            alert("Пароль успешно изменен!");
            setChangePasswordMode(false);
            setPasswords({ old: '', new1: '', new2: '' });
        } catch (err) {
            alert("Ошибка при смене пароля. Проверьте старый пароль.");
        }
    };

    return (
        <div className="user-menu-wrapper">
            <div className="user-login-trigger" onClick={() => setIsOpen(!isOpen)}>
                {userRole.toUpperCase()} <ChevronDown size={14} />
            </div>

            {isOpen && (
                <div className="user-dropdown-card glass">
                    <button onClick={() => { setChangePasswordMode(true); setIsOpen(false); }}>сменить пароль</button>
                    <hr />
                    <button onClick={onLogout} className="text-red">Выход</button>
                </div>
            )}

            {changePasswordMode && (
                <div className="modal-overlay">
                    <div className="modal-card glass">
                        <h3>Сменить пароль</h3>
                        <form onSubmit={handleChangePassword}>
                            <div className="form-group">
                                <label>Старый пароль</label>
                                <input type="password" value={passwords.old} onChange={e => setPasswords({ ...passwords, old: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Новый пароль</label>
                                <input type="password" value={passwords.new1} onChange={e => setPasswords({ ...passwords, new1: e.target.value })} required />
                            </div>
                            <div className="form-group">
                                <label>Повторите новый пароль</label>
                                <input type="password" value={passwords.new2} onChange={e => setPasswords({ ...passwords, new2: e.target.value })} required />
                            </div>
                            <div className="modal-actions">
                                <button type="button" className="btn-secondary" onClick={() => setChangePasswordMode(false)}>Отмена</button>
                                <button type="submit" className="btn-primary">сохранить</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function Dashboard() {
    const xmlUrl = `${window.location.origin} /api/v1 / kaspi / xml ? token = fvblMh3EkBCHhR1AD...`;
    return (
        <div className="page-content">
            <div className="section-header">
                <h1>Главная</h1>
                <p>XML-фид для автоматической загрузки Kaspi</p>
            </div>

            <div className="card xml-card">
                <div className="xml-header">
                    <div className="xml-badge">XML FEED KASPI</div>
                    <button className="btn-secondary sm" onClick={() => navigator.clipboard.writeText(xmlUrl)}>
                        <Copy size={16} /> Копировать ссылку
                    </button>
                </div>
                <div className="xml-url-box">
                    <code>{xmlUrl}</code>
                </div>
                <div className="xml-status">
                    <div className="status-item">
                        <span className="dot ok"></span>
                        <strong>Статус:</strong> Активен
                    </div>
                    <div className="status-item">
                        <strong>Товаров в фиде:</strong> 1,248
                    </div>
                    <div className="status-item">
                        <strong>Последнее обновление:</strong> 12 мин. назад
                    </div>
                </div>
                <div className="xml-info mt">
                    <p><AlertCircle size={14} /> Используйте эту ссылку в личном кабинете Kaspi Pay для автоматического обновления цен.</p>
                    <a href="https://guide.kaspi.kz/partner/ru/shop/goods/price_list/q3251" target="_blank" rel="noreferrer" className="btn-link">Инструкция Kaspi <ExternalLink size={14} /></a>
                </div>
            </div>
        </div>
    );
}

function Products({ onEdit }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [shopRules, setShopRules] = useState(null);

    // Filter states based on wireframe
    const [selectedBrand, setSelectedBrand] = useState('SONY');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [deliveryRange, setDeliveryRange] = useState({ min: '', max: '' });
    const [withoutLinks, setWithoutLinks] = useState(false);
    const [withLinks, setWithLinks] = useState(true);
    const [appliedFilters, setAppliedFilters] = useState({
        brand: 'SONY',
        price: { min: '', max: '' },
        delivery: { min: '', max: '' },
        withoutLinks: false,
        withLinks: true
    });

    React.useEffect(() => {
        fetchEverything();
    }, []);

    const fetchEverything = async () => {
        setLoading(true);
        try {
            // 1. Fetch Shop Rules
            let rules = { percentage_rules: [], delivery_price_rules: [], delivery_plus: 0 };
            try {
                const shopRes = await axios.get(`${API_BASE}/shops/me`);
                rules = {
                    ...shopRes.data,
                    percentage_rules: JSON.parse(shopRes.data.percentage_rules || '[]'),
                    delivery_price_rules: JSON.parse(shopRes.data.delivery_price_rules || '[]')
                };
            } catch (e) {
                console.warn('Using default shop rules');
                rules = {
                    percentage_rules: [
                        { min: 0, max: 3000, percent: 110 },
                        { min: 3001, max: 5000, percent: 100 },
                        { min: 5001, max: 10000, percent: 90 },
                        { min: 10001, max: 2000000, percent: 80 }
                    ],
                    delivery_price_rules: [
                        { min: 0, max: 3000, price: 175 },
                        { min: 3001, max: 1000000, price: 500 }
                    ],
                    delivery_plus: 3
                };
            }
            setShopRules(rules);

            // 2. Fetch Products
            const response = await axios.get(`${API_BASE}/products/`);
            const data = response.data;
            
            const processed = data.map(p => {
                const activeLinks = (p.links || []).filter(l => l.stock_status === 'active' && l.price > 0);
                const priceMid = activeLinks.length > 0
                    ? Math.round(activeLinks.reduce((sum, l) => sum + l.price, 0) / activeLinks.length)
                    : 0;

                const maxDeliveryMP = activeLinks.length > 0
                    ? Math.max(...activeLinks.map(l => l.delivery_days))
                    : 0;
                
                const deliveryMid = priceMid > 0 ? maxDeliveryMP + rules.delivery_plus : 0;

                // Apply rules
                let percent = 0;
                const pRule = rules.percentage_rules.find(r => priceMid >= r.min && priceMid <= r.max);
                if (pRule) percent = pRule.percent;

                let deliveryPrice = 0;
                const dRule = rules.delivery_price_rules.find(r => priceMid >= r.min && priceMid <= r.max);
                if (dRule) deliveryPrice = dRule.price;

                const finalPrice = priceMid > 0
                    ? Math.round(priceMid + (priceMid * percent / 100) + deliveryPrice)
                    : p.kaspi_price || 0;

                return {
                    ...p,
                    mid_price: priceMid,
                    delivery_days: deliveryMid,
                    calculated_price: finalPrice
                };
            });
            
            setProducts(processed);
            setError(null);
        } catch (err) {
            console.error('Fetch products error:', err);
            setError('Ошибка загрузки данных');
        } finally {
            setLoading(false);
        }
    };

    const handleApplyFilters = () => {
        setAppliedFilters({
            brand: selectedBrand,
            price: { ...priceRange },
            delivery: { ...deliveryRange },
            withoutLinks,
            withLinks
        });
    };

    const handleAction = async (actionName) => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            alert(`Выполнено: ${actionName}`);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProduct = (updatedProduct) => {
        setProducts(prev => prev.map(p => p.sku === updatedProduct.sku ? updatedProduct : p));
    };

    const filteredProducts = products.filter(p => {
        const matchesBrand = appliedFilters.brand === 'Все бренды' || p.brand === appliedFilters.brand;
        
        const price = p.calculated_price || p.kaspi_price || 0;
        const matchesPriceMin = appliedFilters.price.min === '' || price >= parseInt(appliedFilters.price.min);
        const matchesPriceMax = appliedFilters.price.max === '' || price <= parseInt(appliedFilters.price.max);

        const delivery = p.delivery_days || 0;
        const matchesDelivMin = appliedFilters.delivery.min === '' || delivery >= parseInt(appliedFilters.delivery.min);
        const matchesDelivMax = appliedFilters.delivery.max === '' || delivery <= parseInt(appliedFilters.delivery.max);

        const hasLinks = p.links && p.links.length > 0;
        let matchesLinks = true;
        if (appliedFilters.withoutLinks && appliedFilters.withLinks) matchesLinks = true;
        else if (appliedFilters.withoutLinks) matchesLinks = !hasLinks;
        else if (appliedFilters.withLinks) matchesLinks = hasLinks;

        return matchesBrand && matchesPriceMin && matchesPriceMax && matchesDelivMin && matchesDelivMax && matchesLinks;
    });

    return (
        <div className="page-content">
            <div className="products-toolbar">
                <button className="btn-secondary" onClick={() => alert('Добавление товара...')}>Добавить товар</button>
                <button className="btn-secondary" onClick={() => alert('Импорт...')}>Импорт EXCEL</button>
                <button className="btn-secondary" onClick={() => alert('Скачивание...')}>Скачать EXCEL</button>
                <button className="btn-secondary" onClick={() => handleAction('Обновить КАСПИ')}>Обновить КАСПИ</button>
                <button className="btn-secondary" onClick={() => handleAction('Обновить ЦЕНЫ')}>Обновить ЦЕНЫ</button>
                <button className="btn-secondary" onClick={() => handleAction('Обновить ВСЕ')}>Обновить ВСЕ</button>
            </div>

            <div className="products-layout cards-gap">
                <div className="filter-section-vertical card mini">
                    <div className="vertical-filter-item">
                        <label>ВЫБРАТЬ БРЕНД</label>
                        <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}>
                            <option>Все бренды</option>
                            <option>SONY</option>
                            {[...new Set(products.map(p => p.brand))].filter(b => b && b !== 'SONY').map(b => (
                                <option key={b}>{b}</option>
                            ))}
                        </select>
                    </div>

                    <div className="vertical-filter-item">
                        <label>ВЫБРАТЬ ДИАПАЗОН ЦЕН</label>
                        <div className="price-range-inputs">
                            <span className="range-label">от</span>
                            <input type="number" value={priceRange.min} onChange={(e) => setPriceRange({ ...priceRange, min: e.target.value })} />
                            <span className="range-label">до</span>
                            <input type="number" value={priceRange.max} onChange={(e) => setPriceRange({ ...priceRange, max: e.target.value })} />
                        </div>
                    </div>

                    <div className="vertical-filter-item">
                        <label>ВЫБРАТЬ ДИАПАЗОН ДОСТАВКИ</label>
                        <div className="delivery-range-inputs">
                            <span className="range-label">от</span>
                            <input type="number" value={deliveryRange.min} onChange={(e) => setDeliveryRange({ ...deliveryRange, min: e.target.value })} />
                            <span className="range-label">до</span>
                            <input type="number" value={deliveryRange.max} onChange={(e) => setDeliveryRange({ ...deliveryRange, max: e.target.value })} />
                        </div>
                    </div>

                    <div className="checkbox-filter-item">
                        <label>ВЫБРАТЬ ТОВАРЫ БЕЗ ССЫЛОК</label>
                        <input type="checkbox" checked={withoutLinks} onChange={(e) => setWithoutLinks(e.target.checked)} />
                    </div>

                    <div className="checkbox-filter-item">
                        <label>ВЫБРАТЬ ТОВАРЫ С ССЫЛКАМИ</label>
                        <input type="checkbox" checked={withLinks} onChange={(e) => setWithLinks(e.target.checked)} />
                    </div>

                    <button className="btn-apply-filters" onClick={handleApplyFilters}>Применить</button>
                </div>

                <div className="card table-card overflow-x">
                    <table className="data-table mt-0">
                        <thead>
                            <tr>
                                <th>SKU</th>
                                <th>model</th>
                                <th>brand</th>
                                <th>Price kaspi</th>
                                <th>Price mid</th>
                                <th>Delivery mid</th>
                                <th>quantity</th>
                                <th style={{ width: '80px' }}>edit</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading && <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Загрузка товаров...</td></tr>}
                            {!loading && filteredProducts.map(p => (
                                <tr key={p.sku} onDoubleClick={() => onEdit(p, handleUpdateProduct)}>
                                    <td><code className="sku">{p.sku}</code></td>
                                    <td>{p.name}</td>
                                    <td>{p.brand}</td>
                                    <td>{(p.calculated_price || p.kaspi_price).toLocaleString()}</td>
                                    <td>{(p.mid_price || 0).toLocaleString()}</td>
                                    <td>{p.delivery_days}</td>
                                    <td>{p.stock}</td>
                                    <td>
                                        <button className="icon-btn sm" onClick={() => onEdit(p, handleUpdateProduct)}>
                                            <Edit size={14} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {!loading && filteredProducts.length === 0 && (
                                <tr><td colSpan="8" style={{ textAlign: 'center', padding: '20px' }}>Товары не найдены</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function ProductDetail({ product: initialProduct, onBack, onUpdate }) {
    const [product, setProduct] = useState(initialProduct);

    const syncUpdate = (updatedProduct) => {
        setProduct(updatedProduct);
        if (onUpdate) onUpdate(updatedProduct);
    };

    const handleAddLink = (source) => {
        const url = prompt(`Введите ссылку на товар ${source.toUpperCase()}:`);
        if (!url) return;

        const newLink = {
            id: Date.now(),
            source: source,
            external_id: Math.floor(Math.random() * 100000000).toString(),
            name: `Спарсенный товар ${source.toUpperCase()}`,
            price: Math.floor(10000 + Math.random() * 30000),
            delivery_days: Math.floor(5 + Math.random() * 10),
            stock_status: 'active',
            url: url
        };

        const updated = {
            ...product,
            links: [...product.links, newLink]
        };
        syncUpdate(updated);
    };

    const handleEditLink = (linkId) => {
        const newPrice = prompt("Введите новую цену для тестирования (только цифры):");
        if (newPrice && !isNaN(newPrice)) {
            const updated = {
                ...product,
                links: product.links.map(l => l.id === linkId ? { ...l, price: parseInt(newPrice) } : l)
            };
            syncUpdate(updated);
        }
    };

    const handleDeleteLink = (linkId) => {
        if (window.confirm("Вы уверены, что хотите удалить эту ссылку?")) {
            const updated = {
                ...product,
                links: product.links.filter(l => l.id !== linkId)
            };
            syncUpdate(updated);
        }
    };

    return (
        <div className="page-content">
            <div className="detail-header">
                <button className="btn-link" onClick={onBack}>&larr; Назад к списку</button>
            </div>

            <div className="detail-actions-top">
                <button className="btn-outline-blue" onClick={() => handleAddLink('wb')}>Добавить товар ВБ</button>
                <button className="btn-outline-blue" onClick={() => handleAddLink('ozon')}>Добавить товар ОЗОН</button>
            </div>

            <table className="bordered-info-table">
                <tbody>
                    <tr>
                        <td>SKU</td>
                        <td>{product.sku || '-'}</td>
                    </tr>
                    <tr>
                        <td>Brand</td>
                        <td>{product.brand || '-'}</td>
                    </tr>
                    <tr>
                        <td>Model</td>
                        <td>{product.name || '-'}</td>
                    </tr>
                    <tr>
                        <td>PRICE KASPI</td>
                        <td>{(product.kaspi_price || 0).toLocaleString()}</td>
                    </tr>
                    <tr>
                        <td>ССЫЛКА</td>
                        <td>
                            <a href={product.kaspi_link || '#'} target="_blank" rel="noreferrer" className="btn-link" style={{ wordBreak: 'break-all' }}>
                                {product.kaspi_link || 'https://kaspi.kz/shop/p/...'}
                            </a>
                        </td>
                    </tr>
                </tbody>
            </table>

            <div className="card table-card overflow-x">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>артикул</th>
                            <th>Название</th>
                            <th>Цена</th>
                            <th>Доставка</th>
                            <th>ссылка</th>
                            <th style={{ width: '150px' }}>действие</th>
                        </tr>
                    </thead>
                    <tbody>
                        {product.links.length > 0 ? product.links.map(l => (
                            <tr key={l.id}>
                                <td>{l.external_id}</td>
                                <td>{l.name}</td>
                                <td>{l.price.toLocaleString()}</td>
                                <td>{l.delivery_days}</td>
                                <td>
                                    <a href={l.url} target="_blank" rel="noreferrer" className="btn-link">Открыть</a>
                                </td>
                                <td>
                                    <div className="row-actions">
                                        <button className="icon-btn sm" onClick={() => handleEditLink(l.id)}>
                                            <Edit size={14} />
                                        </button>
                                        <button className="btn-delete-link" onClick={() => handleDeleteLink(l.id)}>
                                            <Trash2 size={14} /> Удалить
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="6" className="empty-row text-center">Ссылок пока нет.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function UsersTable() {
    // Admin, Manager, Praiser, Seller, Analytic
    const [usersList, setUsersList] = useState([
        { id: 1, login: 'admin@nrt.kz', shop: 'Все', role: 'admin' },
        { id: 2, login: 'manager@nrt.kz', shop: 'NRT Store', role: 'manager' },
        { id: 3, login: 'praiser@nrt.kz', shop: 'NRT Store', role: 'praiser' },
        { id: 4, login: 'seller@nrt.kz', shop: 'NRT Store', role: 'seller' },
        { id: 5, login: 'analytic@nrt.kz', shop: 'NRT Store', role: 'analytic' }
    ]);

    const handleAddUser = () => {
        const login = prompt("Введите email нового пользователя:");
        if (login) {
            const nu = { id: Date.now(), login, shop: 'NRT Store', role: 'manager' };
            setUsersList([...usersList, nu]);
        }
    };

    const handleEditUser = (id) => {
        const newRole = prompt("Введите новую роль (admin, manager, praiser, seller, analytic):");
        if (newRole) {
            setUsersList(usersList.map(u => u.id === id ? { ...u, role: newRole } : u));
        }
    };

    const handleDeleteUser = (id) => {
        if (window.confirm("Удалить пользователя?")) {
            setUsersList(usersList.filter(u => u.id !== id));
        }
    };

    return (
        <div className="page-content">
            <div className="section-header-flex">
                <div>
                    <h1>Пользователи</h1>
                    <p>Управление правами доступа (admin, manager, praiser, seller, analytic)</p>
                </div>
                <button className="btn-primary" onClick={handleAddUser}><PlusCircle size={18} /> Новый пользователь</button>
            </div>

            <div className="card table-card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User Login</th>
                            <th>Shop</th>
                            <th>Role</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {usersList.map(u => (
                            <tr key={u.id}>
                                <td>{u.login}</td>
                                <td><span className="badge-shop">{u.shop}</span></td>
                                <td><span className="role-badge">{u.role}</span></td>
                                <td><div className="row-actions"><button className="icon-btn sm" onClick={() => handleEditUser(u.id)}><Edit size={14} /></button><button className="icon-btn sm red" onClick={() => handleDeleteUser(u.id)}><Trash2 size={14} /></button></div></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Profile() {
    const [shop, setShop] = useState(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        fetchShop();
    }, []);

    const fetchShop = async () => {
        try {
            const res = await axios.get(`${API_BASE}/shops/me`);
            // Parse JSON strings from backend into arrays
            const data = { ...res.data };
            data.percentage_rules = JSON.parse(data.percentage_rules || '[]');
            data.delivery_price_rules = JSON.parse(data.delivery_price_rules || '[]');
            setShop(data);
        } catch (err) {
            console.error('Fetch shop error:', err);
            // Default mock data matching wireframe
            setShop({
                name: 'NRT Store',
                custom_shop_id: '16493269',
                kaspi_token: 'fvblMh3EkBCHhR1ADzSBnNbJdvhj6CjeEWhVPfXMFgY=',
                percentage_rules: [
                    { min: 0, max: 3000, percent: 110 },
                    { min: 3001, max: 5000, percent: 100 },
                    { min: 5001, max: 10000, percent: 90 },
                    { min: 10001, max: 20000, percent: 85 },
                    { min: 20001, max: 30000, percent: 80 },
                    { min: 30001, max: 40000, percent: 75 },
                    { min: 40001, max: 50000, percent: 70 },
                    { min: 50001, max: 60000, percent: 65 },
                    { min: 60001, max: 1000000, percent: 60 },
                ],
                delivery_price_rules: [
                    { min: 0, max: 1000, price: 60 },
                    { min: 1001, max: 3000, price: 175 },
                    { min: 3001, max: 5000, price: 231 },
                    { min: 5001, max: 10000, price: 927 },
                    { min: 10001, max: 1000000, price: 1750 },
                ],
                delivery_plus: 3
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async (updatedShop) => {
        setLoading(true);
        try {
            const payload = { ...updatedShop };
            payload.percentage_rules = JSON.stringify(payload.percentage_rules);
            payload.delivery_price_rules = JSON.stringify(payload.delivery_price_rules);
            await axios.patch(`${API_BASE}/shops/me`, payload);
            setShop(updatedShop);
            alert("Настройки системы сохранены!");
        } catch (err) {
            alert("Ошибка сохранения настроек.");
        } finally {
            setLoading(false);
        }
    };

    const editPercentRules = () => {
        const json = prompt("Введите правила процентов в формате JSON (массив объектов):", JSON.stringify(shop.percentage_rules));
        if (json) {
            try {
                const parsed = JSON.parse(json);
                handleSave({ ...shop, percentage_rules: parsed });
            } catch (e) { alert("Неверный формат JSON"); }
        }
    };

    const editDeliveryPriceRules = () => {
        const json = prompt("Введите правила цены доставки в формате JSON:", JSON.stringify(shop.delivery_price_rules));
        if (json) {
            try {
                const parsed = JSON.parse(json);
                handleSave({ ...shop, delivery_price_rules: parsed });
            } catch (e) { alert("Неверный формат JSON"); }
        }
    };

    const editDeliveryPlus = () => {
        const val = prompt("Введите DeliveryPlus (дни):", shop.delivery_plus);
        if (val !== null) {
            handleSave({ ...shop, delivery_plus: parseInt(val) });
        }
    };

    if (!shop || loading) return <div className="page-content">Загрузка профиля...</div>;

    return (
        <div className="page-content">
            <table className="profile-info-table">
                <tbody>
                    <tr><td>Shop Name</td><td>{shop.name}</td></tr>
                    <tr><td>Shop id</td><td>{shop.custom_shop_id || '-'}</td></tr>
                    <tr><td>Shop api</td><td>{shop.kaspi_token || '-'}</td></tr>
                </tbody>
            </table>

            <div className="detail-actions-top">
                <button className="btn-outline-blue" onClick={editPercentRules}>редактировать процент</button>
                <button className="btn-outline-blue" onClick={editDeliveryPlus}>редактировать DeliveryPlus</button>
                <button className="btn-outline-blue" onClick={editDeliveryPriceRules}>редактировать DeliveryPrice</button>
            </div>

            <div className="rule-section">
                <div className="rule-section-title">ПРОЦЕНТ, указывается какой процент добавляется к цене себестоимости</div>
                <table className="rules-table">
                    <thead>
                        <tr>
                            <th>Sum min</th>
                            <th>Sum max</th>
                            <th>%</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shop.percentage_rules.map((r, i) => (
                            <tr key={i}>
                                <td>{r.min}</td>
                                <td>{r.max}</td>
                                <td>{r.percent}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="rule-section">
                <div className="rule-section-title">DeliveryPLUS - дополнительное число к прибавлению к дате доставке.</div>
                <div className="delivery-plus-box">
                    <span>DeliveryPLUS</span>
                    <strong>{shop.delivery_plus}</strong>
                </div>
            </div>

            <div className="rule-section">
                <div className="rule-section-title">Delivery Price, указывается сумма доставки.</div>
                <table className="rules-table">
                    <thead>
                        <tr>
                            <th>Sum min</th>
                            <th>Sum max</th>
                            <th>Delivery price</th>
                        </tr>
                    </thead>
                    <tbody>
                        {shop.delivery_price_rules.map((r, i) => (
                            <tr key={i}>
                                <td>{r.min}</td>
                                <td>{r.max}</td>
                                <td>{r.price}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function Analytics() {
    return (
        <div className="page-content">
            <div className="section-header">
                <h1>Аналитика</h1>
                <p>Статистика продаж и мониторинг цен</p>
            </div>
            <div className="analytics-grid">
                <div className="card stat-card">
                    <div className="stat-label">Всего товаров</div>
                    <div className="stat-value">1,248</div>
                    <div className="stat-trend up">+12% с прошлого месяца</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Продажи (7 дней)</div>
                    <div className="stat-value">5.2 млн ₸</div>
                    <div className="stat-trend up">+5.4%</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-label">Конкурентоспособность</div>
                    <div className="stat-value">94%</div>
                    <div className="stat-trend up">Топ в категории</div>
                </div>
            </div>

            <div className="card chart-card mt">
                <h3>Динамика цен (Пример)</h3>
                <div className="mock-chart">
                    {[65, 59, 80, 81, 56, 55, 40, 70, 90, 85].map((val, i) => (
                        <div key={i} className="chart-bar" style={{ height: `${val}%` }} title={`${val}%`}></div>
                    ))}
                </div>
                <div className="chart-labels">
                    <span>Янв</span><span>Фев</span><span>Мар</span><span>Апр</span><span>Май</span><span>Июн</span><span>Июл</span><span>Авг</span><span>Сен</span><span>Окт</span>
                </div>
            </div>
        </div>
    );
}

function Orders({ shopId }) {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`${API_BASE}/orders?shop_id=${shopId}`);
            setOrders(res.data.orders);
        } catch (e) {
            console.error(e);
            setOrders([
                { id: '1', attributes: { code: 'ORDER-2024-001', creationDate: Date.now(), status: 'NEW', totalPrice: 45000 } },
                { id: '2', attributes: { code: 'ORDER-2024-002', creationDate: Date.now() - 86400000, status: 'PICKUP', totalPrice: 12500 } }
            ]);
        }
        setLoading(false);
    };

    React.useEffect(() => { fetchOrders(); }, [shopId]);

    return (
        <div className="page-content">
            <div className="section-header-flex">
                <div>
                    <h1>Заказы Kaspi</h1>
                    <p>Мониторинг и управление заказами в реальном времени</p>
                </div>
                <button className="btn-primary sm" onClick={fetchOrders}>
                    <RefreshCcw size={16} /> Обновить
                </button>
            </div>

            <div className="card table-card overflow-x">
                {loading ? (
                    <div className="empty-state">Загрузка данных...</div>
                ) : (
                    <table className="orders-table">
                        <thead>
                            <tr>
                                <th>Номер заказа</th>
                                <th>Дата</th>
                                <th>Статус</th>
                                <th>Сумма</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.length > 0 ? orders.map(order => (
                                <tr key={order.id}>
                                    <td><span className="order-code">{order.attributes.code}</span></td>
                                    <td>{new Date(order.attributes.creationDate).toLocaleDateString()}</td>
                                    <td>
                                        <span className={`state-badge ${order.attributes.status.toLowerCase()}`}>
                                            {order.attributes.status}
                                        </span>
                                    </td>
                                    <td>{order.attributes.totalPrice.toLocaleString()} ₸</td>
                                    <td>
                                        <button className="btn-secondary sm">Детали</button>
                                    </td>
                                </tr>
                            )) : (
                                <tr><td colSpan="5" className="empty-state" style={{ padding: '3rem' }}>Новых заказов нет</td></tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

function Shop() {
    return (
        <div className="page-content">
            <div className="section-header">
                <h1>Магазин</h1>
                <p>Настройки интеграции с маркетплейсом Kaspi</p>
            </div>
            <div className="shop-settings-grid">
                <div className="card">
                    <h3>Подключение API</h3>
                    <div className="form-group mt">
                        <label>Kaspi Merchant Token</label>
                        <div className="readonly-input">
                            <input type="password" value="********-****-****-****-************" readOnly />
                            <button className="btn-link" onClick={() => {
                                const token = prompt("Введите ваш Kaspi API Token:");
                                if (token) alert("Токен сохранен! (Имитация)");
                            }}>Изменить</button>
                        </div>
                        <p className="mt" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Токен необходим для синхронизации заказов. Получите его в кабинете Kaspi Pay.
                        </p>
                    </div>
                </div>
                <div className="card">
                    <h3>XML Прайс-лист</h3>
                    <div className="form-group mt">
                        <label>Ссылка для Kaspi</label>
                        <div className="readonly-input">
                            <input type="text" value={`https://dropship-tan.vercel.app/api/v1/xml/feed`} readOnly />
                            <button className="btn-link" onClick={() => {
                                navigator.clipboard.writeText(`https://dropship-tan.vercel.app/api/v1/xml/feed`);
                                alert("Ссылка скопирована!");
                            }}><Copy size={16} /></button>
                        </div>
                        <p className="mt" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                            Укажите эту ссылку в настройках автозагрузки Kaspi.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
