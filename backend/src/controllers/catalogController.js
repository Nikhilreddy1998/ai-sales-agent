import { catalogService } from '../services/catalogService.js';

export const getCatalog = async (req, res, next) => {
  try {
    const { category, inStock, q } = req.query;

    if (q) {
      const matched = catalogService.matchProducts(q);
      return res.json({
        success: true,
        count: matched.length,
        products: matched,
      });
    }

    const filter = {};
    if (category) filter.category = category;
    if (inStock !== undefined) filter.inStock = inStock === 'true';

    const products = catalogService.getCatalog(filter);

    return res.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error) {
    next(error);
  }
};

export const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const product = catalogService.getProductById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        error: `Product with ID "${id}" was not found.`,
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
