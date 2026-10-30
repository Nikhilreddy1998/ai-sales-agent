import { catalogService } from '../services/catalogService.js';

export const getCatalog = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (q) {
      const matched = catalogService.matchProducts(q);
      return res.json({
        success: true,
        count: matched.length,
        products: matched,
      });
    }

    const products = catalogService.getCatalog();

    return res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductBySku = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = catalogService.getProductBySku(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: `Product with SKU "${id}" was not found.`,
      });
    }

    return res.json({
      success: true,
      product,
    });
  } catch (error) {
    next(error);
  }
};
