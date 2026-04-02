// Fetch product info by UPC (for price check modal, does not add to cart)
import { getConfig } from './configLoader';

const PRODUCT_NOT_FOUND_MESSAGE = "Produsul nu a fost gasit";

export async function fetchProductInfoByUpc(upc: string) {
    try {
        const config = await getConfig();
        const baseUrl = config.middleware?.apiBaseUrl || '';
        const response = await fetch(`${baseUrl}/api/articles/${encodeURIComponent(upc)}`);
        if (!response.ok) {
            return {
                success: false,
                error: PRODUCT_NOT_FOUND_MESSAGE
            };
        }
        const apiResponse = await response.json();
        if (apiResponse.success && apiResponse.data) {
            return {
                success: true,
                info: {
                    id: String(apiResponse.data.id),
                        product: {
                            id: String(apiResponse.data.id),
                            name: apiResponse.data.name,
                            upc: apiResponse.data.upc,
                            price: Number(apiResponse.data.price),
                            departament: apiResponse.data.departament,
                            clasa: apiResponse.data.clasa,
                            grupa: apiResponse.data.grupa,
                            gest: apiResponse.data.gest,
                            tax1: apiResponse.data.tax1,
                            tax2: apiResponse.data.tax2,
                            tax3: apiResponse.data.tax3,
                            sgr: apiResponse.data.sgr,
                        },
                    qty: 1,
                    unitPrice: Number(apiResponse.data.price),
                    percentDiscount: 0,
                    valueDiscount: 0,
                    storno: false
                }
            };
        }
        return {
            success: false,
            error: PRODUCT_NOT_FOUND_MESSAGE
        };
    } catch {
        return {
            success: false,
            error: PRODUCT_NOT_FOUND_MESSAGE
        };
    }
}