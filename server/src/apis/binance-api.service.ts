import axios from "axios";
const baseApiUrl = 'https://api.binance.com/api/v1/';

export const binanceApi = {
    getPrice: async (symbol: string) => {
        try {
            const params = { symbol }
            const result = await axios.get(baseApiUrl + 'ticker/price', { params });
            if (result.status !== 200 || !result.data) return { error: 'Fail getting current Price' };
            return { data: result.data };
        } catch (error) {
            return { error: error.message || 'Fail getting current Price' }; 
        }
    },
}
