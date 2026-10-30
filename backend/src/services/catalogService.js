/**
 * Product catalog for the AI Sales Agent interview challenge.
 * Provides sample products, categories, pricing, and matching utilities.
 */

export const INITIAL_CATALOG = [
  {
    id: 'prod-001',
    name: 'Starter Cloud Suite',
    category: 'Cloud Services',
    description: 'Essential cloud hosting with 2 vCPU, 4GB RAM, and 50GB SSD storage.',
    price: 49.99,
    billingCycle: 'monthly',
    inStock: true,
    availableUnits: 100,
  },
  {
    id: 'prod-002',
    name: 'Pro Cloud Suite',
    category: 'Cloud Services',
    description: 'High-performance cloud compute with 8 vCPU, 16GB RAM, and 200GB NVMe storage.',
    price: 149.99,
    billingCycle: 'monthly',
    inStock: true,
    availableUnits: 50,
  },
  {
    id: 'prod-003',
    name: 'Enterprise Cloud Fleet',
    category: 'Cloud Services',
    description: 'Dedicated clusters, auto-scaling, VPC peering, and 24/7 dedicated support engineer.',
    price: 499.99,
    billingCycle: 'monthly',
    inStock: true,
    availableUnits: 20,
  },
  {
    id: 'prod-004',
    name: 'AI Sales Copilot License',
    category: 'Software Licenses',
    description: 'Per-seat intelligent sales copilot with CRM auto-sync and email follow-up automations.',
    price: 39.0,
    billingCycle: 'monthly/seat',
    inStock: true,
    availableUnits: 500,
  },
  {
    id: 'prod-005',
    name: 'Data Pipeline Accelerator',
    category: 'Developer Tools',
    description: 'Managed ETL framework with connectors for Snowflake, BigQuery, and Postgres.',
    price: 249.0,
    billingCycle: 'monthly',
    inStock: true,
    availableUnits: 30,
  },
  {
    id: 'prod-006',
    name: 'Solution Architecture Consulting (10 hrs)',
    category: 'Professional Services',
    description: 'Direct 1-on-1 architecture review and cloud optimization guidance from senior staff engineers.',
    price: 1200.0,
    billingCycle: 'one-time',
    inStock: true,
    availableUnits: 15,
  },
];

class CatalogService {
  constructor(catalog = INITIAL_CATALOG) {
    this.catalog = [...catalog];
  }

  /**
   * Returns all catalog items with optional filtering.
   * @param {object} [filter]
   * @returns {Array} List of products
   */
  getCatalog(filter = {}) {
    let result = this.catalog;
    if (filter.category) {
      result = result.filter(
        (item) => item.category.toLowerCase() === filter.category.toLowerCase()
      );
    }
    if (filter.inStock !== undefined) {
      result = result.filter((item) => item.inStock === filter.inStock);
    }
    return result;
  }

  /**
   * Finds a product by its ID.
   * @param {string} id
   */
  getProductById(id) {
    return this.catalog.find((item) => item.id === id) || null;
  }

  /**
   * Matches products based on keywords or names (stub for LLM tool calling & search).
   * @param {string} query
   */
  matchProducts(query) {
    if (!query) return this.catalog;
    const lower = query.toLowerCase();
    return this.catalog.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower) ||
        item.category.toLowerCase().includes(lower)
    );
  }
}

export const catalogService = new CatalogService();
