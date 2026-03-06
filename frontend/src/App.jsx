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
import { mockUsers, pricingRules, deliveryPrices } from './data';
import axios from 'axios';
import './App.css';

const API_BASE = '/api/v1';

export default function App() {
    const [isLogged, setIsLogged] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [editingProduct, setEditingProduct] = useState(null);

    console.log('App Rendering - isLogged:', isLogged, 'activeTab:', activeTab);

    try {
        const renderContent = () => {
            if (editingProduct) {
                return <ProductDetail product={editingProduct} onBack={() => setEditingProduct(null)} />;
            }

            switch (activeTab) {
                case 'dashboard': return <Dashboard />;
                case 'products': return <Products onEdit={setEditingProduct} />;
                case 'shop': return <Placeholder title="Магазин" icon={<ShoppingBag size={48} />} />;
                case 'analytics': return <Placeholder title="Аналитика" icon={<BarChart3 size={48} />} />;
                case 'users': return <UsersTable />;
                case 'profile': return <Profile />;
                default: return <Dashboard />;
            }
        };

        if (!isLogged) {
            return <LoginPage onLogin={() => setIsLogged(true)} />;
        }

        return (
            <div className="layout">
                {/* Sidebar */}
                <aside className="sidebar">
                    <div className="logo">
                        <div className="logo-box">DS</div>
                        <span>DropShift</span>
                    </div>

                    <nav className="nav">
                        <NavItem active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); setEditingProduct(null) }} icon={<LayoutDashboard size={20} />} label="Главная" />
                        <NavItem active={activeTab === 'products'} onClick={() => { setActiveTab('products'); setEditingProduct(null) }} icon={<Box size={20} />} label="Товары" />
                        <NavItem active={activeTab === 'shop'} onClick={() => { setActiveTab('shop'); setEditingProduct(null) }} icon={<ShoppingBag size={20} />} label="Магазин" />
                        <NavItem active={activeTab === 'analytics'} onClick={() => { setActiveTab('analytics'); setEditingProduct(null) }} icon={<BarChart3 size={20} />} label="Аналитика" />
                        <NavItem active={activeTab === 'users'} onClick={() => { setActiveTab('users'); setEditingProduct(null) }} icon={<Users size={20} />} label="Пользователи" />
                        <NavItem active={activeTab === 'profile'} onClick={() => { setActiveTab('profile'); setEditingProduct(null) }} icon={<User size={20} />} label="Профиль" />
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
                        <div className="header-info">
                            <h2 className="shop-name">NRT Store</h2>
                            <div className="user-badge">
                                <div className="online-indicator"></div>
                                <span>Admin</span>
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
    return (
        <div className="login-screen">
            <div className="login-card glass">
                <div className="login-header">
                    <div className="logo-box lg">DS</div>
                    <h1>Дропшиппинг</h1>
                    <p>Вход в систему управления</p>
                </div>
                <form className="login-form" onSubmit={(e) => { e.preventDefault(); onLogin(); }}>
                    <div className="form-group">
                        <label>Email</label>
                        <input type="email" placeholder="email@example.com" defaultValue="admin@nrt.kz" />
                    </div>
                    <div className="form-group">
                        <label>Пароль</label>
                        <input type="password" placeholder="••••••••" defaultValue="12345678" />
                    </div>
                    <button type="submit" className="btn-primary full">Войти</button>
                    <button type="button" className="btn-link">Забыли пароль?</button>
                </form>
            </div>
        </div>
    );
}

function Dashboard() {
    const xmlUrl = "https://nrt-store.kz/api/kaspi/xml?token=fvblMh3EkBCHhR...";
    return (
        <div className="page-content">
            <div className="section-header">
                <h1>Главная</h1>
                <p>XML-фид для Kaspi магазина</p>
            </div>

            <div className="card xml-card">
                <div className="xml-header">
                    <div className="xml-badge">XML FEED</div>
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
            setError('Ошибка загрузки товаров: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleAddTestProduct = async () => {
        try {
            const newSku = Math.floor(1000000 + Math.random() * 9000000).toString();
            await axios.post(`${API_BASE}/products/`, {
                sku: newSku,
                model: "Test Product " + newSku,
                brand: "TestBrand",
                kaspi_price: 15000
            });
            fetchProducts(); // Refresh list
        } catch (err) {
            alert('Ошибка добавления: ' + err.message);
        }
    };

    return (
        <div className="page-content">
            <div className="section-header-flex">
                <div>
                    <h1>Товары</h1>
                    <p>Управление прайс-листом и ценообразованием</p>
                </div>
                <div className="actions-group">
                    <button className="btn-secondary"><Download size={18} /> Шаблон</button>
                    <button className="btn-secondary"><Upload size={18} /> Импорт EXCEL</button>
                    <button className="btn-primary" onClick={handleAddTestProduct}><PlusCircle size={18} /> Добавить тест-товар</button>
                    <button className="btn-secondary" onClick={fetchProducts}><RefreshCcw size={18} /></button>
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

            <div className="card table-card overflow-x">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>SKU</th>
                            <th>Наименование</th>
                            <th>Бренд</th>
                            <th>Цена</th>
                            <th>Price Kaspi</th>
                            <th>Price Mid</th>
                            <th>Доставка</th>
                            <th>Кол-во</th>
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
                            // Calculate metrics based on WB links (mock logic for now if no links)
                            const bestLink = p.links && p.links.length > 0 ? p.links[0] : null;
                            const currentDelivery = bestLink ? bestLink.delivery_days : 0;
                            const isOverLimit = (currentDelivery + 3) > 30; // 3 is Default DeliveryPLUS
                            const displayPrice = p.kaspi_price || 0;

                            return (
                                <tr key={p.sku} className={`row-${p.status} ${isOverLimit ? 'over-limit-row' : ''}`}>
                                    <td><code className="sku">{p.sku}</code></td>
                                    <td>
                                        <div className="model-name">{p.model}</div>
                                        {isOverLimit && <div className="error-badge-inline"><AlertCircle size={12} /> Превышен лимит (30 дн.)</div>}
                                    </td>
                                    <td>{p.brand || '-'}</td>
                                    <td><strong>{bestLink ? bestLink.price.toLocaleString() : displayPrice.toLocaleString()} ₸</strong></td>
                                    <td>{displayPrice.toLocaleString()} ₸</td>
                                    <td>-</td>
                                    <td>{currentDelivery} дн.</td>
                                    <td>{bestLink ? bestLink.quantity : '-'}</td>
                                    <td>
                                        <button className="edit-row-btn" onClick={() => onEdit(p)}>
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

function ProductDetail({ product, onBack }) {
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
                        <div className="info-item"><label>Модель</label><span>{product.model || '-'}</span></div>
                        <div className="info-item">
                            <label>Мин. цена Kaspi</label>
                            <span className="price-tag">{(product.kaspi_price || 0).toLocaleString()} ₸</span>
                        </div>
                    </div>
                    <div className="external-link-box">
                        <a href="https://kaspi.kz/shop/..." target="_blank" rel="noreferrer">Посмотреть на Kaspi <ExternalLink size={14} /></a>
                    </div>
                </div>

                <div className="card links-card">
                    <div className="links-header">
                        <h3>Ссылки WB / Ozon</h3>
                        <div className="actions-group sm">
                            <button className="btn-secondary sm"><Plus size={14} /> ВБ</button>
                            <button className="btn-secondary sm"><Plus size={14} /> Озон</button>
                        </div>
                    </div>

                    <table className="links-table">
                        <thead>
                            <tr>
                                <th>Артикул</th>
                                <th>Название на MP</th>
                                <th>Цена MP</th>
                                <th>Срок</th>
                                <th>Действие</th>
                            </tr>
                        </thead>
                        <tbody>
                            {product.links.length > 0 ? product.links.map(l => (
                                <tr key={l.id}>
                                    <td>{l.art}</td>
                                    <td>{l.name}</td>
                                    <td>{l.price.toLocaleString()} ₸</td>
                                    <td>{l.delivery} дн.</td>
                                    <td>
                                        <div className="row-actions">
                                            <button className="icon-btn sm"><Edit size={14} /></button>
                                            <button className="icon-btn sm red"><Trash2 size={14} /></button>
                                        </div>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan="5" className="empty-row">Ссылок пока нет. Добавьте первую.</td>
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
    return (
        <div className="page-content">
            <div className="section-header-flex">
                <div>
                    <h1>Пользователи</h1>
                    <p>Управление правами доступа сотрудников</p>
                </div>
                <button className="btn-primary"><PlusCircle size={18} /> Новый пользователь</button>
            </div>

            <div className="card table-card">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>User Login</th>
                            <th>Shop</th>
                            <th>Manager</th>
                            <th>Praiser</th>
                            <th>Seller</th>
                            <th>Analytic</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockUsers.map(u => (
                            <tr key={u.id}>
                                <td>{u.login}</td>
                                <td><span className="badge-shop">{u.shop}</span></td>
                                <td><input type="checkbox" checked={u.manager} readOnly /></td>
                                <td><input type="checkbox" checked={u.praiser} readOnly /></td>
                                <td><input type="checkbox" checked={u.seller} readOnly /></td>
                                <td><input type="checkbox" checked={u.analytic} readOnly /></td>
                                <td><div className="row-actions"><button className="icon-btn sm"><Edit size={14} /></button><button className="icon-btn sm red"><Trash2 size={14} /></button></div></td>
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
                <p>Настройки API и алгоритма ценообразования</p>
            </div>

            <div className="profile-grid">
                <div className="card profile-info">
                    <h3>Общие данные</h3>
                    <div className="info-list">
                        <div className="info-row"><label>Shop Name:</label> <span>NRT Store</span></div>
                        <div className="info-row"><label>Shop ID:</label> <span>16493269</span></div>
                        <div className="info-row"><label>Region:</label> <span className="region-tag">Almaty</span></div>
                        <div className="info-row"><label>API Key:</label> <span className="api-key-mask">fvblMh3EkBCHhR1AD...</span></div>
                    </div>
                    <button className="btn-secondary sm">Редактировать профиль</button>
                </div>

                <div className="card pricing-settings">
                    <div className="card-header-flex">
                        <h3>Процент надбавки</h3>
                        <button className="btn-primary sm"><Edit size={14} /> Изменить</button>
                    </div>
                    <table className="settings-table">
                        <thead>
                            <tr><th>Sum Min</th><th>Sum Max</th><th>%</th></tr>
                        </thead>
                        <tbody>
                            {pricingRules.map((r, i) => (
                                <tr key={i}><td>{r.min} ₸</td><td>{r.max.toLocaleString()} ₸</td><td><strong>{r.percent}%</strong></td></tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="card delivery-settings">
                    <div className="card-header-flex">
                        <h3>Стоимость доставки</h3>
                        <button className="btn-secondary sm"><Edit size={14} /> Изменить</button>
                    </div>
                    <table className="settings-table">
                        <thead>
                            <tr><th>Sum Min</th><th>Sum Max</th><th>Price</th></tr>
                        </thead>
                        <tbody>
                            {deliveryPrices.map((d, i) => (
                                <tr key={i}><td>{d.min} ₸</td><td>{d.max.toLocaleString()} ₸</td><td>{d.price} ₸</td></tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="delivery-plus card mini mt">
                        <div className="flex-between">
                            <span><strong>DeliveryPLUS:</strong> 3 дня</span>
                            <button className="icon-btn sm"><Edit size={14} /></button>
                        </div>
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
