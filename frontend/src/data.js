export const mockProducts = [
    {
        sku: "138457796",
        model: "Вафельница Tuvio TSM02 серый, черный",
        brand: "Tuvio",
        price: 78200,
        priceKaspi: 78200,
        priceMid: 41870,
        delivery: 7,
        quantity: 5,
        status: 'ok',
        links: [
            { id: 1, type: 'wb', art: '287248036', name: 'Вафельница+гриль TSM02', price: 46740, delivery: 7, url: 'https://www.wildberries.ru/catalog/287248036/detail.aspx' },
            { id: 2, type: 'ozon', art: '3494467934', name: 'Вафельница+гриль 2в1 TSM02', price: 37000, delivery: 12, url: 'https://ozon.kz/product/vafelnitsa-gril-2v1-3494467934/' }
        ]
    },
    {
        sku: "1215",
        model: "Wic100 black",
        brand: "Sony",
        price: 24500,
        priceKaspi: 20000,
        priceMid: 12000,
        delivery: 10,
        quantity: 12,
        status: 'warning',
        links: []
    },
    {
        sku: "1515",
        model: "Iphone 17 Pro Max",
        brand: "Apple",
        price: 750000,
        priceKaspi: 710000,
        priceMid: 680000,
        delivery: 28,
        quantity: 1,
        status: 'warning',
        links: [
            { id: 4, type: 'wb', art: '999123', name: 'Iphone 17 PM (Long Delivery)', price: 680000, delivery: 28, url: '#' }
        ]
    }
];

export const mockUsers = [
    { id: 1, login: 'askarov@gmail.com', shop: 'SULPAK', manager: true, praiser: false, seller: false, analytic: false },
    { id: 2, login: 'arbuzov@gmail.com', shop: 'SULPAK', manager: false, praiser: true, seller: true, analytic: false },
    { id: 3, login: 'kamalov@gmail.com', shop: 'SULPAK', manager: false, praiser: false, seller: true, analytic: false }
];

export const pricingRules = [
    { min: 1, max: 3000, percent: 110 },
    { min: 3001, max: 5000, percent: 100 },
    { min: 5001, max: 10000, percent: 90 },
    { min: 10001, max: 20000, percent: 85 },
    { min: 20001, max: 30000, percent: 80 },
    { min: 30001, max: 40000, percent: 75 },
    { min: 40001, max: 50000, percent: 70 },
    { min: 50001, max: 60000, percent: 65 },
    { min: 60001, max: 1000000, percent: 60 }
];

export const deliveryPrices = [
    { min: 0, max: 1000, price: 60 },
    { min: 1001, max: 3000, price: 175 },
    { min: 3001, max: 5000, price: 231 },
    { min: 5001, max: 10000, price: 927 },
    { min: 10001, max: 1000000, price: 1750 }
];
