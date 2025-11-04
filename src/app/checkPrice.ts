// Fetch product info by UPC (for price check modal, does not add to cart)
import { getConfig } from './configLoader';

export async function fetchProductInfoByUpc(upc: string) {
    try {
        const config = await getConfig();
        const baseUrl = config.middleware?.apiBaseUrl || '';
        const response = await fetch(`${baseUrl}/api/articles/${encodeURIComponent(upc)}`);
        if (!response.ok) return null;
        const apiResponse = await response.json();
        if (apiResponse.success && apiResponse.data) {
            return {
                id: String(apiResponse.data.id),
                product: {
                    id: String(apiResponse.data.id),
                    name: apiResponse.data.name,
                    upc: apiResponse.data.upc,
                    price: apiResponse.data.price,
                },
                qty: 1,
                unitPrice: apiResponse.data.price,
                percentDiscount: 0,
                valueDiscount: 0,
                storno: false
            };
        }
        return null;
    } catch {
        return null;
    }
}