/**
 * Product catalog for the AI Sales Agent interview challenge.
 * Exactly implements mandatory requirements for product SKUs, capacities, and tier pricing:
 *
 * 1. SKU_AIRPODS_PRO2: AirPods Pro 2nd Gen | Capacity: 1 | STD: $249, CARE: $279
 * 2. SKU_MESH_WIFI6:   AeroMesh Wi-Fi 6E Home Pack | Capacity: 2 | STD: $399, PRO: $499
 * 3. SKU_TEAM_HUB:     SyncHub Conference Bar | Capacity: 3 | STD: $899, PRO: $1150
 */

export const CATALOG = [
  {
    sku: 'SKU_AIRPODS_PRO2',
    name: 'AirPods Pro 2nd Gen',
    capacity: 1,
    capacityUnit: 'user',
    pricing: {
      STD: 249,
      CARE: 279,
    },
    description: 'Next-level Active Noise Cancellation and personalized spatial audio. Unit capacity: 1 user.',
  },
  {
    sku: 'SKU_MESH_WIFI6',
    name: 'AeroMesh Wi-Fi 6E Home Pack',
    capacity: 2,
    capacityUnit: 'coverage zones',
    pricing: {
      STD: 399,
      PRO: 499,
    },
    description: 'High-throughput tri-band mesh Wi-Fi 6E system. Unit capacity: 2 coverage zones per pack.',
  },
  {
    sku: 'SKU_TEAM_HUB',
    name: 'SyncHub Conference Bar',
    capacity: 3,
    capacityUnit: 'room units/teams',
    pricing: {
      STD: 899,
      PRO: 1150,
    },
    description: 'All-in-one 4K video conferencing bar with AI auto-framing. Unit capacity: 3 meeting rooms/teams.',
  },
];

class CatalogService {
  constructor(catalog = CATALOG) {
    this.catalog = [...catalog];
  }

  /**
   * Returns all catalog items.
   * @returns {Array} List of products
   */
  getCatalog() {
    return this.catalog;
  }

  /**
   * Finds a product by its SKU.
   * @param {string} sku
   */
  getProductBySku(sku) {
    if (!sku) return null;
    const normalized = sku.trim().toUpperCase();
    return this.catalog.find((item) => item.sku.toUpperCase() === normalized) || null;
  }

  /**
   * Alias for backward compatibility with ID-based lookup.
   */
  getProductById(id) {
    return this.getProductBySku(id);
  }

  /**
   * Calculates required units using mandatory interview formula:
   * Math.ceil(requiredCapacity / max_capacity_per_unit)
   *
   * @param {string} sku
   * @param {number} requiredCapacity
   * @returns {{ units: number, capacityPerUnit: number, requiredCapacity: number }}
   */
  calculateUnits(sku, requiredCapacity) {
    const product = this.getProductBySku(sku);
    if (!product) {
      throw new Error(`Product with SKU "${sku}" not found in catalog.`);
    }

    const reqCap = Math.max(1, Number(requiredCapacity) || 1);
    const maxCapacityPerUnit = product.capacity;
    const units = Math.ceil(reqCap / maxCapacityPerUnit);

    return {
      units,
      capacityPerUnit: maxCapacityPerUnit,
      requiredCapacity: reqCap,
    };
  }

  /**
   * Matches products based on keywords, SKU, or name.
   * @param {string} query
   */
  matchProducts(query) {
    if (!query) return this.catalog;
    const lower = query.toLowerCase();
    return this.catalog.filter(
      (item) =>
        item.sku.toLowerCase().includes(lower) ||
        item.name.toLowerCase().includes(lower) ||
        item.description.toLowerCase().includes(lower)
    );
  }
}

export const catalogService = new CatalogService();
