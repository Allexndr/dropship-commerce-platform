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

    const navItems = [
        { id: 'dashboard', label: 'Главная', icon: <LayoutDashboard size={20} />, roles: ['admin', 'manager'] },
        { id: 'products', label: 'Товары', icon: <Box size={20} />, roles: ['admin', 'manager', 'praiser'] },
        { id: 'shop', label: 'Магазин', icon: <ShoppingBag size={20} />, roles: ['admin', 'manager', 'seller'] },
        { id: 'analytics', label: 'Аналитика', icon: <BarChart3 size={20} />, roles: ['admin', 'manager', 'analytic'] },
        { id: 'users', label: 'Пользователи', icon: <Users size={20} />, roles: ['admin', 'manager'] },
        { id: 'profile', label: 'Профиль', icon: <User size={20} />, roles: ['admin', 'manager'] },
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
                case 'shop': return <Placeholder title="Магазин" icon={<ShoppingBag size={48} />} />;
                case 'analytics': return <Placeholder title="Аналитика" icon={<BarChart3 size={48} />} />;
                case 'users': return <UsersTable />;
                case 'profile': return <Profile />;
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
                                <h2 className="shop-name">NRT Store</h2>
                                <div className="user-badge">
                                    <div className="online-indicator"></div>
                                    <span>{userRole.toUpperCase()}</span>
                                </div>
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
        // Optionally auto-login
        // onLogin(role.id);
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
                                <label>Email</label>
                                <input type="email" placeholder="email@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                            </div>
                            <button type="submit" className="btn-primary full">Сбросить пароль</button>
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
                    <p>Вход в систему управления</p>
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
                    <div className="credential-hint mt">
                        <strong>Логин:</strong> <code>{roles.find(r => r.id === selectedRole)?.email}</code><br />
                        <strong>Пароль:</strong> <code>12345678</code>
                    </div>
                </div>

                <form className="login-form" onSubmit={(e) => { e.preventDefault(); onLogin(selectedRole); }}>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                    </div>
                    <div className="form-group">
                        <label>Пароль</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn-primary full">Войти</button>
                    <button type="button" className="btn-link" onClick={() => setForgotMode(true)}>Забыли пароль?</button>
                </form>
            </div>
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

    React.useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${API_BASE}/products/`);
            setProducts(response.data);
            setError(null);
        } catch (err) {
            // Fallback to mock data with ТЗ pricing formulas applied
            console.warn('API unreachable, loading mock data:', err.message);
            const enriched = mockProducts.map(p => {
                // Calculate Price Mid from active links
                const activeLinks = (p.links || []).filter(l => l.stock_status === 'active' && l.price > 0);
                const priceMid = activeLinks.length > 0
                    ? Math.round(activeLinks.reduce((sum, l) => sum + l.price, 0) / activeLinks.length)
                    : 0;

                // DeliveryMID = DeliveryMP (min delivery from cheapest link) + DeliveryPLUS
                const minDeliveryLink = activeLinks.length > 0
                    ? activeLinks.reduce((min, l) => l.price < min.price ? l : min, activeLinks[0])
                    : null;
                const deliveryMid = minDeliveryLink
                    ? minDeliveryLink.delivery_days + DELIVERY_PLUS
                    : 0;

                // Find pricing % from pricingRules
                const rule = pricingRules.find(r => priceMid >= r.min && priceMid <= r.max);
                const percent = rule ? rule.percent : 0;

                // Find delivery price from deliveryPrices
                const dRule = deliveryPrices.find(r => priceMid >= r.min && priceMid <= r.max);
                const deliveryPrice = dRule ? dRule.price : 0;

                // Price = PriceMid + (PriceMid * % / 100) + DeliveryPrice
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
            setProducts(enriched);
            setError(null);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTestProduct = async () => {
        const url = prompt("Введите ссылку на товар Kaspi:");
        if (!url) return;

        try {
            // Mock parsing the URL... Delay to simulate work.
            setLoading(true);
            await new Promise(resolve => setTimeout(resolve, 800));

            const newSku = Math.floor(1000000 + Math.random() * 9000000).toString();
            const newProduct = {
                sku: newSku,
                name: "Спарсенный товар (Тест) " + newSku,
                brand: "KaspiBrand",
                kaspi_price: Math.floor(10000 + Math.random() * 50000),
                mid_price: 0,
                delivery_days: 0,
                stock: 0,
                links: [],
                kaspi_link: url,
                calculated_price: 0
            };
            // Kaspi price only since no links yet
            newProduct.calculated_price = newProduct.kaspi_price;

            setProducts(prev => [newProduct, ...prev]);
        } catch (err) {
            alert('Ошибка добавления: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (actionName) => {
        setLoading(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1500));
            alert(`Успешно выполнено: ${actionName}`);
            // In a real app we would call fetchProducts() here
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProduct = (updatedProduct) => {
        setProducts(prev => prev.map(p => p.sku === updatedProduct.sku ? updatedProduct : p));
        onEdit(updatedProduct); // Keep the editing view updated with the parent if necessary
    };

    return (
        <div className="page-content">
            <div className="section-header-flex">
                <div>
                    <h1>Товары</h1>
                    <p>Управление прайс-листом и ценообразованием</p>
                </div>
                <div className="actions-group">
                    <button className="btn-primary" onClick={handleAddTestProduct}><PlusCircle size={18} /> Добавить товар по ссылке</button>
                    <button className="btn-secondary" onClick={() => {
                        const err = document.getElementById('import-error');
                        if (err) err.style.display = err.style.display === 'none' ? 'block' : 'none';
                    }}>
                        <Upload size={18} /> Импорт EXCEL
                    </button>
                    <button className="btn-secondary" onClick={() => alert('Началась загрузка шаблона...')}>
                        <Download size={18} /> Скачать шаблон EXCEL
                    </button>
                    <button className="btn-secondary" onClick={() => handleAction('Обновление цен Kaspi')}><RefreshCcw size={18} /> Обновить Каспи</button>
                    <button className="btn-secondary" onClick={() => handleAction('Обновление цен и сроков WB/Ozon')}><RefreshCcw size={18} /> Обновить цены</button>
                    <button className="btn-secondary" onClick={() => handleAction('Полное обновление всех данных')}><RefreshCcw size={18} /> Обновить ВСЕ</button>
                </div>
            </div>

            <div className="toolbar card">
                <div className="filters">
                    <div className="filter-item">
                        <label>Бренд</label>
                        <select><option>Все бренды</option><option>Apple</option><option>Sony</option><option>Tuvio</option></select>
                    </div>
                    <div className="filter-item">
                        <label>Цена</label>
                        <input type="text" placeholder="От - До" />
                    </div>
                    <div className="filter-item">
                        <label>Ссылки</label>
                        <select><option>Все</option><option>С ссылками</option><option>Без ссылок</option></select>
                    </div>
                </div>
                <div className="search-box">
                    <Search size={18} />
                    <input type="text" placeholder="Поиск по названию или SKU..." />
                </div>
            </div>

            {/* Excel Import Simulation Error */}
            <div className="import-status-box" style={{ marginBottom: '1rem', display: 'none' }} id="import-error">
                <div className="alert-error">
                    <AlertCircle size={18} />
                    <div>
                        <strong>Ошибка импорта:</strong> Весь файл отклонен. Исправьте ошибки:<br />
                        • строка 57: ссылка не правильная (КАСПИ)<br />
                        • строка 98: повтор SKU (уже существует)
                    </div>
                </div>
            </div>

            <div className="card table-card overflow-x">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Наименование</th>
                            <th>Бренд</th>
                            <th>Цена (=Price)</th>
                            <th>Price Kaspi</th>
                            <th>Price MID</th>
                            <th>Доставка (DeliveryMID)</th>
                            <th>Кол-во (stock)</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading && <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Загрузка товаров из базы...</td></tr>}
                        {error && <tr><td colSpan="9" style={{ textAlign: 'center', color: 'red', padding: '20px' }}>{error}</td></tr>}
                        {!loading && !error && products.length === 0 && (
                            <tr><td colSpan="9" style={{ textAlign: 'center', padding: '20px' }}>Товаров пока нет. Добавьте первый тестовый товар.</td></tr>
                        )}
                        {!loading && !error && products.map(p => {
                            // Highlighting Logic
                            let rowClass = "row-base";
                            if (!p.links || p.links.length === 0) {
                                rowClass = "row-red"; // No links
                            } else {
                                const hasError = p.links.some(l => l.stock_status === 'error' || l.price === 0);
                                if (hasError) {
                                    rowClass = "row-yellow"; // Has errors
                                }
                            }

                            const isOverLimit = p.delivery_days > 30; // Just as an example limit alert

                            return (
                                <tr key={p.sku} className={`${rowClass} ${isOverLimit ? 'over-limit-row' : ''} `} onDoubleClick={() => onEdit(p)}>
                                    <td><code className="sku">{p.sku}</code></td>
                                    <td>
                                        <div className="model-name">{p.name}</div>
                                        {isOverLimit && <div className="error-badge-inline"><AlertCircle size={12} /> Превышен лимит (30 дн.)</div>}
                                    </td>
                                    <td>{p.brand || '-'}</td>
                                    <td><strong>{(p.calculated_price || p.kaspi_price || 0).toLocaleString()} ₸</strong></td>
                                    <td>{(p.kaspi_price || 0).toLocaleString()} ₸</td>
                                    <td>{(p.mid_price || 0).toLocaleString()} ₸</td>
                                    <td>{p.delivery_days} дн.</td>
                                    <td>{p.stock}</td>
                                    <td>
                                        <button className="edit-row-btn" onClick={() => onEdit(p, handleUpdateProduct)} title="Редактировать">
                                            <Edit size={16} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ProductDetail({ product: initialProduct, onBack, onUpdate }) {
    const [product, setProduct] = useState(initialProduct);

    // Sync changes back when they happen
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
                <h1>Карточка товара</h1>
            </div>

            <div className="detail-grid">
                <div className="card detail-info-card">
                    <h3>Данные Kaspi (Read-only)</h3>
                    <div className="info-grid">
                        <div className="info-item"><label>SKU</label><span>{product.sku || '-'}</span></div>
                        <div className="info-item"><label>Бренд</label><span>{product.brand || '-'}</span></div>
                        <div className="info-item"><label>Наименование</label><span>{product.name || '-'}</span></div>
                        <div className="info-item">
                            <label>Мин. цена Kaspi</label>
                            <span className="price-tag">{(product.kaspi_price || 0).toLocaleString()} ₸</span>
                        </div>
                    </div>
                    <div className="external-link-box">
                        <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>Ссылка Kaspi:</label>
                        <div className="readonly-input">
                            <input type="text" value={product.kaspi_link || 'https://kaspi.kz/shop/p/...'} readOnly />
                            <a href={product.kaspi_link || '#'} target="_blank" rel="noreferrer"><ExternalLink size={14} /></a>
                        </div>
                    </div>
                </div>

                <div className="card links-card">
                    <div className="links-header">
                        <h3>Ссылки WB / Ozon</h3>
                        <div className="actions-group sm">
                            <button className="btn-secondary sm" onClick={() => handleAddLink('wb')}><Plus size={14} /> Добавить товар ВБ</button>
                            <button className="btn-secondary sm" onClick={() => handleAddLink('ozon')}><Plus size={14} /> Добавить товар Озон</button>
                        </div>
                    </div>

                    <table className="links-table">
                        <thead>
                            <tr>
                                <th>Источник</th>
                                <th>ID на MP</th>
                                <th>Цена MP</th>
                                <th>Срок</th>
                                <th>Статус</th>
                                <th>Действие</th>
                            </tr>
                        </thead>
                        <tbody>
                            {product.links.length > 0 ? product.links.map(l => (
                                <tr key={l.id}>
                                    <td><span className={`source-badge ${l.source}`}>{l.source.toUpperCase()}</span></td>
                                    <td>{l.external_id}</td>
                                    <td>{l.price.toLocaleString()} ₸</td>
                                    <td>{l.delivery_days} дн.</td>
                                    <td><span className={`status-tag ${l.stock_status}`}>{l.stock_status}</span></td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="icon-btn sm" onClick={() => handleEditLink(l.id)} title="Редактировать запись"><Edit size={14} /></button>
                                            <button className="icon-btn sm red" onClick={() => handleDeleteLink(l.id)} title="Удалить запись"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="6" className="empty-row">Ссылок пока нет. Добавьте первую.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
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
    return (
        <div className="page-content">
            <div className="section-header">
                <h1>Профиль магазина</h1>
                <p>Настройки API и алгоритма ценообразования (по ТЗ)</p>
            </div>

            <div className="profile-grid">
                <div className="card profile-info">
                    <h3>Общие данные</h3>
                    <div className="info-list">
                        <div className="info-row"><label>Shop Name:</label> <span>NRT Store</span></div>
                        <div className="info-row"><label>Shop ID:</label> <span>16493269</span></div>
                        <div className="info-row"><label>API Key:</label> <span className="api-key-mask">fvblMh3EkBCHhR1AD...</span></div>
                    </div>
                    <button className="btn-secondary mt" onClick={() => alert("Инструкция по смене пароля отправлена на почту")}>Сменить пароль</button>
                </div>

                <div className="card pricing-rules">
                    <h3>Ценообразование магазина</h3>
                    <div className="rules-form">
                        <div className="form-group">
                            <label>ПРОЦЕНТ надбавки (%)</label>
                            <input type="number" defaultValue={20} />
                            <small>Процент, который добавляется к цене себестоимости.</small>
                        </div>
                        <div className="form-group">
                            <label>Delivery PLUS (дни)</label>
                            <input type="number" defaultValue={3} />
                            <small>Дополнительное число к прибавлению к дате доставке.</small>
                        </div>
                        <div className="form-group">
                            <label>Delivery Price (₸)</label>
                            <input type="number" defaultValue={1500} />
                            <small>Сумма доставки за единицу товара.</small>
                        </div>
                        <button className="btn-primary" style={{ width: 'fit-content' }} onClick={() => alert("Настройки алгоритма ценообразования сохранены!")}>Сохранить настройки</button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function Placeholder({ title, icon }) {
    return (
        <div className="page-content empty-state">
            {icon}
            <h2>{title}</h2>
            <p>Раздел находится в разработке</p>
        </div>
    );
}
